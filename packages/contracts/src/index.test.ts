import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createApiEnvelope,
  createEventEnvelope,
  isStateChangingEvent,
  type AiContextPackageDto,
  type AiGatewayInvocationResponseDto,
  type AiGatewayStatusDto,
  type ComplianceReviewDto,
  type DocumentationWorkspaceDto,
  type DraftNoteSummaryDto,
  type ExportActionResponseDto,
  type FinalizationSessionDto,
  type FinalizedNoteDetailDto,
  type EhrWritebackActionResponseDto,
  type ReviewActionResponseDto,
  type SuggestionDto,
  type TranscriptViewDto,
  type VisitSessionControlResponseDto,
  type ScheduleAppointmentDto
} from './index';

describe('API envelope', () => {
  it('wraps data with request metadata', () => {
    const envelope = createApiEnvelope(
      { status: 'ok' },
      {
        requestId: 'req-001',
        traceId: 'trace-001',
        mode: 'standalone',
        generatedAt: '2026-05-26T00:00:00.000Z'
      }
    );

    assert.equal(envelope.data.status, 'ok');
    assert.equal(envelope.meta.mode, 'standalone');
    assert.equal(envelope.warnings, undefined);
  });
});

describe('event envelope', () => {
  it('adds the schema version and event timestamp to a CP-0 domain event', () => {
    const event = createEventEnvelope({
      eventId: 'evt-001',
      eventType: 'appointment.created.v1',
      tenantId: 'tenant-001',
      siteId: 'site-001',
      appointmentId: 'appt-001',
      noteId: 'note-001',
      producer: 'aura-note-api',
      traceId: 'trace-001',
      idempotencyKey: 'idem-001',
      sensitivity: 'phi_reference',
      retentionClass: 'audit',
      payload: { appointmentId: 'appt-001', noteId: 'note-001' }
    });

    assert.equal(event.schemaVersion, 'v1');
    assert.equal(event.eventType, 'appointment.created.v1');
    assert.match(event.eventTime, /^\d{4}-\d{2}-\d{2}T/);
  });

  it('treats domain events as state-changing and audit recording as non-domain state change', () => {
    assert.equal(isStateChangingEvent('task.blocker_changed.v1'), true);
    assert.equal(isStateChangingEvent('transcript.segment_appended.v1'), true);
    assert.equal(isStateChangingEvent('suggestion.accepted.v1'), true);
    assert.equal(isStateChangingEvent('finalization.compose_completed.v1'), true);
    assert.equal(isStateChangingEvent('ai.request_prepared.v1'), true);
    assert.equal(isStateChangingEvent('ai.response_recorded.v1'), true);
    assert.equal(isStateChangingEvent('audit.event_recorded.v1'), false);
  });
});

