import { Module } from '@nestjs/common';
import { ClinicOsController } from './clinicos.controller';
import { ClinicOsService } from './clinicos.service';
import { EhrController } from './ehr.controller';
import { EhrService } from './ehr.service';

@Module({
  controllers: [EhrController, ClinicOsController],
  providers: [EhrService, ClinicOsService]
})
export class IntegrationsModule {}
