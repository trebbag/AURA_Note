import { expect, test } from '@playwright/test';
import {
  createAuraNoteApiClient,
  frontendRuntimeBillingAttestationStatements,
  getAuraNoteApiBaseUrl
} from '../lib/aura-note-api-client';

const routeExpectations = [
  {
    path: '/status',
    heading: 'Status'
  },
  {
    path: '/aura-note/schedule',
    heading: 'Standalone Patient And Schedule Workspace',
    nav: true
  },
  {
    path: '/aura-note/drafts',
    heading: 'Active Documentation Work',
    nav: true
  },
  {
    path: '/aura-note/workspace/appt-demo-001',
    heading: 'Workspace Shell',
    nav: true
  },
  {
    path: '/aura-note/finalization/note-demo-001',
    heading: 'Finalization Steps 1-6',
    nav: true
  },
  {
    path: '/aura-note/finalized',
    heading: 'Finalized Notes',
    nav: true
  },
  {
    path: '/aura-note/finalized/note-demo-finalized-001',
    heading: 'Read-Only Final Note',
    nav: true
  },
  {
    path: '/aura-note/coaching',
    heading: 'Coaching and Analytics',
    nav: true
  },
  {
    path: '/aura-note/operations',
    heading: 'Standalone Operations Center',
    nav: true
  },
  {
    path: '/aura-note/platform',
    heading: 'Production Platform Controls',
    nav: true
  },
  {
    path: '/aura-note/integrations/ehr',
    heading: 'EHR Sandbox Integration',
    nav: true
  },
  {
    path: '/aura-note/integrations/clinicos',
    heading: 'ClinicOS Integration Hardening',
    nav: true
  },
  {
    path: '/aura-note/ai-governance',
    heading: 'AI Governance Readiness',
    nav: true
  },
  {
    path: '/aura-note/support/status',
    heading: 'Production Hardening Status',
    nav: true
  },
  {
    path: '/aura-note/runtime-integration',
    heading: 'Frontend Runtime Integration Evidence',
    nav: true
  }
];

