import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { HealthController } from './health.controller';
import { NotesModule } from './notes/notes.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [ScheduleModule, NotesModule, AiModule],
  controllers: [HealthController]
})
export class AppModule {}
