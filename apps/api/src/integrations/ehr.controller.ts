import { Body, Controller, Get, Headers, Inject, Param, Post, Query } from '@nestjs/common';
import type { EhrWritebackQueueActionRequestDto } from '@aura-note/contracts';
import { EhrService } from './ehr.service';

@Controller('integrations/ehr')
export class EhrController {
  constructor(@Inject(EhrService) private readonly ehrService: EhrService) {}

  @Get('status')
  getStatus(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.ehrService.getStatus(headers);
  }

  @Get('chart-context/:safePatientId/:externalEncounterId')
  getChartContext(
    @Param('safePatientId') safePatientId: string,
    @Param('externalEncounterId') externalEncounterId: string,
    @Query('slices') slices: string | undefined,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.ehrService.getChartContext(safePatientId, externalEncounterId, slices, headers);
  }

  @Get('writeback-queue')
  listWritebackQueue(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.ehrService.listWritebackQueue(headers);
  }

  @Post('writeback-queue/:writebackJobId/actions')
  actOnWritebackJob(
    @Param('writebackJobId') writebackJobId: string,
    @Body() body: EhrWritebackQueueActionRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.ehrService.actOnWritebackJob(writebackJobId, body, headers);
  }
}
