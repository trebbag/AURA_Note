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
  const currentStepIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStep)
  );
  const blockedItems = session?.itemStatuses.filter((item) => item.status === 'blocked') ?? [];
  const pendingItems = session?.itemStatuses.filter((item) => item.status === 'pending') ?? [];
  const selectedItems = session?.itemStatuses.filter((item) => item.step === 'code_review') ?? [];
  const suggestedItems = session?.itemStatuses.filter((item) => item.step === 'suggestion_review') ?? [];
  const openQuestions = session?.patientQuestions.filter((question) => question.status === 'open' || question.status === 'forwarded_to_staff') ?? [];
  const originalVariant = session?.editorVariants.find((variant) => variant.variantType === 'original_note');
  const enhancedVariant = session?.editorVariants.find((variant) => variant.variantType === 'enhanced_note');
  const summaryVariant = session?.editorVariants.find((variant) => variant.variantType === 'patient_summary');
  const approvedVariantCount = session?.editorVariants.filter((variant) => variant.approved).length ?? 0;
  const totalVariantCount = session?.editorVariants.length ?? 0;
  const humanReviewCount = session?.itemStatuses.filter((item) => item.humanReviewRequired).length ?? 0;

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
          <div>
            <dt>Dispatch Status</dt>
            <dd>{session?.dispatchMetadata.dispatchStatus ?? 'not_ready'}</dd>
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

      <section className="figma-wizard-board" aria-label="Figma-derived finalization workflow board">
        <article aria-label="Design 2 progress rail">
          <div className="section-title-row">
            <div>
              <h2>Design 2 Progress Rail</h2>
              <p>Six canonical AURA Note steps, rendered from finalization session status.</p>
            </div>
            <strong>
              Step {currentStepIndex + 1} of {steps.length}
            </strong>
          </div>
          <div className="figma-step-rail" aria-label="Backend-backed finalization step rail">
            {steps.map((step, index) => {
              const status = session?.stepStatuses[step.id] ?? 'not_started';
              return (
                <div key={step.id} className={`figma-step-card state-${status}`}>
                  <span>{index + 1}</span>
                  <strong>{step.label}</strong>
                  <small>{status}</small>
                </div>
              );
            })}
          </div>
        </article>

        <article aria-label="Review carousel metrics">
          <h2>Selected And Suggested Item Review</h2>
          <div className="figma-metric-strip">
            <span>Selected items: {selectedItems.length}</span>
            <span>Suggested items: {suggestedItems.length}</span>
            <span>Human review required: {humanReviewCount}</span>
            <span>Blocked items: {blockedItems.length}</span>
          </div>
          <div className="opportunity-list">
            {(selectedItems.length ? selectedItems : suggestedItems).slice(0, 4).map((item) => (
              <span key={item.itemId}>
                {item.status} / {item.itemType} / {item.label}
              </span>
            ))}
            {!session ? <span>Start finalization to load review item runtime state.</span> : null}
          </div>
        </article>

        <article aria-label="Dual editor approval runtime state">
          <h2>Dual Editor Approval State</h2>
          <div className="figma-metric-strip">
            <span>Original: {originalVariant?.status ?? 'not_loaded'}</span>
            <span>Enhanced: {enhancedVariant?.status ?? 'not_loaded'}</span>
            <span>Summary: {summaryVariant?.status ?? 'not_loaded'}</span>
            <span>
              Approved variants: {approvedVariantCount}/{totalVariantCount}
            </span>
          </div>
          <small>
            Patient summary internal details excluded=
            {String(summaryVariant?.internalDetailsExcluded ?? session?.dispatchMetadata.patientSummaryInternalDetailsExcluded ?? true)}
          </small>
        </article>

        <article aria-label="Patient questions and planning assistant runtime state">
          <h2>Questions, Planning, And Insight State</h2>
          <div className="figma-metric-strip">
            <span>Open questions: {openQuestions.length}</span>
            <span>Care plan candidates: {session?.carePlanItems.length ?? 0}</span>
            <span>Portal delivery enabled: {String(session?.dispatchMetadata.patientPortalDeliveryEnabled ?? false)}</span>
            <span>Predictive insights enabled: {String(session?.patientInsightSnapshot.predictiveInsightsEnabled ?? false)}</span>
          </div>
          <div className="opportunity-list">
            {(session?.carePlanItems ?? []).slice(0, 3).map((item) => (
              <span key={item.carePlanItemId}>
                {item.status} / {item.ownerRole} / {item.title}
              </span>
            ))}
            {(session?.patientInsightSnapshot.staleWarnings ?? []).slice(0, 2).map((warning) => (
              <span key={warning}>Insight warning: {warning}</span>
            ))}
          </div>
        </article>
      </section>

      <section className="figma-finalization-polish" aria-label="Figma Design 2 visual fidelity pass">
        <article aria-label="Figma Design 2 evidence highlighter">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Design 2 / Evidence</p>
              <h2>Evidence Highlighter</h2>
              <p>Stable evidence spans are rendered from API offsets rather than prototype display labels.</p>
            </div>
            <strong>{session?.evidenceSpans.length ?? 0} spans</strong>
          </div>
          <div className="figma-evidence-text" aria-label="API-backed evidence preview">
            {(session?.evidenceSpans ?? []).slice(0, 4).map((span) => (
              <mark key={span.evidenceSpanId}>
                {span.quote} <small>{span.sourceType} / {span.startOffset}-{span.endOffset}</small>
              </mark>
            ))}
            {!session?.evidenceSpans.length ? <span>No evidence spans returned yet.</span> : null}
          </div>
        </article>

        <article aria-label="Figma patient questions popup">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Design 2 / Patient Questions</p>
              <h2>Question Popup</h2>
              <p>Portal send stays disabled; staff handoff maps to the existing blocker-task workflow.</p>
            </div>
            <strong>portal={String(session?.dispatchMetadata.patientPortalDeliveryEnabled ?? false)}</strong>
          </div>
          <div className="figma-popup-list">
            {(session?.patientQuestions ?? []).slice(0, 3).map((question) => (
              <div key={question.patientQuestionId}>
                <strong>{question.question}</strong>
                <span>{question.status} / insert target {question.insertionTargetSection}</span>
                <small>{question.explanation}</small>
              </div>
            ))}
            {!session?.patientQuestions.length ? <p>No patient questions returned yet.</p> : null}
          </div>
        </article>

        <article aria-label="Figma billing dispatch dock">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Design 2 / Billing And Sign</p>
              <h2>Billing & Dispatch Dock</h2>
              <p>Draft claim preview, attestation, sign, export, and writeback states stay human-controlled and gated.</p>
            </div>
            <strong>submittedClaim={String(session?.dispatchMetadata.submittedClaim ?? false)}</strong>
          </div>
          <div className="figma-dispatch-grid">
            <span>Billing ready: {session?.readyForBillingAttest || session?.billingAttested ? 'yes' : 'no'}</span>
            <span>Claim readiness: {session?.draftClaimPreview?.claimReadiness ?? 'not generated'}</span>
            <span>Export ready: {String(session?.dispatchMetadata.exportReady ?? false)}</span>
            <span>Writeback configured: {String(session?.dispatchMetadata.ehrWritebackConfigured ?? false)}</span>
            <span>Final note read-only: {String(session?.dispatchMetadata.finalNoteReadOnly ?? false)}</span>
            <span>Portal delivery: {String(session?.dispatchMetadata.patientPortalDeliveryEnabled ?? false)}</span>
          </div>
        </article>
      </section>

      <section className="wizard-grid" aria-label="Design 2 finalization runtime state">
        <article>
          <h2>Evidence Spans</h2>
          <div className="opportunity-list">
            {(session?.evidenceSpans ?? []).slice(0, 5).map((span) => (
              <span key={span.evidenceSpanId}>
                {span.sourceType} / {span.linkedItemId ?? span.sourceId} / {Math.round(span.confidence * 100)}%
              </span>
            ))}
            {!session?.evidenceSpans.length ? <span>No API-backed evidence spans returned yet.</span> : null}
          </div>
        </article>

        <article>
          <h2>Selected-Code Runtime</h2>
          <div className="opportunity-list">
            {(session?.itemStatuses ?? []).slice(0, 6).map((item) => (
              <span key={item.itemId}>
                {item.step} / {item.itemType} / {item.status}: {item.label}
              </span>
            ))}
            {!session?.itemStatuses.length ? <span>No code, suggestion, question, or billing review statuses returned yet.</span> : null}
          </div>
        </article>

        <article>
          <h2>Dual Editor Variants</h2>
          <div className="opportunity-list">
            {(session?.editorVariants ?? []).map((variant) => (
              <span key={variant.variantId}>
                {variant.variantType} / {variant.status} / approved={String(variant.approved)}
              </span>
            ))}
            {!session?.editorVariants.length ? <span>Original, enhanced, and patient-summary variants load from the finalization API.</span> : null}
          </div>
        </article>

        <article>
          <h2>Patient Questions</h2>
          <div className="opportunity-list">
            {(session?.patientQuestions ?? []).map((question) => (
              <span key={question.patientQuestionId}>
                {question.status} / portal={String(question.portalDeliveryEnabled)} / {question.question}
              </span>
            ))}
            {!session?.patientQuestions.length ? <span>No patient questions are open; portal delivery remains disabled.</span> : null}
          </div>
        </article>

        <article>
          <h2>Care Plan Candidates</h2>
          <div className="opportunity-list">
            {(session?.carePlanItems ?? []).map((item) => (
              <span key={item.carePlanItemId}>
                {item.status} / {item.source} / human review={String(item.humanReviewRequired)}
              </span>
            ))}
            {!session?.carePlanItems.length ? <span>No care-plan candidates returned by API yet.</span> : null}
          </div>
        </article>

        <article>
          <h2>Patient Insight Snapshot</h2>
          <div className="opportunity-list">
            <span>Freshness: {session?.patientInsightSnapshot.sourceFreshness ?? 'unknown'}</span>
            <span>Allergies: {session?.patientInsightSnapshot.allergySummaryStatus ?? 'unavailable'}</span>
            <span>Predictive insights enabled: {String(session?.patientInsightSnapshot.predictiveInsightsEnabled ?? false)}</span>
            {(session?.patientInsightSnapshot.staleWarnings ?? []).map((warning) => (
              <span key={warning}>{warning}</span>
            ))}
          </div>
        </article>

        <article>
          <h2>Billing Validation</h2>
          <div className="opportunity-list">
            {(session?.billingValidation ?? []).map((validation) => (
              <span key={validation.billingValidationId}>
                {validation.status} / blocks sign={String(validation.blocksSignDispatch)} / {validation.message}
              </span>
            ))}
            {!session?.billingValidation.length ? <span>Billing validation returns after API finalization starts.</span> : null}
          </div>
        </article>

        <article>
          <h2>Dispatch Metadata</h2>
          <div className="opportunity-list">
            <span>Dispatch status: {session?.dispatchMetadata.dispatchStatus ?? 'not_ready'}</span>
            <span>submittedClaim={String(session?.dispatchMetadata.submittedClaim ?? false)}</span>
            <span>Patient portal enabled: {String(session?.dispatchMetadata.patientPortalDeliveryEnabled ?? false)}</span>
            <span>Export ready: {String(session?.dispatchMetadata.exportReady ?? false)}</span>
            <span>Final note read-only: {String(session?.dispatchMetadata.finalNoteReadOnly ?? false)}</span>
          </div>
        </article>
      </section>

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
            <textarea
              aria-label="Patient summary side"
              readOnly
              value={session?.composeOutput?.patientSummaryText ?? 'Patient summary has not been generated.'}
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
