import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CompanyEmployeeEntity,
  CompanyEntity,
  OrderEntity,
  RiderEntity,
  WalletOwnerType,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@hancr/database';
import { WalletService } from '@hancr/wallet';
import {
  AddEmployeeInput,
  AdminCompanyEmployeeType,
  AdminCompanyType,
  CreateCompanyInput,
  TopUpCompanyInput,
  UpdateCompanyInput,
} from './dto/company.types';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepo: Repository<CompanyEntity>,
    @InjectRepository(CompanyEmployeeEntity)
    private readonly empRepo: Repository<CompanyEmployeeEntity>,
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    private readonly walletService: WalletService,
  ) {}

  async findAll(): Promise<AdminCompanyType[]> {
    const companies = await this.companyRepo.find({
      order: { id: 'DESC' },
    });
    const counts = await this.empRepo
      .createQueryBuilder('e')
      .select('e.company_id', 'companyId')
      .addSelect('COUNT(*)', 'cnt')
      .where("e.status = 'active'")
      .groupBy('e.company_id')
      .getRawMany<{ companyId: number; cnt: string }>();
    const countMap = new Map(counts.map((c) => [Number(c.companyId), Number(c.cnt)]));
    return companies.map((c) => this.toType(c, countMap.get(c.id) ?? 0));
  }

  async create(input: CreateCompanyInput): Promise<AdminCompanyType> {
    const saved = await this.companyRepo.save(
      this.companyRepo.create({
        ...input,
        currency: input.currency.toUpperCase(),
        balance: 0,
        status: 'active',
      }),
    );
    return this.toType(saved, 0);
  }

  async update(
    id: number,
    input: UpdateCompanyInput,
  ): Promise<AdminCompanyType> {
    const row = await this.companyRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Company not found');
    Object.assign(row, input);
    const saved = await this.companyRepo.save(row);
    const cnt = await this.empRepo.count({
      where: { companyId: id, status: 'active' },
    });
    return this.toType(saved, cnt);
  }

  async remove(id: number): Promise<boolean> {
    await this.empRepo.delete({ companyId: id });
    const r = await this.companyRepo.delete(id);
    return (r.affected ?? 0) > 0;
  }

  /** شحن رصيد الشركة عبر WalletService.credit. */
  async topUp(input: TopUpCompanyInput): Promise<AdminCompanyType> {
    const row = await this.companyRepo.findOne({ where: { id: input.companyId } });
    if (!row) throw new NotFoundException('Company not found');
    await this.walletService.credit({
      ownerType: WalletOwnerType.Company,
      ownerId: row.id,
      type: WalletTransactionType.AdminAdjustment,
      amount: input.amount,
      currency: row.currency,
      status: WalletTransactionStatus.Completed,
      description: `Admin top-up: ${input.amount} ${row.currency}`,
    });
    const reloaded = await this.companyRepo.findOne({ where: { id: row.id } });
    const cnt = await this.empRepo.count({
      where: { companyId: row.id, status: 'active' },
    });
    return this.toType(reloaded!, cnt);
  }

  async addEmployee(
    input: AddEmployeeInput,
  ): Promise<AdminCompanyEmployeeType> {
    const company = await this.companyRepo.findOne({
      where: { id: input.companyId },
    });
    if (!company) throw new NotFoundException('Company not found');

    let rider: RiderEntity | null = null;
    if (input.riderId) {
      rider = await this.riderRepo.findOne({ where: { id: input.riderId } });
    } else if (input.riderPhone) {
      rider = await this.riderRepo.findOne({
        where: { phoneNumber: input.riderPhone },
      });
    }
    if (!rider) throw new NotFoundException('Rider not found');

    const existing = await this.empRepo.findOne({
      where: { companyId: company.id, riderId: rider.id },
    });
    if (existing) {
      if (existing.status === 'active') {
        throw new BadRequestException('Rider already linked to this company');
      }
      existing.status = 'active';
      const saved = await this.empRepo.save(existing);
      return this.empToType(saved, rider);
    }

    const period = this.currentPeriod();
    const saved = await this.empRepo.save(
      this.empRepo.create({
        companyId: company.id,
        riderId: rider.id,
        monthlySpent: 0,
        monthlyPeriod: period,
        status: 'active',
      }),
    );
    return this.empToType(saved, rider);
  }

  async revokeEmployee(employeeId: number): Promise<boolean> {
    const r = await this.empRepo.update(
      { id: employeeId },
      { status: 'revoked' },
    );
    return (r.affected ?? 0) > 0;
  }

  async listEmployees(
    companyId: number,
  ): Promise<AdminCompanyEmployeeType[]> {
    const emps = await this.empRepo.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
    if (emps.length === 0) return [];
    const riderIds = emps.map((e) => e.riderId);
    const riders = await this.riderRepo.findByIds(riderIds);
    const map = new Map(riders.map((r) => [r.id, r]));
    return emps.map((e) => this.empToType(e, map.get(e.riderId)));
  }

  /** CSV (string) — كل الطلبات المدفوعة من الشركة في فترة معيّنة. */
  async ordersCsv(
    companyId: number,
    fromIso?: string,
    toIso?: string,
  ): Promise<string> {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .where('o.company_id = :cid', { cid: companyId });
    if (fromIso) qb.andWhere('o.created_on >= :from', { from: fromIso });
    if (toIso) qb.andWhere('o.created_on <= :to', { to: toIso });
    const orders = await qb.orderBy('o.created_on', 'DESC').getMany();

    const lines = [
      'order_id,rider_id,created_at,distance_km,duration_min,cost,currency,status',
    ];
    for (const o of orders) {
      lines.push(
        [
          o.id,
          o.riderId,
          o.createdOn.toISOString(),
          (o.distanceBest / 1000).toFixed(2),
          (o.durationBest / 60).toFixed(1),
          Number(o.costAfterCoupon).toFixed(2),
          o.currency,
          o.status,
        ].join(','),
      );
    }
    return lines.join('\n');
  }

  private currentPeriod(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private toType(c: CompanyEntity, employeeCount: number): AdminCompanyType {
    return {
      id: c.id,
      name: c.name,
      contactEmail: c.contactEmail,
      contactPhone: c.contactPhone,
      balance: Number(c.balance),
      currency: c.currency,
      monthlyCapPerEmployee: Number(c.monthlyCapPerEmployee),
      status: c.status,
      createdAt: c.createdAt,
      employeeCount,
    };
  }

  private empToType(
    e: CompanyEmployeeEntity,
    rider?: RiderEntity,
  ): AdminCompanyEmployeeType {
    return {
      id: e.id,
      companyId: e.companyId,
      riderId: e.riderId,
      riderName: rider
        ? [rider.firstName, rider.lastName].filter(Boolean).join(' ') ||
          undefined
        : undefined,
      riderPhone: rider?.phoneNumber,
      monthlySpent: Number(e.monthlySpent),
      monthlyPeriod: e.monthlyPeriod,
      status: e.status,
      createdAt: e.createdAt,
    };
  }
}
