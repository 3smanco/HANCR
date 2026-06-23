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

export function buildGraphqlContext(
  source: GraphqlContextSource,
): HancrGraphqlContext {
  const req = source.req ?? source.request ?? source.extra?.request ?? {};
  const headers = { ...(req.headers ?? {}) };
  const authorization =
    firstHeader(headers['authorization']) ??
    firstHeader(headers['Authorization']) ??
    authFromConnectionParams(source.connectionParams);

  if (authorization) {
    headers['authorization'] = authorization;
  }

  req.headers = headers;
  return { req };
}
