import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { ApiErrorEnvelope } from '@aura-note/contracts';
import { redactForStructuredLog } from '@aura-note/security';
import { appendRuntimeLog, runtimeTimestamp } from './runtime-log';
import { getRuntimeIds, type RuntimeRequest, type RuntimeResponse } from './request-boundary.middleware';

type ExceptionResponseBody = string | { message?: unknown; error?: unknown; statusCode?: unknown; code?: unknown };

@Catch()
export class AuraExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RuntimeRequest>();
    const response = context.getResponse<RuntimeResponse>();
    const { requestId, traceId } = getRuntimeIds(request);
    const statusCode = this.statusCode(exception);
    const category = this.category(statusCode);
    const code = this.safeCode(exception, statusCode);
    const message = this.safeMessage(exception, statusCode);
    const details = this.safeDetails(exception);
    const timestamp = runtimeTimestamp();

    appendRuntimeLog({
      service: 'aura-note-api',
      level: statusCode >= 500 ? 'error' : 'warn',
      message: `request ${category}`,
      requestId,
      traceId,
      eventName: 'api.exception',
      timestamp,
      payload: {
        method: request.method,
        path: request.originalUrl ?? request.url,
        statusCode,
        category,
        error: message
      }
    });

    response.status(statusCode).json({
      error: {
        code,
        message,
        statusCode,
        category,
        requestId,
        traceId,
        redacted: true,
        ...(details !== undefined ? { details } : {})
      },
      meta: {
        requestId,
        traceId,
        mode: process.env.APP_MODE === 'clinicos_integrated' ? 'clinicos_integrated' : 'standalone',
        generatedAt: timestamp
      }
    } satisfies ApiErrorEnvelope);
  }

  private statusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private code(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.PAYLOAD_TOO_LARGE:
        return 'PAYLOAD_TOO_LARGE';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      default:
        return statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_FAILED';
    }
  }

  private safeCode(exception: unknown, statusCode: number): string {
    const response = this.responseBody(exception);
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      const code = (response as Record<string, unknown>).code;
      if (typeof code === 'string' && /^[A-Z0-9_:-]{3,80}$/.test(code)) {
        return code;
      }
    }
    return this.code(statusCode);
  }

  private category(statusCode: number): ApiErrorEnvelope['error']['category'] {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'validation';
      case HttpStatus.FORBIDDEN:
        return 'permission_denied';
      case HttpStatus.NOT_FOUND:
        return 'failed';
      case HttpStatus.PAYLOAD_TOO_LARGE:
        return 'request_too_large';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'throttled';
      case HttpStatus.CONFLICT:
        return 'blocked';
      case 423:
        return 'read_only';
      default:
        return 'failed';
    }
  }

  private safeMessage(exception: unknown, statusCode: number): string {
    if (statusCode >= 500) {
      return 'Request failed at the AURA Note API boundary.';
    }

    if (!(exception instanceof HttpException)) {
      return 'Request failed at the AURA Note API boundary.';
    }

    const response = exception.getResponse() as ExceptionResponseBody;
    const rawMessage =
      typeof response === 'string'
        ? response
        : Array.isArray(response.message)
          ? response.message.join('; ')
          : typeof response.message === 'string'
            ? response.message
            : exception.message;
    const redacted = redactForStructuredLog({ message: rawMessage });
    const value = redacted.value as { message?: unknown };
    return typeof value.message === 'string' ? value.message : 'Request failed validation.';
  }

  private safeDetails(exception: unknown): unknown | undefined {
    const response = this.responseBody(exception);
    if (!response || typeof response !== 'object' || Array.isArray(response)) {
      return undefined;
    }

    const body = response as Record<string, unknown>;
    const details: Record<string, unknown> = {};
    for (const key of ['code', 'rejectedPaths', 'auditEvent', 'domainEvents'] as const) {
      if (body[key] !== undefined) {
        details[key] = body[key];
      }
    }

    if (Object.keys(details).length === 0) {
      return undefined;
    }

    return redactForStructuredLog(details).value;
  }

  private responseBody(exception: unknown): ExceptionResponseBody | undefined {
    return exception instanceof HttpException ? (exception.getResponse() as ExceptionResponseBody) : undefined;
  }
}
