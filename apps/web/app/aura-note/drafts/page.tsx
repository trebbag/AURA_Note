const draftNotes = [
  {
    noteId: 'note-demo-001',
    appointmentId: 'appt-demo-001',
    safePatientId: 'safe-patient-demo-001',
    clinicianId: 'clinician-demo-001',
    visitType: 'Chronic follow-up',
    startsAt: '2026-05-26T14:00',
    status: 'Visit active',
    editorState: 'Locked until timer is running or approved exception is active'
  }
];

export default function DraftNotesPage() {
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

      <section className="status-band">
        <p>Draft Notes shows only notes that have entered the visit workflow. Synthetic shell data is used for CP-1.</p>
        <dl>
          <div>
            <dt>Drafts</dt>
            <dd>{draftNotes.length}</dd>
          </div>
          <div>
            <dt>State</dt>
            <dd>demo_fixture</dd>
          </div>
        </dl>
      </section>

      <section className="note-list" aria-label="Draft notes">
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
                <dd>{note.status}</dd>
              </div>
              <div>
                <dt>Editor</dt>
                <dd>gate enforced</dd>
              </div>
            </dl>
            <p>{note.editorState}</p>
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

      <section className="empty-state" aria-label="Empty state">
        <h2>Empty State</h2>
        <p>No draft notes appear until an appointment note shell is activated by the visit workflow.</p>
      </section>
    </main>
  );
}
