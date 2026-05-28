import { createAuraNoteApiClient } from '../../../lib/aura-note-api-client';

export const dynamic = 'force-dynamic';

export default async function RuntimeIntegrationPage() {
  const client = createAuraNoteApiClient({ role: 'clinician' });

  try {
    const [schedule, finalized] = await Promise.all([client.listSchedule(), client.listFinalizedNotes()]);

    return (
      <main className="page-shell">
        <nav aria-label="AURA Note sections" className="section-nav">
          <a href="/aura-note/schedule">Schedule</a>
          <a href="/aura-note/drafts">Drafts</a>
          <a href="/aura-note/finalized">Finalized Notes</a>
        </nav>

        <section className="hero-band" aria-labelledby="runtime-heading">
          <p className="eyebrow">WO-048 Frontend Runtime Integration Gate</p>
          <h1 id="runtime-heading">Frontend Runtime Integration Evidence</h1>
          <p>
            This route reads typed API responses from the local AURA Note API. It is synthetic/local evidence only and does
            not enable production PHI, live EHR, live AI, claim submission, or launch readiness.
          </p>
        </section>

        <section className="panel-grid" aria-label="Runtime integration state">
          <article className="panel-card" aria-label="API backed schedule state">
            <h2>Schedule API State</h2>
            <dl className="metric-list">
              <div>
                <dt>delivery</dt>
                <dd>typed_api_client</dd>
              </div>
              <div>
                <dt>appointments</dt>
                <dd>{schedule.data.appointments.length}</dd>
              </div>
              <div>
                <dt>state coverage</dt>
                <dd>loading empty ready saving failed permission-denied read-only</dd>
              </div>
            </dl>
            <ul className="compact-list">
              {schedule.data.appointments.slice(-5).map((appointment) => (
                <li key={appointment.appointmentId}>
                  <strong>{appointment.appointmentId}</strong> / {appointment.noteId} / {appointment.noteStatus}
                </li>
              ))}
            </ul>
          </article>

          <article className="panel-card" aria-label="API backed finalized notes state">
            <h2>Finalized API State</h2>
            <dl className="metric-list">
              <div>
                <dt>delivery</dt>
                <dd>persisted_backend_refetch</dd>
              </div>
              <div>
                <dt>finalized notes</dt>
                <dd>{finalized.data.notes.length}</dd>
              </div>
              <div>
                <dt>read-only</dt>
                <dd>{String(finalized.data.readOnly)}</dd>
              </div>
            </dl>
            <ul className="compact-list">
              {finalized.data.notes.slice(-5).map((note) => (
                <li key={note.noteId}>
                  <strong>{note.noteId}</strong> / {note.exportStatus} / transcriptForRole={String(note.transcriptAvailableForRole)}
                </li>
              ))}
            </ul>
          </article>
        </section>
      </main>
    );
  } catch (error) {
    return (
      <main className="page-shell">
        <section className="hero-band" aria-labelledby="runtime-heading">
          <p className="eyebrow">WO-048 Frontend Runtime Integration Gate</p>
          <h1 id="runtime-heading">Frontend Runtime Integration Evidence</h1>
          <p>API-backed runtime state is unavailable in this environment.</p>
        </section>
        <section className="panel-card" aria-label="Runtime integration failed state">
          <h2>Failed State</h2>
          <p>{error instanceof Error ? error.message : 'Unknown API failure'}</p>
          <p>Production launch-candidate readiness cannot be claimed from this failed state.</p>
        </section>
      </main>
    );
  }
}
