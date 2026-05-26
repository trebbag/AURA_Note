import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canPerform,
  canViewCoaching,
  canViewFinalNote,
  canViewTranscript,
  containsForbiddenPhiKeys,
  redactForbiddenPhiKeys,
  scanForForbiddenPhiKeys
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
    assert.equal(canPerform('ehr_writeback:queue', linkedClinician), true);
    assert.equal(canPerform('final_note:export', linkedBilling), false);
    assert.equal(canPerform('patient_summary:export', linkedBilling), false);
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
});
