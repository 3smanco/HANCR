import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ConfigService } from "@nestjs/config";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { mkdir, rename, writeFile } from "fs/promises";
import { mkdirSync } from "fs";
import { dirname, join, normalize, posix, resolve, sep } from "path";

export type LocalUploadApiMount = "admin" | "driver" | "rider";

type LocalUploadTargetInput = {
  objectKey: string;
  contentType: string;
  apiMount: LocalUploadApiMount;
  expiresIn?: number;
};

type LocalUploadTarget = {
  uploadUrl: string;
  publicUrl: string;
  objectKey: string;
  expiresIn: number;
};

type UploadRequest = FastifyRequest<{
  Params: { "*": string };
  Querystring: {
    expires?: string;
    contentType?: string;
    signature?: string;
  };
}>;

const DEFAULT_EXPIRES_IN_SECONDS = 600;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export function buildLocalUploadTarget(
  cfg: ConfigService,
  input: LocalUploadTargetInput,
): LocalUploadTarget {
  const expiresIn = input.expiresIn ?? DEFAULT_EXPIRES_IN_SECONDS;
  const expires = Date.now() + expiresIn * 1000;
  const objectKey = normalizeObjectKey(input.objectKey);
  const contentType = normalizeContentType(input.contentType);
  const signature = signUpload(cfg, objectKey, contentType, expires);
  const apiBase = apiBaseUrl(cfg, input.apiMount);
  const publicUrl = joinUrl(apiBase, "uploads", objectKey);
  const uploadUrl = `${publicUrl}?expires=${expires}&contentType=${encodeURIComponent(
    contentType,
  )}&signature=${signature}`;

  return {
    uploadUrl,
    publicUrl,
    objectKey,
    expiresIn,
  };
}

export async function registerLocalUploads(
  app: NestFastifyApplication,
  cfg: ConfigService,
): Promise<void> {
  const root = uploadRoot(cfg);
  mkdirSync(root, { recursive: true });

  const fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
  addBinaryParser(fastify, /^image\/(jpeg|jpg|png|webp)$/);
  addBinaryParser(fastify, "application/pdf");

  fastify.put("/uploads/*", async (request: UploadRequest, reply) => {
    await handleLocalUpload(cfg, root, request, reply);
  });

  await app.register(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@fastify/static"),
    {
      root,
      prefix: "/uploads/",
      decorateReply: false,
      index: false,
      list: false,
      maxAge: "1d",
    },
  );
}

