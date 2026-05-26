import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  evaluateAiGatewayInvocationQueue,
  evaluateClinicOsOutbox,
  evaluateEhrAdapterHealth,
  evaluateEhrWritebackQueue,
  evaluateRawAudioRetention,
  getWorkerStatus
} from './main';

describe('worker scaffold', () => {
  it('reports the CP-3 AI gateway scaffold', () => {
    const status = getWorkerStatus();

    assert.equal(status.status, 'cp3_ai_gateway_scaffold_ready');
    assert.equal(status.checkpoint, 'CP-3-in-progress');
    assert.equal(status.implementedJobs.includes('raw_audio_retention_candidate_scan'), true);
    assert.equal(status.implementedJobs.includes('ehr_writeback_queue_status_scan'), true);
    assert.equal(status.implementedJobs.includes('ehr_adapter_health_check_scan'), true);
    assert.equal(status.implementedJobs.includes('clinicos_mapping_outbox_scan'), true);
    assert.equal(status.implementedJobs.includes('ai_gateway_mock_invocation_status_scan'), true);
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
});
