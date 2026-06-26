type HeaderValue = string | string[] | undefined;

export interface GraphqlRequestLike {
  headers?: Record<string, HeaderValue>;
  user?: unknown;
  [key: string]: unknown;
}

export interface GraphqlContextSource {
  req?: GraphqlRequestLike;
  request?: GraphqlRequestLike;
  connectionParams?: Record<string, unknown>;
  extra?: {
    request?: GraphqlRequestLike;
  };
}

export interface HancrGraphqlContext {
  req: GraphqlRequestLike;
}

function firstHeader(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const first = value.find((item): item is string => typeof item === 'string');
    return first?.trim() || undefined;
  }
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function authFromConnectionParams(
  params: Record<string, unknown> | undefined,
): string | undefined {
  if (!params) return undefined;
  return (
    firstHeader(params['authorization']) ??
    firstHeader(params['Authorization'])
  );
}

function isObject(o: unknown): o is Record<string, unknown> {
  return !!o && typeof o === 'object';
}

/**
 * يطبّع ترويسات الطلب لكائن عادي بمفاتيح صغيرة (lowercase).
 * يدعم: كائن Express العادي، وكائن Headers (Fetch API — تستخدمه Apollo Server v5)
 * الذي لا يُقرأ بالأقواس بل بـ get()/forEach() — وهذا كان سبب فشل استخراج التوكن.
 */
function normalizeHeaders(rawHeaders: unknown): Record<string, HeaderValue> {
  const out: Record<string, HeaderValue> = {};
  if (!isObject(rawHeaders)) return out;
  const maybeHeaders = rawHeaders as {
    forEach?: (cb: (v: string, k: string) => void) => void;
    get?: (k: string) => unknown;
  };
  if (
    typeof maybeHeaders.forEach === 'function' &&
    typeof maybeHeaders.get === 'function'
  ) {
    // Fetch API Headers instance
    maybeHeaders.forEach((v, k) => {
      out[String(k).toLowerCase()] = v;
    });
    return out;
  }
  for (const [k, v] of Object.entries(rawHeaders as Record<string, HeaderValue>)) {
    out[k.toLowerCase()] = v;
  }
  return out;
}

export function buildGraphqlContext(
  source: GraphqlContextSource,
): HancrGraphqlContext {
  // Apollo Server v5 / @nestjs/apollo v13: الطلب قد يصل بأشكال مختلفة (req/request/
  // extra.request/contextValue.req/raw)، أو يكون المصدر نفسه هو الطلب.
  const s = (source ?? {}) as Record<string, unknown>;
  const reqCandidate =
    (s['req'] as GraphqlRequestLike | undefined) ??
    (s['request'] as GraphqlRequestLike | undefined) ??
    ((s['extra'] as { request?: GraphqlRequestLike } | undefined)?.request) ??
    ((s['contextValue'] as { req?: GraphqlRequestLike } | undefined)?.req) ??
    (s['raw'] as GraphqlRequestLike | undefined) ??
    (isObject(s) && 'headers' in s ? (s as unknown as GraphqlRequestLike) : undefined) ??
    ({} as GraphqlRequestLike);
  const req = reqCandidate as GraphqlRequestLike & { raw?: { headers?: unknown } };

  const headers = normalizeHeaders(req.headers ?? req.raw?.headers);

  const authorization =
    firstHeader(headers['authorization']) ??
    authFromConnectionParams(source?.connectionParams);

  if (authorization) {
    headers['authorization'] = authorization;
  }

  // سجل تأكيد مؤقّت (CTXDBG) — يُزال بعد تأكيد عمل الدخول.
  try {
    // eslint-disable-next-line no-console
    console.error(
      '[CTXDBG] srcKeys=', Object.keys(s),
      'headerKeys=', Object.keys(headers).slice(0, 20),
      'authPresent=', !!authorization,
    );
  } catch {
    /* noop */
  }

  req.headers = headers;
  return { req };
}
