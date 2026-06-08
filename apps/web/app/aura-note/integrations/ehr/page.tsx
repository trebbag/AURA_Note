'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  EhrAppointmentImportResponseDto,
  EhrEncounterContextResponseDto,
  EhrIntegrationStatusDto,
  EhrPatientLookupResponseDto,
  EhrRuntimeBoundaryResponseDto,
  EhrWritebackQueueResponseDto
} from '@aura-note/contracts';
import { createAuraNoteApiClient } from '../../../../lib/aura-note-api-client';

const screenStates = [
  'empty',
  'loading',
  'ready',
  'degraded',
  'failed',
  'permission-denied',
  'read-only',
  'disabled',
  'configured',
  'approval-required',
  'denied',
  'pending',
  'delivered',
  'dead-lettered',
  'reconciliation-needed',
  'demo fixture'
];

export default function EhrIntegrationPage() {
  const clinicianClient = useMemo(() => createAuraNoteApiClient({ role: 'clinician' }), []);
  const adminClient = useMemo(() => createAuraNoteApiClient({ role: 'admin' }), []);
  const billingClient = useMemo(() => createAuraNoteApiClient({ role: 'billing_staff' }), []);
  const [status, setStatus] = useState<EhrIntegrationStatusDto | null>(null);
  const [boundary, setBoundary] = useState<EhrRuntimeBoundaryResponseDto | null>(null);
  const [patientLookup, setPatientLookup] = useState<EhrPatientLookupResponseDto | null>(null);
  const [appointmentImport, setAppointmentImport] = useState<EhrAppointmentImportResponseDto | null>(null);
  const [encounterContext, setEncounterContext] = useState<EhrEncounterContextResponseDto | null>(null);
  const [queue, setQueue] = useState<EhrWritebackQueueResponseDto | null>(null);
  const [routeState, setRouteState] = useState('loading');
  const [message, setMessage] = useState('Loading EHR status and writeback queue from API.');

  const refreshEhr = useCallback(async () => {
    setRouteState('loading');
    try {
      const [statusResponse, boundaryResponse, patientResponse, appointmentResponse, encounterResponse, queueResponse] = await Promise.all([
        clinicianClient.getEhrStatus(),
        clinicianClient.getEhrRuntimeBoundary(),
        clinicianClient.searchEhrPatients(),
        clinicianClient.importEhrAppointments(),
        clinicianClient.getEhrEncounterContext('athena-encounter-synthetic-001'),
        clinicianClient.listEhrWritebackQueue()
      ]);
      setStatus(statusResponse.data);
      setBoundary(boundaryResponse.data);
      setPatientLookup(patientResponse.data);
      setAppointmentImport(appointmentResponse.data);
      setEncounterContext(encounterResponse.data);
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

  function denyWriteback() {
    const job = jobByStatus('pending_approval');
    if (!job) return;
    void runAction('Writeback denial recorded as audit-safe metadata through API.', () =>
      clinicianClient.actOnEhrWritebackJob(job.writebackJobId, {
        action: 'deny',
        reason: 'Synthetic clinician denial before payload preparation'
      })
    );
  }

  function preparePayload() {
    const job = jobByStatus('approved');
    if (!job) return;
    void runAction('Payload preparation metadata recorded without storing raw EHR payloads.', () =>
      clinicianClient.actOnEhrWritebackJob(job.writebackJobId, { action: 'prepare_payload' })
    );
  }

  function recordAttempt() {
    const job = jobByStatus('prepared') ?? jobByStatus('approved');
    if (!job) return;
    void runAction('Sandbox delivery attempt metadata recorded without a live EHR call.', () =>
      adminClient.actOnEhrWritebackJob(job.writebackJobId, { action: 'record_attempt' })
    );
  }

  function acknowledgeAttempt() {
    const job = jobByStatus('attempted');
    if (!job) return;
    void runAction('Sandbox acknowledgement metadata recorded; reconciliation remains required.', () =>
      adminClient.actOnEhrWritebackJob(job.writebackJobId, {
        action: 'acknowledge',
        acknowledgementId: 'ack-wo-069-ehr'
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
    ['Mode', boundary?.boundary.mode ?? status?.status.mode ?? queue?.queue.sandboxMode ?? 'sandbox-ready mock'],
    ['Boundary', boundary?.boundary.adapterBoundary ?? 'vendor_neutral_ehr_adapter'],
    ['Credential', boundary?.boundary.credentialState ?? 'disabled'],
    ['Live delivery', String(queue?.queue.liveProductionWritebackEnabled ?? false)],
    ['Payloads', queue?.queue.payloadsExcluded ? 'excluded from browser/support views' : 'not loaded']
  ];

  return (
    <main className="operations-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">CR-3 / WO-069</p>
          <h1>EHR Sandbox Integration</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <Link href="/aura-note">Dashboard</Link>
          <Link href="/aura-note/schedule">Schedule</Link>
          <Link href="/aura-note/finalized">Finalized Notes</Link>
          <Link href="/aura-note/platform">Platform</Link>
          <Link href="/aura-note/support/status">Support</Link>
        </nav>
      </header>

      <section className="figma-drafts-source-shell figma-platform-settings-shell" aria-label="Figma EHR integration settings workspace">
        <header className="figma-drafts-source-header">
          <div>
            <h2>EHR Configuration</h2>
            <p>Athenahealth-first sandbox controls are presented as integration settings without enabling live writeback.</p>
          </div>
          <div className="figma-drafts-header-actions">
            <span>{status?.status.vendor ?? 'athenahealth-first'}</span>
            <span className="figma-readonly-badge">live delivery disabled</span>
          </div>
        </header>

        <div className="figma-tab-strip" role="tablist" aria-label="EHR integration settings tabs">
          {['Status', 'Patient Lookup', 'Appointment Import', 'Encounter Context', 'Writeback Queue', 'Reconciliation'].map((tab, index) => (
            <button key={tab} type="button" role="tab" aria-selected={index === 0} className={index === 0 ? 'selected-tab' : 'secondary-button'}>
              {tab}
            </button>
          ))}
        </div>

        <section className="figma-settings-matrix" aria-label="API-backed EHR integration cards">
          <div>
            <strong>Adapter Boundary</strong>
            <span>{boundary?.boundary.adapterBoundary ?? 'vendor_neutral_ehr_adapter'}</span>
            <small>Athenahealth does not leak into domain logic.</small>
          </div>
          <div>
            <strong>Credential State</strong>
            <span>{boundary?.boundary.credentialState ?? 'disabled'}</span>
            <small>Sandbox credentials are not committed or returned.</small>
          </div>
          <div>
            <strong>Sandbox Context</strong>
            <span>{encounterContext?.encounter.externalEncounterId ?? 'loading encounter metadata'}</span>
            <small>Raw payload storage remains false.</small>
          </div>
          <div>
            <strong>Writeback Queue</strong>
            <span>{queue?.queue.items.length ?? 0} metadata-only jobs</span>
            <small>Human approval, retry, dead-letter, and reconciliation stay API-backed.</small>
          </div>
          <div>
            <strong>Live API Calls</strong>
            <span>{String(boundary?.boundary.liveApiCallsEnabled ?? false)}</span>
            <small>Live calls remain gated by configuration and approval.</small>
          </div>
          <div>
            <strong>Browser Payload Exposure</strong>
            <span>{queue?.queue.payloadsExcluded ? 'excluded' : 'not loaded'}</span>
            <small>Support/browser views receive operational metadata only.</small>
          </div>
        </section>
      </section>

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
            <span>config_reviewed</span>
            <span>credential_disabled</span>
            <span>chart_context_loaded</span>
            <span>{boundary?.boundary.adapterBoundary ?? 'vendor_neutral_ehr_adapter'}</span>
            <span>sandbox credentials: not committed</span>
            <span>liveApiCallsEnabled=false</span>
            <span>liveApiCallsEnabled={String(boundary?.boundary.liveApiCallsEnabled ?? false)}</span>
            <span>rawPayloadStorageEnabled={String(boundary?.boundary.rawPayloadStorageEnabled ?? false)}</span>
            <span>production writeback: {String(queue?.queue.liveProductionWritebackEnabled ?? false)}</span>
            <span>Athenahealth: {status?.status.health ?? 'disabled'}</span>
          </div>
        </article>

        <article className="appointment-form" aria-label="Sandbox patient appointment encounter context">
          <h2>Sandbox Context</h2>
          <p>Patient lookup, appointment import, and encounter context are API-backed sandbox metadata only.</p>
          <div className="state-grid">
            <span>patient_lookup_performed</span>
            <span>appointment_imported</span>
            <span>encounter_context_loaded</span>
            <span>{patientLookup?.results[0]?.externalPatientRef ?? 'athena-patient-ref-synthetic-001'}</span>
            <span>{appointmentImport?.appointments[0]?.externalAppointmentId ?? 'athena-appointment-synthetic-001'}</span>
            <span>{encounterContext?.encounter.externalEncounterId ?? 'athena-encounter-synthetic-001'}</span>
            <span>localAppointmentCreated={String(appointmentImport?.appointments[0]?.localAppointmentCreated ?? false)}</span>
            <span>rawPayloadStored=false</span>
            <span>rawPayloadStored={String(encounterContext?.encounter.rawPayloadStored ?? false)}</span>
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
            <button type="button" className="secondary-action" onClick={denyWriteback}>
              Deny
            </button>
            <button type="button" onClick={preparePayload}>
              Prepare Payload
            </button>
            <button type="button" onClick={recordAttempt}>
              Record Attempt
            </button>
            <button type="button" onClick={acknowledgeAttempt}>
              Acknowledge
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
