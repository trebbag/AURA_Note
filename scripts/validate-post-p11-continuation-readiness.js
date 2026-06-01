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
const continuation = readText('docs/POST_P11_CONTINUATION_PLAN.md');
const workOrderIndex = readText('work_orders/README.md');
const runLog = readText('RUN_LOG.md');
const checkpointReport = readText('CHECKPOINT_REPORT.md');
const specGaps = readText('SPEC_GAPS.md');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

check('status.wo052-done', 'WO-052 is marked done', repoStatus.work_orders?.['WO-052'] === 'done', repoStatus.work_orders?.['WO-052']);
check(
  'status.next-work-order-post-p11',
  'Post-P11 rails either remain parked or point to the approved commercial-readiness active work order',
  repoStatus.next_work_order === null || Number.parseInt(String(repoStatus.next_work_order || '').replace('WO-', ''), 10) >= 61,
  repoStatus.next_work_order
);
check(
  'status.checkpoint-post-p11',
  'P11 is retained or the approved commercial-readiness rails move the repo through CR checkpoints',
  repoStatus.current_checkpoint === 'P11' || repoStatus.current_checkpoint === 'CR-0' || repoStatus.current_checkpoint === 'CR-1' || repoStatus.current_checkpoint === 'CR-2' || repoStatus.current_checkpoint === 'CR-3',
  repoStatus.current_checkpoint
);
check('work-order.file', 'WO-052 work-order file exists', exists('work_orders/WO-052_post_p11_continuation_rails.md'), 'work_orders/WO-052_post_p11_continuation_rails.md');
check('work-order.index', 'Work-order index lists WO-052', workOrderIndex.includes('WO-052') && workOrderIndex.includes('Post-P11 continuation'), 'work_orders/README.md');
check('plan.section', 'Production plan includes WO-052', plan.includes('## WO-052 ') && plan.includes('post-P11 continuation'), 'docs/PRODUCTION_BUILD_PLAN.md');
check(
  'plan.no-live-authorization',
  'Production plan preserves no live behavior authorization',
  plan.toLowerCase().includes('no live production, vendor, claim, phi, or launch behavior is authorized'),
  'docs/PRODUCTION_BUILD_PLAN.md'
);
check('continuation.exists', 'Post-P11 continuation plan exists', exists('docs/POST_P11_CONTINUATION_PLAN.md'), 'docs/POST_P11_CONTINUATION_PLAN.md');
check('continuation.activation-checklist', 'Continuation plan includes activation checklist', continuation.includes('## Activation checklist for any future work order'), 'docs/POST_P11_CONTINUATION_PLAN.md');
check('continuation.candidate-families', 'Continuation plan lists candidate future tranche families', continuation.includes('Production identity and account lifecycle') && continuation.includes('Claim, clearinghouse, payer, denial, and payment review'), 'docs/POST_P11_CONTINUATION_PLAN.md');
check('continuation.safe-current-posture', 'Continuation plan records safe current posture for claim work', continuation.includes('submittedClaim=false') && continuation.includes('draft claim preview remains internal'), 'docs/POST_P11_CONTINUATION_PLAN.md');
check(
  'spec-gaps.current',
  'SPEC_GAPS reflects post-WO-052 or later post-P11 planning/control with no active gaps',
  specGaps.includes('No active gaps as of post-`WO-052` post-P11 continuation rails review') ||
    specGaps.includes('No active gaps as of post-`WO-053` production identity/account lifecycle review intake') ||
    specGaps.includes('No active gaps as of post-`WO-054` production PHI persistence/database operations review intake') ||
    specGaps.includes('No active gaps as of post-`WO-055` production Azure storage/deletion/restore review intake') ||
    specGaps.includes('No active gaps as of post-`WO-056` live transcription provider review intake') ||
    specGaps.includes('No active gaps as of post-`WO-057` external AI private/BAA pathway review intake') ||
    specGaps.includes('No active gaps as of post-`WO-058` production EHR writeback credentialing review intake') ||
    specGaps.includes('No active gaps as of post-`WO-059` ClinicOS live integration review intake') ||
    specGaps.includes('No active gaps as of post-`WO-060` commercial readiness rebaseline/runtime rails review') ||
    specGaps.includes('No active gaps as of post-`WO-061` runtime persistence switchover review') ||
    specGaps.includes('No active gaps as of post-`WO-062` API runtime hardening and request-boundary review') ||
    specGaps.includes('No active gaps as of post-`WO-063` identity runtime boundary review') ||
    specGaps.includes('No active gaps as of post-`WO-069` athenahealth sandbox and vendor-neutral EHR runtime boundary review'),
  'SPEC_GAPS.md'
);
check('runlog.wo052', 'RUN_LOG records WO-052 evidence', runLog.includes('WO-052 post-P11 continuation rails'), 'RUN_LOG.md');
check('checkpoint.wo052', 'CHECKPOINT_REPORT records post-P11 continuation evidence', checkpointReport.includes('Post-P11 Continuation Rails') && checkpointReport.includes('WO-052'), 'CHECKPOINT_REPORT.md');
check('package.script', 'package.json exposes post-p11 readiness script', readText('package.json').includes('post-p11:readiness'), 'package.json');
check('ci.script', 'CI runs post-p11 readiness before production readiness', readText('.github/workflows/ci.yml').includes('pnpm post-p11:readiness'), '.github/workflows/ci.yml');

[
  'claimSubmissionEnabled=true',
  'submittedClaim=true',
  'productionLaunchApproved=true',
  'productionLaunchReady=true',
  'liveClearinghouseTouched=true',
  'livePayerTouched=true',
  'productionPhi=true',
  'liveExternalAiEnabled=true'
].forEach((needle) => {
  check(`prohibited.${needle}`, `Continuation files do not enable ${needle}`, !continuation.includes(needle) && !plan.includes(needle), needle);
});

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_post_p11_planning_only' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-052',
  nextWorkOrder: repoStatus.next_work_order,
  liveBehaviorAuthorized: false,
  productionLaunchApproved: false,
  totalChecks: checks.length,
  passedChecks: checks.length - failed.length,
  failedChecks: failed.length,
  failures: failed
};

console.log(JSON.stringify(result, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
