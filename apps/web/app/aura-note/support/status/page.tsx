const featureFlags = [
  {
    key: 'External AI',
    state: 'disabled',
    detail: 'Mock-only AI gateway remains the safe degraded mode.'
  },
  {
    key: 'EHR writeback',
    state: 'metadata-only',
    detail: 'Copy, PDF, export, and queued status remain available without live EHR delivery.'
  },
  {
    key: 'ClinicOS sync',
    state: 'mock-boundary',
    detail: 'AURA Note permissions stay authoritative in standalone and mock integrated modes.'
  },
  {
    key: 'Audit export download',
    state: 'disabled',
    detail: 'Audit export is redacted JSONL metadata only until storage delivery is configured.'
  }
];

const retentionPolicies = [
  { label: 'Raw audio', rule: 'one week', job: 'raw_audio_retention_candidate_scan', eligible: 1 },
  { label: 'Transcript', rule: 'indefinite', job: 'transcript_retention_indefinite_scan', eligible: 0 },
  { label: 'Audit events', rule: 'tenant policy', job: 'audit_export_bundle_generation', eligible: 0 }
];

const failureStates = [
  { component: 'External AI', state: 'disabled', mode: 'Deterministic draft candidates only' },
  { component: 'EHR writeback', state: 'metadata-only', mode: 'Manual copy/PDF/export fallback' },
  { component: 'Structured logs', state: 'ready', mode: 'Request-correlated and redacted' },
  { component: 'Audit export', state: 'ready_synthetic', mode: 'Redacted JSONL metadata response' }
];

export default function SupportStatusPage() {
  return (
    <main className="support-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Support</p>
          <h1>Production Hardening Status</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <a href="/aura-note/schedule">Schedule</a>
          <a href="/aura-note/coaching">Coaching</a>
          <a href="/status">Foundation Status</a>
        </nav>
      </header>

      <section className="status-band">
        <p>CP-4 hardening is synthetic, local-first, and explicitly guarded from live PHI, AI, EHR, analytics, or storage side effects.</p>
        <dl>
          <div>
            <dt>Overall</dt>
            <dd>ok</dd>
          </div>
          <div>
            <dt>Checkpoint</dt>
            <dd>CP-4</dd>
          </div>
          <div>
            <dt>Logs</dt>
            <dd>redacted</dd>
          </div>
        </dl>
      </section>

      <section className="support-grid" aria-label="Feature flags and retention">
        <section className="support-panel">
          <h2>Feature Flags</h2>
          <div className="analytics-list">
            {featureFlags.map((flag) => (
              <div key={flag.key}>
                <span>{flag.key}</span>
                <strong>{flag.state}</strong>
                <small>{flag.detail}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="support-panel">
          <h2>Retention Jobs</h2>
          <div className="analytics-list">
            {retentionPolicies.map((policy) => (
              <div key={policy.label}>
                <span>{policy.label}</span>
                <strong>{policy.rule}</strong>
                <small>
                  {policy.job}; purge eligible: {policy.eligible}
                </small>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="support-grid" aria-label="Audit and failure states">
        <section className="support-panel">
          <h2>Audit Export</h2>
          <dl className="state-grid">
            <div>
              <dt>Format</dt>
              <dd>jsonl</dd>
            </div>
            <div>
              <dt>PHI</dt>
              <dd>excluded</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>metadata-only</dd>
            </div>
          </dl>
          <p>Compliance users can request a redacted synthetic bundle; downloadable production storage is feature-flag disabled.</p>
        </section>

        <section className="support-panel">
          <h2>Failure States</h2>
          <div className="analytics-list">
            {failureStates.map((item) => (
              <div key={item.component}>
                <span>{item.component}</span>
                <strong>{item.state}</strong>
                <small>{item.mode}</small>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
