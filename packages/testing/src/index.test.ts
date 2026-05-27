import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAppointmentNoteInvariant } from '@aura-note/domain';
import { canViewTranscript } from '@aura-note/security';
import {
  createAccessContext,
  createSyntheticAiEvidenceNode,
  createSyntheticAiInvocationRequest,
  createSyntheticAppointment,
  createSyntheticAuditExport,
  createSyntheticBlockingTask,
  createSyntheticClinicOsStatus,
  createSyntheticCoachingDashboard,
  createSyntheticCoachingReport,
  createSyntheticEhrChartContext,
  createSyntheticNote,
  createSyntheticSupportStatus,
  createSyntheticVisitSession
} from './index';

describe('synthetic CP-0 fixtures', () => {
  it('creates appointment and note fixtures that satisfy the one-to-one invariant', () => {
    const appointment = createSyntheticAppointment();
    const note = createSyntheticNote();

    const invariant = createAppointmentNoteInvariant(
      { appointmentId: appointment.appointmentId, noteId: appointment.noteId },
      { appointmentId: note.appointmentId, noteId: note.noteId }
    );

    assert.equal(invariant.relationship, 'one_to_one');
  });

  it('keeps the visit session locked before Start Visit', () => {
    const visitSession = createSyntheticVisitSession();

    assert.equal(visitSession.timerState, 'not_started');
    assert.equal(visitSession.recordingState, 'not_started');
    assert.equal(visitSession.editorUnlocked, false);
  });

  it('creates a signing blocker task fixture', () => {
    const task = createSyntheticBlockingTask();

    assert.equal(task.blocksSigning, true);
    assert.equal(task.adjudicationStatus, 'open');
  });

  it('creates synthetic AI gateway fixtures without raw PHI', () => {
    const evidence = createSyntheticAiEvidenceNode();
    const invocation = createSyntheticAiInvocationRequest({ evidence: [evidence] });

    assert.equal(invocation.safePatientId.startsWith('safe-patient-'), true);
    assert.equal(invocation.clinicalFacts.patientName, undefined);
    assert.equal(invocation.evidence[0]?.phiClassification, 'deidentified');
  });

  it('creates synthetic EHR chart context fixtures with evidence IDs', () => {
    const chartContext = createSyntheticEhrChartContext();

    assert.equal(chartContext.sourceSystem, 'athenahealth');
    assert.equal(chartContext.safePatientId.startsWith('safe-patient-'), true);
    assert.equal(chartContext.slices[0]?.evidenceIds.length, 1);
  });

  it('creates synthetic ClinicOS mapping fixtures without weakening AURA Note permissions', () => {
    const status = createSyntheticClinicOsStatus();

    assert.equal(status.modeContext.hostMode, 'clinicos_integrated');
    assert.equal(status.mappings[0]?.clinicosModuleId, 'M03');
    assert.equal(status.permissionsStillEnforcedByAuraNote, true);
  });

  it('creates synthetic coaching fixtures with patient-facing exclusions', () => {
    const report = createSyntheticCoachingReport();
    const dashboard = createSyntheticCoachingDashboard();

    assert.equal(report.patientFacingExcluded, true);
    assert.equal(report.privacyLabel, 'own_clinician_only');
    assert.equal(dashboard.aggregateOnly, true);
    assert.equal(dashboard.clinicianSummaries[0]?.clinicianId, undefined);
  });

  it('creates synthetic support hardening fixtures without PHI-bearing export payloads', () => {
    const status = createSyntheticSupportStatus();
    const auditExport = createSyntheticAuditExport();

    assert.equal(status.status.featureFlags[0]?.enabled, false);
    assert.equal(status.status.logging.sample.phiSafe, true);
    assert.equal(status.status.observability.sinks.some((sink) => sink.status === 'disabled_until_configured'), true);
    assert.equal(status.status.deployment.some((environment) => environment.environment === 'production'), true);
    assert.equal(status.status.runbooks.some((runbook) => runbook.runbookId === 'WO-018'), true);
    assert.equal(status.status.auditExport.downloadEnabled, false);
    assert.equal(auditExport.auditExport.includePhi, false);
    assert.equal(auditExport.auditExport.redacted, true);
    assert.equal(auditExport.auditExport.downloadEnabled, false);
  });

  it('creates role contexts that exercise transcript visibility rules', () => {
    assert.equal(canViewTranscript(createAccessContext()), true);
    assert.equal(canViewTranscript(createAccessContext({ role: 'billing_staff', treatingClinician: false })), false);
    assert.equal(
      canViewTranscript(
        createAccessContext({
          role: 'billing_staff',
          treatingClinician: false,
          billingReviewTriggered: true
        })
      ),
      true
    );
  });
});
