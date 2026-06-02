'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  BillingReviewQueueViewDto,
  EstimateConfigurationDto,
  RulesCatalogViewDto,
  SettingsAdminViewDto,
  TaskWorklistViewDto,
  TemplatesViewDto
} from '@aura-note/contracts';
import { createAuraNoteApiClient } from '../../../lib/aura-note-api-client';

const states = ['empty', 'loading', 'ready', 'saving', 'blocked', 'failed', 'permission-denied', 'read-only', 'demo fixture'];
const tabs = ['Task Inbox', 'MA Follow-Up', 'Billing Review', 'Settings', 'Templates', 'Estimates', 'Rules Catalog'] as const;

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
  const [statusMessage, setStatusMessage] = useState('Loading operations from typed API responses.');

  const refreshOperations = useCallback(async () => {
    setRouteState('loading');
    try {
      const [taskResponse, billingResponse, settingsResponse, templatesResponse, estimateResponse, rulesResponse] = await Promise.all([
        adminClient.listOperationalTasks(),
        adminClient.listBillingReviews(),
        adminClient.getSettings(),
        adminClient.listTemplates(),
        adminClient.getEstimateConfig(),
        adminClient.listRulesCatalog()
      ]);
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

  return (
    <main className="operations-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">CR-2 / WO-064</p>
          <h1>Standalone Operations Center</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <Link href="/aura-note">Runtime Home</Link>
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
