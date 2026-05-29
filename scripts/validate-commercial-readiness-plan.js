#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const repoStatus = JSON.parse(readText('repo_status.json'));
const plan = readText('docs/PRODUCTION_BUILD_PLAN.md');
const workOrderReadme = readText('work_orders/README.md');
const agents = readText('AGENTS.md');
const specGaps = readText('SPEC_GAPS.md');
const runLog = readText('RUN_LOG.md');
const checkpointReport = readText('CHECKPOINT_REPORT.md');
const packageJson = JSON.parse(readText('package.json'));
const ci = readText('.github/workflows/ci.yml');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

const commercialWorkOrders = Array.from({ length: 16 }, (_, index) => `WO-${String(index + 60).padStart(3, '0')}`);
const checkpoints = ['CR-0', 'CR-1', 'CR-2', 'CR-3', 'CR-4'];
const commercialImplementationWorkOrders = commercialWorkOrders.slice(1);
const activeOrProgressedStatuses = ['todo', 'in_progress', 'done'];
const plannedOrProgressedStatuses = ['planned', ...activeOrProgressedStatuses];
const supportingDocs = [
  'docs/COMMERCIAL_READINESS_ROADMAP.md',
  'docs/COMMERCIAL_READINESS_DEFINITION_OF_DONE.md',
  'docs/REMAINING_SYNTHETIC_TO_RUNTIME_GAPS.md',
  'docs/FIGMA_HANDOFF_PLAN.md'
];
const prohibitedLaunchClaims = [
  'productionLaunchApproved=true',
  'productionLaunchReady=true',
  'livePhiEnabled=true',
  'liveExternalAiEnabled=true',
  'liveEhrWritebackEnabled=true',
  'liveClinicosSyncEnabled=true',
  'liveTranscriptionVendorEnabled=true',
  'claimSubmissionEnabled=true',
  'chargeFinalizationEnabled=true',
  'medicalNecessityDeterminationEnabled=true',
  'autonomousDiagnosisEnabled=true',
  'autonomousCodingFinalizationEnabled=true',
  'autonomousBillingEnabled=true',
  'patientFacingFinancialConclusionEnabled=true'
];

check(
  'status.mode',
  'Repo remains in production-build progress mode',
  repoStatus.mode === 'production_build_in_progress',
  repoStatus.mode
);

check(
  'status.checkpoint',
  'Current checkpoint is in the commercial-readiness CR sequence',
  checkpoints.includes(repoStatus.current_checkpoint),
  repoStatus.current_checkpoint
);

check(
  'status.next-work-order',
  'Next work order is in the commercial-readiness implementation sequence or null after completion',
  repoStatus.next_work_order === null || commercialImplementationWorkOrders.includes(repoStatus.next_work_order),
  repoStatus.next_work_order
);

check(
  'status.wo060-done',
  'WO-060 is marked done',
  repoStatus.work_orders?.['WO-060'] === 'done',
  repoStatus.work_orders?.['WO-060']
);

check(
  'status.wo061-active-or-progressed',
  'WO-061 has been promoted into active/progressed commercial implementation status',
  activeOrProgressedStatuses.includes(repoStatus.work_orders?.['WO-061']),
  repoStatus.work_orders?.['WO-061']
);

const plannedAfter061 = commercialWorkOrders.slice(2);
check(
  'status.future-planned-or-progressed',
  'WO-062 through WO-075 are planned or have progressed through the commercial sequence',
  plannedAfter061.every((workOrder) => plannedOrProgressedStatuses.includes(repoStatus.work_orders?.[workOrder])),
  plannedAfter061.map((workOrder) => [workOrder, repoStatus.work_orders?.[workOrder]])
);

commercialWorkOrders.forEach((workOrder) => {
  check(`plan.${workOrder}`, `${workOrder} appears in the production build plan`, plan.includes(`## ${workOrder} `), workOrder);
  check(`readme.${workOrder}`, `${workOrder} appears in the work-order README`, workOrderReadme.includes(workOrder), workOrder);
  check(`status.${workOrder}`, `${workOrder} appears in repo_status.json`, Boolean(repoStatus.work_orders?.[workOrder]), workOrder);
});

commercialImplementationWorkOrders.forEach((workOrder) => {
  const status = repoStatus.work_orders?.[workOrder];
  const promoted = activeOrProgressedStatuses.includes(status);
  const done = status === 'done';
  const workOrderFileExists = fs
    .readdirSync(path.join(root, 'work_orders'))
    .some((fileName) => fileName.startsWith(`${workOrder}_`) && fileName.endsWith('.md'));

  check(
    `evidence.${workOrder}.file-when-promoted`,
    `${workOrder} has a discoverable work-order file before it is active or done`,
    !promoted || workOrderFileExists,
    { workOrder, status, workOrderFileExists }
  );

  check(
    `evidence.${workOrder}.run-log-when-done`,
    `${workOrder} has RUN_LOG evidence before it can be marked done`,
    !done || runLog.includes(workOrder),
    { workOrder, status, runLogEvidence: runLog.includes(workOrder) }
  );
});

checkpoints.forEach((checkpoint) => {
  check(
    `checkpoint.${checkpoint}`,
    `${checkpoint} is documented in AGENTS, production plan, and checkpoint report`,
    agents.includes(checkpoint) && plan.includes(checkpoint) && checkpointReport.includes(checkpoint),
    checkpoint
  );
});

supportingDocs.forEach((relativePath) => {
  check(`doc.${relativePath}`, `${relativePath} exists`, exists(relativePath), relativePath);
});

