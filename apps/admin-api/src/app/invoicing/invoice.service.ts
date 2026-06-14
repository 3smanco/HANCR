import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CountryEntity,
  CountryTaxRule,
  OrderEntity,
  RegionEntity,
} from '@hancr/database';
import { InvoiceType } from './dto/invoice.types';

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface InvoiceInput {
  orderId: number;
  currency: string;
  countryIso: string;
  countryName: string;
  fare: number;
  discount: number;
  total: number; // المبلغ المُحاسَب (شامل الضريبة)
  taxRule?: CountryTaxRule | null;
  issuedAt?: Date;
}

/**
 * حساب فاتورة مُوطَّنة (دالة نقيّة قابلة للاختبار). الضريبة شاملة في الإجمالي،
 * تُستخرَج: tax = total − total/(1+rate/100).
 */
export function computeInvoice(input: InvoiceInput): InvoiceType {
  const lines = [{ label: 'الأجرة', amount: round2(input.fare) }];
  if (input.discount > 0) {
    lines.push({ label: 'خصم', amount: -round2(input.discount) });
  }
  const total = round2(input.total);
  const rule = input.taxRule;
  const rate = rule && rule.type !== 'NONE' ? Number(rule.rate) : 0;
  const taxAmount = rate > 0 ? round2(total - total / (1 + rate / 100)) : 0;
  const net = round2(total - taxAmount);

  return {
    orderId: input.orderId,
    currency: input.currency,
    countryIso: input.countryIso,
    countryName: input.countryName,
    lines,
    net,
    taxType: rule?.type ?? 'NONE',
    taxRate: rate,
    taxAmount,
    total,
    taxLabel: rule?.label,
    issuedAt: input.issuedAt,
  };
}

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(RegionEntity)
    private readonly regionRepo: Repository<RegionEntity>,
    @InjectRepository(CountryEntity)
    private readonly countryRepo: Repository<CountryEntity>,
  ) {}

  async buildInvoice(
    orderId: number,
    allowedRegionIds: number[] | null,
  ): Promise<InvoiceType> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (allowedRegionIds && !allowedRegionIds.includes(order.regionId)) {
      throw new ForbiddenException('هذا الطلب خارج نطاقك');
    }
    const region = await this.regionRepo.findOne({
      where: { id: order.regionId },
    });
    const country = region?.countryId
      ? await this.countryRepo.findOne({ where: { id: region.countryId } })
      : null;

    const fare = Number(order.costBest);
    const charged = Number(order.costAfterCoupon) || fare;
    return computeInvoice({
      orderId,
      currency: order.currency,
      countryIso: country?.iso2 ?? '',
      countryName: country?.nameEn ?? '',
      fare,
      discount: Math.max(0, round2(fare - charged)),
      total: charged,
      taxRule: country?.taxRule,
      issuedAt: order.createdOn,
    });
  }
}
