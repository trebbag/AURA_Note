import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  RawAudioRetentionMetadataDto,
  TranscriptSegmentDto,
  TranscriptViewDto,
  VisitSessionDto
} from '@aura-note/contracts';
import { toDeterministicPersistenceUuid } from '@aura-note/persistence';
import type { AccessContext } from '@aura-note/security';
import type { StoredAppointment } from './schedule.repository';

type TransactionClient = Prisma.TransactionClient;
type VisitSessionPersistenceData = {
  timerState: string;
  recordingState: string;
  editorUnlocked: boolean;
  startedAt: Date | null;
  pausedAt: Date | null;
  stoppedAt: Date | null;
  exceptionApproved: boolean;
  exceptionReason: string | null;
};
type RecordingAssetPersistenceData = {
  storageKey: string | null;
  status: string;
  retentionClass: 'audio_ephemeral';
  capturedAt: Date;
  purgeAfter: Date;
  metadataJson: Prisma.InputJsonObject;
};

type VisitSessionWithCapture = Prisma.VisitSessionGetPayload<{
  include: {
    note: {
      include: {
        appointment: true;
      };
    };
    recordingAssets: true;
    transcripts: {
      include: {
        segments: true;
      };
    };
  };
}>;

export interface VisitCaptureSnapshot {
  appointmentId: string;
  noteId: string;
  visitSession: VisitSessionDto;
  rawAudioRetention?: RawAudioRetentionMetadataDto;
  transcript?: TranscriptViewDto;
}

export interface AsyncVisitCaptureRepository {
  saveVisitCapture(entry: StoredAppointment): Promise<void>;
  getByAppointmentId(appointmentId: string): Promise<VisitCaptureSnapshot | undefined>;
  getByNoteId(noteId: string): Promise<VisitCaptureSnapshot | undefined>;
}

export interface PrismaVisitCaptureRepositoryOptions {
  tenantId: string;
  siteId?: string;
}

export function createPrismaVisitCaptureRepository(
  prisma: PrismaClient,
  options: PrismaVisitCaptureRepositoryOptions
): AsyncVisitCaptureRepository {
  return new PrismaVisitCaptureRepository(prisma, options);
}

