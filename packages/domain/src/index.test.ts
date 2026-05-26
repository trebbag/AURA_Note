import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canCompleteWizardStep,
  canCompleteCodeReview,
  canCompleteCompareEdit,
  canCompleteCompose,
  canCompleteSuggestionReview,
  canCompleteBillingAttest,
  canEditNote,
  canGenerateFinalArtifact,
  canAcceptSuggestion,
  canSignAndDispatch,
  canSignAndDispatchAfterBilling,
  canStartFinalization,
  canStartVisit,
  buildCoachingDashboardProjection,
  buildOwnCoachingReport,
  complianceBlocksFinalize,
  approveRecordingException,
  createAppointmentLifecycle,
  createAppointmentNoteInvariant,
  createRawAudioRetentionMetadata,
  createTranscriptRetentionMetadata,
  evaluateLowConfidenceOverride,
  getNextWizardStep,
  isLowConfidenceDiagnosis,
  patientSummaryContainsInternalDetails,
  pauseVisitGate,
  recordingExceptionIsActive,
  resolveEhrWritebackStatus,
  resumeVisitGate,
  stopVisitGate,
  validateCoachingSignal,
  type CoachingSignal
} from './index';

describe('appointment-note invariant', () => {
  it('accepts exactly one reciprocal appointment-note relationship', () => {
    const invariant = createAppointmentNoteInvariant(
      { appointmentId: 'appt-001', noteId: 'note-001' },
      { appointmentId: 'appt-001', noteId: 'note-001' }
    );

    assert.equal(invariant.relationship, 'one_to_one');
    assert.equal(invariant.appointmentId, 'appt-001');
    assert.equal(invariant.noteId, 'note-001');
  });

  it('rejects mismatched appointment and note references', () => {
    assert.throws(
      () =>
        createAppointmentNoteInvariant(
          { appointmentId: 'appt-001', noteId: 'note-001' },
          { appointmentId: 'appt-002', noteId: 'note-001' }
        ),
      /one-to-one/
    );
  });
});

describe('appointment lifecycle', () => {
  const appointmentDraft = {
    tenantId: 'tenant-001',
    siteId: 'site-001',
    safePatientId: 'safe-patient-001',
    clinicianId: 'clinician-001',
    visitType: 'Chronic follow-up',
    startsAt: '2026-05-26T14:00:00.000Z',
    durationMinutes: 30,
    modality: 'in_person' as const,
    source: 'standalone' as const,
    reasonForVisit: 'Synthetic follow-up'
  };

  it('creates an inactive note shell when a valid standalone appointment is created', () => {
    assert.deepEqual(createAppointmentLifecycle('appt-001', 'note-001', appointmentDraft), {
      appointmentId: 'appt-001',
      noteId: 'note-001',
      appointmentState: 'scheduled',
      noteState: 'shell_created',
      noteVisibleInDrafts: false
    });
  });

  it('rejects invalid appointment creation input before a note shell is created', () => {
    assert.throws(
      () => createAppointmentLifecycle('appt-001', 'note-001', { ...appointmentDraft, visitType: '', durationMinutes: 0 }),
      /visitType is required/
    );
  });

  it('allows Start Visit only for scheduled active note shells', () => {
    assert.equal(canStartVisit('scheduled', 'shell_created'), true);
    assert.equal(canStartVisit('cancelled', 'shell_created'), false);
    assert.equal(canStartVisit('scheduled', 'visit_active'), false);
  });
});