describe('AI gateway contracts', () => {
  it('represents mock-only AI status without enabling external AI', () => {
    const status: AiGatewayStatusDto = {
      providerMode: 'mock',
      externalAiEnabled: false,
      policy: {
        policyId: 'aura-note-ai-policy-v1',
        mode: 'mock_only',
        externalAiEnabled: false,
        privateBaaRequired: true,
        humanReviewRequired: true,
        allowedOutputTypes: ['suggestion', 'draft', 'candidate', 'summary', 'coaching_feedback'],
        prohibitedAutonomousActions: ['submit_claim']
      },
      promptRegistry: [
        {
          promptId: 'aura-note-suggestions-v1',
          promptVersion: '2026-05-26.cp3',
          purpose: 'suggestions',
          outputType: 'suggestion',
          sourceLinkRequired: true,
          humanReviewRequired: true
        }
      ]
    };

    assert.equal(status.externalAiEnabled, false);
    assert.equal(status.promptRegistry[0]?.humanReviewRequired, true);
  });

  it('represents an invocation with deidentified context and governance events', () => {
    const contextPackage: AiContextPackageDto = {
      contextPackageId: 'ai-context-trace-001',
      tenantId: 'tenant-001',
      siteId: 'site-001',
      safePatientId: 'safe-patient-001',
      noteId: 'note-001',
      clinicalFacts: { diagnosisContext: 'Synthetic deidentified fact' },
      evidence: [
        {
          evidenceId: 'evidence-001',
          evidenceType: 'chart_slice',
          sourceSystem: 'synthetic_fixture',
          sourceRef: 'chart-001',
          displayLabel: 'Synthetic chart slice',
          excerptOrValue: 'Synthetic value',
          freshness: 'recent',
          sourceQuality: 'high',
          phiClassification: 'deidentified',
          allowedRoles: ['clinician']
        }
      ],
      sourceIds: ['evidence-001'],
      phiHandling: 'redact',
      redactedPaths: ['clinicalFacts.patientName'],
      rejectedPaths: [],
      deidentified: true,
      createdAt: '2026-05-26T17:00:00.000Z'
    };
    const invocation: AiGatewayInvocationResponseDto = {
      contextPackage,
      request: {
        tenantId: 'tenant-001',
        siteId: 'site-001',
        purpose: 'suggestions',
        contextPackage,
        outputType: 'suggestion',
        traceId: 'trace-001',
        promptId: 'aura-note-suggestions-v1',
        promptVersion: '2026-05-26.cp3',
        modelVersion: 'mock-aura-note-cp3',
        policyMode: 'mock_only',
        humanReviewStatus: 'required'
      },
      response: {
        output: { draftOnly: true },
        outputType: 'suggestion',
        modelMode: 'mock',
        confidence: 0.8,
        warnings: ['Mock output'],
        humanReviewRequired: true,
        sourceEvidenceIds: ['evidence-001'],
        rejected: false
      },
      auditEvent: {
        auditEventId: 'audit-ai-001',
        tenantId: 'tenant-001',
        action: 'ai.mock_invocation',
        entityType: 'AiGateway',
        entityId: 'ai-context-trace-001',
        traceId: 'trace-001',
        createdAt: '2026-05-26T17:00:00.000Z'
      },
      domainEvents: [
        createEventEnvelope({
          eventId: 'evt-ai-001',
          eventType: 'ai.request_prepared.v1',
          tenantId: 'tenant-001',
          siteId: 'site-001',
          producer: 'aura-note-api',
          traceId: 'trace-001',
          idempotencyKey: 'idem-ai-001',
          sensitivity: 'restricted',
          retentionClass: 'audit',
          payload: { contextPackageId: 'ai-context-trace-001' }
        })
      ]
    };

    assert.equal(invocation.contextPackage.deidentified, true);
    assert.equal(invocation.response.humanReviewRequired, true);
    assert.equal(invocation.domainEvents[0]?.eventType, 'ai.request_prepared.v1');
  });
});

describe('schedule contracts', () => {
  it('represents note shell status on schedule appointment cards', () => {
    const card: ScheduleAppointmentDto = {
      appointmentId: 'appt-001',
      tenantId: 'tenant-001',
      siteId: 'site-001',
      safePatientId: 'safe-patient-001',
      clinicianId: 'clinician-001',
      noteId: 'note-001',
      state: 'scheduled',
      startsAt: '2026-05-26T14:00:00.000Z',
      durationMinutes: 30,
      visitType: 'Chronic follow-up',
      modality: 'in_person',
      source: 'standalone',
      mode: 'standalone',
      noteStatus: 'shell_created',
      noteVisibleInDrafts: false,
      startVisitEnabled: true,
      ehrSchedulingEnabled: false,
      clinicOsSchedulingEnabled: false
    };

    assert.equal(card.noteStatus, 'shell_created');
    assert.equal(card.startVisitEnabled, true);
    assert.equal(card.ehrSchedulingEnabled, false);
    assert.equal(card.clinicOsSchedulingEnabled, false);
  });
});

