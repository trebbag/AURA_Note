import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [ScheduleModule],
  controllers: [HealthController]
})
export class AppModule {}
