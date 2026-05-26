'use client';

import { useMemo, useState } from 'react';

type TimerState = 'not_started' | 'running' | 'paused' | 'stopped';
type RecordingState = 'not_started' | 'recording' | 'paused' | 'stopped' | 'exception_approved';
type SuggestionStatus = 'candidate' | 'accepted' | 'removed';

interface WorkspaceClientProps {
  appointmentId: string;
}

interface TranscriptSegment {
  sequence: number;
  speakerRole: 'clinician' | 'patient';
  text: string;
}

interface Suggestion {
  suggestionId: string;
  category: string;
  label: string;
  confidence: number;
  status: SuggestionStatus;
  lowConfidenceOverrideRequired: boolean;
}

const initialSuggestions: Suggestion[] = [
  {
    suggestionId: 'suggestion-demo-cpt-99214',
    category: 'cpt',
    label: 'CPT 99214 candidate',
    confidence: 0.82,
    status: 'candidate',
    lowConfidenceOverrideRequired: false
  },
  {
    suggestionId: 'suggestion-demo-icd10-e119',
    category: 'icd10',
    label: 'ICD-10 E11.9 candidate',
    confidence: 0.74,
    status: 'candidate',
    lowConfidenceOverrideRequired: true
  },
  {
    suggestionId: 'suggestion-demo-quality-bp',
    category: 'quality_measure',
    label: 'Quality measure follow-up candidate',
    confidence: 0.88,
    status: 'candidate',
    lowConfidenceOverrideRequired: false
  }
];

