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
    state: 'permission-gated',
    detail: 'Server-mediated signed downloads are token, tenant, role, and expiration checked; public URLs remain disabled.'
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
  { component: 'Audit export', state: 'ready_synthetic', mode: 'Redacted JSONL plus secure download evidence' },
  { component: 'Storage download', state: 'denied states covered', mode: 'expired, wrong tenant, wrong role, missing object' }
];

const storageDownloadStates = [
  { label: 'Download unavailable', state: 'storage-disabled', mode: 'Inline synthetic metadata only' },
  { label: 'Ready', state: 'token issued', mode: '15 minute server-mediated token' },
  { label: 'Expired', state: 'denied', mode: 'Token expiry prevents delivery' },
  { label: 'Wrong role', state: 'denied', mode: 'Billing/support cannot bypass artifact permissions' },
  { label: 'Missing object', state: 'failed', mode: 'No payload returned; audit-safe denial only' }
];

const restoreStates = [
  { label: 'Raw audio deletion', state: 'approval required', mode: 'Feature flag, approval, and recovery window required' },
  { label: 'Recovery window', state: 'recoverable', mode: 'Soft-delete/versioning evidence required before deletion' },
  { label: 'Transcript retention', state: 'indefinite', mode: 'Transcript purge count remains zero' },
  { label: 'Restore readiness', state: 'blocked until review', mode: 'Restore execution disabled; metadata check only' }
];

const observabilitySinks = [
  { label: 'Structured logs', state: 'ready local', mode: 'console, redacted, request-correlated' },
  { label: 'Metrics', state: 'ready local', mode: 'in-memory latency and queue probes' },
  { label: 'Traces', state: 'ready local', mode: 'in-memory span probes with redacted attributes' },
  { label: 'Production SIEM', state: 'disabled', mode: 'vendor and credentials not configured' },
  { label: 'Production APM', state: 'disabled', mode: 'vendor and credentials not configured' }
];

const deploymentEnvironments = [
  { label: 'Local', state: 'ready local', mode: 'synthetic data only' },
  { label: 'Preview', state: 'configuration required', mode: 'database and session secrets required' },
  { label: 'Staging', state: 'configuration required', mode: 'storage and observability exporters required' },
  { label: 'Production', state: 'blocked until review', mode: 'security approval and sink selection required' }
];

const runbooks = [
  { label: 'Deploy and rollback', state: 'documented', mode: 'environment matrix and release rollback steps' },
  { label: 'Incident triage', state: 'documented', mode: 'severity, containment, and evidence capture' },
  { label: 'Audit and retention', state: 'documented', mode: 'metadata export and non-destructive review' },
  { label: 'Disabled integrations', state: 'documented', mode: 'AI, EHR, ClinicOS, analytics, and download checks' }
];

const operationalEvidence = [
  { label: 'Readiness check', state: 'ready_synthetic', mode: 'P8 local evidence; productionLaunchReady=false' },
  { label: 'Incident runbook viewed', state: 'recorded_synthetic', mode: 'audit-safe runbook view evidence' },
  { label: 'Degraded mode acknowledged', state: 'recorded_synthetic', mode: 'safe fallback acknowledged without PHI' },
  { label: 'Access review evidence', state: 'recorded_synthetic', mode: 'metadata-only review evidence' }
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
        <p>P8 platform hardening is synthetic, local-first, and explicitly guarded from live PHI, AI, EHR, analytics, observability, or storage side effects.</p>
        <dl>
          <div>
            <dt>Overall</dt>
            <dd>ok</dd>
          </div>
          <div>
            <dt>Checkpoint</dt>
            <dd>P8</dd>
          </div>
          <div>
            <dt>Logs</dt>
            <dd>redacted</dd>
          </div>
        </dl>
      </section>

      <section className="support-grid" aria-label="Observability and deployment">
        <section className="support-panel">
          <h2>Observability Sinks</h2>
          <div className="analytics-list">
            {observabilitySinks.map((sink) => (
              <div key={sink.label}>
                <span>{sink.label}</span>
                <strong>{sink.state}</strong>
                <small>{sink.mode}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="support-panel">
          <h2>Deployment Matrix</h2>
          <div className="analytics-list">
            {deploymentEnvironments.map((environment) => (
              <div key={environment.label}>
                <span>{environment.label}</span>
                <strong>{environment.state}</strong>
                <small>{environment.mode}</small>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="support-grid" aria-label="Operational runbooks">
        <section className="support-panel">
          <h2>Runbook Coverage</h2>
          <div className="analytics-list">
            {runbooks.map((runbook) => (
              <div key={runbook.label}>
                <span>{runbook.label}</span>
                <strong>{runbook.state}</strong>
                <small>{runbook.mode}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="support-panel">
          <h2>Production Boundary</h2>
          <dl className="state-grid">
            <div>
              <dt>Live PHI</dt>
              <dd>not allowed</dd>
            </div>
            <div>
              <dt>Vendor sinks</dt>
              <dd>not configured</dd>
            </div>
            <div>
              <dt>Retention purge</dt>
              <dd>disabled</dd>
            </div>
          </dl>
          <p>Production deployment remains blocked until security, privacy, secret management, and observability vendor decisions are reviewed.</p>
        </section>
      </section>

      <section className="support-grid" aria-label="Operational evidence states">
        <section className="support-panel">
          <h2>Operational Evidence</h2>
          <div className="analytics-list">
            {operationalEvidence.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.state}</strong>
                <small>{item.mode}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="support-panel">
          <h2>Support Access</h2>
          <dl className="state-grid">
            <div>
              <dt>Support users</dt>
              <dd>metadata only</dd>
            </div>
            <div>
              <dt>Audit export</dt>
              <dd>privacy lead only</dd>
            </div>
            <div>
              <dt>Production launch</dt>
              <dd>false</dd>
            </div>
          </dl>
          <p>Support operations can record audit-safe evidence, but cannot access transcripts, final notes, billing detail, coaching outputs, or PHI-bearing payloads.</p>
        </section>
      </section>

      <section className="support-grid" aria-label="Secure storage and restore states">
        <section className="support-panel">
          <h2>Secure Downloads</h2>
          <div className="analytics-list">
            {storageDownloadStates.map((state) => (
              <div key={state.label}>
                <span>{state.label}</span>
                <strong>{state.state}</strong>
                <small>{state.mode}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="support-panel">
          <h2>Retention and Restore</h2>
          <div className="analytics-list">
            {restoreStates.map((state) => (
              <div key={state.label}>
                <span>{state.label}</span>
                <strong>{state.state}</strong>
                <small>{state.mode}</small>
              </div>
            ))}
          </div>
        </section>
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
              <dd>server-mediated</dd>
            </div>
          </dl>
          <p>Compliance users can request a redacted synthetic bundle; downloadable delivery remains short-lived, permission checked, and never public.</p>
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
