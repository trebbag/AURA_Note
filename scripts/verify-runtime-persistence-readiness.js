#!/usr/bin/env node

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function run(command, args) {
  execFileSync(command, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_URL: 'postgresql://aura_note:aura_note@localhost:5432/aura_note_dev',
      AURA_NOTE_RUNTIME_PERSISTENCE: 'prisma_local'
    },
    stdio: 'inherit'
  });
}

const requiredNeedles = [
  ['work_orders/WO-061_runtime_persistence_switchover_core_workflow.md', 'AURA_NOTE_RUNTIME_PERSISTENCE=prisma_local'],
  ['apps/api/src/schedule/schedule.repository.ts', 'resolveScheduleRuntimePersistencePlan'],
  ['apps/api/src/schedule/runtime-persistence.repository.ts', 'createPrismaCoreWorkflowRuntimeRepository'],
  ['apps/api/src/schedule/runtime-persistence.repository.integration.test.ts', 'fresh repository instances'],
  ['docs/PRODUCTION_BUILD_PLAN.md', 'WO-061'],
  ['docs/REMAINING_SYNTHETIC_TO_RUNTIME_GAPS.md', 'WO-061']
];

const missing = requiredNeedles.filter(([relativePath, needle]) => !readText(relativePath).includes(needle));
if (missing.length > 0) {
  console.error(JSON.stringify({ status: 'blocked', missing }, null, 2));
  process.exit(1);
}

run('pnpm', ['db:client:generate']);
run('pnpm', ['--filter', '@aura-note/api', 'test:runtime-persistence-readiness']);

console.log(
  JSON.stringify(
    {
      status: 'ready_synthetic',
      checkedAt: new Date().toISOString(),
      evidenceType: 'live_local_postgres_core_workflow_runtime_repository_and_service_recreation',
      localPrismaRuntimeMode: 'prisma_local',
      liveDatabaseTouched: true,
      productionPhi: false,
      productionCredentials: false,
      liveVendorSyncTouched: false,
      liveAiTouched: false,
      claimSubmissionPerformed: false,
      autonomousClinicalCodingBillingBehavior: false
    },
    null,
    2
  )
);
