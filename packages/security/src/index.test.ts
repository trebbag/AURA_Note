import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildExternalIntegrationFeatureFlags,
  canPerform,
  canViewCoaching,
  canViewFinalNote,
  canViewTranscript,
  containsForbiddenPhiKeys,
  createStructuredLogEntry,
  redactForStructuredLog,
  redactForbiddenPhi,
  redactForbiddenPhiKeys,
  scanForForbiddenPhiKeys,
  scanForForbiddenPhiText
} from './index';

describe('role-limited transcript access', () => {
  it('allows treating clinicians linked to the visit', () => {
    assert.equal(
      canViewTranscript({
        role: 'clinician',
        linkedToPatient: true,
        linkedToVisit: true,
        treatingClinician: true,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      true
    );
  });

  it('denies billing staff unless billing review is triggered', () => {
    const base = {
      role: 'billing_staff' as const,
      linkedToPatient: true,
      linkedToVisit: true,
      treatingClinician: false,
      authorizedAdmin: false
    };

    assert.equal(canViewTranscript({ ...base, billingReviewTriggered: false }), false);
    assert.equal(canViewTranscript({ ...base, billingReviewTriggered: true }), true);
  });
});

describe('final note and coaching access', () => {
  it('requires patient or visit linkage for final note visibility unless authorized admin', () => {
    assert.equal(
      canViewFinalNote({
        role: 'ma',
        linkedToPatient: false,
        linkedToVisit: false,
        treatingClinician: false,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      false
    );

    assert.equal(
      canViewFinalNote({
        role: 'ma',
        linkedToPatient: false,
        linkedToVisit: true,
        treatingClinician: false,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      true
    );

    assert.equal(
      canViewFinalNote({
        role: 'support',
        linkedToPatient: true,
        linkedToVisit: true,
        treatingClinician: false,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      false
    );
  });

  it('limits coaching to own clinician report or authorized admin dashboard', () => {
    assert.equal(
      canViewCoaching({
        role: 'clinician',
        linkedToPatient: false,
        linkedToVisit: false,
        treatingClinician: false,
        billingReviewTriggered: false,
        authorizedAdmin: false,
        ownCoachingReport: true
      }),
      true
    );

    assert.equal(
      canPerform('coaching_dashboard:view', {
        role: 'admin',
        linkedToPatient: false,
        linkedToVisit: false,
        treatingClinician: false,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      false
    );

    assert.equal(
      canPerform('coaching_own:view', {
        role: 'billing_staff',
        linkedToPatient: true,
        linkedToVisit: true,
        treatingClinician: false,
        billingReviewTriggered: true,
        authorizedAdmin: false,
        ownCoachingReport: true
      }),
      false
    );

    assert.equal(
      canPerform('coaching_dashboard:view', {
        role: 'authorized_admin',
        linkedToPatient: false,
        linkedToVisit: false,
        treatingClinician: false,
        billingReviewTriggered: false,
        authorizedAdmin: true
      }),
      true
    );
  });

  it('allows export/copy actions only for linked permitted roles', () => {
    const linkedClinician = {
      role: 'clinician' as const,
      linkedToPatient: true,
      linkedToVisit: true,
      treatingClinician: true,
      billingReviewTriggered: false,
      authorizedAdmin: false
    };
    const linkedBilling = {
      ...linkedClinician,
      role: 'billing_staff' as const,
      treatingClinician: false,
      billingReviewTriggered: true
    };

    assert.equal(canPerform('final_note:export', linkedClinician), true);
    assert.equal(canPerform('patient_summary:export', linkedClinician), true);
    assert.equal(canPerform('ehr_adapter:view', linkedClinician), true);
    assert.equal(canPerform('ehr_chart_context:view', linkedClinician), true);
    assert.equal(canPerform('ehr_writeback:queue', linkedClinician), true);
    assert.equal(canPerform('clinicos_adapter:view', linkedClinician), true);
    assert.equal(canPerform('clinicos_mapping:write', linkedClinician), false);
    assert.equal(canPerform('ai_gateway:invoke', linkedClinician), true);
    assert.equal(canPerform('final_note:export', linkedBilling), false);
    assert.equal(canPerform('patient_summary:export', linkedBilling), false);
    assert.equal(canPerform('ehr_chart_context:view', linkedBilling), false);
    assert.equal(canPerform('ai_gateway:invoke', linkedBilling), false);
  });
});

describe('schedule lifecycle permissions', () => {
  it('allows MA and clinician schedule creation but denies billing-only users', () => {
    const base = {
      linkedToPatient: true,
      linkedToVisit: true,
      treatingClinician: false,
      billingReviewTriggered: false,
      authorizedAdmin: false
    };

    assert.equal(canPerform('appointment:create', { ...base, role: 'ma' }), true);
    assert.equal(canPerform('appointment:create', { ...base, role: 'clinician' }), true);
    assert.equal(canPerform('appointment:create', { ...base, role: 'billing_staff' }), false);
  });

  it('allows Start Visit only for linked clinicians or authorized admins', () => {
    assert.equal(
      canPerform('visit:start', {
        role: 'clinician',
        linkedToPatient: true,
        linkedToVisit: true,
        treatingClinician: true,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      true
    );

    assert.equal(
      canPerform('visit:start', {
        role: 'ma',
        linkedToPatient: true,
        linkedToVisit: true,
        treatingClinician: false,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      false
    );
  });

  it('limits finalization management to linked treating clinicians or authorized admins', () => {
    assert.equal(
      canPerform('finalization:manage', {
        role: 'clinician',
        linkedToPatient: true,
        linkedToVisit: true,
        treatingClinician: true,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      true
    );

    assert.equal(
      canPerform('finalization:manage', {
        role: 'billing_staff',
        linkedToPatient: true,
        linkedToVisit: true,
        treatingClinician: false,
        billingReviewTriggered: true,
        authorizedAdmin: false
      }),
      false
    );
  });
});

describe('support and audit permissions', () => {
  it('allows support status without granting audit export', () => {
    const supportContext = {
      role: 'support' as const,
      linkedToPatient: false,
      linkedToVisit: false,
      treatingClinician: false,
      billingReviewTriggered: false,
      authorizedAdmin: false
    };
    const complianceContext = {
      ...supportContext,
      role: 'compliance_privacy_lead' as const
    };

    assert.equal(canPerform('support_status:view', supportContext), true);
    assert.equal(canPerform('audit:view', supportContext), false);
    assert.equal(canPerform('audit:export', supportContext), false);
    assert.equal(canPerform('audit:view', complianceContext), true);
    assert.equal(canPerform('audit:export', complianceContext), true);
  });
});

describe('PHI key guard', () => {
  it('detects forbidden keys recursively', () => {
    const result = scanForForbiddenPhiKeys({
      visit: {
        patientName: 'Synthetic Person',
        nested: [{ mrn: 'SYNTHETIC-MRN' }]
      }
    });

    assert.equal(result.containsForbiddenPhi, true);
    assert.deepEqual(result.paths, ['visit.patientName', 'visit.nested[0].mrn']);
    assert.equal(containsForbiddenPhiKeys({ safePatientId: 'synthetic-patient-001' }), false);
  });

  it('redacts forbidden keys while preserving safe data', () => {
    assert.deepEqual(
      redactForbiddenPhiKeys({
        safePatientId: 'synthetic-patient-001',
        email: 'synthetic@example.invalid',
        nested: { phone: '555-0100' }
      }),
      {
        safePatientId: 'synthetic-patient-001',
        email: '[REDACTED]',
        nested: { phone: '[REDACTED]' }
      }
    );
  });

  it('detects obvious forbidden PHI-like free text for AI-bound data', () => {
    const scan = scanForForbiddenPhiText({
      safePatientId: 'safe-patient-synthetic-001',
      contact: 'synthetic@example.invalid',
      nested: { note: 'MRN: SYNTHETIC-MRN' }
    });

    assert.equal(scan.containsForbiddenPhiText, true);
    assert.deepEqual(scan.paths, ['contact', 'nested.note']);
    assert.deepEqual(
      redactForbiddenPhi({ contact: 'synthetic@example.invalid', nested: { patientName: 'Synthetic Person' } }),
      { contact: '[REDACTED]', nested: { patientName: '[REDACTED]' } }
    );
  });
});

describe('structured log redaction and feature flags', () => {
  it('removes forbidden keys and text patterns from structured log payloads', () => {
    const redacted = redactForStructuredLog({
      safePatientId: 'safe-patient-synthetic-001',
      patientName: 'Synthetic Person',
      nested: {
        contact: 'synthetic@example.invalid',
        detail: 'safe operational detail'
      }
    });

    assert.deepEqual(redacted.redactedPaths, ['patientName', 'nested.contact']);
    assert.equal(scanForForbiddenPhiKeys(redacted.value).containsForbiddenPhi, false);
    assert.equal(scanForForbiddenPhiText(redacted.value).containsForbiddenPhiText, false);
  });

  it('creates request-correlated PHI-safe structured log entries', () => {
    const entry = createStructuredLogEntry({
      service: 'aura-note-api',
      level: 'info',
      message: 'Synthetic support status checked',
      requestId: 'req-001',
      traceId: 'trace-001',
      eventName: 'support.status_checked',
      timestamp: '2026-05-26T19:30:00.000Z',
      payload: { mrn: 'SYNTHETIC-MRN', status: 'ok' }
    });

    assert.equal(entry.requestId, 'req-001');
    assert.equal(entry.traceId, 'trace-001');
    assert.equal(entry.phiSafe, true);
    assert.equal(scanForForbiddenPhiKeys(entry.payload).containsForbiddenPhi, false);
    assert.deepEqual(entry.redactedPaths, ['mrn']);
  });

  it('defaults external integration feature flags to disabled', () => {
    const flags = buildExternalIntegrationFeatureFlags();

    assert.equal(flags.every((flag) => flag.defaultValue === false), true);
    assert.equal(flags.every((flag) => flag.enabled === false), true);
    assert.equal(flags.some((flag) => flag.governs === 'external_ai'), true);
    assert.equal(flags.some((flag) => flag.governs === 'ehr_writeback'), true);
  });
});
