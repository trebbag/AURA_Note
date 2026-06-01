const requiredStates = [
  'loading',
  'empty',
  'ready',
  'saving',
  'blocked',
  'failed',
  'permission-denied',
  'read-only',
  'degraded',
  'disabled',
  'finalized',
  'demo fixture'
];

const roleViews = [
  'clinician',
  'MA',
  'billing staff',
  'admin',
  'authorized admin',
  'compliance/privacy lead',
  'support',
  'service account/integration'
];

const screenInventory = [
  {
    surface: 'Standalone home and navigation',
    route: '/aura-note',
    source: 'typed API summary from schedule, notes, operations, support, and disabled adapter status',
    actions: 'navigate only',
    states: 'loading, ready, failed, read-only'
  },
  {
    surface: 'Schedule Builder, patients, and chart context',
    route: '/aura-note/schedule',
    source: 'schedule, standalone patient shell, appointment, note shell, and chart freshness APIs',
    actions: 'create/edit appointment, check in, cancel, no-show, start visit',
    states: 'empty, loading, ready, saving, failed, permission-denied, read-only, demo fixture'
  },
  {
    surface: 'Draft Notes',
    route: '/aura-note/drafts',
    source: 'draft note summary API',
    actions: 'open workspace or finalization when gates allow',
    states: 'empty, loading, ready, failed, permission-denied, read-only, demo fixture'
  },
  {
    surface: 'Documentation Workspace panels',
    route: '/aura-note/workspace/[appointmentId]',
    source: 'workspace, timer, recording metadata, transcript, suggestions, selections, compliance, history gap, and task APIs',
    actions: 'visit controls, metadata chunk, mock transcription, selection accept/remove, history-gap blocker',
    states: 'loading, ready, saving, blocked, failed, permission-denied, read-only, degraded, demo fixture'
  },
  {
    surface: 'Finalization Wizard steps 1-6',
    route: '/aura-note/finalization/[noteId]',
    source: 'finalization, frozen selection, composition, billing attest, draft claim preview, sign/dispatch APIs',
    actions: 'human review, approve, attest, sign/dispatch synthetic workflow',
    states: 'loading, ready, saving, blocked, failed, permission-denied, read-only, finalized, demo fixture'
  },
  {
    surface: 'Finalized Notes and final note viewer',
    route: '/aura-note/finalized and /aura-note/finalized/[noteId]',
    source: 'finalized note, patient summary, transcript visibility, export, copy, download, writeback metadata APIs',
    actions: 'copy/download/export/writeback metadata only, never reopen editor',
    states: 'empty, loading, ready, saving, failed, permission-denied, read-only, finalized'
  },
  {
    surface: 'Task inbox, MA worklist, billing review, settings, templates, dot phrases, estimates, rules catalog',
    route: '/aura-note/operations',
    source: 'operations APIs for tasks, billing review, settings/admin, templates, estimates, and rules catalog',
    actions: 'task review, internal estimate configuration, rules catalog review, disabled claim-boundary review',
    states: 'empty, loading, ready, saving, blocked, failed, permission-denied, read-only, disabled, demo fixture'
  },
  {
    surface: 'Platform, EHR, ClinicOS, AI governance, coaching, support, and commercial readiness surfaces',
    route: '/aura-note/platform, /integrations/ehr, /integrations/clinicos, /ai-governance, /coaching, /support/status',
    source: 'typed APIs plus disabled live-vendor mocks and documented degraded adapter responses',
    actions: 'configuration review, writeback queue metadata, ClinicOS mapping review, AI governance evidence, support status',
    states: 'loading, ready, saving, failed, permission-denied, read-only, degraded, disabled, demo fixture'
  }
];

const workflowMap = [
  'appointment creation to one note shell',
  'Start Visit to timer-gated documentation',
  'recording exception to documentation without normal recording',
  'mock transcription to transcript correction metadata',
  'suggestions to Visit Selections to Compliance Review',
  'History Gap Review to MA blocker task',
  'Finalization Wizard code review to sign/dispatch',
  'final note and patient summary export metadata',
  'EHR writeback queue metadata with human approval',
  'ClinicOS integrated mode mapping without permission bypass'
];

export default function FigmaHandoffInventoryPage() {
  return (
    <main className="page-shell">
      <nav aria-label="AURA Note sections" className="section-nav">
        <a href="/aura-note">Home</a>
        <a href="/aura-note/schedule">Schedule</a>
        <a href="/aura-note/drafts">Drafts</a>
        <a href="/aura-note/finalized">Finalized Notes</a>
        <a href="/aura-note/operations">Operations</a>
        <a href="/aura-note/support/status">Support</a>
      </nav>

      <section className="hero-band" aria-labelledby="figma-handoff-heading">
        <p className="eyebrow">WO-065 Figma-Ready Basic UI Scaffold</p>
        <h1 id="figma-handoff-heading">Figma Handoff Inventory</h1>
        <p>
          This read-only scaffold inventories the screens, states, roles, data sources, actions, and safety copy that
          Figma must cover. It is metadata-only and does not enable live PHI, live vendors, autonomous finalization,
          claim submission, or production launch behavior.
          The design handoff posture is no live PHI, no production credentials, and no live-vendor execution.
        </p>
      </section>

      <section className="support-grid" aria-label="Figma handoff status">
        <article className="support-panel">
          <h2>Required Route States</h2>
          <div className="analytics-list">
            {requiredStates.map((state) => (
              <div key={state}>
                <strong>{state}</strong>
                <small>Documented for production-intended routes, API responses, or explicit disabled/demo mocks.</small>
              </div>
            ))}
          </div>
        </article>

        <article className="support-panel">
          <h2>Role Views</h2>
          <div className="analytics-list">
            {roleViews.map((role) => (
              <div key={role}>
                <strong>{role}</strong>
                <small>Requires permission-denied and read-only handoff states where sensitive data is restricted.</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="figma-screen-grid" aria-label="Screen inventory">
        {screenInventory.map((screen) => (
          <article className="support-panel" key={screen.surface}>
            <h2>{screen.surface}</h2>
            <dl className="figma-detail-list">
              <div>
                <dt>Route</dt>
                <dd>{screen.route}</dd>
              </div>
              <div>
                <dt>Data/API Source</dt>
                <dd>{screen.source}</dd>
              </div>
              <div>
                <dt>Actions</dt>
                <dd>{screen.actions}</dd>
              </div>
              <div>
                <dt>States</dt>
                <dd>{screen.states}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      <section className="support-panel" aria-label="Workflow map">
        <h2>Workflow Map</h2>
        <ol className="figma-workflow-list">
          {workflowMap.map((workflow) => (
            <li key={workflow}>{workflow}</li>
          ))}
        </ol>
      </section>

      <section className="support-panel" aria-label="Safety and mode boundaries">
        <h2>Safety And Mode Boundaries</h2>
        <p>
          Standalone mode owns the local workflow. ClinicOS-integrated mode stays adapter-bound and must not bypass AURA
          Note tenant, site, purpose-of-use, RBAC, ABAC, transcript, final note, billing, coaching, support, or audit
          permissions.
        </p>
        <p>
          AI suggestions remain draft-only, candidate-oriented, and human-review-required. Patient-facing views must not
          expose internal billing, revenue, coaching, confidence, audit, support, disabled live-vendor, or claim-boundary
          details.
        </p>
      </section>
    </main>
  );
}
