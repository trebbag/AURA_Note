#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.next', 'dist'].includes(entry.name)) continue;
    const absolutePath = path.join(dir, entry.name);
    const relativePath = path.relative(root, absolutePath);
    if (entry.isDirectory()) {
      walk(absolutePath, results);
    } else if (/ [23](\.[^/.]+)$/.test(entry.name)) {
      results.push(relativePath);
    }
  }
  return results;
}

const status = JSON.parse(read('repo_status.json'));
const packageJson = JSON.parse(read('package.json'));
const workOrderReadme = read('work_orders/README.md');
const plan = read('docs/PRODUCTION_BUILD_PLAN.md');
const runLog = read('RUN_LOG.md');
const checkpoint = read('CHECKPOINT_REPORT.md');
const specGaps = read('SPEC_GAPS.md');
const intake = read('docs/POST_CR4_LAUNCH_GOVERNANCE_INTAKE.md');
const cleanup = read('docs/DUPLICATE_ARTIFACT_ADJUDICATION.md');
const sequence = read('docs/POST_CR4_NEXT_WORK_ORDER_SEQUENCE.md');
const inputs = read('docs/POST_CR4_PRODUCTION_DECISION_INPUTS.md');
const ci = read('.github/workflows/ci.yml');
const duplicatePatternFiles = walk(root).sort();
const plannedWorkOrders = Array.from({ length: 12 }, (_, index) => `WO-${String(index + 78).padStart(3, '0')}`);
const prohibitedTrueMarkers = [
  'productionLaunchApproved=true',
  'productionLaunchReady=true',
  'livePhiEnabled=true',
  'liveVendorEnabled=true',
  'claimSubmissionEnabled=true',
  'liveExternalAiEnabled=true',
  'liveEhrWritebackEnabled=true',
  'liveClinicosSyncEnabled=true',
  'liveTranscriptionVendorEnabled=true',
  'autonomousDiagnosisEnabled=true',
  'autonomousCodingFinalizationEnabled=true',
  'autonomousBillingEnabled=true',
  'medicalNecessityDeterminationEnabled=true',
  'chargeFinalizationEnabled=true',
  'patientFacingFinancialConclusionEnabled=true'
];

