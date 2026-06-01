import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponEntity } from '@hancr/database';
import {
  AdminCouponType,
  CreateCouponInput,
  UpdateCouponInput,
} from './dto/coupon.types';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepo: Repository<CouponEntity>,
  ) {}

  async findAll(): Promise<AdminCouponType[]> {
    const coupons = await this.couponRepo.find({ order: { id: 'DESC' } });
    return coupons.map((c) => this.toType(c));
  }

  async create(input: CreateCouponInput): Promise<AdminCouponType> {
    const code = input.code.trim().toUpperCase();
    const existing = await this.couponRepo.findOne({ where: { code } });
    if (existing) {
      throw new BadRequestException('كود الخصم موجود مسبقاً');
    }
    const coupon = this.couponRepo.create({
      code,
      type: input.type,
      value: input.value,
      maxDiscount: input.maxDiscount ?? 0,
      minFare: input.minFare ?? 0,
      maxUses: input.maxUses ?? 0,
      perUserLimit: input.perUserLimit ?? 1,
      regionIds: input.regionIds ?? [],
      expiresAt: input.expiresAt,
      active: true,
    });
    return this.toType(await this.couponRepo.save(coupon));
  }

  async update(id: number, input: UpdateCouponInput): Promise<AdminCouponType> {
    const coupon = await this.couponRepo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon #${id} not found`);

    if (input.value !== undefined) coupon.value = input.value;
    if (input.type !== undefined) coupon.type = input.type;
    if (input.maxDiscount !== undefined) coupon.maxDiscount = input.maxDiscount;
    if (input.minFare !== undefined) coupon.minFare = input.minFare;
    if (input.maxUses !== undefined) coupon.maxUses = input.maxUses;
    if (input.perUserLimit !== undefined)
      coupon.perUserLimit = input.perUserLimit;
    if (input.regionIds !== undefined) coupon.regionIds = input.regionIds;
    if (input.expiresAt !== undefined) coupon.expiresAt = input.expiresAt;
    if (input.active !== undefined) coupon.active = input.active;

    return this.toType(await this.couponRepo.save(coupon));
  }

  async toggleActive(id: number): Promise<AdminCouponType> {
    const coupon = await this.couponRepo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon #${id} not found`);
    coupon.active = !coupon.active;
    return this.toType(await this.couponRepo.save(coupon));
  }

  async remove(id: number): Promise<boolean> {
    const res = await this.couponRepo.delete(id);
    return (res.affected ?? 0) > 0;
  }

  private toType(c: CouponEntity): AdminCouponType {
    return {
      id: c.id,
      code: c.code,
      type: c.type,
      value: Number(c.value),
      maxDiscount: Number(c.maxDiscount),
      minFare: Number(c.minFare),
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      perUserLimit: c.perUserLimit,
      regionIds: c.regionIds ?? [],
      expiresAt: c.expiresAt,
      active: c.active,
      createdAt: c.createdAt,
    };
  }
}
