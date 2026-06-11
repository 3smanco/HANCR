import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  DriverEntity,
  DriverStatus,
  OrderEntity,
  OrderStatus,
  RiderEntity,
  SavedPlaceEntity,
} from '@hancr/database';
import {
  AdminCreateDriverInput,
  AdminCreateRiderInput,
  AdminDriverType,
  AdminRiderDetailType,
  AdminRiderType,
  AdminUpdateDriverInput,
  AdminUpdateRiderInput,
  DriverListResult,
  RiderListResult,
  RiderRecentOrderType,
  RiderSavedPlaceType,
} from './dto/user.types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(SavedPlaceEntity)
    private readonly savedPlaceRepo: Repository<SavedPlaceEntity>,
  ) {}

  /**
   * N3 — Rider detail bundle for the /users/riders/[id] page.
   * One round-trip returns the rider + 20 most recent orders + lifetime
   * spend + completion/cancel counts + saved places.
   * Loyalty is fetched separately via adminRiderLoyalty (loyalty module).
   */
  async getRiderDetail(id: number): Promise<AdminRiderDetailType> {
    const rider = await this.riderRepo.findOne({ where: { id } });
    if (!rider) throw new NotFoundException(`Rider #${id} not found`);

    const [recentRaw, completed, cancelled, spendAgg, places] =
      await Promise.all([
        this.orderRepo.find({
          where: { riderId: id },
          relations: ['service', 'driver'],
          order: { createdOn: 'DESC' },
          take: 20,
        }),
        this.orderRepo.count({
          where: { riderId: id, status: OrderStatus.Finished },
        }),
        this.orderRepo.count({
          where: {
            riderId: id,
            status: In([
              OrderStatus.RiderCanceled,
              OrderStatus.DriverCanceled,
              OrderStatus.Expired,
            ]),
          },
        }),
        this.orderRepo
          .createQueryBuilder('o')
          .select('COALESCE(SUM(o.cost_after_coupon), 0)', 'total')
          .where('o.rider_id = :id', { id })
          .andWhere('o.status = :status', { status: OrderStatus.Finished })
          .getRawOne<{ total: string }>(),
        this.savedPlaceRepo.find({
          where: { riderId: id },
          order: { id: 'ASC' },
          take: 10,
        }),
      ]);

    const recentOrders: RiderRecentOrderType[] = recentRaw.map((o) => {
      const svc = (o as OrderEntity & { service?: { name?: string } }).service;
      const drv = (o as OrderEntity & {
        driver?: { firstName?: string; lastName?: string };
      }).driver;
      return {
        id: o.id,
        status: o.status,
        costAfterCoupon: Number(o.costAfterCoupon),
        currency: o.currency,
        serviceName: svc?.name,
        driverId: o.driverId,
        driverName: drv
          ? [drv.firstName, drv.lastName].filter(Boolean).join(' ') || undefined
          : undefined,
        createdOn: o.createdOn,
      };
    });

    const savedPlaces: RiderSavedPlaceType[] = places.map((p) => ({
      id: p.id,
      label: p.label,
      address: p.address ?? '',
      lat: p.lat,
      lng: p.lng,
    }));

    return {
      rider: this.toRiderType(rider),
      recentOrders,
      ordersCompleted: completed,
      ordersCancelled: cancelled,
      totalSpent: Number(spendAgg?.total ?? 0),
      savedPlaces,
    };
  }

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

  /** A1 — إنشاء راكب يدوياً من اللوحة (نفس منطق التسجيل الذاتي). */
  async createRider(input: AdminCreateRiderInput): Promise<AdminRiderType> {
    const phone = input.phoneNumber.trim();
    const exists = await this.riderRepo.findOne({
      where: { phoneNumber: phone },
      select: ['id'],
    });
    if (exists) {
      throw new ConflictException(`رقم ${phone} مسجَّل بالفعل`);
    }
    const countryCode = input.countryCode ?? extractCountryCode(phone);
    const rider = this.riderRepo.create({
      phoneNumber: phone,
      countryCode,
      firstName: input.firstName?.trim(),
      lastName: input.lastName?.trim(),
      email: input.email?.trim(),
      active: true,
      banned: false,
      balance: 0,
      currency: defaultCurrency(countryCode),
      rating: 5.0,
      totalRides: 0,
      referralCode: await this.generateReferralCode(),
      referralRewarded: false,
    });
    const saved = await this.riderRepo.save(rider);
    return this.toRiderType(saved);
  }

  /** A6 — تعديل بيانات راكب. */
  async updateRider(input: AdminUpdateRiderInput): Promise<AdminRiderType> {
    const rider = await this.riderRepo.findOne({ where: { id: input.id } });
    if (!rider) throw new NotFoundException(`Rider #${input.id} not found`);
    if (input.phoneNumber && input.phoneNumber.trim() !== rider.phoneNumber) {
      const dup = await this.riderRepo.findOne({
        where: { phoneNumber: input.phoneNumber.trim() },
        select: ['id'],
      });
      if (dup) throw new ConflictException('رقم الهاتف مستخدَم لراكب آخر');
      rider.phoneNumber = input.phoneNumber.trim();
    }
    if (input.firstName !== undefined) rider.firstName = input.firstName.trim();
    if (input.lastName !== undefined) rider.lastName = input.lastName.trim();
    if (input.email !== undefined) rider.email = input.email.trim();
    return this.toRiderType(await this.riderRepo.save(rider));
  }

  private async generateReferralCode(): Promise<string> {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 8; attempt++) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      const exists = await this.riderRepo.findOne({
        where: { referralCode: code },
        select: ['id'],
      });
      if (!exists) return code;
    }
    return `R${Date.now().toString(36).toUpperCase().slice(-7)}`;
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

  /** A2 — إنشاء سائق يدوياً (يتجاوز معالج الطلب) — لأسطول/اختبار. */
  async createDriver(input: AdminCreateDriverInput): Promise<AdminDriverType> {
    const phone = input.phoneNumber.trim();
    const exists = await this.driverRepo.findOne({
      where: { phoneNumber: phone },
      select: ['id'],
    });
    if (exists) {
      throw new ConflictException(`رقم ${phone} مسجَّل لسائق بالفعل`);
    }
    const countryCode = input.countryCode ?? extractCountryCode(phone);
    const approved = input.approveImmediately ?? false;
    const driver = this.driverRepo.create({
      phoneNumber: phone,
      countryCode,
      firstName: input.firstName.trim(),
      lastName: input.lastName?.trim() ?? '',
      active: approved,
      banned: false,
      balance: 0,
      currency: defaultCurrency(countryCode),
      rating: 5.0,
      ratingCount: 0,
      serviceIds: input.serviceIds ?? [],
      regionId: input.regionId,
      carBrand: input.carBrand?.trim(),
      carModel: input.carModel?.trim(),
      carColor: input.carColor?.trim(),
      plateNumber: input.plateNumber?.trim(),
      carYear: input.carYear,
      status: DriverStatus.Offline,
      approvalStatus: approved ? 'approved' : 'pending_docs',
    });
    const saved = await this.driverRepo.save(driver);
    return this.toDriverType(saved);
  }

  /** A6 — تعديل بيانات سائق (الاسم/الهاتف/السيارة/المنطقة). */
  async updateDriver(input: AdminUpdateDriverInput): Promise<AdminDriverType> {
    const driver = await this.driverRepo.findOne({ where: { id: input.id } });
    if (!driver) throw new NotFoundException(`Driver #${input.id} not found`);
    if (input.phoneNumber && input.phoneNumber.trim() !== driver.phoneNumber) {
      const dup = await this.driverRepo.findOne({
        where: { phoneNumber: input.phoneNumber.trim() },
        select: ['id'],
      });
      if (dup) throw new ConflictException('رقم الهاتف مستخدَم لسائق آخر');
      driver.phoneNumber = input.phoneNumber.trim();
    }
    if (input.firstName !== undefined) driver.firstName = input.firstName.trim();
    if (input.lastName !== undefined) driver.lastName = input.lastName.trim();
    if (input.carBrand !== undefined) driver.carBrand = input.carBrand.trim();
    if (input.carModel !== undefined) driver.carModel = input.carModel.trim();
    if (input.carColor !== undefined) driver.carColor = input.carColor.trim();
    if (input.plateNumber !== undefined) {
      driver.plateNumber = input.plateNumber.trim();
    }
    if (input.carYear !== undefined) driver.carYear = input.carYear;
    if (input.regionId !== undefined) driver.regionId = input.regionId;
    return this.toDriverType(await this.driverRepo.save(driver));
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
    t.approvalStatus = e.approvalStatus ?? 'pending_docs';
    t.rejectionReason = e.rejectionReason;
    return t;
  }
}

// ─── Helpers (مطابقة لمنطق rider/driver auth.service) ─────────────────────────

function extractCountryCode(phone: string): string {
  if (phone.startsWith('+974')) return '+974';
  if (phone.startsWith('+971')) return '+971';
  if (phone.startsWith('+966')) return '+966';
  if (phone.startsWith('+965')) return '+965';
  if (phone.startsWith('+973')) return '+973';
  if (phone.startsWith('+968')) return '+968';
  return phone.substring(0, 4);
}

function defaultCurrency(countryCode: string): string {
  const map: Record<string, string> = {
    '+974': 'QAR',
    '+971': 'AED',
    '+966': 'SAR',
    '+965': 'KWD',
    '+973': 'BHD',
    '+968': 'OMR',
  };
  return map[countryCode] ?? 'SAR';
}
