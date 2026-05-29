import type { ApiErrorEnvelope } from '@aura-note/contracts';
import { appendRuntimeLog, runtimeTimestamp } from './runtime-log';
import { getRuntimeIds, type RuntimeRequest, type RuntimeResponse } from './request-boundary.middleware';
import { evaluateIdentityRuntimeBoundary } from './identity-runtime';

type NextFunction = (error?: unknown) => void;

export function auraIdentityRuntimeMiddleware(request: RuntimeRequest, response: RuntimeResponse, next: NextFunction): void {
  const { requestId, traceId } = getRuntimeIds(request);
  const path = request.originalUrl ?? request.url ?? '';
  const decision = evaluateIdentityRuntimeBoundary({
    headers: request.headers,
    path,
    env: process.env
  });

  response.setHeader('x-aura-auth-mode', decision.authMode);
  response.setHeader('x-aura-identity-source', decision.identitySource);

  appendRuntimeLog({
    service: 'aura-note-api',
    level: decision.allowed ? 'info' : 'warn',
    message: decision.allowed ? 'identity runtime accepted' : 'identity runtime denied',
    requestId,
    traceId,
    eventName: decision.allowed ? 'identity.accepted' : 'identity.denied',
    timestamp: runtimeTimestamp(),
    payload: {
      method: request.method,
      path,
      authMode: decision.authMode,
      identitySource: decision.identitySource,
      failureReason: decision.failureReason ?? null,
      liveCredentialPresent: false,
      delegatedIdentityConfigured: false
    }
  });

  if (!decision.allowed) {
    response.status(decision.statusCode).json({
      error: {
        code: decision.code,
        message: decision.message,
        statusCode: decision.statusCode,
        category: decision.statusCode === 400 ? 'validation' : 'permission_denied',
        requestId,
        traceId,
        redacted: true,
        details: decision.details
      },
      meta: {
        requestId,
        traceId,
        mode: process.env.APP_MODE === 'clinicos_integrated' ? 'clinicos_integrated' : 'standalone',
        generatedAt: runtimeTimestamp()
      }
    } satisfies ApiErrorEnvelope);
    return;
  }

  for (const [key, value] of Object.entries(decision.normalizedHeaders)) {
    request.headers[key] = value;
  }

  next();
}
