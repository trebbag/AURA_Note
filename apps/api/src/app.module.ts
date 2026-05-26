import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { NotesModule } from './notes/notes.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [ScheduleModule, NotesModule],
  controllers: [HealthController]
})
export class AppModule {}
