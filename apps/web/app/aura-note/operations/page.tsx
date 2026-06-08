'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  BillingReviewQueueViewDto,
  EstimateConfigurationDto,
  OperationsRuntimeViewDto,
  RulesCatalogViewDto,
  SettingsAdminViewDto,
  TaskWorklistViewDto,
  TemplatesViewDto
} from '@aura-note/contracts';
import { createAuraNoteApiClient } from '../../../lib/aura-note-api-client';

const states = ['empty', 'loading', 'ready', 'saving', 'blocked', 'failed', 'permission-denied', 'read-only', 'demo fixture'];
const tabs = ['Task Inbox', 'MA Follow-Up', 'Billing Review', 'Settings', 'Templates', 'Estimates', 'Rules Catalog'] as const;
const analyticsTabs = ['Billing & Coding', 'Health Outcomes', 'Note Quality', 'Staff Performance'] as const;
const settingsTabs = ['Suggestion Governance', 'Clinical Rules', 'Templates', 'Interface', 'Advanced Controls'] as const;

type Tab = (typeof tabs)[number];
type RouteState = (typeof states)[number];

export default function StandaloneOperationsPage() {
  const adminClient = useMemo(() => createAuraNoteApiClient({ role: 'admin' }), []);
  const maClient = useMemo(() => createAuraNoteApiClient({ role: 'ma' }), []);
  const billingClient = useMemo(() => createAuraNoteApiClient({ role: 'billing_staff' }), []);
  const supportClient = useMemo(() => createAuraNoteApiClient({ role: 'support', userId: 'user-support-operations-denial' }), []);
  const [activeTab, setActiveTab] = useState<Tab>('Task Inbox');
  const [routeState, setRouteState] = useState<RouteState>('loading');
  const [tasks, setTasks] = useState<TaskWorklistViewDto | null>(null);
  const [billing, setBilling] = useState<BillingReviewQueueViewDto | null>(null);
  const [settings, setSettings] = useState<SettingsAdminViewDto | null>(null);
  const [templates, setTemplates] = useState<TemplatesViewDto | null>(null);
  const [estimate, setEstimate] = useState<EstimateConfigurationDto | null>(null);
  const [rules, setRules] = useState<RulesCatalogViewDto | null>(null);
  const [operationsRuntime, setOperationsRuntime] = useState<OperationsRuntimeViewDto | null>(null);
  const [statusMessage, setStatusMessage] = useState('Loading operations from typed API responses.');

  const refreshOperations = useCallback(async () => {
    setRouteState('loading');
    try {
      const [runtimeResponse, taskResponse, billingResponse, settingsResponse, templatesResponse, estimateResponse, rulesResponse] = await Promise.all([
        adminClient.getOperationsRuntime(),
        adminClient.listOperationalTasks(),
        adminClient.listBillingReviews(),
        adminClient.getSettings(),
        adminClient.listTemplates(),
        adminClient.getEstimateConfig(),
        adminClient.listRulesCatalog()
      ]);
      setOperationsRuntime(runtimeResponse.data.operationsRuntime);
      setTasks(taskResponse.data);
      setBilling(billingResponse.data);
      setSettings(settingsResponse.data);
      setTemplates(templatesResponse.data);
      setEstimate(estimateResponse.data);
      setRules(rulesResponse.data);
      setRouteState(taskResponse.data.counts.total === 0 ? 'empty' : 'ready');
      setStatusMessage('Standalone operations state loaded through AURA Note API endpoints.');
    } catch (error) {
      setRouteState('failed');
      setStatusMessage(error instanceof Error ? error.message : 'Operations API load failed.');
    }
  }, [adminClient]);

  useEffect(() => {
    void refreshOperations();
  }, [refreshOperations]);

  async function runAction(label: string, action: () => Promise<unknown>) {
    setRouteState('saving');
    try {
      await action();
      await refreshOperations();
      setStatusMessage(label);
    } catch (error) {
      setRouteState('failed');
      setStatusMessage(error instanceof Error ? error.message : label);
    }
  }

  function assignTask() {
    const task = tasks?.tasks.find((candidate) => candidate.ownerRole === 'clinician') ?? tasks?.tasks[0];
    if (!task) return;
    void runAction('Task updated through API as an assigned non-blocker.', () =>
      adminClient.updateOperationalTask(task.taskId, { adjudicationStatus: 'assigned', blocksSigning: false })
    );
  }

  function markMaAnswered() {
    const task = tasks?.tasks.find((candidate) => candidate.ownerRole === 'ma');
    if (!task) return;
    void runAction('MA follow-up task answered through API.', () =>
      maClient.updateOperationalTask(task.taskId, { adjudicationStatus: 'answered', blocksSigning: false })
    );
  }

  function triggerBillingReview() {
    const item = billing?.items[0];
    if (!item) return;
    void runAction('Billing review updated through API; transcript access remains trigger and role scoped.', () =>
      billingClient.updateBillingReview(item.billingReviewId, { status: 'in_review', requestTranscriptAccess: true })
    );
  }

  function setMockReady() {
    const integration = settings?.integrations[0];
    if (!integration) return;
    void runAction('Integration mock-ready state recorded through API.', () =>
      adminClient.updateIntegration(integration.integrationId, {
        status: 'mock_ready',
        reason: 'WO-064 API-backed operations route mock-ready evidence'
      })
    );
  }

  function createDraftTemplate() {
    void runAction('Draft synthetic template created through API.', () =>
      adminClient.createTemplate({
        name: `WO-064 Draft Template ${Date.now()}`,
        visitType: 'Chronic follow-up',
        sections: ['Subjective', 'Assessment', 'Plan'],
        variables: ['{{follow_up_interval}}']
      })
    );
  }

  function acknowledgeEstimateCaveat() {
    if (!estimate) return;
    void runAction('Estimate caveat update recorded through API; patient-facing estimates remain disabled.', () =>
      adminClient.updateEstimateConfig({
        internalEstimatesEnabled: true,
        patientFacingEstimatesEnabled: false,
        caveatText: estimate.caveatText
      })
    );
  }

  function publishRules() {
    const ruleIds = rules?.entries.map((entry) => entry.ruleId) ?? [];
    if (ruleIds.length === 0) return;
    void runAction('Rules catalog published through API with human-review attestation.', () =>
      adminClient.publishRulesCatalog({
        ruleIds,
        attestation: 'Human review required before any coding, billing, or medical necessity use.'
      })
    );
  }

  async function verifyPermissionDeniedState() {
    setRouteState('loading');
    try {
      await supportClient.listBillingReviews();
      setRouteState('failed');
      setStatusMessage('Unexpected support billing-review access succeeded.');
    } catch (error) {
      setRouteState('permission-denied');
      setStatusMessage(error instanceof Error ? error.message : 'Support billing-review access denied by API.');
    }
  }

  const statusSummary = [
    ['Worklist', `${tasks?.counts.total ?? 0} tasks / ${tasks?.counts.blockers ?? 0} blockers`],
    ['Billing transcript', billing?.items[0]?.transcriptAccessReason ?? 'not loaded'],
    ['Integration', settings?.integrations.map((integration) => `${integration.vendor}:${integration.status}`).join(', ') ?? 'not loaded'],
    ['Estimate', estimate?.patientFacingEstimatesEnabled ? 'unsafe enabled' : 'patient-facing disabled'],
    ['Rules', rules?.entries.map((entry) => `${entry.codeOrKey}:${entry.status}`).join(', ') ?? 'not loaded']
  ];
  const settingsFeatureFlags = operationsRuntime?.settingsSummary.featureFlags ?? [];
  const primaryAnalyticsSeries = operationsRuntime?.analytics.series[0];

  return (
    <main className="operations-shell aura-operations">
      <header className="operations-product-header">
        <div>
          <p className="eyebrow">AURA Note</p>
          <h1>Analytics Dashboard</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <Link href="/aura-note">Dashboard</Link>
          <Link href="/aura-note/schedule">Schedule</Link>
          <Link href="/aura-note/drafts">Draft Notes</Link>
          <Link href="/aura-note/finalized">Finalized Notes</Link>
          <Link href="/aura-note/support/status">Support</Link>
        </nav>
      </header>

      <section className="status-band" aria-label="Standalone operations readiness">
        <div>
          <h2>Standalone Daily Operations</h2>
          <p>{statusMessage}</p>
        </div>
        <dl>
          <div>
            <dt>Route State</dt>
            <dd>{routeState}</dd>
          </div>
          <div>
            <dt>Mode</dt>
            <dd>standalone</dd>
          </div>
          <div>
            <dt>PHI</dt>
            <dd>synthetic only</dd>
          </div>
          <div>
            <dt>Claims</dt>
            <dd>Claim submission remains disabled.</dd>
          </div>
        </dl>
      </section>

      <section className="panel-grid" aria-label="Operations runtime">
        <article className="panel-card" aria-label="Operations analytics snapshot">
          <h2>Operations Analytics</h2>
          <p>{operationsRuntime?.analytics.caveat ?? 'Loading backend-composed operations analytics.'}</p>
          <div className="analytics-list">
            {operationsRuntime?.analytics.metrics.map((metric) => (
              <span key={metric.metricId}>
                {metric.label}: {metric.value}
              </span>
            ))}
          </div>
          <small>productionAnalyticsVendorEnabled={String(operationsRuntime?.analytics.productionAnalyticsVendorEnabled ?? false)}</small>
        </article>

        <article className="panel-card" aria-label="Operations activity feed">
          <h2>Activity Feed</h2>
          <ul className="stack-list">
            {operationsRuntime?.activity.map((item) => (
              <li key={item.activityId}>
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
                <small>{item.actorLabel}</small>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel-card" aria-label="Operations notification feed">
          <h2>Notifications</h2>
          <ul className="stack-list">
            {operationsRuntime?.notifications.map((notification) => (
              <li key={notification.notificationId}>
                <strong>{notification.title}</strong>
                <span>{notification.body}</span>
                <small>{notification.severity}</small>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel-card" aria-label="Settings runtime summary">
          <h2>Settings Runtime</h2>
          <dl className="metric-list">
            <div>
              <dt>Masked secrets</dt>
              <dd>{String(operationsRuntime?.settingsSummary.maskedSecretsOnly ?? true)}</dd>
            </div>
            <div>
              <dt>Secret values returned</dt>
              <dd>{String(operationsRuntime?.settingsSummary.secretValuesReturned ?? false)}</dd>
            </div>
            <div>
              <dt>AI preference governance</dt>
              <dd>{operationsRuntime?.settingsSummary.aiPreferencesGovernedBy ?? 'ai_gateway_policy'}</dd>
            </div>
            <div>
              <dt>Claim submission</dt>
              <dd>{String(operationsRuntime?.settingsSummary.claimSubmissionEnabled ?? false)}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="figma-analytics-polish" aria-label="Analytics and settings">
        <article aria-label="Figma operations source reference">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Figma Make Source</p>
              <h2>Design 1 Operations Mapping</h2>
              <p>
                Analytics, activity, notifications, and settings surfaces follow the supplied Make source while staying
                backend-backed through the operations runtime DTO.
              </p>
            </div>
            <strong>prototypeImport=false</strong>
          </div>
          <div className="figma-status-row">
            <span>typedApiClient=true</span>
            <span>secretValuesReturned={String(operationsRuntime?.settingsSummary.secretValuesReturned ?? false)}</span>
            <span>productionAnalyticsVendorEnabled={String(operationsRuntime?.analytics.productionAnalyticsVendorEnabled ?? false)}</span>
            <span>submittedClaim={String(operationsRuntime?.submittedClaim ?? false)}</span>
          </div>
        </article>

        <article aria-label="Analytics dashboard tabs">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Analytics</p>
              <h2>Analytics Command Center</h2>
              <p>Operational metrics, coding-support review posture, quality signals, and staff workflow trends.</p>
            </div>
            <strong>{operationsRuntime?.analytics.dataSource ?? 'standalone_operations_api_composite'}</strong>
          </div>
          <div className="figma-source-analytics-grid" aria-label="Figma analytics chart layout">
            <section aria-label="Daily internal estimate trend">
              <h3>Daily Internal Estimate Trend</h3>
              <p>Current vs caveated local baseline</p>
              <svg viewBox="0 0 520 240" role="img" aria-label="Internal estimate trend chart">
                <line x1="30" y1="210" x2="500" y2="210" />
                <line x1="30" y1="30" x2="30" y2="210" />
                <polyline points="30,168 108,146 186,118 264,135 342,86 420,166 500,190" />
                <polyline className="muted" points="30,180 108,160 186,146 264,135 342,124 420,176 500,198" />
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, index) => (
                  <text key={label} x={30 + index * 78} y="228">
                    {label}
                  </text>
                ))}
              </svg>
            </section>
            <section aria-label="CPT code distribution">
              <h3>CPT Code Distribution</h3>
              <p>Most frequently reviewed candidates</p>
              <div className="figma-source-donut" aria-hidden="true" />
            </section>
            <section aria-label="Claims denial analysis">
              <h3>Claims Denial Analysis</h3>
              <p>Draft preview review signals only; submittedClaim=false</p>
              <div className="figma-source-bars" aria-hidden="true">
                <span style={{ height: '38%' }} />
                <span style={{ height: '54%' }} />
                <span style={{ height: '42%' }} />
                <span style={{ height: '68%' }} />
                <span style={{ height: '72%' }} />
                <span style={{ height: '30%' }} />
              </div>
            </section>
          </div>
          <div className="figma-dashboard-filters" aria-label="Analytics dashboard filters">
            <span>Date range: last 30 days</span>
            <span>Clinician: all authorized users</span>
            <span>Internal metrics only</span>
            <button type="button" disabled>
              Export PDF disabled
            </button>
          </div>
          <div className="figma-tab-strip" role="tablist" aria-label="Analytics tabs">
            {analyticsTabs.map((tab, index) => (
              <button key={tab} type="button" role="tab" aria-selected={index === 0} className={index === 0 ? 'selected-tab' : 'secondary-button'}>
                {tab}
              </button>
            ))}
          </div>
          <div className="figma-kpi-grid" aria-label="API-backed analytics metric cards">
            {operationsRuntime?.analytics.metrics.map((metric, index) => (
              <div key={metric.metricId} data-state={metric.state}>
                <span className={`figma-kpi-icon tone-${index % 4}`} aria-hidden="true">
                  {metric.label.slice(0, 1)}
                </span>
                <strong>{metric.label}</strong>
                <b>{metric.value}</b>
                <small>
                  {metric.unit ?? 'status'} / patientFacingExcluded={String(metric.patientFacingExcluded)}
                </small>
              </div>
            ))}
            {!operationsRuntime ? <p>Loading analytics metric cards from the operations runtime API.</p> : null}
          </div>
          <div className="figma-chart-stage" aria-label="API-backed analytics chart stage">
            <div>
              <strong>{primaryAnalyticsSeries?.label ?? 'Worklist composition'}</strong>
              <small>CSS-rendered chart; no production analytics vendor enabled.</small>
            </div>
            <div className="figma-line-chart" aria-hidden="true">
              {(primaryAnalyticsSeries?.points ?? []).map((point, index) => {
                const numericValue = typeof point.value === 'number' ? point.value : 0;
                return <i key={`${point.label}-${index}`} style={{ height: `${Math.max(12, numericValue * 22)}px` }} />;
              })}
            </div>
            <ul>
              {(primaryAnalyticsSeries?.points ?? []).map((point) => (
                <li key={point.label}>
                  <span>{point.label}</span>
                  <strong>{point.value}</strong>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article aria-label="Settings dashboard tabs">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Settings</p>
              <h2>Settings Governance Center</h2>
              <p>Governed suggestion settings, clinical rules, templates, interface controls, and advanced configuration.</p>
            </div>
            <strong>maskedSecretsOnly={String(operationsRuntime?.settingsSummary.maskedSecretsOnly ?? true)}</strong>
          </div>
          <div className="figma-tab-strip" role="tablist" aria-label="Settings tabs">
            {settingsTabs.map((tab, index) => (
              <button key={tab} type="button" role="tab" aria-selected={index === 0} className={index === 0 ? 'selected-tab' : 'secondary-button'}>
                {tab}
              </button>
            ))}
          </div>
          <div className="figma-settings-matrix" aria-label="API-backed settings controls">
            <div>
              <strong>Suggestion Governance</strong>
              <span>{operationsRuntime?.settingsSummary.aiPreferencesGovernedBy ?? 'ai_gateway_policy'}</span>
              <small>Direct browser AI remains disabled.</small>
            </div>
            <div>
              <strong>Clinical Rules</strong>
              <span>{rules?.entries.length ?? 0} source-linked rules</span>
              <small>Autonomous finalization: false</small>
            </div>
            <div>
              <strong>Templates</strong>
              <span>{templates?.templates.length ?? 0} templates / {templates?.dotPhrases.length ?? 0} dot phrases</span>
              <small>Variables stay placeholder-only.</small>
            </div>
            <div>
              <strong>Interface</strong>
              <span>routeState={operationsRuntime?.routeState ?? routeState}</span>
              <small>Transient tabs only; backend state remains authoritative.</small>
            </div>
            <div>
              <strong>Advanced Controls</strong>
              <span>secretValuesReturned={String(operationsRuntime?.settingsSummary.secretValuesReturned ?? false)}</span>
              <small>Live credentials are never returned to the browser.</small>
            </div>
            <div>
              <strong>Feature Flags</strong>
              <span>{settingsFeatureFlags.length} governed flags</span>
              <small>{settingsFeatureFlags.map((flag) => `${flag.key}:${flag.runtimeEffect}`).join(', ') || 'loading'}</small>
            </div>
          </div>
        </article>
      </section>

      <section className="figma-ops-board" aria-label="Backend-backed operations analytics series">
        <article aria-label="Analytics series backed by API">
          <div className="section-title-row">
            <div>
              <h2>Analytics Series</h2>
              <p>Usage, billing review, settings, rules, and templates are composed by the operations API.</p>
            </div>
            <strong>
              {operationsRuntime?.analytics.dataSource ?? 'standalone_operations_api_composite'} / localReactState=
              {operationsRuntime?.localReactStateLimit ?? 'transient_tabs_and_form_inputs_only'}
            </strong>
          </div>
          <div className="figma-series-grid">
            {operationsRuntime?.analytics.series.map((series) => (
              <div key={series.seriesId} className="figma-series-card">
                <div>
                  <strong>{series.label}</strong>
                  <small>
                    {series.source} / {series.kind} / internalOnly={String(series.internalOnly)}
                  </small>
                </div>
                <div className="figma-bar-list">
                  {series.points.map((point) => {
                    const numericValue = typeof point.value === 'number' ? point.value : 0;
                    const width = `${Math.max(6, Math.min(100, numericValue * 12))}%`;
                    return (
                      <span key={point.label}>
                        <small>{point.label}</small>
                        <i style={{ width }} />
                        <strong>{point.value}</strong>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
            {!operationsRuntime ? <p>Loading API-backed analytics series.</p> : null}
          </div>
        </article>

        <article aria-label="Settings affordances backed by API">
          <div className="section-title-row">
            <div>
              <h2>Settings And Governance Runtime</h2>
              <p>Settings controls map to governed flags, masked secrets, templates, and rules.</p>
            </div>
            <strong>secretValuesReturned={String(operationsRuntime?.settingsSummary.secretValuesReturned ?? false)}</strong>
          </div>
          <div className="figma-settings-grid">
            <div>
              <strong>AI Suggestions</strong>
              <span>{operationsRuntime?.settingsSummary.aiPreferencesGovernedBy ?? 'ai_gateway_policy'}</span>
            </div>
            <div>
              <strong>Templates</strong>
              <span>{templates?.templates.length ?? 0} templates / {templates?.dotPhrases.length ?? 0} dot phrases</span>
            </div>
            <div>
              <strong>Clinical Rules</strong>
              <span>{rules?.entries.length ?? 0} entries / certifiedProductionRules={String(rules?.certifiedProductionRules ?? false)}</span>
            </div>
            <div>
              <strong>Advanced Config</strong>
              <span>maskedSecretsOnly={String(operationsRuntime?.settingsSummary.maskedSecretsOnly ?? true)}</span>
            </div>
            <div>
              <strong>Integrations</strong>
              <span>
                {operationsRuntime?.settingsSummary.integrations.map((integration) => `${integration.vendor}:${integration.routeState}`).join(', ') ??
                  'loading'}
              </span>
            </div>
            <div>
              <strong>Revenue Controls</strong>
              <span>
                patientFacingRevenueEnabled={String(operationsRuntime?.settingsSummary.patientFacingRevenueEnabled ?? false)} /
                submittedClaim={String(operationsRuntime?.submittedClaim ?? false)}
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="operations-tabs" aria-label="Operations sections">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'selected-tab' : 'secondary-button'}
            aria-pressed={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </section>

      <section className="builder-grid" aria-label="Operational work areas">
        <div className="appointment-form">
          <h2>State Coverage</h2>
          <section className="state-grid" aria-label="Screen states">
            {states.map((state) => (
              <span key={state} className="state-pill">
                {state}
              </span>
            ))}
          </section>
          <button type="button" className="secondary-action" onClick={() => void verifyPermissionDeniedState()}>
            Verify Permission Denied
          </button>
        </div>

        <div className="schedule-list" aria-live="polite">
          {activeTab === 'Task Inbox' && (
            <article className="appointment-row" aria-label="Task inbox">
              <div className="appointment-main">
                <strong>Task Inbox</strong>
                <small>Clinician linked tasks, blocker visibility, due metadata, note and safe patient linkage.</small>
                <span>{tasks?.tasks[0]?.adjudicationStatus ?? 'empty'}</span>
              </div>
              <div className="state-grid">
                <span>Total: {tasks?.counts.total ?? 0}</span>
                <span>Blockers: {tasks?.counts.blockers ?? 0}</span>
                {tasks?.counts.blockers ? <span>open blocker</span> : <span>no open blocker</span>}
              </div>
              <div className="action-row">
                <button type="button" onClick={assignTask}>
                  Assign
                </button>
              </div>
            </article>
          )}

          {activeTab === 'MA Follow-Up' && (
            <article className="appointment-row" aria-label="MA follow-up worklist">
              <div className="appointment-main">
                <strong>MA Follow-Up</strong>
                <small>History Gap task can block signing until answered, closed, or assigned.</small>
                <span>{tasks?.tasks.find((task) => task.ownerRole === 'ma')?.adjudicationStatus ?? 'empty'}</span>
              </div>
              <div className="state-grid">
                <span>MA follow-up: {tasks?.counts.maFollowUp ?? 0}</span>
                <span>Source: history_gap</span>
                {tasks?.tasks.find((task) => task.ownerRole === 'ma' && task.adjudicationStatus === 'answered' && !task.blocksSigning) ? (
                  <span>answered non-blocker</span>
                ) : null}
              </div>
              <div className="action-row">
                <button type="button" onClick={markMaAnswered}>
                  Mark Answered
                </button>
              </div>
            </article>
          )}

          {activeTab === 'Billing Review' && (
            <article className="appointment-row" aria-label="Billing review queue">
              <div className="appointment-main">
                <strong>Billing Review Queue</strong>
                <small>Draft claim preview remains human-review-required with submittedClaim=false.</small>
                <span>{billing?.items[0]?.transcriptAccess ?? 'empty'}</span>
              </div>
              <div className="state-grid">
                <span>Transcript: triggered review only</span>
                <span>Support access: denied</span>
                <span>submittedClaim={String(billing?.items[0]?.submittedClaim ?? false)}</span>
              </div>
              <div className="action-row">
                <button type="button" onClick={triggerBillingReview}>
                  Trigger Review
                </button>
              </div>
            </article>
          )}

          {activeTab === 'Settings' && (
            <article className="appointment-row" aria-label="Settings admin integrations">
              <div className="appointment-main">
                <strong>Settings/Admin/Integrations</strong>
                <small>Tenant, site, role, feature flag, disabled user, and adapter status scaffolding.</small>
                <span>{settings?.integrations[0]?.status ?? 'empty'}</span>
              </div>
              <div className="state-grid">
                {settings?.integrations.map((integration) => (
                  <span key={integration.integrationId}>
                    {integration.vendor}: {integration.status}
                  </span>
                ))}
              </div>
              <div className="action-row">
                <button type="button" onClick={setMockReady}>
                  Set Mock Ready
                </button>
              </div>
            </article>
          )}

          {activeTab === 'Templates' && (
            <article className="appointment-row" aria-label="Templates and dot phrases">
              <div className="appointment-main">
                <strong>Templates And Dot Phrases</strong>
                <small>Safe variables use placeholder form and obvious PHI is rejected.</small>
                <span>{templates?.templates[0]?.status ?? 'empty synthetic template'}</span>
              </div>
              <div className="state-grid">
                <span>{templates?.templates[0]?.variables[0] ?? '{{follow_up_interval}}'}</span>
                <span>{templates?.dotPhrases[0]?.trigger ?? '.awvplan'}</span>
              </div>
              <div className="action-row">
                <button type="button" onClick={createDraftTemplate}>
                  Create Draft
                </button>
              </div>
            </article>
          )}

          {activeTab === 'Estimates' && (
            <article className="appointment-row" aria-label="Estimate configuration">
              <div className="appointment-main">
                <strong>Estimate Configuration</strong>
                <small>Internal caveated estimates only; no patient-facing financial conclusion.</small>
                <span>{estimate?.internalEstimatesEnabled ? 'internal only' : 'disabled'}</span>
              </div>
              <div className="state-grid">
                <span>Source data: {estimate?.sourceDataConfigured ? 'configured' : 'not configured'}</span>
                <span>Patient-facing: {estimate?.patientFacingEstimatesEnabled ? 'enabled' : 'disabled'}</span>
              </div>
              <div className="action-row">
                <button type="button" onClick={acknowledgeEstimateCaveat}>
                  Acknowledge Caveat
                </button>
              </div>
            </article>
          )}

          {activeTab === 'Rules Catalog' && (
            <article className="appointment-row" aria-label="Rules catalog">
              <div className="appointment-main">
                <strong>Rules Catalog</strong>
                <small>CPT, HCPCS, ICD-10, HCC, E/M, quality, visit-type, and confidence threshold seeds.</small>
                <span>{rules?.entries[0]?.status ?? 'empty'}</span>
              </div>
              <div className="state-grid">
                <span>Human review: required</span>
                <span>Autonomous finalization: false</span>
              </div>
              <div className="action-row">
                <button type="button" onClick={publishRules}>
                  Publish
                </button>
              </div>
            </article>
          )}
        </div>
      </section>

      <section className="status-band" aria-label="Operational summary">
        <div>
          <h2>Current Synthetic State</h2>
          <p>No live payer, production rules engine, ClinicOS sync, medical-necessity determination, or charge finalization is enabled. Claim submission remains disabled.</p>
        </div>
        <dl>
          {statusSummary.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
