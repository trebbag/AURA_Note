'use client';

import { useMemo, useState } from 'react';

type WizardStep = 'code_review' | 'suggestion_review' | 'compose' | 'compare_edit' | 'billing_attest' | 'sign_dispatch';
type Decision = 'pending' | 'keep' | 'remove';

interface FinalizationClientProps {
  noteId: string;
}

const steps: Array<{ id: WizardStep; label: string }> = [
  { id: 'code_review', label: 'Code Review' },
  { id: 'suggestion_review', label: 'Suggestion Review' },
  { id: 'compose', label: 'Compose' },
  { id: 'compare_edit', label: 'Compare & Edit' },
  { id: 'billing_attest', label: 'Billing & Attest' },
  { id: 'sign_dispatch', label: 'Sign & Dispatch' }
];

const initialSelections = [
  {
    id: 'selection-demo-99214',
    label: 'CPT 99214 candidate',
    evidence: 'Synthetic medication review and chronic follow-up support'
  },
  {
    id: 'selection-demo-quality',
    label: 'Quality follow-up plan',
    evidence: 'Synthetic vitals review placeholder'
  }
];

const initialSuggestions = [
  {
    id: 'suggestion-demo-bp',
    label: 'Blood pressure follow-up candidate',
    confidence: 0.88
  },
  {
    id: 'suggestion-demo-hcc',
    label: 'Risk review candidate',
    confidence: 0.58
  }
];

