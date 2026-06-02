#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

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

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' });
}

function sha256(relativePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relativePath))).digest('hex');
}

function candidateOriginal(relativePath) {
  return relativePath
    .replace(/ 2(?=\.)/g, '')
    .replace(/ 3(?=\.)/g, '')
    .replace(/ 2$/g, '')
    .replace(/ 3$/g, '');
}

const status = JSON.parse(read('repo_status.json'));
const packageJson = JSON.parse(read('package.json'));
const plan = read('docs/PRODUCTION_BUILD_PLAN.md');
const intake = read('docs/POST_CR4_LAUNCH_GOVERNANCE_INTAKE.md');
const readme = read('work_orders/README.md');
const runLog = read('RUN_LOG.md');
const checkpoint = read('CHECKPOINT_REPORT.md');
const specGaps = read('SPEC_GAPS.md');
const ci = read('.github/workflows/ci.yml');
const gitignore = read('.gitignore');

const untracked = git(['ls-files', '--others', '--exclude-standard', '-z'])
  .split('\0')
  .filter(Boolean);
const duplicatePattern = / [23](?=\.|$)/;
const duplicateArtifacts = untracked.filter((relativePath) => duplicatePattern.test(path.basename(relativePath)));
const sourceDuplicateArtifacts = duplicateArtifacts.filter(
  (relativePath) => !relativePath.includes('/.next/') && !relativePath.includes('/dist/')
);
const exactDuplicates = sourceDuplicateArtifacts.filter((relativePath) => {
  const original = candidateOriginal(relativePath);
  return exists(original) && sha256(relativePath) === sha256(original);
});
const differingDuplicates = sourceDuplicateArtifacts.filter((relativePath) => {
  const original = candidateOriginal(relativePath);
  return !exists(original) || sha256(relativePath) !== sha256(original);
});
const intakeRecordsDuplicateInventory =
  intake.includes('141 duplicate-pattern files') &&
  intake.includes('43 files were byte-identical') &&
  intake.includes('98 files differed') &&
  (intake.includes('remaining visible untracked duplicate source/doc/script files') ||
    intake.includes('103 visible duplicate-pattern files were reviewed')) &&
  (intake.includes('duplicateSourceDeletionApproved=false') ||
    (intake.includes('duplicateSourceDeletionCompleted=true') && intake.includes('WO-077')));

