import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DriverDocumentEntity,
  DriverEntity,
  OrderEntity,
  WalletTransactionEntity,
  WalletOwnerType,
} from '@hancr/database';
import {
  AdminDriverDetailType,
  AdminDriverDocumentType,
  AdminDriverOrderSummaryType,
  AdminDriverTransactionType,
  ReviewDocumentInput,
  SetDriverStatusInput,
} from './dto/driver-detail.types';

@Injectable()
export class DriverDetailService {
  constructor(
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    @InjectRepository(DriverDocumentEntity)
    private readonly docRepo: Repository<DriverDocumentEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(WalletTransactionEntity)
    private readonly txRepo: Repository<WalletTransactionEntity>,
  ) {}

  async getDetail(driverId: number): Promise<AdminDriverDetailType> {
    const d = await this.driverRepo.findOne({ where: { id: driverId } });
    if (!d) throw new NotFoundException(`Driver #${driverId} not found`);

    const [docs, orders, txs] = await Promise.all([
      this.docRepo.find({
        where: { driverId },
        order: { uploadedAt: 'DESC' },
      }),
      this.orderRepo.find({
        where: { driverId },
        order: { createdOn: 'DESC' },
        take: 50,
      }),
      this.txRepo.find({
        where: { ownerType: WalletOwnerType.Driver, ownerId: driverId },
        order: { createdAt: 'DESC' },
        take: 30,
      }),
    ]);

    return {
      id: d.id,
      firstName: d.firstName,
      lastName: d.lastName,
      phoneNumber: d.phoneNumber,
      avatarUrl: d.avatarUrl,
      status: d.status,
      active: d.active,
      banned: d.banned,
      rating: Number(d.rating),
      ratingCount: d.ratingCount,
      carBrand: d.carBrand,
      carModel: d.carModel,
      carColor: d.carColor,
      plateNumber: d.plateNumber,
      carYear: d.carYear,
      balance: Number(d.balance),
      currency: d.currency,
      gender: d.gender,
      kidsApproved: d.kidsApproved ?? false,
      nightApproved: d.nightApproved ?? false,
      approvalStatus: d.approvalStatus ?? 'pending_docs',
      rejectionReason: d.rejectionReason,
      createdAt: d.createdAt,
      documents: docs.map((doc) => this.toDocType(doc)),
      recentOrders: orders.map((o) => this.toOrderSummary(o)),
      recentTransactions: txs.map((t) => this.toTxType(t)),
      reviews: [],
    };
  }

  async setStatus(input: SetDriverStatusInput): Promise<AdminDriverDetailType> {
    const driver = await this.driverRepo.findOne({
      where: { id: input.driverId },
    });
    if (!driver) {
      throw new NotFoundException(`Driver #${input.driverId} not found`);
    }
    driver.approvalStatus = input.approvalStatus;
    driver.rejectionReason = input.reason;
    // أوتوماتيكاً: إن صار approved نُفعّل الحساب؛ إن صار hard_reject نُلغي التفعيل
    if (input.approvalStatus === 'approved') {
      driver.active = true;
      driver.banned = false;
    } else if (input.approvalStatus === 'hard_reject') {
      driver.active = false;
    }
    await this.driverRepo.save(driver);
    return this.getDetail(driver.id);
  }

  async reviewDocument(
    input: ReviewDocumentInput,
    reviewerId: number,
  ): Promise<AdminDriverDocumentType> {
    const doc = await this.docRepo.findOne({ where: { id: input.documentId } });
    if (!doc) throw new NotFoundException('Document not found');

    if (!input.approve && !input.rejectedReason) {
      throw new BadRequestException('rejectedReason is required when rejecting');
    }

    doc.status = input.approve ? 'approved' : 'rejected';
    doc.rejectedReason = input.approve ? undefined : input.rejectedReason;
    doc.reviewedAt = new Date();
    doc.reviewedBy = reviewerId;
    const saved = await this.docRepo.save(doc);

    // promotion logic: إن وافقنا على الكل → docs_uploaded تلقائياً (تظل ready للأدمن
    // لإعادة الفحص ثم يُعطّل approved يدوياً). للسهولة الآن نُبقي القرار النهائي يدوياً.

    return this.toDocType(saved);
  }

  // ─── Mappers ─────────────────────────────────────────────────────────────

  private toDocType(d: DriverDocumentEntity): AdminDriverDocumentType {
    return {
      id: d.id,
      driverId: d.driverId,
      type: d.type,
      url: d.url,
      expiresAt: d.expiresAt,
      status: d.status,
      rejectedReason: d.rejectedReason,
      uploadedAt: d.uploadedAt,
      reviewedAt: d.reviewedAt,
      reviewedBy: d.reviewedBy,
    };
  }

  private toOrderSummary(o: OrderEntity): AdminDriverOrderSummaryType {
    return {
      id: o.id,
      type: o.type,
      status: o.status,
      cost: Number(o.costAfterCoupon),
      currency: o.currency,
      createdOn: o.createdOn,
    };
  }

  private toTxType(t: WalletTransactionEntity): AdminDriverTransactionType {
    return {
      id: t.id,
      type: t.type,
      direction: t.direction,
      amount: Number(t.amount),
      balanceAfter: Number(t.balanceAfter),
      currency: t.currency,
      status: t.status,
      description: t.description,
      createdAt: t.createdAt,
    };
  }
}
