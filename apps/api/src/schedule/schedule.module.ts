import { Module } from '@nestjs/common';
import { ScheduleController, StandalonePatientsController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  controllers: [ScheduleController, StandalonePatientsController],
  providers: [ScheduleService],
  exports: [ScheduleService]
})
export class ScheduleModule {}
