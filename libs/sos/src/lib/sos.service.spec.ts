import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SosService } from './sos.service';
import {
  SosIncidentEntity,
  EmergencyContactEntity,
  OrderEntity,
  SosStatus,
  SosTriggeredBy,
  EmergencyContactRelation,
} from '@hancr/database';
import { SmsService } from '@hancr/notifications';

describe('SosService', () => {
  let service: SosService;
  let sosRepo: jest.Mocked<Repository<SosIncidentEntity>>;
  let contactRepo: jest.Mocked<Repository<EmergencyContactEntity>>;
  let smsService: jest.Mocked<SmsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SosService,
        {
          provide: getRepositoryToken(SosIncidentEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn((data) => ({ id: 100, ...data })),
            save: jest.fn(async (entity) => entity),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EmergencyContactEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn((data) => ({ id: 50, ...data })),
            save: jest.fn(async (entity) => entity),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: SmsService,
          useValue: { send: jest.fn(async () => ({ success: true, sid: 'mock' })) },
        },
      ],
    }).compile();

    service = module.get<SosService>(SosService);
    sosRepo = module.get(getRepositoryToken(SosIncidentEntity));
    contactRepo = module.get(getRepositoryToken(EmergencyContactEntity));
    smsService = module.get(SmsService);
  });

  describe('triggerSos', () => {
    it('يُنشئ حادثة جديدة مع status=Active', async () => {
      sosRepo.findOne.mockResolvedValue(null);
      contactRepo.find.mockResolvedValue([]);

      const incident = await service.triggerSos({
        triggeredBy: SosTriggeredBy.Rider,
        triggeredById: 5,
        latitude: 24.7,
        longitude: 46.6,
      });

      expect(incident.status).toBe(SosStatus.Active);
      expect(incident.triggeredById).toBe(5);
      expect(sosRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SosStatus.Active,
          latitude: 24.7,
          longitude: 46.6,
          lastLatitude: 24.7,
          lastLongitude: 46.6,
        }),
      );
    });

    it('Idempotent: يُعيد الحادثة الموجودة لو فيه Active للمستخدم نفسه', async () => {
      const existing = {
        id: 42,
        status: SosStatus.Active,
        triggeredBy: SosTriggeredBy.Rider,
        triggeredById: 5,
      } as SosIncidentEntity;
      sosRepo.findOne.mockResolvedValue(existing);

      const result = await service.triggerSos({
        triggeredBy: SosTriggeredBy.Rider,
        triggeredById: 5,
        latitude: 24.7,
        longitude: 46.6,
      });

      expect(result).toBe(existing);
      expect(sosRepo.create).not.toHaveBeenCalled();
    });

    it('يُرسل SMS لكل جهات الطوارئ', async () => {
      sosRepo.findOne.mockResolvedValue(null);
      contactRepo.find.mockResolvedValue([
        {
          id: 1,
          name: 'أبي',
          phoneNumber: '+966501111111',
          ownerType: 'Rider',
          ownerId: 5,
          relation: EmergencyContactRelation.Family,
        } as EmergencyContactEntity,
        {
          id: 2,
          name: 'أمي',
          phoneNumber: '+966502222222',
          ownerType: 'Rider',
          ownerId: 5,
          relation: EmergencyContactRelation.Family,
        } as EmergencyContactEntity,
      ]);

      await service.triggerSos({
        triggeredBy: SosTriggeredBy.Rider,
        triggeredById: 5,
        latitude: 24.7,
        longitude: 46.6,
        orderId: 999,
      });

      // SMS غير متزامن — انتظر microtask
      await new Promise((r) => setTimeout(r, 50));

      expect(smsService.send).toHaveBeenCalledTimes(2);
      expect(smsService.send).toHaveBeenCalledWith(
        '+966501111111',
        expect.stringContaining('maps.google.com/?q=24.7,46.6'),
      );
      expect(smsService.send).toHaveBeenCalledWith(
        '+966502222222',
        expect.stringContaining('رحلة رقم 999'),
      );
    });

    it('SMS يحتوي على نوع المُفعِّل (الراكب)', async () => {
      sosRepo.findOne.mockResolvedValue(null);
      contactRepo.find.mockResolvedValue([
        {
          id: 1,
          phoneNumber: '+966500000000',
          ownerType: 'Rider',
          ownerId: 5,
        } as EmergencyContactEntity,
      ]);

      await service.triggerSos({
        triggeredBy: SosTriggeredBy.Rider,
        triggeredById: 5,
        latitude: 24,
        longitude: 46,
      });
      await new Promise((r) => setTimeout(r, 50));

      expect(smsService.send).toHaveBeenCalledWith(
        '+966500000000',
        expect.stringContaining('الراكب'),
      );
    });

    it('SMS يحتوي على نوع المُفعِّل (السائق)', async () => {
      sosRepo.findOne.mockResolvedValue(null);
      contactRepo.find.mockResolvedValue([
        {
          id: 1,
          phoneNumber: '+966500000000',
          ownerType: 'Driver',
          ownerId: 7,
        } as EmergencyContactEntity,
      ]);

      await service.triggerSos({
        triggeredBy: SosTriggeredBy.Driver,
        triggeredById: 7,
        latitude: 24,
        longitude: 46,
      });
      await new Promise((r) => setTimeout(r, 50));

      expect(smsService.send).toHaveBeenCalledWith(
        '+966500000000',
        expect.stringContaining('السائق'),
      );
    });

    it('فشل SMS لجهة معيَّنة لا يكسر الحادثة', async () => {
      sosRepo.findOne.mockResolvedValue(null);
      contactRepo.find.mockResolvedValue([
        { id: 1, phoneNumber: '+966500000000', ownerType: 'Rider', ownerId: 5 } as EmergencyContactEntity,
        { id: 2, phoneNumber: '+966501111111', ownerType: 'Rider', ownerId: 5 } as EmergencyContactEntity,
      ]);
      smsService.send
        .mockRejectedValueOnce(new Error('Twilio error'))
        .mockResolvedValueOnce({ success: true, sid: 'OK' });

      const incident = await service.triggerSos({
        triggeredBy: SosTriggeredBy.Rider,
        triggeredById: 5,
        latitude: 24,
        longitude: 46,
      });
      await new Promise((r) => setTimeout(r, 50));

      expect(incident.status).toBe(SosStatus.Active);
      expect(smsService.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancelSos', () => {
    it('يُلغي حادثة المستخدم نفسه', async () => {
      sosRepo.findOne.mockResolvedValue({
        id: 10,
        status: SosStatus.Active,
        triggeredBy: SosTriggeredBy.Rider,
        triggeredById: 5,
      } as SosIncidentEntity);

      const result = await service.cancelSos(10, SosTriggeredBy.Rider, 5);

      expect(result.status).toBe(SosStatus.Cancelled);
      expect(result.resolvedAt).toBeInstanceOf(Date);
    });

    it('يرفض إلغاء حادثة شخص آخر', async () => {
      sosRepo.findOne.mockResolvedValue({
        id: 10,
        status: SosStatus.Active,
        triggeredBy: SosTriggeredBy.Rider,
        triggeredById: 5,
      } as SosIncidentEntity);

      await expect(
        service.cancelSos(10, SosTriggeredBy.Rider, 999),
      ).rejects.toThrow('Cannot cancel');
    });

    it('Idempotent: لا يفعل شيئاً لو الحادثة مغلقة بالفعل', async () => {
      const existing = {
        id: 10,
        status: SosStatus.Resolved,
        triggeredBy: SosTriggeredBy.Rider,
        triggeredById: 5,
      } as SosIncidentEntity;
      sosRepo.findOne.mockResolvedValue(existing);

      const result = await service.cancelSos(10, SosTriggeredBy.Rider, 5);

      expect(result).toBe(existing);
      expect(sosRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('resolveSos', () => {
    it('يضع Resolved + adminNote', async () => {
      sosRepo.findOne.mockResolvedValue({
        id: 10,
        status: SosStatus.Active,
      } as SosIncidentEntity);

      const result = await service.resolveSos(10, 'تم التواصل بالشرطة');

      expect(result.status).toBe(SosStatus.Resolved);
      expect(result.adminNote).toBe('تم التواصل بالشرطة');
      expect(result.resolvedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateLocation', () => {
    it('يُحدِّث آخر موقع', async () => {
      await service.updateLocation(10, 25.0, 47.0);

      expect(sosRepo.update).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          lastLatitude: 25.0,
          lastLongitude: 47.0,
        }),
      );
    });
  });

  describe('Emergency Contacts CRUD', () => {
    it('listContacts يُرجع المرتَّبة بـ priority ASC', async () => {
      const contacts = [
        { id: 1, priority: 0 },
        { id: 2, priority: 1 },
      ] as EmergencyContactEntity[];
      contactRepo.find.mockResolvedValue(contacts);

      const result = await service.listContacts('Rider', 5);
      expect(result).toBe(contacts);
      expect(contactRepo.find).toHaveBeenCalledWith({
        where: { ownerType: 'Rider', ownerId: 5 },
        order: { priority: 'ASC', createdAt: 'ASC' },
      });
    });

    it('addContact يحفظ الجهة', async () => {
      const result = await service.addContact({
        ownerType: 'Rider',
        ownerId: 5,
        name: 'أبي',
        phoneNumber: '+966501234567',
        relation: EmergencyContactRelation.Family,
      });

      expect(result.name).toBe('أبي');
      expect(result.phoneNumber).toBe('+966501234567');
      expect(result.autoShareTrips).toBe(false);
      expect(result.priority).toBe(0);
    });

    it('addContact يحترم autoShareTrips=true', async () => {
      const result = await service.addContact({
        ownerType: 'Rider',
        ownerId: 5,
        name: 'الزوجة',
        phoneNumber: '+966502222222',
        relation: EmergencyContactRelation.Spouse,
        autoShareTrips: true,
        priority: 1,
      });

      expect(result.autoShareTrips).toBe(true);
      expect(result.priority).toBe(1);
    });

    it('removeContact يستدعي delete بـ الـ owner check', async () => {
      contactRepo.delete.mockResolvedValue({
        affected: 1,
        raw: [],
      });

      const ok = await service.removeContact(50, 'Rider', 5);
      expect(ok).toBe(true);
      expect(contactRepo.delete).toHaveBeenCalledWith({
        id: 50,
        ownerType: 'Rider',
        ownerId: 5,
      });
    });

    it('removeContact يرجع false لو لم يحذف شيئاً (owner mismatch)', async () => {
      contactRepo.delete.mockResolvedValue({ affected: 0, raw: [] });
      const ok = await service.removeContact(50, 'Rider', 999);
      expect(ok).toBe(false);
    });
  });

  describe('shareTripWithContacts', () => {
    it('يُرسل SMS لجهات autoShareTrips فقط', async () => {
      contactRepo.find.mockResolvedValue([
        { id: 1, phoneNumber: '+966500000000', autoShareTrips: true } as EmergencyContactEntity,
        { id: 2, phoneNumber: '+966501111111', autoShareTrips: true } as EmergencyContactEntity,
      ]);

      const count = await service.shareTripWithContacts({
        ownerType: 'Rider',
        ownerId: 5,
        orderId: 100,
        driverName: 'محمد',
        plateNumber: 'ABC 123',
        destinationLat: 24.7,
        destinationLng: 46.6,
      });

      expect(count).toBe(2);
      expect(smsService.send).toHaveBeenCalledTimes(2);
      expect(smsService.send).toHaveBeenCalledWith(
        '+966500000000',
        expect.stringContaining('محمد'),
      );
      expect(smsService.send).toHaveBeenCalledWith(
        '+966500000000',
        expect.stringContaining('ABC 123'),
      );
      expect(smsService.send).toHaveBeenCalledWith(
        '+966500000000',
        expect.stringContaining('رحلة رقم 100'),
      );
    });

    it('يُرجع 0 لو لا توجد جهات', async () => {
      contactRepo.find.mockResolvedValue([]);
      const count = await service.shareTripWithContacts({
        ownerType: 'Rider',
        ownerId: 5,
        orderId: 100,
        destinationLat: 24,
        destinationLng: 46,
      });
      expect(count).toBe(0);
      expect(smsService.send).not.toHaveBeenCalled();
    });

    it('يفلتر بـ autoShareTrips=true (لا يرسل لكل الجهات)', async () => {
      contactRepo.find.mockResolvedValue([
        { id: 1, phoneNumber: '+966500000000', autoShareTrips: true } as EmergencyContactEntity,
      ]);

      await service.shareTripWithContacts({
        ownerType: 'Rider',
        ownerId: 5,
        orderId: 100,
        destinationLat: 24,
        destinationLng: 46,
      });

      expect(contactRepo.find).toHaveBeenCalledWith({
        where: { ownerType: 'Rider', ownerId: 5, autoShareTrips: true },
      });
    });
  });

  describe('getActiveSos', () => {
    it('يجلب الحادثة النشطة فقط', async () => {
      const active = { id: 10, status: SosStatus.Active } as SosIncidentEntity;
      sosRepo.findOne.mockResolvedValue(active);

      const result = await service.getActiveSos(SosTriggeredBy.Rider, 5);

      expect(result).toBe(active);
      expect(sosRepo.findOne).toHaveBeenCalledWith({
        where: {
          triggeredBy: SosTriggeredBy.Rider,
          triggeredById: 5,
          status: SosStatus.Active,
        },
      });
    });
  });
});
