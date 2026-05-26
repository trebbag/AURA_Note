const finalizedPlaceholders = [
  {
    noteId: 'note-demo-finalized-001',
    appointmentId: 'appt-demo-finalized-001',
    safePatientId: 'safe-patient-finalized-001',
    clinicianId: 'clinician-demo-001',
    status: 'Signed and dispatched',
    finalizedAt: '2026-05-26T16:00',
    finalNoteAvailable: true,
    patientSummaryAvailable: true,
    exportStatus: 'not_generated',
    writebackStatus: 'not_configured'
  }
];

export default function FinalizedNotesPage() {
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

      <section className="status-band">
        <p>Signed final note and patient summary artifacts stay read-only; export, PDF, copy, and writeback states are explicit.</p>
        <dl>
          <div>
            <dt>Writable</dt>
            <dd>no</dd>
          </div>
          <div>
            <dt>State</dt>
            <dd>finalized_read_only</dd>
          </div>
        </dl>
      </section>

      <section className="note-list" aria-label="Finalized notes">
        {finalizedPlaceholders.map((note) => (
          <article key={note.noteId} className="note-row finalized-note">
            <div>
              <strong>{note.safePatientId}</strong>
              <span>{note.status}</span>
              <small>{note.clinicianId}</small>
              <small>{note.finalizedAt}</small>
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
                <dd>{note.exportStatus}</dd>
              </div>
              <div>
                <dt>Writeback</dt>
                <dd>{note.writebackStatus}</dd>
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
}