check('status.wo077-done', 'repo_status marks WO-077 done', status.work_orders?.['WO-077'] === 'done', status.work_orders?.['WO-077']);
check('status.future-planned', 'WO-078 through WO-089 remain planned', plannedWorkOrders.every((workOrder) => status.work_orders?.[workOrder] === 'planned'), plannedWorkOrders.map((workOrder) => [workOrder, status.work_orders?.[workOrder]]));
check('status.next-null', 'next_work_order remains null while post-CR4 work is planned', status.next_work_order === null, status.next_work_order);
check('status.checkpoint-cr4', 'Current checkpoint remains CR-4', status.current_checkpoint === 'CR-4', status.current_checkpoint);
check('work-order.wo077-file', 'WO-077 work-order file exists', exists('work_orders/WO-077_duplicate_artifact_cleanup_next_work_order_rails.md'), 'work_orders/WO-077_duplicate_artifact_cleanup_next_work_order_rails.md');
check('work-order.index', 'Work-order index lists WO-077 through WO-089', ['WO-077', ...plannedWorkOrders].every((workOrder) => workOrderReadme.includes(workOrder)), 'work_orders/README.md');
check('plan.sequence', 'Production build plan lists WO-077 through WO-089', ['WO-077', ...plannedWorkOrders].every((workOrder) => plan.includes(`## ${workOrder} `)), 'docs/PRODUCTION_BUILD_PLAN.md');
check('docs.cleanup', 'Duplicate adjudication document records cleanup counts and unique disposition', cleanup.includes('103 visible duplicate-pattern files') && cleanup.includes('1 file had unique differences') && cleanup.includes('rejected rather than merged'), 'docs/DUPLICATE_ARTIFACT_ADJUDICATION.md');
check('docs.sequence', 'Post-CR4 sequence document records planned status and promotion rules', sequence.includes('WO-078') && sequence.includes('remain `planned`') && sequence.includes('Promotion Criteria'), 'docs/POST_CR4_NEXT_WORK_ORDER_SEQUENCE.md');
check('docs.inputs', 'Production decision inputs document covers every deferred production area', ['Production Identity Provider', 'Production PHI Persistence', 'Production Azure Storage', 'Live Transcription Provider', 'External AI Private/BAA', 'Production EHR Writeback', 'ClinicOS Live Integration', 'Production Observability', 'Revenue Estimate', 'Claim, Clearinghouse', 'Beta Pilot Execution'].every((needle) => inputs.includes(needle)), 'docs/POST_CR4_PRODUCTION_DECISION_INPUTS.md');
check('duplicates.absent', 'No visible duplicate-pattern files remain outside ignored generated folders', duplicatePatternFiles.length === 0, duplicatePatternFiles);
check('intake.updated', 'Post-CR4 intake records PR merge and duplicate cleanup completion', intake.includes('mergedAt: 2026-06-02T18:26:23Z') && intake.includes('duplicateSourceDeletionCompleted=true') && intake.includes('WO-077'), 'docs/POST_CR4_LAUNCH_GOVERNANCE_INTAKE.md');
check('spec-gaps.updated', 'SPEC_GAPS records no active gaps after WO-077 and duplicate cleanup resolved', specGaps.includes('No active gaps as of post-`WO-077` duplicate artifact cleanup and next-sequence rails review') && specGaps.includes('Resolved Decision — Duplicate artifact deletion approval'), 'SPEC_GAPS.md');
check('runlog.wo077', 'RUN_LOG records WO-077', runLog.includes('WO-077 duplicate artifact cleanup and post-CR4 next-work-order rails'), 'RUN_LOG.md');
check('checkpoint.wo077', 'CHECKPOINT_REPORT records WO-077 evidence', checkpoint.includes('WO-077 Duplicate Artifact Cleanup And Next-Work-Order Rails'), 'CHECKPOINT_REPORT.md');
check('package.script', 'package.json exposes post-cr4 next-work-orders gate', packageJson.scripts?.['post-cr4:next-work-orders'] === 'node scripts/validate-post-cr4-next-work-orders.js', packageJson.scripts?.['post-cr4:next-work-orders']);
check('ci.script', 'CI runs post-cr4 next-work-orders gate', ci.includes('pnpm post-cr4:next-work-orders'), '.github/workflows/ci.yml');

const launchClaims = [];
for (const relativePath of [
  'repo_status.json',
  'docs/POST_CR4_NEXT_WORK_ORDER_SEQUENCE.md',
  'docs/POST_CR4_PRODUCTION_DECISION_INPUTS.md',
  'docs/POST_CR4_LAUNCH_GOVERNANCE_INTAKE.md',
  'docs/PRODUCTION_BUILD_PLAN.md',
  'SPEC_GAPS.md',
  'RUN_LOG.md'
]) {
  const text = read(relativePath);
  for (const marker of prohibitedTrueMarkers) {
    if (text.includes(marker)) launchClaims.push({ relativePath, marker });
  }
}
check('no-launch-live-markers', 'No affirmative launch/live/autonomy markers were introduced', launchClaims.length === 0, launchClaims);

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({
  status: failed.length === 0 ? 'ready_post_cr4_next_work_order_sequence' : 'blocked',
  workOrder: 'WO-077',
  plannedNextSequence: plannedWorkOrders,
  productionLaunchApproved: false,
  livePhiEnabled: false,
  liveVendorEnabled: false,
  claimSubmissionEnabled: false,
  duplicatePatternFilesRemaining: duplicatePatternFiles.length,
  failedChecks: failed.length,
  failures: failed,
  checks
}, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
