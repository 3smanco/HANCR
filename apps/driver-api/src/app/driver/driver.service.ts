import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverDocumentEntity, DriverEntity } from '@hancr/database';
import { UpdateDriverInput } from './dto/update-driver.input';
import { DriverType } from './dto/driver.type';
import {
  DriverDocumentType,
  UploadDocumentInput,
} from './dto/driver-document.type';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    @InjectRepository(DriverDocumentEntity)
    private readonly docRepo: Repository<DriverDocumentEntity>,
  ) {}

  async findById(id: number): Promise<DriverEntity> {
    const driver = await this.driverRepo.findOne({ where: { id } });
    if (!driver) throw new NotFoundException(`Driver #${id} not found`);
    return driver;
  }

  async getMe(driverId: number): Promise<DriverType> {
    return this.toType(await this.findById(driverId));
  }

  /** Update only the FCM token (mobile app on login / refresh) */
  async updateFcmToken(driverId: number, fcmToken: string): Promise<boolean> {
    await this.driverRepo.update(driverId, { fcmToken });
    return true;
  }

  /** Clear FCM token (logout) */
  async clearFcmToken(driverId: number): Promise<boolean> {
    await this.driverRepo.update(driverId, { fcmToken: undefined });
    return true;
  }

  async update(driverId: number, input: UpdateDriverInput): Promise<DriverType> {
    await this.driverRepo.update(driverId, {
      ...(input.firstName && { firstName: input.firstName }),
      ...(input.lastName && { lastName: input.lastName }),
      ...(input.carBrand && { carBrand: input.carBrand }),
      ...(input.carModel && { carModel: input.carModel }),
      ...(input.carColor && { carColor: input.carColor }),
      ...(input.plateNumber && { plateNumber: input.plateNumber }),
      ...(input.carYear && { carYear: input.carYear }),
      ...(input.carPhotoUrl && { carPhotoUrl: input.carPhotoUrl }),
      ...(input.avatarUrl && { avatarUrl: input.avatarUrl }),
      ...(input.fcmToken && { fcmToken: input.fcmToken }),
      ...(input.serviceIds && { serviceIds: input.serviceIds }),
      ...(input.gender && { gender: input.gender }),
    });
    return this.getMe(driverId);
  }

  toType(d: DriverEntity): DriverType {
    return {
      id: d.id,
      phoneNumber: d.phoneNumber,
      countryCode: d.countryCode,
      firstName: d.firstName,
      lastName: d.lastName,
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
      carPhotoUrl: d.carPhotoUrl,
      balance: Number(d.balance),
      currency: d.currency,
      fcmToken: d.fcmToken,
      regionId: d.regionId,
      createdAt: d.createdAt,
      gender: d.gender,
      kidsApproved: d.kidsApproved ?? false,
      nightApproved: d.nightApproved ?? false,
      approvalStatus: d.approvalStatus ?? 'pending_docs',
      rejectionReason: d.rejectionReason,
    };
  }

  // ─── I1 — Documents ────────────────────────────────────────────────────────

  async listDocuments(driverId: number): Promise<DriverDocumentType[]> {
    const docs = await this.docRepo.find({
      where: { driverId },
      order: { uploadedAt: 'DESC' },
    });
    return docs.map((d) => this.toDocType(d));
  }

  /**
   * يرفع/يستبدل وثيقة من نوع معيّن.
   * - إن وُجدت وثيقة سابقة بنفس النوع، نُحدّثها (status='pending') ونمسح rejected_reason
   * - تحديث approval_status للسائق إلى docs_uploaded إن كان pending_docs
   */
  async uploadDocument(
    driverId: number,
    input: UploadDocumentInput,
  ): Promise<DriverDocumentType> {
    const existing = await this.docRepo.findOne({
      where: { driverId, type: input.type },
    });
    let saved: DriverDocumentEntity;
    if (existing) {
      existing.url = input.url;
      existing.expiresAt = input.expiresAt;
      existing.status = 'pending';
      existing.rejectedReason = undefined;
      existing.reviewedAt = undefined;
      existing.reviewedBy = undefined;
      saved = await this.docRepo.save(existing);
    } else {
      saved = await this.docRepo.save(
        this.docRepo.create({
          driverId,
          type: input.type,
          url: input.url,
          expiresAt: input.expiresAt,
          status: 'pending',
        }),
      );
    }

    // Maybe-promote approval_status: pending_docs → docs_uploaded
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });
    if (driver && driver.approvalStatus === 'pending_docs') {
      const required = ['national_id', 'license', 'vehicle_registration'];
      const allDocs = await this.docRepo.find({ where: { driverId } });
      const haveTypes = new Set(allDocs.map((d) => d.type));
      const ready = required.every((t) => haveTypes.has(t));
      if (ready) {
        await this.driverRepo.update(driverId, {
          approvalStatus: 'docs_uploaded',
        });
      }
    }

    return this.toDocType(saved);
  }

  private toDocType(d: DriverDocumentEntity): DriverDocumentType {
    return {
      id: d.id,
      type: d.type,
      url: d.url,
      expiresAt: d.expiresAt,
      status: d.status,
      rejectedReason: d.rejectedReason,
      uploadedAt: d.uploadedAt,
      reviewedAt: d.reviewedAt,
    };
  }
}
