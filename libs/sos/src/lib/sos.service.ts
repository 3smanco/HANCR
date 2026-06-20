import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import IORedis from 'ioredis';
import {
  SosIncidentEntity,
  EmergencyContactEntity,
  SosStatus,
  SosTriggeredBy,
  EmergencyContactRelation,
  OrderEntity,
} from '@hancr/database';
import { SmsService } from '@hancr/notifications';

/**
 * Channel name لـ Redis pub/sub — تُستخدم في رابطة admin-api للاشتراك.
 * يجب أن يطابق exactly في admin-api/sos-admin.resolver.ts
 */
export const SOS_INCIDENT_CHANNEL = 'SOS_INCIDENT_CREATED';

/**
 * Channel لبث موقع الحادثة الحيّ (كل 3ث أثناء SOS نشط).
 * admin-api يشترك فيه لتحريك الماركر على الخريطة آنياً.
 */
export const SOS_LOCATION_CHANNEL = 'SOS_LOCATION_UPDATED';

export interface TriggerSosInput {
  triggeredBy: SosTriggeredBy;
  triggeredById: number;
  latitude: number;
  longitude: number;
  orderId?: number;
}

export interface AddEmergencyContactInput {
  ownerType: 'Rider' | 'Driver';
  ownerId: number;
  name: string;
  phoneNumber: string;
  relation: EmergencyContactRelation;
  autoShareTrips?: boolean;
  priority?: number;
}

/**
 * SosService — نظام الطوارئ المركزي (يستخدمه rider-api و driver-api).
 *
 * المسؤوليات:
 *  - تفعيل/إلغاء/إغلاق حادثة SOS (للراكب والسائق)
 *  - إدارة جهات الطوارئ (CRUD)
 *  - إرسال SMS تلقائي لجهات الطوارئ عند التفعيل
 *  - تحديث آخر موقع للحادثة (للـ live tracking)
 */
@Injectable()
export class SosService {
  private readonly logger = new Logger(SosService.name);
  private readonly redisPub: IORedis;