describe('review panel contracts', () => {
  it('represents draft-only suggestions and compliance hard blocks', () => {
    const suggestion: SuggestionDto = {
      suggestionId: 'suggestion-001',
      noteId: 'note-001',
      category: 'icd10',
      label: 'ICD-10 synthetic candidate',
      confidence: 0.74,
      rationale: 'Synthetic low-confidence rationale',
      supportingEvidence: ['Synthetic support'],
      missingEvidence: ['Synthetic missing evidence'],
      status: 'candidate',
      lowConfidenceOverrideRequired: true,
      draftOnly: true
    };
    const compliance: ComplianceReviewDto = {
      noteId: 'note-001',
      issues: [
        {
          complianceIssueId: 'compliance-001',
          noteId: 'note-001',
          severity: 'hard_block',
          title: 'Open blocker',
          detail: 'Synthetic blocker',
          blocksFinalize: true,
          source: 'deterministic_mock'
        }
      ],
      finalizeDisabled: true
    };

    assert.equal(suggestion.draftOnly, true);
    assert.equal(suggestion.lowConfidenceOverrideRequired, true);
    assert.equal(compliance.finalizeDisabled, true);
  });

  it('groups Suggestions, Visit Selections, Compliance, History Gap, and tasks in one review action response', () => {
    const response: ReviewActionResponseDto = {
      suggestions: [],
      visitSelections: [],
      complianceReview: { noteId: 'note-001', issues: [], finalizeDisabled: false },
      historyGaps: [],
      tasks: [],
      auditEvent: {
        auditEventId: 'audit-001',
        tenantId: 'tenant-001',
        action: 'suggestions.evaluate',
        entityType: 'Note',
        entityId: 'note-001',
        traceId: 'trace-001',
        createdAt: '2026-05-26T14:00:00.000Z'
      },
      domainEvents: []
    };

    assert.equal(response.complianceReview.finalizeDisabled, false);
    assert.equal(Array.isArray(response.historyGaps), true);
  });
});

describe('documentation workspace contracts', () => {
  it('represents Draft Notes summaries without exposing a final note', () => {
    const draft: DraftNoteSummaryDto = {
      noteId: 'note-001',
      appointmentId: 'appt-001',
      safePatientId: 'safe-patient-001',
      clinicianId: 'clinician-001',
      visitType: 'Chronic follow-up',
      startsAt: '2026-05-26T14:00:00.000Z',
      noteStatus: 'visit_active',
      appointmentStatus: 'visit_started',
      workflowStatusLabel: 'Visit active',
      editorLocked: false
    };

    assert.equal(draft.noteStatus, 'visit_active');
    assert.equal(draft.editorLocked, false);
  });

  it('seeds all WO-003 workspace regions as explicit panel states', () => {
    const workspace: DocumentationWorkspaceDto = {
      appointment: {
        appointmentId: 'appt-001',
        tenantId: 'tenant-001',
        siteId: 'site-001',
        safePatientId: 'safe-patient-001',
        clinicianId: 'clinician-001',
        noteId: 'note-001',
        state: 'scheduled',
        startsAt: '2026-05-26T14:00:00.000Z',
        durationMinutes: 30,
        visitType: 'Chronic follow-up',
        modality: 'in_person',
        source: 'standalone',
        mode: 'standalone'
      },
      note: {
        noteId: 'note-001',
        appointmentId: 'appt-001',
        tenantId: 'tenant-001',
        siteId: 'site-001',
        safePatientId: 'safe-patient-001',
        clinicianId: 'clinician-001',
        state: 'shell_created',
        mode: 'standalone'
      },
      editorLocked: true,
      editorLockedReason: 'Start Visit and run the timer before documenting.',
      finalizedReadOnly: false,
      availableStates: ['empty', 'loading', 'ready', 'saving', 'warning', 'blocked', 'failed', 'permission_denied', 'finalized_read_only', 'demo_fixture'],
      panels: [
        { panelId: 'visit_context', label: 'Visit Context', state: 'ready', itemCount: 1 },
        { panelId: 'controls', label: 'Visit Controls', state: 'blocked', itemCount: 0 },
        { panelId: 'editor', label: 'Note Editor', state: 'blocked', itemCount: 0 },
        { panelId: 'visit_selections', label: 'Visit Selections', state: 'empty', itemCount: 0 },
        { panelId: 'suggestions', label: 'Suggestions', state: 'empty', itemCount: 0 },
        { panelId: 'transcript', label: 'Transcript', state: 'empty', itemCount: 0 },
        { panelId: 'compliance', label: 'Compliance & Quality Review', state: 'empty', itemCount: 0 },
        { panelId: 'history_gap', label: 'History Gap Review', state: 'empty', itemCount: 0 }
      ]
    };

    assert.deepEqual(
      workspace.panels.map((panel) => panel.panelId),
      ['visit_context', 'controls', 'editor', 'visit_selections', 'suggestions', 'transcript', 'compliance', 'history_gap']
    );
    assert.equal(workspace.availableStates.includes('permission_denied'), true);
  });
});