export function FinalizationClient({ noteId }: FinalizationClientProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('code_review');
  const [selectionDecisions, setSelectionDecisions] = useState<Record<string, Decision>>({});
  const [suggestionDecisions, setSuggestionDecisions] = useState<Record<string, Decision>>({});
  const [composeComplete, setComposeComplete] = useState(false);
  const [sourceEdited, setSourceEdited] = useState(false);
  const [finalNoteApproved, setFinalNoteApproved] = useState(false);
  const [summaryApproved, setSummaryApproved] = useState(false);
  const [draftClaimReady, setDraftClaimReady] = useState(false);
  const [estimateCaveatAcknowledged, setEstimateCaveatAcknowledged] = useState(false);
  const [billingReviewRouted, setBillingReviewRouted] = useState(false);
  const [billingAttested, setBillingAttested] = useState(false);
  const [signedAndDispatched, setSignedAndDispatched] = useState(false);
  const [message, setMessage] = useState('Frozen synthetic snapshot is ready for Code Review.');

  const allSelectionsDecided = initialSelections.every((selection) => selectionDecisions[selection.id] && selectionDecisions[selection.id] !== 'pending');
  const allSuggestionsDecided = initialSuggestions.every((suggestion) => suggestionDecisions[suggestion.id] && suggestionDecisions[suggestion.id] !== 'pending');
  const billingReady = finalNoteApproved && summaryApproved && composeComplete && !sourceEdited;
  const dispatchReady = billingReady && billingAttested && !signedAndDispatched;

  const progress = useMemo(
    () =>
      steps.map((step) => ({
        ...step,
        status: step.id === currentStep ? 'in_progress' : steps.findIndex((candidate) => candidate.id === step.id) < steps.findIndex((candidate) => candidate.id === currentStep) ? 'completed' : 'not_started'
      })),
    [currentStep]
  );

  function decideSelection(selectionId: string, decision: Decision) {
    setSelectionDecisions((current) => ({ ...current, [selectionId]: decision }));
    setMessage(decision === 'remove' ? 'Selection moved to the unused audit list.' : 'Selection kept in the final package.');
  }

  function completeCodeReview() {
    if (!allSelectionsDecided) {
      setMessage('Code Review requires a keep/remove decision on every selected item.');
      return;
    }
    setCurrentStep('suggestion_review');
    setMessage('Suggestion Review is active. Full raw transcript is not shown in this step.');
  }

  function decideSuggestion(suggestionId: string, decision: Decision) {
    setSuggestionDecisions((current) => ({ ...current, [suggestionId]: decision }));
    setMessage(decision === 'keep' ? 'Suggestion moved into Visit Selections.' : 'Suggestion recorded as unused for audit.');
  }

  function completeSuggestionReview() {
    if (!allSuggestionsDecided) {
      setMessage('Suggestion Review cannot be skipped; every final-pass suggestion needs a decision.');
      return;
    }
    setCurrentStep('compose');
    setMessage('Compose is ready.');
  }

  function runCompose() {
    setComposeComplete(true);
    setSourceEdited(false);
    setCurrentStep('compare_edit');
    setMessage('Enhanced note and patient summary are generated as draft outputs.');
  }

  function editSource() {
    setSourceEdited(true);
    setFinalNoteApproved(false);
    setSummaryApproved(false);
    setMessage('Source note changed. Re-beautify is required before approval.');
  }

  function rebeautify() {
    setSourceEdited(false);
    setFinalNoteApproved(false);
    setSummaryApproved(false);
    setMessage('Enhanced version replaced from the updated source note.');
  }

  function approveNote() {
    if (sourceEdited || !composeComplete) {
      setMessage('Approve Note requires a current enhanced version.');
      return;
    }
    setFinalNoteApproved(true);
    setMessage('Final note approved. Patient summary still requires separate approval.');
  }

  function approveSummary() {
    if (sourceEdited || !composeComplete) {
      setMessage('Approve Patient Summary requires a current enhanced version.');
      return;
    }
    setSummaryApproved(true);
    setMessage('Patient summary approved separately from the final note.');
  }

  function completeCompareEdit() {
    if (!billingReady) {
      setMessage('Compare & Edit requires both approvals and a current Re-beautify state.');
      return;
    }
    setCurrentStep('billing_attest');
    setMessage('Steps 1-4 are complete. Billing & Attest is the next work order.');
  }

  function generateDraftClaimPreview() {
    setDraftClaimReady(true);
    setMessage('Draft claim preview generated as an internal candidate only. No claim was submitted.');
  }

  function completeBillingAttest() {
    if (!draftClaimReady || !estimateCaveatAcknowledged) {
      setMessage('Billing & Attest requires a draft claim preview and estimate caveat acknowledgement.');
      return;
    }
    setBillingAttested(true);
    setCurrentStep('sign_dispatch');
    setMessage('Billing & Attest complete. Sign & Dispatch is available when no blockers are open.');
  }

  function signAndDispatch() {
    if (!dispatchReady) {
      setMessage('Sign & Dispatch requires Billing & Attest completion and both approvals.');
      return;
    }
    setSignedAndDispatched(true);
    setMessage('Final note and patient summary records created. Export, PDF, copy, and writeback actions are now available from Finalized Notes.');
  }

  return (
    <main className="wizard-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Finalization Wizard</p>
          <h1>Finalization Steps 1-6</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <a href="/aura-note/drafts">Draft Notes</a>
          <a href="/aura-note/finalized">Finalized Notes</a>
          <a href="/aura-note/schedule">Schedule</a>
        </nav>
      </header>

      <section className="wizard-status" aria-live="polite">
        <div>
          <h2>{noteId}</h2>
          <p>{message}</p>
        </div>
        <dl>
          <div>
            <dt>Current Step</dt>
            <dd>{steps.find((step) => step.id === currentStep)?.label}</dd>
          </div>
          <div>
            <dt>Billing Ready</dt>
            <dd>{billingReady || billingAttested ? 'yes' : 'no'}</dd>
          </div>
          <div>
            <dt>Signed</dt>
            <dd>{signedAndDispatched ? 'yes' : 'no'}</dd>
          </div>
        </dl>
      </section>

      <ol className="wizard-progress" aria-label="Finalization progress">
        {progress.map((step) => (
          <li key={step.id} className={`state-${step.status}`}>
            <span>{step.label}</span>
            <small>{step.status}</small>
          </li>
        ))}
      </ol>

      <section className="wizard-grid">
        <article>
          <h2>Step 1 / Code Review</h2>
          <div className="decision-list">
            {initialSelections.map((selection) => (
              <div key={selection.id} className="decision-row">
                <div>
                  <strong>{selection.label}</strong>
                  <span>{selection.evidence}</span>
                </div>
                <button type="button" disabled={currentStep !== 'code_review'} onClick={() => decideSelection(selection.id, 'keep')}>
                  Keep
                </button>
                <button type="button" disabled={currentStep !== 'code_review'} onClick={() => decideSelection(selection.id, 'remove')}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button type="button" disabled={currentStep !== 'code_review'} onClick={completeCodeReview}>
            Complete Code Review
          </button>
        </article>

        <article>
          <h2>Step 2 / Suggestion Review</h2>
          <div className="decision-list">
            {initialSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="decision-row">
                <div>
                  <strong>{suggestion.label}</strong>
                  <span>{Math.round(suggestion.confidence * 100)}% final-pass candidate</span>
                </div>
                <button type="button" disabled={currentStep !== 'suggestion_review'} onClick={() => decideSuggestion(suggestion.id, 'keep')}>
                  Keep
                </button>
                <button type="button" disabled={currentStep !== 'suggestion_review'} onClick={() => decideSuggestion(suggestion.id, 'remove')}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button type="button" disabled={currentStep !== 'suggestion_review'} onClick={completeSuggestionReview}>
            Complete Suggestion Review
          </button>
        </article>

        <article>
          <h2>Step 3 / Compose</h2>
          <div className="compose-phases">
            {['Analyzing Content', 'Enhancing Structure', 'Beautifying Language', 'Final Review'].map((phase) => (
              <span key={phase} className={composeComplete ? 'complete' : ''}>
                {phase}
              </span>
            ))}
          </div>
          <button type="button" disabled={currentStep !== 'compose'} onClick={runCompose}>
            Run Mock Compose
          </button>
        </article>

        <article>
          <h2>Step 4 / Compare & Edit</h2>
          <div className="compare-grid">
            <textarea aria-label="Original note side" readOnly value="Synthetic source note with clinician-reviewed selected items." />
            <textarea
              aria-label="Enhanced note side"
              readOnly
              value={composeComplete ? 'Enhanced synthetic note and patient-safe summary are ready for approval.' : 'Compose has not run.'}
            />
          </div>
          <div className="controls-bar wizard-actions">
            <button type="button" disabled={currentStep !== 'compare_edit'} onClick={editSource}>
              Edit Source
            </button>
            <button type="button" disabled={currentStep !== 'compare_edit' || !sourceEdited} onClick={rebeautify}>
              Re-beautify
            </button>
            <button type="button" disabled={currentStep !== 'compare_edit'} onClick={approveNote}>
              Approve Note
            </button>
            <button type="button" disabled={currentStep !== 'compare_edit'} onClick={approveSummary}>
              Approve Summary
            </button>
            <button type="button" disabled={currentStep !== 'compare_edit'} onClick={completeCompareEdit}>
              Complete Step 4
            </button>
          </div>
        </article>

        <article>
          <h2>Patient Opportunity Analysis</h2>
          <div className="opportunity-list">
            <span>Clinical / Confirm follow-up plan</span>
            <span>Quality / Human-review-required measure follow-up</span>
            <span>Internal revenue values hidden from patient outputs</span>
          </div>
        </article>

        <article>
          <h2>Step 5 / Billing & Attest</h2>
          <div className="draft-claim-preview">
            <span>Draft only / not submitted / not final coding</span>
            <span>CPT candidates: 99214 candidate</span>
            <span>Estimate unavailable until fee schedule and payer data are configured</span>
            <span>Billing review: {billingReviewRouted ? 'routed' : 'not routed'}</span>
          </div>
          <label className="check-row">
            <input
              type="checkbox"
              checked={estimateCaveatAcknowledged}
              disabled={currentStep !== 'billing_attest'}
              onChange={(event) => setEstimateCaveatAcknowledged(event.target.checked)}
            />
            Estimate caveat acknowledged
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={billingReviewRouted}
              disabled={currentStep !== 'billing_attest'}
              onChange={(event) => setBillingReviewRouted(event.target.checked)}
            />
            Route to billing review
          </label>
          <div className="controls-bar billing-actions">
            <button type="button" disabled={currentStep !== 'billing_attest'} onClick={generateDraftClaimPreview}>
              Generate Preview
            </button>
            <button type="button" disabled={currentStep !== 'billing_attest'} onClick={completeBillingAttest}>
              Complete Attest
            </button>
          </div>
        </article>

        <article>
          <h2>Step 6 / Sign & Dispatch</h2>
          <div className="opportunity-list">
            <span>Final note record: {signedAndDispatched ? 'created read-only' : 'pending'}</span>
            <span>Patient summary record: {signedAndDispatched ? 'created patient-facing' : 'pending'}</span>
            <span>Claim submission: never performed in this workflow</span>
          </div>
          <button type="button" disabled={currentStep !== 'sign_dispatch' || signedAndDispatched} onClick={signAndDispatch}>
            Sign & Dispatch
          </button>
          <div className="export-readiness-panel">
            <span>Copy/export/PDF: {signedAndDispatched ? 'available in Finalized Notes' : 'disabled until signed'}</span>
            <span>EHR writeback: {signedAndDispatched ? 'configuration-gated' : 'disabled until signed'}</span>
            {signedAndDispatched ? (
              <a className="button-link" href={`/aura-note/finalized/${noteId}`}>
                Open Finalized Viewer
              </a>
            ) : (
              <button type="button" disabled>
                Open Finalized Viewer
              </button>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
