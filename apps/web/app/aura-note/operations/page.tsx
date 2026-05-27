'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const states = ['empty', 'loading', 'ready', 'saving', 'blocked', 'failed', 'permission-denied', 'read-only', 'demo fixture'];

const tabs = [
  'Task Inbox',
  'MA Follow-Up',
  'Billing Review',
  'Settings',
  'Templates',
  'Estimates',
  'Rules Catalog'
] as const;

type Tab = (typeof tabs)[number];

export default function StandaloneOperationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Task Inbox');
  const [taskStatus, setTaskStatus] = useState('open blocker');
  const [billingTranscript, setBillingTranscript] = useState('denied until triggered review context');
  const [integrationStatus, setIntegrationStatus] = useState('disabled');
  const [templateStatus, setTemplateStatus] = useState('active synthetic template');
  const [estimateStatus, setEstimateStatus] = useState('internal only');
  const [rulesStatus, setRulesStatus] = useState('draft-only human review required');

  const statusSummary = useMemo(
    () => [
      ['Worklist', taskStatus],
      ['Billing transcript', billingTranscript],
      ['Integration', integrationStatus],
      ['Estimate', estimateStatus],
      ['Rules', rulesStatus]
    ],
    [billingTranscript, estimateStatus, integrationStatus, rulesStatus, taskStatus]
  );

  return (
    <main className="operations-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">P7.5 / WO-039</p>
          <h1>Standalone Operations Center</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <Link href="/aura-note/schedule">Schedule</Link>
          <Link href="/aura-note/drafts">Draft Notes</Link>
          <Link href="/aura-note/finalized">Finalized Notes</Link>
          <Link href="/aura-note/support/status">Support</Link>
        </nav>
      </header>

      <section className="status-band" aria-label="Standalone operations readiness">
        <div>
          <h2>Standalone Daily Operations</h2>
          <p>
            Synthetic task, billing review, settings, template, estimate, and rules-catalog surfaces are available without
            ClinicOS dependency.
          </p>
        </div>
        <dl>
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
            <dd>not submitted</dd>
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
        </div>

        <div className="schedule-list" aria-live="polite">
          {activeTab === 'Task Inbox' && (
            <article className="appointment-row" aria-label="Task inbox">
              <div className="appointment-main">
                <strong>Task Inbox</strong>
                <small>Clinician linked tasks, blocker visibility, due metadata, note and safe patient linkage.</small>
                <span>{taskStatus}</span>
              </div>
              <div className="state-grid">
                <span>Owner: clinician</span>
                <span>Due: 2026-05-29</span>
              </div>
              <div className="action-row">
                <button type="button" onClick={() => setTaskStatus('assigned non-blocker')}>
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
                <span>{taskStatus}</span>
              </div>
              <div className="state-grid">
                <span>Owner: ma</span>
                <span>Source: history_gap</span>
              </div>
              <div className="action-row">
                <button type="button" onClick={() => setTaskStatus('answered non-blocker')}>
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
                <span>{billingTranscript}</span>
              </div>
              <div className="state-grid">
                <span>Transcript: triggered review only</span>
                <span>Support access: denied</span>
              </div>
              <div className="action-row">
                <button type="button" onClick={() => setBillingTranscript('allowed for billing_staff triggered review')}>
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
                <span>{integrationStatus}</span>
              </div>
              <div className="state-grid">
                <span>athenahealth: disabled</span>
                <span>ClinicOS: safe degraded</span>
              </div>
              <div className="action-row">
                <button type="button" onClick={() => setIntegrationStatus('mock_ready')}>
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
                <span>{templateStatus}</span>
              </div>
              <div className="state-grid">
                <span>{'{{follow_up_interval}}'}</span>
                <span>.awvplan</span>
              </div>
              <div className="action-row">
                <button type="button" onClick={() => setTemplateStatus('draft synthetic template created')}>
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
                <span>{estimateStatus}</span>
              </div>
              <div className="state-grid">
                <span>Source data: not configured</span>
                <span>Patient-facing: disabled</span>
              </div>
              <div className="action-row">
                <button type="button" onClick={() => setEstimateStatus('internal caveat acknowledged')}>
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
                <span>{rulesStatus}</span>
              </div>
              <div className="state-grid">
                <span>Human review: required</span>
                <span>Autonomous finalization: false</span>
              </div>
              <div className="action-row">
                <button type="button" onClick={() => setRulesStatus('published as active synthetic rules')}>
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