describe('finalization contracts', () => {
  it('represents a WO-006 finalization session with frozen Step 1 and Step 2 review inputs', () => {
    const session: FinalizationSessionDto = {
      finalizationSessionId: 'finalization-001',
      noteId: 'note-001',
      appointmentId: 'appt-001',
      currentStep: 'code_review',
      completedSteps: [],
      stepStatuses: {
        code_review: 'in_progress',
        suggestion_review: 'not_started',
        compose: 'not_started',
        compare_edit: 'not_started',
        billing_attest: 'not_started',
        sign_dispatch: 'not_started'
      },
      frozenSnapshot: {
        originalNoteText: 'Synthetic source note.',
        visitSelections: [
          {
            visitSelectionId: 'selection-001',
            noteId: 'note-001',
            category: 'cpt',
            label: 'CPT 99214 candidate',
            confidence: 0.82,
            humanApproved: true
          }
        ],
        finalPassSuggestions: [
          {
            suggestionId: 'suggestion-001',
            noteId: 'note-001',
            category: 'quality_measure',
            label: 'Quality follow-up',
            confidence: 0.88,
            rationale: 'Synthetic final-pass signal',
            supportingEvidence: ['Synthetic source'],
            missingEvidence: [],
            status: 'candidate',
            lowConfidenceOverrideRequired: false,
            draftOnly: true
          }
        ],
        transcriptSegmentCount: 1,
        historyGapQuestionCount: 0
      },
      selectionDecisions: [],
      suggestionDecisions: [],
      unusedAuditItems: [],
      composePhases: [],
      patientOpportunities: [],
      exportArtifacts: [],
      writeback: {
        writebackJobId: 'writeback-disabled-001',
        noteId: 'note-001',
        target: 'final_note',
        vendor: 'athenahealth',
        status: 'disabled',
        configured: false,
        humanApproved: false,
        retryable: false
      },
      finalNoteApproved: false,
      patientSummaryApproved: false,
      readyForBillingAttest: false,
      billingAttested: false,
      signedAndDispatched: false,
      createdAt: '2026-05-26T16:00:00.000Z',
      updatedAt: '2026-05-26T16:00:00.000Z'
    };

    assert.equal(session.frozenSnapshot.visitSelections.length, 1);
    assert.equal(session.frozenSnapshot.finalPassSuggestions[0]?.confidence, 0.88);
    assert.equal(session.stepStatuses.billing_attest, 'not_started');
  });

  it('represents draft claim preview and final output records without claim submission', () => {
    const session: Pick<FinalizationSessionDto, 'draftClaimPreview' | 'billingAttestation' | 'finalNote' | 'patientSummary'> = {
      draftClaimPreview: {
        draftClaimPreviewId: 'draft-claim-001',
        noteId: 'note-001',
        status: 'draft_preview',
        claimReadiness: 'needs_billing_review',
        patientReference: 'safe-patient-001',
        encounterDate: '2026-05-26',
        renderingClinicianId: 'clinician-001',
        placeOfService: 'office',
        visitType: 'Chronic follow-up',
        cptCandidates: ['99214'],
        hcpcsCandidates: [],
        icd10Candidates: ['E11.9'],
        emCandidate: '99214',
        diagnosisToServiceLinks: ['E11.9 -> 99214'],
        payerReadableJustification: 'Synthetic payer-readable support.',
        missingEvidence: [],
        denialRiskFlags: ['billing review routed'],
        estimateStatus: 'unavailable_caveated',
        estimateCaveat: 'Estimate unavailable.',
        billingReviewTriggered: true,
        submittedClaim: false
      },
      billingAttestation: {
        billingAttestationId: 'billing-attest-001',
        noteId: 'note-001',
        requiredStatements: ['I reviewed the final note.'],
        acceptedStatements: ['I reviewed the final note.'],
        estimateCaveatAcknowledged: true,
        billingReviewTriggered: true,
        attestedByUserId: 'clinician-001',
        attestedAt: '2026-05-26T16:00:00.000Z'
      },
      finalNote: {
        finalNoteId: 'final-note-001',
        noteId: 'note-001',
        appointmentId: 'appt-001',
        safePatientId: 'safe-patient-001',
        clinicianId: 'clinician-001',
        finalNoteText: 'Synthetic final note',
        finalizedAt: '2026-05-26T16:00:00.000Z',
        readOnly: true
      },
      patientSummary: {
        patientSummaryId: 'patient-summary-001',
        noteId: 'note-001',
        patientSummaryText: 'Synthetic patient summary',
        finalizedAt: '2026-05-26T16:00:00.000Z',
        patientFacing: true,
        internalBillingDetailsExcluded: true
      }
    };

    assert.equal(session.draftClaimPreview?.submittedClaim, false);
    assert.equal(session.finalNote?.readOnly, true);
    assert.equal(session.patientSummary?.internalBillingDetailsExcluded, true);
  });

  it('represents signed-only export artifacts and conservative writeback status', () => {
    const finalizedNote: FinalizedNoteDetailDto = {
      noteId: 'note-001',
      appointmentId: 'appt-001',
      safePatientId: 'safe-patient-001',
      clinicianId: 'clinician-001',
      finalizedAt: '2026-05-26T16:00:00.000Z',
      readOnly: true,
      finalNoteAvailable: true,
      patientSummaryAvailable: true,
      transcriptAvailableForRole: true,
      exportStatus: 'generated',
      patientSummaryStatus: 'final',
      billingReviewStatus: 'routed',
      writebackStatus: 'not_configured',
      finalNote: {
        finalNoteId: 'final-note-001',
        noteId: 'note-001',
        appointmentId: 'appt-001',
        safePatientId: 'safe-patient-001',
        clinicianId: 'clinician-001',
        finalNoteText: 'Synthetic final note',
        finalizedAt: '2026-05-26T16:00:00.000Z',
        readOnly: true
      },
      patientSummary: {
        patientSummaryId: 'patient-summary-001',
        noteId: 'note-001',
        patientSummaryText: 'Synthetic patient summary',
        finalizedAt: '2026-05-26T16:00:00.000Z',
        patientFacing: true,
        internalBillingDetailsExcluded: true
      },
      exportArtifacts: [
        {
          exportArtifactId: 'export-001',
          noteId: 'note-001',
          artifactType: 'final_note_pdf',
          status: 'generated',
          mimeType: 'application/pdf',
          fileName: 'note-001-final-note.pdf',
          generatedAt: '2026-05-26T16:05:00.000Z',
          generatedByUserId: 'clinician-001',
          sourceFinalizedAt: '2026-05-26T16:00:00.000Z',
          signedVersionLocked: true,
          content: '%PDF-1.4 synthetic final note',
          checksum: 'synthetic-checksum'
        }
      ],
      writeback: {
        writebackJobId: 'writeback-001',
        noteId: 'note-001',
        target: 'final_note',
        vendor: 'athenahealth',
        status: 'not_configured',
        configured: false,
        humanApproved: false,
        retryable: false
      },
      availableActions: {
        copyFinalNote: true,
        copyPatientSummary: true,
        downloadFinalNotePdf: true,
        downloadPatientSummaryPdf: true,
        exportStructured: true,
        queueEhrWriteback: false
      }
    };
    const exportResponse: Pick<ExportActionResponseDto, 'artifact' | 'finalizedNote'> = {
      artifact: finalizedNote.exportArtifacts[0]!,
      finalizedNote
    };
    const writebackResponse: Pick<EhrWritebackActionResponseDto, 'writeback' | 'finalizedNote'> = {
      writeback: finalizedNote.writeback,
      finalizedNote
    };

    assert.equal(exportResponse.artifact.signedVersionLocked, true);
    assert.equal(finalizedNote.patientSummary?.internalBillingDetailsExcluded, true);
    assert.equal(writebackResponse.writeback.status, 'not_configured');
  });
});