test.describe('AURA Note route accessibility smoke suite', () => {
  for (const route of routeExpectations) {
    test(`${route.path} exposes main content and expected heading`, async ({ page }) => {
      await page.goto(route.path);

      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();

      if (route.nav) {
        await expect(page.getByRole('navigation', { name: 'AURA Note sections' })).toBeVisible();
      }
    });
  }

  test('schedule form has accessible controls and creates a note shell visibly', async ({ page }) => {
    await page.goto('/aura-note/schedule');

    await expect(page.getByRole('heading', { level: 2, name: 'Patient Shell' })).toBeVisible();
    await expect(page.getByLabel('Selected patient context')).toContainText('Chart freshness: recent');
    await expect(page.getByRole('heading', { level: 2, name: 'New Appointment' })).toBeVisible();
    await expect(page.getByLabel('Safe Patient ID')).toHaveValue('safe-patient-new-002');
    await expect(page.getByLabel('Visit Type')).toHaveValue('AWV plus problem');

    await page.getByRole('button', { name: 'Create Appointment + Note Shell' }).click();

    await expect(page.getByText('Created appt-demo-002 with one linked inactive note shell note-demo-002 and standalone patient linkage.')).toBeVisible();
    await expect(page.getByRole('region', { name: 'day schedule' })).toContainText('safe-patient-new-002');
    await page.getByRole('button', { name: 'Week' }).click();
    await expect(page.getByRole('region', { name: 'week schedule' })).toContainText('safe-patient-new-002');
    await page.getByRole('button', { name: 'Check In' }).last().click();
    await expect(page.getByRole('region', { name: 'week schedule' })).toContainText('checked_in');
    await page.getByRole('button', { name: 'No Show' }).last().click();
    await expect(page.getByRole('region', { name: 'week schedule' })).toContainText('no_show');
  });

  test('workspace exposes timer-gated editor states and blocker behavior', async ({ page }) => {
    await page.goto('/aura-note/workspace/appt-demo-001');

    const editor = page.getByLabel('Documentation editor');
    await expect(editor).toContainText('Editor locked until Start Visit runs the timer');
    await expect(page.getByRole('button', { name: 'Finalize Note' })).toBeDisabled();

    await page.getByRole('button', { name: 'Start Visit' }).click();
    await expect(editor).toContainText('Synthetic editor scaffold is available');
    await expect(page.getByRole('button', { name: 'Finalize Note' })).toBeEnabled();
    await expect(page.getByRole('region', { name: 'Audio capture and transcription status' })).toContainText('metadata_only_synthetic');

    await page.getByRole('button', { name: 'Demo Permission Denied' }).click();
    await expect(page.getByRole('region', { name: 'Audio capture and transcription status' })).toContainText('denied');
    await page.getByRole('button', { name: 'Append Metadata Chunk' }).click();
    await expect(page.getByRole('region', { name: 'Audio capture and transcription status' })).toContainText('Chunks');
    await expect(page.getByRole('region', { name: 'Audio capture and transcription status' })).toContainText('1');
    await page.getByRole('button', { name: 'Process Mock Transcription' }).click();
    await expect(page.getByRole('article', { name: 'Transcript segments' })).toContainText('Synthetic mock transcript from metadata-only chunk 1');
    await expect(page.getByRole('article', { name: 'Transcript segments' })).toContainText('91%');
    await page.getByRole('button', { name: 'Correct Transcript' }).click();
    await expect(page.getByRole('article', { name: 'Transcript segments' })).toContainText('Synthetic corrected transcript segment');

    await page.getByRole('button', { name: 'Send to MA as Blocker' }).click();
    await expect(page.getByText('History Gap question sent to MA follow-up as a signing blocker.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Finalize Note' })).toBeDisabled();
    await expect(page.getByLabel('Workspace panels')).toContainText('MA blocker task is open.');
  });

  test('finalized viewer actions remain role-labeled and read-only', async ({ page }) => {
    await page.goto('/aura-note/finalized/note-demo-finalized-001');

    await expect(page.getByRole('tablist', { name: 'Final artifact tabs' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Final Note' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel('Signed finalized artifact')).toContainText('This viewer cannot reopen the active editor.');

    await page.getByRole('button', { name: 'Copy Patient Summary' }).click();
    await expect(page.getByText('Patient summary copy-safe artifact prepared without internal revenue or coding logic.')).toBeVisible();
    await expect(page.getByLabel('Artifact statuses')).toContainText('Summary Copy');
    await expect(page.getByLabel('Artifact statuses')).toContainText('generated');
  });

  test('support and coaching routes expose permission and degraded-mode states', async ({ page }) => {
    await page.goto('/aura-note/coaching');

    await expect(page.getByRole('region', { name: 'Coaching views' })).toContainText('Own Coaching Report');
    await expect(page.getByRole('region', { name: 'Permission states' })).toContainText('coaching denied');
    await expect(page.getByRole('region', { name: 'Permission states' })).toContainText('never shown');

    await page.goto('/aura-note/support/status');

    await expect(page.getByRole('region', { name: 'Observability and deployment' })).toContainText('Production SIEM');
    await expect(page.getByRole('region', { name: 'Observability and deployment' })).toContainText('blocked until review');
    await expect(page.getByRole('region', { name: 'Operational runbooks' })).toContainText('Incident triage');
    await expect(page.getByRole('region', { name: 'Operational runbooks' })).toContainText('not configured');
    await expect(page.getByRole('region', { name: 'Secure storage and restore states' })).toContainText('server-mediated');
    await expect(page.getByRole('region', { name: 'Secure storage and restore states' })).toContainText('recovery window required');
    await expect(page.getByRole('region', { name: 'Operational evidence states' })).toContainText('productionLaunchReady=false');
    await expect(page.getByRole('region', { name: 'Operational evidence states' })).toContainText('metadata only');
    await expect(page.getByRole('region', { name: 'Launch operations readiness' })).toContainText('Launch Ops Drills');
    await expect(page.getByRole('region', { name: 'Launch operations readiness' })).toContainText('Rollback rehearsal');
    await expect(page.getByRole('region', { name: 'Launch operations readiness' })).toContainText('Vendor outage drill');
    await expect(page.getByRole('region', { name: 'Launch operations readiness' })).toContainText('Access review drill');
    await expect(page.getByRole('region', { name: 'Launch operations readiness' })).toContainText('synthetic_load_baseline');
    await expect(page.getByRole('region', { name: 'Launch operations readiness' })).toContainText('no production traffic');
    await expect(page.getByRole('region', { name: 'Pilot launch gate' })).toContainText('Pilot Launch Gate');
    await expect(page.getByRole('region', { name: 'Pilot launch gate' })).toContainText('Tenant Onboarding');
    await expect(page.getByRole('region', { name: 'Pilot launch gate' })).toContainText('Role Training');
    await expect(page.getByRole('region', { name: 'Pilot launch gate' })).toContainText('Disabled Feature Inventory');
    await expect(page.getByRole('region', { name: 'Pilot launch gate' })).toContainText('First-Week Monitoring');
    await expect(page.getByRole('region', { name: 'Pilot launch gate' })).toContainText('Go/No-Go Approvals');
    await expect(page.getByRole('region', { name: 'Pilot launch gate' })).toContainText('productionLaunchApproved=false');
    await expect(page.getByRole('region', { name: 'Pilot smoke and rollback' })).toContainText('submittedClaim=false');
    await expect(page.getByRole('region', { name: 'Claim payer decision gate' })).toContainText('Claim/Payer Decision Gate');
    await expect(page.getByRole('region', { name: 'Claim payer decision gate' })).toContainText('Draft Claim Boundary');
    await expect(page.getByRole('region', { name: 'Claim payer decision gate' })).toContainText('No Live Clearinghouse');
    await expect(page.getByRole('region', { name: 'Claim payer decision gate' })).toContainText('No Payer API');
    await expect(page.getByRole('region', { name: 'Claim payer decision gate' })).toContainText('No Denial Automation');
    await expect(page.getByRole('region', { name: 'Claim payer decision gate' })).toContainText('No Payment Posting');
    await expect(page.getByRole('region', { name: 'Claim payer decision gate' })).toContainText('submittedClaim=false');
    await expect(page.getByRole('region', { name: 'Claim payer decision gate' })).toContainText('claimSubmissionEnabled=false');
    await expect(page.getByRole('region', { name: 'Feature flags and retention' })).toContainText('External AI');
    await expect(page.getByRole('region', { name: 'Audit and failure states' })).toContainText('server-mediated');
    await expect(page.getByRole('region', { name: 'Audit and failure states' })).toContainText('PHI');
  });

  test('standalone operations route exposes worklists, billing review, settings, templates, estimates, and rules states', async ({ page }) => {
    await page.goto('/aura-note/operations');

    await expect(page.getByRole('region', { name: 'Standalone operations readiness' })).toContainText('Standalone Daily Operations');
    await expect(page.getByRole('region', { name: 'Screen states' })).toContainText('permission-denied');
    await expect(page.getByRole('article', { name: 'Task inbox' })).toContainText('open blocker');

    await page.getByRole('button', { name: 'MA Follow-Up' }).click();
    await page.getByRole('button', { name: 'Mark Answered' }).click();
    await expect(page.getByRole('article', { name: 'MA follow-up worklist' })).toContainText('answered non-blocker');

    await page.getByRole('button', { name: 'Billing Review' }).click();
    await expect(page.getByRole('article', { name: 'Billing review queue' })).toContainText('submittedClaim=false');
    await page.getByRole('button', { name: 'Trigger Review' }).click();
    await expect(page.getByRole('article', { name: 'Billing review queue' })).toContainText('allowed for billing_staff triggered review');

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Set Mock Ready' }).click();
    await expect(page.getByRole('article', { name: 'Settings admin integrations' })).toContainText('mock_ready');

    await page.getByRole('button', { name: 'Templates' }).click();
    await expect(page.getByRole('article', { name: 'Templates and dot phrases' })).toContainText('{{follow_up_interval}}');

    await page.getByRole('button', { name: 'Estimates' }).click();
    await expect(page.getByRole('article', { name: 'Estimate configuration' })).toContainText('Patient-facing: disabled');

    await page.getByRole('button', { name: 'Rules Catalog' }).click();
    await expect(page.getByRole('article', { name: 'Rules catalog' })).toContainText('Autonomous finalization: false');
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByRole('article', { name: 'Rules catalog' })).toContainText('published as active synthetic rules');
    await expect(page.getByRole('region', { name: 'Operational summary' })).toContainText('Claim submission remains disabled.');
  });

  test('production platform route exposes fail-closed identity, config, and high-risk flag controls', async ({ page }) => {
    await page.goto('/aura-note/platform');

    await expect(page.getByRole('region', { name: 'Production platform readiness' })).toContainText('Production-Shaped Controls');
    await expect(page.getByRole('article', { name: 'Identity and sessions' })).toContainText('clinicos_delegate: fail closed');
    await expect(page.getByRole('article', { name: 'Config and secrets' })).toContainText('secretValuesReturned=false');
    await expect(page.getByRole('article', { name: 'Feature flag governance' })).toContainText('Claim submission: disabled');
    await expect(page.getByRole('region', { name: 'Screen states' })).toContainText('expired-session');

    await page.getByRole('button', { name: 'Disable User' }).click();
    await expect(page.getByRole('article', { name: 'Identity and sessions' })).toContainText('disabled user blocked');
    await page.getByRole('button', { name: 'Expire Session' }).click();
    await expect(page.getByRole('article', { name: 'Identity and sessions' })).toContainText('session expired');
    await page.getByRole('button', { name: 'Missing Purpose' }).click();
    await expect(page.getByRole('article', { name: 'Identity and sessions' })).toContainText('purpose-of-use is required');

    await page.getByRole('button', { name: 'Validate Production Config' }).click();
    await expect(page.getByRole('article', { name: 'Config and secrets' })).toContainText('fail-closed missing OIDC_CLIENT_SECRET');

    await page.getByRole('button', { name: 'Attempt Enable Without Approval' }).click();
    await expect(page.getByRole('article', { name: 'Feature flag governance' })).toContainText('approval required');
    await page.getByRole('button', { name: 'Record Approval' }).click();
    await expect(page.getByRole('article', { name: 'Feature flag governance' })).toContainText('metadata_only_no_live_execution');
    await expect(page.getByRole('region', { name: 'Platform summary' })).toContainText('Production SSO');
  });

  test('EHR integration route exposes sandbox writeback queue lifecycle states', async ({ page }) => {
    await page.goto('/aura-note/integrations/ehr');

    await expect(page.getByRole('region', { name: 'EHR integration readiness' })).toContainText('disabled');
    await expect(page.getByRole('article', { name: 'Adapter status' })).toContainText('Athenahealth');
    await expect(page.getByRole('article', { name: 'Writeback queue' })).toContainText('pending_approval');
    await expect(page.getByRole('article', { name: 'Permission and payload boundaries' })).toContainText('payloadStored=false');
    await expect(page.getByRole('region', { name: 'EHR route states' })).toContainText('permission-denied');

    await page.getByRole('button', { name: 'Record Approval' }).click();
    await expect(page.getByRole('article', { name: 'Writeback queue' })).toContainText('approved');
    await page.getByRole('button', { name: 'Schedule Retry' }).click();
    await expect(page.getByRole('article', { name: 'Writeback queue' })).toContainText('retrying');
    await page.getByRole('button', { name: 'Dead Letter' }).click();
    await expect(page.getByRole('article', { name: 'Writeback queue' })).toContainText('dead_lettered');
    await page.getByRole('button', { name: 'Reconcile' }).click();
    await expect(page.getByRole('article', { name: 'Writeback queue' })).toContainText('reconciled');
  });

  test('core shells remain responsive without horizontal overflow on mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const path of ['/aura-note/schedule', '/aura-note/operations', '/aura-note/platform', '/aura-note/integrations/ehr', '/aura-note/ai-governance', '/aura-note/workspace/appt-demo-001', '/aura-note/finalized/note-demo-finalized-001']) {
      await page.goto(path);
      await expect(page.getByRole('main')).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });

  test('ClinicOS integration route exposes boundaries, stale mapping review, and failed publication states', async ({ page }) => {
    await page.goto('/aura-note/integrations/clinicos');

    await expect(page.getByRole('region', { name: 'ClinicOS integration readiness' })).toContainText('AURA Note authoritative');
    await expect(page.getByRole('article', { name: 'Module boundary map' })).toContainText('M03 / VisitGraph');
    await expect(page.getByRole('article', { name: 'Module boundary map' })).toContainText('M26 / Data Cloud');
    await expect(page.getByRole('article', { name: 'ClinicOS mappings' })).toContainText('stale');
    await expect(page.getByRole('article', { name: 'Publication metadata' })).toContainText('payloadStored=false');
    await expect(page.getByRole('region', { name: 'ClinicOS route states' })).toContainText('permission-denied');
    await expect(page.getByRole('region', { name: 'ClinicOS route states' })).toContainText('read-only');

    await page.getByRole('button', { name: 'Review Stale' }).click();
    await expect(page.getByRole('article', { name: 'ClinicOS mappings' })).toContainText('local blocker remains authoritative');
    await page.getByRole('button', { name: 'Failed Closed' }).click();
    await expect(page.getByRole('article', { name: 'Publication metadata' })).toContainText('failed_unavailable');
    await expect(page.getByRole('region', { name: 'ClinicOS safety summary' })).toContainText('does not build ClinicOS modules');
  });

  test('AI governance route exposes prompt, model, evaluation, validation, and disabled external AI states', async ({ page }) => {
    await page.goto('/aura-note/ai-governance');

    await expect(page.getByRole('region', { name: 'AI governance readiness' })).toContainText('External AI');
    await expect(page.getByRole('article', { name: 'Prompt registry' })).toContainText('aura-note-suggestions-v1');
    await expect(page.getByRole('article', { name: 'Model configuration' })).toContainText('liveInvocationEnabled=false');
    await expect(page.getByRole('article', { name: 'Evaluation harness' })).toContainText('eval-billing-preview-candidate-only-v1');
    await expect(page.getByRole('article', { name: 'Output validation' })).toContainText('ai.output_rejected.v1');
    await expect(page.getByRole('region', { name: 'AI governance route states' })).toContainText('permission-denied');

    await page.getByRole('button', { name: 'Run Evaluations' }).click();
    await expect(page.getByRole('article', { name: 'Evaluation harness' })).toContainText('allPassed=true liveModelCalled=false');
    await page.getByRole('button', { name: 'Reject Unsafe Output' }).click();
    await expect(page.getByRole('article', { name: 'Output validation' })).toContainText('unsafe-output-rejected');
    await expect(page.getByRole('region', { name: 'AI governance safety summary' })).toContainText('does not autonomously diagnose');
  });

  test('frontend runtime integration gate exercises backend-backed appointment through finalization export and reload evidence', async ({ page }) => {
    const baseUrl = getAuraNoteApiBaseUrl().replace('4000', process.env.AURA_NOTE_API_E2E_PORT ?? '3300');
    const maApi = createAuraNoteApiClient({ baseUrl, role: 'ma', userId: 'user-ma-runtime-e2e' });
    const clinicianApi = createAuraNoteApiClient({ baseUrl, role: 'clinician', userId: 'user-clinician-runtime-e2e' });
    const idSuffix = Date.now().toString(36);
    const created = await maApi.createAppointment(
      {
        safePatientId: `safe-patient-runtime-${idSuffix}`,
        clinicianId: 'clinician-runtime-e2e',
        visitType: 'Chronic follow-up',
        startsAt: '2026-05-28T15:00:00.000Z',
        durationMinutes: 30,
        modality: 'in_person',
        reasonForVisit: 'Synthetic Playwright runtime integration gate'
      },
      `idem-runtime-${idSuffix}`
    );

    const appointmentId = created.data.appointment.appointmentId;
    const noteId = created.data.note.noteId;
    await clinicianApi.startVisit(appointmentId);
    await clinicianApi.addVisitSelection(noteId, { category: 'cpt', label: 'CPT 99214 candidate', confidence: 0.82 });
    const started = await clinicianApi.startFinalization(noteId);
    const firstSelection = started.data.finalizationSession.frozenSnapshot.visitSelections[0];
    if (!firstSelection) {
      throw new Error('Runtime integration workflow did not create a visit selection for code review');
    }
    const selectionId = firstSelection.visitSelectionId;
    await clinicianApi.decideFinalizationSelection(noteId, selectionId, 'keep');
    await clinicianApi.completeCodeReview(noteId);

    for (const suggestionId of ['suggestion-demo-cpt-99214', 'suggestion-demo-icd10-e119', 'suggestion-demo-quality-bp']) {
      await clinicianApi.decideFinalizationSuggestion(noteId, suggestionId, 'remove', 'Synthetic runtime gate final-pass removal');
    }

    await clinicianApi.completeSuggestionReview(noteId);
    await clinicianApi.composeFinalizationDrafts(noteId);
    await clinicianApi.approveFinalNote(noteId, { approved: true, attestation: 'Synthetic runtime final note approval' });
    await clinicianApi.approvePatientSummary(noteId, { approved: true, attestation: 'Synthetic runtime patient summary approval' });
    const preview = await clinicianApi.generateDraftClaimPreview(noteId);
    expect(preview.data.finalizationSession.draftClaimPreview?.submittedClaim).toBe(false);
    await clinicianApi.completeBillingAttest(noteId, {
      acceptedStatements: frontendRuntimeBillingAttestationStatements,
      estimateCaveatAcknowledged: true,
      routeToBillingReview: true
    });
    const signed = await clinicianApi.signAndDispatch(noteId);
    expect(signed.data.finalizationSession.signedAndDispatched).toBe(true);
    const exported = await clinicianApi.generateFinalNotePdf(noteId);
    expect(exported.data.artifact.status).toBe('generated');

    const finalized = await clinicianApi.getFinalizedNote(noteId);
    expect(finalized.data.finalNoteAvailable).toBe(true);
    expect(finalized.data.readOnly).toBe(true);
    expect(finalized.data.exportArtifacts.length).toBeGreaterThanOrEqual(1);

    await page.goto('/aura-note/runtime-integration');
    await expect(page.getByRole('article', { name: 'API backed finalized notes state' })).toContainText(noteId);
    await expect(page.getByRole('article', { name: 'API backed finalized notes state' })).toContainText('read-only');
    await page.reload();
    await expect(page.getByRole('article', { name: 'API backed finalized notes state' })).toContainText(noteId);
    await expect(page.getByRole('article', { name: 'API backed schedule state' })).toContainText(appointmentId);
  });
});
