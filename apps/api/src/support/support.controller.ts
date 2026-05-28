import { Body, Controller, Get, Headers, Inject, Param, Post } from '@nestjs/common';
import type { AuditExportRequestDto, SecureDownloadRequestDto } from '@aura-note/contracts';
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

  @Post('audit-exports/:auditExportId/download')
  deliverAuditExportDownload(
    @Param('auditExportId') auditExportId: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: SecureDownloadRequestDto
  ) {
    return this.supportService.deliverAuditExportDownload(auditExportId, body.signedDownloadToken, headers);
  }

  @Get('backup-restore/readiness')
  getBackupRestoreReadiness(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.supportService.getBackupRestoreReadiness(headers);
  }
}
