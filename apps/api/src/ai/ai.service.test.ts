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
});
