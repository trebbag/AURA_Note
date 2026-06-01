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

  @Get('runtime-boundary')
  getRuntimeBoundary(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.ehrService.getRuntimeBoundary(headers);
  }

  @Get('patients/search')
  searchPatients(
    @Query('safePatientId') safePatientId: string | undefined,
    @Query('externalPatientRef') externalPatientRef: string | undefined,
    @Query('searchToken') searchToken: string | undefined,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.ehrService.searchPatients(
      {
        ...(safePatientId ? { safePatientId } : {}),
        ...(externalPatientRef ? { externalPatientRef } : {}),
        ...(searchToken ? { searchToken } : {})
      },
      headers
    );
  }

  @Get('appointments/import')
  importAppointments(
    @Query('startIso') startIso: string | undefined,
    @Query('endIso') endIso: string | undefined,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.ehrService.importAppointments(startIso, endIso, headers);
  }

  @Get('encounters/:externalEncounterId')
  getEncounterContext(
    @Param('externalEncounterId') externalEncounterId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.ehrService.getEncounterContext(externalEncounterId, headers);
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
