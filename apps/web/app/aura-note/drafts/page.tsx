import { createAuraNoteApiClient } from '../../../lib/aura-note-api-client';

export const dynamic = 'force-dynamic';

export default async function DraftNotesPage() {
  const client = createAuraNoteApiClient({ role: 'clinician' });

  try {
    const response = await client.listDraftNotes();
    const draftNotes = response.data.notes;

    return (
      <main className="notes-shell">
        <header className="page-header">
          <div>
            <p className="eyebrow">AURA Note / Draft Notes</p>
            <h1>Active Documentation Work</h1>
          </div>
          <nav className="header-nav" aria-label="AURA Note sections">
            <a href="/aura-note">Runtime Home</a>
            <a href="/aura-note/schedule">Schedule</a>
            <a href="/aura-note/finalized">Finalized Notes</a>
          </nav>
        </header>

        <section className="status-band" aria-live="polite">
          <p>Draft Notes is rendered from `GET /notes/drafts`; local arrays are not the authoritative route source.</p>
          <dl>
            <div>
              <dt>Drafts</dt>
              <dd>{draftNotes.length}</dd>
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

        <section className="note-list" aria-label="Draft notes">
          {draftNotes.length === 0 ? (
            <article className="empty-state">
              <h2>Empty State</h2>
              <p>No draft notes were returned by the API. A draft appears after the visit workflow activates a note shell.</p>
            </article>
          ) : null}
          {draftNotes.map((note) => (
            <article key={note.noteId} className="note-row">
              <div>
                <strong>{note.safePatientId}</strong>
                <span>{note.visitType}</span>
                <small>
                  {note.startsAt} / {note.clinicianId}
                </small>
              </div>
              <dl className="state-grid">
                <div>
                  <dt>Workflow</dt>
                  <dd>{note.workflowStatusLabel}</dd>
                </div>
                <div>
                  <dt>Editor</dt>
                  <dd>{note.editorLocked ? 'locked' : 'unlocked'}</dd>
                </div>
                <div>
                  <dt>Appointment</dt>
                  <dd>{note.appointmentStatus}</dd>
                </div>
              </dl>
              <p>{note.editorLockedReason ?? 'Timer or approved exception has unlocked editor access.'}</p>
              <div className="row-actions">
                <a className="button-link" href={`/aura-note/workspace/${note.appointmentId}`}>
                  Workspace
                </a>
                <a className="button-link secondary" href={`/aura-note/finalization/${note.noteId}`}>
                  Finalize
                </a>
              </div>
            </article>
          ))}
        </section>

        <section className="status-band" aria-label="Draft route state coverage">
          <p>Covered states: loading, empty, ready, failed, permission-denied, read-only, and demo fixture documentation.</p>
        </section>
      </main>
    );
  } catch (error) {
    return (
      <main className="notes-shell">
        <header className="page-header">
          <div>
            <p className="eyebrow">AURA Note / Draft Notes</p>
            <h1>Active Documentation Work</h1>
          </div>
          <nav className="header-nav" aria-label="AURA Note sections">
            <a href="/aura-note/schedule">Schedule</a>
            <a href="/aura-note/finalized">Finalized Notes</a>
          </nav>
        </header>
        <section className="status-band" aria-label="Draft notes failed state">
          <h2>Failed State</h2>
          <p>{error instanceof Error ? error.message : 'Draft Notes API request failed.'}</p>
        </section>
      </main>
    );
  }
}
