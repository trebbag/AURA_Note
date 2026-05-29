import { Controller, Get, Headers } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health(@Headers() headers: Record<string, string | string[] | undefined>) {
    const requestId = headerValue(headers['x-request-id']) ?? 'dev-health';
    const traceId = headerValue(headers['x-trace-id']) ?? 'dev-health-trace';
    return {
      data: { status: 'ok', service: 'aura-note-api' },
      meta: {
        requestId,
        traceId,
        mode: process.env.APP_MODE === 'clinicos_integrated' ? 'clinicos_integrated' : 'standalone',
        generatedAt: new Date().toISOString()
      }
    };
  }
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
