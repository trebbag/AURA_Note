import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { CoachingModule } from './coaching/coaching.module';
import { HealthController } from './health.controller';
import { IntegrationsModule } from './integrations/integrations.module';
import { NotesModule } from './notes/notes.module';
import { ScheduleModule } from './schedule/schedule.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [ScheduleModule, NotesModule, AiModule, IntegrationsModule, CoachingModule, SupportModule],
  controllers: [HealthController]
})
export class AppModule {}
