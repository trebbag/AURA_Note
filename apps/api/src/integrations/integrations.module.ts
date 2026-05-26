import { Module } from '@nestjs/common';
import { EhrController } from './ehr.controller';
import { EhrService } from './ehr.service';

@Module({
  controllers: [EhrController],
  providers: [EhrService]
})
export class IntegrationsModule {}
