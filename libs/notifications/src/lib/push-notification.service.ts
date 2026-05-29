import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseAdminService } from './firebase-admin.service';
import {
  Locale,
  NotificationTemplate,
  RenderedNotification,
  renderTemplate,
} from './notification-templates';

// ─── Result types ──────────────────────────────────────────────────────────

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  /** Set to true when delivery failed because the token is invalid/unregistered. */
  shouldClearToken?: boolean;
}

export interface MulticastResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

// ─── Service ──────────────────────────────────────────────────────────────

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(private readonly firebase: FirebaseAdminService) {}

  /**
   * Send a notification to a single device.
   * Caller is responsible for clearing the FCM token from DB when
   * `result.shouldClearToken === true`.
   */
  async sendToToken(
    fcmToken: string,
    template: NotificationTemplate,
    locale: Locale = 'ar',
  ): Promise<SendResult> {
    if (!this.firebase.enabled) {
      this.logger.debug(`[skip] Firebase disabled — would send to ${fcmToken.slice(0, 12)}…`);
      return { success: false, error: 'firebase_disabled' };
    }

    const rendered = renderTemplate(template, locale);
    const message = this.buildMessage(rendered, fcmToken);

    try {
      const messageId = await this.firebase.messaging().send(message);
      return { success: true, messageId };
    } catch (e) {
      const err = e as admin.FirebaseError;
      const shouldClear = this.isStaleTokenError(err);
      if (!shouldClear) {
        this.logger.warn(
          `FCM send failed for ${fcmToken.slice(0, 12)}…: ${err.code} ${err.message}`,
        );
      }
      return {
        success: false,
        error: err.code || err.message,
        shouldClearToken: shouldClear,
      };
    }
  }

  /**
   * Multi-token broadcast (up to 500 tokens per call).
   * Returns aggregated counts + invalid tokens to be purged from DB.
   */
  async sendToTokens(
    fcmTokens: string[],
    template: NotificationTemplate,
    locale: Locale = 'ar',
  ): Promise<MulticastResult> {
    if (!this.firebase.enabled) {
      this.logger.debug(`[skip] Firebase disabled — would broadcast to ${fcmTokens.length} tokens`);
      return { successCount: 0, failureCount: fcmTokens.length, invalidTokens: [] };
    }
    if (fcmTokens.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    const rendered = renderTemplate(template, locale);
    const message: admin.messaging.MulticastMessage = {
      tokens: fcmTokens,
      notification: { title: rendered.title, body: rendered.body },
      data: rendered.data,
      android: this.androidConfig(),
      apns: this.apnsConfig(rendered),
    };

    try {
      const res = await this.firebase.messaging().sendEachForMulticast(message);
      const invalidTokens: string[] = [];
      res.responses.forEach((resp, i) => {
        if (!resp.success && this.isStaleTokenError(resp.error)) {
          invalidTokens.push(fcmTokens[i]);
        }
      });
      return {
        successCount: res.successCount,
        failureCount: res.failureCount,
        invalidTokens,
      };
    } catch (e) {
      this.logger.error(`FCM multicast failed: ${(e as Error).message}`);
      return {
        successCount: 0,
        failureCount: fcmTokens.length,
        invalidTokens: [],
      };
    }
  }

  /** Send to a topic — e.g. "region:1" or "all_drivers" */
  async sendToTopic(
    topic: string,
    template: NotificationTemplate,
    locale: Locale = 'ar',
  ): Promise<SendResult> {
    if (!this.firebase.enabled) {
      return { success: false, error: 'firebase_disabled' };
    }

    const rendered = renderTemplate(template, locale);
    const message: admin.messaging.Message = {
      topic,
      notification: { title: rendered.title, body: rendered.body },
      data: rendered.data,
      android: this.androidConfig(),
      apns: this.apnsConfig(rendered),
    };

    try {
      const messageId = await this.firebase.messaging().send(message);
      return { success: true, messageId };
    } catch (e) {
      const err = e as admin.FirebaseError;
      return { success: false, error: err.code || err.message };
    }
  }

  /** Subscribe one or more tokens to a topic (max 1000 per call) */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.firebase.enabled || tokens.length === 0) return;
    try {
      await this.firebase.messaging().subscribeToTopic(tokens, topic);
    } catch (e) {
      this.logger.warn(`subscribeToTopic failed: ${(e as Error).message}`);
    }
  }

  /** Unsubscribe tokens from a topic */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.firebase.enabled || tokens.length === 0) return;
    try {
      await this.firebase.messaging().unsubscribeFromTopic(tokens, topic);
    } catch (e) {
      this.logger.warn(`unsubscribeFromTopic failed: ${(e as Error).message}`);
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private buildMessage(
    rendered: RenderedNotification,
    token: string,
  ): admin.messaging.Message {
    return {
      token,
      notification: { title: rendered.title, body: rendered.body },
      data: rendered.data,
      android: this.androidConfig(),
      apns: this.apnsConfig(rendered),
    };
  }

  private androidConfig(): admin.messaging.AndroidConfig {
    return {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'hancr_high_priority',
        // visible color matches our brand violet
        color: '#B048FF',
      },
    };
  }

  private apnsConfig(
    rendered: RenderedNotification,
  ): admin.messaging.ApnsConfig {
    return {
      headers: { 'apns-priority': '10' },
      payload: {
        aps: {
          alert: { title: rendered.title, body: rendered.body },
          sound: 'default',
          badge: 1,
        },
      },
    };
  }

  /** Firebase token-stale codes — these mean we should delete the token from DB */
  private isStaleTokenError(err: admin.FirebaseError | Error | undefined): boolean {
    if (!err) return false;
    const code = (err as admin.FirebaseError).code;
    return (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/invalid-argument'
    );
  }
}