describe('timer and recording gate', () => {
  it('keeps editing locked until the timer is running', () => {
    assert.equal(
      canEditNote({
        noteId: 'note-001',
        timerState: 'not_started',
        recordingState: 'not_started',
        editorUnlocked: false
      }),
      false
    );
  });

  it('unlocks editing while the timer is running', () => {
    assert.equal(
      canEditNote({
        noteId: 'note-001',
        timerState: 'running',
        recordingState: 'recording',
        editorUnlocked: true
      }),
      true
    );
  });

  it('allows the approved recording exception path without marking normal recording active', () => {
    const gate = {
      noteId: 'note-001',
      timerState: 'stopped' as const,
      recordingState: 'exception_approved' as const,
      editorUnlocked: true,
      exceptionReason: 'Approved no-audio documentation exception for synthetic fixture'
    };

    assert.equal(canEditNote(gate), true);
    assert.equal(recordingExceptionIsActive(gate), true);
    assert.notEqual(gate.recordingState, 'recording');
  });

  it('moves running visits through pause, resume, and stop while enforcing editor access', () => {
    const runningGate = {
      noteId: 'note-001',
      timerState: 'running' as const,
      recordingState: 'recording' as const,
      editorUnlocked: true
    };

    const paused = pauseVisitGate(runningGate);
    assert.equal(paused.timerState, 'paused');
    assert.equal(paused.recordingState, 'paused');
    assert.equal(paused.editorUnlocked, false);

    const resumed = resumeVisitGate(paused);
    assert.equal(resumed.timerState, 'running');
    assert.equal(resumed.recordingState, 'recording');
    assert.equal(resumed.editorUnlocked, true);

    const stopped = stopVisitGate(resumed);
    assert.equal(stopped.timerState, 'stopped');
    assert.equal(stopped.recordingState, 'stopped');
    assert.equal(stopped.editorUnlocked, false);
  });

  it('creates a recording exception gate without implying normal recording', () => {
    const exceptionGate = approveRecordingException(
      {
        noteId: 'note-001',
        timerState: 'paused',
        recordingState: 'paused',
        editorUnlocked: false
      },
      'Synthetic clinician-approved no-audio exception'
    );

    assert.equal(exceptionGate.timerState, 'paused');
    assert.equal(exceptionGate.recordingState, 'exception_approved');
    assert.equal(exceptionGate.editorUnlocked, true);
    assert.equal(recordingExceptionIsActive(exceptionGate), true);
  });
});

describe('retention metadata', () => {
  it('sets raw audio purge eligibility one week after capture', () => {
    const metadata = createRawAudioRetentionMetadata('recording-001', 'note-001', '2026-05-26T15:00:00.000Z');

    assert.equal(metadata.retentionClass, 'audio_ephemeral');
    assert.equal(metadata.purgeAfter, '2026-06-02T15:00:00.000Z');
    assert.equal(metadata.purgeEligible, false);
  });

  it('marks transcript retention as indefinite', () => {
    const metadata = createTranscriptRetentionMetadata('transcript-001', 'note-001');

    assert.equal(metadata.retentionClass, 'transcript');
    assert.equal(metadata.retentionPolicy, 'indefinite');
  });
});

describe('low-confidence diagnosis override', () => {
  it('requires override metadata below 75 percent confidence', () => {
    assert.equal(isLowConfidenceDiagnosis(0.74), true);
    assert.deepEqual(evaluateLowConfidenceOverride({ confidence: 0.74 }), {
      overrideRequired: true,
      accepted: false,
      flagsBillingReview: false,
      flagsCoachingReview: false
    });
  });

  it('flags billing and coaching review only after complete override metadata is present', () => {
    assert.deepEqual(
      evaluateLowConfidenceOverride({
        confidence: 0.42,
        overrideReason: 'Clinician-selected synthetic differential requires follow-up justification',
        supportingEvidence: 'Synthetic chart fact supports consideration',
        nonSupportingEvidence: 'Synthetic chart fact conflicts with certainty',
        uncertaintyExplanation: 'Synthetic data lacks confirming evidence',
        confidenceImprovementPlan: 'Collect follow-up history before final attribution'
      }),
      {
        overrideRequired: true,
        accepted: true,
        flagsBillingReview: true,
        flagsCoachingReview: true
      }
    );
  });

  it('requires complete override metadata before accepting low-confidence diagnosis suggestions', () => {
    assert.deepEqual(canAcceptSuggestion({ category: 'icd10', confidence: 0.7 }), {
      overrideRequired: true,
      accepted: false,
      flagsBillingReview: false,
      flagsCoachingReview: false
    });

    assert.equal(
      canAcceptSuggestion({
        category: 'diagnosis',
        confidence: 0.7,
        overrideReason: 'Synthetic clinician override',
        supportingEvidence: 'Synthetic supporting evidence',
        nonSupportingEvidence: 'Synthetic missing evidence',
        uncertaintyExplanation: 'Synthetic uncertainty',
        confidenceImprovementPlan: 'Synthetic follow-up plan'
      }).accepted,
      true
    );
  });
});