export class PrismaVisitCaptureRepository implements AsyncVisitCaptureRepository {
  private readonly tenantUuid: string;
  private readonly siteUuid: string | undefined;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: PrismaVisitCaptureRepositoryOptions
  ) {
    this.tenantUuid = toDeterministicPersistenceUuid('tenant', options.tenantId);
    this.siteUuid = options.siteId ? toDeterministicPersistenceUuid('site', options.tenantId, options.siteId) : undefined;
  }

  async saveVisitCapture(entry: StoredAppointment): Promise<void> {
    this.assertScopeMatchesEntry(entry);
    if (!entry.visitSession) {
      throw new Error('visit capture persistence requires a visit session');
    }
    const visitSession = entry.visitSession;

    await this.prisma.$transaction(async (tx) => {
      const note = await this.getScopedNote(tx, entry.note.noteId);
      if (!note) {
        throw new Error('visit capture persistence requires an existing scoped note');
      }

      await tx.appointment.update({
        where: { id: note.appointmentId },
        data: { state: entry.appointment.state }
      });
      await tx.note.update({
        where: { id: note.id },
        data: { state: entry.note.state }
      });

      const visitSessionId = this.toVisitSessionUuid(visitSession.visitSessionId);
      await tx.visitSession.upsert({
        where: { id: visitSessionId },
        create: this.toVisitSessionCreate(visitSession, note.id, note.siteId),
        update: this.toVisitSessionUpdate(visitSession)
      });

      if (entry.rawAudioRetention) {
        await tx.recordingAsset.upsert({
          where: { id: this.toRecordingUuid(entry.rawAudioRetention.recordingId) },
          create: this.toRecordingAssetCreate(entry.rawAudioRetention, note.id, visitSessionId, note.siteId),
          update: this.toRecordingAssetUpdate(entry.rawAudioRetention)
        });
      }

      if (entry.transcript) {
        const transcriptId = this.toTranscriptUuid(entry.transcript.transcriptId);
        await tx.transcript.upsert({
          where: { id: transcriptId },
          create: {
            id: transcriptId,
            tenantId: this.tenantUuid,
            siteId: note.siteId,
            noteId: note.id,
            visitSessionId,
            status: 'ready',
            retentionClass: 'transcript',
            retentionPolicy: entry.transcript.retentionPolicy
          },
          update: {
            status: 'ready',
            retentionClass: 'transcript',
            retentionPolicy: entry.transcript.retentionPolicy
          }
        });

        for (const segment of entry.transcript.segments) {
          await this.upsertTranscriptSegment(tx, segment, note.id, transcriptId, note.siteId);
        }
      }
    });
  }

  async getByAppointmentId(appointmentId: string): Promise<VisitCaptureSnapshot | undefined> {
    const appointmentUuid = this.toAppointmentUuid(appointmentId);
    const session = await this.prisma.visitSession.findFirst({
      where: {
        ...this.scopedVisitSessionWhere(),
        note: {
          appointment: {
            OR: [{ id: appointmentUuid }, { sourceRef: appointmentId }]
          }
        }
      },
      include: this.includeVisitCapture()
    });

    return session ? this.toSnapshot(session) : undefined;
  }

  async getByNoteId(noteId: string): Promise<VisitCaptureSnapshot | undefined> {
    const noteUuid = this.toNoteUuid(noteId);
    const session = await this.prisma.visitSession.findFirst({
      where: {
        ...this.scopedVisitSessionWhere(),
        note: {
          OR: [{ id: noteUuid }, { sourceRef: noteId }]
        }
      },
      include: this.includeVisitCapture()
    });

    return session ? this.toSnapshot(session) : undefined;
  }

  private async getScopedNote(tx: TransactionClient, noteId: string) {
    return tx.note.findFirst({
      where: {
        OR: [{ id: this.toNoteUuid(noteId) }, { sourceRef: noteId }],
        tenantId: this.tenantUuid,
        ...(this.siteUuid ? { siteId: this.siteUuid } : {})
      },
      include: { appointment: true }
    });
  }

  private async upsertTranscriptSegment(
    tx: TransactionClient,
    segment: TranscriptSegmentDto,
    noteId: string,
    transcriptId: string,
    siteId: string
  ): Promise<void> {
    const existing = await tx.transcriptSegment.findUnique({
      where: {
        transcriptId_sequence: {
          transcriptId,
          sequence: segment.sequence
        }
      }
    });

    if (existing && (existing.text !== segment.text || existing.speakerRole !== segment.speakerRole)) {
      throw new Error('visit capture persistence blocks transcript segment sequence remapping');
    }

    await tx.transcriptSegment.upsert({
      where: {
        transcriptId_sequence: {
          transcriptId,
          sequence: segment.sequence
        }
      },
      create: {
        id: this.toTranscriptSegmentUuid(segment.transcriptSegmentId),
        tenantId: this.tenantUuid,
        siteId,
        transcriptId,
        noteId,
        sequence: segment.sequence,
        speakerRole: segment.speakerRole,
        text: segment.text,
        source: segment.source,
        createdAt: new Date(segment.createdAt)
      },
      update: {
        speakerRole: segment.speakerRole,
        text: segment.text,
        source: segment.source
      }
    });
  }

  private toSnapshot(record: VisitSessionWithCapture): VisitCaptureSnapshot {
    const transcript = record.transcripts[0];
    const recording = record.recordingAssets[0];
    const noteId = record.note.sourceRef ?? record.note.id;

    return {
      appointmentId: record.note.appointment.sourceRef ?? record.note.appointment.id,
      noteId,
      visitSession: {
        visitSessionId: record.id,
        noteId,
        timerState: toTimerState(record.timerState),
        recordingState: toRecordingState(record.recordingState),
        editorUnlocked: record.editorUnlocked,
        ...(record.exceptionReason ? { exceptionReason: record.exceptionReason } : {}),
        ...(record.startedAt ? { startedAt: record.startedAt.toISOString() } : {}),
        ...(record.pausedAt ? { pausedAt: record.pausedAt.toISOString() } : {}),
        ...(record.stoppedAt ? { stoppedAt: record.stoppedAt.toISOString() } : {})
      },
      ...(recording
        ? {
            rawAudioRetention: {
              recordingId: recording.id,
              noteId,
              retentionClass: 'audio_ephemeral',
              capturedAt: recording.capturedAt.toISOString(),
              purgeAfter: recording.purgeAfter.toISOString(),
              purgeEligible: recording.purgeAfter.getTime() <= Date.now(),
              ...(recording.storageKey ? { storageKey: recording.storageKey } : {})
            }
          }
        : {}),
      ...(transcript
        ? {
            transcript: {
              noteId,
              transcriptId: transcript.id,
              retentionPolicy: 'indefinite',
              segments: transcript.segments
                .sort((left, right) => left.sequence - right.sequence)
                .map((segment) => ({
                  transcriptSegmentId: segment.id,
                  noteId,
                  sequence: segment.sequence,
                  speakerRole: toSpeakerRole(segment.speakerRole),
                  text: segment.text,
                  source: 'mock_transcription',
                  createdAt: segment.createdAt.toISOString()
                }))
            }
          }
        : {})
    };
  }

  private toVisitSessionCreate(session: VisitSessionDto, noteId: string, siteId: string): Prisma.VisitSessionCreateInput {
    return {
      id: this.toVisitSessionUuid(session.visitSessionId),
      tenant: { connect: { id: this.tenantUuid } },
      site: { connect: { id: siteId } },
      note: { connect: { id: noteId } },
      ...this.toVisitSessionUpdate(session)
    };
  }

  private toVisitSessionUpdate(session: VisitSessionDto): VisitSessionPersistenceData {
    return {
      timerState: session.timerState,
      recordingState: session.recordingState,
      editorUnlocked: session.editorUnlocked,
      startedAt: session.startedAt ? new Date(session.startedAt) : null,
      pausedAt: session.pausedAt ? new Date(session.pausedAt) : null,
      stoppedAt: session.stoppedAt ? new Date(session.stoppedAt) : null,
      exceptionApproved: session.recordingState === 'exception_approved',
      exceptionReason: session.exceptionReason ?? null
    };
  }

  private toRecordingAssetCreate(
    metadata: RawAudioRetentionMetadataDto,
    noteId: string,
    visitSessionId: string,
    siteId: string
  ): Prisma.RecordingAssetCreateInput {
    return {
      id: this.toRecordingUuid(metadata.recordingId),
      tenant: { connect: { id: this.tenantUuid } },
      site: { connect: { id: siteId } },
      note: { connect: { id: noteId } },
      visitSession: { connect: { id: visitSessionId } },
      ...this.toRecordingAssetUpdate(metadata)
    };
  }

  private toRecordingAssetUpdate(metadata: RawAudioRetentionMetadataDto): RecordingAssetPersistenceData {
    return {
      storageKey: metadata.storageKey ?? null,
      status: metadata.purgeEligible ? 'purge_eligible' : 'retained',
      retentionClass: 'audio_ephemeral',
      capturedAt: new Date(metadata.capturedAt),
      purgeAfter: new Date(metadata.purgeAfter),
      metadataJson: {
        checksum: metadata.checksum ?? null,
        contentLengthBytes: metadata.contentLengthBytes ?? null,
        storageProvider: metadata.storageProvider ?? null
      }
    };
  }

  private scopedVisitSessionWhere(): Prisma.VisitSessionWhereInput {
    return {
      tenantId: this.tenantUuid,
      ...(this.siteUuid ? { siteId: this.siteUuid } : {})
    };
  }

  private includeVisitCapture() {
    return {
      note: {
        include: {
          appointment: true
        }
      },
      recordingAssets: true,
      transcripts: {
        include: {
          segments: true
        }
      }
    } satisfies Prisma.VisitSessionInclude;
  }

  private assertScopeMatchesEntry(entry: StoredAppointment): void {
    if (entry.appointment.tenantId !== this.options.tenantId || entry.note.tenantId !== this.options.tenantId) {
      throw new Error('visit capture adapter blocks cross-tenant persistence');
    }

    if (this.options.siteId && (entry.appointment.siteId !== this.options.siteId || entry.note.siteId !== this.options.siteId)) {
      throw new Error('visit capture adapter blocks cross-site persistence');
    }
  }

  private toAppointmentUuid(appointmentId: string): string {
    return isUuid(appointmentId) ? appointmentId : toDeterministicPersistenceUuid('appointment', this.options.tenantId, appointmentId);
  }

  private toNoteUuid(noteId: string): string {
    return isUuid(noteId) ? noteId : toDeterministicPersistenceUuid('note', this.options.tenantId, noteId);
  }

  private toVisitSessionUuid(visitSessionId: string): string {
    return isUuid(visitSessionId)
      ? visitSessionId
      : toDeterministicPersistenceUuid('visit-session', this.options.tenantId, visitSessionId);
  }

  private toRecordingUuid(recordingId: string): string {
    return isUuid(recordingId) ? recordingId : toDeterministicPersistenceUuid('recording', this.options.tenantId, recordingId);
  }

  private toTranscriptUuid(transcriptId: string): string {
    return isUuid(transcriptId) ? transcriptId : toDeterministicPersistenceUuid('transcript', this.options.tenantId, transcriptId);
  }

  private toTranscriptSegmentUuid(segmentId: string): string {
    return isUuid(segmentId) ? segmentId : toDeterministicPersistenceUuid('transcript-segment', this.options.tenantId, segmentId);
  }
}

export async function getPersistedVisitCaptureForAccessContext(
  prisma: PrismaClient,
  access: AccessContext,
  appointmentId: string
): Promise<VisitCaptureSnapshot | undefined> {
  if (!access.tenantId || !access.siteId) {
    throw new Error('persisted visit capture access requires tenant and site scope');
  }

  const repository = createPrismaVisitCaptureRepository(prisma, {
    tenantId: access.tenantId,
    siteId: access.siteId
  });
  return repository.getByAppointmentId(appointmentId);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function toTimerState(value: string): VisitSessionDto['timerState'] {
  return value === 'running' || value === 'paused' || value === 'stopped' ? value : 'not_started';
}

function toRecordingState(value: string): VisitSessionDto['recordingState'] {
  return value === 'recording' || value === 'paused' || value === 'stopped' || value === 'exception_approved'
    ? value
    : 'not_started';
}

function toSpeakerRole(value: string): TranscriptSegmentDto['speakerRole'] {
  return value === 'patient' || value === 'ma' || value === 'system' ? value : 'clinician';
}
