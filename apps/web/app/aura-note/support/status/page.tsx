'use client';

import { Activity, AlertTriangle, DatabaseBackup, FileCheck, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type {
  AuditExportResponseDto,
  BackupRestoreReadinessResponseDto,
  CommercialReadinessResponseDto,
  OperationalEvidenceResponseDto,
  OperationalReadinessResponseDto,
  SupportStatusResponseDto
} from '@aura-note/contracts';
import { createAuraNoteApiClient } from '../../../../lib/aura-note-api-client';

type RouteState = 'loading' | 'empty' | 'ready' | 'saving' | 'failed' | 'permission-denied' | 'read-only';

interface SupportRuntimeState {
  support?: SupportStatusResponseDto;
  operations?: OperationalReadinessResponseDto;
  backup?: BackupRestoreReadinessResponseDto;
  commercial?: CommercialReadinessResponseDto;
  auditExport?: AuditExportResponseDto;
  operationalEvidence?: OperationalEvidenceResponseDto;
  deniedMessage?: string;
}

const documentedLaunchOpsDrills = [
  { label: 'Release smoke', state: 'passing_synthetic', mode: 'web, API, worker, persistence, storage, support status' },
  { label: 'Rollback rehearsal', state: 'documented_blocked_live', mode: 'migration rollback requires approval before production execution' },
  { label: 'Vendor outage drill', state: 'fail_closed', mode: 'AI, EHR, ClinicOS, storage, transcription disabled paths remain safe' },
  { label: 'Access review drill', state: 'recorded_synthetic', mode: 'disabled user, expired session, and denied support metadata only' }
];

const documentedPerformanceBaselines = [
  { label: 'Schedule list p95', state: 'under 250ms synthetic', mode: 'synthetic_load_baseline no PHI' },
  { label: 'Finalization API p95', state: 'under 500ms synthetic', mode: 'human-review workflow only' },
  { label: 'Export metadata p95', state: 'under 750ms synthetic', mode: 'storage-backed metadata, no public URL' },
  { label: 'Launch load profile', state: '100 synthetic workflows', mode: 'local deterministic harness; no production traffic' }
];

const documentedPilotLaunchChecklist = [
  { label: 'Tenant Onboarding', state: 'checklist_ready', mode: 'synthetic tenant/site provisioning only' },
  { label: 'Role Training', state: 'checklist_ready', mode: 'clinician, MA, billing, admin, privacy, support, service-account' },
  { label: 'Disabled Feature Inventory', state: 'reviewed_synthetic', mode: 'live vendors, charge finalization, and claim submission disabled' },
  { label: 'First-Week Monitoring', state: 'placeholder_ready', mode: 'daily access, workflow, export, vendor-disabled, and support review' }
];

const documentedPilotApprovals = [
  { label: 'Founder approval', state: 'required_before_live_launch', mode: 'productionLaunchApproved=false' },
  { label: 'Clinical approval', state: 'required_before_live_launch', mode: 'human-review gates remain required' },
  { label: 'Compliance/privacy approval', state: 'required_before_live_launch', mode: 'no real PHI in pilot evidence' },
  { label: 'Security approval', state: 'required_before_live_launch', mode: 'no production credentials or live vendors' }
];

const documentedPilotGoNoGo = [
  { label: 'Frontend Runtime Integration Gate', state: 'ready_synthetic', mode: 'typed API client and persisted reload evidence' },
  { label: 'Rollback Criteria', state: 'documented', mode: 'unauthorized access, privacy incident, smoke failure, vendor misroute' },
  { label: 'Support Escalation', state: 'placeholder_ready', mode: 'release, clinical, privacy, security, infrastructure owners required' },
  { label: 'Draft Claim Boundary', state: 'blocked_live_submission', mode: 'submittedClaim=false' }
];

const documentedClaimDecisionItems = [
  { label: 'Draft Claim Boundary', state: 'internal_review_only', mode: 'submittedClaim=false' },
  { label: 'No Live Clearinghouse', state: 'disabled', mode: 'claimSubmissionEnabled=false' },
  { label: 'No Payer API', state: 'deferred', mode: 'vendor and legal strategy required' },
  { label: 'No Denial Automation', state: 'deferred', mode: 'human billing review required' },
  { label: 'No Payment Posting', state: 'deferred', mode: 'paymentPostingEnabled=false' }
];

const documentedClaimApprovalCriteria = [
  { label: 'Founder/Billing approval', state: 'required_for_future_work', mode: 'live submission cannot be enabled by default' },
  { label: 'Compliance/Privacy approval', state: 'required_for_future_work', mode: 'payer payload and PHI policy required' },
  { label: 'Security/Legal approval', state: 'required_for_future_work', mode: 'credential, contract, and audit posture required' },
  { label: 'ClinicOS/M21 handoff', state: 'adapter_only_if_approved', mode: 'cannot bypass AURA Note permissions' }
];

export default function SupportStatusPage() {
  const supportClient = useMemo(() => createAuraNoteApiClient({ role: 'support' }), []);
  const complianceClient = useMemo(() => createAuraNoteApiClient({ role: 'compliance_privacy_lead' }), []);
  const clinicianClient = useMemo(() => createAuraNoteApiClient({ role: 'clinician' }), []);
  const [routeState, setRouteState] = useState<RouteState>('loading');
  const [runtime, setRuntime] = useState<SupportRuntimeState>({});
  const [message, setMessage] = useState('Loading support runtime state from typed API clients.');

  const refreshRuntimeState = async () => {
    setRouteState('loading');
    setMessage('Loading support runtime state from typed API clients.');
    const [support, operations, backup, commercial, clinicianDenied] = await Promise.allSettled([
      supportClient.getSupportStatus(),
      supportClient.getOperationalReadiness(),
      complianceClient.getBackupRestoreReadiness(),
      supportClient.getCommercialReadiness(),
      clinicianClient.getSupportStatus()
    ]);

    setRuntime((current) => ({
      ...current,
      ...(support.status === 'fulfilled' ? { support: support.value.data } : {}),
      ...(operations.status === 'fulfilled' ? { operations: operations.value.data } : {}),
      ...(backup.status === 'fulfilled' ? { backup: backup.value.data } : {}),
      ...(commercial.status === 'fulfilled' ? { commercial: commercial.value.data } : {}),
      deniedMessage:
        clinicianDenied.status === 'rejected'
          ? clinicianDenied.reason instanceof Error
            ? clinicianDenied.reason.message
            : 'permission-denied'
          : 'permission-denied path did not reject'
    }));

    if (support.status === 'fulfilled' && operations.status === 'fulfilled' && backup.status === 'fulfilled' && commercial.status === 'fulfilled') {
      setRouteState(support.value.data.status.featureFlags.length === 0 ? 'empty' : 'ready');
      setMessage('Support status, operational readiness, backup/restore, commercial readiness, and denial evidence loaded from the API.');
      return;
    }

    setRouteState('failed');
    const firstFailure = [support, operations, backup, commercial].find((result) => result.status === 'rejected');
    setMessage(firstFailure?.status === 'rejected' && firstFailure.reason instanceof Error ? firstFailure.reason.message : 'Support runtime load failed.');
  };

  useEffect(() => {
    void refreshRuntimeState();
  }, []);

  const requestAuditExport = async () => {
    setRouteState('saving');
    setMessage('Requesting redacted audit export through compliance/privacy API role.');
    try {
      const response = await complianceClient.requestAuditExport({
        startAt: '2026-05-01T00:00:00.000Z',
        endAt: '2026-06-01T00:00:00.000Z',
        format: 'jsonl',
        includePhi: false
      });
      setRuntime((current) => ({ ...current, auditExport: response.data }));
      setRouteState('ready');
      setMessage('Redacted audit export generated with API-backed delivery metadata.');
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'Audit export request failed.');
    }
  };

  const recordRunbookEvidence = async () => {
    setRouteState('saving');
    setMessage('Recording operational evidence through support API role.');
    try {
      const response = await supportClient.recordOperationalEvidence({
        actionType: 'incident_runbook_viewed',
        subjectId: 'WO-064-api-backed-support-route',
        note: 'metadata only runtime evidence'
      });
      setRuntime((current) => ({ ...current, operationalEvidence: response.data }));
      setRouteState('ready');
      setMessage('Operational evidence recorded without PHI or launch-readiness claim.');
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'Operational evidence recording failed.');
    }
  };

  const tryClinicianDenied = async () => {
    setRouteState('saving');
    setMessage('Checking clinician denial through the support status API.');
    try {
      await clinicianClient.getSupportStatus();
      setRouteState('failed');
      setRuntime((current) => ({ ...current, deniedMessage: 'permission-denied path did not reject' }));
      setMessage('Clinician support-status access was not denied.');
    } catch (error) {
      setRouteState('permission-denied');
      setRuntime((current) => ({ ...current, deniedMessage: error instanceof Error ? error.message : 'permission-denied' }));
      setMessage('Clinician support-status access denied before support metadata is exposed.');
    }
  };

  const status = runtime.support?.status;
  const operations = runtime.operations?.readiness;
  const backup = runtime.backup?.readiness;
  const commercial = runtime.commercial?.readiness;
  const auditExport = runtime.auditExport?.auditExport;
  const operationalEvidence = runtime.operationalEvidence?.evidence;

  return (
    <main className="support-shell figma-support-status-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AURA Note / Support</p>
          <h1>Production Hardening Status</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <a href="/aura-note">Home</a>
          <a href="/aura-note/schedule">Schedule</a>
          <a href="/aura-note/coaching">Coaching</a>
          <a href="/aura-note/runtime-integration">Runtime Gate</a>
        </nav>
      </header>

      <section className="figma-support-command" aria-label="Support command center">
        <div className="figma-final-note-title">
          <span className="figma-icon-block emerald" aria-hidden="true">
            <ShieldCheck size={21} />
          </span>
          <div>
            <p>Commercial readiness review</p>
            <h2>Operational status, evidence, and launch boundaries</h2>
            <span>Support sees metadata-only evidence; production launch remains false until required reviews are complete.</span>
          </div>
        </div>
        <div className="figma-support-kpi-grid">
          <article>
            <Activity size={17} aria-hidden="true" />
            <small>Overall</small>
            <strong>{status?.overallHealth ?? 'loading'}</strong>
          </article>
          <article>
            <FileCheck size={17} aria-hidden="true" />
            <small>Commercial Review</small>
            <strong>{commercial?.status ?? 'loading'}</strong>
          </article>
          <article>
            <DatabaseBackup size={17} aria-hidden="true" />
            <small>Backup/Restore</small>
            <strong>{backup?.status ?? 'loading'}</strong>
          </article>
          <article>
            <AlertTriangle size={17} aria-hidden="true" />
            <small>Launch Ready</small>
            <strong>{String(commercial?.productionLaunchReady ?? false)}</strong>
          </article>
        </div>
      </section>

      <section className="status-band" aria-label="Support runtime state">
        <p>
          This route is backed by typed support, compliance/privacy, and clinician-denial API calls. It remains synthetic/local
          evidence only and does not enable live PHI, live vendors, claim submission, or production launch approval.
        </p>
        <dl>
          <div>
            <dt>Route state</dt>
            <dd>{routeState}</dd>
          </div>
          <div>
            <dt>Overall</dt>
            <dd>{status?.overallHealth ?? 'loading'}</dd>
          </div>
          <div>
            <dt>Checkpoint</dt>
            <dd>{commercial?.checkpoint ?? status?.checkpoint ?? 'loading'}</dd>
          </div>
          <div>
            <dt>Read only</dt>
            <dd>true</dd>
          </div>
          <div>
            <dt>Commercial review</dt>
            <dd>{commercial?.status ?? 'loading'}</dd>
          </div>
          <div>
            <dt>Production launch</dt>
            <dd>productionLaunchReady={String(commercial?.productionLaunchReady ?? false)}</dd>
          </div>
        </dl>
        <p>{message}</p>
        <div className="button-row" role="group" aria-label="Support API actions">
          <button type="button" onClick={refreshRuntimeState}>
            Recheck Readiness
          </button>
          <button type="button" onClick={requestAuditExport}>
            Request Redacted Audit Export
          </button>
          <button type="button" onClick={recordRunbookEvidence}>
            Record Runbook Evidence
          </button>
          <button type="button" onClick={tryClinicianDenied}>
            Demo Clinician Denied
          </button>
        </div>
      </section>

      <section className="support-grid" aria-label="Commercial readiness review">
        <section className="support-panel">
          <h2>CR-4 Commercial Readiness</h2>
          <dl className="state-grid">
            <div>
              <dt>Decision gate</dt>
              <dd>{commercial?.decisionGate.status ?? 'loading'}</dd>
            </div>
            <div>
              <dt>Completed work orders</dt>
              <dd>{commercial?.decisionGate.completedWorkOrders.join(', ') ?? 'loading'}</dd>
            </div>
            <div>
              <dt>Beta package</dt>
              <dd>{String(commercial?.decisionGate.betaPilotPackageReady ?? false)}</dd>
            </div>
            <div>
              <dt>Launch ready</dt>
              <dd>productionLaunchReady={String(commercial?.decisionGate.productionLaunchReady ?? false)}</dd>
            </div>
          </dl>
          <p>{commercial?.nextStep ?? 'CR-4 commercial readiness package is loading from the API.'}</p>
        </section>

        <section className="support-panel">
          <h2>Required Final Reviews</h2>
          <div className="analytics-list">
            {(commercial?.requiredApprovals ?? []).map((approval) => (
              <div key={approval}>
                <span>{approval}</span>
                <strong>required</strong>
                <small>review gate only; no live production behavior enabled</small>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="support-grid" aria-label="CR-4 work order evidence">
        {(commercial?.sections ?? []).map((section) => (
          <section className="support-panel" key={section.workOrder}>
            <h2>
              {section.workOrder} {section.title}
            </h2>
            <dl className="state-grid">
              <div>
                <dt>Status</dt>
                <dd>{section.status}</dd>
              </div>
              <div>
                <dt>PHI safe</dt>
                <dd>{String(section.phiSafe)}</dd>
              </div>
              <div>
                <dt>Live vendor</dt>
                <dd>{String(section.liveVendorEnabled)}</dd>
              </div>
              <div>
                <dt>Launch ready</dt>
                <dd>{String(section.productionLaunchReady)}</dd>
              </div>
            </dl>
            <div className="analytics-list">
              {section.checklist.map((item) => (
                <div key={item.itemId}>
                  <span>{item.label}</span>
                  <strong>{item.status}</strong>
                  <small>
                    {item.evidence}; owner={item.ownerRole}; launchBlocker={String(item.productionLaunchBlocker)}
                  </small>
                </div>
              ))}
            </div>
            <small>Missing approvals: {section.missingApprovals.join(', ')}</small>
          </section>
        ))}
      </section>

      <section className="support-grid" aria-label="Support route states">
        <section className="support-panel">
          <h2>Screen States</h2>
          <dl className="state-grid">
            <div>
              <dt>loading</dt>
              <dd>API refresh in progress</dd>
            </div>
            <div>
              <dt>empty</dt>
              <dd>no feature flags returned</dd>
            </div>
            <div>
              <dt>ready</dt>
              <dd>API state loaded</dd>
            </div>
            <div>
              <dt>saving</dt>
              <dd>audit export or evidence POST in progress</dd>
            </div>
            <div>
              <dt>failed</dt>
              <dd>API error shown without PHI</dd>
            </div>
            <div>
              <dt>permission-denied</dt>
              <dd>{runtime.deniedMessage ?? 'waiting for denial evidence'}</dd>
            </div>
            <div>
              <dt>read-only</dt>
              <dd>support status cannot mutate clinical records</dd>
            </div>
          </dl>
        </section>

        <section className="support-panel">
          <h2>Operational Readiness</h2>
          <dl className="state-grid">
            <div>
              <dt>Status</dt>
              <dd>{operations?.status ?? 'loading'}</dd>
            </div>
            <div>
              <dt>Production launch</dt>
              <dd>productionLaunchReady={String(operations?.productionLaunchReady ?? false)}</dd>
            </div>
            <div>
              <dt>Vendor sinks</dt>
              <dd>{operations?.vendorSinksConfigured ? 'configured' : 'not configured'}</dd>
            </div>
            <div>
              <dt>Missing</dt>
              <dd>{operations?.missing.join(', ') ?? 'loading'}</dd>
            </div>
          </dl>
          <p>Support operations can record audit-safe evidence, but cannot access transcripts, final notes, billing detail, coaching outputs, or PHI-bearing payloads.</p>
        </section>
      </section>

      <section className="support-grid" aria-label="Observability and deployment">
        <section className="support-panel">
          <h2>Observability Sinks</h2>
          <div className="analytics-list">
            {(status?.observability.sinks ?? []).map((sink) => (
              <div key={sink.sinkId}>
                <span>{formatSinkLabel(sink.sinkId)}</span>
                <strong>{formatState(sink.status)}</strong>
                <small>
                  {sink.kind}; {sink.adapter}; {sink.delivery}; request-correlated={String(sink.requestCorrelated)}
                </small>
              </div>
            ))}
          </div>
        </section>

        <section className="support-panel">
          <h2>Deployment Matrix</h2>
          <div className="analytics-list">
            {(status?.deployment ?? []).map((environment) => (
              <div key={environment.environment}>
                <span>{formatTitle(environment.environment)}</span>
                <strong>{formatState(environment.readiness)}</strong>
                <small>
                  secrets={environment.secretsRequired.length}; integrations={environment.externalIntegrations.join(', ') || 'none'}; productionDataAllowed=
                  {String(environment.productionDataAllowed)}
                </small>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="support-grid" aria-label="Operational runbooks">
        <section className="support-panel">
          <h2>Runbook Coverage</h2>
          <div className="analytics-list">
            {(status?.runbooks ?? []).map((runbook) => (
              <div key={runbook.runbookId}>
                <span>{runbook.title}</span>
                <strong>{runbook.productionApprovalRequired ? 'approval required' : 'ready'}</strong>
                <small>{runbook.covers.map(formatTitle).join(', ')}</small>
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

      <section className="support-grid" aria-label="Secure storage and restore states">
        <section className="support-panel">
          <h2>Secure Downloads</h2>
          <dl className="state-grid">
            <div>
              <dt>Audit export status</dt>
              <dd>{auditExport?.status ?? 'empty API state'}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>{auditExport?.deliveryMode ?? 'inline_synthetic'}; server-mediated</dd>
            </div>
            <div>
              <dt>Signed download</dt>
              <dd>{String(auditExport?.signedDownloadAvailable ?? false)}</dd>
            </div>
            <div>
              <dt>Storage key</dt>
              <dd>{auditExport?.storageKey ?? 'not configured'}</dd>
            </div>
          </dl>
          <p>Download tokens remain short lived, permission checked, tenant checked, and never public.</p>
        </section>

        <section className="support-panel">
          <h2>Retention and Restore</h2>
          <dl className="state-grid">
            <div>
              <dt>Status</dt>
              <dd>{backup?.status ?? 'loading'}</dd>
            </div>
            <div>
              <dt>Soft delete</dt>
              <dd>{backup?.objectStorageSoftDeleteRequired ? 'required' : 'loading'}</dd>
            </div>
            <div>
              <dt>Versioning</dt>
              <dd>{backup?.objectStorageVersioningRequired ? 'required' : 'loading'}</dd>
            </div>
            <div>
              <dt>Recovery window</dt>
              <dd>recovery window required</dd>
            </div>
            <div>
              <dt>Missing</dt>
              <dd>{backup?.missing.join(', ') ?? 'loading'}</dd>
            </div>
          </dl>
        </section>
      </section>

      <section className="support-grid" aria-label="Operational evidence states">
        <section className="support-panel">
          <h2>Operational Evidence</h2>
          <dl className="state-grid">
            <div>
              <dt>Readiness check</dt>
              <dd>{operations?.status ?? 'loading'}; productionLaunchReady=false</dd>
            </div>
            <div>
              <dt>Incident runbook viewed</dt>
              <dd>{operationalEvidence?.status ?? 'not yet recorded'}</dd>
            </div>
            <div>
              <dt>Evidence PHI safe</dt>
              <dd>{String(operationalEvidence?.phiSafe ?? true)}</dd>
            </div>
            <div>
              <dt>Launch claim</dt>
              <dd>launchReadinessClaimed={String(operationalEvidence?.launchReadinessClaimed ?? false)}</dd>
            </div>
          </dl>
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
              <dt>Clinician denial</dt>
              <dd>{runtime.deniedMessage ?? 'loading'}</dd>
            </div>
          </dl>
        </section>
      </section>

      <section className="support-grid" aria-label="Launch operations readiness">
        <section className="support-panel">
          <h2>Launch Ops Drills</h2>
          <p>Documented review-state material; the active route state above is API-backed.</p>
          <div className="analytics-list">
            {documentedLaunchOpsDrills.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.state}</strong>
                <small>{item.mode}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="support-panel">
          <h2>Performance Baseline</h2>
          <div className="analytics-list">
            {documentedPerformanceBaselines.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.state}</strong>
                <small>{item.mode}</small>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="support-grid" aria-label="Pilot launch gate">
        <section className="support-panel">
          <h2>Pilot Launch Gate</h2>
          <div className="analytics-list">
            {documentedPilotLaunchChecklist.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.state}</strong>
                <small>{item.mode}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="support-panel">
          <h2>Go/No-Go Approvals</h2>
          <div className="analytics-list">
            {documentedPilotApprovals.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.state}</strong>
                <small>{item.mode}</small>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="support-grid" aria-label="Pilot smoke and rollback">
        <section className="support-panel">
          <h2>Pilot Smoke Evidence</h2>
          <div className="analytics-list">
            {documentedPilotGoNoGo.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.state}</strong>
                <small>{item.mode}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="support-panel">
          <h2>Limited Launch Boundary</h2>
          <dl className="state-grid">
            <div>
              <dt>Production launch</dt>
              <dd>productionLaunchApproved=false</dd>
            </div>
            <div>
              <dt>Claim submission</dt>
              <dd>submittedClaim=false</dd>
            </div>
            <div>
              <dt>Live vendors</dt>
              <dd>disabled</dd>
            </div>
          </dl>
          <p>Beta pilot evidence is a decision package only. Live launch still requires founder, clinical, compliance/privacy, and security approval.</p>
        </section>
      </section>

      <section className="support-grid" aria-label="Claim payer decision gate">
        <section className="support-panel">
          <h2>Claim/Payer Decision Gate</h2>
          <div className="analytics-list">
            {documentedClaimDecisionItems.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.state}</strong>
                <small>{item.mode}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="support-panel">
          <h2>Future Claim Approval Criteria</h2>
          <div className="analytics-list">
            {documentedClaimApprovalCriteria.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.state}</strong>
                <small>{item.mode}</small>
              </div>
            ))}
          </div>
          <p>Claim submission, clearinghouse integration, payer API calls, denial automation, payment posting, charge finalization, and medical-necessity determination remain disabled until a later approved work order.</p>
        </section>
      </section>

      <section className="support-grid" aria-label="Feature flags and retention">
        <section className="support-panel">
          <h2>Feature Flags</h2>
          <div className="analytics-list">
            {(status?.featureFlags ?? []).map((flag) => (
              <div key={flag.key}>
                <span>{formatTitle(flag.governs)}</span>
                <strong>{flag.enabled ? 'enabled' : 'disabled'}</strong>
                <small>{flag.disabledReason ?? `default=${String(flag.defaultValue)}`}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="support-panel">
          <h2>Retention Jobs</h2>
          <div className="analytics-list">
            {(status?.retention ?? []).map((policy) => (
              <div key={policy.policyId}>
                <span>{formatTitle(policy.recordClass)}</span>
                <strong>{policy.retentionRule}</strong>
                <small>
                  {policy.enforcedByJob}; purge eligible: {policy.purgeEligibleCount}; destructivePurgeEnabled=
                  {String(policy.destructivePurgeEnabled)}
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
              <dd>{auditExport?.format ?? status?.auditExport.format ?? 'jsonl'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{auditExport?.status ?? 'not requested'}</dd>
            </div>
            <div>
              <dt>PHI</dt>
              <dd>excluded</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>{auditExport?.deliveryMode ?? 'inline_synthetic'}; server-mediated</dd>
            </div>
            <div>
              <dt>Records</dt>
              <dd>{auditExport?.recordCount ?? 'not requested'}</dd>
            </div>
          </dl>
          <p>Compliance users can request a redacted synthetic bundle; downloadable delivery remains short-lived, permission checked, and never public.</p>
        </section>

        <section className="support-panel">
          <h2>Failure States</h2>
          <div className="analytics-list">
            {(status?.failureStates ?? []).map((item) => (
              <div key={item.component}>
                <span>{formatTitle(item.component)}</span>
                <strong>{item.status}</strong>
                <small>{item.operatorMessage} {item.safeDegradedMode}</small>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function formatState(value: string) {
  return value.replace(/_/g, ' ');
}

function formatTitle(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatSinkLabel(sinkId: string) {
  if (sinkId.includes('siem')) return 'Production SIEM';
  if (sinkId.includes('apm')) return 'Production APM';
  return formatTitle(sinkId);
}