  constructor(
    @InjectRepository(SosIncidentEntity)
    private readonly sosRepo: Repository<SosIncidentEntity>,

    @InjectRepository(EmergencyContactEntity)
    private readonly contactRepo: Repository<EmergencyContactEntity>,

    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,

    private readonly sms: SmsService,
  ) {
    // Redis publisher مستقل للـ SOS_INCIDENT_CHANNEL.
    // admin-api يشترك في نفس الـ channel عبر RedisPubSub.
    this.redisPub = new IORedis({
      host: process.env['REDIS_HOST'] ?? 'localhost',
      port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
      password: process.env['REDIS_PASSWORD'],
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    });
    this.redisPub.on('error', (e) =>
      this.logger.warn(`Redis pub error: ${e.message}`),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SOS Incidents
  // ─────────────────────────────────────────────────────────────────────────

  async triggerSos(input: TriggerSosInput): Promise<SosIncidentEntity> {
    // Idempotency: لو في حادثة Active للمستخدم نفسه → أعدها بدل خلق واحدة جديدة
    const existing = await this.sosRepo.findOne({
      where: {
        triggeredBy: input.triggeredBy,
        triggeredById: input.triggeredById,
        status: SosStatus.Active,
      },
    });
    if (existing) {
      this.logger.warn(
        `Active SOS already exists for ${input.triggeredBy}#${input.triggeredById} (incident #${existing.id})`,
      );
      return existing;
    }

    const incident = this.sosRepo.create({
      triggeredBy: input.triggeredBy,
      triggeredById: input.triggeredById,
      orderId: input.orderId,
      latitude: input.latitude,
      longitude: input.longitude,
      lastLatitude: input.latitude,
      lastLongitude: input.longitude,
      lastLocationAt: new Date(),
      status: SosStatus.Active,
      contactsNotified: 0,
    });
    const saved = await this.sosRepo.save(incident);

    // إشعار جهات الطوارئ بشكل غير متزامن — لا ننتظر
    this._notifyEmergencyContacts(saved, input).catch((e) => {
      this.logger.error(
        `Failed to notify emergency contacts for incident #${saved.id}: ${e}`,
      );
    });

    // نشر event لـ admin-api ليتلقَّاه الـ live dashboard
    this._publishIncidentEvent(saved).catch((e) =>
      this.logger.warn(`Failed to publish SOS event: ${e.message}`),
    );

    this.logger.warn(
      `🚨 SOS TRIGGERED — incident #${saved.id} by ${input.triggeredBy}#${input.triggeredById} at (${input.latitude}, ${input.longitude})`,
    );

    return saved;
  }

  /**
   * انشر event عبر Redis لـ admin-api ليُحدِّث الـ live dashboard.
   */
  private async _publishIncidentEvent(
    incident: SosIncidentEntity,
  ): Promise<void> {
    const payload = JSON.stringify({
      sosIncidentCreated: {
        id: incident.id,
        triggeredBy: incident.triggeredBy,
        triggeredById: incident.triggeredById,
        orderId: incident.orderId,
        latitude: incident.latitude,
        longitude: incident.longitude,
        status: incident.status,
        contactsNotified: incident.contactsNotified,
        policeNotified: incident.policeNotified,
        createdAt: incident.createdAt,
      },
    });
    await this.redisPub.publish(SOS_INCIDENT_CHANNEL, payload);
  }

  async cancelSos(
    incidentId: number,
    cancelledBy: SosTriggeredBy,
    cancelledById: number,
  ): Promise<SosIncidentEntity> {
    const incident = await this.sosRepo.findOne({ where: { id: incidentId } });
    if (!incident) {
      throw new NotFoundException(`SOS incident #${incidentId} not found`);
    }
    if (
      incident.triggeredBy !== cancelledBy ||
      incident.triggeredById !== cancelledById
    ) {
      throw new NotFoundException('Cannot cancel — not the triggerer');
    }
    if (incident.status !== SosStatus.Active) {
      return incident;
    }
    incident.status = SosStatus.Cancelled;
    incident.resolvedAt = new Date();
    return this.sosRepo.save(incident);
  }

  async resolveSos(
    incidentId: number,
    adminNote?: string,
  ): Promise<SosIncidentEntity> {
    const incident = await this.sosRepo.findOne({ where: { id: incidentId } });
    if (!incident) {
      throw new NotFoundException(`SOS incident #${incidentId} not found`);
    }
    incident.status = SosStatus.Resolved;
    incident.adminNote = adminNote;
    incident.resolvedAt = new Date();
    return this.sosRepo.save(incident);
  }

  async updateLocation(
    incidentId: number,
    latitude: number,
    longitude: number,
  ): Promise<void> {
    await this.sosRepo.update(incidentId, {
      lastLatitude: latitude,
      lastLongitude: longitude,
      lastLocationAt: new Date(),
    });
    // بثّ الموقع آنياً لـ admin-api (الخريطة الحيّة).
    this.redisPub
      .publish(
        SOS_LOCATION_CHANNEL,
        JSON.stringify({
          sosLocationUpdated: {
            incidentId,
            latitude,
            longitude,
            at: new Date().toISOString(),
          },
        }),
      )
      .catch((e) =>
        this.logger.warn(`Failed to publish SOS location: ${e.message}`),
      );
  }

  /**
   * تحديث موقع حادثة نشطة مع التحقّق من الملكية (يُستدعى من resolver التطبيق).
   * يتجاهل بصمت إن لم تكن الحادثة نشطة أو ليست للمستخدم — لا يكسر بثّ الموقع.
   */
  async updateActiveLocation(
    triggeredBy: SosTriggeredBy,
    triggeredById: number,
    latitude: number,
    longitude: number,
  ): Promise<boolean> {
    const incident = await this.getActiveSos(triggeredBy, triggeredById);
    if (!incident) return false;
    await this.updateLocation(incident.id, latitude, longitude);
    return true;
  }

  async getActiveSos(
    triggeredBy: SosTriggeredBy,
    triggeredById: number,
  ): Promise<SosIncidentEntity | null> {
    return this.sosRepo.findOne({
      where: {
        triggeredBy,
        triggeredById,
        status: SosStatus.Active,
      },
    });
  }

  async getIncidentById(incidentId: number): Promise<SosIncidentEntity | null> {
    return this.sosRepo.findOne({ where: { id: incidentId } });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Emergency Contacts
  // ─────────────────────────────────────────────────────────────────────────

  async listContacts(
    ownerType: 'Rider' | 'Driver',
    ownerId: number,
  ): Promise<EmergencyContactEntity[]> {
    return this.contactRepo.find({
      where: { ownerType, ownerId },
      order: { priority: 'ASC', createdAt: 'ASC' },
    });
  }

  async addContact(input: AddEmergencyContactInput): Promise<EmergencyContactEntity> {
    const contact = this.contactRepo.create({
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      name: input.name,
      phoneNumber: input.phoneNumber,
      relation: input.relation,
      autoShareTrips: input.autoShareTrips ?? false,
      priority: input.priority ?? 0,
    });
    return this.contactRepo.save(contact);
  }

  async removeContact(
    contactId: number,
    ownerType: 'Rider' | 'Driver',
    ownerId: number,
  ): Promise<boolean> {
    const result = await this.contactRepo.delete({
      id: contactId,
      ownerType,
      ownerId,
    });
    return (result.affected ?? 0) > 0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Trip Sharing — أرسل SMS لجهات الطوارئ المُفعَّلة عند بدء رحلة
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * شارك رحلة جديدة مع جهات الطوارئ التي وضعها صاحبها `autoShareTrips=true`.
   *
   * Flow:
   *  - يستدعى من driver-api بعد startRide
   *  - يجلب فقط الجهات بـ autoShareTrips=true
   *  - يرسل SMS بـ: اسم السائق + رقم اللوحة + رابط الوجهة + رقم الرحلة
   */
  async shareTripWithContacts(input: {
    ownerType: 'Rider' | 'Driver';
    ownerId: number;
    orderId: number;
    driverName?: string;
    plateNumber?: string;
    destinationLat: number;
    destinationLng: number;
  }): Promise<number> {
    const contacts = await this.contactRepo.find({
      where: {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        autoShareTrips: true,
      },
    });
    if (contacts.length === 0) return 0;

    const mapsLink = `https://maps.google.com/?q=${input.destinationLat},${input.destinationLng}`;
    const driverInfo = input.driverName ? ` السائق ${input.driverName}` : '';
    const plateInfo = input.plateNumber ? ` (لوحة: ${input.plateNumber})` : '';
    const message =
      `🚗 HANCR — بدأت رحلة رقم ${input.orderId}.${driverInfo}${plateInfo}. ` +
      `الوجهة: ${mapsLink}`;

    let notified = 0;
    for (const contact of contacts) {
      try {
        await this.sms.send(contact.phoneNumber, message);
        notified++;
      } catch (e) {
        this.logger.error(
          `Failed to share trip with ${contact.phoneNumber}: ${e}`,
        );
      }
    }
    this.logger.log(
      `Trip #${input.orderId} shared with ${notified}/${contacts.length} contacts (${input.ownerType}#${input.ownerId})`,
    );
    return notified;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal — notify emergency contacts via SMS
  // ─────────────────────────────────────────────────────────────────────────

  private async _notifyEmergencyContacts(
    incident: SosIncidentEntity,
    input: TriggerSosInput,
  ): Promise<void> {
    const ownerType =
      input.triggeredBy === SosTriggeredBy.Rider ? 'Rider' : 'Driver';
    const contacts = await this.listContacts(ownerType, input.triggeredById);

    if (contacts.length === 0) {
      this.logger.warn(
        `Incident #${incident.id}: no emergency contacts for ${ownerType}#${input.triggeredById}`,
      );
      return;
    }

    const mapsLink = `https://maps.google.com/?q=${input.latitude},${input.longitude}`;
    const tripNote = input.orderId ? ` رحلة رقم ${input.orderId}.` : '';
    const ownerLabel = ownerType === 'Rider' ? 'الراكب' : 'السائق';

    const messageAr =
      `🚨 طوارئ HANCR — ${ownerLabel} بحاجة للمساعدة!${tripNote} ` +
      `الموقع: ${mapsLink}`;

    let notified = 0;
    for (const contact of contacts) {
      try {
        await this.sms.send(contact.phoneNumber, messageAr);
        notified++;
      } catch (e) {
        this.logger.error(
          `Failed to send SOS SMS to ${contact.phoneNumber}: ${e}`,
        );
      }
    }

    await this.sosRepo.update(incident.id, { contactsNotified: notified });
    this.logger.log(
      `Incident #${incident.id}: notified ${notified}/${contacts.length} contacts`,
    );
  }
}
