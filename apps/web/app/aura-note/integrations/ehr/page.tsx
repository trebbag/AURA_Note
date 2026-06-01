'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EhrIntegrationStatusDto, EhrWritebackQueueResponseDto } from '@aura-note/contracts';
import { createAuraNoteApiClient } from '../../../../lib/aura-note-api-client';

const screenStates = ['empty', 'loading', 'ready', 'degraded', 'failed', 'permission-denied', 'disabled', 'retrying', 'dead-letter', 'reconciled', 'demo fixture'];

export default function EhrIntegrationPage() {
  const clinicianClient = useMemo(() => createAuraNoteApiClient({ role: 'clinician' }), []);
  const adminClient = useMemo(() => createAuraNoteApiClient({ role: 'admin' }), []);
  const billingClient = useMemo(() => createAuraNoteApiClient({ role: 'billing_staff' }), []);
  const [status, setStatus] = useState<EhrIntegrationStatusDto | null>(null);
  const [queue, setQueue] = useState<EhrWritebackQueueResponseDto | null>(null);
  const [routeState, setRouteState] = useState('loading');
  const [message, setMessage] = useState('Loading EHR status and writeback queue from API.');

  const refreshEhr = useCallback(async () => {
    setRouteState('loading');
    try {
      const [statusResponse, queueResponse] = await Promise.all([
        clinicianClient.getEhrStatus(),
        clinicianClient.listEhrWritebackQueue()
      ]);
      setStatus(statusResponse.data);
      setQueue(queueResponse.data);
      setRouteState(queueResponse.data.queue.items.length === 0 ? 'empty' : 'ready');
      setMessage('Sandbox queue loaded from typed API metadata; no payloads are displayed.');
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'EHR API load failed.');
    }
  }, [clinicianClient]);

  useEffect(() => {
    void refreshEhr();
  }, [refreshEhr]);

  async function runAction(label: string, action: () => Promise<unknown>) {
    setRouteState('saving');
    try {
      await action();
      setMessage(label);
      await refreshEhr();
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : label);
    }
  }

  function jobByStatus(statusName: string) {
    return queue?.queue.items.find((item) => item.status === statusName) ?? queue?.queue.items[0];
  }

  function recordApproval() {
    const job = jobByStatus('pending_approval');
    if (!job) return;
    void runAction('Human approval recorded as audit-safe metadata through API.', () =>
      clinicianClient.actOnEhrWritebackJob(job.writebackJobId, {
        action: 'approve',
        approvalId: 'approval-wo-064-ehr'
      })
    );
  }

  function scheduleRetry() {
    const job = jobByStatus('failed');
    if (!job) return;
    void runAction('Retry scheduled through API without live EHR delivery.', () =>
      adminClient.actOnEhrWritebackJob(job.writebackJobId, { action: 'retry' })
    );
  }

  function deadLetter() {
    const job = jobByStatus('failed');
    if (!job) return;
    void runAction('Dead-letter evidence recorded through API.', () =>
      adminClient.actOnEhrWritebackJob(job.writebackJobId, { action: 'dead_letter' })
    );
  }

  function reconcile() {
    const job = queue?.queue.items[0];
    if (!job) return;
    void runAction('Reconciliation checked through API with synthetic sandbox identifier.', () =>
      adminClient.actOnEhrWritebackJob(job.writebackJobId, {
        action: 'reconcile',
        reconciliationId: 'reconcile-wo-064-ehr'
      })
    );
  }

  async function verifyPermissionDeniedState() {
    setRouteState('loading');
    const job = queue?.queue.items[0];
    if (!job) {
      setRouteState('empty');
      return;
    }
    try {
      await billingClient.actOnEhrWritebackJob(job.writebackJobId, { action: 'retry' });
      setRouteState('failed');
      setMessage('Unexpected billing writeback action succeeded.');
    } catch (error) {
      setRouteState('permission-denied');
      setMessage(error instanceof Error ? error.message : 'Billing writeback action denied by API.');
    }
  }

  const summary = [
    ['Vendor', status?.status.vendor ?? 'athenahealth first, vendor-neutral adapter'],
    ['Mode', status?.status.mode ?? queue?.queue.sandboxMode ?? 'sandbox-ready mock'],
    ['Live delivery', String(queue?.queue.liveProductionWritebackEnabled ?? false)],
    ['Payloads', queue?.queue.payloadsExcluded ? 'excluded from browser/support views' : 'not loaded']
  ];

  return (
    <main className="operations-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">CR-2 / WO-064</p>
          <h1>EHR Sandbox Integration</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <Link href="/aura-note">Runtime Home</Link>
          <Link href="/aura-note/schedule">Schedule</Link>
          <Link href="/aura-note/finalized">Finalized Notes</Link>
          <Link href="/aura-note/platform">Platform</Link>
          <Link href="/aura-note/support/status">Support</Link>
        </nav>
      </header>

      <section className="status-band" aria-label="EHR integration readiness">
        <div>
          <h2>Sandbox Writeback Boundary</h2>
          <p>{message}</p>
        </div>
        <dl>
          <div>
            <dt>Route State</dt>
            <dd>{routeState}</dd>
          </div>
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
            <span>production writeback: {String(queue?.queue.liveProductionWritebackEnabled ?? false)}</span>
            <span>Athenahealth: {status?.status.health ?? 'disabled'}</span>
          </div>
        </article>

        <article className="appointment-form" aria-label="Writeback queue">
          <h2>Writeback Queue</h2>
          <p>{message}</p>
          <div className="analytics-list">
            {(queue?.queue.items ?? []).map((job) => (
              <div key={job.writebackJobId}>
                <span>{job.noteId}</span>
                <strong>{job.status}</strong>
                <small>
                  {job.target} / configured={String(job.configured)}
                </small>
              </div>
            ))}
          </div>
          <div className="action-row">
            <button type="button" onClick={recordApproval}>
              Record Approval
            </button>
            <button type="button" onClick={scheduleRetry}>
              Schedule Retry
            </button>
            <button type="button" className="secondary-action" onClick={deadLetter}>
              Dead Letter
            </button>
            <button type="button" className="secondary-action" onClick={reconcile}>
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
          <button type="button" className="secondary-action" onClick={() => void verifyPermissionDeniedState()}>
            Verify Permission Denied
          </button>
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