describe('finalization gates', () => {
  it('allows finalization start only when the draft is ready and hard blockers are clear', () => {
    assert.equal(
      canStartFinalization({
        noteState: 'documentation_in_progress',
        hardBlockCount: 0,
        unresolvedBlockerTaskCount: 0
      }),
      true
    );
    assert.equal(
      canStartFinalization({
        noteState: 'documentation_in_progress',
        hardBlockCount: 1,
        unresolvedBlockerTaskCount: 0
      }),
      false
    );
  });

  it('requires all Step 1 selected-item decisions before completing Code Review', () => {
    assert.equal(
      canCompleteCodeReview({
        requiredDecisionCount: 2,
        completedDecisionCount: 1,
        unresolvedBlockerTaskCount: 0
      }),
      false
    );
    assert.equal(
      canCompleteCodeReview({
        requiredDecisionCount: 2,
        completedDecisionCount: 2,
        unresolvedBlockerTaskCount: 0
      }),
      true
    );
  });

  it('requires all included final-pass suggestions before completing Suggestion Review', () => {
    assert.equal(canCompleteSuggestionReview({ includedSuggestionCount: 3, completedDecisionCount: 2 }), false);
    assert.equal(canCompleteSuggestionReview({ includedSuggestionCount: 3, completedDecisionCount: 3 }), true);
  });

  it('blocks Compose completion when patient summary contains internal billing details', () => {
    assert.equal(patientSummaryContainsInternalDetails('Bring your medication list to your next visit.'), false);
    assert.equal(patientSummaryContainsInternalDetails('This claim has CPT confidence details.'), true);
    assert.equal(
      canCompleteCompose({
        enhancedNoteGenerated: true,
        patientSummaryGenerated: true,
        patientSummaryContainsInternalDetails: true
      }),
      false
    );
  });

  it('requires separate final-note and patient-summary approvals after re-beautify is current', () => {
    assert.equal(
      canCompleteCompareEdit({
        finalNoteApproved: true,
        patientSummaryApproved: false,
        enhancedOutputStale: false
      }),
      false
    );
    assert.equal(
      canCompleteCompareEdit({
        finalNoteApproved: true,
        patientSummaryApproved: true,
        enhancedOutputStale: true
      }),
      false
    );
    assert.equal(
      canCompleteCompareEdit({
        finalNoteApproved: true,
        patientSummaryApproved: true,
        enhancedOutputStale: false
      }),
      true
    );
  });

  it('requires draft claim preview, attestations, caveat acknowledgement, and clear blockers for Billing & Attest', () => {
    assert.equal(
      canCompleteBillingAttest({
        finalNoteApproved: true,
        patientSummaryApproved: true,
        draftClaimPreviewGenerated: true,
        requiredAttestationsAccepted: false,
        estimateCaveatAcknowledged: true,
        unresolvedBlockerTaskCount: 0,
        criticalPayerEvidenceGapCount: 0
      }),
      false
    );
    assert.equal(
      canCompleteBillingAttest({
        finalNoteApproved: true,
        patientSummaryApproved: true,
        draftClaimPreviewGenerated: true,
        requiredAttestationsAccepted: true,
        estimateCaveatAcknowledged: true,
        unresolvedBlockerTaskCount: 0,
        criticalPayerEvidenceGapCount: 0
      }),
      true
    );
  });

  it('requires Billing & Attest completion before Sign & Dispatch can finalize outputs', () => {
    const readiness = {
      finalNoteApproved: true,
      patientSummaryApproved: true,
      tasks: [],
      billingAttested: false
    };

    assert.equal(canSignAndDispatchAfterBilling(readiness), false);
    assert.equal(canSignAndDispatchAfterBilling({ ...readiness, billingAttested: true }), true);
  });

  it('allows final artifacts only after signed final records exist', () => {
    assert.equal(
      canGenerateFinalArtifact({
        signedAndDispatched: false,
        finalNoteAvailable: true,
        patientSummaryAvailable: true,
        artifactType: 'final_note_pdf'
      }),
      false
    );
    assert.equal(
      canGenerateFinalArtifact({
        signedAndDispatched: true,
        finalNoteAvailable: true,
        patientSummaryAvailable: false,
        artifactType: 'structured_export'
      }),
      false
    );
    assert.equal(
      canGenerateFinalArtifact({
        signedAndDispatched: true,
        finalNoteAvailable: true,
        patientSummaryAvailable: true,
        artifactType: 'patient_summary_pdf'
      }),
      true
    );
  });

  it('resolves conservative EHR writeback queue states', () => {
    assert.equal(
      resolveEhrWritebackStatus({
        signedAndDispatched: false,
        finalNoteAvailable: false,
        destinationConfigured: true,
        humanApproved: true,
        vendorSupportsWriteback: true
      }),
      'disabled'
    );
    assert.equal(
      resolveEhrWritebackStatus({
        signedAndDispatched: true,
        finalNoteAvailable: true,
        destinationConfigured: false,
        humanApproved: true,
        vendorSupportsWriteback: true
      }),
      'not_configured'
    );
    assert.equal(
      resolveEhrWritebackStatus({
        signedAndDispatched: true,
        finalNoteAvailable: true,
        destinationConfigured: true,
        humanApproved: false,
        vendorSupportsWriteback: true
      }),
      'pending_approval'
    );
  });

  it('blocks signing for unresolved blocker tasks', () => {
    assert.equal(
      canSignAndDispatch({
        finalNoteApproved: true,
        patientSummaryApproved: true,
        tasks: [{ blocksSigning: true, adjudicationStatus: 'open' }]
      }),
      false
    );
  });

  it('allows signing after required approvals and adjudicated blocker tasks', () => {
    assert.equal(
      canSignAndDispatch({
        finalNoteApproved: true,
        patientSummaryApproved: true,
        tasks: [{ blocksSigning: true, adjudicationStatus: 'assigned' }]
      }),
      true
    );
  });

  it('enforces finalization wizard step order', () => {
    assert.equal(getNextWizardStep([]), 'code_review');
    assert.equal(canCompleteWizardStep([], 'suggestion_review'), false);
    assert.equal(canCompleteWizardStep(['code_review'], 'suggestion_review'), true);
  });

  it('blocks finalize preparation for compliance hard blocks and unresolved blocker tasks', () => {
    assert.equal(complianceBlocksFinalize({ hardBlockCount: 1, unresolvedBlockerTaskCount: 0 }), true);
    assert.equal(complianceBlocksFinalize({ hardBlockCount: 0, unresolvedBlockerTaskCount: 1 }), true);
    assert.equal(complianceBlocksFinalize({ hardBlockCount: 0, unresolvedBlockerTaskCount: 0 }), false);
  });
});