describe('timer and transcript contracts', () => {
  it('represents session control responses with raw audio retention metadata', () => {
    const response: VisitSessionControlResponseDto = {
      appointment: {
        appointmentId: 'appt-001',
        tenantId: 'tenant-001',
        siteId: 'site-001',
        safePatientId: 'safe-patient-001',
        clinicianId: 'clinician-001',
        noteId: 'note-001',
        state: 'visit_started',
        startsAt: '2026-05-26T14:00:00.000Z',
        durationMinutes: 30,
        visitType: 'Chronic follow-up',
        modality: 'in_person',
        source: 'standalone',
        mode: 'standalone'
      },
      note: {
        noteId: 'note-001',
        appointmentId: 'appt-001',
        tenantId: 'tenant-001',
        siteId: 'site-001',
        safePatientId: 'safe-patient-001',
        clinicianId: 'clinician-001',
        state: 'visit_active',
        mode: 'standalone'
      },
      visitSession: {
        visitSessionId: 'visit-session-001',
        noteId: 'note-001',
        timerState: 'running',
        recordingState: 'recording',
        editorUnlocked: true,
        elapsedSeconds: 0
      },
      rawAudioRetention: {
        recordingId: 'recording-001',
        noteId: 'note-001',
        retentionClass: 'audio_ephemeral',
        capturedAt: '2026-05-26T14:00:00.000Z',
        purgeAfter: '2026-06-02T14:00:00.000Z',
        purgeEligible: false
      },
      auditEvent: {
        auditEventId: 'audit-001',
        tenantId: 'tenant-001',
        action: 'visit.start',
        entityType: 'Appointment',
        entityId: 'appt-001',
        traceId: 'trace-001',
        createdAt: '2026-05-26T14:00:00.000Z'
      },
      domainEvents: []
    };

    assert.equal(response.visitSession.editorUnlocked, true);
    assert.equal(response.rawAudioRetention?.retentionClass, 'audio_ephemeral');
  });

  it('represents mock transcript segments with indefinite retention', () => {
    const transcript: TranscriptViewDto = {
      noteId: 'note-001',
      transcriptId: 'transcript-001',
      retentionPolicy: 'indefinite',
      segments: [
        {
          transcriptSegmentId: 'segment-001',
          noteId: 'note-001',
          sequence: 1,
          speakerRole: 'clinician',
          text: 'Synthetic mock transcript segment',
          source: 'mock_transcription',
          createdAt: '2026-05-26T14:00:00.000Z'
        }
      ]
    };

    assert.equal(transcript.retentionPolicy, 'indefinite');
    assert.equal(transcript.segments[0]?.source, 'mock_transcription');
  });
});
