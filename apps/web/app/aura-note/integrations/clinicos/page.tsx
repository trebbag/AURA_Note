'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ClinicOsIntegrationStatusDto, ClinicOsPublishedEventDto } from '@aura-note/contracts';
import { createAuraNoteApiClient } from '../../../../lib/aura-note-api-client';

const screenStates = [
  'empty',
  'loading',
  'ready',
  'saving',
  'degraded',
  'failed',
  'permission-denied',
  'disabled',
  'stale mapping',
  'read-only',
  'demo fixture'
];

export default function ClinicOsIntegrationPage() {
  const adminClient = useMemo(() => createAuraNoteApiClient({ role: 'authorized_admin' }), []);
  const degradedClient = useMemo(
    () => createAuraNoteApiClient({ role: 'authorized_admin', clinicOsMode: 'clinicos_integrated', clinicOsDegraded: true }),
    []
  );
  const unavailableClient = useMemo(
    () => createAuraNoteApiClient({ role: 'authorized_admin', clinicOsMode: 'clinicos_integrated', clinicOsUnavailable: true }),
    []
  );
  const clinicianClient = useMemo(() => createAuraNoteApiClient({ role: 'clinician' }), []);
  const [status, setStatus] = useState<ClinicOsIntegrationStatusDto | null>(null);
  const [lastPublishedEvent, setLastPublishedEvent] = useState<ClinicOsPublishedEventDto | null>(null);
  const [routeState, setRouteState] = useState('loading');
  const [message, setMessage] = useState('Loading ClinicOS adapter status from API.');

  const refreshClinicOs = useCallback(async () => {
    setRouteState('loading');
    try {
      const response = await adminClient.getClinicOsStatus();
      setStatus(response.data);
      setRouteState(response.data.modeContext.availability === 'available' ? 'ready' : 'degraded');
      setMessage('ClinicOS disabled/degraded state loaded from typed API; standalone AURA Note remains authoritative.');
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'ClinicOS API load failed.');
    }
  }, [adminClient]);

  useEffect(() => {
    void refreshClinicOs();
  }, [refreshClinicOs]);

  async function runAction(label: string, action: () => Promise<unknown>) {
    setRouteState('saving');
    try {
      const result = await action();
      const maybePublished = result as { data?: { publishedEvent?: ClinicOsPublishedEventDto } };
      await refreshClinicOs();
      if (maybePublished.data?.publishedEvent) {
        setLastPublishedEvent(maybePublished.data.publishedEvent);
        setRouteState(
          maybePublished.data.publishedEvent.status === 'failed_unavailable'
            ? 'failed'
            : maybePublished.data.publishedEvent.status === 'degraded'
              ? 'degraded'
              : 'ready'
        );
      }
      setMessage(label);
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : label);
    }
  }

  function reviewStale() {
    void runAction('Stale mapping review recorded through API; local blocker remains authoritative until sync is approved.', () =>
      adminClient.upsertClinicOsMapping({
        localObjectType: 'task',
        localObjectId: 'task-ma-follow-up-001',
        clinicosModuleId: 'M04',
        status: 'stale',
        reason: 'WO-064 stale mapping review; local blocker remains authoritative'
      })
    );
  }

  function markUnavailable() {
    void runAction('ClinicOS unavailable mapping recorded through API; standalone schedule and note lifecycle continue safely.', () =>
      adminClient.upsertClinicOsMapping({
        localObjectType: 'appointment',
        localObjectId: 'appt-demo-001',
        clinicosModuleId: 'M03',
        status: 'unavailable',
        reason: 'WO-064 unavailable mapping evidence'
      })
    );
  }

  function markFailed() {
    void runAction('Failed ClinicOS mapping metadata recorded through API without raw payload storage.', () =>
      adminClient.upsertClinicOsMapping({
        localObjectType: 'event',
        localObjectId: 'ehr-wb-pending-001',
        clinicosModuleId: 'M25',
        status: 'failed',
        reason: 'WO-064 failed publication metadata evidence'
      })
    );
  }

  function queueMockEvent() {
    void runAction('Mock publication queued through API as metadata only.', () =>
      adminClient.publishClinicOsEvent({ eventType: 'note.signed.v1', targetModules: ['M17'] })
    );
  }

  function publishDegraded() {
    void runAction('ClinicOS degraded publication recorded through API; AURA Note remains read-only for delegated state.', () =>
      degradedClient.publishClinicOsEvent({ eventType: 'ehr.writeback_approval_recorded.v1', targetModules: ['M25'] })
    );
  }

  function failedClosed() {
    void runAction('ClinicOS unavailable publication failed closed through API.', () =>
      unavailableClient.publishClinicOsEvent({ eventType: 'clinicos.unavailable.v1', targetModules: ['M17'] })
    );
  }

  async function verifyPermissionDeniedState() {
    setRouteState('loading');
    try {
      await clinicianClient.upsertClinicOsMapping({
        localObjectType: 'task',
        localObjectId: 'task-denied',
        clinicosModuleId: 'M04',
        status: 'active',
        reason: 'Clinician should not write ClinicOS mappings'
      });
      setRouteState('failed');
      setMessage('Unexpected clinician ClinicOS mapping write succeeded.');
    } catch (error) {
      setRouteState('permission-denied');
      setMessage(error instanceof Error ? error.message : 'Clinician ClinicOS mapping write denied by API.');
    }
  }

  const summary = [
    ['Host modes', status?.modeContext.hostMode ?? 'standalone / ClinicOS-integrated / EHR-embedded / hybrid'],
    ['Live sync', String(status?.liveClinicOsSyncEnabled ?? false)],
    ['Raw payload storage', String(status?.rawPayloadsStored ?? false)],
    ['Permission boundary', status?.permissionsStillEnforcedByAuraNote ? 'AURA Note authoritative' : 'not loaded']
  ];

  return (
    <main className="operations-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">CR-2 / WO-064</p>
          <h1>ClinicOS Integration Hardening</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <Link href="/aura-note">Dashboard</Link>
          <Link href="/aura-note/schedule">Schedule</Link>
          <Link href="/aura-note/operations">Operations</Link>
          <Link href="/aura-note/integrations/ehr">EHR</Link>
          <Link href="/aura-note/platform">Platform</Link>
          <Link href="/aura-note/support/status">Support</Link>
        </nav>
      </header>

      <section className="figma-drafts-source-shell figma-platform-settings-shell" aria-label="Figma ClinicOS integration settings workspace">
        <header className="figma-drafts-source-header">
          <div>
            <h2>ClinicOS Integration Settings</h2>
            <p>Standalone and ClinicOS-integrated modes share one AURA Note runtime with adapter-enforced boundaries.</p>
          </div>
          <div className="figma-drafts-header-actions">
            <span>{status?.modeContext.hostMode ?? 'standalone + integrated'}</span>
            <span className="figma-readonly-badge">AURA permissions enforced</span>
          </div>
        </header>

        <div className="figma-tab-strip" role="tablist" aria-label="ClinicOS integration settings tabs">
          {['Mode', 'Mappings', 'Modules', 'Events', 'Fallback', 'Permissions'].map((tab, index) => (
            <button key={tab} type="button" role="tab" aria-selected={index === 0} className={index === 0 ? 'selected-tab' : 'secondary-button'}>
              {tab}
            </button>
          ))}
        </div>

        <section className="figma-settings-matrix" aria-label="API-backed ClinicOS integration cards">
          <div>
            <strong>Mode Resolution</strong>
            <span>{status?.modeContext.availability ?? routeState}</span>
            <small>Standalone remains authoritative when ClinicOS is unavailable.</small>
          </div>
          <div>
            <strong>Module Boundaries</strong>
            <span>{status?.moduleBoundaries.map((boundary) => boundary.moduleId).join(', ') ?? 'loading'}</span>
            <small>M03, M04, M17, M21, M23, M24, M25, and M26 map through adapters.</small>
          </div>
          <div>
            <strong>Mapping Review</strong>
            <span>{status?.mappings.map((mapping) => `${mapping.clinicosModuleId}:${mapping.status}`).join(', ') ?? 'loading'}</span>
            <small>Stale mappings do not override local blockers.</small>
          </div>
          <div>
            <strong>Event Publication</strong>
            <span>{lastPublishedEvent?.status ?? status?.publishedEvents.at(-1)?.status ?? 'skipped_disabled'}</span>
            <small>Raw payloads are excluded from browser/support views.</small>
          </div>
          <div>
            <strong>Permission Boundary</strong>
            <span>{status?.permissionsStillEnforcedByAuraNote ? 'AURA Note authoritative' : 'loading'}</span>
            <small>ClinicOS cannot bypass AURA Note RBAC/ABAC.</small>
          </div>
          <div>
            <strong>Live Sync</strong>
            <span>{String(status?.liveClinicOsSyncEnabled ?? false)}</span>
            <small>Live ClinicOS sync remains disabled until governed approval.</small>
          </div>
        </section>
      </section>

      <section className="status-band" aria-label="ClinicOS integration readiness">
        <div>
          <h2>One Product, Two Host Modes</h2>
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

      <section className="builder-grid" aria-label="ClinicOS module boundaries">
        <article className="appointment-form" aria-label="Module boundary map">
          <h2>Module Boundaries</h2>
          <div className="analytics-list">
            {(status?.moduleBoundaries ?? []).map((boundary) => (
              <div key={boundary.moduleId}>
                <span>
                  {boundary.moduleId} / {boundary.moduleName}
                </span>
                <strong>{boundary.sourceOfTruth}</strong>
                <small>{boundary.maps} / {boundary.permissionBoundary}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="appointment-form" aria-label="ClinicOS mappings">
          <h2>Mapping Review</h2>
          <p>{message}</p>
          <div className="analytics-list">
            {(status?.mappings ?? []).map((mapping) => (
              <div key={mapping.mappingId}>
                <span>
                  {mapping.clinicosModuleId} / {mapping.localObjectId}
                </span>
                <strong>{mapping.status}</strong>
                <small>{mapping.staleReason ?? mapping.degradedReason ?? mapping.sourceOfTruth}</small>
              </div>
            ))}
          </div>
          <div className="action-row">
            <button type="button" onClick={reviewStale}>
              Review Stale
            </button>
            <button type="button" onClick={markUnavailable}>
              Mark Unavailable
            </button>
            <button type="button" className="secondary-action" onClick={markFailed}>
              Mark Failed
            </button>
          </div>
        </article>

        <article className="appointment-form" aria-label="Publication metadata">
          <h2>Publication Metadata</h2>
          <p>Published event status: {lastPublishedEvent?.status ?? status?.publishedEvents.at(-1)?.status ?? 'skipped_disabled'}</p>
          <div className="state-grid">
            <span>payloadStored=false</span>
            <span>permissionBoundaryEnforced=true</span>
            <span>liveClinicOsSyncEnabled=false</span>
            <span>raw ClinicOS payloads: excluded</span>
            <span>support view: operational metadata only</span>
            <span>service account: scoped, denied cross tenant</span>
          </div>
          <div className="action-row">
            <button type="button" onClick={queueMockEvent}>
              Queue Mock Event
            </button>
            <button type="button" onClick={publishDegraded}>
              Degraded
            </button>
            <button type="button" className="secondary-action" onClick={failedClosed}>
              Failed Closed
            </button>
          </div>
        </article>

        <article className="appointment-form" aria-label="ClinicOS screen states">
          <h2>Screen States</h2>
          <section className="state-grid" aria-label="ClinicOS route states">
            {screenStates.map((state) => (
              <span key={state} className="state-pill">
                {state}
              </span>
            ))}
          </section>
          <button type="button" className="secondary-action" onClick={() => void verifyPermissionDeniedState()}>
            Verify Permission Denied
          </button>
        </article>
      </section>

      <section className="status-band" aria-label="ClinicOS safety summary">
        <div>
          <h2>Safety Summary</h2>
          <p>
            This route is synthetic integration evidence. It does not build ClinicOS modules, enable live event bus
            delivery, send raw PHI, trigger writeback, finalize codes, determine medical necessity, or submit claims.
          </p>
        </div>
        <dl>
          <div>
            <dt>Standalone fallback</dt>
            <dd>authoritative</dd>
          </div>
          <div>
            <dt>Embedded context</dt>
            <dd>metadata only</dd>
          </div>
          <div>
            <dt>ClinicOS bypass</dt>
            <dd>denied</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
