'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type MappingStatus = 'active' | 'stale' | 'degraded' | 'unavailable' | 'failed';
type PublicationStatus = 'queued' | 'skipped_disabled' | 'failed_unavailable' | 'degraded';

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

const moduleBoundaries = [
  ['M03', 'VisitGraph', 'appointment and visit context', 'clinicos'],
  ['M04', 'WorkOS Tasks', 'blocker tasks and MA follow-up', 'clinicos'],
  ['M17', 'NP Cockpit', 'workspace launch context', 'clinicos'],
  ['M21', 'Charge Integrity', 'draft claim preview metadata', 'clinicos'],
  ['M23', 'Copilot Runtime', 'AI request metadata only', 'clinicos'],
  ['M24', 'AI Governance', 'prompt and review metadata', 'clinicos'],
  ['M25', 'Integration Hub', 'EHR and writeback metadata', 'hybrid'],
  ['M26', 'Data Cloud', 'coaching and analytics metadata', 'clinicos']
];

const initialMappings: Array<{
  id: string;
  module: string;
  object: string;
  status: MappingStatus;
  reason: string;
}> = [
  {
    id: 'clinicos-map-active-m03-001',
    module: 'M03 VisitGraph',
    object: 'appt-demo-001',
    status: 'active',
    reason: 'Synthetic appointment context is mapped.'
  },
  {
    id: 'clinicos-map-stale-m04-001',
    module: 'M04 WorkOS',
    object: 'task-ma-follow-up-001',
    status: 'stale',
    reason: 'Local blocker task is newer than the ClinicOS projection.'
  },
  {
    id: 'clinicos-map-degraded-m25-001',
    module: 'M25 Integration Hub',
    object: 'ehr-wb-pending-001',
    status: 'degraded',
    reason: 'Live writeback routing is disabled; metadata only.'
  }
];

export default function ClinicOsIntegrationPage() {
  const [mappings, setMappings] = useState(initialMappings);
  const [publicationStatus, setPublicationStatus] = useState<PublicationStatus>('skipped_disabled');
  const [message, setMessage] = useState('ClinicOS disabled state loaded; standalone AURA Note remains authoritative.');

  const summary = useMemo(
    () => [
      ['Host modes', 'standalone / ClinicOS-integrated / EHR-embedded / hybrid'],
      ['Live sync', 'disabled'],
      ['Raw payload storage', 'false'],
      ['Permission boundary', 'AURA Note authoritative']
    ],
    []
  );

  function updateMapping(id: string, status: MappingStatus, reason: string) {
    setMappings((current) => current.map((mapping) => (mapping.id === id ? { ...mapping, status, reason } : mapping)));
    setMessage(reason);
  }

  function publish(status: PublicationStatus, messageText: string) {
    setPublicationStatus(status);
    setMessage(messageText);
  }

  return (
    <main className="operations-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">P9 / WO-045</p>
          <h1>ClinicOS Integration Hardening</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <Link href="/aura-note/schedule">Schedule</Link>
          <Link href="/aura-note/operations">Operations</Link>
          <Link href="/aura-note/integrations/ehr">EHR</Link>
          <Link href="/aura-note/platform">Platform</Link>
          <Link href="/aura-note/support/status">Support</Link>
        </nav>
      </header>

      <section className="status-band" aria-label="ClinicOS integration readiness">
        <div>
          <h2>One Product, Two Host Modes</h2>
          <p>
            AURA Note can run standalone or embedded, but ClinicOS context is metadata only here and never bypasses AURA
            Note permissions, finalization gates, PHI controls, or human approval.
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

      <section className="builder-grid" aria-label="ClinicOS module boundaries">
        <article className="appointment-form" aria-label="Module boundary map">
          <h2>Module Boundaries</h2>
          <div className="analytics-list">
            {moduleBoundaries.map(([id, name, maps, source]) => (
              <div key={id}>
                <span>
                  {id} / {name}
                </span>
                <strong>{source}</strong>
                <small>{maps} / aura_note_authoritative</small>
              </div>
            ))}
          </div>
        </article>

        <article className="appointment-form" aria-label="ClinicOS mappings">
          <h2>Mapping Review</h2>
          <p>{message}</p>
          <div className="analytics-list">
            {mappings.map((mapping) => (
              <div key={mapping.id}>
                <span>
                  {mapping.module} / {mapping.object}
                </span>
                <strong>{mapping.status}</strong>
                <small>{mapping.reason}</small>
              </div>
            ))}
          </div>
          <div className="action-row">
            <button
              type="button"
              onClick={() =>
                updateMapping(
                  'clinicos-map-stale-m04-001',
                  'active',
                  'Stale mapping review recorded; local blocker remains authoritative until sync is approved.'
                )
              }
            >
              Review Stale
            </button>
            <button
              type="button"
              onClick={() =>
                updateMapping(
                  'clinicos-map-active-m03-001',
                  'unavailable',
                  'ClinicOS unavailable; standalone schedule and note lifecycle continue safely.'
                )
              }
            >
              Mark Unavailable
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={() =>
                updateMapping(
                  'clinicos-map-degraded-m25-001',
                  'failed',
                  'Failed publication metadata recorded without raw ClinicOS payload storage.'
                )
              }
            >
              Mark Failed
            </button>
          </div>
        </article>

        <article className="appointment-form" aria-label="Publication metadata">
          <h2>Publication Metadata</h2>
          <p>Published event status: {publicationStatus}</p>
          <div className="state-grid">
            <span>payloadStored=false</span>
            <span>permissionBoundaryEnforced=true</span>
            <span>liveClinicOsSyncEnabled=false</span>
            <span>raw ClinicOS payloads: excluded</span>
            <span>support view: operational metadata only</span>
            <span>service account: scoped, denied cross tenant</span>
          </div>
          <div className="action-row">
            <button type="button" onClick={() => publish('queued', 'Mock publication queued as metadata only.')}>
              Queue Mock Event
            </button>
            <button
              type="button"
              onClick={() => publish('degraded', 'ClinicOS degraded; AURA Note remains read-only for delegated state.')}
            >
              Degraded
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={() => publish('failed_unavailable', 'Publication failed closed because ClinicOS is unavailable.')}
            >
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
