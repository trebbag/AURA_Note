import { randomUUID } from 'node:crypto';
import { HttpStatus } from '@nestjs/common';
import { appendRuntimeLog, runtimeTimestamp } from './runtime-log';

export const AURA_MAX_BODY_BYTES = 32 * 1024;
export const AURA_MAX_BODY_SIZE = '32kb';

const idPattern = /^[A-Za-z0-9._:-]{3,128}$/;
const rateBuckets = new Map<string, { windowStartedAt: number; count: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 600;

export interface RuntimeRequest {
  method?: string;
  url?: string;
  originalUrl?: string;
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface RuntimeResponse {
  statusCode: number;
  setHeader(name: string, value: string | number | readonly string[]): void;
  status(statusCode: number): { json(payload: unknown): void };
  on(event: 'finish', listener: () => void): void;
}

type NextFunction = (error?: unknown) => void;

export function getRuntimeIds(request: RuntimeRequest): { requestId: string; traceId: string } {
  return {
    requestId: headerValue(request.headers['x-request-id']) ?? headerValue(request.headers['x-aura-request-id']) ?? 'req-unavailable',
    traceId: headerValue(request.headers['x-trace-id']) ?? headerValue(request.headers['x-aura-trace-id']) ?? 'trace-unavailable'
  };
}

export function auraRequestLimitMiddleware(maxBytes: number) {
  return (request: RuntimeRequest, response: RuntimeResponse, next: NextFunction): void => {
    const contentLength = Number(headerValue(request.headers['content-length']) ?? 0);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      const { requestId, traceId } = ensureRuntimeIds(request, response);
      response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request body exceeds the AURA Note API boundary size limit.',
          statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
          category: 'request_too_large',
          requestId,
          traceId,
          redacted: true
        },
        meta: {
          requestId,
          traceId,
          mode: process.env.APP_MODE === 'clinicos_integrated' ? 'clinicos_integrated' : 'standalone',
          generatedAt: runtimeTimestamp()
        }
      });
      return;
    }
    next();
  };
}

export function auraSecurityHeadersMiddleware(_request: RuntimeRequest, response: RuntimeResponse, next: NextFunction): void {
  response.setHeader('x-content-type-options', 'nosniff');
  response.setHeader('x-frame-options', 'DENY');
  response.setHeader('referrer-policy', 'no-referrer');
  response.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('cache-control', 'no-store');
  next();
}

export function auraCorrelationMiddleware(request: RuntimeRequest, response: RuntimeResponse, next: NextFunction): void {
  const requestId = sanitizeId(headerValue(request.headers['x-request-id']) ?? headerValue(request.headers['x-aura-request-id'])) ?? `req-${randomUUID()}`;
  const traceId = sanitizeId(headerValue(request.headers['x-trace-id']) ?? headerValue(request.headers['x-aura-trace-id'])) ?? `trace-${randomUUID()}`;

  request.headers['x-request-id'] = requestId;
  request.headers['x-aura-request-id'] = requestId;
  request.headers['x-trace-id'] = traceId;
  request.headers['x-aura-trace-id'] = traceId;
  response.setHeader('x-aura-request-id', requestId);
  response.setHeader('x-aura-trace-id', traceId);

  next();
}

export function auraRequestLoggingMiddleware(request: RuntimeRequest, response: RuntimeResponse, next: NextFunction): void {
  const startedAt = Date.now();
  const rate = updateRateLimitBucket(request, response);
  response.on('finish', () => {
    const { requestId, traceId } = getRuntimeIds(request);
    appendRuntimeLog({
      service: 'aura-note-api',
      level: response.statusCode >= 500 ? 'error' : response.statusCode >= 400 ? 'warn' : 'info',
      message: 'request completed',
      requestId,
      traceId,
      eventName: 'api.request_completed',
      timestamp: runtimeTimestamp(),
      payload: {
        method: request.method,
        path: request.originalUrl ?? request.url,
        statusCode: response.statusCode,
        durationMs: Date.now() - startedAt,
        rateLimit: rate
      }
    });
  });
  next();
}

function updateRateLimitBucket(request: RuntimeRequest, response: RuntimeResponse): { limit: number; remaining: number } {
  const now = Date.now();
  const key = `${request.ip ?? 'local'}:${request.method ?? 'GET'}:${request.originalUrl ?? request.url ?? '/'}`;
  const current = rateBuckets.get(key);
  const bucket =
    current && now - current.windowStartedAt < RATE_LIMIT_WINDOW_MS
      ? { windowStartedAt: current.windowStartedAt, count: current.count + 1 }
      : { windowStartedAt: now, count: 1 };
  rateBuckets.set(key, bucket);
  const remaining = Math.max(RATE_LIMIT_MAX_REQUESTS - bucket.count, 0);
  response.setHeader('x-ratelimit-limit', RATE_LIMIT_MAX_REQUESTS);
  response.setHeader('x-ratelimit-remaining', remaining);
  return { limit: RATE_LIMIT_MAX_REQUESTS, remaining };
}

function ensureRuntimeIds(request: RuntimeRequest, response: RuntimeResponse): { requestId: string; traceId: string } {
  const requestId = sanitizeId(headerValue(request.headers['x-request-id']) ?? headerValue(request.headers['x-aura-request-id'])) ?? `req-${randomUUID()}`;
  const traceId = sanitizeId(headerValue(request.headers['x-trace-id']) ?? headerValue(request.headers['x-aura-trace-id'])) ?? `trace-${randomUUID()}`;
  request.headers['x-request-id'] = requestId;
  request.headers['x-aura-request-id'] = requestId;
  request.headers['x-trace-id'] = traceId;
  request.headers['x-aura-trace-id'] = traceId;
  response.setHeader('x-aura-request-id', requestId);
  response.setHeader('x-aura-trace-id', traceId);
  return { requestId, traceId };
}

function sanitizeId(value: string | undefined): string | undefined {
  if (!value || !idPattern.test(value)) return undefined;
  return value;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
