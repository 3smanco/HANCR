import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverApplicationEntity } from '@hancr/database';
import {
  DriverApplicationListResult,
  DriverApplicationType,
  SubmitDriverApplicationInput,
  UpdateApplicationStatusInput,
} from './dto/driver-application.types';

@Injectable()
export class DriverApplicationsService {
  constructor(
    @InjectRepository(DriverApplicationEntity)
    private readonly repo: Repository<DriverApplicationEntity>,
  ) {}

  async submit(
    input: SubmitDriverApplicationInput,
    sourceIp?: string,
    userAgent?: string,
  ): Promise<DriverApplicationType> {
    const row = this.repo.create({
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      city: input.city?.trim(),
      nationalIdNumber: input.nationalIdNumber?.trim(),
      dateOfBirth: input.dateOfBirth,
      vehicleBrand: input.vehicleBrand?.trim(),
      vehicleModel: input.vehicleModel?.trim(),
      vehicleYear: input.vehicleYear,
      vehicleColor: input.vehicleColor?.trim(),
      plateNumber: input.plateNumber?.trim(),
      docNationalIdUrl: input.docNationalIdUrl,
      docLicenseUrl: input.docLicenseUrl,
      docVehicleRegistrationUrl: input.docVehicleRegistrationUrl,
      docInsuranceUrl: input.docInsuranceUrl,
      docProfilePhotoUrl: input.docProfilePhotoUrl,
      status: 'submitted',
      sourceIp,
      userAgent,
    });
    const saved = await this.repo.save(row);
    return this.toType(saved);
  }

  async list(
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<DriverApplicationListResult> {
    const qb = this.repo
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (status) qb.andWhere('a.status = :status', { status });

    const [items, total] = await qb.getManyAndCount();

    const [submittedCount, inReviewCount] = await Promise.all([
      this.repo.count({ where: { status: 'submitted' } }),
      this.repo.count({ where: { status: 'in_review' } }),
    ]);

    return {
      items: items.map((r) => this.toType(r)),
      total,
      submittedCount,
      inReviewCount,
    };
  }

  async getOne(id: number): Promise<DriverApplicationType> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Application #${id} not found`);
    return this.toType(row);
  }

  /**
   * M3 — Used by the public status lookup. Returns null instead of throwing
   * so the resolver doesn't leak which application IDs exist.
   */
  async findByIdAndPhone(
    id: number,
    phone: string,
  ): Promise<DriverApplicationType | null> {
    const normalized = phone.replace(/\s/g, '');
    const row = await this.repo.findOne({ where: { id } });
    if (!row) return null;
    if (row.phone.replace(/\s/g, '') !== normalized) return null;
    return this.toType(row);
  }

  async updateStatus(
    input: UpdateApplicationStatusInput,
    reviewerId: number,
  ): Promise<DriverApplicationType> {
    const row = await this.repo.findOne({ where: { id: input.applicationId } });
    if (!row) throw new NotFoundException(`Application #${input.applicationId} not found`);
    row.status = input.status;
    if (input.rejectionReason) row.rejectionReason = input.rejectionReason;
    row.reviewedBy = reviewerId;
    row.reviewedAt = new Date();
    await this.repo.save(row);
    return this.toType(row);
  }

  private toType(a: DriverApplicationEntity): DriverApplicationType {
    return {
      id: a.id,
      fullName: a.fullName,
      email: a.email,
      phone: a.phone,
      city: a.city,
      nationalIdNumber: a.nationalIdNumber,
      dateOfBirth: a.dateOfBirth,
      vehicleBrand: a.vehicleBrand,
      vehicleModel: a.vehicleModel,
      vehicleYear: a.vehicleYear,
      vehicleColor: a.vehicleColor,
      plateNumber: a.plateNumber,
      docNationalIdUrl: a.docNationalIdUrl,
      docLicenseUrl: a.docLicenseUrl,
      docVehicleRegistrationUrl: a.docVehicleRegistrationUrl,
      docInsuranceUrl: a.docInsuranceUrl,
      docProfilePhotoUrl: a.docProfilePhotoUrl,
      status: a.status,
      rejectionReason: a.rejectionReason,
      reviewedAt: a.reviewedAt,
      createdAt: a.createdAt,
    };
  }
}
