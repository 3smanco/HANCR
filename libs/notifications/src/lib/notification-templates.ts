/**
 * Multilingual notification templates.
 *
 * Convention: each template has `ar` + `en` versions with placeholder substitution.
 * Add a new template by extending the discriminated union below.
 */

export type Locale = 'ar' | 'en';

// ─── Template definitions ──────────────────────────────────────────────────

export interface OrderAssignedTpl {
  type: 'order_assigned';
  driverName: string;
  carPlate: string;
  etaMinutes: number;
}

export interface OrderArrivedTpl {
  type: 'order_arrived';
  driverName: string;
}

export interface OrderStartedTpl {
  type: 'order_started';
  destinationAddress: string;
}

export interface OrderCompletedTpl {
  type: 'order_completed';
  amount: number;
  currency: string;
}

export interface OrderCanceledTpl {
  type: 'order_canceled';
  reason: string;
}

export interface NewOrderForDriverTpl {
  type: 'new_order_for_driver';
  estimatedFare: number;
  currency: string;
  pickup: string;
}

export interface PromoTpl {
  type: 'promo';
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}

export interface CustomTpl {
  type: 'custom';
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  data?: Record<string, string>;
}

export type NotificationTemplate =
  | OrderAssignedTpl
  | OrderArrivedTpl
  | OrderStartedTpl
  | OrderCompletedTpl
  | OrderCanceledTpl
  | NewOrderForDriverTpl
  | PromoTpl
  | CustomTpl;

// ─── Rendered output ───────────────────────────────────────────────────────

export interface RenderedNotification {
  title: string;
  body: string;
  /** Custom key-value payload sent with the FCM message. */
  data: Record<string, string>;
}

// ─── Renderer ──────────────────────────────────────────────────────────────

export function renderTemplate(
  tpl: NotificationTemplate,
  locale: Locale = 'ar',
): RenderedNotification {
  const ar = locale === 'ar';

  switch (tpl.type) {
    case 'order_assigned':
      return {
        title: ar ? 'تم تعيين سائق 🚗' : 'Driver assigned 🚗',
        body: ar
          ? `${tpl.driverName} في الطريق إليك — يصل خلال ${tpl.etaMinutes} د (${tpl.carPlate})`
          : `${tpl.driverName} is on the way — arriving in ${tpl.etaMinutes} min (${tpl.carPlate})`,
        data: { type: tpl.type, plate: tpl.carPlate, eta: String(tpl.etaMinutes) },
      };

    case 'order_arrived':
      return {
        title: ar ? 'السائق وصل 📍' : 'Driver arrived 📍',
        body: ar
          ? `${tpl.driverName} وصل إلى نقطة الالتقاء`
          : `${tpl.driverName} has arrived at the pickup point`,
        data: { type: tpl.type },
      };

    case 'order_started':
      return {
        title: ar ? 'بدأت الرحلة ▶️' : 'Trip started ▶️',
        body: ar
          ? `أنت في الطريق إلى ${tpl.destinationAddress}`
          : `You're on your way to ${tpl.destinationAddress}`,
        data: { type: tpl.type, destination: tpl.destinationAddress },
      };

    case 'order_completed':
      return {
        title: ar ? 'الرحلة اكتملت ✅' : 'Trip completed ✅',
        body: ar
          ? `المبلغ: ${tpl.amount.toFixed(0)} ${tpl.currency} — قيّم رحلتك الآن`
          : `Amount: ${tpl.amount.toFixed(0)} ${tpl.currency} — rate your trip now`,
        data: {
          type: tpl.type,
          amount: String(tpl.amount),
          currency: tpl.currency,
        },
      };

    case 'order_canceled':
      return {
        title: ar ? 'تم إلغاء الرحلة' : 'Trip canceled',
        body: ar ? `السبب: ${tpl.reason}` : `Reason: ${tpl.reason}`,
        data: { type: tpl.type, reason: tpl.reason },
      };

    case 'new_order_for_driver':
      return {
        title: ar ? 'طلب جديد! 💰' : 'New order! 💰',
        body: ar
          ? `${tpl.estimatedFare.toFixed(0)} ${tpl.currency} — من ${tpl.pickup}`
          : `${tpl.estimatedFare.toFixed(0)} ${tpl.currency} — from ${tpl.pickup}`,
        data: {
          type: tpl.type,
          fare: String(tpl.estimatedFare),
          pickup: tpl.pickup,
        },
      };

    case 'promo':
      return {
        title: ar ? tpl.titleAr : tpl.titleEn,
        body: ar ? tpl.bodyAr : tpl.bodyEn,
        data: { type: tpl.type },
      };

    case 'custom':
      return {
        title: ar ? tpl.titleAr : tpl.titleEn,
        body: ar ? tpl.bodyAr : tpl.bodyEn,
        data: { type: tpl.type, ...(tpl.data ?? {}) },
      };
  }
}