check(
  'work-order.wo060-file',
  'WO-060 work-order file exists',
  exists('work_orders/WO-060_commercial_readiness_rebaseline_runtime_rails.md'),
  'work_orders/WO-060_commercial_readiness_rebaseline_runtime_rails.md'
);

check(
  'work-order.wo061-file',
  'WO-061 active next work-order file exists',
  exists('work_orders/WO-061_runtime_persistence_switchover_core_workflow.md'),
  'work_orders/WO-061_runtime_persistence_switchover_core_workflow.md'
);

check(
  'spec-gaps.current',
  'SPEC_GAPS reflects the post-WO-060 or later no-active-gap state',
  specGaps.includes('No active gaps as of post-`WO-060` commercial readiness rebaseline/runtime rails review') ||
    specGaps.includes('No active gaps as of post-`WO-061` runtime persistence switchover review') ||
    specGaps.includes('No active gaps as of post-`WO-062` API runtime hardening and request-boundary review'),
  'SPEC_GAPS.md'
);

check(
  'spec-gaps.deferred-commercial-readiness',
  'SPEC_GAPS tracks deferred commercial readiness and launch approval decisions',
  specGaps.includes('Deferred Decision — Commercial readiness implementation and launch approval'),
  'SPEC_GAPS.md'
);

check(
  'run-log.wo060',
  'RUN_LOG has WO-060 evidence',
  runLog.includes('WO-060 commercial readiness rebaseline and runtime rails') && runLog.includes('pnpm commercial:readiness-plan'),
  'RUN_LOG.md'
);

check(
  'checkpoint-report.cr0',
  'CHECKPOINT_REPORT records CR-0 evidence and next batch',
  checkpointReport.includes('CR-0 Commercial Readiness Rails Reopened') && checkpointReport.includes('WO-061'),
  'CHECKPOINT_REPORT.md'
);

check(
  'package.script',
  'package.json exposes pnpm commercial:readiness-plan',
  packageJson.scripts?.['commercial:readiness-plan'] === 'node scripts/validate-commercial-readiness-plan.js',
  packageJson.scripts?.['commercial:readiness-plan']
);

check(
  'ci.script',
  'CI runs pnpm commercial:readiness-plan',
  ci.includes('pnpm commercial:readiness-plan'),
  '.github/workflows/ci.yml'
);

check(
  'package.runtime-persistence-script',
  'package.json exposes pnpm runtime:persistence-readiness for WO-061',
  packageJson.scripts?.['runtime:persistence-readiness'] === 'node scripts/verify-runtime-persistence-readiness.js',
  packageJson.scripts?.['runtime:persistence-readiness']
);

check(
  'ci.runtime-persistence-script',
  'CI runs pnpm runtime:persistence-readiness after durable runtime evidence',
  ci.includes('pnpm runtime:persistence-readiness'),
  '.github/workflows/ci.yml'
);

check(
  'wo061.runtime-adapter-evidence',
  'WO-061 runtime persistence files exist before the work order can be marked done',
  repoStatus.work_orders?.['WO-061'] !== 'done' ||
    (exists('apps/api/src/schedule/runtime-persistence.repository.ts') &&
      exists('apps/api/src/schedule/runtime-persistence.repository.integration.test.ts') &&
      exists('scripts/verify-runtime-persistence-readiness.js') &&
      runLog.includes('pnpm runtime:persistence-readiness')),
  {
    status: repoStatus.work_orders?.['WO-061'],
    repository: exists('apps/api/src/schedule/runtime-persistence.repository.ts'),
    test: exists('apps/api/src/schedule/runtime-persistence.repository.integration.test.ts'),
    script: exists('scripts/verify-runtime-persistence-readiness.js'),
    runLogEvidence: runLog.includes('pnpm runtime:persistence-readiness')
  }
);

const launchClaimSources = [
  'docs/COMMERCIAL_READINESS_ROADMAP.md',
  'docs/COMMERCIAL_READINESS_DEFINITION_OF_DONE.md',
  'docs/REMAINING_SYNTHETIC_TO_RUNTIME_GAPS.md',
  'docs/FIGMA_HANDOFF_PLAN.md',
  'docs/PRODUCTION_BUILD_PLAN.md',
  'RUN_LOG.md',
  'SPEC_GAPS.md',
  'repo_status.json'
];
const prohibitedEvidence = [];
for (const relativePath of launchClaimSources) {
  const text = readText(relativePath);
  for (const marker of prohibitedLaunchClaims) {
    if (text.includes(marker)) {
      prohibitedEvidence.push({ relativePath, marker });
    }
  }
}
check(
  'no-launch-claim-markers',
  'Commercial readiness plan does not introduce affirmative launch/live/autonomy markers',
  prohibitedEvidence.length === 0,
  prohibitedEvidence
);

check(
  'not-production-ready-language',
  'Commercial readiness docs explicitly distinguish review readiness from production launch',
  readText('docs/COMMERCIAL_READINESS_ROADMAP.md').includes('not production launch') &&
    readText('docs/COMMERCIAL_READINESS_DEFINITION_OF_DONE.md').includes('does not mean `production-launch-ready`') &&
    plan.includes('not a production-readiness claim'),
  'commercial readiness docs'
);

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_commercial_readiness_plan' : 'blocked',
  checkedAt: new Date().toISOString(),
  nextWorkOrder: repoStatus.next_work_order,
  checkpoint: repoStatus.current_checkpoint,
  totalChecks: checks.length,
  passedChecks: checks.length - failed.length,
  failedChecks: failed.length,
  failures: failed,
  checks
};

console.log(JSON.stringify(result, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
