import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OperationsService } from './operations.service';

describe('OperationsService', () => {
  it('limits billing transcript access to triggered billing review context', () => {
    const service = new OperationsService();
    const denied = service.listBillingReviews(service.createRequestContext({ 'x-aura-role': 'billing_staff' }));

    assert.equal(denied.data.items[0]?.transcriptAccess, 'denied');

    const allowed = service.listBillingReviews(
      service.createRequestContext({ 'x-aura-role': 'billing_staff', 'x-aura-billing-review-triggered': 'true' })
    );

    assert.equal(allowed.data.items[0]?.transcriptAccess, 'allowed_for_triggered_review');
    assert.equal(allowed.data.transcriptAccessLimitedToTriggeredReview, true);
  });

  it('enforces role-limited MA task updates and emits blocker evidence', () => {
    const service = new OperationsService();
    const response = service.updateTask(
      'task-ma-gap-001',
      { adjudicationStatus: 'answered', blocksSigning: false, resolutionNote: 'Synthetic answer recorded.' },
      service.createRequestContext({ 'x-aura-role': 'ma' })
    );

    assert.equal(response.data.task?.adjudicationStatus, 'answered');
    assert.equal(response.data.task?.blocksSigning, false);
    assert.equal(response.data.domainEvents.some((event) => event.eventType === 'task.blocker_changed.v1'), true);

    assert.throws(
      () =>
        service.updateTask(
          'task-ma-gap-001',
          { adjudicationStatus: 'closed' },
          service.createRequestContext({ 'x-aura-role': 'billing_staff' })
        ),
      ForbiddenException
    );
  });

  it('rejects patient-facing estimates and PHI-bearing template text', () => {
    const service = new OperationsService();

    assert.throws(
      () =>
        service.updateEstimateConfig(
          {
            internalEstimatesEnabled: true,
            patientFacingEstimatesEnabled: true,
            caveatText: 'Internal estimate support is not a patient-facing financial conclusion.'
          },
          service.createRequestContext({ 'x-aura-role': 'admin' })
        ),
      BadRequestException
    );

    assert.throws(
      () =>
        service.createTemplate(
          {
            name: 'Unsafe template',
            visitType: 'AWV',
            sections: ['MRN: 12345'],
            variables: ['{{safe_variable}}']
          },
          service.createRequestContext({ 'x-aura-role': 'clinician' })
        ),
      BadRequestException
    );
  });

  it('publishes rules only with human-review attestation', () => {
    const service = new OperationsService();

    assert.throws(
      () =>
        service.publishRulesCatalog(
          { ruleIds: ['rule-cpt-99214-source-evidence'], attestation: 'publish' },
          service.createRequestContext({ 'x-aura-role': 'compliance_privacy_lead' })
        ),
      BadRequestException
    );

    const response = service.publishRulesCatalog(
      { ruleIds: ['rule-cpt-99214-source-evidence'], attestation: 'Human review required and retained.' },
      service.createRequestContext({ 'x-aura-role': 'compliance_privacy_lead' })
    );

    assert.equal(response.data.rulesCatalog?.entries.find((entry) => entry.ruleId === 'rule-cpt-99214-source-evidence')?.status, 'active');
    assert.equal(response.data.rulesCatalog?.draftOnly, true);
  });
});
