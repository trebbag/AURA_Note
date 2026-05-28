import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AiService } from './ai.service';

const evidence = [
  {
    evidenceId: 'evidence-synthetic-001',
    evidenceType: 'chart_slice' as const,
    sourceSystem: 'synthetic_fixture' as const,
    sourceRef: 'chart-synthetic-001',
    displayLabel: 'Synthetic chart slice',
    excerptOrValue: 'Synthetic deidentified value',
    freshness: 'recent' as const,
    sourceQuality: 'high' as const,
    phiClassification: 'deidentified' as const,
    allowedRoles: ['clinician']
  }
];

describe('AI API service', () => {
  it('reports mock-only gateway status without enabling external AI', () => {
    const service = new AiService();
    const status = service.getStatus({
      'x-aura-role': 'clinician',
      'x-aura-linked-visit': 'true',
      'x-trace-id': 'trace-ai-status-001'
    });

    assert.equal(status.data.externalAiEnabled, false);
    assert.equal(status.data.providerMode, 'mock');
    assert.equal(status.data.promptRegistry.some((entry) => entry.purpose === 'suggestions'), true);
    assert.equal(status.data.modelConfigurations?.every((config) => config.liveInvocationEnabled === false), true);
    assert.equal(status.data.evaluationCases?.some((evalCase) => evalCase.purpose === 'billing_preview'), true);
    assert.equal(status.data.rawPhiToExternalAiAllowed, false);
  });

  it('rejects raw PHI before model invocation and emits PHI rejection metadata', async () => {
    const service = new AiService();

    await assert.rejects(
      () =>
        service.invokeMock(
          {
            purpose: 'suggestions',
            safePatientId: 'safe-patient-synthetic-001',
            phiHandling: 'reject',
            clinicalFacts: { patientName: 'Synthetic Person' },
            evidence
          },
          {
            'x-aura-role': 'clinician',
            'x-aura-linked-visit': 'true',
            'x-trace-id': 'trace-ai-reject-api-001'
          }
        ),
      (error) => {
        assert.equal(error instanceof BadRequestException, true);
        const response = (error as BadRequestException).getResponse() as {
          code: string;
          rejectedPaths: string[];
          domainEvents: Array<{ eventType: string }>;
        };
        assert.equal(response.code, 'AI_PHI_BOUNDARY_REJECTED');
        assert.equal(response.rejectedPaths.includes('clinicalFacts.patientName'), true);
        assert.equal(response.domainEvents[0]?.eventType, 'ai.phi_rejected.v1');
        return true;
      }
    );
  });

  it('redacts raw PHI in explicit redaction mode and records governance events', async () => {
    const service = new AiService();
    const invocation = await service.invokeMock(
      {
        purpose: 'suggestions',
        safePatientId: 'safe-patient-synthetic-001',
        noteId: 'note-synthetic-001',
        phiHandling: 'redact',
        clinicalFacts: {
          patientName: 'Synthetic Person',
          finding: 'Synthetic deidentified finding'
        },
        evidence
      },
      {
        'x-aura-role': 'clinician',
        'x-aura-linked-visit': 'true',
        'x-trace-id': 'trace-ai-redact-api-001'
      }
    );

    assert.equal(invocation.data.contextPackage.redactedPaths.includes('clinicalFacts.patientName'), true);
    assert.equal(invocation.data.response.modelMode, 'mock');
    assert.equal(invocation.data.response.humanReviewRequired, true);
    assert.equal(invocation.data.domainEvents.some((event) => event.eventType === 'ai.context_scrubbed.v1'), true);
    assert.equal(invocation.data.domainEvents.some((event) => event.eventType === 'ai.response_recorded.v1'), true);
  });

  it('denies billing-only users from invoking the gateway', async () => {
    const service = new AiService();

    await assert.rejects(
      () =>
        service.invokeMock(
          {
            purpose: 'suggestions',
            safePatientId: 'safe-patient-synthetic-001',
            clinicalFacts: { finding: 'Synthetic deidentified finding' },
            evidence
          },
          {
            'x-aura-role': 'billing_staff',
            'x-aura-linked-visit': 'true',
            'x-trace-id': 'trace-ai-forbidden-001'
          }
        ),
      ForbiddenException
    );
  });

  it('denies cross-tenant AI gateway access before context packaging', () => {
    const service = new AiService();

    assert.throws(
      () =>
        service.getStatus({
          'x-aura-role': 'clinician',
          'x-aura-linked-visit': 'true',
          'x-aura-tenant-id': 'tenant-other'
        }),
      ForbiddenException
    );
  });

  it('runs deterministic governance evaluations without live model calls', async () => {
    const service = new AiService();
    const response = await service.runEvaluations(
      { evalCaseIds: ['eval-suggestions-source-linked-v1', 'eval-billing-preview-candidate-only-v1'] },
      {
        'x-aura-role': 'compliance_privacy_lead',
        'x-aura-purpose-of-use': 'audit',
        'x-trace-id': 'trace-ai-eval-api-001',
        'idempotency-key': 'idem-ai-eval-001'
      }
    );

    assert.equal(response.data.allPassed, true);
    assert.equal(response.data.liveModelCalled, false);
    assert.equal(response.data.results.length, 2);
    assert.equal(response.data.results.every((result) => result.humanReviewRequired === true), true);
    assert.equal(response.data.domainEvents[0]?.eventType, 'ai.evaluation_run_completed.v1');
  });

  it('rejects unsafe output shapes through validation endpoint evidence', () => {
    const service = new AiService();
    const response = service.validateOutput(
      {
        outputType: 'candidate',
        output: { submitsClaim: true, finalizesCharge: true },
        sourceEvidenceIds: ['evidence-synthetic-001']
      },
      {
        'x-aura-role': 'authorized_admin',
        'x-aura-purpose-of-use': 'audit',
        'x-trace-id': 'trace-ai-validation-api-001'
      }
    );

    assert.equal(response.data.validation.validationStatus, 'rejected');
    assert.equal(response.data.validation.prohibitedActionDetected, true);
    assert.equal(response.data.domainEvents[0]?.eventType, 'ai.output_rejected.v1');
  });

  it('denies governance metadata operations to support users', async () => {
    const service = new AiService();

    await assert.rejects(
      () =>
        service.runEvaluations(
          { evalCaseIds: ['eval-suggestions-source-linked-v1'] },
          {
            'x-aura-role': 'support',
            'x-aura-purpose-of-use': 'support',
            'x-trace-id': 'trace-ai-support-denied-001'
          }
        ),
      ForbiddenException
    );
  });
});
