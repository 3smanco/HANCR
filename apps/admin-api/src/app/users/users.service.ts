import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiderEntity, DriverEntity } from '@hancr/database';
import {
  AdminRiderType,
  AdminDriverType,
  RiderListResult,
  DriverListResult,
} from './dto/user.types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
  ) {}

  // ─── Riders ────────────────────────────────────────────────────────────────

  async listRiders(page = 1, limit = 20): Promise<RiderListResult> {
    const [items, total] = await this.riderRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { items: items.map((r) => this.toRiderType(r)), total, page, limit };
  }

  async getRider(id: number): Promise<AdminRiderType> {
    const rider = await this.riderRepo.findOne({ where: { id } });
    if (!rider) throw new NotFoundException(`Rider #${id} not found`);
    return this.toRiderType(rider);
  }

  async banRider(id: number, reason?: string): Promise<AdminRiderType> {
    const rider = await this.riderRepo.findOne({ where: { id } });
    if (!rider) throw new NotFoundException(`Rider #${id} not found`);
    rider.banned = true;
    if (reason) rider.banReason = reason;
    rider.active = false;
    const saved = await this.riderRepo.save(rider);
    return this.toRiderType(saved);
  }

  async unbanRider(id: number): Promise<AdminRiderType> {
    const rider = await this.riderRepo.findOne({ where: { id } });
    if (!rider) throw new NotFoundException(`Rider #${id} not found`);
    rider.banned = false;
    rider.banReason = undefined;
    rider.active = true;
    const saved = await this.riderRepo.save(rider);
    return this.toRiderType(saved);
  }

  // ─── Drivers ───────────────────────────────────────────────────────────────

  async listDrivers(
    page = 1,
    limit = 20,
    pendingOnly = false,
  ): Promise<DriverListResult> {
    const qb = this.driverRepo
      .createQueryBuilder('d')
      .orderBy('d.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (pendingOnly) {
      qb.where('d.active = false AND d.banned = false');
    }

    const [items, total] = await qb.getManyAndCount();
    return { items: items.map((d) => this.toDriverType(d)), total, page, limit };
  }

  async getDriver(id: number): Promise<AdminDriverType> {
    const driver = await this.driverRepo.findOne({ where: { id } });
    if (!driver) throw new NotFoundException(`Driver #${id} not found`);
    return this.toDriverType(driver);
  }

  async approveDriver(id: number): Promise<AdminDriverType> {
    const driver = await this.driverRepo.findOne({ where: { id } });
    if (!driver) throw new NotFoundException(`Driver #${id} not found`);
    driver.active = true;
    driver.banned = false;
    const saved = await this.driverRepo.save(driver);
    return this.toDriverType(saved);
  }

  async banDriver(id: number): Promise<AdminDriverType> {
    const driver = await this.driverRepo.findOne({ where: { id } });
    if (!driver) throw new NotFoundException(`Driver #${id} not found`);
    driver.banned = true;
    driver.active = false;
    const saved = await this.driverRepo.save(driver);
    return this.toDriverType(saved);
  }

  async unbanDriver(id: number): Promise<AdminDriverType> {
    const driver = await this.driverRepo.findOne({ where: { id } });
    if (!driver) throw new NotFoundException(`Driver #${id} not found`);
    driver.banned = false;
    driver.active = true;
    const saved = await this.driverRepo.save(driver);
    return this.toDriverType(saved);
  }

  /** H3 — set school/night approvals (either or both) */
  async setApprovals(
    id: number,
    input: { kidsApproved?: boolean; nightApproved?: boolean },
  ): Promise<AdminDriverType> {
    const driver = await this.driverRepo.findOne({ where: { id } });
    if (!driver) throw new NotFoundException(`Driver #${id} not found`);
    if (input.kidsApproved !== undefined) {
      driver.kidsApproved = input.kidsApproved;
    }
    if (input.nightApproved !== undefined) {
      driver.nightApproved = input.nightApproved;
    }
    const saved = await this.driverRepo.save(driver);
    return this.toDriverType(saved);
  }

  // ─── Mappers ───────────────────────────────────────────────────────────────

  private toRiderType(e: RiderEntity): AdminRiderType {
    const t = new AdminRiderType();
    t.id = e.id;
    t.phoneNumber = e.phoneNumber;
    t.countryCode = e.countryCode;
    t.firstName = e.firstName;
    t.lastName = e.lastName;
    t.email = e.email;
    t.avatarUrl = e.avatarUrl;
    t.active = e.active;
    t.banned = e.banned;
    t.banReason = e.banReason;
    t.balance = Number(e.balance);
    t.currency = e.currency;
    t.rating = Number(e.rating);
    t.totalRides = e.totalRides;
    t.lastLoginAt = e.lastLoginAt;
    t.createdAt = e.createdAt;
    t.updatedAt = e.updatedAt;
    return t;
  }

  private toDriverType(e: DriverEntity): AdminDriverType {
    const t = new AdminDriverType();
    t.id = e.id;
    t.phoneNumber = e.phoneNumber;
    t.countryCode = e.countryCode;
    t.firstName = e.firstName;
    t.lastName = e.lastName;
    t.avatarUrl = e.avatarUrl;
    t.status = e.status;
    t.active = e.active;
    t.banned = e.banned;
    // Note: DriverEntity has no banReason field
    t.rating = Number(e.rating);
    t.ratingCount = e.ratingCount;
    t.carBrand = e.carBrand;
    t.carModel = e.carModel;
    t.carColor = e.carColor;
    t.plateNumber = e.plateNumber;
    t.carYear = e.carYear;
    t.balance = Number(e.balance);
    t.currency = e.currency;
    t.regionId = e.regionId;
    t.createdAt = e.createdAt;
    t.updatedAt = e.updatedAt;
    t.gender = e.gender;
    t.kidsApproved = e.kidsApproved ?? false;
    t.nightApproved = e.nightApproved ?? false;
    return t;
  }
}
