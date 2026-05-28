'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type QueueState =
  | 'disabled'
  | 'pending_approval'
  | 'approved'
  | 'queued'
  | 'retrying'
  | 'failed'
  | 'dead_lettered'
  | 'reconciled';

const screenStates = ['empty', 'loading', 'ready', 'degraded', 'failed', 'permission-denied', 'disabled', 'retrying', 'dead-letter', 'reconciled', 'demo fixture'];

const initialJobs: Array<{
  id: string;
  label: string;
  target: string;
  status: QueueState;
  mode: string;
}> = [
  {
    id: 'ehr-wb-disabled-001',
    label: 'Final note writeback',
    target: 'final_note',
    status: 'disabled',
    mode: 'standalone-safe fallback'
  },
  {
    id: 'ehr-wb-pending-001',
    label: 'Final note sandbox candidate',
    target: 'final_note',
    status: 'pending_approval',
    mode: 'human approval required'
  },
  {
    id: 'ehr-wb-failed-001',
    label: 'Patient summary sandbox candidate',
    target: 'patient_summary',
    status: 'failed',
    mode: 'retry or dead-letter required'
  }
];

export default function EhrIntegrationPage() {
  const [jobs, setJobs] = useState(initialJobs);
  const [message, setMessage] = useState('Sandbox queue loaded from documented mock metadata; no payloads are displayed.');

  const summary = useMemo(
    () => [
      ['Vendor', 'athenahealth first, vendor-neutral adapter'],
      ['Mode', 'sandbox-ready mock'],
      ['Live delivery', 'disabled'],
      ['Payloads', 'excluded from browser/support views']
    ],
    []
  );

  function updateJob(id: string, status: QueueState, messageText: string) {
    setJobs((current) => current.map((job) => (job.id === id ? { ...job, status } : job)));
    setMessage(messageText);
  }

  return (
    <main className="operations-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">P9 / WO-044</p>
          <h1>EHR Sandbox Integration</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <Link href="/aura-note/schedule">Schedule</Link>
          <Link href="/aura-note/finalized">Finalized Notes</Link>
          <Link href="/aura-note/platform">Platform</Link>
          <Link href="/aura-note/support/status">Support</Link>
        </nav>
      </header>

      <section className="status-band" aria-label="EHR integration readiness">
        <div>
          <h2>Sandbox Writeback Boundary</h2>
          <p>
            Writeback is queue-backed, human-approved, and metadata-only. Copy, PDF, and export remain available when
            EHR delivery is disabled or failed.
          </p>
        </div>
        <dl>
          {summary.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="builder-grid" aria-label="EHR writeback queue states">
        <article className="appointment-form" aria-label="Adapter status">
          <h2>Adapter Status</h2>
          <p>Athenahealth remains behind the generic EHR adapter. Sandbox behavior uses deterministic fixture metadata.</p>
          <div className="state-grid">
            <span>adapter_status_checked</span>
            <span>chart_context_loaded</span>
            <span>sandbox credentials: not committed</span>
            <span>production writeback: false</span>
          </div>
        </article>

        <article className="appointment-form" aria-label="Writeback queue">
          <h2>Writeback Queue</h2>
          <p>{message}</p>
          <div className="analytics-list">
            {jobs.map((job) => (
              <div key={job.id}>
                <span>{job.label}</span>
                <strong>{job.status}</strong>
                <small>
                  {job.target} / {job.mode}
                </small>
              </div>
            ))}
          </div>
          <div className="action-row">
            <button
              type="button"
              onClick={() => updateJob('ehr-wb-pending-001', 'approved', 'Human approval recorded as audit-safe metadata.')}
            >
              Record Approval
            </button>
            <button
              type="button"
              onClick={() => updateJob('ehr-wb-failed-001', 'retrying', 'Retry scheduled without live EHR delivery.')}
            >
              Schedule Retry
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={() => updateJob('ehr-wb-failed-001', 'dead_lettered', 'Dead-letter evidence recorded; copy/PDF/export remains available.')}
            >
              Dead Letter
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={() => updateJob('ehr-wb-pending-001', 'reconciled', 'Reconciliation checked with synthetic sandbox identifier.')}
            >
              Reconcile
            </button>
          </div>
        </article>

        <article className="appointment-form" aria-label="Permission and payload boundaries">
          <h2>Permission And Payload Boundaries</h2>
          <p>Support can see operational metadata only. Clinician approval is linked to the visit; billing cannot bypass.</p>
          <div className="state-grid">
            <span>clinician linked visit: approve</span>
            <span>compliance/admin: retry and reconcile</span>
            <span>support: metadata only</span>
            <span>billing: denied</span>
            <span>payloadStored=false</span>
            <span>liveDeliveryEnabled=false</span>
          </div>
        </article>

        <article className="appointment-form" aria-label="Screen states">
          <h2>Screen States</h2>
          <section className="state-grid" aria-label="EHR route states">
            {screenStates.map((state) => (
              <span key={state} className="state-pill">
                {state}
              </span>
            ))}
          </section>
        </article>
      </section>

      <section className="status-band" aria-label="EHR integration summary">
        <div>
          <h2>Safety Summary</h2>
          <p>
            This page is browser-testable synthetic evidence only. It does not perform live athenahealth calls, store
            production PHI payloads, finalize charges, determine medical necessity, or submit claims.
          </p>
        </div>
        <dl>
          <div>
            <dt>Fallback</dt>
            <dd>copy / PDF / structured export</dd>
          </div>
          <div>
            <dt>Audit</dt>
            <dd>metadata-only events</dd>
          </div>
          <div>
            <dt>ClinicOS</dt>
            <dd>AURA Note permission boundary remains authoritative</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