check('status.wo076-done', 'repo_status marks WO-076 done', status.work_orders?.['WO-076'] === 'done', status.work_orders?.['WO-076']);
check('status.checkpoint-cr4', 'repo_status remains at CR-4 post-governance intake', status.current_checkpoint === 'CR-4', status.current_checkpoint);
check('status.next-null', 'repo_status keeps next_work_order null after governance intake', status.next_work_order === null, status.next_work_order);
check('work-order.file', 'WO-076 work-order file exists', exists('work_orders/WO-076_post_cr4_launch_governance_branch_ci_duplicate_artifact_intake.md'), 'work_orders/WO-076_post_cr4_launch_governance_branch_ci_duplicate_artifact_intake.md');
check('work-order.index', 'Work-order index records WO-076 completion', readme.includes('`WO-076` is complete'), 'work_orders/README.md');
check('plan.wo076', 'Production build plan includes WO-076', plan.includes('## WO-076 '), 'docs/PRODUCTION_BUILD_PLAN.md');
check('runlog.wo076', 'RUN_LOG records WO-076', runLog.includes('WO-076 post-CR4 launch governance intake'), 'RUN_LOG.md');
check('checkpoint.wo076', 'CHECKPOINT_REPORT records WO-076 post-CR4 evidence', checkpoint.includes('WO-076 Post-CR4 Launch Governance Intake'), 'CHECKPOINT_REPORT.md');
check('spec-gaps.no-active', 'SPEC_GAPS records no active post-WO-076 or later post-CR4 gaps', specGaps.includes('No active gaps as of post-`WO-076` post-CR4 launch governance intake review') || specGaps.includes('No active gaps as of post-`WO-077` duplicate artifact cleanup and next-sequence rails review'), 'SPEC_GAPS.md');
check('spec-gaps.duplicate-tracked', 'SPEC_GAPS tracks duplicate artifact deletion as deferred or resolved', specGaps.includes('Deferred Decision — Duplicate artifact deletion approval') || specGaps.includes('Resolved Decision — Duplicate artifact deletion approval'), 'SPEC_GAPS.md');
check('doc.intake', 'Post-CR4 governance intake document exists', exists('docs/POST_CR4_LAUNCH_GOVERNANCE_INTAKE.md'), 'docs/POST_CR4_LAUNCH_GOVERNANCE_INTAKE.md');
check('doc.no-launch', 'Intake document preserves launch false posture', intake.includes('productionLaunchReady=false') && intake.includes('productionLaunchApproved=false'), 'docs/POST_CR4_LAUNCH_GOVERNANCE_INTAKE.md');
check('doc.duplicate-inventory', 'Intake document records duplicate artifact inventory and cleanup posture', intake.includes('Duplicate Artifact Inventory') && (intake.includes('duplicateSourceDeletionApproved=false') || intake.includes('duplicateSourceDeletionCompleted=true')), 'docs/POST_CR4_LAUNCH_GOVERNANCE_INTAKE.md');
check('gitignore.next', 'Nested Next.js build outputs are ignored recursively', gitignore.includes('**/.next/'), '.gitignore');
check('gitignore.dist', 'Nested dist build outputs are ignored recursively', gitignore.includes('**/dist/'), '.gitignore');
check('duplicates.generated-hidden', 'No untracked duplicate artifacts from nested generated output remain visible to git', duplicateArtifacts.every((relativePath) => !relativePath.includes('/.next/') && !relativePath.includes('/dist/')), duplicateArtifacts.filter((relativePath) => relativePath.includes('/.next/') || relativePath.includes('/dist/')).slice(0, 20));
check('duplicates.review-required', 'Duplicate source/doc/script artifacts are inventoried or cleanup-completed with committed evidence', (sourceDuplicateArtifacts.length > 0 && differingDuplicates.length > 0) || (sourceDuplicateArtifacts.length === 0 && intakeRecordsDuplicateInventory), {
  sourceDuplicateCount: sourceDuplicateArtifacts.length,
  exactDuplicateCount: exactDuplicates.length,
  differingDuplicateCount: differingDuplicates.length,
  committedInventoryRecorded: intakeRecordsDuplicateInventory
});
check('package.script', 'package.json exposes post-cr4 launch governance gate', packageJson.scripts?.['post-cr4:launch-governance'] === 'node scripts/validate-post-cr4-launch-governance.js', packageJson.scripts?.['post-cr4:launch-governance']);
check('ci.script', 'CI runs post-cr4 launch governance gate', ci.includes('pnpm post-cr4:launch-governance'), '.github/workflows/ci.yml');
check(
  'no-live-markers',
  'Status notes do not enable live vendors, claim submission, or production launch',
  status.notes.includes('not production launch approval') &&
    status.notes.includes('no live PHI') &&
    status.notes.includes('live EHR API call') &&
    status.notes.includes('claim submission') &&
    status.notes.includes('production launch behavior is authorized or introduced'),
  'repo_status.json'
);

const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({
  status: failed.length === 0 ? 'ready_post_cr4_launch_governance_intake' : 'blocked',
  workOrder: 'WO-076',
  checkpointContext: 'CR-4',
  productionLaunchReady: false,
  productionLaunchApproved: false,
  duplicateSourceDeletionApproved: intake.includes('duplicateSourceDeletionApproved=true'),
  duplicateSourceDeletionCompleted: intake.includes('duplicateSourceDeletionCompleted=true'),
  visibleDuplicateSourceCount: sourceDuplicateArtifacts.length,
  exactDuplicateCount: exactDuplicates.length,
  differingDuplicateCount: differingDuplicates.length,
  failedChecks: failed.length,
  failures: failed,
  checks
}, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
