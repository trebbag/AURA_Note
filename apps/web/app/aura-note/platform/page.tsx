'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PlatformAdminViewDto, PlatformActionResponseDto } from '@aura-note/contracts';
import { createAuraNoteApiClient } from '../../../lib/aura-note-api-client';

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

export default function ProductionPlatformPage() {
  const adminClient = useMemo(() => createAuraNoteApiClient({ role: 'admin' }), []);
  const clinicianClient = useMemo(() => createAuraNoteApiClient({ role: 'clinician' }), []);
  const [platform, setPlatform] = useState<PlatformAdminViewDto | null>(null);
  const [lastAction, setLastAction] = useState<PlatformActionResponseDto | null>(null);
  const [routeState, setRouteState] = useState('loading');
  const [message, setMessage] = useState('Loading platform controls through API.');

  const refreshPlatform = useCallback(async () => {
    setRouteState('loading');
    try {
      const response = await adminClient.getPlatformAdmin();
      setPlatform(response.data);
      setRouteState('ready');
      setMessage('Production-shaped controls loaded from typed API state.');
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : 'Platform API load failed.');
    }
  }, [adminClient]);

  useEffect(() => {
    void refreshPlatform();
  }, [refreshPlatform]);

  async function runAction(label: string, action: () => Promise<{ data: PlatformActionResponseDto }>) {
    setRouteState('saving');
    try {
      const response = await action();
      setLastAction(response.data);
      if (response.data.platform) setPlatform(response.data.platform);
      setMessage(label);
      setRouteState('ready');
    } catch (error) {
      setRouteState('failed');
      setMessage(error instanceof Error ? error.message : label);
    }
  }

  function disableUser() {
    const user = platform?.users.find((candidate) => candidate.status === 'active');
    if (!user) return;
    void runAction('Disabled user blocked through API identity controls.', () =>
      adminClient.updateWorkforceUser(user.userId, {
        status: 'disabled',
        reason: 'WO-064 platform route disabled-user evidence'
      })
    );
  }

  function expireSession() {
    const user = platform?.users.find((candidate) => candidate.status === 'active') ?? platform?.users[0];
    if (!user) return;
    void runAction('Expired session evaluated through API.', () =>
      adminClient.evaluateSession({
        userId: user.userId,
        tenantId: user.tenantId,
        siteId: user.siteIds[0] ?? 'site-synthetic-primary',
        sessionId: 'session-expired-platform-route',
        identityProviderMode: 'local_synthetic',
        purposeOfUse: 'operations',
        expiresAt: '2026-05-27T00:00:00.000Z'
      })
    );
  }

  function missingPurpose() {
    const user = platform?.users.find((candidate) => candidate.status === 'active') ?? platform?.users[0];
    if (!user) return;
    void runAction('Missing purpose-of-use evaluated through API.', () =>
      adminClient.evaluateSession({
        userId: user.userId,
        tenantId: user.tenantId,
        siteId: user.siteIds[0] ?? 'site-synthetic-primary',
        sessionId: 'session-missing-purpose-platform-route',
        identityProviderMode: 'local_synthetic',
        expiresAt: '2026-05-28T00:00:00.000Z'
      })
    );
  }

  function validateProductionConfig() {
    if (!platform) return;
    void runAction('Production config validation failed closed through API.', () =>
      adminClient.validateProductionConfig({
        environment: 'production',
        secretSources: platform.secretSources,
        highRiskFlags: platform.featureFlags
      })
    );
  }

  function attemptEnableWithoutApproval() {
    const flag = platform?.featureFlags.find((candidate) => candidate.key === 'AURA_ENABLE_CLAIM_SUBMISSION') ?? platform?.featureFlags[0];
    if (!flag) return;
    void runAction('High-risk flag enablement without approval denied by API.', () =>
      adminClient.updateFeatureFlag(flag.key, {
        enabled: true,
        reason: 'WO-064 route attempts unsafe enablement without approval'
      })
    );
  }

  function recordApproval() {
    const flag = platform?.featureFlags.find((candidate) => candidate.key === 'AURA_ENABLE_PRODUCTION_STORAGE') ?? platform?.featureFlags[0];
    if (!flag) return;
    void runAction('Feature-flag approval metadata recorded through API without live execution.', () =>
      adminClient.updateFeatureFlag(flag.key, {
        enabled: true,
        approvalId: 'approval-wo-064-metadata-only',
        reason: 'WO-064 metadata-only approval evidence'
      })
    );
  }

  async function verifyPermissionDeniedState() {
    setRouteState('loading');
    try {
      await clinicianClient.updateFeatureFlag('AURA_ENABLE_EXTERNAL_AI', {
        enabled: true,
        approvalId: 'approval-should-deny',
        reason: 'Clinician cannot manage high-risk platform flags'
      });
      setRouteState('failed');
      setMessage('Unexpected clinician feature-flag update succeeded.');
    } catch (error) {
      setRouteState('permission-denied');
      setMessage(error instanceof Error ? error.message : 'Clinician feature-flag update denied by API.');
    }
  }

  const summary = [
    ['Identity', platform?.identityAdapters.map((adapter) => `${adapter.kind}:${adapter.status}`).join(', ') ?? 'not loaded'],
    ['Users', platform?.users.map((user) => `${user.role}:${user.status}`).join(', ') ?? 'not loaded'],
    ['Config', lastAction?.configValidation ? `valid=${String(lastAction.configValidation.valid)}` : 'not validated'],
    ['Flags', platform?.featureFlags.map((flag) => `${flag.key}:${flag.runtimeEffect}`).join(', ') ?? 'not loaded']
  ];

  return (
    <main className="operations-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">CR-2 / WO-064</p>
          <h1>Production Platform Controls</h1>
        </div>
        <nav className="header-nav" aria-label="AURA Note sections">
          <Link href="/aura-note">Runtime Home</Link>
          <Link href="/aura-note/schedule">Schedule</Link>
          <Link href="/aura-note/operations">Operations</Link>
          <Link href="/aura-note/support/status">Support</Link>
          <Link href="/aura-note/drafts">Draft Notes</Link>
        </nav>
      </header>

      <section className="status-band" aria-label="Production platform readiness">
        <div>
          <h2>Production-Shaped Controls</h2>
          <p>{message}</p>
        </div>
        <dl>
          <div>
            <dt>Route State</dt>
            <dd>{routeState}</dd>
          </div>
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
            {platform?.identityAdapters.map((adapter) => (
              <span key={adapter.adapterId}>
                {adapter.kind}: {adapter.status}
              </span>
            ))}
            <span>clinicos_delegate: fail closed</span>
          </div>
          <div className="action-row">
            <button type="button" onClick={disableUser}>
              Disable User
            </button>
            <button type="button" onClick={expireSession}>
              Expire Session
            </button>
            <button type="button" onClick={missingPurpose}>
              Missing Purpose
            </button>
          </div>
          <strong>{lastAction?.user ? `${lastAction.user.userId}:${lastAction.user.status}` : 'active admin session'}</strong>
          {lastAction?.user?.disabledUserBlocked ? <span>disabled user blocked</span> : null}
          <span>{lastAction?.sessionDecision?.denialReason ?? 'local synthetic session allowed'}</span>
        </article>

        <article className="appointment-form" aria-label="Config and secrets">
          <h2>Config And Secrets</h2>
          <p>Secret-source checks validate metadata only and never expose token, client-secret, or key values.</p>
          <div className="state-grid">
            {platform?.secretSources.map((source) => (
              <span key={source.secretName}>
                {source.secretName}: {source.source}
              </span>
            ))}
            <span>secretValuesReturned=false</span>
          </div>
          <div className="action-row">
            <button type="button" onClick={validateProductionConfig}>
              Validate Production Config
            </button>
          </div>
          <strong>{lastAction?.configValidation ? `fail-closed errors=${lastAction.configValidation.errors.length}` : 'local config valid; production config unvalidated'}</strong>
        </article>

        <article className="appointment-form" aria-label="Feature flag governance">
          <h2>Feature Flag Governance</h2>
          <p>High-risk flags default disabled and require approval evidence before metadata-only enablement.</p>
          <div className="state-grid">
            {platform?.featureFlags.map((flag) => (
              <span key={flag.key}>
                {formatFeatureFlagLabel(flag.key)}: {flag.runtimeEffect}
              </span>
            ))}
          </div>
          <div className="action-row">
            <button type="button" onClick={attemptEnableWithoutApproval}>
              Attempt Enable Without Approval
            </button>
            <button type="button" onClick={recordApproval}>
              Record Approval
            </button>
          </div>
          <strong>{lastAction?.featureFlag ? `${lastAction.featureFlag.key}:${lastAction.featureFlag.runtimeEffect}` : 'all high-risk flags disabled'}</strong>
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
          <button type="button" className="secondary-action" onClick={() => void verifyPermissionDeniedState()}>
            Verify Permission Denied
          </button>
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

function formatFeatureFlagLabel(key: string) {
  return key
    .replace('AURA_ENABLE_', '')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\w/, (match) => match.toUpperCase());
}