async function handleLocalUpload(
  cfg: ConfigService,
  root: string,
  request: UploadRequest,
  reply: FastifyReply,
): Promise<void> {
  const objectKey = normalizeObjectKey(request.params["*"] ?? "");
  const expires = Number(request.query.expires);
  const queryContentType = normalizeContentType(
    request.query.contentType ?? "",
  );
  const signature = request.query.signature ?? "";
  const headerContentType = normalizeContentType(
    String(request.headers["content-type"] ?? ""),
  );

  if (!Number.isFinite(expires) || expires <= Date.now()) {
    await reply.code(403).send({ message: "Upload URL expired" });
    return;
  }

  if (!ALLOWED_CONTENT_TYPES.has(queryContentType)) {
    await reply.code(400).send({ message: "Unsupported content type" });
    return;
  }

  if (headerContentType !== queryContentType) {
    await reply.code(400).send({ message: "Content type mismatch" });
    return;
  }

  if (
    !verifyUploadSignature(cfg, objectKey, queryContentType, expires, signature)
  ) {
    await reply.code(403).send({ message: "Invalid upload signature" });
    return;
  }

  if (!Buffer.isBuffer(request.body)) {
    await reply.code(400).send({ message: "Missing upload body" });
    return;
  }

  if (request.body.length === 0 || request.body.length > MAX_UPLOAD_BYTES) {
    await reply.code(413).send({ message: "Upload size is invalid" });
    return;
  }

  const filePath = resolveUploadPath(root, objectKey);
  await mkdir(dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.${Date.now()}-${randomBytes(4).toString(
    "hex",
  )}.tmp`;

  await writeFile(tmpPath, request.body, { flag: "wx" });
  await rename(tmpPath, filePath);
  await reply.code(204).send();
}

function addBinaryParser(
  fastify: FastifyInstance,
  contentType: string | RegExp,
): void {
  fastify.addContentTypeParser(
    contentType,
    { parseAs: "buffer", bodyLimit: MAX_UPLOAD_BYTES },
    (_request, body, done) => done(null, body),
  );
}

function signUpload(
  cfg: ConfigService,
  objectKey: string,
  contentType: string,
  expires: number,
): string {
  return createHmac("sha256", uploadSecret(cfg))
    .update(`${objectKey}\n${contentType}\n${expires}`)
    .digest("hex");
}

function verifyUploadSignature(
  cfg: ConfigService,
  objectKey: string,
  contentType: string,
  expires: number,
  signature: string,
): boolean {
  const expected = signUpload(cfg, objectKey, contentType, expires);
  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

function uploadSecret(cfg: ConfigService): string {
  const secret =
    cfg.get<string>("LOCAL_UPLOADS_SECRET") ??
    cfg.get<string>("UPLOADS_SIGNING_SECRET") ??
    cfg.get<string>("JWT_SECRET") ??
    cfg.get<string>("JWT_DRIVER_SECRET") ??
    cfg.get<string>("ADMIN_JWT_SECRET");

  if (secret) return secret;
  if ((cfg.get<string>("NODE_ENV") ?? "development") !== "production") {
    return "hancr-local-uploads-dev-secret";
  }
  throw new Error("LOCAL_UPLOADS_SECRET is required for local uploads");
}

function uploadRoot(cfg: ConfigService): string {
  return resolve(
    cfg.get<string>("LOCAL_UPLOADS_DIR") ??
      cfg.get<string>("UPLOADS_DIR") ??
      join(process.cwd(), "uploads"),
  );
}

function resolveUploadPath(root: string, objectKey: string): string {
  const filePath = resolve(root, normalize(objectKey));
  const rootWithSep = root.endsWith(sep) ? root : `${root}${sep}`;
  if (filePath !== root && !filePath.startsWith(rootWithSep)) {
    throw new Error("Invalid upload path");
  }
  return filePath;
}

function normalizeObjectKey(objectKey: string): string {
  const normalized = posix.normalize(objectKey.replace(/\\/g, "/"));
  if (
    !normalized ||
    normalized.startsWith("/") ||
    normalized.startsWith("../") ||
    normalized.includes("/../") ||
    !/^[a-zA-Z0-9/_\-.]+$/.test(normalized)
  ) {
    throw new Error("Invalid object key");
  }
  return normalized;
}

function normalizeContentType(value: string): string {
  return value.split(";", 1)[0].trim().toLowerCase();
}

function apiBaseUrl(cfg: ConfigService, apiMount: LocalUploadApiMount): string {
  const explicit = explicitApiBaseUrl(cfg, apiMount);
  if (explicit) return trimTrailingSlash(explicit);

  const root = cfg.get<string>("PUBLIC_BASE_URL");
  if (root) return joinUrl(root, apiMount);

  const port = {
    admin: cfg.get<number>("ADMIN_API_PORT") ?? 3002,
    driver: cfg.get<number>("DRIVER_API_PORT") ?? 3001,
    rider: cfg.get<number>("RIDER_API_PORT") ?? 3000,
  }[apiMount];

  return `http://localhost:${port}`;
}

function explicitApiBaseUrl(
  cfg: ConfigService,
  apiMount: LocalUploadApiMount,
): string | undefined {
  if (apiMount === "admin") {
    return (
      cfg.get<string>("PUBLIC_ADMIN_API_BASE_URL") ??
      stripGraphqlPath(cfg.get<string>("NEXT_PUBLIC_ADMIN_API_URL"))
    );
  }

  if (apiMount === "driver") {
    return (
      cfg.get<string>("PUBLIC_DRIVER_API_BASE_URL") ??
      stripGraphqlPath(cfg.get<string>("NEXT_PUBLIC_DRIVER_API_URL"))
    );
  }

  return (
    cfg.get<string>("PUBLIC_RIDER_API_BASE_URL") ??
    stripGraphqlPath(cfg.get<string>("NEXT_PUBLIC_RIDER_API_URL"))
  );
}

function stripGraphqlPath(value?: string): string | undefined {
  if (!value) return undefined;
  return value.replace(/\/graphql\/?$/i, "");
}

function joinUrl(base: string, ...parts: string[]): string {
  const cleanBase = trimTrailingSlash(base);
  const cleanParts = parts
    .flatMap((part) => part.split("/"))
    .filter(Boolean)
    .map((part) => encodeURIComponent(part));
  return [cleanBase, ...cleanParts].join("/");
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
