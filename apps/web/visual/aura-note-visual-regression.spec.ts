import { expect, test } from '@playwright/test';
import { createAuraNoteApiClient, frontendRuntimeBillingAttestationStatements } from '../lib/aura-note-api-client';

interface VisualSeed {
  activeAppointmentId: string;
  activeNoteId: string;
  finalizedNoteId: string;
}

const visualApiBaseUrl = `http://127.0.0.1:${process.env.AURA_NOTE_VISUAL_API_PORT ?? '3360'}/api/v1`;

const desktopRoutes: Array<{
  snapshotName: string;
  routePath: (seed: VisualSeed) => string;
  heading: string;
}> = [
  { snapshotName: 'dashboard', routePath: () => '/aura-note', heading: 'AURA Note Dashboard' },
  { snapshotName: 'schedule', routePath: () => '/aura-note/schedule', heading: 'Standalone Patient And Schedule Workspace' },
  { snapshotName: 'drafts', routePath: () => '/aura-note/drafts', heading: 'Active Documentation Work' },
  {
    snapshotName: 'workspace',
    routePath: (seed) => `/aura-note/workspace/${seed.activeAppointmentId}`,
    heading: 'AURA Note Clinical Documentation Assistant'
  },
  {
    snapshotName: 'finalization',
    routePath: (seed) => `/aura-note/finalization/${seed.activeNoteId}`,
    heading: 'Finalization Wizard'
  },
  { snapshotName: 'finalized-list', routePath: () => '/aura-note/finalized', heading: 'Finalized Notes' },
  {
    snapshotName: 'finalized-detail',
    routePath: (seed) => `/aura-note/finalized/${seed.finalizedNoteId}`,
    heading: 'Read-Only Final Note'
  },
  { snapshotName: 'operations', routePath: () => '/aura-note/operations', heading: 'Analytics Dashboard' },
  { snapshotName: 'platform', routePath: () => '/aura-note/platform', heading: 'Production Platform Controls' },
  { snapshotName: 'ehr-integration', routePath: () => '/aura-note/integrations/ehr', heading: 'EHR Sandbox Integration' },
  { snapshotName: 'clinicos-integration', routePath: () => '/aura-note/integrations/clinicos', heading: 'ClinicOS Integration Hardening' },
  { snapshotName: 'ai-governance', routePath: () => '/aura-note/ai-governance', heading: 'AI Governance Readiness' },
  { snapshotName: 'coaching', routePath: () => '/aura-note/coaching', heading: 'Coaching and Analytics' },
  { snapshotName: 'support-status', routePath: () => '/aura-note/support/status', heading: 'Production Hardening Status' },
  { snapshotName: 'figma-handoff', routePath: () => '/aura-note/figma-handoff', heading: 'Figma Handoff Inventory' }
];

async function createVisualAppointment(seedLabel: string) {
  const maClient = createAuraNoteApiClient({ baseUrl: visualApiBaseUrl, role: 'ma', userId: `user-visual-ma-${seedLabel}` });
  const response = await maClient.createAppointment(
    {
      safePatientId: `safe-patient-visual-${seedLabel}`,
      clinicianId: `clinician-visual-${seedLabel}`,
      visitType: seedLabel === 'finalized' ? 'AWV plus problem' : 'Chronic follow-up',
      startsAt: seedLabel === 'finalized' ? '2026-06-08T15:30:00.000Z' : '2026-06-08T14:00:00.000Z',
      durationMinutes: 30,
      modality: 'in_person',
      reasonForVisit: `Synthetic visual regression ${seedLabel} workflow`
    },
    `visual-regression-${seedLabel}`
  );

  return {
    appointmentId: response.data.appointment.appointmentId,
    noteId: response.data.note.noteId
  };
}

async function seedActiveFinalization() {
  const seeded = await createVisualAppointment('active');
  const clinicianClient = createAuraNoteApiClient({ baseUrl: visualApiBaseUrl, role: 'clinician', userId: 'user-visual-clinician-active' });
  await clinicianClient.startVisit(seeded.appointmentId);
  await clinicianClient.addVisitSelection(seeded.noteId, {
    category: 'diagnosis',
    label: 'ICD-10 E11.9 candidate',
    confidence: 0.87
  });
  await clinicianClient.startFinalization(seeded.noteId);
  return seeded;
}

async function seedFinalizedNote() {
  const seeded = await createVisualAppointment('finalized');
  const clinicianClient = createAuraNoteApiClient({ baseUrl: visualApiBaseUrl, role: 'clinician', userId: 'user-visual-clinician-finalized' });
  await clinicianClient.startVisit(seeded.appointmentId);
  await clinicianClient.addVisitSelection(seeded.noteId, {
    category: 'cpt',
    label: 'CPT 99214 candidate',
    confidence: 0.82
  });
  const started = await clinicianClient.startFinalization(seeded.noteId);
  const selection = started.data.finalizationSession.frozenSnapshot.visitSelections[0];
  if (!selection) {
    throw new Error('Visual regression finalization seed did not create a selected item.');
  }
  await clinicianClient.decideFinalizationSelection(seeded.noteId, selection.visitSelectionId, 'keep');
  await clinicianClient.completeCodeReview(seeded.noteId);
  for (const suggestionId of ['suggestion-demo-cpt-99214', 'suggestion-demo-icd10-e119', 'suggestion-demo-quality-bp']) {
    await clinicianClient.decideFinalizationSuggestion(seeded.noteId, suggestionId, 'remove', 'Synthetic visual regression finalization seed');
  }
  await clinicianClient.completeSuggestionReview(seeded.noteId);
  await clinicianClient.composeFinalizationDrafts(seeded.noteId);
  await clinicianClient.approveFinalNote(seeded.noteId, {
    approved: true,
    attestation: 'Synthetic visual regression final note approval'
  });
  await clinicianClient.approvePatientSummary(seeded.noteId, {
    approved: true,
    attestation: 'Synthetic visual regression patient summary approval'
  });
  await clinicianClient.generateDraftClaimPreview(seeded.noteId);
  await clinicianClient.completeBillingAttest(seeded.noteId, {
    acceptedStatements: frontendRuntimeBillingAttestationStatements,
    estimateCaveatAcknowledged: true,
    routeToBillingReview: true
  });
  await clinicianClient.signAndDispatch(seeded.noteId);
  await clinicianClient.generateFinalNotePdf(seeded.noteId);
  return seeded;
}

test.describe('AURA Note Figma-derived visual regression baselines', () => {
  let visualSeed: VisualSeed;

  test.beforeAll(async () => {
    const active = await seedActiveFinalization();
    const finalized = await seedFinalizedNote();
    visualSeed = {
      activeAppointmentId: active.appointmentId,
      activeNoteId: active.noteId,
      finalizedNoteId: finalized.noteId
    };
  });

  for (const { snapshotName, routePath, heading } of desktopRoutes) {
    test(`${snapshotName} first viewport remains visually stable`, async ({ page }) => {
      await page.goto(routePath(visualSeed));
      await page.getByRole('heading', { level: 1, name: heading }).waitFor();
      await page.getByRole('main').waitFor();
      await page.waitForLoadState('networkidle');

      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-delay: -1ms !important;
            animation-duration: 1ms !important;
            caret-color: transparent !important;
            transition-delay: 0ms !important;
            transition-duration: 0ms !important;
          }
        `
      });

      await expect(page).toHaveScreenshot(`${snapshotName}-desktop.png`, {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false
      });
    });
  }
});
