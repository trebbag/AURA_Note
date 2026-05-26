import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { HealthController } from './health.controller';
import { IntegrationsModule } from './integrations/integrations.module';
import { NotesModule } from './notes/notes.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [ScheduleModule, NotesModule, AiModule, IntegrationsModule],
  controllers: [HealthController]
})
export class AppModule {}
