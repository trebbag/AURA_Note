import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  evaluateAiGatewayInvocationQueue,
  evaluateCoachingSignalsForDashboard,
  evaluateClinicOsOutbox,
  evaluateEhrAdapterHealth,
  evaluateEhrWritebackQueue,
  evaluateRetentionJobRun,
  evaluateRawAudioRetention,
  evaluateStorageBackedRetentionDeletion,
  getWorkerStatus,
  processMockTranscriptionWorkerJob
} from './main';
import { InMemoryObjectStorageAdapter, buildStorageKey } from '@aura-note/storage';

describe('worker scaffold', () => {
  it('reports the CP-4 hardening scaffold', () => {
    const status = getWorkerStatus();

    assert.equal(status.status, 'cp4_hardening_scaffold_ready');
    assert.equal(status.checkpoint, 'CP-4-in-progress');
    assert.equal(status.implementedJobs.includes('raw_audio_retention_candidate_scan'), true);
    assert.equal(status.implementedJobs.includes('transcript_retention_indefinite_scan'), true);
    assert.equal(status.implementedJobs.includes('mock_transcription_job_processor'), true);
    assert.equal(status.implementedJobs.includes('ehr_writeback_queue_status_scan'), true);
    assert.equal(status.implementedJobs.includes('ehr_adapter_health_check_scan'), true);
    assert.equal(status.implementedJobs.includes('clinicos_mapping_outbox_scan'), true);
    assert.equal(status.implementedJobs.includes('ai_gateway_mock_invocation_status_scan'), true);
    assert.equal(status.implementedJobs.includes('coaching_signal_projection_refresh'), true);
    assert.equal(status.implementedJobs.includes('audit_export_bundle_generation'), true);
    assert.equal(status.implementedJobs.includes('structured_log_redaction_probe'), true);
    assert.equal(status.jobsDeferredToWorkOrders.includes('destructive_storage_purge'), true);
  });

  it('processes deterministic mock transcription from metadata-only chunks without live provider calls', () => {
    const result = processMockTranscriptionWorkerJob(
      'note-worker-audio-001',
      [
        {
          chunkId: 'chunk-worker-audio-001',
          appointmentId: 'appt-worker-audio-001',
          noteId: 'note-worker-audio-001',
          visitSessionId: 'visit-session-worker-audio-001',
          sequence: 1,
          capturedAt: '2026-05-27T23:35:00.000Z',
          durationMs: 15000,
          contentLengthBytes: 0,
          checksum: 'metadata-only-worker-001',
          transportMode: 'metadata_only_synthetic',
          rawPhiAudioStored: false,
          accepted: true,
          duplicate: false
        }
      ],
      '2026-05-27T23:35:05.000Z'
    );

    assert.equal(result.status, 'processed');
    assert.equal(result.liveProviderCalled, false);
    assert.equal(result.transcript.retentionPolicy, 'indefinite');
    assert.equal(result.transcript.segments[0]?.confidence, 0.91);
    assert.equal(result.transcript.providerStatus?.liveProviderCallsEnabled, false);
  });

  it('marks raw audio records purge-eligible after the one-week retention window', () => {
    const [record] = evaluateRawAudioRetention(
      [
        {
          recordingId: 'recording-001',
          noteId: 'note-001',
          retentionClass: 'audio_ephemeral',
          capturedAt: '2026-05-26T15:00:00.000Z',
          purgeAfter: '2026-06-02T15:00:00.000Z',
          purgeEligible: false
        }
      ],
      '2026-06-02T15:00:00.000Z'
    );

    assert.equal(record?.purgeEligible, true);
  });

  it('summarizes raw audio and indefinite transcript retention in one audited job run', () => {
    const result = evaluateRetentionJobRun(
      [
        {
          recordingId: 'recording-001',
          noteId: 'note-001',
          retentionClass: 'audio_ephemeral',
          capturedAt: '2026-05-26T15:00:00.000Z',
          purgeAfter: '2026-06-02T15:00:00.000Z',
          purgeEligible: false
        }
      ],
      [
        {
          noteId: 'note-001',
          transcriptId: 'transcript-001',
          retentionPolicy: 'indefinite',
          segments: []
        }
      ],
      '2026-06-02T15:00:00.000Z'
    );

    assert.equal(result.status, 'completed');
    assert.equal(result.policies.find((policy) => policy.recordClass === 'audio_ephemeral')?.purgeEligibleCount, 1);
    assert.equal(result.policies.find((policy) => policy.recordClass === 'transcript')?.retentionRule, 'indefinite');
    assert.equal(result.policies.every((policy) => policy.destructivePurgeEnabled === false), true);
    assert.equal(result.domainEvents[0]?.eventType, 'retention.scan_completed.v1');
    assert.equal(result.transcriptPurgeCount, 0);
  });

  it('deletes purge-eligible raw-audio storage objects only with approval controls', () => {
    const storage = new InMemoryObjectStorageAdapter(() => '2026-06-02T15:00:00.000Z');
    const storageKey = buildStorageKey({
      tenantId: 'tenant-synthetic-primary',
      siteId: 'site-synthetic-primary',
      recordClass: 'raw-audio',
      recordId: 'recording-001',
      fileName: 'raw-audio.bin'
    });
    const stored = storage.putObject({
      tenantId: 'tenant-synthetic-primary',
      siteId: 'site-synthetic-primary',
      storageKey,
      body: 'synthetic raw audio bytes',
      contentType: 'application/octet-stream',
      retentionClass: 'audio_ephemeral',
      traceId: 'trace-retention-worker-002'
    });

    const blocked = evaluateStorageBackedRetentionDeletion(
      [
        {
          recordingId: 'recording-001',
          noteId: 'note-001',
          retentionClass: 'audio_ephemeral',
          capturedAt: '2026-05-26T15:00:00.000Z',
          purgeAfter: '2026-06-02T15:00:00.000Z',
          purgeEligible: false,
          storageProvider: 'in_memory',
          storageKey,
          checksum: stored.checksum,
          contentLengthBytes: stored.contentLengthBytes
        }
      ],
      [
        {
          noteId: 'note-001',
          transcriptId: 'transcript-001',
          retentionPolicy: 'indefinite',
          segments: []
        }
      ],
      '2026-06-02T15:00:00.000Z',
      storage,
      { destructiveDeletionEnabled: true, traceId: 'trace-retention-worker-002' }
    );

    assert.equal(blocked.deletionResults?.[0]?.deletionResult, 'skipped_not_enabled');
    assert.notEqual(storage.headObject(storageKey), undefined);

    const deleted = evaluateStorageBackedRetentionDeletion(
      [
        {
          recordingId: 'recording-001',
          noteId: 'note-001',
          retentionClass: 'audio_ephemeral',
          capturedAt: '2026-05-26T15:00:00.000Z',
          purgeAfter: '2026-06-02T15:00:00.000Z',
          purgeEligible: false,
          storageProvider: 'in_memory',
          storageKey,
          checksum: stored.checksum,
          contentLengthBytes: stored.contentLengthBytes
        }
      ],
      [
        {
          noteId: 'note-001',
          transcriptId: 'transcript-001',
          retentionPolicy: 'indefinite',
          segments: []
        }
      ],
      '2026-06-02T15:00:00.000Z',
      storage,
      {
        destructiveDeletionEnabled: true,
        approvalToken: 'approval-token-synthetic',
        approvalId: 'approval-retention-synthetic-001',
        traceId: 'trace-retention-worker-002'
      }
    );

    assert.equal(deleted.deletionResults?.[0]?.deleted, true);
    assert.equal(deleted.deletionResults?.[0]?.approvalId, 'approval-retention-synthetic-001');
    assert.equal(deleted.transcriptPurgeCount, 0);
    assert.equal(storage.headObject(storageKey), undefined);
    assert.equal(deleted.domainEvents[0]?.payload.transcriptPurgeCount, 0);
  });

  it('preserves writeback failure and disabled queue states for UI/support review', () => {
    const [failed, disabled] = evaluateEhrWritebackQueue([
      {
        writebackJobId: 'writeback-001',
        noteId: 'note-001',
        target: 'final_note',
        vendor: 'athenahealth',
        status: 'failed',
        configured: true,
        humanApproved: true,
        retryable: false,
        failedAt: '2026-05-26T20:00:00.000Z',
        failureReason: 'Synthetic adapter failure'
      },
      {
        writebackJobId: 'writeback-002',
        noteId: 'note-001',
        target: 'final_note',
        vendor: 'athenahealth',
        status: 'not_configured',
        configured: false,
        humanApproved: false,
        retryable: true
      }
    ]);

    assert.equal(failed?.retryable, true);
    assert.equal(disabled?.retryable, false);
  });

  it('marks AI gateway invocations as human-review-required and rejected when context was rejected', () => {
    const [invocation] = evaluateAiGatewayInvocationQueue([
      {
        contextPackage: {
          contextPackageId: 'ai-context-rejected-001',
          tenantId: 'tenant-synthetic-primary',
          siteId: 'site-synthetic-primary',
          safePatientId: 'safe-patient-synthetic-001',
          clinicalFacts: {},
          evidence: [],
          sourceIds: [],
          phiHandling: 'reject',
          redactedPaths: [],
          rejectedPaths: ['clinicalFacts.patientName'],
          deidentified: false,
          createdAt: '2026-05-26T17:00:00.000Z'
        },
        request: {
          tenantId: 'tenant-synthetic-primary',
          siteId: 'site-synthetic-primary',
          purpose: 'suggestions',
          contextPackage: {
            contextPackageId: 'ai-context-rejected-001',
            tenantId: 'tenant-synthetic-primary',
            siteId: 'site-synthetic-primary',
            safePatientId: 'safe-patient-synthetic-001',
            clinicalFacts: {},
            evidence: [],
            sourceIds: [],
            phiHandling: 'reject',
            redactedPaths: [],
            rejectedPaths: ['clinicalFacts.patientName'],
            deidentified: false,
            createdAt: '2026-05-26T17:00:00.000Z'
          },
          outputType: 'suggestion',
          traceId: 'trace-ai-worker-001',
          promptId: 'aura-note-suggestions-v1',
          promptVersion: '2026-05-26.cp3',
          modelVersion: 'not-invoked',
          policyMode: 'mock_only',
          humanReviewStatus: 'required'
        },
        response: {
          output: {},
          outputType: 'suggestion',
          modelMode: 'external_disabled',
          warnings: [],
          humanReviewRequired: true,
          sourceEvidenceIds: [],
          rejected: false
        },
        auditEvent: {
          auditEventId: 'audit-ai-worker-001',
          tenantId: 'tenant-synthetic-primary',
          action: 'ai.phi_rejected',
          entityType: 'AiGateway',
          entityId: 'ai-context-rejected-001',
          traceId: 'trace-ai-worker-001',
          createdAt: '2026-05-26T17:00:00.000Z'
        },
        domainEvents: []
      }
    ]);

    assert.equal(invocation?.response.humanReviewRequired, true);
    assert.equal(invocation?.response.rejected, true);
  });

  it('normalizes disabled and failed EHR adapter health for support review', () => {
    const [disabled, failed] = evaluateEhrAdapterHealth([
      {
        vendor: 'athenahealth',
        connected: true,
        mode: 'disabled',
        tenantId: 'tenant-synthetic-primary',
        siteId: 'site-synthetic-primary',
        health: 'ok',
        warnings: []
      },
      {
        vendor: 'athenahealth',
        connected: true,
        mode: 'sandbox',
        tenantId: 'tenant-synthetic-primary',
        siteId: 'site-synthetic-primary',
        health: 'failed',
        warnings: ['Synthetic failure']
      }
    ]);

    assert.equal(disabled?.connected, false);
    assert.equal(disabled?.health, 'disabled');
    assert.equal(failed?.connected, false);
  });

  it('preserves AURA Note permission enforcement on ClinicOS outbox records', () => {
    const [status] = evaluateClinicOsOutbox([
      {
        modeContext: {
          enabled: true,
          hostMode: 'clinicos_integrated',
          tenantId: 'tenant-synthetic-primary',
          siteId: 'site-synthetic-primary',
          availability: 'unavailable',
          warnings: []
        },
        mappings: [],
        publishedEvents: [
          {
            outboxId: 'clinicos-outbox-001',
            tenantId: 'tenant-synthetic-primary',
            siteId: 'site-synthetic-primary',
            eventType: 'visit.started.v1',
            targetModules: ['M03', 'M17'],
            status: 'queued',
            createdAt: '2026-05-26T18:30:00.000Z'
          }
        ],
        permissionsStillEnforcedByAuraNote: true,
        auditEvent: {
          auditEventId: 'audit-clinicos-001',
          tenantId: 'tenant-synthetic-primary',
          action: 'clinicos.status',
          entityType: 'ClinicOsAdapter',
          entityId: 'clinicos_integrated',
          traceId: 'trace-clinicos-worker-001',
          createdAt: '2026-05-26T18:30:00.000Z'
        },
        domainEvents: []
      }
    ]);

    assert.equal(status?.permissionsStillEnforcedByAuraNote, true);
    assert.equal(status?.publishedEvents[0]?.status, 'failed_unavailable');
  });

  it('projects coaching reports to aggregate-only dashboard metrics', () => {
    const projection = evaluateCoachingSignalsForDashboard([
      {
        reportId: 'coach-report-001',
        clinicianId: 'clinician-001',
        noteId: 'note-001',
        generatedAt: '2026-05-26T18:45:00.000Z',
        overallScore: 80,
        unavailableReasons: [],
        privacyLabel: 'own_clinician_only',
        patientFacingExcluded: true,
        signals: [
          {
            coachingSignalId: 'coach-signal-001',
            noteId: 'note-001',
            clinicianId: 'clinician-001',
            category: 'documentation_completeness',
            score: 80,
            title: 'Synthetic coaching',
            detail: 'Synthetic detail',
            evidenceIds: ['evidence-001'],
            improvementPrompt: 'Synthetic prompt',
            billingRelated: false,
            patientFacingExcluded: true,
            generatedAt: '2026-05-26T18:45:00.000Z'
          }
        ],
        auditEvent: {
          auditEventId: 'audit-coach-001',
          tenantId: 'tenant-synthetic-primary',
          action: 'coaching.view_own',
          entityType: 'CoachingReport',
          entityId: 'coach-report-001',
          traceId: 'trace-coach-worker-001',
          createdAt: '2026-05-26T18:45:00.000Z'
        },
        domainEvents: []
      }
    ]);

    assert.equal(projection.aggregateOnly, true);
    assert.equal(projection.providerCount, 1);
    assert.equal(projection.overallAverage, 80);
  });
});
