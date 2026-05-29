// =============================================
// @hancr/notifications — Push (FCM) + SMS (Twilio)
// =============================================

export { NotificationsModule } from './lib/notifications.module';
export { FirebaseAdminService } from './lib/firebase-admin.service';
export {
  PushNotificationService,
  type SendResult,
  type MulticastResult,
} from './lib/push-notification.service';
export { SmsService, type SmsResult } from './lib/sms.service';
export {
  renderTemplate,
  type NotificationTemplate,
  type RenderedNotification,
  type Locale,
} from './lib/notification-templates';
