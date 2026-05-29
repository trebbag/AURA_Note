import { Module } from '@nestjs/common';
import { InMemoryObjectStorageAdapter, type ObjectStorageAdapter } from '@aura-note/storage';
import { ScheduleController, StandalonePatientsController } from './schedule.controller';
import {
  SCHEDULE_STATE_REPOSITORY,
  createDemoScheduleStateRepository,
  resolveScheduleRuntimePersistencePlan,
  type ScheduleStateRepository
} from './schedule.repository';
import { ScheduleService } from './schedule.service';

const SCHEDULE_OBJECT_STORAGE_ADAPTER = Symbol('SCHEDULE_OBJECT_STORAGE_ADAPTER');

@Module({
  controllers: [ScheduleController, StandalonePatientsController],
  providers: [
    {
      provide: SCHEDULE_STATE_REPOSITORY,
      useFactory: () => {
        const plan = resolveScheduleRuntimePersistencePlan();
        if (plan.mode === 'prisma_local') {
          throw new Error(
            'AURA_NOTE_RUNTIME_PERSISTENCE=prisma_local uses the WO-061 async Prisma runtime readiness adapter; the Nest API runtime keeps explicit demo/test adapters until the async request boundary lands.'
          );
        }
        return createDemoScheduleStateRepository();
      }
    },
    {
      provide: SCHEDULE_OBJECT_STORAGE_ADAPTER,
      useFactory: () => new InMemoryObjectStorageAdapter()
    },
    {
      provide: ScheduleService,
      useFactory: (repository: ScheduleStateRepository, storage: ObjectStorageAdapter) => new ScheduleService(repository, storage),
      inject: [SCHEDULE_STATE_REPOSITORY, SCHEDULE_OBJECT_STORAGE_ADAPTER]
    }
  ],
  exports: [ScheduleService]
})
export class ScheduleModule {}
