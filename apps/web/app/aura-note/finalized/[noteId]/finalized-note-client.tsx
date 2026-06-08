'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ExportArtifactDto, FinalizedNoteDetailDto } from '@aura-note/contracts';
import { createAuraNoteApiClient } from '../../../../lib/aura-note-api-client';

type ViewerTab = 'final_note' | 'patient_summary';
type RouteState = 'loading' | 'empty' | 'ready' | 'saving' | 'failed' | 'permission-denied' | 'read-only';

interface FinalizedNoteClientProps {
  noteId: string;
}

export function FinalizedNoteClient({ noteId }: FinalizedNoteClientProps) {
  const client = useMemo(() => createAuraNoteApiClient({ role: 'clinician' }), []);
  const supportClient = useMemo(() => createAuraNoteApiClient({ role: 'support', userId: 'user-support-finalized-denial' }), []);
  const [activeTab, setActiveTab] = useState<ViewerTab>('final_note');
  const [detail, setDetail] = useState<FinalizedNoteDetailDto | null>(null);
  const [routeState, setRouteState] = useState<RouteState>('loading');
  const [message, setMessage] = useState('Loading finalized note from the API.');

  const refreshDetail = useCallback(async () => {
    setRouteState('loading');
    try {
      const response = await client.getFinalizedNote(noteId);
      setDetail(response.data);
      setRouteState(response.data.finalNoteAvailable ? 'read-only' : 'empty');
      setMessage(response.data.finalNoteAvailable ? 'Signed final artifacts loaded from API-backed read-only state.' : 'Finalized artifact is not available yet.');
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'Finalized note API request failed.');
    }
  }, [client, noteId]);

  useEffect(() => {
    void refreshDetail();
  }, [refreshDetail]);

  async function runExportAction(label: string, action: () => Promise<{ data: { artifact?: ExportArtifactDto; finalizedNote?: FinalizedNoteDetailDto } }>) {
    setRouteState('saving');
    try {
      const response = await action();
      if (response.data.finalizedNote) {
        setDetail(response.data.finalizedNote);
      }
      setMessage(label);
      setRouteState('read-only');
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : label);
    }
  }

  function copyFinalNote() {
    void runExportAction('Final note copy-safe artifact generated through API.', () => client.copyFinalNote(noteId));
  }

  function copyPatientSummary() {
    void runExportAction('Patient summary copy-safe artifact generated through API without internal revenue or coding logic.', () =>
      client.copyPatientSummary(noteId)
    );
  }

  function generateNotePdf() {
    void runExportAction('Final note PDF artifact generated through API.', () => client.generateFinalNotePdf(noteId));
  }

  function generateSummaryPdf() {
    void runExportAction('Patient summary PDF artifact generated through API.', () => client.generatePatientSummaryPdf(noteId));
  }

  function exportStructured() {
    void runExportAction('Structured export artifact generated through API.', () => client.exportStructuredFinalNote(noteId));
  }

  async function queueWriteback() {
    setRouteState('saving');
    try {
      const response = await client.requestEhrWriteback(noteId, {
        target: 'both',
        humanApproved: true,
        scaffoldMode: 'mock_queue'
      });
      setDetail(response.data.finalizedNote);
      setMessage('Mock EHR writeback queued through API. Production EHR writeback remains configuration-gated.');
      setRouteState('read-only');
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'EHR writeback request failed.');
    }
  }

  async function recordWritebackFailure() {
    setRouteState('saving');
    try {
      const response = await client.requestEhrWriteback(noteId, {
        target: 'final_note',
        humanApproved: true,
        scaffoldMode: 'simulate_failure'
      });
      setDetail(response.data.finalizedNote);
      setMessage('Synthetic EHR writeback failure recorded through API.');
      setRouteState('read-only');
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'Synthetic EHR writeback failure request failed.');
    }
  }

  async function verifyPermissionDeniedState() {
    setRouteState('loading');
    try {
      await supportClient.generateFinalNotePdf(noteId);
      setRouteState('failed');
      setMessage('Unexpected support export generation succeeded.');
    } catch (error) {
      setRouteState('permission-denied');
      setMessage(error instanceof Error ? error.message : 'Support export generation denied by API.');
    }
  }

  const activeText =
    activeTab === 'final_note'
      ? detail?.finalNote?.finalNoteText ?? 'Final note is not available from the API yet.'
      : detail?.patientSummary?.patientSummaryText ?? 'Patient summary is not available from the API yet.';

  const artifactStatus = (artifactType: ExportArtifactDto['artifactType']) =>
    detail?.exportArtifacts.find((artifact) => artifact.artifactType === artifactType)?.status ?? 'not_generated';

  return (
    <main className="notes-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Finalized Note Viewer</p>
          <h1>Read-Only Final Note</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <a href="/aura-note">Dashboard</a>
          <a href="/aura-note/finalized">Finalized Notes</a>
          <a href="/aura-note/drafts">Draft Notes</a>
          <a href="/aura-note/schedule">Schedule</a>
        </nav>
      </header>

      <section className="status-band" aria-live="polite">
        <p>{message}</p>
        <dl>
          <div>
            <dt>Route State</dt>
            <dd>{routeState}</dd>
          </div>
          <div>
            <dt>Signed</dt>
            <dd>{detail?.finalNoteAvailable ? 'yes' : 'no'}</dd>
          </div>
          <div>
            <dt>Writeback</dt>
            <dd>{detail?.writeback.status ?? detail?.writebackStatus ?? 'disabled'}</dd>
          </div>
          <div>
            <dt>Editor</dt>
            <dd>disabled</dd>
          </div>
        </dl>
      </section>

      <section className="final-viewer-grid">
        <article className="read-only-viewer" aria-label="Signed finalized artifact">
          <div>
            <h2>{noteId}</h2>
            <p>This viewer cannot reopen the active editor.</p>
          </div>
          <div className="segmented-control" role="tablist" aria-label="Final artifact tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'final_note'}
              className={activeTab === 'final_note' ? 'active' : ''}
              onClick={() => setActiveTab('final_note')}
            >
              Final Note
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'patient_summary'}
              className={activeTab === 'patient_summary' ? 'active' : ''}
              onClick={() => setActiveTab('patient_summary')}
            >
              Patient Summary
            </button>
          </div>
          <pre className="artifact-text">{activeText}</pre>
        </article>

        <aside className="export-panel" aria-label="Export and writeback actions">
          <h2>Output Actions</h2>
          <button type="button" disabled={!detail?.availableActions.copyFinalNote} onClick={copyFinalNote}>
            Copy Final Note
          </button>
          <button type="button" disabled={!detail?.availableActions.copyPatientSummary} onClick={copyPatientSummary}>
            Copy Patient Summary
          </button>
          <button type="button" disabled={!detail?.availableActions.downloadFinalNotePdf} onClick={generateNotePdf}>
            Download Note PDF
          </button>
          <button type="button" disabled={!detail?.availableActions.downloadPatientSummaryPdf} onClick={generateSummaryPdf}>
            Download Patient Summary PDF
          </button>
          <button type="button" disabled={!detail?.availableActions.exportStructured} onClick={exportStructured}>
            Export Structured Note
          </button>
          <button type="button" disabled={!detail?.availableActions.queueEhrWriteback} onClick={() => void queueWriteback()}>
            Queue Mock Writeback
          </button>
          <button type="button" className="secondary-action" disabled={!detail?.finalNoteAvailable} onClick={() => void recordWritebackFailure()}>
            Record Failure State
          </button>
          <button type="button" className="secondary-action" onClick={() => void verifyPermissionDeniedState()}>
            Verify Permission Denied
          </button>
        </aside>
      </section>

      <dl className="artifact-status-grid" aria-label="Artifact statuses">
        <div>
          <dt>Final Note PDF</dt>
          <dd>{artifactStatus('final_note_pdf')}</dd>
        </div>
        <div>
          <dt>Patient Summary PDF</dt>
          <dd>{artifactStatus('patient_summary_pdf')}</dd>
        </div>
        <div>
          <dt>Final Note Copy</dt>
          <dd>{artifactStatus('final_note_copy')}</dd>
        </div>
        <div>
          <dt>Summary Copy</dt>
          <dd>{artifactStatus('patient_summary_copy')}</dd>
        </div>
        <div>
          <dt>Structured Export</dt>
          <dd>{artifactStatus('structured_export')}</dd>
        </div>
        <div>
          <dt>EHR Writeback</dt>
          <dd>{detail?.writeback.status ?? 'disabled'}</dd>
        </div>
      </dl>
    </main>
  );
}
