'use client';

import { useMemo, useState } from 'react';

type TimerState = 'not_started' | 'running' | 'paused' | 'stopped';
type RecordingState = 'not_started' | 'recording' | 'paused' | 'stopped' | 'exception_approved';

interface WorkspaceClientProps {
  appointmentId: string;
}

interface TranscriptSegment {
  sequence: number;
  speakerRole: 'clinician' | 'patient';
  text: string;
}

export function WorkspaceClient({ appointmentId }: WorkspaceClientProps) {
  const [timerState, setTimerState] = useState<TimerState>('not_started');
  const [recordingState, setRecordingState] = useState<RecordingState>('not_started');
  const [seconds, setSeconds] = useState(0);
  const [exceptionReason, setExceptionReason] = useState('');
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);

  const editorUnlocked = timerState === 'running' || recordingState === 'exception_approved';
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

  const panels = [
    { label: 'Visit Context', state: 'ready', detail: 'Synthetic standalone visit context and disabled integration state.' },
    { label: 'Visit Controls', state: timerState === 'not_started' ? 'blocked' : 'ready', detail: `Timer: ${timerState}` },
    { label: 'Note Editor', state: editorUnlocked ? 'ready' : 'blocked', detail: statusText },
    { label: 'Visit Selections', state: 'empty', detail: 'Selected codes/items panel arrives in WO-005.' },
    { label: 'Suggestions', state: 'empty', detail: 'Deterministic suggestion cards arrive in WO-005.' },
    {
      label: 'Transcript',
      state: transcriptSegments.length > 0 ? 'ready' : 'empty',
      detail: `${transcriptSegments.length} mock segment${transcriptSegments.length === 1 ? '' : 's'} retained indefinitely.`
    },
    { label: 'Compliance & Quality Review', state: 'empty', detail: 'Compliance drawer arrives in WO-005.' },
    { label: 'History Gap Review', state: 'empty', detail: 'History Gap drawer arrives in WO-005.' }
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
        <button type="button" disabled={!editorUnlocked}>
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
