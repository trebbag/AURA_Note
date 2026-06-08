import { createAuraNoteApiClient } from '../../../lib/aura-note-api-client';
import { CheckCircle, Eye, FileText, Filter, Lock, Search, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FinalizedNotesPage() {
  const client = createAuraNoteApiClient({ role: 'clinician' });

  try {
    const response = await client.listFinalizedNotes();
    const finalizedNotes = response.data.notes;

    return (
      <main className="notes-shell">
        <header className="page-header">
          <div>
            <p className="eyebrow">AURA Note / Finalized Notes</p>
            <h1>Finalized Notes</h1>
          </div>
          <nav className="header-nav" aria-label="AURA Note sections">
            <a href="/aura-note">Dashboard</a>
            <a href="/aura-note/schedule">Schedule</a>
            <a href="/aura-note/drafts">Draft Notes</a>
          </nav>
        </header>

        <section className="status-band">
          <p>Signed final note and patient summary artifacts are read-only API-backed records.</p>
          <dl>
            <div>
              <dt>Writable</dt>
              <dd>no</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>{response.data.emptyState}</dd>
            </div>
            <div>
              <dt>Data Source</dt>
              <dd>typed_api_client</dd>
            </div>
          </dl>
        </section>

        <section className="figma-drafts-source-shell finalized-source-shell" aria-label="Figma finalized notes workspace">
          <header className="figma-drafts-source-header">
            <div>
              <h2>Finalized Notes</h2>
              <p>Review signed documentation artifacts without reopening the editor.</p>
            </div>
            <div className="figma-drafts-header-actions">
              <span>{finalizedNotes.length} read-only records</span>
              <span className="figma-readonly-badge">
                <Lock size={15} aria-hidden="true" />
                Read Only
              </span>
            </div>
          </header>

          <section className="figma-drafts-filter-card" aria-label="Finalized notes filters and Search">
            <div>
              <Filter size={18} aria-hidden="true" />
              <strong>Filters &amp; Search</strong>
            </div>
            <label>
              <Search size={16} aria-hidden="true" />
              Search signed artifact metadata
              <input value="" placeholder="Read-only API-backed metadata" readOnly />
            </label>
            <div className="figma-drafts-filter-grid">
              <span>Final note: immutable</span>
              <span>Patient summary: role-limited</span>
              <span>Exports: server-mediated</span>
              <span>Writeback: disabled unless configured</span>
              <span>submittedClaim=false</span>
            </div>
          </section>

          <section className="figma-drafts-card-list" aria-label="Figma finalized note cards">
            {finalizedNotes.length === 0 ? (
              <article className="figma-draft-empty-card">
                <FileText size={44} aria-hidden="true" />
                <h3>No finalized notes found</h3>
                <p>Signed artifacts appear here after the finalization wizard completes with human review.</p>
              </article>
            ) : (
              finalizedNotes.map((note) => (
                <article key={note.noteId} className="figma-draft-card finalized-card" data-state="read-only">
                  <span className="figma-source-avatar" aria-hidden="true">
                    {safeFinalizedInitials(note.safePatientId)}
                  </span>
                  <div className="figma-draft-card-main">
                    <div>
                      <h3>{note.safePatientId}</h3>
                      <span>{note.finalNoteAvailable ? 'Signed and dispatched' : 'Not finalized'}</span>
                      <small>{note.finalizedAt ?? 'not finalized'} / {note.clinicianId}</small>
                    </div>
                    <div className="figma-draft-progress" aria-label={`Read-only availability for ${note.noteId}`}>
                      <span>
                        <i style={{ width: note.finalNoteAvailable ? '100%' : '20%' }} />
                      </span>
                      <strong>{note.finalNoteAvailable ? '100%' : '20%'}</strong>
                    </div>
                  </div>
                  <dl className="figma-draft-meta">
                    <div>
                      <dt>Final Note</dt>
                      <dd>{note.finalNoteAvailable ? 'available' : 'not yet available'}</dd>
                    </div>
                    <div>
                      <dt>Summary</dt>
                      <dd>{note.patientSummaryAvailable ? 'available' : 'not yet available'}</dd>
                    </div>
                    <div>
                      <dt>Export</dt>
                      <dd>{note.exportStatus ?? 'not_generated'}</dd>
                    </div>
                    <div>
                      <dt>Writeback</dt>
                      <dd>{note.writebackStatus ?? 'disabled'}</dd>
                    </div>
                  </dl>
                  <div className="figma-draft-actions">
                    <span className="figma-draft-ready">
                      <Shield size={15} aria-hidden="true" />
                      Immutable
                    </span>
                    <span className="figma-draft-ready">
                      <CheckCircle size={15} aria-hidden="true" />
                      Human reviewed
                    </span>
                    <a href={`/aura-note/finalized/${note.noteId}`}>
                      <Eye size={15} aria-hidden="true" />
                      View
                    </a>
                  </div>
                </article>
              ))
            )}
          </section>
        </section>

        <section className="figma-note-table" aria-label="Figma finalized notes table">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Finalized Notes</p>
              <h2>Read-Only Artifact Table</h2>
              <p>Final note, patient summary, export, and writeback metadata stay immutable from this route.</p>
            </div>
            <strong>writable=false</strong>
          </div>
          <div className="figma-status-row">
            <span>empty: {finalizedNotes.length === 0 ? 'active' : 'covered'}</span>
            <span>ready: {finalizedNotes.length > 0 ? 'active' : 'covered'}</span>
            <span>read-only: active</span>
            <span>permission-denied: covered by RBAC tests</span>
          </div>
          <div className="figma-note-table-grid">
            {finalizedNotes.slice(0, 4).map((note) => (
              <a key={note.noteId} href={`/aura-note/finalized/${note.noteId}`} data-state="read-only">
                <strong>{note.safePatientId}</strong>
                <span>{note.finalNoteAvailable ? 'Signed and dispatched' : 'Not finalized'}</span>
                <small>Export: {note.exportStatus ?? 'not_generated'}</small>
                <small>Writeback: {note.writebackStatus ?? 'disabled'}</small>
              </a>
            ))}
            {finalizedNotes.length === 0 ? <p>No read-only finalized notes were returned by the API.</p> : null}
          </div>
        </section>

        <section className="note-list" aria-label="Finalized notes">
          {finalizedNotes.length === 0 ? (
            <article className="empty-state">
              <h2>Empty State</h2>
              <p>No finalized notes were returned by the API. The route remains read-only.</p>
            </article>
          ) : null}
          {finalizedNotes.map((note) => (
            <article key={note.noteId} className="note-row finalized-note">
              <div>
                <strong>{note.safePatientId}</strong>
                <span>{note.finalNoteAvailable ? 'Signed and dispatched' : 'Not finalized'}</span>
                <small>{note.clinicianId}</small>
                <small>{note.finalizedAt ?? 'not finalized'}</small>
              </div>
              <dl className="state-grid">
                <div>
                  <dt>Final Note</dt>
                  <dd>{note.finalNoteAvailable ? 'available' : 'not yet available'}</dd>
                </div>
                <div>
                  <dt>Summary</dt>
                  <dd>{note.patientSummaryAvailable ? 'available' : 'not yet available'}</dd>
                </div>
                <div>
                  <dt>Export</dt>
                  <dd>{note.exportStatus ?? 'not_generated'}</dd>
                </div>
                <div>
                  <dt>Writeback</dt>
                  <dd>{note.writebackStatus ?? 'disabled'}</dd>
                </div>
              </dl>
              <p>Copy/export/PDF actions are available from the read-only viewer after signing.</p>
              <a className="button-link secondary" href={`/aura-note/finalized/${note.noteId}`}>
                View Read-Only
              </a>
            </article>
          ))}
        </section>
      </main>
    );
  } catch (error) {
    return (
      <main className="notes-shell">
        <header className="page-header">
          <div>
            <p className="eyebrow">AURA Note / Finalized Notes</p>
            <h1>Finalized Notes</h1>
          </div>
          <nav className="header-nav" aria-label="AURA Note sections">
            <a href="/aura-note/schedule">Schedule</a>
            <a href="/aura-note/drafts">Draft Notes</a>
          </nav>
        </header>
        <section className="status-band" aria-label="Finalized notes failed state">
          <h2>Failed State</h2>
          <p>{error instanceof Error ? error.message : 'Finalized Notes API request failed.'}</p>
        </section>
      </main>
    );
  }
}

function safeFinalizedInitials(safePatientId: string): string {
  const suffix = safePatientId.split('-').filter(Boolean).at(-1) ?? safePatientId;
  return suffix.slice(0, 2).toUpperCase();
}
