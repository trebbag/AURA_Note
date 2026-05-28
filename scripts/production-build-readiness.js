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
const runLog = readText('RUN_LOG.md');
const specGaps = readText('SPEC_GAPS.md');
const plan = readText('docs/PRODUCTION_BUILD_PLAN.md');
const workOrderReadme = readText('work_orders/README.md');
const checkpointReport = readText('CHECKPOINT_REPORT.md');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

const completedBaseline = Array.from({ length: 33 }, (_, index) => `WO-${String(index).padStart(3, '0')}`);
const futureWorkOrders = Array.from({ length: 19 }, (_, index) => `WO-${String(index + 33).padStart(3, '0')}`);
const knownStatuses = new Set(['done', 'todo', 'planned', 'in_progress', 'blocked']);
const checkpointNeedles = ['P6.5', 'P7', 'P7.5', 'P8', 'P8.5', 'P9', 'P10', 'P11'];
const requiredFields = [
  'Objective',
  'Why this exists',
  'Prerequisites',
  'In scope',
  'Out of scope',
  'UX requirements',
  'Backend/API requirements',
  'Data model/persistence requirements',
  'Event/audit requirements',
  'RBAC/ABAC requirements',
  'Standalone-mode behavior',
  'ClinicOS-integrated behavior',
  'AI/PHI/security requirements',
  'Testing requirements',
  'Required scripts/gates',
  'Definition of Done',
  'Stop conditions',
  'Risks and deferred decisions'
];

check(
  'status.mode.production-build',
  'Repo status is in a production-build mode without claiming launch readiness',
  ['production_build_planned', 'production_build_in_progress'].includes(repoStatus.mode),
  repoStatus.mode
);

check(
  'status.baseline-complete',
  'WO-000 through WO-032 remain complete',
  completedBaseline.every((workOrder) => repoStatus.work_orders?.[workOrder] === 'done'),
  completedBaseline.filter((workOrder) => repoStatus.work_orders?.[workOrder] !== 'done')
);

check(
  'status.future-present',
  'WO-033 through WO-051 are represented in repo_status.json',
  futureWorkOrders.every((workOrder) => repoStatus.work_orders?.[workOrder]),
  futureWorkOrders.filter((workOrder) => !repoStatus.work_orders?.[workOrder])
);

check(
  'status.values-known',
  'All work-order statuses use known lifecycle values',
  Object.entries(repoStatus.work_orders ?? {}).every(([, status]) => knownStatuses.has(status)),
  Object.entries(repoStatus.work_orders ?? {}).filter(([, status]) => !knownStatuses.has(status))
);

const activeCandidates = Object.entries(repoStatus.work_orders ?? {}).filter(([, status]) => ['todo', 'in_progress'].includes(status));
check(
  'status.next-work-order',
  'next_work_order points to the first active todo/in-progress work order',
  activeCandidates.length > 0 && repoStatus.next_work_order === activeCandidates[0][0],
  { nextWorkOrder: repoStatus.next_work_order, activeCandidates }
);

const doneFutureWithoutRunLog = Object.entries(repoStatus.work_orders ?? {})
  .filter(([workOrder, status]) => status === 'done' && Number(workOrder.slice(3)) > 32 && !runLog.includes(workOrder))
  .map(([workOrder]) => workOrder);
check(
  'done-future.runlog-evidence',
  'Future work orders marked done have RUN_LOG evidence',
  doneFutureWithoutRunLog.length === 0,
  doneFutureWithoutRunLog
);

const doneFutureWithoutWorkOrderFile = Object.entries(repoStatus.work_orders ?? {})
  .filter(([workOrder, status]) => status === 'done' && Number(workOrder.slice(3)) > 32)
  .map(([workOrder]) => workOrder)
  .filter((workOrder) => !fs.readdirSync(path.join(root, 'work_orders')).some((file) => file.startsWith(`${workOrder}_`)));
