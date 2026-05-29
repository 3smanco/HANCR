import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SosIncidentEntity, SosStatus } from '@hancr/database';

/**
 * SosAdminService — منطق الأدمن لإدارة حوادث SOS.
 *
 * منفصل عن `@hancr/sos` لأن الأدمن لديه صلاحيات إضافية:
 * - عرض كل الحوادث (نشطة، مغلقة، ملغاة)
 * - إغلاق حادثة + إدراج ملاحظة + علامة "تم تبليغ الشرطة"
 * - فلترة بـ status / تاريخ
 */
@Injectable()
export class SosAdminService {
  constructor(
    @InjectRepository(SosIncidentEntity)
    private readonly sosRepo: Repository<SosIncidentEntity>,
  ) {}

  /**
   * قائمة الحوادث مع فلترة اختيارية.
   * Defaults: نشطة فقط، مرتَّبة بـ createdAt DESC.
   */
  async listIncidents(input: {
    statuses?: SosStatus[];
    limit?: number;
    offset?: number;
  }): Promise<SosIncidentEntity[]> {
    const statuses = input.statuses ?? [SosStatus.Active];
    return this.sosRepo.find({
      where: { status: In(statuses) },
      order: { createdAt: 'DESC' },
      take: input.limit ?? 50,
      skip: input.offset ?? 0,
    });
  }

  /** عدد الحوادث النشطة (لـ dashboard badge) */
  async countActive(): Promise<number> {
    return this.sosRepo.count({ where: { status: SosStatus.Active } });
  }

  async getById(incidentId: number): Promise<SosIncidentEntity> {
    const incident = await this.sosRepo.findOne({ where: { id: incidentId } });
    if (!incident) {
      throw new NotFoundException(`SOS incident #${incidentId} not found`);
    }
    return incident;
  }

  /** إغلاق حادثة بقرار من الأدمن */
  async resolveIncident(input: {
    incidentId: number;
    adminNote?: string;
    markPoliceNotified?: boolean;
  }): Promise<SosIncidentEntity> {
    const incident = await this.getById(input.incidentId);
    incident.status = SosStatus.Resolved;
    incident.resolvedAt = new Date();
    if (input.adminNote) incident.adminNote = input.adminNote;
    if (input.markPoliceNotified) incident.policeNotified = true;
    return this.sosRepo.save(incident);
  }

  /** تصعيد حادثة (مثلاً: تواصلت معها الشرطة) */
  async escalateIncident(
    incidentId: number,
    adminNote: string,
  ): Promise<SosIncidentEntity> {
    const incident = await this.getById(incidentId);
    incident.status = SosStatus.Escalated;
    incident.adminNote = adminNote;
    incident.policeNotified = true;
    return this.sosRepo.save(incident);
  }
}
