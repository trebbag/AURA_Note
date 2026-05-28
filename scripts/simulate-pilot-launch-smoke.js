#!/usr/bin/env node
const smokeEvidence = {
  status: 'ready_for_limited_launch_decision',
  workOrder: 'WO-050',
  evidenceType: 'synthetic_pilot_launch_smoke',
  productionLaunchApproved: false,
  productionDeploymentExecuted: false,
  realPhiUsed: false,
  liveVendorTraffic: false,
  submittedClaim: false,
  tenantOnboarding: {
    tenantId: 'tenant-pilot-synthetic-001',
    siteId: 'site-pilot-synthetic-001',
    provisioningMode: 'synthetic_metadata_only',
    standaloneModeReady: true,
    clinicosIntegratedMode: 'optional_fail_closed',
    requiredOwnersAssigned: false
  },
  roleTraining: [
    'clinician',
    'medical_assistant',
    'billing_staff',
    'authorized_admin',
    'compliance_privacy_lead',
    'support_metadata_only',
    'service_account'
  ].map((role) => ({
    role,
    status: role === 'support_metadata_only' ? 'metadata_only' : 'training_checklist_ready',
    phiPayloadIncluded: false
  })),
  disabledFeatures: [
    'live_external_ai',
    'live_ehr_writeback',
    'live_clinicos_sync',
    'live_transcription_provider',
    'destructive_production_deletion',
    'charge_finalization',
    'claim_submission',
    'patient_facing_revenue'
  ].map((feature) => ({
    feature,
    state: 'disabled_until_explicit_approval',
    fallback: 'documented_mock_or_fail_closed'
  })),
  firstWeekMonitoring: {
    cadence: 'daily_synthetic_review',
    metrics: ['access_denials', 'workflow_errors', 'export_failures', 'vendor_disabled_path_hits', 'support_escalations'],
    liveSinksConfigured: false,
    supportEscalationOwnerAssigned: false
  },
  rollbackCriteria: {
    smokeFailure: 'rollback_or_hold',
    privacyIncident: 'stop_pilot_and_escalate',
    unauthorizedAccess: 'stop_pilot_and_escalate',
    vendorMisroute: 'keep_vendor_disabled_and_escalate',
    dataIntegrityIssue: 'hold_new_tenant_onboarding'
  },
  approvalPlaceholders: {
    founder: 'required_before_live_launch',
    clinical: 'required_before_live_launch',
    compliancePrivacy: 'required_before_live_launch',
    security: 'required_before_live_launch'
  },
  frontendRuntimeIntegrationGate: {
    typedApiClientEvidence: true,
    seededBackendWorkflow: 'appointment_creation_through_finalization_export',
    persistedReloadEvidence: true,
    localReactStateAllowedOnlyInDemoMode: true
  }
};

const hardFailures = [];

if (smokeEvidence.productionLaunchApproved) {
  hardFailures.push('production launch approval must remain false in synthetic WO-050 evidence');
}
if (smokeEvidence.productionDeploymentExecuted) {
  hardFailures.push('production deployment must not execute in WO-050');
}
if (smokeEvidence.realPhiUsed || smokeEvidence.liveVendorTraffic || smokeEvidence.submittedClaim) {
  hardFailures.push('WO-050 smoke cannot use real PHI, live vendors, or submitted claims');
}
if (!smokeEvidence.frontendRuntimeIntegrationGate.typedApiClientEvidence || !smokeEvidence.frontendRuntimeIntegrationGate.persistedReloadEvidence) {
  hardFailures.push('frontend runtime integration evidence is required before pilot decision');
}

const result = {
  ...smokeEvidence,
  hardFailures,
  passed: hardFailures.length === 0
};

console.log(JSON.stringify(result, null, 2));

if (hardFailures.length > 0) {
  process.exitCode = 1;
}
