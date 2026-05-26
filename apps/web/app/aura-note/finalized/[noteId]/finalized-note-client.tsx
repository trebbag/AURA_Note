'use client';

import { useState } from 'react';

type ViewerTab = 'final_note' | 'patient_summary';
type ActionState = 'not_generated' | 'generated' | 'failed';
type WritebackState = 'not_configured' | 'queued' | 'failed';

interface FinalizedNoteClientProps {
  noteId: string;
}

const finalNoteText = [
  'Enhanced Synthetic Clinician Note',
  'Synthetic draft note for Chronic follow-up.',
  'Payer-readable support is limited to clinician-reviewed synthetic items.',
  'Signed final note is read-only.'
].join('\n\n');

const patientSummaryText =
  'Today we reviewed your follow-up plan. Bring your medication list to the next visit and contact the clinic if symptoms change.';

export function FinalizedNoteClient({ noteId }: FinalizedNoteClientProps) {
  const [activeTab, setActiveTab] = useState<ViewerTab>('final_note');
  const [notePdfState, setNotePdfState] = useState<ActionState>('not_generated');
  const [summaryPdfState, setSummaryPdfState] = useState<ActionState>('not_generated');
  const [copyState, setCopyState] = useState<ActionState>('not_generated');
  const [summaryCopyState, setSummaryCopyState] = useState<ActionState>('not_generated');
  const [structuredExportState, setStructuredExportState] = useState<ActionState>('not_generated');
  const [writebackState, setWritebackState] = useState<WritebackState>('not_configured');
  const [message, setMessage] = useState('Signed final artifacts are available for role-limited actions.');

  const activeText = activeTab === 'final_note' ? finalNoteText : patientSummaryText;

  function generateNotePdf() {
    setNotePdfState('generated');
    setMessage('Final note PDF artifact generated from the signed read-only version.');
  }

  function generateSummaryPdf() {
    setSummaryPdfState('generated');
    setMessage('Patient summary PDF artifact generated with internal billing details excluded.');
  }

  function copyFinalNote() {
    setCopyState('generated');
    setMessage('Final note copy-safe artifact prepared for manual EHR workflow.');
  }

  function copyPatientSummary() {
    setSummaryCopyState('generated');
    setMessage('Patient summary copy-safe artifact prepared without internal revenue or coding logic.');
  }

  function exportStructured() {
    setStructuredExportState('generated');
    setMessage('Structured export artifact generated from signed final note and patient summary.');
  }

  function queueWriteback() {
    setWritebackState('queued');
    setMessage('Mock EHR writeback queued. Production EHR writeback remains configuration-gated.');
  }

  function recordWritebackFailure() {
    setWritebackState('failed');
    setMessage('Synthetic EHR writeback failure recorded; local copy/PDF/export actions remain available.');
  }

  return (
    <main className="notes-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Finalized Note Viewer</p>
          <h1>Read-Only Final Note</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <a href="/aura-note/finalized">Finalized Notes</a>
          <a href="/aura-note/drafts">Draft Notes</a>
          <a href="/aura-note/schedule">Schedule</a>
        </nav>
      </header>

      <section className="status-band" aria-live="polite">
        <p>{message}</p>
        <dl>
          <div>
            <dt>Signed</dt>
            <dd>yes</dd>
          </div>
          <div>
            <dt>Writeback</dt>
            <dd>{writebackState}</dd>
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
          <button type="button" onClick={copyFinalNote}>
            Copy Final Note
          </button>
          <button type="button" onClick={copyPatientSummary}>
            Copy Patient Summary
          </button>
          <button type="button" onClick={generateNotePdf}>
            Download Note PDF
          </button>
          <button type="button" onClick={generateSummaryPdf}>
            Download Patient Summary PDF
          </button>
          <button type="button" onClick={exportStructured}>
            Export Structured Note
          </button>
          <button type="button" onClick={queueWriteback}>
            Queue Mock Writeback
          </button>
          <button type="button" className="secondary-action" onClick={recordWritebackFailure}>
            Record Failure State
          </button>
        </aside>
      </section>

      <dl className="artifact-status-grid" aria-label="Artifact statuses">
        <div>
          <dt>Final Note PDF</dt>
          <dd>{notePdfState}</dd>
        </div>
        <div>
          <dt>Patient Summary PDF</dt>
          <dd>{summaryPdfState}</dd>
        </div>
        <div>
          <dt>Final Note Copy</dt>
          <dd>{copyState}</dd>
        </div>
        <div>
          <dt>Summary Copy</dt>
          <dd>{summaryCopyState}</dd>
        </div>
        <div>
          <dt>Structured Export</dt>
          <dd>{structuredExportState}</dd>
        </div>
        <div>
          <dt>EHR Writeback</dt>
          <dd>{writebackState}</dd>
        </div>
      </dl>
    </main>
  );
}
