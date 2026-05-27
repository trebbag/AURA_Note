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

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({
    id,
    description,
    passed: Boolean(passed),
    evidence
  });
}

function checkFile(id, relativePath, description) {
  check(id, description, exists(relativePath), relativePath);
}

function checkContains(id, relativePath, needle, description) {
  const text = exists(relativePath) ? readText(relativePath) : '';
  check(id, description, text.includes(needle), `${relativePath} contains ${needle}`);
}

const repoStatus = JSON.parse(readText('repo_status.json'));
const runLog = readText('RUN_LOG.md');
const specGaps = readText('SPEC_GAPS.md');
const openApi = readText('packages/contracts/openapi/aura-note.v1.yaml');

const requiredWorkOrders = Array.from({ length: 22 }, (_, index) => `WO-${String(index).padStart(3, '0')}`);
const incompleteWorkOrders = requiredWorkOrders.filter((workOrder) => repoStatus.work_orders?.[workOrder] !== 'done');
const incompleteRecordedWorkOrders = Object.entries(repoStatus.work_orders ?? {})
  .filter(([, status]) => status !== 'done')
  .map(([workOrder]) => workOrder);
const allowedModes = ['cp4_complete', 'post_cp4_in_progress'];

check('status.all-work-orders-done', 'All defined work orders are marked done', incompleteWorkOrders.length === 0, {
  requiredWorkOrders,
  incompleteWorkOrders
});
check('status.cp4-complete', 'Repository mode records CP-4 or post-CP4 readiness', allowedModes.includes(repoStatus.mode), repoStatus.mode);
check('status.all-recorded-work-orders-done', 'All recorded work orders are marked done', incompleteRecordedWorkOrders.length === 0, {
  incompleteRecordedWorkOrders
});
check('status.no-next-work-order', 'No further active local work order remains', repoStatus.next_work_order === null, {
  nextWorkOrder: repoStatus.next_work_order
});

const activeGapSection = specGaps.split('## Active gaps')[1]?.split('## Gap entry format')[0] ?? '';
check(
  'gaps.no-active-gaps',
  'SPEC_GAPS has no active open or blocking entries',
  activeGapSection.includes('None') && !activeGapSection.includes('SPEC_GAP-'),
  'SPEC_GAPS.md active section'
);

[
  ['web.schedule', 'apps/web/app/aura-note/schedule/page.tsx', 'Schedule Builder browser route exists'],
  ['web.drafts', 'apps/web/app/aura-note/drafts/page.tsx', 'Draft Notes browser route exists'],
  ['web.workspace', 'apps/web/app/aura-note/workspace/[appointmentId]/workspace-client.tsx', 'Documentation Workspace browser client exists'],
  ['web.finalization', 'apps/web/app/aura-note/finalization/[noteId]/finalization-client.tsx', 'Finalization Wizard browser client exists'],
  ['web.finalized-list', 'apps/web/app/aura-note/finalized/page.tsx', 'Finalized Notes browser route exists'],
  ['web.finalized-viewer', 'apps/web/app/aura-note/finalized/[noteId]/finalized-note-client.tsx', 'Read-only finalized-note browser client exists'],
  ['web.coaching', 'apps/web/app/aura-note/coaching/page.tsx', 'Coaching browser route exists'],
  ['web.support', 'apps/web/app/aura-note/support/status/page.tsx', 'Support hardening browser route exists']
].forEach(([id, relativePath, description]) => checkFile(id, relativePath, description));

[
  ['api.schedule-e2e', 'apps/api/src/schedule/schedule.e2e.test.ts', 'creates a standalone appointment, creates its note shell, and starts the visit', 'Standalone appointment through workspace e2e journey is covered'],
  ['api.finalization-e2e', 'apps/api/src/schedule/schedule.e2e.test.ts', 'runs WO-007 Billing & Attest and Sign & Dispatch without submitting a claim', 'Finalization through Sign & Dispatch e2e journey is covered'],
  ['api.export-e2e', 'apps/api/src/schedule/schedule.e2e.test.ts', 'runs WO-008 finalized viewer export PDF copy and writeback queue endpoints', 'Export/copy/PDF/writeback scaffold e2e journey is covered'],
  ['api.ai-e2e', 'apps/api/src/ai/ai.e2e.test.ts', 'blocks raw PHI by default', 'AI Gateway PHI boundary e2e journey is covered'],
  ['api.ehr-e2e', 'apps/api/src/integrations/ehr.e2e.test.ts', 'default disabled athenahealth status', 'EHR standalone-safe adapter status e2e journey is covered'],
  ['api.clinicos-e2e', 'apps/api/src/integrations/clinicos.e2e.test.ts', 'reports standalone default mode and ClinicOS mock mode', 'Standalone and ClinicOS mock modes are covered'],
  ['api.coaching-e2e', 'apps/api/src/coaching/coaching.e2e.test.ts', 'denies billing staff', 'Coaching visibility e2e journey is covered'],
  ['api.support-e2e', 'apps/api/src/support/support.e2e.test.ts', 'creates redacted audit export metadata', 'Support status and audit export e2e journey is covered']
].forEach(([id, relativePath, needle, description]) => checkContains(id, relativePath, needle, description));

