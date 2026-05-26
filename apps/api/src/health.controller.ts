import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      data: { status: 'ok', service: 'aura-note-api' },
      meta: { requestId: 'dev-health', mode: process.env.APP_MODE ?? 'standalone', generatedAt: new Date().toISOString() }
    };
  }
}
