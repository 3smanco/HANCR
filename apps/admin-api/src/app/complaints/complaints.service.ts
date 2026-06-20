import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ComplaintActivityEntity,
  ComplaintEntity,
  DriverEntity,
  RiderEntity,
  WalletOwnerType,
} from '@hancr/database';
import { WalletsService } from '../wallets/wallets.service';
import {
  AddComplaintNoteInput,
  AdminComplaintActivityType,
  AdminComplaintDetailType,
  AdminComplaintType,
  ComplaintListResult,
  UpdateComplaintStatusInput,
} from './dto/complaint.types';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(ComplaintEntity)
    private readonly complaintRepo: Repository<ComplaintEntity>,
    @InjectRepository(ComplaintActivityEntity)
    private readonly activityRepo: Repository<ComplaintActivityEntity>,
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    private readonly walletsService: WalletsService,
  ) {}

  async list(
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<ComplaintListResult> {
    const qb = this.complaintRepo
      .createQueryBuilder('c')
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (status) qb.andWhere('c.status = :status', { status });

    const [items, total] = await qb.getManyAndCount();

    const [submittedCount, underReviewCount] = await Promise.all([
      this.complaintRepo.count({ where: { status: 'submitted' } }),
      this.complaintRepo.count({ where: { status: 'under_review' } }),
    ]);

    // Hydrate reporter names
    const riderIds = items
      .filter((c) => c.reportedByType === 'rider')
      .map((c) => c.reportedById);
    const driverIds = items
      .filter((c) => c.reportedByType === 'driver')
      .map((c) => c.reportedById);
    const [riders, drivers] = await Promise.all([
      riderIds.length > 0 ? this.riderRepo.findByIds(riderIds) : Promise.resolve([]),
      driverIds.length > 0 ? this.driverRepo.findByIds(driverIds) : Promise.resolve([]),
    ]);
    const riderMap = new Map(riders.map((r) => [r.id, r]));
    const driverMap = new Map(drivers.map((d) => [d.id, d]));

    return {
      items: items.map((c) =>
        this.toType(c, riderMap, driverMap),
      ),
      total,
      page,
      limit,
      submittedCount,
      underReviewCount,
    };
  }

  async getDetail(id: number): Promise<AdminComplaintDetailType> {
    const c = await this.complaintRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException(`Complaint #${id} not found`);

    const activities = await this.activityRepo.find({
      where: { complaintId: id },
      order: { createdAt: 'ASC' },
    });

    const reporter = await this.fetchReporter(c.reportedByType, c.reportedById);

    return {
      ...this.toBase(c, reporter),
      activities: activities.map((a) => this.toActivityType(a)),
    };
  }

  async updateStatus(
    input: UpdateComplaintStatusInput,
    actorId: number,
  ): Promise<AdminComplaintDetailType> {
    const c = await this.complaintRepo.findOne({
      where: { id: input.complaintId },
    });
    if (!c) throw new NotFoundException('Complaint not found');

    const oldStatus = c.status;
    c.status = input.status;
    if (input.resolutionNote) c.resolutionNote = input.resolutionNote;
    if (input.status === 'resolved' || input.status === 'dismissed') {
      c.resolvedAt = new Date();
    }
    await this.complaintRepo.save(c);

    await this.activityRepo.save(
      this.activityRepo.create({
        complaintId: c.id,
        actorType: 'admin',
        actorId,
        type:
          input.status === 'resolved'
            ? 'resolved'
            : input.status === 'dismissed'
              ? 'dismissed'
              : 'status_change',
        note: input.resolutionNote ?? `${oldStatus} → ${input.status}`,
      }),
    );
    return this.getDetail(c.id);
  }

  async addNote(
    input: AddComplaintNoteInput,
    actorId: number,
  ): Promise<AdminComplaintDetailType> {
    const c = await this.complaintRepo.findOne({
      where: { id: input.complaintId },
    });
    if (!c) throw new NotFoundException('Complaint not found');

    await this.activityRepo.save(
      this.activityRepo.create({
        complaintId: c.id,
        actorType: 'admin',
        actorId,
        type: 'note',
        note: input.note,
      }),
    );
    return this.getDetail(c.id);
  }

  /** إسناد التذكرة لموظف. */
  async assign(
    complaintId: number,
    assigneeId: number,
    actorId: number,
  ): Promise<AdminComplaintDetailType> {
    const c = await this.complaintRepo.findOne({ where: { id: complaintId } });
    if (!c) throw new NotFoundException('Complaint not found');
    c.assignedTo = assigneeId;
    if (c.status === 'submitted') c.status = 'under_review';
    await this.complaintRepo.save(c);
    await this.activityRepo.save(
      this.activityRepo.create({
        complaintId: c.id,
        actorType: 'admin',
        actorId,
        type: 'assigned',
        note: `Assigned to admin #${assigneeId}`,
      }),
    );
    return this.getDetail(c.id);
  }

  /** إجراء مالي: تعويض/ردّ أموال لمحفظة مُبلِّغ التذكرة + تسجيله في الخطّ الزمني. */
  async refund(
    complaintId: number,
    amount: number,
    actorId: number,
    voucher = false,
  ): Promise<AdminComplaintDetailType> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const c = await this.complaintRepo.findOne({ where: { id: complaintId } });
    if (!c) throw new NotFoundException('Complaint not found');
    const ownerType =
      c.reportedByType === 'driver'
        ? WalletOwnerType.Driver
        : WalletOwnerType.Rider;
    const reason = voucher
      ? `Voucher for complaint #${c.id}`
      : `Refund for complaint #${c.id}`;
    await this.walletsService.adjust({
      ownerType,
      ownerId: c.reportedById,
      amount, // موجب = إضافة رصيد
      reason,
    });
    await this.activityRepo.save(
      this.activityRepo.create({
        complaintId: c.id,
        actorType: 'admin',
        actorId,
        type: voucher ? 'voucher' : 'refund',
        note: `${voucher ? 'Voucher' : 'Refund'}: ${amount}`,
      }),
    );
    return this.getDetail(c.id);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async fetchReporter(
    type: string,
    id: number,
  ): Promise<{ name?: string }> {
    if (type === 'rider') {
      const r = await this.riderRepo.findOne({ where: { id } });
      return {
        name: r
          ? [r.firstName, r.lastName].filter(Boolean).join(' ') || undefined
          : undefined,
      };
    }
    if (type === 'driver') {
      const d = await this.driverRepo.findOne({ where: { id } });
      return {
        name: d
          ? [d.firstName, d.lastName].filter(Boolean).join(' ') || undefined
          : undefined,
      };
    }
    return {};
  }

  private toType(
    c: ComplaintEntity,
    riderMap: Map<number, RiderEntity>,
    driverMap: Map<number, DriverEntity>,
  ): AdminComplaintType {
    let reporterName: string | undefined;
    if (c.reportedByType === 'rider') {
      const r = riderMap.get(c.reportedById);
      reporterName = r
        ? [r.firstName, r.lastName].filter(Boolean).join(' ') || undefined
        : undefined;
    } else if (c.reportedByType === 'driver') {
      const d = driverMap.get(c.reportedById);
      reporterName = d
        ? [d.firstName, d.lastName].filter(Boolean).join(' ') || undefined
        : undefined;
    }
    return this.toBase(c, { name: reporterName });
  }

  private toBase(
    c: ComplaintEntity,
    reporter: { name?: string },
  ): AdminComplaintType {
    return {
      id: c.id,
      orderId: c.orderId,
      reportedByType: c.reportedByType,
      reportedById: c.reportedById,
      reporterName: reporter.name,
      category: c.category,
      description: c.description,
      status: c.status,
      resolutionNote: c.resolutionNote,
      assignedTo: c.assignedTo,
      dueAt: c.dueAt,
      createdAt: c.createdAt,
      resolvedAt: c.resolvedAt,
    };
  }

  private toActivityType(
    a: ComplaintActivityEntity,
  ): AdminComplaintActivityType {
    return {
      id: a.id,
      actorType: a.actorType,
      actorId: a.actorId,
      type: a.type,
      note: a.note,
      createdAt: a.createdAt,
    };
  }
}
