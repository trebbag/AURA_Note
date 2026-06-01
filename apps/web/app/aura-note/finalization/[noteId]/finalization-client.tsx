'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WizardStep } from '@aura-note/domain';
import type { FinalizationSessionDto } from '@aura-note/contracts';
import { createAuraNoteApiClient, frontendRuntimeBillingAttestationStatements } from '../../../../lib/aura-note-api-client';

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

type RouteState = 'loading' | 'empty' | 'ready' | 'saving' | 'blocked' | 'failed' | 'permission-denied' | 'read-only';

export function FinalizationClient({ noteId }: FinalizationClientProps) {
  const client = useMemo(() => createAuraNoteApiClient({ role: 'clinician' }), []);
  const supportClient = useMemo(() => createAuraNoteApiClient({ role: 'support', userId: 'user-support-finalization-denial' }), []);
  const [session, setSession] = useState<FinalizationSessionDto | null>(null);
  const [routeState, setRouteState] = useState<RouteState>('loading');
  const [message, setMessage] = useState('Loading finalization state from the API.');

  const refreshSession = useCallback(async () => {
    setRouteState('loading');
    try {
      const response = await client.getFinalizationSession(noteId);
      setSession(response.data);
      setRouteState(response.data.signedAndDispatched ? 'read-only' : 'ready');
      setMessage('Finalization session loaded from typed API-backed state.');
    } catch (error) {
      setSession(null);
      setRouteState('empty');
      setMessage(error instanceof Error ? error.message : 'No finalization session returned yet.');
    }
  }, [client, noteId]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  async function runAction(label: string, action: () => Promise<{ data: { finalizationSession: FinalizationSessionDto } } | unknown>) {
    setRouteState('saving');
    try {
      const result = await action();
      if (result && typeof result === 'object' && 'data' in result) {
        const data = (result as { data?: { finalizationSession?: FinalizationSessionDto } }).data;
        if (data?.finalizationSession) setSession(data.finalizationSession);
      }
      setMessage(label);
      await refreshSession();
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : label);
    }
  }

  function startFinalization() {
    void runAction('Finalization started through API.', () => client.startFinalization(noteId));
  }

  function decideSelection(selectionId: string, decision: 'keep' | 'remove') {
    void runAction(`Selection ${decision} decision recorded through API.`, () =>
      client.decideFinalizationSelection(noteId, selectionId, decision)
    );
  }

  function completeCodeReview() {
    void runAction('Code Review completed through API.', () => client.completeCodeReview(noteId));
  }

  function decideSuggestion(suggestionId: string, decision: 'keep' | 'remove') {
    void runAction(`Suggestion ${decision} decision recorded through API.`, () =>
      client.decideFinalizationSuggestion(noteId, suggestionId, decision, 'Synthetic WO-064 finalization UI decision')
    );
  }

  function completeSuggestionReview() {
    void runAction('Suggestion Review completed through API.', () => client.completeSuggestionReview(noteId));
  }

  function runCompose() {
    void runAction('Enhanced note and patient summary drafts composed through API.', () => client.composeFinalizationDrafts(noteId));
  }

  function editSource() {
    void runAction('Source note update recorded through API and approval reset.', () =>
      client.updateCompareEditOriginal(noteId, 'Synthetic source note updated from WO-064 API-backed finalization route.')
    );
  }

  function rebeautify() {
    void runAction('Re-beautify recorded through API.', () => client.rebeautifyFinalization(noteId, 'WO-064 API-backed route refresh'));
  }

  function approveNote() {
    void runAction('Final note approved through API.', () =>
      client.approveFinalNote(noteId, { approved: true, attestation: 'Synthetic final note approval from WO-064 route' })
    );
  }

  function approveSummary() {
    void runAction('Patient summary approved through API.', () =>
      client.approvePatientSummary(noteId, { approved: true, attestation: 'Synthetic patient summary approval from WO-064 route' })
    );
  }

  function generateDraftClaimPreview() {
    void runAction('Draft claim preview generated through API with submittedClaim=false.', () => client.generateDraftClaimPreview(noteId));
  }

  function completeBillingAttest() {
    void runAction('Billing & Attest completed through API.', () =>
      client.completeBillingAttest(noteId, {
        acceptedStatements: frontendRuntimeBillingAttestationStatements,
        estimateCaveatAcknowledged: true,
        routeToBillingReview: true
      })
    );
  }

  function signAndDispatch() {
    void runAction('Sign & Dispatch completed through API; finalized records are read-only.', () => client.signAndDispatch(noteId));
  }

  async function verifyPermissionDeniedState() {
    setRouteState('loading');
    try {
      await supportClient.getFinalizationSession(noteId);
      setRouteState('failed');
      setMessage('Unexpected support finalization access succeeded.');
    } catch (error) {
      setRouteState('permission-denied');
      setMessage(error instanceof Error ? error.message : 'Support finalization access denied by API.');
    }
  }

  const currentStep = session?.currentStep ?? 'code_review';

  return (
    <main className="wizard-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Finalization Wizard</p>
          <h1>Finalization Steps 1-6</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <a href="/aura-note">Runtime Home</a>
          <a href="/aura-note/drafts">Draft Notes</a>
          <a href="/aura-note/finalized">Finalized Notes</a>
          <a href="/aura-note/schedule">Schedule</a>
        </nav>
      </header>

      <section className="wizard-status" aria-live="polite">
        <div>
          <h2>{noteId}</h2>
          <p>{message}</p>
          {!session ? (
            <button type="button" onClick={startFinalization}>
              Start Finalization
            </button>
          ) : null}
        </div>
        <dl>
          <div>
            <dt>Route State</dt>
            <dd>{routeState}</dd>
          </div>
          <div>
            <dt>Current Step</dt>
            <dd>{steps.find((step) => step.id === currentStep)?.label}</dd>
          </div>
          <div>
            <dt>Billing Ready</dt>
            <dd>{session?.readyForBillingAttest || session?.billingAttested ? 'yes' : 'no'}</dd>
          </div>
          <div>
            <dt>Signed</dt>
            <dd>{session?.signedAndDispatched ? 'yes' : 'no'}</dd>
          </div>
        </dl>
      </section>

      <ol className="wizard-progress" aria-label="Finalization progress">
        {steps.map((step) => (
          <li key={step.id} className={`state-${session?.stepStatuses[step.id] ?? 'not_started'}`}>
            <span>{step.label}</span>
            <small>{session?.stepStatuses[step.id] ?? 'not_started'}</small>
          </li>
        ))}
      </ol>

      <section className="wizard-grid">
        <article>
          <h2>Step 1 / Code Review</h2>
          <div className="decision-list">
            {(session?.frozenSnapshot.visitSelections ?? []).map((selection) => (
              <div key={selection.visitSelectionId} className="decision-row">
                <div>
                  <strong>{selection.label}</strong>
                  <span>{selection.category} / human review required</span>
                </div>
                <button type="button" disabled={currentStep !== 'code_review'} onClick={() => decideSelection(selection.visitSelectionId, 'keep')}>
                  Keep
                </button>
                <button type="button" disabled={currentStep !== 'code_review'} onClick={() => decideSelection(selection.visitSelectionId, 'remove')}>
                  Remove
                </button>
              </div>
            ))}
            {!session || session.frozenSnapshot.visitSelections.length === 0 ? <p>No frozen selections returned by API.</p> : null}
          </div>
          <button type="button" disabled={!session || currentStep !== 'code_review'} onClick={completeCodeReview}>
            Complete Code Review
          </button>
        </article>

        <article>
          <h2>Step 2 / Suggestion Review</h2>
          <div className="decision-list">
            {(session?.frozenSnapshot.finalPassSuggestions ?? []).map((suggestion) => (
              <div key={suggestion.suggestionId} className="decision-row">
                <div>
                  <strong>{suggestion.label}</strong>
                  <span>{Math.round(suggestion.confidence * 100)}% final-pass candidate</span>
                </div>
                <button type="button" disabled={currentStep !== 'suggestion_review'} onClick={() => decideSuggestion(suggestion.suggestionId, 'keep')}>
                  Keep
                </button>
                <button type="button" disabled={currentStep !== 'suggestion_review'} onClick={() => decideSuggestion(suggestion.suggestionId, 'remove')}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button type="button" disabled={!session || currentStep !== 'suggestion_review'} onClick={completeSuggestionReview}>
            Complete Suggestion Review
          </button>
        </article>

        <article>
          <h2>Step 3 / Compose</h2>
          <div className="compose-phases">
            {(session?.composePhases ?? [
              { phase: 'analyzing_content' as const, status: 'pending' as const },
              { phase: 'enhancing_structure' as const, status: 'pending' as const },
              { phase: 'beautifying_language' as const, status: 'pending' as const },
              { phase: 'final_review' as const, status: 'pending' as const }
            ]).map((phase) => (
              <span key={phase.phase} className={phase.status === 'completed' ? 'complete' : ''}>
                {phase.phase.replaceAll('_', ' ')}: {phase.status}
              </span>
            ))}
          </div>
          <button type="button" disabled={!session || currentStep !== 'compose'} onClick={runCompose}>
            Run Mock Compose
          </button>
        </article>

        <article>
          <h2>Step 4 / Compare & Edit</h2>
          <div className="compare-grid">
            <textarea aria-label="Original note side" readOnly value={session?.frozenSnapshot.originalNoteText ?? 'No finalization snapshot returned.'} />
            <textarea
              aria-label="Enhanced note side"
              readOnly
              value={session?.composeOutput?.enhancedNoteText ?? 'Compose has not run.'}
            />
          </div>
          <div className="controls-bar wizard-actions">
            <button type="button" disabled={!session || currentStep !== 'compare_edit'} onClick={editSource}>
              Edit Source
            </button>
            <button type="button" disabled={!session || currentStep !== 'compare_edit'} onClick={rebeautify}>
              Re-beautify
            </button>
            <button type="button" disabled={!session || currentStep !== 'compare_edit'} onClick={approveNote}>
              Approve Note
            </button>
            <button type="button" disabled={!session || currentStep !== 'compare_edit'} onClick={approveSummary}>
              Approve Summary
            </button>
          </div>
        </article>

        <article>
          <h2>Patient Opportunity Analysis</h2>
          <div className="opportunity-list">
            {(session?.patientOpportunities ?? []).map((opportunity) => (
              <span key={opportunity.patientOpportunityId}>
                {opportunity.category} / {opportunity.title}
              </span>
            ))}
            {!session?.patientOpportunities.length ? <span>Clinical opportunities load after API finalization starts.</span> : null}
            <span>Internal revenue values hidden from patient outputs</span>
          </div>
        </article>

        <article>
          <h2>Step 5 / Billing & Attest</h2>
          <div className="draft-claim-preview">
            <span>Draft only / submittedClaim={String(session?.draftClaimPreview?.submittedClaim ?? false)}</span>
            <span>Claim readiness: {session?.draftClaimPreview?.claimReadiness ?? 'not generated'}</span>
            <span>{session?.draftClaimPreview?.estimateCaveat ?? 'Estimate unavailable until source data is configured.'}</span>
          </div>
          <div className="controls-bar billing-actions">
            <button type="button" disabled={!session || currentStep !== 'billing_attest'} onClick={generateDraftClaimPreview}>
              Generate Preview
            </button>
            <button type="button" disabled={!session || currentStep !== 'billing_attest'} onClick={completeBillingAttest}>
              Complete Attest
            </button>
          </div>
        </article>

        <article>
          <h2>Step 6 / Sign & Dispatch</h2>
          <div className="opportunity-list">
            <span>Final note record: {session?.finalNote ? 'created read-only' : 'pending'}</span>
            <span>Patient summary record: {session?.patientSummary ? 'created patient-facing' : 'pending'}</span>
            <span>Claim submission: never performed in this workflow</span>
          </div>
          <button type="button" disabled={!session || currentStep !== 'sign_dispatch' || session.signedAndDispatched} onClick={signAndDispatch}>
            Sign & Dispatch
          </button>
          <button type="button" className="secondary-action" onClick={() => void verifyPermissionDeniedState()}>
            Verify Permission Denied
          </button>
          <div className="export-readiness-panel">
            <span>Copy/export/PDF: {session?.signedAndDispatched ? 'available in Finalized Notes' : 'disabled until signed'}</span>
            <span>EHR writeback: {session?.signedAndDispatched ? 'configuration-gated' : 'disabled until signed'}</span>
            {session?.signedAndDispatched ? (
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
