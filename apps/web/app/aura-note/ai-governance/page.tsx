'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AiEvaluationRunResponseDto, AiGatewayStatusDto, AiOutputValidationResponseDto } from '@aura-note/contracts';
import { createAuraNoteApiClient } from '../../../lib/aura-note-api-client';

const routeStates = [
  'empty',
  'loading',
  'ready',
  'saving',
  'failed',
  'permission-denied',
  'disabled',
  'read-only',
  'evaluation-failed',
  'unsafe-output-rejected',
  'demo fixture'
];

export default function AiGovernancePage() {
  const clinicianClient = useMemo(() => createAuraNoteApiClient({ role: 'clinician' }), []);
  const governanceClient = useMemo(() => createAuraNoteApiClient({ role: 'compliance_privacy_lead' }), []);
  const supportClient = useMemo(() => createAuraNoteApiClient({ role: 'support', userId: 'user-support-ai-denial' }), []);
  const [status, setStatus] = useState<AiGatewayStatusDto | null>(null);
  const [evaluation, setEvaluation] = useState<AiEvaluationRunResponseDto | null>(null);
  const [validation, setValidation] = useState<AiOutputValidationResponseDto | null>(null);
  const [routeState, setRouteState] = useState('loading');
  const [message, setMessage] = useState('Loading AI Gateway governance from API.');

  const refreshStatus = useCallback(async () => {
    setRouteState('loading');
    try {
      const response = await clinicianClient.getAiGatewayStatus();
      setStatus(response.data);
      setRouteState('ready');
      setMessage('AI governance metadata loaded from typed API-backed state.');
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'AI Gateway API load failed.');
    }
  }, [clinicianClient]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function runEvaluations() {
    setRouteState('saving');
    try {
      const response = await governanceClient.runAiEvaluations({});
      setEvaluation(response.data);
      setRouteState(response.data.allPassed ? 'ready' : 'evaluation-failed');
      setMessage(`evaluation completed: allPassed=${String(response.data.allPassed)} liveModelCalled=${String(response.data.liveModelCalled)}`);
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
        sourceEvidenceIds: [],
        output: {
          determinesMedicalNecessity: true,
          submittedClaim: true,
          draftOnly: false
        }
      });
      setValidation(response.data);
      setRouteState(response.data.validation.validationStatus === 'rejected' ? 'unsafe-output-rejected' : 'ready');
      setMessage(`unsafe-output-rejected: ${response.data.validation.unsafeReasons.join(', ') || response.data.validation.validationStatus}`);
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'AI output validation failed.');
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
          <p className="eyebrow">CR-2 / WO-064</p>
          <h1>AI Governance Readiness</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <Link href="/aura-note">Runtime Home</Link>
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
          <p>Deterministic synthetic cases cover suggestions, note draft, patient summary, billing preview, and coaching.</p>
          <div className="state-grid">
            {(status?.evaluationCases ?? []).map((evalCase) => (
              <span key={evalCase.evalCaseId}>
                {evalCase.evalCaseId}: {evalCase.expectedValidationStatus} / {evalCase.expectedPromptId}
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
          <strong>{evaluation ? `allPassed=${String(evaluation.allPassed)} liveModelCalled=${String(evaluation.liveModelCalled)}` : 'ready: deterministic evaluations available'}</strong>
        </article>

        <article className="appointment-form" aria-label="Output validation">
          <h2>Output Validation</h2>
          <p>Unsupported finalization, claim submission, orders, medical necessity, and patient-facing financial conclusions are rejected.</p>
          <div className="state-grid">
            <span>sourceEvidenceIds required for candidates</span>
            <span>humanReviewRequired=true</span>
            <span>unsafe output emits ai.output_rejected.v1</span>
            <span>raw PHI output rejected</span>
          </div>
          <div className="action-row">
            <button type="button" onClick={() => void rejectUnsafeOutput()}>
              Reject Unsafe Output
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
