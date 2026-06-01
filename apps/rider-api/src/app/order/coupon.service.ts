import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponEntity, CouponType, OrderEntity } from '@hancr/database';

export interface CouponApplication {
  coupon: CouponEntity;
  discountAmount: number;
  costAfterCoupon: number;
}

/**
 * منطق التحقق من الكوبونات وتطبيقها.
 * يُستخدم في معاينة الراكب (validateCoupon) وداخل createOrder.
 */
@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);

  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepo: Repository<CouponEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
  ) {}

  /**
   * يتحقق من صلاحية الكوبون ويحسب الخصم — يرمي خطأً واضحاً عند الرفض.
   */
  async validate(
    code: string,
    fare: number,
    regionId: number,
    riderId: number,
  ): Promise<CouponApplication> {
    const normalized = code.trim().toUpperCase();
    const coupon = await this.couponRepo.findOne({
      where: { code: normalized },
    });

    if (!coupon || !coupon.active) {
      throw new BadRequestException('كود الخصم غير صالح');
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('انتهت صلاحية كود الخصم');
    }
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('تم استنفاد كود الخصم');
    }
    if (
      coupon.regionIds &&
      coupon.regionIds.length > 0 &&
      !coupon.regionIds.includes(regionId)
    ) {
      throw new BadRequestException('كود الخصم غير متاح في منطقتك');
    }
    if (Number(coupon.minFare) > 0 && fare < Number(coupon.minFare)) {
      throw new BadRequestException(
        `الحد الأدنى للأجرة لاستخدام هذا الكود هو ${coupon.minFare}`,
      );
    }
    if (coupon.perUserLimit > 0) {
      const usedByRider = await this.orderRepo.count({
        where: { riderId, couponId: coupon.id },
      });
      if (usedByRider >= coupon.perUserLimit) {
        throw new BadRequestException('لقد استخدمت هذا الكود من قبل');
      }
    }

    // حساب الخصم
    let discount =
      coupon.type === CouponType.Percent
        ? (fare * Number(coupon.value)) / 100
        : Number(coupon.value);

    if (
      coupon.type === CouponType.Percent &&
      Number(coupon.maxDiscount) > 0 &&
      discount > Number(coupon.maxDiscount)
    ) {
      discount = Number(coupon.maxDiscount);
    }
    // لا يتجاوز الخصم الأجرة
    if (discount > fare) discount = fare;
    discount = Math.round(discount * 100) / 100;

    return {
      coupon,
      discountAmount: discount,
      costAfterCoupon: Math.round((fare - discount) * 100) / 100,
    };
  }

  /**
   * يزيد عدّاد الاستخدام بعد إنشاء الطلب بنجاح.
   */
  async incrementUsage(couponId: number): Promise<void> {
    await this.couponRepo.increment({ id: couponId }, 'usedCount', 1);
  }
}
