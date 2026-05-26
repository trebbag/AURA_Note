import { Body, Controller, Get, Headers, Inject, Post } from '@nestjs/common';
import type { AuditExportRequestDto } from '@aura-note/contracts';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(@Inject(SupportService) private readonly supportService: SupportService) {}

  @Get('status')
  getStatus(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.supportService.getStatus(headers);
  }

  @Post('audit-exports')
  requestAuditExport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: AuditExportRequestDto
  ) {
    return this.supportService.requestAuditExport(headers, body);
  }
}
