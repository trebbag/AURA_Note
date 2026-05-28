'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const states = [
  'empty',
  'loading',
  'ready',
  'saving',
  'blocked',
  'failed',
  'permission-denied',
  'disabled-user',
  'expired-session',
  'unsafe-config',
  'demo fixture'
];

const highRiskFlags = [
  ['Live transcription', 'AURA_ENABLE_LIVE_TRANSCRIPTION'],
  ['External AI', 'AURA_ENABLE_EXTERNAL_AI'],
  ['EHR writeback', 'AURA_ENABLE_EHR_WRITEBACK'],
  ['Production storage', 'AURA_ENABLE_PRODUCTION_STORAGE'],
  ['Retention deletion', 'AURA_ENABLE_RETENTION_DELETION'],
  ['Patient estimates', 'AURA_ENABLE_PATIENT_FACING_ESTIMATES'],
  ['Claim submission', 'AURA_ENABLE_CLAIM_SUBMISSION']
];

export default function ProductionPlatformPage() {
  const [userState, setUserState] = useState('active admin session');
  const [sessionState, setSessionState] = useState('local synthetic session allowed');
  const [configState, setConfigState] = useState('local config valid; production config unvalidated');
  const [flagState, setFlagState] = useState('all high-risk flags disabled');

  const summary = useMemo(
    () => [
      ['Identity', sessionState],
      ['User status', userState],
      ['Config', configState],
      ['Flags', flagState]
    ],
    [configState, flagState, sessionState, userState]
  );

  return (
    <main className="operations-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">P8 / WO-041</p>
          <h1>Production Platform Controls</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <Link href="/aura-note/schedule">Schedule</Link>
          <Link href="/aura-note/operations">Operations</Link>
          <Link href="/aura-note/support/status">Support</Link>
          <Link href="/aura-note/drafts">Draft Notes</Link>
        </nav>
      </header>

      <section className="status-band" aria-label="Production platform readiness">
        <div>
          <h2>Production-Shaped Controls</h2>
          <p>
            Identity, secrets, configuration, and feature-flag governance are synthetic and fail closed. No live IdP,
            ClinicOS delegation, external AI, production storage, writeback, retention deletion, or claim submission is
            enabled.
          </p>
        </div>
        <dl>
          <div>
            <dt>Mode</dt>
            <dd>standalone plus ClinicOS adapter boundary</dd>
          </div>
          <div>
            <dt>Credentials</dt>
            <dd>not returned</dd>
          </div>
          <div>
            <dt>Live execution</dt>
            <dd>disabled</dd>
          </div>
        </dl>
      </section>

      <section className="builder-grid" aria-label="Platform work areas">
        <article className="appointment-form" aria-label="Identity and sessions">
          <h2>Identity And Sessions</h2>
          <p>OIDC, SAML, and ClinicOS delegation are adapter states only until configured.</p>
          <div className="state-grid">
            <span>local_dev: ready_local</span>
            <span>oidc: disabled_until_configured</span>
            <span>saml: disabled_until_configured</span>
            <span>clinicos_delegate: fail closed</span>
          </div>
          <div className="action-row">
            <button type="button" onClick={() => setUserState('disabled user blocked')}>
              Disable User
            </button>
            <button type="button" onClick={() => setSessionState('session expired')}>
              Expire Session
            </button>
            <button type="button" onClick={() => setSessionState('purpose-of-use is required')}>
              Missing Purpose
            </button>
          </div>
          <strong>{userState}</strong>
          <span>{sessionState}</span>
        </article>

        <article className="appointment-form" aria-label="Config and secrets">
          <h2>Config And Secrets</h2>
          <p>Secret-source checks validate metadata only and never expose token, client-secret, or key values.</p>
          <div className="state-grid">
            <span>OIDC_CLIENT_SECRET: not_configured</span>
            <span>AZURE_STORAGE_CREDENTIAL_SOURCE: metadata only</span>
            <span>LIVE_TRANSCRIPTION_PROVIDER_SECRET: missing</span>
            <span>secretValuesReturned=false</span>
          </div>
          <div className="action-row">
            <button type="button" onClick={() => setConfigState('fail-closed missing OIDC_CLIENT_SECRET')}>
              Validate Production Config
            </button>
          </div>
          <strong>{configState}</strong>
        </article>

        <article className="appointment-form" aria-label="Feature flag governance">
          <h2>Feature Flag Governance</h2>
          <p>High-risk flags default disabled and require approval evidence before metadata-only enablement.</p>
          <div className="state-grid">
            {highRiskFlags.map(([label, key]) => (
              <span key={key}>
                {label}: disabled
              </span>
            ))}
          </div>
          <div className="action-row">
            <button type="button" onClick={() => setFlagState('approval required')}>
              Attempt Enable Without Approval
            </button>
            <button type="button" onClick={() => setFlagState('metadata_only_no_live_execution')}>
              Record Approval
            </button>
          </div>
          <strong>{flagState}</strong>
        </article>

        <article className="appointment-form" aria-label="Permission states">
          <h2>Permission States</h2>
          <p>Clinicians, MAs, billing, support, and ordinary delegated users cannot manage high-risk platform controls.</p>
          <section className="state-grid" aria-label="Screen states">
            {states.map((state) => (
              <span key={state} className="state-pill">
                {state}
              </span>
            ))}
          </section>
        </article>
      </section>

      <section className="status-band" aria-label="Platform summary">
        <div>
          <h2>Current Synthetic State</h2>
          <p>
            These controls are review evidence only. Production SSO, production secret manager, live ClinicOS identity,
            live vendor execution, and production account recovery require later security approval.
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
    </main>
  );
}
