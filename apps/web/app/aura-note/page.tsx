import { createAuraNoteApiClient } from '../../lib/aura-note-api-client';
import { AuraNoteAppShell } from './app-shell-client';

export const dynamic = 'force-dynamic';

export default async function AuraNoteRuntimeHomePage() {
  const clinicianClient = createAuraNoteApiClient({ role: 'clinician' });

  try {
    const response = await clinicianClient.getAppShell();
    return <AuraNoteAppShell appShell={response.data.appShell} />;
  } catch (error) {
    return (
      <main className="page-shell">
        <nav aria-label="AURA Note sections" className="section-nav">
          <a href="/aura-note/schedule">Schedule</a>
          <a href="/aura-note/drafts">Drafts</a>
          <a href="/aura-note/finalized">Finalized Notes</a>
          <a href="/aura-note/runtime-integration">Runtime Gate</a>
        </nav>
        <section className="hero-band" aria-labelledby="runtime-home-heading">
          <p className="eyebrow">Clinical Documentation Assistant</p>
          <h1 id="runtime-home-heading">AURA Note Dashboard</h1>
          <p>API-backed app-shell state is unavailable in this environment.</p>
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
