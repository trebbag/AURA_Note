import { Controller, Get, Headers, Inject, Param, Query } from '@nestjs/common';
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
}
