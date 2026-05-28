#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const status = JSON.parse(read('repo_status.json'));
const packageJson = JSON.parse(read('package.json'));
const reviewPackage = read('docs/COMPLIANCE_SECURITY_PRIVACY_REVIEW_PACKAGE.md');
const threatModel = read('docs/THREAT_MODEL.md');
const rbac = read('docs/RBAC_ABAC_MATRIX.md');
const aiGovernance = read('docs/AI_PHI_GOVERNANCE.md');
const specGaps = read('SPEC_GAPS.md');
const runLog = read('RUN_LOG.md');
const checkpointReport = read('CHECKPOINT_REPORT.md');
const workflow = read('.github/workflows/ci.yml');
const workOrderReadme = read('work_orders/README.md');

const checks = [];

function check(id, description, passed, evidence) {
  checks.push({ id, description, passed: Boolean(passed), evidence });
}

[
  'P9 Review Reconciliation',
  'No P9 blocker found',
  'not a HIPAA compliance claim',
  'No production launch',
  'WO-047'
].forEach((snippet) => {
  check(`review-package.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `Review package contains ${snippet}`, reviewPackage.includes(snippet), 'docs/COMPLIANCE_SECURITY_PRIVACY_REVIEW_PACKAGE.md');
});

[
  'Trust Boundaries',
  'Threats And Current Mitigations',
  'Cross-tenant or cross-site data exposure',
  'Raw PHI sent to external AI',
  'Claim or charge submission without explicit decision',
  'No new P9 blocker was found'
].forEach((snippet) => {
  check(`threat-model.${snippet.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, `Threat model contains ${snippet}`, threatModel.includes(snippet), 'docs/THREAT_MODEL.md');
});

check('rbac.wo047', 'RBAC matrix records WO-047 reconciliation', rbac.includes('WO-047') && rbac.includes('security/privacy/compliance review'), 'docs/RBAC_ABAC_MATRIX.md');
check('ai.wo047', 'AI/PHI governance records WO-047 review boundary', aiGovernance.includes('WO-047') && aiGovernance.includes('No new P9 AI/PHI blocker'), 'docs/AI_PHI_GOVERNANCE.md');
check('status.wo047-done', 'repo_status marks WO-047 done', status.work_orders?.['WO-047'] === 'done', status.work_orders?.['WO-047']);
check(
  'status.wo048-or-later',
  'repo_status has advanced to WO-048 or later after P9 completion',
  status.work_orders?.['WO-048'] && status.work_orders?.['WO-048'] !== 'planned',
  { nextWorkOrder: status.next_work_order, wo048: status.work_orders?.['WO-048'] }
);
check('status.p10-or-later', 'repo_status current checkpoint advances to P10 or later after P9 completion', ['P10', 'P11'].includes(status.current_checkpoint), status.current_checkpoint);
check('checkpoint.p9', 'P9 checkpoint report records WO-044 through WO-047', ['P9', 'WO-044', 'WO-045', 'WO-046', 'WO-047'].every((snippet) => checkpointReport.includes(snippet)), 'CHECKPOINT_REPORT.md');
check('runlog.wo047', 'RUN_LOG records WO-047 evidence', runLog.includes('WO-047 security privacy compliance and threat-model remediation'), 'RUN_LOG.md');
check(
  'spec-gaps.current',
  'SPEC_GAPS records no active WO-047-or-later gaps',
  specGaps.includes('No active gaps as of post-`WO-047` security/privacy/compliance and P9 review') ||
    specGaps.includes('No active gaps as of post-`WO-048` frontend runtime integration gate review') ||
    specGaps.includes('No active gaps as of post-`WO-049` launch operations readiness review') ||
    specGaps.includes('No active gaps as of post-`WO-050` beta pilot launch gate and P10 review') ||
    specGaps.includes('No active gaps as of post-`WO-051` claim/payer decision gate and P11 review') ||
    specGaps.includes('No active gaps as of post-`WO-052` post-P11 continuation rails review') ||
    specGaps.includes('No active gaps as of post-`WO-053` production identity/account lifecycle review intake') ||
    specGaps.includes('No active gaps as of post-`WO-054` production PHI persistence/database operations review intake') ||
    specGaps.includes('No active gaps as of post-`WO-055` production Azure storage/deletion/restore review intake'),
  'SPEC_GAPS.md'
);
check('work-order.next-file', 'WO-048 work-order file exists for the next tranche', fs.readdirSync(path.join(root, 'work_orders')).some((file) => file.startsWith('WO-048_')), 'work_orders');
check(
  'work-order.readme',
  'Work-order index marks P9 complete and records WO-048 or later P10 progress',
  workOrderReadme.includes('P9 is complete') && (workOrderReadme.includes('`WO-048` is complete') || workOrderReadme.includes('`WO-048` is the next active work order')),
  'work_orders/README.md'
);
check(
  'script.package',
  'package.json exposes security:review-readiness',
  packageJson.scripts?.['security:review-readiness'] === 'pnpm --filter @aura-note/security test && pnpm --filter @aura-note/api test && node scripts/validate-security-review-readiness.js',
  packageJson.scripts?.['security:review-readiness']
);
check('script.ci', 'CI runs security review readiness before production readiness', workflow.includes('pnpm security:review-readiness') && workflow.indexOf('pnpm security:review-readiness') < workflow.indexOf('pnpm production:readiness'), '.github/workflows/ci.yml');

const prohibitedClaims = [
  ['docs/COMPLIANCE_SECURITY_PRIVACY_REVIEW_PACKAGE.md', reviewPackage, 'HIPAA certified'],
  ['docs/COMPLIANCE_SECURITY_PRIVACY_REVIEW_PACKAGE.md', reviewPackage, 'SOC 2 compliant'],
  ['docs/THREAT_MODEL.md', threatModel, 'production launch approved']
];

prohibitedClaims.forEach(([file, corpus, phrase]) => {
  check(`prohibited.${file}.${phrase}`, `${file} does not claim ${phrase}`, !corpus.includes(phrase), file);
});

const failed = checks.filter((item) => !item.passed);
const result = {
  status: failed.length === 0 ? 'ready_synthetic' : 'blocked',
  checkedAt: new Date().toISOString(),
  workOrder: 'WO-047',
  evidenceType: 'p9_security_privacy_compliance_threat_model_review',
  legalCertificationClaimed: false,
  productionLaunchReady: false,
  productionPhi: false,
  productionCredentials: false,
  liveVendorTouched: false,
  autonomousClinicalCodingBillingEnabled: false,
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
