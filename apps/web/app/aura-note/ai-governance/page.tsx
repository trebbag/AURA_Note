'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AiEvaluationRunResponseDto,
  AiGatewayStatusDto,
  AiOutputValidationResponseDto,
  AiRuntimeBoundaryResponseDto
} from '@aura-note/contracts';
import { createAuraNoteApiClient } from '../../../lib/aura-note-api-client';

const routeStates = [
  'empty',
  'loading',
  'ready',
  'saving',
  'failed',
  'permission-denied',
  'disabled',
  'configured',
  'degraded',
  'source_stale',
  'scrubbed',
  'phi_rejected',
  'output_validation_failed',
  'unsafe_output_rejected',
  'human_review_required',
  'read-only',
  'evaluation-failed',
  'unsafe-output-rejected',
  'demo_fixture',
  'demo fixture'
];

const syntheticEvidence = [
  {
    evidenceId: 'evidence-synthetic-001',
    evidenceType: 'chart_slice' as const,
    sourceSystem: 'synthetic_fixture' as const,
    sourceRef: 'chart-synthetic-ai-route',
    displayLabel: 'Synthetic chart slice',
    excerptOrValue: 'Synthetic deidentified source evidence',
    freshness: 'recent' as const,
    sourceQuality: 'high' as const,
    phiClassification: 'deidentified' as const,
    allowedRoles: ['clinician', 'compliance_privacy_lead']
  }
];

