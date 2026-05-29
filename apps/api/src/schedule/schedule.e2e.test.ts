import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { configureAuraApi } from '../runtime/api-runtime';

const billingStatements = [
  'I have reviewed and accepted the final note.',
  'I have reviewed and accepted the patient summary.',
  'I have reviewed selected codes/items and understand they remain my responsibility.',
  'I have resolved, closed, or assigned open history questions.',
  'I understand the draft claim preview is a support tool and not an automated claim submission.'
];

describe('schedule appointment lifecycle API', () => {
  let app: INestApplication;

  before(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    configureAuraApi(app);
    await app.init();
  });

  after(async () => {
    await app.close();
  });

  it('denies cross-tenant schedule access through the API boundary', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/schedule/appointments')
      .set('x-aura-role', 'ma')
      .set('x-aura-tenant-id', 'tenant-other')
      .expect(403);
  });

  it('supports standalone patient shell, chart context, and schedule status workflow without billing access', async () => {
    const patient = await request(app.getHttpServer())
      .post('/api/v1/standalone/patients')
      .set('x-aura-role', 'ma')
      .send({
        safePatientId: 'safe-patient-e2e-038',
        displayLabel: 'Standalone safe-patient-e2e-038',
        preferredModality: 'in_person'
      })
      .expect(201);

    assert.equal(patient.body.data.patient.safePatientId, 'safe-patient-e2e-038');
    assert.equal(patient.body.data.patient.status, 'active');
    assert.equal(patient.body.data.domainEvents[0].eventType, 'patient.shell_created.v1');

    const searched = await request(app.getHttpServer())
      .get('/api/v1/standalone/patients')
      .query({ safePatientId: 'safe-patient-e2e-038' })
      .set('x-aura-role', 'clinician')
      .expect(200);

    assert.equal(searched.body.data.patients.length, 1);
    assert.equal(searched.body.data.realPhiExcluded, true);

    await request(app.getHttpServer())
      .get('/api/v1/standalone/patients')
      .set('x-aura-role', 'billing_staff')
      .expect(403);

    const updatedPatient = await request(app.getHttpServer())
      .patch('/api/v1/standalone/patients/safe-patient-e2e-038')
      .set('x-aura-role', 'ma')
      .send({ displayLabel: 'Standalone updated safe-patient-e2e-038', preferredModality: 'telehealth' })
      .expect(200);

    assert.equal(updatedPatient.body.data.patient.preferredModality, 'telehealth');

    const created = await request(app.getHttpServer())
      .post('/api/v1/schedule/appointments')
      .set('x-aura-role', 'ma')
      .set('idempotency-key', 'idem-e2e-wo038')
      .send({
        safePatientId: 'safe-patient-e2e-038',
        clinicianId: 'clinician-e2e-038',
        visitType: 'Chronic follow-up',
        startsAt: '2026-05-27T15:00:00.000Z',
        durationMinutes: 30,
        modality: 'telehealth',
        reasonForVisit: 'Synthetic WO-038 patient-linked appointment'
      })
      .expect(201);

    const appointmentId = created.body.data.appointment.appointmentId;
    assert.equal(created.body.data.patient.safePatientId, 'safe-patient-e2e-038');
    assert.equal(created.body.data.linkages.some((linkage: { linkedObjectType: string }) => linkage.linkedObjectType === 'chart_context'), true);
    assert.equal(created.body.data.chartContextSnapshot.productionPhiStorageApproved, false);

    const edited = await request(app.getHttpServer())
      .patch(`/api/v1/schedule/appointments/${appointmentId}`)
      .set('x-aura-role', 'ma')
      .send({ durationMinutes: 45, visitType: 'AWV plus problem' })
      .expect(200);

    assert.equal(edited.body.data.appointment.durationMinutes, 45);
    assert.equal(edited.body.data.domainEvents[0].eventType, 'appointment.updated.v1');

    const chart = await request(app.getHttpServer())
      .get(`/api/v1/schedule/appointments/${appointmentId}/chart-context`)
      .set('x-aura-role', 'clinician')
      .expect(200);

    assert.equal(chart.body.data.chartContextSnapshot.sourceSystem, 'standalone_local');
    assert.equal(chart.body.data.chartContextSnapshot.aiPackagingAllowed, false);

    await request(app.getHttpServer())
      .get(`/api/v1/schedule/appointments/${appointmentId}/chart-context`)
      .set('x-aura-role', 'billing_staff')
      .expect(403);

    const checkedIn = await request(app.getHttpServer())
      .post(`/api/v1/schedule/appointments/${appointmentId}/status`)
      .set('x-aura-role', 'ma')
      .send({ action: 'check_in' })
      .expect(201);

    assert.equal(checkedIn.body.data.appointment.state, 'checked_in');
    assert.equal(checkedIn.body.data.note.state, 'shell_created');

    const cancelledCreated = await request(app.getHttpServer())
      .post('/api/v1/schedule/appointments')
      .set('x-aura-role', 'ma')
      .set('idempotency-key', 'idem-e2e-wo038-cancel')
      .send({
        safePatientId: 'safe-patient-e2e-038',
        clinicianId: 'clinician-e2e-038',
        visitType: 'Urgent',
        startsAt: '2026-05-27T16:00:00.000Z',
        durationMinutes: 20,
        modality: 'in_person',
        reasonForVisit: 'Synthetic cancellation'
      })
      .expect(201);

    const cancelled = await request(app.getHttpServer())
      .post(`/api/v1/schedule/appointments/${cancelledCreated.body.data.appointment.appointmentId}/status`)
      .set('x-aura-role', 'ma')
      .send({ action: 'cancel', reason: 'Synthetic cancellation reason' })
      .expect(201);

    assert.equal(cancelled.body.data.appointment.state, 'cancelled');
    await request(app.getHttpServer())
      .post(`/api/v1/schedule/appointments/${cancelledCreated.body.data.appointment.appointmentId}/start-visit`)
      .set('x-aura-role', 'clinician')
      .expect(400);

    const noShowCreated = await request(app.getHttpServer())
      .post('/api/v1/schedule/appointments')
      .set('x-aura-role', 'ma')
      .set('idempotency-key', 'idem-e2e-wo038-noshow')
      .send({
        safePatientId: 'safe-patient-e2e-038',
        clinicianId: 'clinician-e2e-038',
        visitType: 'Telehealth',
        startsAt: '2026-05-27T17:00:00.000Z',
        durationMinutes: 20,
        modality: 'telehealth',
        reasonForVisit: 'Synthetic no-show'
      })
      .expect(201);

    const noShow = await request(app.getHttpServer())
      .post(`/api/v1/schedule/appointments/${noShowCreated.body.data.appointment.appointmentId}/status`)
      .set('x-aura-role', 'ma')
      .send({ action: 'mark_no_show' })
      .expect(201);

    assert.equal(noShow.body.data.appointment.state, 'no_show');
  });

  it('creates a standalone appointment, creates its note shell, and starts the visit', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/schedule/appointments')
      .set('x-aura-role', 'ma')
      .set('idempotency-key', 'idem-e2e-wo002')
      .send({
        safePatientId: 'safe-patient-e2e-001',
        clinicianId: 'clinician-e2e-001',
        visitType: 'Chronic follow-up',
        startsAt: '2026-05-26T16:00:00.000Z',
        durationMinutes: 30,
        modality: 'in_person',
        reasonForVisit: 'Synthetic e2e visit'
      })
      .expect(201);

    assert.equal(created.body.data.appointment.noteId, created.body.data.note.noteId);
    assert.equal(created.body.data.note.state, 'shell_created');

    const listed = await request(app.getHttpServer())
      .get('/api/v1/schedule/appointments')
      .set('x-aura-role', 'clinician')
      .expect(200);

    const listedAppointment = listed.body.data.appointments.find(
      (appointment: { appointmentId: string }) => appointment.appointmentId === created.body.data.appointment.appointmentId
    );
    assert.equal(Boolean(listedAppointment), true);
    assert.equal(listedAppointment.noteStatus, 'shell_created');

    const started = await request(app.getHttpServer())
      .post(`/api/v1/schedule/appointments/${created.body.data.appointment.appointmentId}/start-visit`)
      .set('x-aura-role', 'clinician')
      .expect(201);

    assert.equal(started.body.data.appointment.state, 'visit_started');
    assert.equal(started.body.data.note.state, 'visit_active');
    assert.equal(started.body.data.visitSession.editorUnlocked, true);
    assert.equal(started.body.data.rawAudioRetention.retentionClass, 'audio_ephemeral');

    const drafts = await request(app.getHttpServer()).get('/api/v1/notes/drafts').set('x-aura-role', 'clinician').expect(200);

    assert.equal(drafts.body.data.notes.length, 1);
    assert.equal(drafts.body.data.notes[0].noteStatus, 'visit_active');

    const workspace = await request(app.getHttpServer())
      .get(`/api/v1/documentation-workspace/appointments/${created.body.data.appointment.appointmentId}`)
      .set('x-aura-role', 'clinician')
      .expect(200);

    assert.equal(workspace.body.data.appointment.appointmentId, created.body.data.appointment.appointmentId);
    assert.equal(workspace.body.data.panels.some((panel: { panelId: string }) => panel.panelId === 'visit_selections'), true);

    const paused = await request(app.getHttpServer())
      .post(`/api/v1/documentation-workspace/appointments/${created.body.data.appointment.appointmentId}/visit-session/pause`)
      .set('x-aura-role', 'clinician')
      .expect(201);

    assert.equal(paused.body.data.visitSession.timerState, 'paused');
    assert.equal(paused.body.data.visitSession.editorUnlocked, false);

    const resumed = await request(app.getHttpServer())
      .post(`/api/v1/documentation-workspace/appointments/${created.body.data.appointment.appointmentId}/visit-session/resume`)
      .set('x-aura-role', 'clinician')
      .expect(201);

    assert.equal(resumed.body.data.visitSession.timerState, 'running');
    assert.equal(resumed.body.data.visitSession.editorUnlocked, true);

    const permission = await request(app.getHttpServer())
      .post(`/api/v1/documentation-workspace/appointments/${created.body.data.appointment.appointmentId}/recording/permission`)
      .set('x-aura-role', 'clinician')
      .send({ permissionState: 'granted', userGestureConfirmed: true, browserSupported: true })
      .expect(201);

    assert.equal(permission.body.data.permission.liveAudioCaptureEnabled, false);
    assert.equal(permission.body.data.providerStatus.mode, 'mock_only');

    const chunk = await request(app.getHttpServer())
      .post(`/api/v1/documentation-workspace/appointments/${created.body.data.appointment.appointmentId}/recording/chunks`)
      .set('x-aura-role', 'clinician')
      .set('idempotency-key', 'idem-e2e-audio-chunk-001')
      .send({ sequence: 1, durationMs: 15000, contentLengthBytes: 0, checksum: 'metadata-only-e2e-001' })
      .expect(201);

    assert.equal(chunk.body.data.recordingChunk.rawPhiAudioStored, false);
    assert.equal(chunk.body.data.recordingChunk.transportMode, 'metadata_only_synthetic');

    const provider = await request(app.getHttpServer())
      .get(`/api/v1/documentation-workspace/appointments/${created.body.data.appointment.appointmentId}/transcription/provider-status`)
      .set('x-aura-role', 'clinician')
      .expect(200);

    assert.equal(provider.body.data.providerStatus.liveProviderCallsEnabled, false);

    const mockJob = await request(app.getHttpServer())
      .post(`/api/v1/documentation-workspace/appointments/${created.body.data.appointment.appointmentId}/transcription/jobs/mock`)
      .set('x-aura-role', 'clinician')
      .expect(201);

    assert.equal(mockJob.body.data.transcriptionJob.liveProviderCalled, false);
    assert.equal(mockJob.body.data.transcript.segments[0].confidence, 0.91);

    const correction = await request(app.getHttpServer())
      .post(
        `/api/v1/documentation-workspace/appointments/${created.body.data.appointment.appointmentId}/transcript/segments/${mockJob.body.data.transcript.segments[0].transcriptSegmentId}/correction`
      )
      .set('x-aura-role', 'clinician')
      .send({
        correctedText: 'Synthetic corrected e2e transcript segment',
        correctionReason: 'Synthetic clinician correction'
      })
      .expect(201);

    assert.equal(correction.body.data.correction.auditSafe, true);

    await request(app.getHttpServer())
      .post(`/api/v1/documentation-workspace/appointments/${created.body.data.appointment.appointmentId}/transcript/segments/${mockJob.body.data.transcript.segments[0].transcriptSegmentId}/correction`)
      .set('x-aura-role', 'support')
      .send({
        correctedText: 'Synthetic support correction denied',
        correctionReason: 'Synthetic denied correction'
      })
      .expect(403);

    const retention = await request(app.getHttpServer())
      .get(`/api/v1/documentation-workspace/appointments/${created.body.data.appointment.appointmentId}/recording/retention`)
      .set('x-aura-role', 'clinician')
      .expect(200);

    assert.equal(retention.body.data.transcriptPurgeCount, 0);
    assert.equal(retention.body.data.rawAudioPayloadStored, false);

    const transcript = await request(app.getHttpServer())
      .post(`/api/v1/documentation-workspace/appointments/${created.body.data.appointment.appointmentId}/transcript/segments`)
      .set('x-aura-role', 'clinician')
      .send({ speakerRole: 'clinician', text: 'Synthetic mock transcript segment' })
      .expect(201);

    assert.equal(transcript.body.data.transcript.retentionPolicy, 'indefinite');
    assert.equal(transcript.body.data.transcript.segments.length, 2);
    assert.equal(transcript.body.data.transcript.segments.at(-1).text, 'Synthetic mock transcript segment');

    const suggestions = await request(app.getHttpServer())
      .post(`/api/v1/notes/${created.body.data.note.noteId}/suggestions/evaluate`)
      .set('x-aura-role', 'clinician')
      .expect(201);

    assert.equal(suggestions.body.data.suggestions.length, 3);

    const accepted = await request(app.getHttpServer())
      .post(`/api/v1/notes/${created.body.data.note.noteId}/suggestions/suggestion-demo-cpt-99214/accept`)
      .set('x-aura-role', 'clinician')
      .send({})
      .expect(201);

    assert.equal(accepted.body.data.visitSelections.length, 1);

    await request(app.getHttpServer())
      .post(`/api/v1/notes/${created.body.data.note.noteId}/suggestions/suggestion-demo-icd10-e119/accept`)
      .set('x-aura-role', 'clinician')
      .send({})
      .expect(400);

    const historyGapTask = await request(app.getHttpServer())
      .post(`/api/v1/notes/${created.body.data.note.noteId}/history-gaps/history-gap-demo-001/tasks`)
      .set('x-aura-role', 'clinician')
      .send({ blocksSigning: true, ownerRole: 'ma' })
      .expect(201);

    assert.equal(historyGapTask.body.data.tasks[0].blocksSigning, true);
    assert.equal(historyGapTask.body.data.complianceReview.finalizeDisabled, true);

    const finalized = await request(app.getHttpServer())
      .get(`/api/v1/notes/finalized/${created.body.data.note.noteId}`)
      .set('x-aura-role', 'clinician')
      .expect(200);

    assert.equal(finalized.body.data.readOnly, true);
    assert.equal(finalized.body.data.finalNoteAvailable, false);
  });

  it('runs the WO-006 finalization wizard through Compare & Edit approval gates', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/schedule/appointments')
      .set('x-aura-role', 'ma')
      .set('idempotency-key', 'idem-e2e-wo006')
      .send({
        safePatientId: 'safe-patient-e2e-006',
        clinicianId: 'clinician-e2e-006',
        visitType: 'Chronic follow-up',
        startsAt: '2026-05-26T17:00:00.000Z',
        durationMinutes: 30,
        modality: 'in_person',
        reasonForVisit: 'Synthetic finalization visit'
      })
      .expect(201);

    const noteId = created.body.data.note.noteId;
    await request(app.getHttpServer())
      .post(`/api/v1/schedule/appointments/${created.body.data.appointment.appointmentId}/start-visit`)
      .set('x-aura-role', 'clinician')
      .expect(201);

    const started = await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/start`)
      .set('x-aura-role', 'clinician')
      .expect(201);

    assert.equal(started.body.data.finalizationSession.currentStep, 'code_review');
    assert.equal(started.body.data.finalizationSession.frozenSnapshot.finalPassSuggestions.length, 3);

    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/code-review/complete`)
      .set('x-aura-role', 'clinician')
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/suggestion-review/complete`)
      .set('x-aura-role', 'clinician')
      .expect(400);

    for (const suggestionId of ['suggestion-demo-cpt-99214', 'suggestion-demo-icd10-e119', 'suggestion-demo-quality-bp']) {
      await request(app.getHttpServer())
        .post(`/api/v1/notes/${noteId}/finalization/suggestion-review/suggestions/${suggestionId}`)
        .set('x-aura-role', 'clinician')
        .send({ decision: 'remove', reason: 'Synthetic final-pass e2e removal' })
        .expect(201);
    }

    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/suggestion-review/complete`)
      .set('x-aura-role', 'clinician')
      .expect(201);

    const composed = await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/compose`)
      .set('x-aura-role', 'clinician')
      .expect(201);

    assert.equal(composed.body.data.finalizationSession.currentStep, 'compare_edit');
    assert.equal(composed.body.data.finalizationSession.composeOutput.patientSummaryInternalDetailsDetected, false);

    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/compare-edit/approve-note`)
      .set('x-aura-role', 'clinician')
      .send({ approved: true, attestation: 'Synthetic note approval attestation' })
      .expect(201);

    const approved = await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/compare-edit/approve-summary`)
      .set('x-aura-role', 'clinician')
      .send({ approved: true, attestation: 'Synthetic patient summary approval attestation' })
      .expect(201);

    assert.equal(approved.body.data.finalizationSession.readyForBillingAttest, true);
    assert.equal(approved.body.data.finalizationSession.currentStep, 'billing_attest');
  });

  it('runs WO-007 Billing & Attest and Sign & Dispatch without submitting a claim', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/schedule/appointments')
      .set('x-aura-role', 'ma')
      .set('idempotency-key', 'idem-e2e-wo007')
      .send({
        safePatientId: 'safe-patient-e2e-007',
        clinicianId: 'clinician-e2e-007',
        visitType: 'Chronic follow-up',
        startsAt: '2026-05-26T18:00:00.000Z',
        durationMinutes: 30,
        modality: 'in_person',
        reasonForVisit: 'Synthetic billing attest visit'
      })
      .expect(201);

    const noteId = created.body.data.note.noteId;
    const appointmentId = created.body.data.appointment.appointmentId;
    await request(app.getHttpServer())
      .post(`/api/v1/schedule/appointments/${appointmentId}/start-visit`)
      .set('x-aura-role', 'clinician')
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/visit-selections`)
      .set('x-aura-role', 'clinician')
      .send({ category: 'cpt', label: 'CPT 99214 candidate', confidence: 0.82 })
      .expect(201);
    const started = await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/start`)
      .set('x-aura-role', 'clinician')
      .expect(201);
    const selectionId = started.body.data.finalizationSession.frozenSnapshot.visitSelections[0].visitSelectionId;
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/code-review/selections/${selectionId}`)
      .set('x-aura-role', 'clinician')
      .send({ decision: 'keep' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/code-review/complete`)
      .set('x-aura-role', 'clinician')
      .expect(201);
    for (const suggestionId of ['suggestion-demo-cpt-99214', 'suggestion-demo-icd10-e119', 'suggestion-demo-quality-bp']) {
      await request(app.getHttpServer())
        .post(`/api/v1/notes/${noteId}/finalization/suggestion-review/suggestions/${suggestionId}`)
        .set('x-aura-role', 'clinician')
        .send({ decision: 'remove', reason: 'Synthetic final-pass e2e removal' })
        .expect(201);
    }
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/suggestion-review/complete`)
      .set('x-aura-role', 'clinician')
      .expect(201);
    await request(app.getHttpServer()).post(`/api/v1/notes/${noteId}/finalization/compose`).set('x-aura-role', 'clinician').expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/compare-edit/approve-note`)
      .set('x-aura-role', 'clinician')
      .send({ approved: true, attestation: 'Synthetic final note approval' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/compare-edit/approve-summary`)
      .set('x-aura-role', 'clinician')
      .send({ approved: true, attestation: 'Synthetic patient summary approval' })
      .expect(201);

    const preview = await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/billing-attest/draft-claim-preview`)
      .set('x-aura-role', 'clinician')
      .expect(201);
    assert.equal(preview.body.data.finalizationSession.draftClaimPreview.submittedClaim, false);

    const attested = await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/billing-attest/complete`)
      .set('x-aura-role', 'clinician')
      .send({ acceptedStatements: billingStatements, estimateCaveatAcknowledged: true, routeToBillingReview: true })
      .expect(201);
    assert.equal(attested.body.data.finalizationSession.currentStep, 'sign_dispatch');

    const signed = await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/sign-dispatch`)
      .set('x-aura-role', 'clinician')
      .expect(201);
    assert.equal(signed.body.data.finalizationSession.finalNote.readOnly, true);
    assert.equal(signed.body.data.finalizationSession.patientSummary.patientFacing, true);

    const finalized = await request(app.getHttpServer()).get(`/api/v1/notes/finalized/${noteId}`).set('x-aura-role', 'clinician').expect(200);
    assert.equal(finalized.body.data.finalNoteAvailable, true);
  });

  it('runs WO-008 finalized viewer export PDF copy and writeback queue endpoints', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/schedule/appointments')
      .set('x-aura-role', 'ma')
      .set('idempotency-key', 'idem-e2e-wo008')
      .send({
        safePatientId: 'safe-patient-e2e-008',
        clinicianId: 'clinician-e2e-008',
        visitType: 'Chronic follow-up',
        startsAt: '2026-05-26T19:00:00.000Z',
        durationMinutes: 30,
        modality: 'in_person',
        reasonForVisit: 'Synthetic final export visit'
      })
      .expect(201);

    const noteId = created.body.data.note.noteId;
    const appointmentId = created.body.data.appointment.appointmentId;
    await request(app.getHttpServer()).post(`/api/v1/notes/${noteId}/exports/final-note-pdf`).set('x-aura-role', 'clinician').expect(400);
    await request(app.getHttpServer())
      .post(`/api/v1/schedule/appointments/${appointmentId}/start-visit`)
      .set('x-aura-role', 'clinician')
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/visit-selections`)
      .set('x-aura-role', 'clinician')
      .send({ category: 'cpt', label: 'CPT 99214 candidate', confidence: 0.82 })
      .expect(201);
    const started = await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/start`)
      .set('x-aura-role', 'clinician')
      .expect(201);
    const selectionId = started.body.data.finalizationSession.frozenSnapshot.visitSelections[0].visitSelectionId;
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/code-review/selections/${selectionId}`)
      .set('x-aura-role', 'clinician')
      .send({ decision: 'keep' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/code-review/complete`)
      .set('x-aura-role', 'clinician')
      .expect(201);
    for (const suggestionId of ['suggestion-demo-cpt-99214', 'suggestion-demo-icd10-e119', 'suggestion-demo-quality-bp']) {
      await request(app.getHttpServer())
        .post(`/api/v1/notes/${noteId}/finalization/suggestion-review/suggestions/${suggestionId}`)
        .set('x-aura-role', 'clinician')
        .send({ decision: 'remove', reason: 'Synthetic final-pass e2e removal' })
        .expect(201);
    }
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/suggestion-review/complete`)
      .set('x-aura-role', 'clinician')
      .expect(201);
    await request(app.getHttpServer()).post(`/api/v1/notes/${noteId}/finalization/compose`).set('x-aura-role', 'clinician').expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/compare-edit/approve-note`)
      .set('x-aura-role', 'clinician')
      .send({ approved: true, attestation: 'Synthetic final note approval' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/compare-edit/approve-summary`)
      .set('x-aura-role', 'clinician')
      .send({ approved: true, attestation: 'Synthetic patient summary approval' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/billing-attest/draft-claim-preview`)
      .set('x-aura-role', 'clinician')
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/billing-attest/complete`)
      .set('x-aura-role', 'clinician')
      .send({ acceptedStatements: billingStatements, estimateCaveatAcknowledged: true, routeToBillingReview: true })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/finalization/sign-dispatch`)
      .set('x-aura-role', 'clinician')
      .expect(201);

    const previousStorageExportFlag = process.env.AURA_ENABLE_STORAGE_BACKED_EXPORTS;
    process.env.AURA_ENABLE_STORAGE_BACKED_EXPORTS = 'true';
    const finalNotePdf = await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/exports/final-note-pdf`)
      .set('x-aura-role', 'clinician')
      .set('x-aura-user-id', 'user-clinician-synthetic-001')
      .expect(201);
    const summaryCopy = await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/exports/patient-summary-copy`)
      .set('x-aura-role', 'clinician')
      .set('x-aura-user-id', 'user-clinician-synthetic-001')
      .expect(201);
    if (previousStorageExportFlag === undefined) {
      delete process.env.AURA_ENABLE_STORAGE_BACKED_EXPORTS;
    } else {
      process.env.AURA_ENABLE_STORAGE_BACKED_EXPORTS = previousStorageExportFlag;
    }
    const delivered = await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/exports/${finalNotePdf.body.data.artifact.exportArtifactId}/download`)
      .set('x-aura-role', 'clinician')
      .set('x-aura-user-id', 'user-clinician-synthetic-001')
      .send({ signedDownloadToken: finalNotePdf.body.data.artifact.signedDownloadToken })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/exports/${finalNotePdf.body.data.artifact.exportArtifactId}/download`)
      .set('x-aura-role', 'billing_staff')
      .send({ signedDownloadToken: finalNotePdf.body.data.artifact.signedDownloadToken })
      .expect(403);
    const writebackFailed = await request(app.getHttpServer())
      .post(`/api/v1/notes/${noteId}/ehr-writeback`)
      .set('x-aura-role', 'clinician')
      .send({ target: 'final_note', humanApproved: true, scaffoldMode: 'simulate_failure' })
      .expect(201);
    const finalized = await request(app.getHttpServer()).get(`/api/v1/notes/finalized/${noteId}`).set('x-aura-role', 'ma').expect(200);

    assert.match(finalNotePdf.body.data.artifact.content, /^%PDF-1\.4 synthetic/);
    assert.equal(finalNotePdf.body.data.artifact.deliveryMode, 'storage_backed');
    assert.equal(delivered.body.data.download.serverMediated, true);
    assert.equal(delivered.body.data.download.publicUrl, null);
    assert.equal(summaryCopy.body.data.artifact.patientSummaryInternalDetailsExcluded, true);
    assert.equal(writebackFailed.body.data.writeback.status, 'failed');
    assert.equal(finalized.body.data.readOnly, true);
    assert.equal(finalized.body.data.exportArtifacts.length, 2);
  });
});
