import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildExternalIntegrationFeatureFlags,
  buildLocalObservabilitySnapshot,
  authorizeTenantScope,
  canPerform,
  canViewCoaching,
  canViewFinalNote,
  canViewTranscript,
  containsForbiddenPhiKeys,
  containsForbiddenPhiText,
  createMetricProbe,
  createSyntheticLocalSession,
  createStructuredLogEntry,
  createTraceProbe,
  evaluateProductionIdentityGuard,
  redactForStructuredLog,
  redactForbiddenPhi,
  redactForbiddenPhiKeys,
  scanForForbiddenPhiKeys,
  scanForForbiddenPhiText
} from './index';

describe('synthetic local identity boundary', () => {
  it('creates a tenant-scoped session from local synthetic headers', () => {
    const session = createSyntheticLocalSession(
      {
        'x-aura-role': 'clinician',
        'x-aura-user-id': 'user-clinician-synthetic-001',
        'x-aura-session-id': 'session-local-001',
        'x-aura-tenant-id': 'tenant-synthetic-primary',
        'x-aura-site-id': 'site-synthetic-primary',
        'x-aura-purpose-of-use': 'treatment'
      },
      {
        defaultTenantId: 'tenant-synthetic-primary',
        defaultSiteId: 'site-synthetic-primary',
        requestId: 'req-test',
        traceId: 'trace-test'
      }
    );

    assert.equal(session.tenantScopeAllowed, true);
    assert.equal(session.identityProviderMode, 'local_synthetic');
    assert.equal(session.access.tenantId, 'tenant-synthetic-primary');
    assert.equal(session.access.siteId, 'site-synthetic-primary');
    assert.equal(session.access.actorUserId, 'user-clinician-synthetic-001');
    assert.equal(session.access.sessionId, 'session-local-001');
    assert.equal(session.access.purposeOfUse, 'treatment');
    assert.equal(session.access.treatingClinician, true);
  });

  it('denies cross-tenant and delegated identity access until configured', () => {
    const crossTenant = createSyntheticLocalSession(
      {
        'x-aura-role': 'clinician',
        'x-aura-tenant-id': 'tenant-other'
      },
      {
        defaultTenantId: 'tenant-synthetic-primary',
        defaultSiteId: 'site-synthetic-primary',
        requestId: 'req-test',
        traceId: 'trace-test'
      }
    );
    const delegated = createSyntheticLocalSession(
      {
        'x-aura-role': 'clinician',
        'x-aura-identity-provider': 'oidc_delegate'
      },
      {
        defaultTenantId: 'tenant-synthetic-primary',
        defaultSiteId: 'site-synthetic-primary',
        requestId: 'req-test',
        traceId: 'trace-test'
      }
    );

    assert.equal(crossTenant.tenantScopeAllowed, false);
    assert.match(crossTenant.denialReason ?? '', /cross-tenant/);
    assert.equal(delegated.tenantScopeAllowed, false);
    assert.match(delegated.denialReason ?? '', /delegated identity/);
  });

  it('authorizes only matching tenant-scoped resources', () => {
    const session = createSyntheticLocalSession(
      { 'x-aura-role': 'authorized_admin' },
      {
        defaultTenantId: 'tenant-synthetic-primary',
        defaultSiteId: 'site-synthetic-primary',
        requestId: 'req-test',
        traceId: 'trace-test'
      }
    );

    assert.deepEqual(authorizeTenantScope(session.access, { tenantId: 'tenant-synthetic-primary' }), {
      allowed: true
    });
    assert.deepEqual(authorizeTenantScope(session.access, { tenantId: 'tenant-other' }), {
      allowed: false,
      reason: 'cross-tenant access denied'
    });
    assert.deepEqual(authorizeTenantScope(session.access, { tenantId: 'tenant-synthetic-primary', siteId: 'site-other' }), {
      allowed: false,
      reason: 'cross-site access denied'
    });
  });
});