describe('coaching analytics scaffold', () => {
  const signals: CoachingSignal[] = [
    {
      coachingSignalId: 'coach-signal-001',
      noteId: 'note-001',
      clinicianId: 'clinician-001',
      category: 'documentation_completeness',
      score: 86,
      title: 'Assessment linked to plan',
      detail: 'Synthetic signal shows the assessment and plan are consistently linked.',
      evidenceIds: ['evidence-001'],
      improvementPrompt: 'Keep problem-specific plans paired with the assessment.',
      billingRelated: false,
      patientFacingExcluded: true,
      generatedAt: '2026-05-26T18:30:00.000Z'
    },
    {
      coachingSignalId: 'coach-signal-002',
      noteId: 'note-001',
      clinicianId: 'clinician-001',
      category: 'em_justification',
      score: 74,
      title: 'E/M support needs stronger MDM detail',
      detail: 'Synthetic signal flags a missing risk-detail sentence for the selected E/M level.',
      evidenceIds: ['evidence-002'],
      improvementPrompt: 'Add concise MDM support when the selected E/M level depends on risk.',
      billingRelated: true,
      patientFacingExcluded: true,
      generatedAt: '2026-05-26T18:31:00.000Z'
    },
    {
      coachingSignalId: 'coach-signal-003',
      noteId: 'note-002',
      clinicianId: 'clinician-002',
      category: 'patient_voice_fidelity',
      score: 91,
      title: 'Patient concern retained',
      detail: 'Synthetic signal shows the patient-stated concern is retained in the summary.',
      evidenceIds: ['evidence-003'],
      improvementPrompt: 'Continue preserving patient-stated goals in the note.',
      billingRelated: false,
      patientFacingExcluded: true,
      generatedAt: '2026-05-26T18:32:00.000Z'
    }
  ];

  it('validates coaching signals and excludes them from patient-facing output', () => {
    const firstSignal = signals[0];
    assert.ok(firstSignal);

    assert.deepEqual(validateCoachingSignal(firstSignal), []);
    assert.match(
      validateCoachingSignal({ ...firstSignal, patientFacingExcluded: false } as unknown as CoachingSignal).join(', '),
      /patient-facing/
    );
  });

  it('builds an own-clinician coaching report from only that clinician note', () => {
    const report = buildOwnCoachingReport({
      reportId: 'coach-report-001',
      clinicianId: 'clinician-001',
      noteId: 'note-001',
      generatedAt: '2026-05-26T18:40:00.000Z',
      signals,
      recordingExceptionApproved: false
    });

    assert.equal(report.overallScore, 80);
    assert.equal(report.signals.length, 2);
    assert.equal(report.signals.every((signal) => signal.clinicianId === 'clinician-001'), true);
    assert.equal(report.patientFacingExcluded, true);
  });

  it('marks transcript-dependent coaching unavailable after recording exception', () => {
    const report = buildOwnCoachingReport({
      reportId: 'coach-report-002',
      clinicianId: 'clinician-001',
      noteId: 'note-001',
      generatedAt: '2026-05-26T18:40:00.000Z',
      signals,
      recordingExceptionApproved: true
    });

    assert.match(report.unavailableReasons[0] ?? '', /recording exception/);
  });

  it('hides clinician identifiers in aggregate-only admin dashboards', () => {
    const dashboard = buildCoachingDashboardProjection({
      dashboardId: 'coach-dashboard-001',
      visibilityMode: 'aggregate_only',
      generatedAt: '2026-05-26T18:45:00.000Z',
      signals
    });

    assert.equal(dashboard.aggregateOnly, true);
    assert.equal(dashboard.providerCount, 2);
    assert.equal(dashboard.clinicianSummaries.length, 2);
    assert.equal(dashboard.clinicianSummaries.some((summary) => summary.clinicianId), false);
  });

  it('shows clinician identifiers only in full admin mode', () => {
    const dashboard = buildCoachingDashboardProjection({
      dashboardId: 'coach-dashboard-002',
      visibilityMode: 'full_admin',
      generatedAt: '2026-05-26T18:45:00.000Z',
      signals
    });

    assert.equal(dashboard.aggregateOnly, false);
    assert.equal(dashboard.clinicianSummaries.some((summary) => summary.clinicianId === 'clinician-001'), true);
  });
});