[
  ['test.domain', 'packages/domain/src/index.test.ts', 'Domain unit coverage exists'],
  ['test.contracts', 'packages/contracts/src/index.test.ts', 'Contract unit coverage exists'],
  ['test.security', 'packages/security/src/index.test.ts', 'Security unit coverage exists'],
  ['test.ai-gateway', 'packages/ai-gateway/src/index.test.ts', 'AI Gateway unit coverage exists'],
  ['test.ehr-adapters', 'packages/ehr-adapters/src/index.test.ts', 'EHR adapter unit coverage exists'],
  ['test.clinicos-adapter', 'packages/clinicos-adapter/src/index.test.ts', 'ClinicOS adapter unit coverage exists'],
  ['test.worker', 'apps/worker/src/main.test.ts', 'Worker unit coverage exists'],
  ['test.fixtures', 'packages/testing/src/index.test.ts', 'Synthetic fixture unit coverage exists'],
  ['test.schedule-repository', 'apps/api/src/schedule/schedule.repository.test.ts', 'Schedule repository seam unit coverage exists'],
  ['test.persistence-runtime-readiness', 'scripts/validate-persistence-runtime-readiness.js', 'Persistence runtime readiness verifier exists'],
  ['test.persistence-adapter', 'packages/persistence/src/index.test.ts', 'Persistence adapter scaffold unit coverage exists']
].forEach(([id, relativePath, description]) => checkFile(id, relativePath, description));

[
  ['openapi.schedule', '/schedule/appointments:', 'Schedule contract path exists'],
  ['openapi.workspace', '/documentation-workspace/appointments/{appointmentId}:', 'Workspace contract path exists'],
  ['openapi.finalization', '/notes/{noteId}/finalization/sign-dispatch:', 'Sign & Dispatch contract path exists'],
  ['openapi.exports', '/notes/{noteId}/exports/final-note-pdf:', 'Export contract path exists'],
  ['openapi.ai', '/ai-gateway/mock-invocations:', 'AI Gateway contract path exists'],
  ['openapi.ehr', '/integrations/ehr/status:', 'EHR adapter contract path exists'],
  ['openapi.clinicos', '/integrations/clinicos/status:', 'ClinicOS adapter contract path exists'],
  ['openapi.coaching', '/coaching/own:', 'Coaching contract path exists'],
  ['openapi.support', '/support/status:', 'Support hardening contract path exists'],
  ['event.note-dispatched', 'note.dispatched.v1', 'Dispatch event is cataloged'],
  ['event.ai-phi-rejected', 'ai.phi_rejected.v1', 'AI PHI rejection event is cataloged'],
  ['event.retention-scan', 'retention.scan_completed.v1', 'Retention scan event is cataloged'],
  ['event.audit-export', 'audit.export_requested.v1', 'Audit export event is cataloged']
].forEach(([id, needle, description]) => check(id, description, openApi.includes(needle), `OpenAPI contains ${needle}`));

[
  ['report.cp4-section', 'CHECKPOINT_REPORT.md', 'CP-4', 'CP-4 checkpoint report exists'],
  ['report.wo012', 'CHECKPOINT_REPORT.md', 'WO-012', 'WO-012 evidence is in checkpoint report'],
  ['report.wo013', 'CHECKPOINT_REPORT.md', 'WO-013', 'WO-013 evidence is in checkpoint report'],
  ['report.wo014', 'CHECKPOINT_REPORT.md', 'WO-014', 'WO-014 evidence is in checkpoint report'],
  ['readiness.doc', 'docs/CP4_ACCEPTANCE_READINESS.md', 'CP-4 acceptance readiness', 'CP-4 readiness report document exists'],
  ['runlog.wo014', 'RUN_LOG.md', 'WO-014 End-to-end acceptance readiness report', 'WO-014 run log entry exists']
].forEach(([id, relativePath, needle, description]) => checkContains(id, relativePath, needle, description));

check('runlog.no-live-ai', 'Run log preserves live AI prohibition evidence', runLog.includes('Live AI') || runLog.includes('live AI'), 'RUN_LOG.md live AI boundary');
check('runlog.no-claim-submission', 'Run log preserves claim-submission boundary evidence', runLog.includes('claim submission'), 'RUN_LOG.md claim submission boundary');

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  checkedAt: new Date().toISOString(),
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