check(
  'done-future.work-order-file',
  'Future work orders marked done have a work-order file',
  doneFutureWithoutWorkOrderFile.length === 0,
  doneFutureWithoutWorkOrderFile
);

check('work-order.active-file', 'Active next work order file exists', fs.readdirSync(path.join(root, 'work_orders')).some((file) => file.startsWith(`${repoStatus.next_work_order}_`)), repoStatus.next_work_order);

futureWorkOrders.forEach((workOrder) => {
  check(`plan.${workOrder}`, `${workOrder} appears in the production build plan`, plan.includes(`## ${workOrder} `), `docs/PRODUCTION_BUILD_PLAN.md contains ${workOrder}`);
  check(`readme.${workOrder}`, `${workOrder} appears in the work-order index`, workOrderReadme.includes(workOrder), `work_orders/README.md contains ${workOrder}`);
});

requiredFields.forEach((field) => {
  check(`plan.field.${field.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `Production plan includes field: ${field}`, plan.includes(`**${field}:**`) || plan.includes(`**${field}**`), field);
});

futureWorkOrders.forEach((workOrder, index) => {
  const nextWorkOrder = futureWorkOrders[index + 1];
  const sectionStart = plan.indexOf(`## ${workOrder} `);
  const sectionEnd = nextWorkOrder ? plan.indexOf(`## ${nextWorkOrder} `) : plan.length;
  const section = sectionStart >= 0 && sectionEnd > sectionStart ? plan.slice(sectionStart, sectionEnd) : '';
  const missingFields = requiredFields.filter((field) => !section.includes(`**${field}:**`) && !section.includes(`**${field}**`));

  check(
    `plan.${workOrder}.required-fields`,
    `${workOrder} section includes all required work-order fields`,
    section.length > 0 && missingFields.length === 0,
    missingFields
  );
});

checkpointNeedles.forEach((checkpoint) => {
  check(`checkpoint.${checkpoint}`, `${checkpoint} checkpoint is documented`, plan.includes(checkpoint) && readText('AGENTS.md').includes(checkpoint), checkpoint);
});

check(
  'spec-gaps.active-none-current',
  'SPEC_GAPS explicitly reflects no active gaps after the latest production-build rails review',
    specGaps.includes('No active gaps as of post-`WO-032` / production-build re-rail review') ||
    specGaps.includes('No active gaps as of post-`WO-038` standalone patient/chart/schedule review') ||
    specGaps.includes('No active gaps as of post-`WO-039` standalone operations and P7.5 review') ||
    specGaps.includes('No active gaps as of post-`WO-040` browser audio capture and transcription candidate / P8.5 review') ||
    specGaps.includes('No active gaps as of post-`WO-041` production identity/config governance review') ||
    specGaps.includes('No active gaps as of post-`WO-042` secure storage/download/retention/restore controls review'),
  'SPEC_GAPS.md active gaps section'
);

check(
  'spec-gaps.deferred-decisions',
  'SPEC_GAPS lists deferred production decisions',
  specGaps.includes('## Deferred production decisions') && specGaps.includes('Claim submission'),
  'SPEC_GAPS.md deferred decisions section'
);

check(
  'acceptance.synthetic-only',
  'Acceptance readiness script distinguishes synthetic baseline from production launch readiness',
  readText('scripts/acceptance-readiness.js').includes('synthetic-work-orders-done') &&
    readText('scripts/acceptance-readiness.js').includes('not a production launch claim'),
  'scripts/acceptance-readiness.js'
);

check(
  'checkpoint.p65-evidence',
  'P6.5 checkpoint evidence is recorded',
  checkpointReport.includes('P6.5') && checkpointReport.includes('WO-033'),
  'CHECKPOINT_REPORT.md'
);

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_for_next_work_order' : 'blocked',
  checkedAt: new Date().toISOString(),
  nextWorkOrder: repoStatus.next_work_order,
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
