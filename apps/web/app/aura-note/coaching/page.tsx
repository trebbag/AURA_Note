import { createAuraNoteApiClient } from '../../../lib/aura-note-api-client';

export const dynamic = 'force-dynamic';

export default async function CoachingPage() {
  const clinicianClient = createAuraNoteApiClient({ role: 'clinician' });
  const adminClient = createAuraNoteApiClient({ role: 'admin' });
  const billingClient = createAuraNoteApiClient({ role: 'billing_staff' });

  const [ownReportResult, dashboardResult, billingDeniedResult] = await Promise.allSettled([
    clinicianClient.getOwnCoaching(),
    adminClient.getCoachingDashboard('aggregate_only'),
    billingClient.getOwnCoaching()
  ]);

  const ownReport = ownReportResult.status === 'fulfilled' ? ownReportResult.value.data : null;
  const dashboard = dashboardResult.status === 'fulfilled' ? dashboardResult.value.data : null;
  const billingDenied =
    billingDeniedResult.status === 'rejected'
      ? billingDeniedResult.reason instanceof Error
        ? billingDeniedResult.reason.message
        : 'billing coaching access denied'
      : 'unexpectedly allowed';

  return (
    <main className="coaching-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Premium Coaching</p>
          <h1>Coaching and Analytics</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <a href="/aura-note">Runtime Home</a>
          <a href="/aura-note/schedule">Schedule</a>
          <a href="/aura-note/drafts">Draft Notes</a>
          <a href="/aura-note/finalized">Finalized Notes</a>
        </nav>
      </header>

      <section className="status-band">
        <p>Coaching is loaded from API-backed clinician/admin views and remains excluded from patient-facing outputs.</p>
        <dl>
          <div>
            <dt>Mode</dt>
            <dd>typed_api_client</dd>
          </div>
          <div>
            <dt>Default</dt>
            <dd>{dashboard?.privacyLabel ?? 'aggregate-only'}</dd>
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
              <dd>{ownReport?.overallScore ?? 'empty'}</dd>
            </div>
            <div>
              <dt>Privacy</dt>
              <dd>{ownReport?.privacyLabel ?? 'own only'}</dd>
            </div>
          </dl>
          <div className="coaching-signal-list">
            {(ownReport?.signals ?? []).map((signal) => (
              <section key={signal.coachingSignalId} className="coaching-signal">
                <div>
                  <strong>{signal.title}</strong>
                  <span>{signal.category}</span>
                </div>
                <strong>{signal.score}</strong>
                <p>{signal.detail}</p>
              </section>
            ))}
            {!ownReport?.signals.length ? <p className="empty-state">No own coaching report returned by the API.</p> : null}
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
              <dd>{dashboard?.providerCount ?? 0}</dd>
            </div>
            <div>
              <dt>Visibility</dt>
              <dd>{dashboard?.visibilityMode ?? 'aggregate-only'}</dd>
            </div>
          </dl>
          <div className="analytics-list">
            {Object.entries(dashboard?.categoryAverages ?? {}).map(([category, averageScore]) => (
              <div key={category}>
                <span>{category}</span>
                <strong>{averageScore}</strong>
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
            <small>{billingDenied}</small>
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
