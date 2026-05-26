const ownSignals = [
  {
    category: 'Documentation completeness',
    score: 86,
    title: 'Problem-specific assessment linked to plan',
    detail: 'Assessment and plan stay paired by problem in the synthetic signed note.'
  },
  {
    category: 'E/M justification',
    score: 74,
    title: 'E/M support needs concise risk detail',
    detail: 'Selected E/M support would be stronger with one MDM risk sentence.'
  }
];

const aggregateRows = [
  { metric: 'Documentation completeness', average: 84 },
  { metric: 'Patient voice fidelity', average: 90 },
  { metric: 'Communication clarity', average: 86 },
  { metric: 'Clinical reasoning', average: 82 },
  { metric: 'History-taking depth', average: 80 },
  { metric: 'E/M justification', average: 76 }
];

export default function CoachingPage() {
  return (
    <main className="coaching-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Premium Coaching</p>
          <h1>Coaching and Analytics</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <a href="/aura-note/schedule">Schedule</a>
          <a href="/aura-note/drafts">Draft Notes</a>
          <a href="/aura-note/finalized">Finalized Notes</a>
        </nav>
      </header>

      <section className="status-band">
        <p>Coaching is clinician-owned, admin-governed, and excluded from patient-facing outputs.</p>
        <dl>
          <div>
            <dt>Mode</dt>
            <dd>synthetic</dd>
          </div>
          <div>
            <dt>Default</dt>
            <dd>aggregate-only</dd>
          </div>
          <div>
            <dt>Patient View</dt>
            <dd>excluded</dd>
          </div>
        </dl>
      </section>

      <section className="coaching-grid" aria-label="Coaching views">
        <article className="coaching-panel">
          <div>
            <p className="eyebrow">Treating Clinician</p>
            <h2>Own Coaching Report</h2>
          </div>
          <dl className="state-grid">
            <div>
              <dt>Overall</dt>
              <dd>80</dd>
            </div>
            <div>
              <dt>Privacy</dt>
              <dd>own only</dd>
            </div>
          </dl>
          <div className="coaching-signal-list">
            {ownSignals.map((signal) => (
              <section key={signal.title} className="coaching-signal">
                <div>
                  <strong>{signal.title}</strong>
                  <span>{signal.category}</span>
                </div>
                <strong>{signal.score}</strong>
                <p>{signal.detail}</p>
              </section>
            ))}
          </div>
        </article>

        <article className="coaching-panel">
          <div>
            <p className="eyebrow">Authorized Admin</p>
            <h2>Premium Longitudinal Dashboard</h2>
          </div>
          <dl className="state-grid">
            <div>
              <dt>Providers</dt>
              <dd>2</dd>
            </div>
            <div>
              <dt>Visibility</dt>
              <dd>aggregate-only</dd>
            </div>
          </dl>
          <div className="analytics-list">
            {aggregateRows.map((row) => (
              <div key={row.metric}>
                <span>{row.metric}</span>
                <strong>{row.average}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="coaching-panel" aria-label="Permission states">
        <h2>Permission States</h2>
        <div className="analytics-list">
          <div>
            <span>Billing staff</span>
            <strong>coaching denied</strong>
          </div>
          <div>
            <span>Patients</span>
            <strong>never shown</strong>
          </div>
          <div>
            <span>Recording exception</span>
            <strong>transcript metrics unavailable</strong>
          </div>
        </div>
      </section>
    </main>
  );
}
