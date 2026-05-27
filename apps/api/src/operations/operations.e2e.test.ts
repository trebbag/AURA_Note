import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';

describe('standalone operations API', () => {
  let app: INestApplication;

  before(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  after(async () => {
    await app.close();
  });

  it('supports task inbox and MA follow-up blocker adjudication with role denial', async () => {
    const tasks = await request(app.getHttpServer())
      .get('/api/v1/standalone/operations/tasks')
      .set('x-aura-role', 'ma')
      .expect(200);

    assert.equal(tasks.body.data.counts.maFollowUp >= 1, true);
    assert.equal(tasks.body.data.states.includes('permission-denied'), true);

    const updated = await request(app.getHttpServer())
      .patch('/api/v1/standalone/operations/tasks/task-ma-gap-001')
      .set('x-aura-role', 'ma')
      .send({ adjudicationStatus: 'answered', blocksSigning: false, resolutionNote: 'Synthetic answer only.' })
      .expect(200);

    assert.equal(updated.body.data.task.blocksSigning, false);
    assert.equal(updated.body.data.domainEvents.some((event: { eventType: string }) => event.eventType === 'task.blocker_changed.v1'), true);

    await request(app.getHttpServer())
      .patch('/api/v1/standalone/operations/tasks/task-ma-gap-001')
      .set('x-aura-role', 'support')
      .send({ adjudicationStatus: 'closed' })
      .expect(403);
  });

  it('limits billing review transcript access and blocks support users', async () => {
    const denied = await request(app.getHttpServer())
      .get('/api/v1/standalone/operations/billing-review')
      .set('x-aura-role', 'billing_staff')
      .expect(200);

    assert.equal(denied.body.data.items[0].transcriptAccess, 'denied');

    const allowed = await request(app.getHttpServer())
      .get('/api/v1/standalone/operations/billing-review')
      .set('x-aura-role', 'billing_staff')
      .set('x-aura-billing-review-triggered', 'true')
      .expect(200);

    assert.equal(allowed.body.data.items[0].transcriptAccess, 'allowed_for_triggered_review');
    assert.equal(allowed.body.data.items[0].draftClaimPreview.submittedClaim, false);

    await request(app.getHttpServer())
      .get('/api/v1/standalone/operations/billing-review')
      .set('x-aura-role', 'support')
      .expect(403);
  });

  it('supports settings, templates, estimates, and rules catalog safely', async () => {
    const settings = await request(app.getHttpServer())
      .get('/api/v1/standalone/operations/settings')
      .set('x-aura-role', 'admin')
      .expect(200);

    assert.equal(settings.body.data.integrations[0].liveCredentialPresent, false);

    const integration = await request(app.getHttpServer())
      .patch('/api/v1/standalone/operations/settings/integrations/integration-athenahealth')
      .set('x-aura-role', 'admin')
      .send({ status: 'mock_ready', reason: 'Synthetic readiness review.' })
      .expect(200);

    assert.equal(integration.body.data.domainEvents[0].eventType, 'settings.integration_updated.v1');

    const template = await request(app.getHttpServer())
      .post('/api/v1/standalone/operations/templates')
      .set('x-aura-role', 'clinician')
      .send({
        name: 'Synthetic TCM',
        visitType: 'TCM',
        sections: ['Transition review', 'Medication reconciliation'],
        variables: ['{{follow_up_interval}}']
      })
      .expect(201);

    assert.equal(template.body.data.template.syntheticOnly, true);

    await request(app.getHttpServer())
      .post('/api/v1/standalone/operations/templates')
      .set('x-aura-role', 'clinician')
      .send({
        name: 'Unsafe',
        visitType: 'TCM',
        sections: ['MRN: 12345'],
        variables: ['{{follow_up_interval}}']
      })
      .expect(400);

    const dotPhrase = await request(app.getHttpServer())
      .patch('/api/v1/standalone/operations/dot-phrases/dotphrase-awv-counseling')
      .set('x-aura-role', 'clinician')
      .send({
        expansion: 'Reviewed preventive plan and return timing {{follow_up_interval}}.',
        variables: ['{{follow_up_interval}}']
      })
      .expect(200);

    assert.equal(dotPhrase.body.data.dotPhrase.syntheticOnly, true);

    await request(app.getHttpServer())
      .patch('/api/v1/standalone/operations/estimate-config')
      .set('x-aura-role', 'admin')
      .send({
        internalEstimatesEnabled: true,
        patientFacingEstimatesEnabled: true,
        caveatText: 'Internal estimate support is not a patient-facing financial conclusion.'
      })
      .expect(400);

    const rules = await request(app.getHttpServer())
      .post('/api/v1/standalone/operations/rules-catalog/publish')
      .set('x-aura-role', 'compliance_privacy_lead')
      .send({
        ruleIds: ['rule-cpt-99214-source-evidence'],
        attestation: 'Human review required before any use.'
      })
      .expect(201);

    assert.equal(rules.body.data.rulesCatalog.certifiedProductionRules, false);
  });
});
