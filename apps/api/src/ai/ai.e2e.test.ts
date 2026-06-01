import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { configureAuraApi } from '../runtime/api-runtime';

describe('AI gateway API e2e', () => {
  let app: INestApplication;

  before(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    configureAuraApi(app);
    await app.init();
  });

  after(async () => {
    await app.close();
  });

  it('exposes mock-only status and blocks raw PHI by default', async () => {
    const status = await request(app.getHttpServer())
      .get('/api/v1/ai-gateway/status')
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-visit', 'true')
      .expect(200);

    assert.equal(status.body.data.externalAiEnabled, false);
    assert.equal(status.body.data.providerMode, 'mock');
    assert.equal(status.body.data.liveModelCredentialPresent, false);
    assert.equal(status.body.data.runtimeBoundary.providerBoundary, 'server_side_ai_gateway');
    assert.equal(status.body.data.evaluationCases.some((evalCase: { purpose: string }) => evalCase.purpose === 'coaching'), true);
    assert.equal(status.body.data.evaluationCases.some((evalCase: { blockedBehavior?: string }) => evalCase.blockedBehavior === 'claim_submission'), true);

    const boundary = await request(app.getHttpServer())
      .get('/api/v1/ai-gateway/runtime-boundary')
      .set('x-aura-role', 'compliance_privacy_lead')
      .set('x-aura-purpose-of-use', 'audit')
      .expect(200);

    assert.equal(boundary.body.data.runtimeBoundary.liveModelCallsEnabled, false);
    assert.equal(boundary.body.data.runtimeBoundary.prohibitedBehaviorCoverage.includes('medical_necessity_determination'), true);
    assert.equal(boundary.body.data.domainEvents[0].eventType, 'ai.runtime_boundary_checked.v1');

    const rejected = await request(app.getHttpServer())
      .post('/api/v1/ai-gateway/mock-invocations')
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-visit', 'true')
      .send({
        purpose: 'suggestions',
        safePatientId: 'safe-patient-synthetic-001',
        clinicalFacts: { patientName: 'Synthetic Person' },
        evidence: []
      })
      .expect(400);

    const rejectionPayload = rejected.body.error.details ?? rejected.body.error;
    assert.equal(rejectionPayload.code, 'AI_PHI_BOUNDARY_REJECTED');
    assert.equal(rejectionPayload.domainEvents[0].eventType, 'ai.phi_rejected.v1');
    assert.equal(rejectionPayload.domainEvents[1].eventType, 'ai.request_denied.v1');
    assert.equal(rejected.body.error.category, 'validation');
    assert.equal(rejected.body.error.redacted, true);
  });

  it('allows explicit PHI redaction for mock invocation and keeps output draft-only', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/ai-gateway/mock-invocations')
      .set('x-aura-role', 'clinician')
      .set('x-aura-linked-visit', 'true')
      .set('x-trace-id', 'trace-ai-e2e-redact-001')
      .send({
        purpose: 'suggestions',
        safePatientId: 'safe-patient-synthetic-001',
        noteId: 'note-synthetic-001',
        phiHandling: 'redact',
        clinicalFacts: {
          patientName: 'Synthetic Person',
          finding: 'Synthetic deidentified finding'
        },
        evidence: [
          {
            evidenceId: 'evidence-synthetic-001',
            evidenceType: 'chart_slice',
            sourceSystem: 'synthetic_fixture',
            sourceRef: 'chart-synthetic-001',
            displayLabel: 'Synthetic chart slice',
            excerptOrValue: 'Synthetic deidentified value',
            freshness: 'recent',
            sourceQuality: 'high',
            phiClassification: 'deidentified',
            allowedRoles: ['clinician']
          }
        ]
      })
      .expect(201);

    assert.equal(response.body.data.contextPackage.clinicalFacts.patientName, '[REDACTED]');
    assert.equal(response.body.data.response.output.draftOnly, true);
    assert.equal(response.body.data.response.rejected, false);
    assert.equal(response.body.data.domainEvents.some((event: { eventType: string }) => event.eventType === 'ai.response_recorded.v1'), true);
  });

  it('runs deterministic governance evaluations and rejects unsafe outputs', async () => {
    const evalRun = await request(app.getHttpServer())
      .post('/api/v1/ai-gateway/evaluations/run')
      .set('x-aura-role', 'compliance_privacy_lead')
      .set('x-aura-purpose-of-use', 'audit')
      .set('x-trace-id', 'trace-ai-e2e-eval-001')
      .send({
        evalCaseIds: ['eval-patient-summary-no-internal-details-v1', 'eval-claim-submission-rejected-v1', 'eval-source-stale-human-review-blocked-v1']
      })
      .expect(201);

    assert.equal(evalRun.body.data.allPassed, true);
    assert.equal(evalRun.body.data.liveModelCalled, false);
    assert.equal(evalRun.body.data.regressionBlockedCount, 2);
    assert.equal(evalRun.body.data.prohibitedBehaviorCoverage.includes('claim_submission'), true);
    assert.equal(evalRun.body.data.prohibitedBehaviorCoverage.includes('source_stale'), true);
    assert.equal(evalRun.body.data.domainEvents[0].eventType, 'ai.evaluation_run_completed.v1');
    assert.equal(evalRun.body.data.domainEvents.some((event: { eventType: string }) => event.eventType === 'ai.regression_blocked.v1'), true);

    const rejected = await request(app.getHttpServer())
      .post('/api/v1/ai-gateway/outputs/validate')
      .set('x-aura-role', 'authorized_admin')
      .set('x-aura-purpose-of-use', 'audit')
      .set('x-trace-id', 'trace-ai-e2e-validate-001')
      .send({
        outputType: 'candidate',
        output: { determinesMedicalNecessity: true },
        sourceEvidenceIds: ['evidence-synthetic-001']
      })
      .expect(201);

    assert.equal(rejected.body.data.validation.validationStatus, 'rejected');
    assert.equal(rejected.body.data.validation.riskLabel, 'unsafe');
    assert.equal(rejected.body.data.validation.schemaValidationStatus, 'invalid');
    assert.equal(rejected.body.data.validation.blockedBehavior, 'medical_necessity_determination');
    assert.equal(rejected.body.data.domainEvents[0].eventType, 'ai.output_rejected.v1');
    assert.equal(rejected.body.data.domainEvents.some((event: { eventType: string }) => event.eventType === 'ai.human_review_required.v1'), true);
  });

  it('denies governance evaluation runs to support users', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/ai-gateway/evaluations/run')
      .set('x-aura-role', 'support')
      .set('x-aura-purpose-of-use', 'support')
      .send({ evalCaseIds: ['eval-suggestions-source-linked-v1'] })
      .expect(403);
  });
});
