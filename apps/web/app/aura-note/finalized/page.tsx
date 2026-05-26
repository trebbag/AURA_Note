const finalizedPlaceholders = [
  {
    noteId: 'note-demo-finalized-placeholder',
    appointmentId: 'appt-demo-finalized-placeholder',
    safePatientId: 'safe-patient-finalized-placeholder',
    clinicianId: 'clinician-demo-001',
    status: 'Read-only placeholder',
    finalNoteAvailable: false,
    patientSummaryAvailable: false
  }
];

export default function FinalizedNotesPage() {
  return (
    <main className="notes-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Finalized Notes</p>
          <h1>Read-Only Final Artifacts</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <a href="/aura-note/schedule">Schedule</a>
          <a href="/aura-note/drafts">Draft Notes</a>
        </nav>
      </header>

      <section className="status-band">
        <p>Finalized Notes is present as a read-only CP-1 shell. Final note approval and export workflows begin later.</p>
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
            </dl>
            <p>This route cannot reopen the active editor.</p>
            <a className="button-link secondary" href={`/aura-note/finalized/${note.noteId}`}>
              View Read-Only
            </a>
          </article>
        ))}
      </section>
    </main>
  );
}
