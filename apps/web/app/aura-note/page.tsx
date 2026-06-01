import { createAuraNoteApiClient } from '../../lib/aura-note-api-client';

export const dynamic = 'force-dynamic';

export default async function AuraNoteRuntimeHomePage() {
  const clinicianClient = createAuraNoteApiClient({ role: 'clinician' });
  const adminClient = createAuraNoteApiClient({ role: 'admin' });
  const supportClient = createAuraNoteApiClient({ role: 'support' });

  try {
    const [schedule, drafts, finalized, operations, supportStatus] = await Promise.all([
      clinicianClient.listSchedule(),
      clinicianClient.listDraftNotes(),
      clinicianClient.listFinalizedNotes(),
      adminClient.listOperationalTasks(),
      supportClient.getSupportStatus()
    ]);

    return (
      <main className="page-shell">
        <nav aria-label="AURA Note sections" className="section-nav">
          <a href="/aura-note/schedule">Schedule</a>
          <a href="/aura-note/drafts">Drafts</a>
          <a href="/aura-note/finalized">Finalized Notes</a>
          <a href="/aura-note/operations">Operations</a>
          <a href="/aura-note/platform">Platform</a>
          <a href="/aura-note/support/status">Support</a>
        </nav>

        <section className="hero-band" aria-labelledby="runtime-home-heading">
          <p className="eyebrow">WO-064 Primary UI Runtime API Conversion</p>
          <h1 id="runtime-home-heading">AURA Note Runtime Home</h1>
          <p>
            Primary workflow counts on this page come from typed API responses. This remains synthetic/local evidence and
            does not enable production PHI, live vendors, autonomous finalization, claim submission, or launch readiness.
          </p>
        </section>

        <section className="panel-grid" aria-label="Primary runtime route summary">
          <article className="panel-card" aria-labelledby="runtime-home-clinical-workflow">
            <h2 id="runtime-home-clinical-workflow">Clinical Workflow</h2>
            <dl className="metric-list">
              <div>
                <dt>Appointments</dt>
                <dd>{schedule.data.appointments.length}</dd>
              </div>
              <div>
                <dt>Draft Notes</dt>
                <dd>{drafts.data.notes.length}</dd>
              </div>
              <div>
                <dt>Finalized Notes</dt>
                <dd>{finalized.data.notes.length}</dd>
              </div>
              <div>
                <dt>Read Only</dt>
                <dd>{String(finalized.data.readOnly)}</dd>
              </div>
            </dl>
          </article>

          <article className="panel-card" aria-labelledby="runtime-home-operations">
            <h2 id="runtime-home-operations">Operations</h2>
            <dl className="metric-list">
              <div>
                <dt>Tasks</dt>
                <dd>{operations.data.counts.total}</dd>
              </div>
              <div>
                <dt>Blockers</dt>
                <dd>{operations.data.counts.blockers}</dd>
              </div>
              <div>
                <dt>Data Source</dt>
                <dd>typed_api_client</dd>
              </div>
            </dl>
          </article>

          <article className="panel-card" aria-labelledby="runtime-home-support-status">
            <h2 id="runtime-home-support-status">Support Status</h2>
            <dl className="metric-list">
              <div>
                <dt>Health</dt>
                <dd>{supportStatus.data.status.overallHealth}</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>{supportStatus.data.status.mode}</dd>
              </div>
              <div>
                <dt>Audit Export</dt>
                <dd>{supportStatus.data.status.auditExport.enabled ? 'enabled_synthetic' : 'disabled'}</dd>
              </div>
            </dl>
          </article>
        </section>
      </main>
    );
  } catch (error) {
    return (
      <main className="page-shell">
        <nav aria-label="AURA Note sections" className="section-nav">
          <a href="/aura-note/schedule">Schedule</a>
          <a href="/aura-note/drafts">Drafts</a>
          <a href="/aura-note/finalized">Finalized Notes</a>
        </nav>
        <section className="hero-band" aria-labelledby="runtime-home-heading">
          <p className="eyebrow">WO-064 Primary UI Runtime API Conversion</p>
          <h1 id="runtime-home-heading">AURA Note Runtime Home</h1>
          <p>API-backed runtime state is unavailable in this environment.</p>
        </section>
        <section className="panel-card" aria-label="Runtime home failed state">
          <h2>Failed State</h2>
          <p>{error instanceof Error ? error.message : 'Unknown API failure'}</p>
          <p>Production launch readiness cannot be claimed from this failed state.</p>
        </section>
      </main>
    );
  }
}
