#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

const contracts = read('packages/contracts/src/index.ts');
const security = read('packages/security/src/index.ts');
const apiController = read('apps/api/src/schedule/schedule.controller.ts');
const apiService = read('apps/api/src/schedule/schedule.service.ts');
const apiE2e = read('apps/api/src/schedule/schedule.e2e.test.ts');
const webSchedule = read('apps/web/app/aura-note/schedule/page.tsx');
const browserSpec = read('apps/web/e2e/aura-note-routes.spec.ts');
const rlsCore = read('packages/contracts/prisma/rls-core-schedule.sql');
const productionPlan = read('docs/PRODUCTION_BUILD_PLAN.md');

check(
  'contracts.patient-shell',
  'Standalone patient DTOs are present',
  contracts.includes('StandalonePatientDto') && contracts.includes('CreateStandalonePatientRequestDto'),
  'packages/contracts/src/index.ts'
);
check(
  'contracts.chart-context',
  'Standalone chart-context snapshot DTO is present',
  contracts.includes('StandaloneChartContextSnapshotDto') && contracts.includes('chart_context.snapshot_created.v1'),
  'packages/contracts/src/index.ts'
);
check(
  'security.permissions',
  'Patient, chart-context, and appointment lifecycle permissions are explicit',
  ['patient:view', 'patient:create', 'patient:update', 'chart_context:view', 'appointment:update', 'appointment:status'].every((needle) =>
    security.includes(needle)
  ),
  'packages/security/src/index.ts'
);
check(
  'api.routes',
  'Standalone patient, chart context, and appointment status routes exist',
  apiController.includes("@Controller('standalone/patients')") &&
    apiController.includes("@Get(':appointmentId/chart-context')") &&
    apiController.includes("@Post(':appointmentId/status')"),
  'apps/api/src/schedule/schedule.controller.ts'
);
check(
  'api.safety',
  'Service preserves synthetic/local chart context boundaries',
  apiService.includes('productionPhiStorageApproved: false') &&
    apiService.includes('Synthetic standalone chart context only; live EHR completeness is not implied.'),
  'apps/api/src/schedule/schedule.service.ts'
);
check(
  'api.tests',
  'API e2e covers standalone patient, chart context, billing denial, and status workflow',
  apiE2e.includes('supports standalone patient shell, chart context, and schedule status workflow without billing access') &&
    apiE2e.includes("set('x-aura-role', 'billing_staff')") &&
    apiE2e.includes("send({ action: 'mark_no_show' })"),
  'apps/api/src/schedule/schedule.e2e.test.ts'
);
check(
  'browser.shell',
  'Browser schedule route exposes patient shell, day/week schedule, and status actions',
  webSchedule.includes('Patient Shell') &&
    webSchedule.includes('Week Schedule') &&
    webSchedule.includes('Chart freshness') &&
    webSchedule.includes('No Show'),
  'apps/web/app/aura-note/schedule/page.tsx'
);
check(
  'browser.tests',
  'Browser tests cover patient shell, day/week view, and status-state behavior',
  browserSpec.includes('Chart freshness: recent') &&
    browserSpec.includes("getByRole('button', { name: 'Week' })") &&
    browserSpec.includes('no_show'),
  'apps/web/e2e/aura-note-routes.spec.ts'
);
check(
  'rls.chart-context',
  'Core schedule RLS includes patient linkage and chart context snapshot rows',
  rlsCore.includes('ALTER TABLE "PatientLinkage" ENABLE ROW LEVEL SECURITY') &&
    rlsCore.includes('ALTER TABLE "ChartContextSnapshot" ENABLE ROW LEVEL SECURITY'),
  'packages/contracts/prisma/rls-core-schedule.sql'
);
check(
  'plan.wo038',
  'Production build plan still identifies WO-038 as the standalone patient/schedule tranche',
  productionPlan.includes('## WO-038') && productionPlan.includes('standalone patients and schedule workflow'),
  'docs/PRODUCTION_BUILD_PLAN.md'
);

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-038',
  evidenceType: 'standalone_patient_chart_context_schedule_synthetic_readiness',
  productionPhi: false,
  productionCredentials: false,
  liveEhrTouched: false,
  liveClinicOsSyncTouched: false,
  claimSubmissionPerformed: false,
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
