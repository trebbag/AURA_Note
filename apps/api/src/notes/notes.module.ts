import { Module } from '@nestjs/common';
import { ScheduleModule } from '../schedule/schedule.module';
import { NotesController } from './notes.controller';

@Module({
  imports: [ScheduleModule],
  controllers: [NotesController]
})
export class NotesModule {}