export function WorkspaceClient({ appointmentId }: WorkspaceClientProps) {
  const [timerState, setTimerState] = useState<TimerState>('not_started');
  const [recordingState, setRecordingState] = useState<RecordingState>('not_started');
  const [seconds, setSeconds] = useState(0);
  const [exceptionReason, setExceptionReason] = useState('');
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);
  const [visitSelections, setVisitSelections] = useState<Suggestion[]>([]);
  const [overrideReason, setOverrideReason] = useState('');
  const [historyGapBlocked, setHistoryGapBlocked] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('Suggestions are deterministic mock candidates and require human review.');

  const editorUnlocked = timerState === 'running' || recordingState === 'exception_approved';
  const finalizeDisabled = !editorUnlocked || historyGapBlocked;
  const statusText = useMemo(() => {
    if (editorUnlocked) return 'Editor unlocked by timer or approved recording exception.';
    if (timerState === 'paused') return 'Editor locked while the visit timer is paused.';
    if (timerState === 'stopped') return 'Editor locked after stop until a later finalization workflow allows review.';
    return 'Editor locked until Start Visit runs the timer or a recording exception is approved.';
  }, [editorUnlocked, timerState]);

  function startVisit() {
    setTimerState('running');
    setRecordingState('recording');
    setSeconds(1);
  }

  function pauseVisit() {
    setTimerState('paused');
    setRecordingState((current) => (current === 'recording' ? 'paused' : current));
  }

  function resumeVisit() {
    setTimerState('running');
    setRecordingState((current) => (current === 'paused' ? 'recording' : current));
    setSeconds((current) => current + 1);
  }

  function stopVisit() {
    setTimerState('stopped');
    setRecordingState((current) => (current === 'exception_approved' ? current : 'stopped'));
  }

  function approveException() {
    setExceptionReason('Synthetic clinician-approved no-audio exception');
    setTimerState((current) => (current === 'not_started' ? 'running' : current));
    setRecordingState('exception_approved');
  }

  function appendTranscript() {
    setTranscriptSegments((current) => [
      ...current,
      {
        sequence: current.length + 1,
        speakerRole: current.length % 2 === 0 ? 'clinician' : 'patient',
        text: `Synthetic mock transcript segment ${current.length + 1}`
      }
    ]);
  }

  function acceptSuggestion(suggestionId: string) {
    const suggestion = suggestions.find((candidate) => candidate.suggestionId === suggestionId);
    if (!suggestion) return;
    if (suggestion.lowConfidenceOverrideRequired && !overrideReason.trim()) {
      setReviewMessage('Low-confidence diagnosis candidates below 75 percent require override metadata first.');
      return;
    }

    setSuggestions((current) =>
      current.map((candidate) => (candidate.suggestionId === suggestionId ? { ...candidate, status: 'accepted' } : candidate))
    );
    setVisitSelections((current) => [...current, { ...suggestion, status: 'accepted' }]);
    setReviewMessage(`${suggestion.label} moved into Visit Selections for human review.`);
  }

  function removeSuggestion(suggestionId: string) {
    setSuggestions((current) =>
      current.map((candidate) => (candidate.suggestionId === suggestionId ? { ...candidate, status: 'removed' } : candidate))
    );
    setReviewMessage('Suggestion removed from the candidate list.');
  }

  function createHistoryGapTask() {
    setHistoryGapBlocked(true);
    setReviewMessage('History Gap question sent to MA follow-up as a signing blocker.');
  }

  const panels = [
    { label: 'Visit Context', state: 'ready', detail: 'Synthetic standalone visit context and disabled integration state.' },
    { label: 'Visit Controls', state: timerState === 'not_started' ? 'blocked' : 'ready', detail: `Timer: ${timerState}` },
    { label: 'Note Editor', state: editorUnlocked ? 'ready' : 'blocked', detail: statusText },
    {
      label: 'Visit Selections',
      state: visitSelections.length > 0 ? 'ready' : 'empty',
      detail: `${visitSelections.length} selected item${visitSelections.length === 1 ? '' : 's'} awaiting human review.`
    },
    {
      label: 'Suggestions',
      state: suggestions.some((suggestion) => suggestion.status === 'candidate') ? 'ready' : 'empty',
      detail: `${suggestions.filter((suggestion) => suggestion.status === 'candidate').length} deterministic candidates.`
    },
    {
      label: 'Transcript',
      state: transcriptSegments.length > 0 ? 'ready' : 'empty',
      detail: `${transcriptSegments.length} mock segment${transcriptSegments.length === 1 ? '' : 's'} retained indefinitely.`
    },
    {
      label: 'Compliance & Quality Review',
      state: historyGapBlocked ? 'blocked' : 'warning',
      detail: historyGapBlocked ? 'Open MA follow-up blocker disables finalize.' : 'No hard block until a blocker task exists.'
    },
    {
      label: 'History Gap Review',
      state: historyGapBlocked ? 'blocked' : 'ready',
      detail: historyGapBlocked ? 'MA blocker task is open.' : 'One deterministic question can be routed to MA follow-up.'
    }
  ];

  return (
    <main className="workspace-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Documentation Workspace</p>
          <h1>Workspace Shell</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <a href="/aura-note/schedule">Schedule</a>
          <a href="/aura-note/drafts">Draft Notes</a>
          <a href="/aura-note/finalized">Finalized Notes</a>
        </nav>
      </header>

      <section className="workspace-topline">
        <div>
          <h2>{appointmentId}</h2>
          <p>safe-patient-demo-001 / Chronic follow-up / clinician-demo-001</p>
        </div>
        <dl>
          <div>
            <dt>Timer</dt>
            <dd>{timerState}</dd>
          </div>
          <div>
            <dt>Recording</dt>
            <dd>{recordingState}</dd>
          </div>
          <div>
            <dt>Elapsed</dt>
            <dd>{seconds}s</dd>
          </div>
        </dl>
      </section>

      <section className="controls-bar" aria-label="Visit controls">
        <button type="button" disabled={timerState !== 'not_started'} onClick={startVisit}>
          Start Visit
        </button>
        <button type="button" disabled={timerState !== 'running'} onClick={pauseVisit}>
          Pause
        </button>
        <button type="button" disabled={timerState !== 'paused'} onClick={resumeVisit}>
          Resume
        </button>
        <button type="button" disabled={timerState !== 'running' && timerState !== 'paused'} onClick={stopVisit}>
          Stop
        </button>
        <button type="button" disabled={finalizeDisabled}>
          Finalize Note
        </button>
      </section>

      <section className="controls-bar secondary-controls" aria-label="Recording and transcript controls">
        <button type="button" disabled={recordingState === 'exception_approved'} onClick={approveException}>
          Approve Exception
        </button>
        <button type="button" disabled={!editorUnlocked} onClick={appendTranscript}>
          Append Mock Transcript
        </button>
        <span>{exceptionReason || 'No recording exception active'}</span>
      </section>

      <section className="review-board" aria-label="Suggestions and review panels" aria-live="polite">
        <article>
          <h2>Suggestions</h2>
          <p>{reviewMessage}</p>
          <label>
            Override Reason
            <input
              value={overrideReason}
              onChange={(event) => setOverrideReason(event.target.value)}
              placeholder="Required for diagnosis suggestions under 75 percent"
            />
          </label>
          <div className="suggestion-list">
            {suggestions.map((suggestion) => (
              <div key={suggestion.suggestionId} className="suggestion-row">
                <div>
                  <strong>{suggestion.label}</strong>
                  <span>
                    {suggestion.category} / {Math.round(suggestion.confidence * 100)}% / {suggestion.status}
                  </span>
                </div>
                <button type="button" disabled={suggestion.status !== 'candidate'} onClick={() => acceptSuggestion(suggestion.suggestionId)}>
                  Accept
                </button>
                <button type="button" disabled={suggestion.status !== 'candidate'} onClick={() => removeSuggestion(suggestion.suggestionId)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </article>

        <article>
          <h2>Visit Selections</h2>
          <div className="selection-list">
            {visitSelections.length === 0 ? <p>No selected items yet.</p> : null}
            {visitSelections.map((selection) => (
              <span key={selection.suggestionId}>
                {selection.category}: {selection.label}
              </span>
            ))}
          </div>
        </article>

        <article>
          <h2>History Gap Review</h2>
          <p>Confirm whether the synthetic follow-up history supports the selected diagnosis candidate.</p>
          <button type="button" disabled={historyGapBlocked} onClick={createHistoryGapTask}>
            Send to MA as Blocker
          </button>
        </article>
      </section>

      <section className="workspace-grid">
        <article className="editor-pane">
          <div>
            <p className="eyebrow">Editor</p>
            <h2>{editorUnlocked ? 'Unlocked' : 'Locked'}</h2>
          </div>
          <textarea
            aria-label="Documentation editor"
            rows={14}
            value={
              editorUnlocked
                ? 'Synthetic editor scaffold is available. Clinical note drafting depth is intentionally deferred.'
                : statusText
            }
            readOnly
          />
        </article>

        <aside className="workspace-panels" aria-label="Workspace panels">
          {panels.map((panel) => (
            <article key={panel.label} className={`panel-row state-${panel.state}`}>
              <div>
                <strong>{panel.label}</strong>
                <span>{panel.state}</span>
              </div>
              <p>{panel.detail}</p>
            </article>
          ))}
        </aside>
      </section>
    </main>
  );
}
