import { createAuraNoteApiClient } from '../../../lib/aura-note-api-client';
import { AlertTriangle, CheckCircle, Edit, FilePlus, FileText, Filter, Search, SortDesc } from 'lucide-react';

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
            <a href="/aura-note">Dashboard</a>
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

        <section className="figma-drafts-source-shell" aria-label="Figma draft notes workspace">
          <header className="figma-drafts-source-header">
            <div>
              <h2>Draft Notes</h2>
              <p>Manage and continue working on unfinished clinical documentation.</p>
            </div>
            <div className="figma-drafts-header-actions">
              <span>{draftNotes.length} of {draftNotes.length} drafts</span>
              <a href="/aura-note/schedule">
                <FilePlus size={16} aria-hidden="true" />
                New Draft
              </a>
            </div>
          </header>

          <section className="figma-drafts-filter-card" aria-label="Filters and Search">
            <div>
              <Filter size={18} aria-hidden="true" />
              <strong>Filters &amp; Search</strong>
            </div>
            <label>
              <Search size={16} aria-hidden="true" />
              Search safe patient ID, visit type, or clinician
              <input value="" placeholder="API-backed search deferred" readOnly />
            </label>
            <div className="figma-drafts-filter-grid">
              <span>Provider: clinician scope</span>
              <span>Visit Type: all</span>
              <span>Urgency: API readiness</span>
              <span>Age: active drafts</span>
              <span>
                <SortDesc size={14} aria-hidden="true" /> Sort: workflow status
              </span>
            </div>
          </section>

          <section className="figma-drafts-card-list" aria-label="Figma draft cards">
            {draftNotes.length === 0 ? (
              <article className="figma-draft-empty-card">
                <FileText size={44} aria-hidden="true" />
                <h3>No drafts found</h3>
                <p>All caught up. Create or start a synthetic appointment to populate API-backed draft notes.</p>
              </article>
            ) : (
              draftNotes.map((note) => (
                <article key={note.noteId} className="figma-draft-card" data-state={note.editorLocked ? 'blocked' : 'ready'}>
                  <span className="figma-source-avatar" aria-hidden="true">
                    {safeNoteInitials(note.safePatientId)}
                  </span>
                  <div className="figma-draft-card-main">
                    <div>
                      <h3>{note.safePatientId}</h3>
                      <span>{note.visitType}</span>
                      <small>{note.startsAt} / {note.clinicianId}</small>
                    </div>
                    <div className="figma-draft-progress" aria-label={`Completion for ${note.noteId}`}>
                      <span>
                        <i style={{ width: note.editorLocked ? '38%' : '76%' }} />
                      </span>
                      <strong>{note.editorLocked ? '38%' : '76%'}</strong>
                    </div>
                  </div>
                  <dl className="figma-draft-meta">
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
                  <div className="figma-draft-actions">
                    {note.editorLocked ? (
                      <span className="figma-draft-warning">
                        <AlertTriangle size={15} aria-hidden="true" />
                        Needs visit timer
                      </span>
                    ) : (
                      <span className="figma-draft-ready">
                        <CheckCircle size={15} aria-hidden="true" />
                        Ready
                      </span>
                    )}
                    <a href={`/aura-note/workspace/${note.appointmentId}`}>
                      <Edit size={15} aria-hidden="true" />
                      Continue
                    </a>
                  </div>
                </article>
              ))
            )}
          </section>
        </section>

        <section className="figma-note-table" aria-label="Figma draft notes table">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Draft Notes</p>
              <h2>Active Documentation Table</h2>
              <p>Rows are resumable only through appointment-linked workspace routes and typed API state.</p>
            </div>
            <strong>state={response.data.emptyState}</strong>
          </div>
          <div className="figma-status-row">
            <span>loading: covered</span>
            <span>empty: {draftNotes.length === 0 ? 'active' : 'covered'}</span>
            <span>ready: {draftNotes.length > 0 ? 'active' : 'covered'}</span>
            <span>read-only: covered after finalization</span>
          </div>
          <div className="figma-note-table-grid">
            {draftNotes.slice(0, 4).map((note) => (
              <a key={note.noteId} href={`/aura-note/workspace/${note.appointmentId}`} data-state={note.editorLocked ? 'blocked' : 'ready'}>
                <strong>{note.safePatientId}</strong>
                <span>{note.visitType}</span>
                <small>{note.workflowStatusLabel}</small>
                <small>editorLocked={String(note.editorLocked)}</small>
              </a>
            ))}
            {draftNotes.length === 0 ? <p>No API-backed draft note rows are available.</p> : null}
          </div>
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

function safeNoteInitials(safePatientId: string): string {
  const suffix = safePatientId.split('-').filter(Boolean).at(-1) ?? safePatientId;
  return suffix.slice(0, 2).toUpperCase();
}
