import { Body, Controller, Get, Headers, Inject, Post } from '@nestjs/common';
import type { ClinicOsEventPublishRequestDto, ClinicOsMappingUpsertRequestDto, ClinicOsMapVisitRequestDto } from '@aura-note/contracts';
import { ClinicOsService } from './clinicos.service';

@Controller('integrations/clinicos')
export class ClinicOsController {
  constructor(@Inject(ClinicOsService) private readonly clinicOsService: ClinicOsService) {}

  @Get('status')
  getStatus(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.clinicOsService.getStatus(headers);
  }

  @Post('map-visit')
  mapVisit(
    @Body() body: ClinicOsMapVisitRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.clinicOsService.mapVisit(body, headers);
  }

  @Post('mappings')
  upsertMapping(
    @Body() body: ClinicOsMappingUpsertRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.clinicOsService.upsertMapping(body, headers);
  }

  @Post('events/publish')
  publishEvent(
    @Body() body: ClinicOsEventPublishRequestDto,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.clinicOsService.publishEvent(body, headers);
  }
}
