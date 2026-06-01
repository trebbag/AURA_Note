import type {
  RecordingChunkMetadataDto,
  TranscriptSegmentDto,
  TranscriptionJobDto,
  TranscriptionProviderStatusDto
} from '@aura-note/contracts';

export interface TranscriptionProviderJobInput {
  appointmentId: string;
  noteId: string;
  chunks: RecordingChunkMetadataDto[];
  existingSegmentCount: number;
  existingSourceChunkIds: Set<string>;
  nowIso: string;
  nextId: (prefix: string) => string;
}

export interface TranscriptionProviderJobResult {
  providerStatus: TranscriptionProviderStatusDto;
  transcriptionJob: TranscriptionJobDto;
  transcriptSegments: TranscriptSegmentDto[];
}

export interface ServerSideTranscriptionProviderAdapter {
  readonly providerId: string;
  getStatus(): TranscriptionProviderStatusDto;
  requestTranscription(input: TranscriptionProviderJobInput): TranscriptionProviderJobResult;
}

const providerRuntimeStates: NonNullable<TranscriptionProviderStatusDto['runtimeStates']> = [
  'loading',
  'empty',
  'ready',
  'saving',
  'failed',
  'permission_denied',
  'read_only',
  'demo_fixture',
  'microphone_permission_denied',
  'device_unavailable',
  'upload_interrupted',
  'provider_unavailable',
  'low_confidence',
  'diarization_degraded',
  'correction_history',
  'recording_exception_approved'
];

const retryPolicy: NonNullable<TranscriptionProviderStatusDto['retryPolicy']> = {
  maxAttempts: 3,
  retryableStates: ['upload_interrupted', 'provider_unavailable'],
  deadLetterState: 'dead_lettered_metadata_only'
};

function baseStatus(): Pick<
  TranscriptionProviderStatusDto,
  | 'providerBoundary'
  | 'credentialState'
  | 'runtimeStates'
  | 'retryPolicy'
  | 'rawAudioRetentionPolicy'
  | 'transcriptRetentionPolicy'
  | 'rawAudioPayloadStorageEnabled'
  | 'diarizationState'
> {
  return {
    providerBoundary: 'server_side_adapter',
    credentialState: 'not_configured',
    runtimeStates: providerRuntimeStates,
    retryPolicy,
    rawAudioRetentionPolicy: 'one_week',
    transcriptRetentionPolicy: 'indefinite',
    rawAudioPayloadStorageEnabled: false,
    diarizationState: 'placeholder_degraded'
  };
}

export class DeterministicMockTranscriptionProvider implements ServerSideTranscriptionProviderAdapter {
  readonly providerId = 'deterministic-mock-transcription';

  getStatus(): TranscriptionProviderStatusDto {
    return {
      providerId: this.providerId,
      mode: 'mock_only',
      configured: true,
      liveProviderCallsEnabled: false,
      baaRequiredBeforeLiveUse: true,
      supportsDiarization: false,
      speakerLabelMode: 'placeholder',
      confidenceMetadataAvailable: true,
      disabledReason: 'Live transcription providers require later governance, BAA/private pathway, and production PHI storage approval.',
      ...baseStatus()
    };
  }

  requestTranscription(input: TranscriptionProviderJobInput): TranscriptionProviderJobResult {
    const providerStatus = this.getStatus();
    const acceptedChunks = input.chunks.filter((chunk) => chunk.accepted && chunk.rawPhiAudioStored === false);
    const transcriptSegments: TranscriptSegmentDto[] = acceptedChunks
      .filter((chunk) => !input.existingSourceChunkIds.has(chunk.chunkId))
      .map((chunk, index) => ({
        transcriptSegmentId: input.nextId('transcript-segment'),
        noteId: input.noteId,
        sequence: input.existingSegmentCount + index + 1,
        speakerRole: index % 2 === 0 ? 'clinician' : 'patient',
        text: `Synthetic mock transcript from metadata chunk ${chunk.sequence}`,
        source: 'mock_transcription',
        sourceChunkId: chunk.chunkId,
        confidence: chunk.durationMs > 1000 ? 0.91 : 0.62,
        speakerLabel: `Speaker ${index + 1} placeholder`,
        providerName: 'deterministic_mock',
        createdAt: input.nowIso
      }));

    return {
      providerStatus,
      transcriptionJob: {
        transcriptionJobId: input.nextId('transcription-job'),
        appointmentId: input.appointmentId,
        noteId: input.noteId,
        providerId: providerStatus.providerId,
        providerMode: providerStatus.mode,
        status: 'processed',
        queuedAt: input.nowIso,
        processedAt: input.nowIso,
        sourceChunkIds: input.chunks.map((chunk) => chunk.chunkId),
        segmentCount: transcriptSegments.length,
        liveProviderCalled: false
      },
      transcriptSegments
    };
  }
}

export class DisabledLiveTranscriptionProvider implements ServerSideTranscriptionProviderAdapter {
  readonly providerId = 'disabled-live-transcription-provider';

  getStatus(): TranscriptionProviderStatusDto {
    return {
      providerId: this.providerId,
      mode: 'external_disabled',
      configured: false,
      liveProviderCallsEnabled: false,
      baaRequiredBeforeLiveUse: true,
      supportsDiarization: false,
      speakerLabelMode: 'placeholder',
      confidenceMetadataAvailable: true,
      disabledReason: 'Live transcription provider calls fail closed until vendor, BAA, credential, consent, and PHI transport approvals exist.',
      ...baseStatus()
    };
  }

  requestTranscription(input: TranscriptionProviderJobInput): TranscriptionProviderJobResult {
    const providerStatus = this.getStatus();
    const failedReason =
      providerStatus.disabledReason ??
      'Live transcription provider calls fail closed until vendor, BAA, credential, consent, and PHI transport approvals exist.';
    return {
      providerStatus,
      transcriptionJob: {
        transcriptionJobId: input.nextId('transcription-job'),
        appointmentId: input.appointmentId,
        noteId: input.noteId,
        providerId: providerStatus.providerId,
        providerMode: providerStatus.mode,
        status: 'failed',
        queuedAt: input.nowIso,
        failedReason,
        sourceChunkIds: input.chunks.map((chunk) => chunk.chunkId),
        segmentCount: 0,
        liveProviderCalled: false
      },
      transcriptSegments: []
    };
  }
}
