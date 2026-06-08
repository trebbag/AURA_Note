'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ComplianceReviewDto,
  DocumentationWorkspaceDto,
  HistoryGapQuestionDto,
  NoteContentDto,
  NoteVersionDto,
  SuggestionDto,
  TranscriptLiveViewDto,
  TranscriptViewDto,
  TranscriptionProviderStatusDto,
  VisitSelectionDto
} from '@aura-note/contracts';
import { createAuraNoteApiClient } from '../../../../lib/aura-note-api-client';

interface WorkspaceClientProps {
  appointmentId: string;
}

type RouteState = 'loading' | 'empty' | 'ready' | 'saving' | 'blocked' | 'failed' | 'permission-denied' | 'read-only' | 'demo fixture';

const routeStates: RouteState[] = ['loading', 'empty', 'ready', 'saving', 'failed', 'permission-denied', 'read-only', 'blocked', 'demo fixture'];

export function WorkspaceClient({ appointmentId }: WorkspaceClientProps) {
  const client = useMemo(() => createAuraNoteApiClient({ role: 'clinician' }), []);
  const supportClient = useMemo(() => createAuraNoteApiClient({ role: 'support', userId: 'user-support-workspace-denial' }), []);
  const [workspace, setWorkspace] = useState<DocumentationWorkspaceDto | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionDto[]>([]);
  const [visitSelections, setVisitSelections] = useState<VisitSelectionDto[]>([]);
  const [compliance, setCompliance] = useState<ComplianceReviewDto | null>(null);
  const [historyGaps, setHistoryGaps] = useState<HistoryGapQuestionDto[]>([]);
  const [transcript, setTranscript] = useState<TranscriptViewDto | null>(null);
  const [transcriptLiveView, setTranscriptLiveView] = useState<TranscriptLiveViewDto | null>(null);
  const [noteContent, setNoteContent] = useState<NoteContentDto | null>(null);
  const [noteVersions, setNoteVersions] = useState<NoteVersionDto[]>([]);
  const [draftMarkdown, setDraftMarkdown] = useState('');
  const [providerStatus, setProviderStatus] = useState<TranscriptionProviderStatusDto | null>(null);
  const [recordingChunks, setRecordingChunks] = useState(0);
  const [microphonePermissionState, setMicrophonePermissionState] = useState('prompt_required');
  const [routeState, setRouteState] = useState<RouteState>('loading');
  const [overrideReason, setOverrideReason] = useState('');
  const [message, setMessage] = useState('Loading workspace from AURA Note API responses.');

  const noteId = workspace?.note.noteId;
  const editorUnlocked = Boolean(workspace && !workspace.editorLocked);
  const finalizeDisabled = Boolean(!workspace || workspace.editorLocked || compliance?.finalizeDisabled);
  const timerState = workspace?.visitSession?.timerState ?? 'not_started';
  const recordingState = workspace?.visitSession?.recordingState ?? 'not_started';
  const seconds = workspace?.visitSession?.elapsedSeconds ?? 0;
  const readOnlyEditor = !editorUnlocked || Boolean(noteContent?.readOnly);

  const refreshWorkspace = useCallback(async () => {
    setRouteState('loading');
    try {
      const workspaceResponse = await client.getDocumentationWorkspace(appointmentId);
      const nextWorkspace = workspaceResponse.data;
      setWorkspace(nextWorkspace);

      if (nextWorkspace.note.noteId) {
        const [
          suggestionsResponse,
          selectionsResponse,
          complianceResponse,
          gapsResponse,
          transcriptResponse,
          transcriptLiveResponse,
          noteContentResponse,
          noteVersionsResponse,
          providerResponse
        ] = await Promise.all([
          client.listSuggestions(nextWorkspace.note.noteId),
          client.listVisitSelections(nextWorkspace.note.noteId),
          client.evaluateCompliance(nextWorkspace.note.noteId),
          client.listHistoryGaps(nextWorkspace.note.noteId),
          client.getTranscript(appointmentId),
          client.getTranscriptLiveView(appointmentId),
          client.getNoteContent(nextWorkspace.note.noteId),
          client.listNoteVersions(nextWorkspace.note.noteId),
          client.getTranscriptionProviderStatus(appointmentId)
        ]);
        setSuggestions(suggestionsResponse.data.suggestions);
        setVisitSelections(selectionsResponse.data.selections);
        setCompliance(complianceResponse.data);
        setHistoryGaps(gapsResponse.data.questions);
        setTranscript(transcriptResponse.data);
        setTranscriptLiveView(transcriptLiveResponse.data);
        setNoteContent(noteContentResponse.data.noteContent);
        setDraftMarkdown(noteContentResponse.data.noteContent.markdown);
        setNoteVersions(noteVersionsResponse.data.versions);
        setProviderStatus(providerResponse.data);
      }

      setRouteState(nextWorkspace.finalizedReadOnly ? 'read-only' : nextWorkspace.editorLocked ? 'blocked' : 'ready');
      setMessage('Workspace panels loaded from typed API-backed state.');
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'Workspace API load failed.');
    }
  }, [appointmentId, client]);

  useEffect(() => {
    void refreshWorkspace();
  }, [refreshWorkspace]);

  async function runAction(label: string, action: () => Promise<unknown>) {
    setRouteState('saving');
    try {
      await action();
      await refreshWorkspace();
      setMessage(label);
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : label);
    }
  }

  function startVisit() {
    void runAction('Visit started through API; timer and editor gate refreshed.', () => client.startVisit(appointmentId));
  }

  function pauseVisit() {
    void runAction('Visit paused through API; editor lock refreshed.', () => client.pauseVisit(appointmentId));
  }

  function resumeVisit() {
    void runAction('Visit resumed through API; editor unlock refreshed.', () => client.resumeVisit(appointmentId));
  }

  function stopVisit() {
    void runAction('Visit stopped through API; documentation state refreshed.', () => client.stopVisit(appointmentId));
  }

  function approveException() {
    void runAction('Recording exception approved through API without implying normal recording.', () =>
      client.approveRecordingException(appointmentId, { exceptionReason: 'Synthetic clinician-approved no-audio exception' })
    );
  }

  function demoPermissionDenied() {
    void (async () => {
      setRouteState('saving');
      try {
        const response = await client.recordMicrophonePermission(appointmentId, {
          permissionState: 'denied',
          userGestureConfirmed: true,
          browserSupported: true
        });
        setMicrophonePermissionState(response.data.permission.permissionState);
        setMessage('Microphone denial recorded through API.');
        await refreshWorkspace();
      } catch (error) {
        setRouteState('failed');
        setMessage(error instanceof Error ? error.message : 'Microphone permission denial failed.');
      }
    })();
  }

  function appendMetadataChunk() {
    const sequence = recordingChunks + 1;
    void runAction('Metadata-only recording chunk appended through API.', async () => {
      await client.appendRecordingChunk(
        appointmentId,
        {
          sequence,
          durationMs: 15_000,
          contentLengthBytes: 0,
          checksum: `metadata-only-workspace-${sequence}`
        },
        `workspace-chunk-${appointmentId}-${sequence}`
      );
      setRecordingChunks(sequence);
    });
  }

  function processMockTranscription() {
    void runAction('Deterministic mock transcription job processed through API.', () => client.processMockTranscriptionJob(appointmentId));
  }

  function requestDisabledLiveProvider() {
    void runAction('Disabled live transcription provider failed closed through API metadata.', () =>
      client.requestDisabledLiveTranscriptionJob(appointmentId)
    );
  }

  function correctFirstTranscriptSegment() {
    const firstSegment = transcript?.segments[0];
    if (!firstSegment) return;
    void runAction('Transcript correction recorded through API.', () =>
      client.correctTranscriptSegment(appointmentId, firstSegment.transcriptSegmentId, {
        correctedText: 'Synthetic corrected transcript segment',
        correctionReason: 'WO-064 browser route API-backed correction evidence'
      })
    );
  }

  function appendTranscript() {
    void runAction('Manual mock transcript segment appended through API.', () =>
      client.appendTranscriptSegment(appointmentId, {
        speakerRole: (transcript?.segments.length ?? 0) % 2 === 0 ? 'clinician' : 'patient',
        text: `Synthetic mock transcript segment ${(transcript?.segments.length ?? 0) + 1}`
      })
    );
  }

  function autosaveNoteContent() {
    if (!noteId) return;
    void runAction('Note content autosaved and versioned through API.', () =>
      client.autosaveNoteContent(
        noteId,
        {
          format: 'aura_markdown_v1',
          markdown: draftMarkdown,
          ...(noteContent ? { clientRevision: noteContent.revision } : {})
        },
        `workspace-note-autosave-${noteId}-${(noteContent?.revision ?? 0) + 1}`
      )
    );
  }

  function restoreLatestPreviousVersion() {
    if (!noteId || noteVersions.length < 2) return;
    const previous = noteVersions[1];
    if (!previous) return;
    void runAction('Previous note version restored through API.', () =>
      client.restoreNoteVersion(noteId, previous.noteVersionId, {
        restoreReason: 'Synthetic workspace restore evidence for Figma backend catch-up'
      })
    );
  }

  function evaluateSuggestions() {
    if (!noteId) return;
    void runAction('Deterministic suggestions evaluated through API.', () => client.evaluateSuggestions(noteId));
  }

  function acceptSuggestion(suggestion: SuggestionDto) {
    if (!noteId) return;
    if (suggestion.lowConfidenceOverrideRequired && !overrideReason.trim()) {
      setMessage('Low-confidence diagnosis candidates below 75 percent require override metadata first.');
      setRouteState('blocked');
      return;
    }
    void runAction(`${suggestion.label} moved into Visit Selections through API.`, () =>
      client.acceptSuggestion(noteId, suggestion.suggestionId, {
        ...(overrideReason.trim() ? { overrideReason } : {})
      })
    );
  }

  function removeSuggestion(suggestion: SuggestionDto) {
    if (!noteId) return;
    void runAction('Suggestion removed through API with a documented reason.', () =>
      client.removeSuggestion(noteId, suggestion.suggestionId, {
        removalReason: 'Synthetic clinician removal reason for Figma backend catch-up'
      })
    );
  }

  function restoreSuggestion(suggestion: SuggestionDto) {
    if (!noteId) return;
    void runAction('Suggestion returned to candidate review through API.', () =>
      client.restoreSuggestion(noteId, suggestion.suggestionId)
    );
  }

  function removeVisitSelection(selection: VisitSelectionDto) {
    if (!noteId) return;
    void runAction('Visit Selection removed with API-backed disposition evidence.', () =>
      client.removeVisitSelection(noteId, selection.visitSelectionId, {
        removalReason: 'Synthetic clinician removed this selection after review.',
        returnToSuggestions: Boolean(selection.sourceSuggestionId)
      })
    );
  }

  function changeVisitSelectionCategory(selection: VisitSelectionDto) {
    if (!noteId) return;
    void runAction('Visit Selection category changed through API.', () =>
      client.changeVisitSelectionCategory(noteId, selection.visitSelectionId, {
        category: selection.category === 'diagnosis' ? 'differential' : 'diagnosis',
        reason: 'Synthetic clinician category correction for Figma selected-code bar.'
      })
    );
  }

  function acknowledgeFirstComplianceIssue() {
    if (!noteId || !compliance?.issues[0]) return;
    const issue = compliance.issues[0];
    void runAction('Compliance issue acknowledged through API.', () =>
      client.recordComplianceIssueAction(noteId, issue.complianceIssueId, {
        action: 'acknowledge',
        reason: 'Synthetic clinician acknowledged the compliance issue for review tracking.'
      })
    );
  }

  function resolveFirstComplianceIssue() {
    if (!noteId || !compliance?.issues[0]) return;
    const issue = compliance.issues[0];
    void runAction('Compliance issue resolved through API with blocker recalculation.', () =>
      client.recordComplianceIssueAction(noteId, issue.complianceIssueId, {
        action: 'resolve',
        reason: 'Synthetic clinician resolved the issue after reviewing required evidence.'
      })
    );
  }

  function createHistoryGapTask() {
    if (!noteId || historyGaps.length === 0) return;
    const question = historyGaps[0];
    if (!question) return;
    void runAction('History Gap question sent to MA follow-up as a signing blocker through API.', () =>
      client.createHistoryGapTask(noteId, question.historyGapQuestionId, { blocksSigning: true, ownerRole: 'ma' })
    );
  }

  async function verifyPermissionDeniedState() {
    setRouteState('loading');
    try {
      await supportClient.getDocumentationWorkspace(appointmentId);
      setRouteState('failed');
      setMessage('Unexpected support workspace access succeeded.');
    } catch (error) {
      setRouteState('permission-denied');
      setMessage(error instanceof Error ? error.message : 'Support workspace access denied by API.');
    }
  }

  const panelRows = useMemo(() => workspace?.panels ?? [], [workspace]);
  const transcriptSegments = transcript?.segments ?? workspace?.transcript?.segments ?? [];
  const correctionCount = transcript?.corrections?.length ?? 0;
  const providerRuntimeStates = providerStatus?.runtimeStates ?? [];
  const acceptedSelectionCount = visitSelections.filter((selection) => selection.disposition !== 'removed').length;
  const lowConfidenceSuggestionCount = suggestions.filter((suggestion) => suggestion.lowConfidenceOverrideRequired).length;
  const topSuggestions = suggestions.slice(0, 4);

  return (
    <main className="workspace-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Documentation Workspace</p>
          <h1>Workspace Shell</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <a href="/aura-note">Runtime Home</a>
          <a href="/aura-note/schedule">Schedule</a>
          <a href="/aura-note/drafts">Draft Notes</a>
          <a href="/aura-note/finalized">Finalized Notes</a>
        </nav>
      </header>

      <section className="workspace-topline" aria-live="polite">
        <div>
          <h2>{appointmentId}</h2>
          <p>
            {workspace?.appointment.safePatientId ?? 'loading'} / {workspace?.appointment.visitType ?? 'loading'} /{' '}
            {workspace?.appointment.clinicianId ?? 'loading'}
          </p>
          <p>{message}</p>
        </div>
        <dl>
          <div>
            <dt>Route State</dt>
            <dd>{routeState}</dd>
          </div>
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
        <button type="button" className="secondary-action" onClick={() => void verifyPermissionDeniedState()}>
          Verify Permission Denied
        </button>
      </section>

      <section className="controls-bar secondary-controls" aria-label="Recording and transcript controls">
        <button type="button" onClick={demoPermissionDenied}>
          Demo Permission Denied
        </button>
        <button type="button" disabled={recordingState === 'exception_approved'} onClick={approveException}>
          Approve Exception
        </button>
        <button type="button" disabled={recordingState !== 'recording'} onClick={appendMetadataChunk}>
          Append Metadata Chunk
        </button>
        <button type="button" disabled={recordingChunks === 0} onClick={processMockTranscription}>
          Process Mock Transcription
        </button>
        <button type="button" disabled={timerState === 'not_started'} onClick={requestDisabledLiveProvider}>
          Verify Live Provider Disabled
        </button>
        <button type="button" disabled={transcriptSegments.length === 0} onClick={correctFirstTranscriptSegment}>
          Correct Transcript
        </button>
        <button type="button" disabled={!editorUnlocked} onClick={appendTranscript}>
          Append Mock Transcript
        </button>
      </section>

      <section className="figma-editor-command-deck" aria-label="Figma editor command deck">
        <article>
          <p className="eyebrow">Design 1 / Note Editor</p>
          <h2>Patient And Encounter Command Bar</h2>
          <p>
            {workspace?.appointment.safePatientId ?? 'loading'} / {workspace?.appointment.visitType ?? 'loading'} / note{' '}
            {noteId ?? 'loading'}
          </p>
          <div className="figma-status-row">
            <span>Editor: {editorUnlocked ? 'unlocked' : 'locked'}</span>
            <span>Timer: {timerState}</span>
            <span>Recording: {recordingState}</span>
            <span>Route: {routeState}</span>
          </div>
        </article>
        <article aria-label="Figma audio wave and transcript controls">
          <p className="eyebrow">Audio / Transcript</p>
          <h2>Mock Recording Runtime</h2>
          <div className="figma-audio-wave" aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => (
              <i key={index} style={{ height: `${12 + ((index + recordingChunks) % 6) * 6}px` }} />
            ))}
          </div>
          <small>
            {transcriptLiveView?.pollingMode ?? 'api_polling'} / liveStreamingEnabled=
            {String(transcriptLiveView?.liveStreamingEnabled ?? false)} / rawPhiAudioStored=
            {String(transcriptLiveView?.rawPhiAudioStored ?? false)}
          </small>
        </article>
      </section>

      <section className="status-band" aria-label="Audio capture and transcription status">
        <div>
          <h2>Audio Capture Candidate</h2>
          <p>
            Browser microphone and transcription controls write metadata through API endpoints. Live provider calls and raw
            PHI audio storage remain disabled.
          </p>
        </div>
        <dl>
          <div>
            <dt>Transport</dt>
            <dd>metadata_only_synthetic</dd>
          </div>
          <div>
            <dt>Chunks</dt>
            <dd>{recordingChunks}</dd>
          </div>
          <div>
            <dt>Microphone permission</dt>
            <dd>{microphonePermissionState}</dd>
          </div>
          <div>
            <dt>Provider</dt>
            <dd>{providerStatus?.mode ?? 'mock_only'}</dd>
          </div>
          <div>
            <dt>Provider boundary</dt>
            <dd>{providerStatus?.providerBoundary ?? 'server_side_adapter'}</dd>
          </div>
          <div>
            <dt>Retry policy</dt>
            <dd>{providerStatus?.retryPolicy ? `${providerStatus.retryPolicy.maxAttempts} attempts / ${providerStatus.retryPolicy.deadLetterState}` : '3 attempts / dead_lettered_metadata_only'}</dd>
          </div>
          <div>
            <dt>Raw audio retention</dt>
            <dd>{workspace?.rawAudioRetention ? `${workspace.rawAudioRetention.retentionClass} until ${workspace.rawAudioRetention.purgeAfter}` : 'one_week'}</dd>
          </div>
          <div>
            <dt>Transcript retention</dt>
            <dd>{transcript?.retentionPolicy ?? 'indefinite'}</dd>
          </div>
          <div>
            <dt>Live transcript state</dt>
            <dd>{transcriptLiveView?.liveState ?? 'not_started'}</dd>
          </div>
          <div>
            <dt>Average confidence</dt>
            <dd>{transcriptLiveView?.averageConfidence === null || transcriptLiveView?.averageConfidence === undefined ? 'not_available' : `${Math.round(transcriptLiveView.averageConfidence * 100)}%`}</dd>
          </div>
          <div>
            <dt>Speaker labels</dt>
            <dd>{transcriptLiveView?.speakerLabels.join(', ') || 'not_available'}</dd>
          </div>
        </dl>
        <section className="state-grid" aria-label="Transcription runtime states">
          {providerRuntimeStates.map((state) => (
            <span key={state}>{state}</span>
          ))}
        </section>
      </section>

      <section className="figma-workspace-three-pane" aria-label="Figma documentation workspace visual layout">
        <article className="figma-editor-pane" aria-label="Figma rich text editor surface">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Design 1 / Rich Text Editor</p>
              <h2>{readOnlyEditor ? 'Locked Draft Surface' : 'Editable Draft Surface'}</h2>
            </div>
            <strong>{noteContent?.format ?? 'aura_markdown_v1'}</strong>
          </div>
          <div className="figma-editor-preview" aria-label="API-backed editor preview">
            <p>{draftMarkdown || workspace?.editorLockedReason || 'Draft-only note content loads from the API.'}</p>
          </div>
          <div className="figma-status-row">
            <span>Revision {noteContent?.revision ?? 'loading'}</span>
            <span>{noteVersions.length} versions</span>
            <span>readOnly={String(readOnlyEditor)}</span>
          </div>
        </article>

        <aside className="figma-selected-code-rail" aria-label="Figma selected-code rail">
          <div>
            <p className="eyebrow">Selected Codes</p>
            <h2>{acceptedSelectionCount} Active</h2>
          </div>
          {visitSelections.slice(0, 5).map((selection) => (
            <div key={selection.visitSelectionId} data-state={selection.disposition}>
              <strong>{selection.label}</strong>
              <span>
                {selection.category} / {selection.disposition}
              </span>
              <small>humanApproved={String(selection.humanApproved)}</small>
            </div>
          ))}
          {visitSelections.length === 0 ? <p>No selected items yet.</p> : null}
        </aside>

        <aside className="figma-suggestion-rail" aria-label="Figma suggestion intelligence rail">
          <div>
            <p className="eyebrow">AI Suggestions</p>
            <h2>Candidate Review</h2>
            <small>Low-confidence threshold remains AURA Note &lt;75%.</small>
          </div>
          {topSuggestions.map((suggestion) => (
            <div key={suggestion.suggestionId} data-state={suggestion.status}>
              <strong>{suggestion.label}</strong>
              <span>{suggestion.category}</span>
              <i aria-hidden="true">
                <b style={{ width: `${Math.max(8, Math.round(suggestion.confidence * 100))}%` }} />
              </i>
              <small>
                {Math.round(suggestion.confidence * 100)}% / humanReviewRequired=
                {String(suggestion.humanReviewRequired)}
              </small>
            </div>
          ))}
          <span className="state-pill">override-required={lowConfidenceSuggestionCount}</span>
        </aside>
      </section>

      <section className="review-board" aria-label="Suggestions and review panels" aria-live="polite">
        <article>
          <h2>Suggestions</h2>
          <p>Suggestions are deterministic API candidates and require human review.</p>
          <label>
            Override Reason
            <input
              value={overrideReason}
              onChange={(event) => setOverrideReason(event.target.value)}
              placeholder="Required for diagnosis suggestions under 75 percent"
            />
          </label>
          <button type="button" onClick={evaluateSuggestions}>
            Evaluate Suggestions
          </button>
          <div className="suggestion-list">
            {suggestions.length === 0 ? <p>No suggestions returned yet.</p> : null}
            {suggestions.map((suggestion) => (
              <div key={suggestion.suggestionId} className="suggestion-row">
                <div>
                  <strong>{suggestion.label}</strong>
                  <span>
                    {suggestion.category} / {Math.round(suggestion.confidence * 100)}% / {suggestion.status}
                  </span>
                </div>
                <p>{suggestion.rationale}</p>
                <small>
                  {suggestion.humanReviewRequired ? 'human review required' : 'review state missing'} /{' '}
                  {suggestion.documentationRequirements?.join(', ') ?? 'documentation requirements pending'}
                </small>
                <button type="button" disabled={suggestion.status !== 'candidate'} onClick={() => acceptSuggestion(suggestion)}>
                  Accept
                </button>
                <button type="button" disabled={suggestion.status !== 'candidate'} onClick={() => removeSuggestion(suggestion)}>
                  Remove
                </button>
                <button type="button" disabled={suggestion.status !== 'removed'} onClick={() => restoreSuggestion(suggestion)}>
                  Return to Suggestions
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
              <div key={selection.visitSelectionId} className="suggestion-row">
                <div>
                  <strong>{selection.category}: {selection.label}</strong>
                  <span>
                    {selection.disposition} / {selection.humanApproved ? 'approved' : 'not approved'}
                  </span>
                  {selection.removalReason ? <small>{selection.removalReason}</small> : null}
                </div>
                <button type="button" disabled={selection.disposition === 'removed'} onClick={() => changeVisitSelectionCategory(selection)}>
                  Change Category
                </button>
                <button type="button" disabled={selection.disposition === 'removed'} onClick={() => removeVisitSelection(selection)}>
                  Remove Selection
                </button>
              </div>
            ))}
          </div>
        </article>

        <article aria-label="Transcript segments">
          <h2>Transcript Segments</h2>
          {transcriptSegments.length === 0 ? <p>No transcript segments yet.</p> : null}
          {transcriptSegments.map((segment) => (
            <div key={segment.transcriptSegmentId} className="suggestion-row">
              <div>
                <strong>{segment.speakerLabel ?? segment.speakerRole}</strong>
                <span>
                  {Math.round((segment.confidence ?? 0) * 100)}% / {segment.sourceChunkId ?? 'manual mock'} /{' '}
                  {segment.corrected ? 'corrected' : 'uncorrected'}
                </span>
              </div>
              <p>{segment.text}</p>
            </div>
          ))}
          <small>{correctionCount} correction{correctionCount === 1 ? '' : 's'} recorded.</small>
        </article>

        <article>
          <h2>History Gap Review</h2>
          <p>{historyGaps[0]?.question ?? 'No history gap questions returned yet.'}</p>
          <button type="button" disabled={historyGaps.length === 0 || compliance?.finalizeDisabled} onClick={createHistoryGapTask}>
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
            disabled={readOnlyEditor}
            value={readOnlyEditor && !noteContent ? workspace?.editorLockedReason ?? 'Editor locked until Start Visit runs the timer or a recording exception is approved.' : draftMarkdown}
            onChange={(event) => setDraftMarkdown(event.target.value)}
            readOnly={readOnlyEditor}
          />
          <div className="inline-actions">
            <button type="button" disabled={readOnlyEditor || !noteId} onClick={autosaveNoteContent}>
              Autosave
            </button>
            <button type="button" disabled={readOnlyEditor || noteVersions.length < 2} onClick={restoreLatestPreviousVersion}>
              Restore Version
            </button>
          </div>
          <dl className="compact-facts">
            <div>
              <dt>Format</dt>
              <dd>{noteContent?.format ?? 'loading'}</dd>
            </div>
            <div>
              <dt>Revision</dt>
              <dd>{noteContent?.revision ?? 'loading'}</dd>
            </div>
            <div>
              <dt>Versions</dt>
              <dd>{noteVersions.length}</dd>
            </div>
            <div>
              <dt>Sections</dt>
              <dd>{noteContent?.sections.map((section) => section.title).join(', ') ?? 'loading'}</dd>
            </div>
          </dl>
        </article>

        <aside className="workspace-panels" aria-label="Workspace panels">
          {panelRows.map((panel) => (
            <article key={panel.panelId} className={`panel-row state-${panel.state}`}>
              <div>
                <strong>{panel.label}</strong>
                <span>{panel.state}</span>
              </div>
              <p>{panel.blockedReason ?? `${panel.itemCount} API-backed item${panel.itemCount === 1 ? '' : 's'}.`}</p>
            </article>
          ))}
          {(compliance?.issues ?? []).map((issue) => (
            <article key={issue.complianceIssueId} className={`panel-row state-${issue.blocksFinalize ? 'blocked' : 'ready'}`}>
              <div>
                <strong>{issue.title}</strong>
                <span>{issue.severity} / {issue.status}</span>
              </div>
              <p>{issue.detail}</p>
              <small>{issue.actionHistory?.length ?? 0} action{issue.actionHistory?.length === 1 ? '' : 's'} recorded.</small>
            </article>
          ))}
          <div className="inline-actions">
            <button type="button" disabled={!compliance?.issues.length} onClick={acknowledgeFirstComplianceIssue}>
              Acknowledge Issue
            </button>
            <button type="button" disabled={!compliance?.issues.length} onClick={resolveFirstComplianceIssue}>
              Resolve Issue
            </button>
          </div>
        </aside>
      </section>

      <section className="status-band" aria-label="Workspace route state coverage">
        <div>
          <h2>API-Backed Route States</h2>
          <p>Workspace route state is loaded from API DTOs; local state is limited to transient controls and form text.</p>
        </div>
        <dl>
          {routeStates.map((state) => (
            <div key={state}>
              <dt>{state}</dt>
              <dd>{state === routeState ? 'active' : 'covered'}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
