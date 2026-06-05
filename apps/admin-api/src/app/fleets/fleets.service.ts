import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DriverEntity,
  FleetEntity,
  WalletOwnerType,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@hancr/database';
import { WalletService } from '@hancr/wallet';
import {
  AdminFleetType,
  AssignDriverToFleetInput,
  CreateFleetInput,
  FleetDriverType,
  TopUpFleetInput,
  UpdateFleetInput,
} from './dto/fleet.types';

@Injectable()
export class FleetsService {
  constructor(
    @InjectRepository(FleetEntity)
    private readonly fleetRepo: Repository<FleetEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    private readonly walletService: WalletService,
  ) {}

  async list(): Promise<AdminFleetType[]> {
    const fleets = await this.fleetRepo.find({ order: { id: 'DESC' } });
    if (fleets.length === 0) return [];

    const counts = await this.driverRepo
      .createQueryBuilder('d')
      .select('d.fleetId', 'fleetId')
      .addSelect('COUNT(*)', 'cnt')
      .where('d.fleetId IS NOT NULL')
      .groupBy('d.fleetId')
      .getRawMany<{ fleetId: number; cnt: string }>();
    const countMap = new Map(
      counts.map((c) => [Number(c.fleetId), Number(c.cnt)]),
    );

    return fleets.map((f) => this.toType(f, countMap.get(f.id) ?? 0));
  }

  async create(input: CreateFleetInput): Promise<AdminFleetType> {
    const saved = await this.fleetRepo.save(
      this.fleetRepo.create({
        ...input,
        currency: input.currency.toUpperCase(),
        balance: 0,
        active: true,
      }),
    );
    return this.toType(saved, 0);
  }

  async update(input: UpdateFleetInput): Promise<AdminFleetType> {
    const row = await this.fleetRepo.findOne({ where: { id: input.id } });
    if (!row) throw new NotFoundException('Fleet not found');
    Object.assign(row, input);
    const saved = await this.fleetRepo.save(row);
    const cnt = await this.driverRepo.count({ where: { fleetId: input.id } });
    return this.toType(saved, cnt);
  }

  async topUp(input: TopUpFleetInput): Promise<AdminFleetType> {
    const row = await this.fleetRepo.findOne({ where: { id: input.fleetId } });
    if (!row) throw new NotFoundException('Fleet not found');
    await this.walletService.credit({
      ownerType: WalletOwnerType.Fleet,
      ownerId: row.id,
      type: WalletTransactionType.AdminAdjustment,
      amount: input.amount,
      currency: row.currency,
      status: WalletTransactionStatus.Completed,
      description: `Admin top-up: ${input.amount} ${row.currency}`,
    });
    const reloaded = await this.fleetRepo.findOne({ where: { id: row.id } });
    const cnt = await this.driverRepo.count({ where: { fleetId: row.id } });
    return this.toType(reloaded!, cnt);
  }

  async remove(id: number): Promise<boolean> {
    const cnt = await this.driverRepo.count({ where: { fleetId: id } });
    if (cnt > 0) {
      throw new BadRequestException(
        `Cannot delete: ${cnt} drivers are linked to this fleet. Reassign them first.`,
      );
    }
    const r = await this.fleetRepo.delete(id);
    return (r.affected ?? 0) > 0;
  }

  async listDrivers(fleetId: number): Promise<FleetDriverType[]> {
    const drivers = await this.driverRepo.find({
      where: { fleetId },
      order: { id: 'DESC' },
    });
    return drivers.map((d) => ({
      driverId: d.id,
      driverName:
        [d.firstName, d.lastName].filter(Boolean).join(' ') ||
        `Driver #${d.id}`,
      phoneNumber: d.phoneNumber,
      plateNumber: d.plateNumber,
      approvalStatus: d.approvalStatus ?? 'pending_docs',
    }));
  }

  async assignDriver(
    input: AssignDriverToFleetInput,
  ): Promise<FleetDriverType> {
    const fleet = await this.fleetRepo.findOne({
      where: { id: input.fleetId },
    });
    if (!fleet) throw new NotFoundException('Fleet not found');
    const driver = await this.driverRepo.findOne({
      where: { id: input.driverId },
    });
    if (!driver) throw new NotFoundException('Driver not found');

    driver.fleetId = fleet.id;
    await this.driverRepo.save(driver);
    return {
      driverId: driver.id,
      driverName:
        [driver.firstName, driver.lastName].filter(Boolean).join(' ') ||
        `Driver #${driver.id}`,
      phoneNumber: driver.phoneNumber,
      plateNumber: driver.plateNumber,
      approvalStatus: driver.approvalStatus ?? 'pending_docs',
    };
  }

  async unassignDriver(driverId: number): Promise<boolean> {
    const r = await this.driverRepo.update(
      { id: driverId },
      { fleetId: undefined },
    );
    return (r.affected ?? 0) > 0;
  }

  private toType(f: FleetEntity, driverCount: number): AdminFleetType {
    return {
      id: f.id,
      name: f.name,
      ownerName: f.ownerName,
      contactPhone: f.contactPhone,
      contactEmail: f.contactEmail,
      balance: Number(f.balance),
      currency: f.currency,
      commissionPercent: Number(f.commissionPercent),
      exclusivityRegionIds: f.exclusivityRegionIds ?? [],
      active: f.active,
      driverCount,
      createdAt: f.createdAt,
    };
  }
}
