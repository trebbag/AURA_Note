import type { INestApplication } from '@nestjs/common';
import { AuraExceptionFilter } from './aura-exception.filter';
import { AuraRequestValidationPipe } from './aura-validation.pipe';
import {
  auraCorrelationMiddleware,
  auraRequestLimitMiddleware,
  auraRequestLoggingMiddleware,
  auraSecurityHeadersMiddleware,
  AURA_MAX_BODY_BYTES
} from './request-boundary.middleware';

export function configureAuraApi(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'content-type',
      'idempotency-key',
      'x-aura-role',
      'x-aura-tenant-id',
      'x-aura-site-id',
      'x-aura-user-id',
      'x-aura-session-id',
      'x-aura-purpose-of-use',
      'x-request-id',
      'x-trace-id',
      'x-aura-request-id',
      'x-aura-trace-id'
    ],
    exposedHeaders: [
      'x-aura-request-id',
      'x-aura-trace-id',
      'x-content-type-options',
      'x-ratelimit-limit',
      'x-ratelimit-remaining'
    ],
    credentials: false
  });

  app.use(auraRequestLimitMiddleware(AURA_MAX_BODY_BYTES));
  app.use(auraSecurityHeadersMiddleware);
  app.use(auraCorrelationMiddleware);
  app.use(auraRequestLoggingMiddleware);
  app.useGlobalPipes(new AuraRequestValidationPipe());
  app.useGlobalFilters(new AuraExceptionFilter());
}
