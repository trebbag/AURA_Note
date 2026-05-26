import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';

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
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  after(async () => {
    await app.close();
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

    assert.equal(listed.body.data.appointments.length, 1);
    assert.equal(listed.body.data.appointments[0].noteStatus, 'shell_created');

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

    const transcript = await request(app.getHttpServer())
      .post(`/api/v1/documentation-workspace/appointments/${created.body.data.appointment.appointmentId}/transcript/segments`)
      .set('x-aura-role', 'clinician')
      .send({ speakerRole: 'clinician', text: 'Synthetic mock transcript segment' })
      .expect(201);

    assert.equal(transcript.body.data.transcript.retentionPolicy, 'indefinite');
    assert.equal(transcript.body.data.transcript.segments.length, 1);

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
});
