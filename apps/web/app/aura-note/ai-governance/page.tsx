'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

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

const prompts = [
  ['aura-note-suggestions-v1', 'suggestions', 'moderate', 'source-linked candidates'],
  ['aura-note-compose-note-v1', 'compose_note', 'high', 'draft note only'],
  ['aura-note-patient-summary-v1', 'patient_summary', 'moderate', 'internal details excluded'],
  ['aura-note-billing-preview-v1', 'billing_preview', 'high', 'candidate-only claim preview'],
  ['aura-note-coaching-v1', 'coaching', 'low', 'role-limited feedback']
];

const evalCases = [
  ['eval-suggestions-source-linked-v1', 'passed', 'liveModelCalled=false'],
  ['eval-compose-note-human-review-v1', 'passed', 'humanReviewRequired=true'],
  ['eval-patient-summary-no-internal-details-v1', 'passed', 'patient-facing revenue excluded'],
  ['eval-billing-preview-candidate-only-v1', 'passed', 'submittedClaim=false'],
  ['eval-coaching-role-limited-v1', 'passed', 'aggregate-safe visibility']
];

export default function AiGovernancePage() {
  const [evalState, setEvalState] = useState('ready: deterministic evaluations available');
  const [validationState, setValidationState] = useState('ready: output schema guard available');

  const summary = useMemo(
    () => [
      ['External AI', 'disabled'],
      ['Live credentials', 'not present'],
      ['Raw PHI to AI', 'not allowed'],
      ['Human review', 'required for all outputs']
    ],
    []
  );

  return (
    <main className="operations-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">P9 / WO-046</p>
          <h1>AI Governance Readiness</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <Link href="/aura-note/schedule">Schedule</Link>
          <Link href="/aura-note/platform">Platform</Link>
          <Link href="/aura-note/integrations/clinicos">ClinicOS</Link>
          <Link href="/aura-note/support/status">Support</Link>
        </nav>
      </header>

      <section className="status-band" aria-label="AI governance readiness">
        <div>
          <h2>Governed Mock-Only Gateway</h2>
          <p>
            Prompt registry, model configuration, evaluation, PHI handling, source evidence, and output validation are
            metadata-only. External AI is disabled until a later private/BAA governance decision authorizes live use.
          </p>
        </div>
        <dl>
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
            {prompts.map(([promptId, purpose, risk, detail]) => (
              <span key={promptId}>
                {promptId}: {purpose} / {risk} / {detail}
              </span>
            ))}
          </div>
        </article>

        <article className="appointment-form" aria-label="Model configuration">
          <h2>Model Configuration</h2>
          <p>Mock, private-BAA placeholder, and external-disabled modes are explicit production-review metadata.</p>
          <div className="state-grid">
            <span>mock-aura-note-p9: liveInvocationEnabled=false</span>
            <span>private_baa: approval missing</span>
            <span>external_disabled: endpoint not configured</span>
            <span>credentialSource=none</span>
          </div>
        </article>

        <article className="appointment-form" aria-label="Evaluation harness">
          <h2>Evaluation Harness</h2>
          <p>Deterministic synthetic cases cover suggestions, note draft, patient summary, billing preview, and coaching.</p>
          <div className="state-grid">
            {evalCases.map(([caseId, state, detail]) => (
              <span key={caseId}>
                {caseId}: {state} / {detail}
              </span>
            ))}
          </div>
          <div className="action-row">
            <button type="button" onClick={() => setEvalState('evaluation completed: allPassed=true liveModelCalled=false')}>
              Run Evaluations
            </button>
            <button type="button" onClick={() => setEvalState('evaluation-failed: synthetic unsafe output blocked')}>
              Demo Failed Eval
            </button>
          </div>
          <strong>{evalState}</strong>
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
            <button type="button" onClick={() => setValidationState('unsafe-output-rejected: determinesMedicalNecessity=true')}>
              Reject Unsafe Output
            </button>
            <button type="button" onClick={() => setValidationState('permission-denied: support metadata only')}>
              Demo Denial
            </button>
          </div>
          <strong>{validationState}</strong>
        </article>
      </section>

      <section className="status-band" aria-label="AI governance route states">
        <div>
          <h2>Route States</h2>
          <p>Production-intended screens must use API-backed state later; this route remains synthetic governance evidence.</p>
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
