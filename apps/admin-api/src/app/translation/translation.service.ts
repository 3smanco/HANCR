import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  ConversationMessage,
  DetectedScript,
  OrderConversation,
} from './dto/translation.types';

const TRANSLATION_ENV_KEY = 'TRANSLATION_API_KEY';

const ARABIC = /[؀-ۿݐ-ݿ]/;
const LATIN = /[A-Za-z]/;

/**
 * يكتشف النظام الكتابي الغالب لنصّ (تقريب خفيف بلا مكتبة خارجية). دالة نقيّة.
 * يَعُدّ حروف العربية مقابل اللاتينية ويرجّح الأكثر؛ unknown للنصّ بلا حروف.
 */
export function detectScript(text: string): DetectedScript {
  let ar = 0;
  let la = 0;
  for (const ch of text) {
    if (ARABIC.test(ch)) ar++;
    else if (LATIN.test(ch)) la++;
  }
  if (ar === 0 && la === 0) return 'unknown';
  if (ar > 0 && la === 0) return 'arabic';
  if (la > 0 && ar === 0) return 'latin';
  return ar >= la ? 'arabic' : 'latin';
}

/**
 * يحدّد النظام الغالب لمجموعة رسائل (تجاهل unknown). دالة نقيّة.
 */
export function dominantScript(
  scripts: DetectedScript[],
): DetectedScript | undefined {
  const counts = new Map<DetectedScript, number>();
  for (const s of scripts) {
    if (s === 'unknown') continue;
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  let best: DetectedScript | undefined;
  let max = 0;
  for (const [s, n] of counts) {
    if (n > max) {
      max = n;
      best = s;
    }
  }
  return best;
}

/**
 * تحتاج المحادثة ترجمة إن كان للطرفين نظامان معروفان ومختلفان. دالة نقيّة.
 */
export function needsTranslation(
  riderScript?: DetectedScript,
  driverScript?: DetectedScript,
): boolean {
  return (
    !!riderScript &&
    !!driverScript &&
    riderScript !== driverScript
  );
}

interface MsgRow {
  id: number;
  senderType: string;
  senderId: number;
  text: string;
  createdAt: Date;
}

/**
 * TranslationService — تحليل لغة محادثات الرحلات (تحسين Phase 9). scope-aware.
 * النداء الفعلي للترجمة محجوب بمفتاح المالك؛ هذه طبقة الكشف والجاهزية.
 */
@Injectable()
export class TranslationService {
  constructor(private readonly dataSource: DataSource) {}

  async orderConversation(
    orderId: number,
    allowedRegionIds: number[] | null,
  ): Promise<OrderConversation> {
    const orderRows = await this.dataSource.query<
      Array<{ id: number; regionId: number | null }>
    >(`SELECT id, region_id AS "regionId" FROM hancr_order WHERE id = $1`, [
      orderId,
    ]);
    const order = orderRows[0];
    if (!order) throw new NotFoundException(`Order #${orderId} not found`);
    if (
      allowedRegionIds &&
      (order.regionId == null || !allowedRegionIds.includes(order.regionId))
    ) {
      throw new NotFoundException('هذا الطلب خارج نطاقك');
    }

    const rows = await this.dataSource.query<MsgRow[]>(
      `SELECT id, sender_type AS "senderType", sender_id AS "senderId",
              text, created_at AS "createdAt"
       FROM hancr_order_message
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [orderId],
    );

    const messages: ConversationMessage[] = rows.map((m) => ({
      id: m.id,
      senderType: m.senderType,
      senderId: m.senderId,
      text: m.text,
      script: detectScript(m.text),
      createdAt: m.createdAt,
    }));

    const riderScript = dominantScript(
      messages
        .filter((m) => m.senderType === 'rider')
        .map((m) => m.script as DetectedScript),
    );
    const driverScript = dominantScript(
      messages
        .filter((m) => m.senderType === 'driver')
        .map((m) => m.script as DetectedScript),
    );

    const translationReady =
      !!process.env[TRANSLATION_ENV_KEY] &&
      process.env[TRANSLATION_ENV_KEY]!.trim().length > 0;

    return {
      orderId,
      messages,
      riderScript,
      driverScript,
      needsTranslation: needsTranslation(riderScript, driverScript),
      translationReady,
      translationEnvKey: TRANSLATION_ENV_KEY,
    };
  }
}