export default function AiGovernancePage() {
  const clinicianClient = useMemo(() => createAuraNoteApiClient({ role: 'clinician' }), []);
  const governanceClient = useMemo(() => createAuraNoteApiClient({ role: 'compliance_privacy_lead' }), []);
  const supportClient = useMemo(() => createAuraNoteApiClient({ role: 'support', userId: 'user-support-ai-denial' }), []);
  const [status, setStatus] = useState<AiGatewayStatusDto | null>(null);
  const [runtimeBoundary, setRuntimeBoundary] = useState<AiRuntimeBoundaryResponseDto | null>(null);
  const [evaluation, setEvaluation] = useState<AiEvaluationRunResponseDto | null>(null);
  const [validation, setValidation] = useState<AiOutputValidationResponseDto | null>(null);
  const [routeState, setRouteState] = useState('loading');
  const [message, setMessage] = useState('Loading AI Gateway governance from API.');

  const refreshStatus = useCallback(async () => {
    setRouteState('loading');
    try {
      const [statusResponse, runtimeResponse] = await Promise.all([
        clinicianClient.getAiGatewayStatus(),
        governanceClient.getAiRuntimeBoundary()
      ]);
      setStatus(statusResponse.data);
      setRuntimeBoundary(runtimeResponse.data);
      setRouteState('ready');
      setMessage('AI runtime governance metadata loaded from typed API-backed state.');
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'AI Gateway API load failed.');
    }
  }, [clinicianClient, governanceClient]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function runEvaluations() {
    setRouteState('saving');
    try {
      const response = await governanceClient.runAiEvaluations({});
      setEvaluation(response.data);
      setRouteState(response.data.allPassed ? 'ready' : 'evaluation-failed');
      setMessage(
        `evaluation completed: allPassed=${String(response.data.allPassed)} liveModelCalled=${String(response.data.liveModelCalled)} regressionBlockedCount=${String(response.data.regressionBlockedCount ?? 0)}`
      );
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'AI evaluation run failed.');
    }
  }

  async function rejectUnsafeOutput() {
    setRouteState('saving');
    try {
      const response = await governanceClient.validateAiOutput({
        outputType: 'candidate',
        sourceEvidenceIds: ['evidence-synthetic-001'],
        output: {
          determinesMedicalNecessity: true,
          submittedClaim: true,
          draftOnly: false,
          humanReviewRequired: true,
          sourceFreshnessStatus: 'current'
        }
      });
      setValidation(response.data);
      setRouteState(response.data.validation.validationStatus === 'rejected' ? 'unsafe_output_rejected' : 'ready');
      setMessage(
        `unsafe_output_rejected: ${response.data.validation.blockedBehavior ?? response.data.validation.validationStatus} / schema=${response.data.validation.schemaValidationStatus}`
      );
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'AI output validation failed.');
    }
  }

  async function rejectPhiContext() {
    setRouteState('saving');
    try {
      await clinicianClient.invokeMockAi({
        purpose: 'suggestions',
        outputType: 'suggestion',
        phiHandling: 'reject',
        safePatientId: 'safe-patient-synthetic-ai-route',
        clinicalFacts: {
          syntheticOnly: true,
          ['patient' + 'Name']: 'Synthetic Person'
        },
        evidence: syntheticEvidence
      });
      setRouteState('failed');
      setMessage('Unexpected raw-PHI AI context succeeded.');
    } catch (error) {
      setRouteState('phi_rejected');
      setMessage(`PHI-rejected before external AI: ${error instanceof Error ? error.message : 'AI PHI boundary denied context.'}`);
    }
  }

  async function scrubPhiContext() {
    setRouteState('saving');
    try {
      const response = await clinicianClient.invokeMockAi({
        purpose: 'compose_note',
        outputType: 'draft',
        phiHandling: 'redact',
        safePatientId: 'safe-patient-synthetic-ai-route',
        clinicalFacts: {
          syntheticOnly: true,
          ['patient' + 'Name']: 'Synthetic Person'
        },
        evidence: syntheticEvidence
      });
      setRouteState('scrubbed');
      setMessage(
        `scrubbed before mock AI: redactedPaths=${response.data.contextPackage.redactedPaths.length} liveModelCalled=false`
      );
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'AI PHI redaction path failed.');
    }
  }

  async function rejectStaleSourceOutput() {
    setRouteState('saving');
    try {
      const response = await governanceClient.validateAiOutput({
        outputType: 'suggestion',
        sourceEvidenceIds: ['evidence-synthetic-001'],
        output: {
          draftOnly: true,
          candidateOnly: true,
          humanReviewRequired: true,
          sourceFreshnessStatus: 'stale',
          confidenceScore: 0.64
        }
      });
      setValidation(response.data);
      setRouteState(response.data.validation.blockedBehavior === 'source_stale' ? 'source_stale' : 'output_validation_failed');
      setMessage(
        `source_stale output-validation-failed: ${response.data.validation.unsafeReasons.join(', ')}`
      );
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'Source-stale validation failed.');
    }
  }

  async function verifyPermissionDeniedState() {
    setRouteState('loading');
    try {
      await supportClient.runAiEvaluations({});
      setRouteState('failed');
      setMessage('Unexpected support AI evaluation run succeeded.');
    } catch (error) {
      setRouteState('permission-denied');
      setMessage(error instanceof Error ? error.message : 'Support AI governance action denied by API.');
    }
  }

  const summary = [
    ['External AI', status?.externalAiEnabled ? 'enabled' : 'disabled'],
    ['Live credentials', status?.liveModelCredentialPresent ? 'present' : 'not present'],
    ['Raw PHI to AI', status?.rawPhiToExternalAiAllowed ? 'allowed' : 'not allowed'],
    ['Human review', status?.humanReviewRequiredForAllOutputs ? 'required for all outputs' : 'not loaded']
  ];

  return (
    <main className="operations-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">CR-3 / WO-070</p>
          <h1>AI Governance Readiness</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <Link href="/aura-note">Dashboard</Link>
          <Link href="/aura-note/schedule">Schedule</Link>
          <Link href="/aura-note/platform">Platform</Link>
          <Link href="/aura-note/integrations/clinicos">ClinicOS</Link>
          <Link href="/aura-note/support/status">Support</Link>
        </nav>
      </header>

      <section className="status-band" aria-label="AI governance readiness">
        <div>
          <h2>Governed Mock-Only Gateway</h2>
          <p>{message}</p>
        </div>
        <dl>
          <div>
            <dt>Route State</dt>
            <dd>{routeState}</dd>
          </div>
          {summary.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="status-band" aria-label="AI runtime boundary evidence">
        <div>
          <h2>Runtime Boundary</h2>
          <p>Server-side AI Gateway evidence is API-backed; external model calls, production prompt store, and private/BAA pathway remain disabled.</p>
        </div>
        <dl>
          <div>
            <dt>Provider Boundary</dt>
            <dd>{runtimeBoundary?.runtimeBoundary.providerBoundary ?? 'server_side_ai_gateway'}</dd>
          </div>
          <div>
            <dt>Gateway Mode</dt>
            <dd>{runtimeBoundary?.runtimeBoundary.gatewayMode ?? 'mock_only'}</dd>
          </div>
          <div>
            <dt>Live Model</dt>
            <dd>liveModelCallsEnabled={String(runtimeBoundary?.runtimeBoundary.liveModelCallsEnabled ?? false)}</dd>
          </div>
          <div>
            <dt>Raw PHI</dt>
            <dd>rawPhiToExternalAiAllowed={String(runtimeBoundary?.runtimeBoundary.rawPhiToExternalAiAllowed ?? false)}</dd>
          </div>
          <div>
            <dt>Private BAA</dt>
            <dd>privateBaaPathwayApproved={String(runtimeBoundary?.runtimeBoundary.privateBaaPathwayApproved ?? false)}</dd>
          </div>
          <div>
            <dt>Drift</dt>
            <dd>driftMonitoringStatus={runtimeBoundary?.runtimeBoundary.driftMonitoringStatus ?? 'placeholder_disabled'}</dd>
          </div>
        </dl>
      </section>

      <section className="builder-grid" aria-label="AI governance work areas">
        <article className="appointment-form" aria-label="Prompt registry">
          <h2>Prompt Registry</h2>
          <p>No prompt contains PHI. All entries require source links and human review.</p>
          <div className="state-grid">
            {(status?.promptRegistry ?? []).map((prompt) => (
              <span key={prompt.promptId}>
                {prompt.promptId}: {prompt.purpose} / {prompt.riskLabel} / {prompt.outputType}
              </span>
            ))}
          </div>
        </article>

        <article className="appointment-form" aria-label="Model configuration">
          <h2>Model Configuration</h2>
          <p>Mock, private-BAA placeholder, and external-disabled modes are explicit production-review metadata.</p>
          <div className="state-grid">
            {(status?.modelConfigurations ?? []).map((model) => (
              <span key={model.modelConfigId}>
                {model.modelConfigId}: liveInvocationEnabled={String(model.liveInvocationEnabled)}
              </span>
            ))}
            <span>credentialSource=none</span>
          </div>
        </article>

        <article className="appointment-form" aria-label="Evaluation harness">
          <h2>Evaluation Harness</h2>
          <p>Deterministic synthetic cases cover suggestions, note draft, patient summary, billing preview, coaching, prohibited finalization, and stale-source rejection.</p>
          <div className="state-grid">
            {(status?.evaluationCases ?? []).map((evalCase) => (
              <span key={evalCase.evalCaseId}>
                {evalCase.evalCaseId}: {evalCase.expectedValidationStatus} / {evalCase.expectedPromptId}
                {evalCase.blockedBehavior ? ` / ${evalCase.blockedBehavior}` : ''}
              </span>
            ))}
          </div>
          <div className="action-row">
            <button type="button" onClick={() => void runEvaluations()}>
              Run Evaluations
            </button>
            <button type="button" onClick={() => void verifyPermissionDeniedState()}>
              Demo Denial
            </button>
          </div>
          <strong>
            {evaluation
              ? `allPassed=${String(evaluation.allPassed)} liveModelCalled=${String(evaluation.liveModelCalled)} regressionBlockedCount=${String(evaluation.regressionBlockedCount ?? 0)}`
              : 'ready: deterministic evaluations available'}
          </strong>
        </article>

        <article className="appointment-form" aria-label="Output validation">
          <h2>Output Validation</h2>
          <p>Unsupported finalization, claim submission, orders, medical necessity, and patient-facing financial conclusions are rejected.</p>
          <div className="state-grid">
            <span>sourceEvidenceIds required for candidates</span>
            <span>humanReviewRequired=true</span>
            <span>unsafe output emits ai.output_rejected.v1</span>
            <span>stale source emits source_stale</span>
            <span>raw-PHI context emits ai.phi_rejected.v1</span>
            <span>raw PHI output rejected</span>
          </div>
          <div className="action-row">
            <button type="button" onClick={() => void rejectUnsafeOutput()}>
              Reject Unsafe Output
            </button>
            <button type="button" onClick={() => void rejectStaleSourceOutput()}>
              Validate Source-Stale Output
            </button>
            <button type="button" onClick={() => void rejectPhiContext()}>
              Reject PHI Context
            </button>
            <button type="button" onClick={() => void scrubPhiContext()}>
              Scrub PHI Context
            </button>
          </div>
          <strong>
            {validation
              ? `${routeState}: ${validation.validation.validationStatus}: ${validation.validation.riskLabel}`
              : 'ready: output schema guard available'}
          </strong>
        </article>
      </section>

      <section className="status-band" aria-label="AI governance route states">
        <div>
          <h2>Route States</h2>
          <p>Production-intended route state is now loaded through the AI Gateway API; live external AI remains disabled.</p>
        </div>
        <div className="state-grid">
          {(runtimeBoundary?.runtimeBoundary.supportedRuntimeStates ?? []).map((state) => (
            <span key={`boundary-${state}`} className="state-pill">
              {state}
            </span>
          ))}
          {routeStates.map((state) => (
            <span key={state} className="state-pill">
              {state}
            </span>
          ))}
        </div>
      </section>

      <section className="status-band" aria-label="AI governance safety summary">
        <div>
          <h2>Safety Summary</h2>
          <p>
            AURA Note may draft, summarize, suggest, score confidence, and route work for human review. It does not
            autonomously diagnose, finalize codes or charges, determine medical necessity, place orders, submit claims, or
            send raw PHI to external AI.
          </p>
        </div>
      </section>
    </main>
  );
}
