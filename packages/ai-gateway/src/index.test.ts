import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AURA_NOTE_AI_SAFETY_POLICY,
  ExternalDisabledModelProvider,
  MockAiModelProvider,
  buildAiGovernanceEventPayload,
  createAiGatewayRequest,
  getPromptRegistryEntry,
  invokeGovernedMockAi,
  prepareAiContextPackage,
  scanAiContextForPhi,
  validateAiGatewayResponse,
  type AiEvidenceNode
} from './index';

const evidence: AiEvidenceNode[] = [
  {
    evidenceId: 'evidence-synthetic-001',
    evidenceType: 'chart_slice',
    sourceSystem: 'synthetic_fixture',
    sourceRef: 'chart-context-synthetic-001',
    displayLabel: 'Synthetic A1c trend',
    excerptOrValue: 'A1c elevated in synthetic chart context.',
    freshness: 'recent',
    sourceQuality: 'high',
    phiClassification: 'deidentified',
    allowedRoles: ['clinician']
  }
];

describe('AI gateway PHI boundary', () => {
  it('rejects raw forbidden PHI keys before creating a model request', () => {
    const prepared = prepareAiContextPackage(
      {
        tenantId: 'tenant-synthetic-primary',
        siteId: 'site-synthetic-primary',
        safePatientId: 'safe-patient-synthetic-001',
        noteId: 'note-synthetic-001',
        clinicalFacts: { patientName: 'Synthetic Person', problemList: ['Synthetic diabetes'] },
        evidence,
        traceId: 'trace-ai-reject-001'
      },
      'reject',
      '2026-05-26T17:00:00.000Z'
    );

    assert.equal(prepared.package.rejectedPaths.includes('clinicalFacts.patientName'), true);
    assert.throws(
      () =>
        createAiGatewayRequest({
          purpose: 'suggestions',
          contextPackage: prepared.package,
          traceId: 'trace-ai-reject-001'
        }),
      /rejected context package/
    );
  });

  it('redacts forbidden PHI keys and preserves evidence IDs for mock-only invocation', async () => {
    const prepared = prepareAiContextPackage(
      {
        tenantId: 'tenant-synthetic-primary',
        siteId: 'site-synthetic-primary',
        safePatientId: 'safe-patient-synthetic-001',
        noteId: 'note-synthetic-001',
        appointmentId: 'appt-synthetic-001',
        visitType: 'Chronic follow-up',
        clinicalFacts: {
          patientName: 'Synthetic Person',
          medications: ['Synthetic medication'],
          assessment: 'Deidentified synthetic assessment'
        },
        evidence,
        traceId: 'trace-ai-redact-001'
      },
      'redact',
      '2026-05-26T17:05:00.000Z'
    );

    const request = createAiGatewayRequest({
      purpose: 'suggestions',
      contextPackage: prepared.package,
      traceId: 'trace-ai-redact-001'
    });
    const response = await invokeGovernedMockAi({
      purpose: 'suggestions',
      contextPackage: prepared.package,
      traceId: 'trace-ai-redact-001',
      expectedOutput: { draftOnly: true, items: [] }
    });

    assert.equal(prepared.package.redactedPaths.includes('clinicalFacts.patientName'), true);
    assert.equal((prepared.package.clinicalFacts.patientName as string), '[REDACTED]');
    assert.equal(request.promptId, 'aura-note-suggestions-v1');
    assert.equal(response.modelMode, 'mock');
    assert.equal(response.humanReviewRequired, true);
    assert.deepEqual(response.sourceEvidenceIds, ['evidence-synthetic-001']);
  });

  it('detects obvious PHI-like free-text patterns in nested values', () => {
    const scan = scanAiContextForPhi({
      safePatientId: 'safe-patient-synthetic-001',
      summary: 'Contact synthetic@example.invalid for follow-up'
    });

    assert.equal(scan.containsPhi, true);
    assert.equal(scan.paths.includes('summary'), true);
  });
});

describe('AI gateway safety policy', () => {
  it('keeps external AI disabled by default and marks provider output rejected', async () => {
    const prepared = prepareAiContextPackage(
      {
        tenantId: 'tenant-synthetic-primary',
        siteId: 'site-synthetic-primary',
        safePatientId: 'safe-patient-synthetic-001',
        clinicalFacts: { visitType: 'Synthetic follow-up' },
        evidence,
        traceId: 'trace-ai-disabled-001'
      },
      'reject',
      '2026-05-26T17:10:00.000Z'
    );
    const request = createAiGatewayRequest({
      purpose: 'compose_note',
      contextPackage: prepared.package,
      traceId: 'trace-ai-disabled-001'
    });
    const response = await new ExternalDisabledModelProvider().invoke({
      request,
      policy: AURA_NOTE_AI_SAFETY_POLICY
    });

    assert.equal(AURA_NOTE_AI_SAFETY_POLICY.externalAiEnabled, false);
    assert.equal(response.modelMode, 'external_disabled');
    assert.equal(response.rejected, true);
    assert.equal(response.humanReviewRequired, true);
  });

  it('rejects model output attempting prohibited autonomous behavior', () => {
    assert.throws(
      () =>
        validateAiGatewayResponse({
          output: { finalizesClinicalDecision: true },
          outputType: 'suggestion',
          modelMode: 'mock',
          warnings: [],
          humanReviewRequired: true,
          sourceEvidenceIds: [],
          rejected: false
        }),
      /prohibited autonomous action/
    );
  });

  it('records governance-safe metadata without raw clinical payloads', async () => {
    const prepared = prepareAiContextPackage(
      {
        tenantId: 'tenant-synthetic-primary',
        siteId: 'site-synthetic-primary',
        safePatientId: 'safe-patient-synthetic-001',
        clinicalFacts: { finding: 'Synthetic chart fact' },
        evidence,
        traceId: 'trace-ai-governance-001'
      },
      'reject',
      '2026-05-26T17:15:00.000Z'
    );
    const request = createAiGatewayRequest({
      purpose: 'patient_summary',
      contextPackage: prepared.package,
      traceId: 'trace-ai-governance-001'
    });
    const response = await new MockAiModelProvider().invoke({
      request,
      policy: AURA_NOTE_AI_SAFETY_POLICY
    });
    const payload = buildAiGovernanceEventPayload({ request, response, status: 'response_recorded' });

    assert.equal(getPromptRegistryEntry('patient_summary').humanReviewRequired, true);
    assert.equal(payload.contextPackageId, 'ai-context-trace-ai-governance-001');
    assert.deepEqual(payload.sourceEvidenceIds, ['evidence-synthetic-001']);
    assert.equal('clinicalFacts' in payload, false);
  });
});