describe('role-limited transcript access', () => {
  it('allows treating clinicians linked to the visit', () => {
    assert.equal(
      canViewTranscript({
        role: 'clinician',
        linkedToPatient: true,
        linkedToVisit: true,
        treatingClinician: true,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      true
    );
  });

  it('denies billing staff unless billing review is triggered', () => {
    const base = {
      role: 'billing_staff' as const,
      linkedToPatient: true,
      linkedToVisit: true,
      treatingClinician: false,
      authorizedAdmin: false
    };

    assert.equal(canViewTranscript({ ...base, billingReviewTriggered: false }), false);
    assert.equal(canViewTranscript({ ...base, billingReviewTriggered: true }), true);
  });
});

describe('audio capture and transcription permissions', () => {
  it('limits recording, transcription, and correction actions to linked clinicians or authorized roles', () => {
    const clinician = {
      role: 'clinician' as const,
      linkedToPatient: true,
      linkedToVisit: true,
      treatingClinician: true,
      billingReviewTriggered: false,
      authorizedAdmin: false
    };
    const billing = {
      ...clinician,
      role: 'billing_staff' as const,
      treatingClinician: false,
      billingReviewTriggered: true
    };
    const support = {
      ...clinician,
      role: 'support' as const,
      treatingClinician: false,
      linkedToPatient: false,
      linkedToVisit: false
    };

    assert.equal(canPerform('recording:control', clinician), true);
    assert.equal(canPerform('recording:chunk', clinician), true);
    assert.equal(canPerform('transcription:process', clinician), true);
    assert.equal(canPerform('transcript:correct', clinician), true);
    assert.equal(canPerform('recording:control', billing), false);
    assert.equal(canPerform('transcript:correct', billing), false);
    assert.equal(canPerform('transcription_provider:view', support), false);
  });
});

describe('final note and coaching access', () => {
  it('requires patient or visit linkage for final note visibility unless authorized admin', () => {
    assert.equal(
      canViewFinalNote({
        role: 'ma',
        linkedToPatient: false,
        linkedToVisit: false,
        treatingClinician: false,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      false
    );

    assert.equal(
      canViewFinalNote({
        role: 'ma',
        linkedToPatient: false,
        linkedToVisit: true,
        treatingClinician: false,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      true
    );

    assert.equal(
      canViewFinalNote({
        role: 'support',
        linkedToPatient: true,
        linkedToVisit: true,
        treatingClinician: false,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      false
    );
  });

  it('limits coaching to own clinician report or authorized admin dashboard', () => {
    assert.equal(
      canViewCoaching({
        role: 'clinician',
        linkedToPatient: false,
        linkedToVisit: false,
        treatingClinician: false,
        billingReviewTriggered: false,
        authorizedAdmin: false,
        ownCoachingReport: true
      }),
      true
    );

    assert.equal(
      canPerform('coaching_dashboard:view', {
        role: 'admin',
        linkedToPatient: false,
        linkedToVisit: false,
        treatingClinician: false,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      false
    );

    assert.equal(
      canPerform('coaching_own:view', {
        role: 'billing_staff',
        linkedToPatient: true,
        linkedToVisit: true,
        treatingClinician: false,
        billingReviewTriggered: true,
        authorizedAdmin: false,
        ownCoachingReport: true
      }),
      false
    );

    assert.equal(
      canPerform('coaching_dashboard:view', {
        role: 'authorized_admin',
        linkedToPatient: false,
        linkedToVisit: false,
        treatingClinician: false,
        billingReviewTriggered: false,
        authorizedAdmin: true
      }),
      true
    );
  });

  it('allows export/copy actions only for linked permitted roles', () => {
    const linkedClinician = {
      role: 'clinician' as const,
      linkedToPatient: true,
      linkedToVisit: true,
      treatingClinician: true,
      billingReviewTriggered: false,
      authorizedAdmin: false
    };
    const linkedBilling = {
      ...linkedClinician,
      role: 'billing_staff' as const,
      treatingClinician: false,
      billingReviewTriggered: true
    };

    assert.equal(canPerform('final_note:export', linkedClinician), true);
    assert.equal(canPerform('patient_summary:export', linkedClinician), true);
    assert.equal(canPerform('ehr_adapter:view', linkedClinician), true);
    assert.equal(canPerform('ehr_chart_context:view', linkedClinician), true);
    assert.equal(canPerform('ehr_writeback:queue', linkedClinician), true);
    assert.equal(canPerform('clinicos_adapter:view', linkedClinician), true);
    assert.equal(canPerform('clinicos_mapping:write', linkedClinician), false);
    assert.equal(canPerform('ai_gateway:invoke', linkedClinician), true);
    assert.equal(canPerform('final_note:export', linkedBilling), false);
    assert.equal(canPerform('patient_summary:export', linkedBilling), false);
    assert.equal(canPerform('ehr_chart_context:view', linkedBilling), false);
    assert.equal(canPerform('ai_gateway:invoke', linkedBilling), false);
  });
});

describe('schedule lifecycle permissions', () => {
  it('allows MA and clinician schedule creation but denies billing-only users', () => {
    const base = {
      linkedToPatient: true,
      linkedToVisit: true,
      treatingClinician: false,
      billingReviewTriggered: false,
      authorizedAdmin: false
    };

    assert.equal(canPerform('appointment:create', { ...base, role: 'ma' }), true);
    assert.equal(canPerform('appointment:create', { ...base, role: 'clinician' }), true);
    assert.equal(canPerform('appointment:create', { ...base, role: 'billing_staff' }), false);
  });

  it('allows standalone patient and appointment lifecycle actions without granting billing chart access', () => {
    const linkedMa = {
      role: 'ma' as const,
      linkedToPatient: true,
      linkedToVisit: false,
      treatingClinician: false,
      billingReviewTriggered: false,
      authorizedAdmin: false
    };
    const linkedClinician = {
      ...linkedMa,
      role: 'clinician' as const,
      treatingClinician: true
    };
    const billingOnly = {
      ...linkedMa,
      role: 'billing_staff' as const,
      billingReviewTriggered: true
    };

    assert.equal(canPerform('patient:create', linkedMa), true);
    assert.equal(canPerform('patient:update', linkedMa), true);
    assert.equal(canPerform('appointment:update', linkedClinician), true);
    assert.equal(canPerform('appointment:status', linkedMa), true);
    assert.equal(canPerform('chart_context:view', linkedClinician), true);
    assert.equal(canPerform('patient:view', billingOnly), false);
    assert.equal(canPerform('chart_context:view', billingOnly), false);
  });

  it('allows Start Visit only for linked clinicians or authorized admins', () => {
    assert.equal(
      canPerform('visit:start', {
        role: 'clinician',
        linkedToPatient: true,
        linkedToVisit: true,
        treatingClinician: true,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      true
    );

    assert.equal(
      canPerform('visit:start', {
        role: 'ma',
        linkedToPatient: true,
        linkedToVisit: true,
        treatingClinician: false,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      false
    );
  });

  it('limits finalization management to linked treating clinicians or authorized admins', () => {
    assert.equal(
      canPerform('finalization:manage', {
        role: 'clinician',
        linkedToPatient: true,
        linkedToVisit: true,
        treatingClinician: true,
        billingReviewTriggered: false,
        authorizedAdmin: false
      }),
      true
    );

    assert.equal(
      canPerform('finalization:manage', {
        role: 'billing_staff',
        linkedToPatient: true,
        linkedToVisit: true,
        treatingClinician: false,
        billingReviewTriggered: true,
        authorizedAdmin: false
      }),
      false
    );
  });
});

describe('support and audit permissions', () => {
  it('allows support status without granting audit export', () => {
    const supportContext = {
      role: 'support' as const,
      linkedToPatient: false,
      linkedToVisit: false,
      treatingClinician: false,
      billingReviewTriggered: false,
      authorizedAdmin: false
    };
    const complianceContext = {
      ...supportContext,
      role: 'compliance_privacy_lead' as const
    };

    assert.equal(canPerform('support_status:view', supportContext), true);
    assert.equal(canPerform('audit:view', supportContext), false);
    assert.equal(canPerform('audit:export', supportContext), false);
    assert.equal(canPerform('audit:view', complianceContext), true);
    assert.equal(canPerform('audit:export', complianceContext), true);
  });
});

describe('standalone operations permissions', () => {
  it('keeps worklists, billing review, settings, and rules role limited', () => {
    const clinician = {
      role: 'clinician' as const,
      linkedToPatient: true,
      linkedToVisit: true,
      treatingClinician: true,
      billingReviewTriggered: false,
      authorizedAdmin: false
    };
    const ma = {
      ...clinician,
      role: 'ma' as const,
      treatingClinician: false
    };
    const billing = {
      ...clinician,
      role: 'billing_staff' as const,
      treatingClinician: false,
      billingReviewTriggered: true
    };
    const support = {
      ...clinician,
      role: 'support' as const,
      treatingClinician: false,
      linkedToPatient: false,
      linkedToVisit: false
    };
    const admin = {
      ...clinician,
      role: 'admin' as const,
      authorizedAdmin: true,
      treatingClinician: false
    };

    assert.equal(canPerform('task:view', ma), true);
    assert.equal(canPerform('task:update', ma), true);
    assert.equal(canPerform('billing_review:view', billing), true);
    assert.equal(canPerform('billing_review:update', billing), true);
    assert.equal(canPerform('settings:manage', admin), true);
    assert.equal(canPerform('template:manage', clinician), true);
    assert.equal(canPerform('estimate_config:manage', admin), true);
    assert.equal(canPerform('rules_catalog:manage', billing), false);
    assert.equal(canPerform('task:view', support), false);
    assert.equal(canPerform('billing_review:view', support), false);
  });
});

describe('production platform identity and config controls', () => {
  const baseContext = {
    tenantId: 'tenant-synthetic-primary',
    siteId: 'site-synthetic-primary',
    actorUserId: 'user-admin-synthetic-001',
    sessionId: 'session-synthetic-001',
    linkedToPatient: false,
    linkedToVisit: false,
    treatingClinician: false,
    billingReviewTriggered: false
  };
  const admin = {
    ...baseContext,
    role: 'admin' as const,
    authorizedAdmin: true,
    purposeOfUse: 'operations' as const,
    identityProviderMode: 'local_synthetic' as const
  };
  const clinician = {
    ...baseContext,
    actorUserId: 'user-clinician-synthetic-001',
    role: 'clinician' as const,
    authorizedAdmin: false,
    linkedToPatient: true,
    linkedToVisit: true,
    treatingClinician: true,
    purposeOfUse: 'treatment' as const,
    identityProviderMode: 'local_synthetic' as const
  };
  const adminWithoutPurpose = {
    ...baseContext,
    role: 'admin' as const,
    authorizedAdmin: true,
    identityProviderMode: 'local_synthetic' as const
  };

  it('limits platform identity, config, and high-risk flag management to authorized admins', () => {
    assert.equal(canPerform('identity:view', admin), true);
    assert.equal(canPerform('identity:manage', admin), true);
    assert.equal(canPerform('config:view', admin), true);
    assert.equal(canPerform('config:manage', admin), true);
    assert.equal(canPerform('feature_flag:view', admin), true);
    assert.equal(canPerform('feature_flag:manage', admin), true);

    assert.equal(canPerform('identity:view', clinician), false);
    assert.equal(canPerform('identity:manage', clinician), false);
    assert.equal(canPerform('config:manage', clinician), false);
    assert.equal(canPerform('feature_flag:manage', clinician), false);
  });

  it('fails closed for disabled users, missing purpose, spoofed scopes, expired sessions, and delegated identity', () => {
    const now = '2026-05-27T23:59:00.000Z';
    const baseInput = {
      access: admin,
      expectedTenantId: 'tenant-synthetic-primary',
      expectedSiteId: 'site-synthetic-primary',
      userStatus: 'active' as const,
      expiresAt: '2026-05-28T00:29:00.000Z',
      now,
      delegatedIdentityConfigured: false,
      requiredPurpose: 'operations' as const
    };

    assert.deepEqual(evaluateProductionIdentityGuard(baseInput), {
      allowed: true,
      failClosed: true
    });
    assert.match(
      evaluateProductionIdentityGuard({
        ...baseInput,
        userStatus: 'disabled'
      }).reason ?? '',
      /disabled user/
    );
    assert.match(
      evaluateProductionIdentityGuard({
        ...baseInput,
        access: adminWithoutPurpose,
      }).reason ?? '',
      /purpose-of-use is required/
    );
    assert.match(
      evaluateProductionIdentityGuard({
        ...baseInput,
        access: { ...admin, tenantId: 'tenant-other' },
      }).reason ?? '',
      /spoofed tenant/
    );
    assert.match(
      evaluateProductionIdentityGuard({
        ...baseInput,
        expiresAt: '2026-05-27T23:58:00.000Z',
      }).reason ?? '',
      /expired/
    );
    assert.match(
      evaluateProductionIdentityGuard({
        ...baseInput,
        access: { ...admin, identityProviderMode: 'saml_delegate' },
      }).reason ?? '',
      /delegated identity provider/
    );
  });
});

describe('PHI key guard', () => {
  it('detects forbidden keys recursively', () => {
    const result = scanForForbiddenPhiKeys({
      visit: {
        patientName: 'Synthetic Person',
        nested: [{ mrn: 'SYNTHETIC-MRN' }]
      }
    });

    assert.equal(result.containsForbiddenPhi, true);
    assert.deepEqual(result.paths, ['visit.patientName', 'visit.nested[0].mrn']);
    assert.equal(containsForbiddenPhiKeys({ safePatientId: 'synthetic-patient-001' }), false);
  });

  it('redacts forbidden keys while preserving safe data', () => {
    assert.deepEqual(
      redactForbiddenPhiKeys({
        safePatientId: 'synthetic-patient-001',
        email: 'synthetic@example.invalid',
        nested: { phone: '555-0100' }
      }),
      {
        safePatientId: 'synthetic-patient-001',
        email: '[REDACTED]',
        nested: { phone: '[REDACTED]' }
      }
    );
  });

  it('detects obvious forbidden PHI-like free text for AI-bound data', () => {
    const scan = scanForForbiddenPhiText({
      safePatientId: 'safe-patient-synthetic-001',
      contact: 'synthetic@example.invalid',
      nested: { note: 'MRN: SYNTHETIC-MRN' }
    });

    assert.equal(scan.containsForbiddenPhiText, true);
    assert.equal(containsForbiddenPhiText({ note: 'MRN: SYNTHETIC-MRN' }), true);
    assert.deepEqual(scan.paths, ['contact', 'nested.note']);
    assert.deepEqual(
      redactForbiddenPhi({ contact: 'synthetic@example.invalid', nested: { patientName: 'Synthetic Person' } }),
      { contact: '[REDACTED]', nested: { patientName: '[REDACTED]' } }
    );
  });
});

describe('structured log redaction and feature flags', () => {
  it('removes forbidden keys and text patterns from structured log payloads', () => {
    const redacted = redactForStructuredLog({
      safePatientId: 'safe-patient-synthetic-001',
      patientName: 'Synthetic Person',
      nested: {
        contact: 'synthetic@example.invalid',
        detail: 'safe operational detail'
      }
    });

    assert.deepEqual(redacted.redactedPaths, ['patientName', 'nested.contact']);
    assert.equal(scanForForbiddenPhiKeys(redacted.value).containsForbiddenPhi, false);
    assert.equal(scanForForbiddenPhiText(redacted.value).containsForbiddenPhiText, false);
  });

  it('creates request-correlated PHI-safe structured log entries', () => {
    const entry = createStructuredLogEntry({
      service: 'aura-note-api',
      level: 'info',
      message: 'Synthetic support status checked',
      requestId: 'req-001',
      traceId: 'trace-001',
      eventName: 'support.status_checked',
      timestamp: '2026-05-26T19:30:00.000Z',
      payload: { mrn: 'SYNTHETIC-MRN', status: 'ok' }
    });

    assert.equal(entry.requestId, 'req-001');
    assert.equal(entry.traceId, 'trace-001');
    assert.equal(entry.phiSafe, true);
    assert.equal(scanForForbiddenPhiKeys(entry.payload).containsForbiddenPhi, false);
    assert.deepEqual(entry.redactedPaths, ['mrn']);
  });

  it('defaults external integration feature flags to disabled', () => {
    const flags = buildExternalIntegrationFeatureFlags();

    assert.equal(flags.every((flag) => flag.defaultValue === false), true);
    assert.equal(flags.every((flag) => flag.enabled === false), true);
    assert.equal(flags.some((flag) => flag.governs === 'external_ai'), true);
    assert.equal(flags.some((flag) => flag.governs === 'ehr_writeback'), true);
  });

  it('creates local observability probes without PHI-bearing labels or attributes', () => {
    const metric = createMetricProbe({
      metricName: 'api.latency',
      kind: 'histogram',
      value: 24,
      unit: 'milliseconds',
      timestamp: '2026-05-27T01:45:00.000Z',
      labels: {
        route: 'GET /api/v1/support/status',
        patientName: 'Synthetic Person'
      }
    });
    const trace = createTraceProbe({
      traceId: 'trace-obs-001',
      spanId: 'span-obs-001',
      service: 'aura-note-api',
      name: 'support.status',
      startedAt: '2026-05-27T01:45:00.000Z',
      endedAt: '2026-05-27T01:45:00.000Z',
      durationMs: 24,
      status: 'ok',
      attributes: {
        patientName: 'Synthetic Person',
        mode: 'standalone'
      }
    });
    const snapshot = buildLocalObservabilitySnapshot({
      requestId: 'req-obs-001',
      traceId: 'trace-obs-001',
      timestamp: '2026-05-27T01:45:00.000Z'
    });

    assert.equal(metric.phiSafe, true);
    assert.equal(trace.phiSafe, true);
    assert.equal(scanForForbiddenPhiKeys(metric.labels).containsForbiddenPhi, false);
    assert.equal(scanForForbiddenPhiKeys(trace.attributes).containsForbiddenPhi, false);
    assert.equal(snapshot.sinks.some((sink) => sink.status === 'disabled_until_configured'), true);
    assert.equal(snapshot.sinks.some((sink) => sink.kind === 'siem' && sink.delivery === 'not_configured'), true);
    assert.equal(snapshot.sinks.some((sink) => sink.kind === 'apm' && sink.delivery === 'not_configured'), true);
    assert.equal(snapshot.metricProbes.every((probe) => probe.phiSafe), true);
    assert.equal(snapshot.traceProbes.every((probe) => probe.phiSafe), true);
  });

  it('limits support operations evidence recording to operational roles', () => {
    const support = {
      role: 'support' as const,
      linkedToPatient: false,
      linkedToVisit: false,
      treatingClinician: false,
      billingReviewTriggered: false,
      authorizedAdmin: false
    };
    const clinician = {
      ...support,
      role: 'clinician' as const
    };

    assert.equal(canPerform('support_operations:record', support), true);
    assert.equal(canPerform('support_operations:record', clinician), false);
  });
});
