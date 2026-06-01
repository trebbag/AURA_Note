import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AURA_NOTE_AI_SAFETY_POLICY,
  AI_EVALUATION_CASES,
  AI_MODEL_CONFIGURATIONS,
  ExternalDisabledModelProvider,
  MockAiModelProvider,
  buildAiGovernanceEventPayload,
  createAiGatewayRequest,
  getPromptRegistryEntry,
  invokeGovernedMockAi,
  inspectAiGatewayResponse,
  prepareAiContextPackage,
  runDeterministicAiEvaluationCase,
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

  it('redacts obvious PHI-like evidence text in explicit redaction mode', () => {
    const prepared = prepareAiContextPackage(
      {
        tenantId: 'tenant-synthetic-primary',
        siteId: 'site-synthetic-primary',
        safePatientId: 'safe-patient-synthetic-001',
        clinicalFacts: { finding: 'Synthetic deidentified finding' },
        evidence: [
          {
            ...evidence[0]!,
            excerptOrValue: 'synthetic@example.invalid'
          }
        ],
        traceId: 'trace-ai-evidence-redact-001'
      },
      'redact',
      '2026-05-28T00:00:00.000Z'
    );

    assert.equal(prepared.package.redactedPaths.includes('evidence[0].excerptOrValue'), true);
    assert.equal(prepared.package.evidence[0]?.excerptOrValue, '[REDACTED]');
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

  it('returns structured output validation evidence for unsafe shapes', () => {
    const result = inspectAiGatewayResponse({
      output: { submitsClaim: true, patientFacingFinancialConclusion: true },
      outputType: 'candidate',
      modelMode: 'mock',
      warnings: [],
      humanReviewRequired: true,
      sourceEvidenceIds: ['evidence-synthetic-001'],
      rejected: false
    });

    assert.equal(result.validationStatus, 'rejected');
    assert.equal(result.riskLabel, 'unsafe');
    assert.equal(result.schemaValidationStatus, 'invalid');
    assert.equal(result.blockedBehavior, 'claim_submission');
    assert.equal(result.prohibitedActionDetected, true);
    assert.equal(result.humanReviewRequired, true);
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

  it('runs deterministic evaluation cases without live model calls', async () => {
    const result = await runDeterministicAiEvaluationCase({
      caseId: 'eval-billing-preview-candidate-only-v1',
      evidence,
      traceId: 'trace-ai-eval-001',
      nowIso: '2026-05-28T00:05:00.000Z'
    });

    assert.equal(AI_EVALUATION_CASES.length >= 15, true);
    assert.equal(AI_MODEL_CONFIGURATIONS.every((config) => config.liveInvocationEnabled === false), true);
    assert.equal(result.passed, true);
    assert.equal(result.liveModelCalled, false);
    assert.equal(result.promptId, 'aura-note-billing-preview-v1');
    assert.equal(result.validationStatus, 'accepted');
    assert.equal(result.schemaValidationStatus, 'valid');
    assert.equal(result.humanReviewRequired, true);
  });

  it('blocks deterministic prohibited-output evaluation cases without live model calls', async () => {
    const result = await runDeterministicAiEvaluationCase({
      caseId: 'eval-claim-submission-rejected-v1',
      evidence,
      traceId: 'trace-ai-eval-claim-block-001',
      nowIso: '2026-06-01T17:00:00.000Z'
    });

    assert.equal(result.passed, true);
    assert.equal(result.validationStatus, 'rejected');
    assert.equal(result.riskLabel, 'unsafe');
    assert.equal(result.schemaValidationStatus, 'invalid');
    assert.equal(result.blockedBehavior, 'claim_submission');
    assert.equal(result.liveModelCalled, false);
  });

  it('blocks stale-source evaluation cases before user-facing adoption', async () => {
    const result = await runDeterministicAiEvaluationCase({
      caseId: 'eval-source-stale-human-review-blocked-v1',
      evidence,
      traceId: 'trace-ai-eval-source-stale-001',
      nowIso: '2026-06-01T17:01:00.000Z'
    });

    assert.equal(result.passed, true);
    assert.equal(result.sourceFreshnessStatus, 'stale');
    assert.equal(result.blockedBehavior, 'source_stale');
    assert.equal(result.validationStatus, 'rejected');
  });
});
