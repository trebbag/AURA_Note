import { Module } from '@nestjs/common';
import { OperationsModule } from '../operations/operations.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { AppShellController } from './app-shell.controller';
import { AppShellService } from './app-shell.service';

@Module({
  imports: [ScheduleModule, OperationsModule],
  controllers: [AppShellController],
  providers: [AppShellService],
  exports: [AppShellService]
})
export class AppShellModule {}
