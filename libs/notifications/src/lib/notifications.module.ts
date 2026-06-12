import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAdminService } from './firebase-admin.service';
import { PushNotificationService } from './push-notification.service';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';

/**
 * NotificationsModule — يوفِّر:
 *  - `FirebaseAdminService` — تهيئة Firebase Admin SDK
 *  - `PushNotificationService` — إرسال push عبر FCM
 *  - `SmsService` — إرسال SMS عبر Twilio
 *  - `EmailService` — إرسال البريد عبر SMTP (دخول بالإيميل)
 *
 * `@Global()` لأنه يُستخدم في كل الـ APIs بدون استيراد مكرر.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    FirebaseAdminService,
    PushNotificationService,
    SmsService,
    EmailService,
  ],
  exports: [
    FirebaseAdminService,
    PushNotificationService,
    SmsService,
    EmailService,
  ],
})
export class NotificationsModule {}
