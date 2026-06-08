import { createAuraNoteApiClient } from '../../../lib/aura-note-api-client';

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
