import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ForbiddenException } from '@nestjs/common';
import { CoachingService } from './coaching.service';

describe('CoachingService', () => {
  it('returns own coaching for a treating clinician only', () => {
    const service = new CoachingService();
    const report = service.getOwnCoaching({
      'x-aura-role': 'clinician',
      'x-aura-linked-visit': 'true',
      'x-aura-user-id': 'user-clinician-synthetic-001',
      'x-trace-id': 'trace-coaching-own-001'
    });

    assert.equal(report.data.privacyLabel, 'own_clinician_only');
    assert.equal(report.data.patientFacingExcluded, true);
    assert.equal(report.data.signals.length, 2);
    assert.equal(report.data.signals.every((signal) => signal.clinicianId === 'user-clinician-synthetic-001'), true);
    assert.equal(report.data.domainEvents[0]?.eventType, 'coaching.report_generated.v1');
  });

  it('marks transcript-dependent coaching unavailable when recording exception was approved', () => {
    const service = new CoachingService();
    const report = service.getOwnCoaching({
      'x-aura-role': 'clinician',
      'x-aura-linked-visit': 'true',
      'x-aura-recording-exception-approved': 'true'
    });

    assert.match(report.data.unavailableReasons[0] ?? '', /recording exception/);
  });

  it('denies coaching outputs to billing staff', () => {
    const service = new CoachingService();

    assert.throws(
      () =>
        service.getOwnCoaching({
          'x-aura-role': 'billing_staff',
          'x-aura-linked-visit': 'true',
          'x-aura-billing-review-triggered': 'true'
        }),
      ForbiddenException
    );
  });

  it('denies cross-tenant coaching access before report generation', () => {
    const service = new CoachingService();

    assert.throws(
      () =>
        service.getOwnCoaching({
          'x-aura-role': 'clinician',
          'x-aura-linked-visit': 'true',
          'x-aura-tenant-id': 'tenant-other'
        }),
      ForbiddenException
    );
  });

  it('returns aggregate-only dashboard without clinician identifiers by default', () => {
    const service = new CoachingService();
    const dashboard = service.getDashboard({
      'x-aura-role': 'authorized_admin',
      'x-trace-id': 'trace-coaching-dashboard-001'
    });

    assert.equal(dashboard.data.aggregateOnly, true);
    assert.equal(dashboard.data.clinicianSummaries.length, 2);
    assert.equal(dashboard.data.clinicianSummaries.some((summary) => summary.clinicianId), false);
    assert.equal(dashboard.data.roiSignals.revenueCapturedLabel, 'internal_only_not_patient_facing');
  });

  it('allows full admin mode only through authorized admin access', () => {
    const service = new CoachingService();
    const dashboard = service.getDashboard(
      {
        'x-aura-role': 'authorized_admin',
        'x-trace-id': 'trace-coaching-dashboard-002'
      },
      'full_admin'
    );

    assert.equal(dashboard.data.aggregateOnly, false);
    assert.equal(dashboard.data.clinicianSummaries.some((summary) => summary.clinicianId), true);
  });

  it('denies admin dashboard to non-admin roles', () => {
    const service = new CoachingService();

    assert.throws(
      () =>
        service.getDashboard({
          'x-aura-role': 'clinic_manager',
          'x-trace-id': 'trace-coaching-dashboard-denied-001'
        }),
      ForbiddenException
    );
  });
});
