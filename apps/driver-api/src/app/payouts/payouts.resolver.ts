import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
} from '@nestjs/graphql';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DriverEntity,
  PayoutEntryEntity,
  PayoutMethodEntity,
} from '@hancr/database';
import {
  AddPayoutMethodInput,
  DriverEarningsSummaryType,
  PayoutMethodType,
} from './dto/payout-method.types';
import { JwtAuthGuard, CurrentDriver } from '../auth/jwt-auth.guard';
import { AuthDriver } from '../auth/jwt.strategy';

@Injectable()
export class PayoutsService {
  constructor(
    @InjectRepository(PayoutMethodEntity)
    private readonly methodRepo: Repository<PayoutMethodEntity>,
    @InjectRepository(PayoutEntryEntity)
    private readonly entryRepo: Repository<PayoutEntryEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
  ) {}

  async list(driverId: number): Promise<PayoutMethodType[]> {
    const rows = await this.methodRepo.find({
      where: { driverId },
      order: { isDefault: 'DESC', id: 'DESC' },
    });
    return rows.map((r) => this.toType(r));
  }

  async add(
    driverId: number,
    input: AddPayoutMethodInput,
  ): Promise<PayoutMethodType> {
    if (input.type === 'stcpay' && !input.phoneNumber) {
      throw new BadRequestException('STC Pay requires phoneNumber');
    }
    if ((input.type === 'bank' || input.type === 'mada') && !input.iban) {
      throw new BadRequestException('Bank/Mada requires IBAN');
    }

    const existingCount = await this.methodRepo.count({ where: { driverId } });
    const saved = await this.methodRepo.save(
      this.methodRepo.create({
        driverId,
        type: input.type,
        accountName: input.accountName,
        iban: input.iban?.toUpperCase().replace(/\s+/g, ''),
        bankName: input.bankName,
        phoneNumber: input.phoneNumber,
        isDefault: existingCount === 0, // first method is default
      }),
    );
    return this.toType(saved);
  }

  async setDefault(
    driverId: number,
    id: number,
  ): Promise<PayoutMethodType> {
    const method = await this.methodRepo.findOne({ where: { id, driverId } });
    if (!method) throw new NotFoundException('Payout method not found');
    await this.methodRepo.update({ driverId }, { isDefault: false });
    method.isDefault = true;
    const saved = await this.methodRepo.save(method);
    return this.toType(saved);
  }

  async remove(driverId: number, id: number): Promise<boolean> {
    const r = await this.methodRepo.delete({ id, driverId });
    return (r.affected ?? 0) > 0;
  }

  async earningsSummary(driverId: number): Promise<DriverEarningsSummaryType> {
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');

    // pending: amounts in payout entries that haven't been paid out yet
    const pendingAgg = await this.entryRepo
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .where('e.driver_id = :driverId', { driverId })
      .andWhere('e.status IN (:...statuses)', {
        statuses: ['pending', 'processing'],
      })
      .getRawOne<{ total: string }>();

    const completedAgg = await this.entryRepo
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .where('e.driver_id = :driverId', { driverId })
      .andWhere('e.status = :s', { s: 'completed' })
      .getRawOne<{ total: string }>();

    return {
      currency: driver.currency,
      availableBalance: Math.round(Number(driver.balance)),
      pendingPayoutAmount: Math.round(Number(pendingAgg?.total ?? 0)),
      totalEarnedAllTime:
        Math.round(Number(driver.balance)) +
        Math.round(Number(completedAgg?.total ?? 0)),
    };
  }

  private toType(m: PayoutMethodEntity): PayoutMethodType {
    return {
      id: m.id,
      type: m.type,
      accountName: m.accountName,
      iban: m.iban,
      bankName: m.bankName,
      phoneNumber: m.phoneNumber,
      isDefault: m.isDefault,
      createdAt: m.createdAt,
    };
  }
}

@Resolver(() => PayoutMethodType)
export class PayoutsResolver {
  constructor(private readonly service: PayoutsService) {}

  @Query(() => [PayoutMethodType], { description: 'طرق السحب المسجّلة للسائق' })
  @UseGuards(JwtAuthGuard)
  myPayoutMethods(
    @CurrentDriver() driver: AuthDriver,
  ): Promise<PayoutMethodType[]> {
    return this.service.list(driver.driverId);
  }

  @Query(() => DriverEarningsSummaryType, {
    description: 'ملخّص أرباح السائق (متاح / معلَّق / كلي)',
  })
  @UseGuards(JwtAuthGuard)
  myEarningsSummary(
    @CurrentDriver() driver: AuthDriver,
  ): Promise<DriverEarningsSummaryType> {
    return this.service.earningsSummary(driver.driverId);
  }

  @Mutation(() => PayoutMethodType, { description: 'إضافة طريقة سحب' })
  @UseGuards(JwtAuthGuard)
  addPayoutMethod(
    @CurrentDriver() driver: AuthDriver,
    @Args('input') input: AddPayoutMethodInput,
  ): Promise<PayoutMethodType> {
    return this.service.add(driver.driverId, input);
  }

  @Mutation(() => PayoutMethodType, { description: 'تعيين طريقة سحب افتراضية' })
  @UseGuards(JwtAuthGuard)
  setDefaultPayoutMethod(
    @CurrentDriver() driver: AuthDriver,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<PayoutMethodType> {
    return this.service.setDefault(driver.driverId, id);
  }

  @Mutation(() => Boolean, { description: 'حذف طريقة سحب' })
  @UseGuards(JwtAuthGuard)
  removePayoutMethod(
    @CurrentDriver() driver: AuthDriver,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.service.remove(driver.driverId, id);
  }
}
