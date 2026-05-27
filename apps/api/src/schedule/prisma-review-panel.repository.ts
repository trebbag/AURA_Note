import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  ComplianceIssueDto,
  ComplianceReviewDto,
  HistoryGapQuestionDto,
  SuggestionDto,
  TaskDto,
  VisitSelectionDto
} from '@aura-note/contracts';
import { canAcceptSuggestion } from '@aura-note/domain';
import { toDeterministicPersistenceUuid } from '@aura-note/persistence';
import type { AccessContext } from '@aura-note/security';
import type { StoredAppointment } from './schedule.repository';

type TransactionClient = Prisma.TransactionClient;

type ReviewPanelRecord = Prisma.NoteGetPayload<{
  include: {
    patient: true;
    suggestions: true;
    visitSelections: {
      include: {
        sourceSuggestion: true;
      };
    };
    complianceIssues: true;
    historyGapQuestions: {
      include: {
        linkedTask: true;
      };
    };
    tasks: true;
  };
}>;

export interface ReviewPanelSnapshot {
  noteId: string;
  suggestions: SuggestionDto[];
  visitSelections: VisitSelectionDto[];
  complianceReview: ComplianceReviewDto;
  historyGaps: HistoryGapQuestionDto[];
  tasks: TaskDto[];
}

export interface AsyncReviewPanelRepository {
  saveReviewPanel(entry: StoredAppointment): Promise<void>;
  getByNoteId(noteId: string): Promise<ReviewPanelSnapshot | undefined>;
}

export interface PrismaReviewPanelRepositoryOptions {
  tenantId: string;
  siteId?: string;
}

export function createPrismaReviewPanelRepository(
  prisma: PrismaClient,
  options: PrismaReviewPanelRepositoryOptions
): AsyncReviewPanelRepository {
  return new PrismaReviewPanelRepository(prisma, options);
}

export class PrismaReviewPanelRepository implements AsyncReviewPanelRepository {
  private readonly tenantUuid: string;
  private readonly siteUuid: string | undefined;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: PrismaReviewPanelRepositoryOptions
  ) {
    this.tenantUuid = toDeterministicPersistenceUuid('tenant', options.tenantId);
    this.siteUuid = options.siteId ? toDeterministicPersistenceUuid('site', options.tenantId, options.siteId) : undefined;
  }

  async saveReviewPanel(entry: StoredAppointment): Promise<void> {
    this.assertScopeMatchesEntry(entry);
    this.assertLowConfidenceAcceptedSuggestionsHaveOverride(entry);

    await this.prisma.$transaction(async (tx) => {
      const note = await this.getScopedNote(tx, entry.note.noteId);
      if (!note) {
        throw new Error('review panel persistence requires an existing scoped note');
      }

      await this.syncSuggestions(tx, note.id, note.siteId, entry.suggestions ?? []);
      await this.syncTasks(tx, note.id, note.siteId, note.patientId, entry.tasks ?? []);
      await this.syncVisitSelections(tx, note.id, note.siteId, entry.visitSelections ?? [], entry.suggestions ?? []);
      await this.syncComplianceIssues(tx, note.id, note.siteId, entry.complianceIssues ?? []);
      await this.syncHistoryGaps(tx, note.id, note.siteId, entry.historyGaps ?? [], entry.tasks ?? []);
    });
  }

  async getByNoteId(noteId: string): Promise<ReviewPanelSnapshot | undefined> {
    const note = await this.prisma.note.findFirst({
      where: {
        ...this.scopedNoteWhere(),
        OR: [{ id: this.toNoteUuid(noteId) }, { sourceRef: noteId }]
      },
      include: this.includeReviewPanel()
    });

    return note ? this.toSnapshot(note) : undefined;
  }

  private async syncSuggestions(
    tx: TransactionClient,
    noteId: string,
    siteId: string,
    suggestions: SuggestionDto[]
  ): Promise<void> {
    const suggestionIds = suggestions.map((suggestion) => this.toSuggestionUuid(suggestion.suggestionId));
    await tx.suggestion.deleteMany({
      where: {
        tenantId: this.tenantUuid,
        noteId,
        ...(suggestionIds.length > 0 ? { id: { notIn: suggestionIds } } : {})
      }
    });

    for (const suggestion of suggestions) {
      await tx.suggestion.upsert({
        where: {
          tenantId_sourceRef: {
            tenantId: this.tenantUuid,
            sourceRef: suggestion.suggestionId
          }
        },
        create: {
          id: this.toSuggestionUuid(suggestion.suggestionId),
          tenantId: this.tenantUuid,
          siteId,
          noteId,
          sourceRef: suggestion.suggestionId,
          category: suggestion.category,
          label: suggestion.label,
          confidence: suggestion.confidence,
          rationale: suggestion.rationale,
          status: suggestion.status,
          lowConfidenceOverrideRequired: suggestion.lowConfidenceOverrideRequired,
          draftOnly: suggestion.draftOnly,
          supportingEvidenceJson: suggestion.supportingEvidence,
          missingEvidenceJson: suggestion.missingEvidence
        },
        update: {
          siteId,
          noteId,
          category: suggestion.category,
          label: suggestion.label,
          confidence: suggestion.confidence,
          rationale: suggestion.rationale,
          status: suggestion.status,
          lowConfidenceOverrideRequired: suggestion.lowConfidenceOverrideRequired,
          draftOnly: suggestion.draftOnly,
          supportingEvidenceJson: suggestion.supportingEvidence,
          missingEvidenceJson: suggestion.missingEvidence
        }
      });
    }
  }

  private async syncVisitSelections(
    tx: TransactionClient,
    noteId: string,
    siteId: string,
    selections: VisitSelectionDto[],
    suggestions: SuggestionDto[]
  ): Promise<void> {
    const selectionIds = selections.map((selection) => this.toVisitSelectionUuid(selection.visitSelectionId));
    await tx.visitSelection.deleteMany({
      where: {
        tenantId: this.tenantUuid,
        noteId,
        ...(selectionIds.length > 0 ? { id: { notIn: selectionIds } } : {})
      }
    });

    const persistedSuggestionIds = new Set(suggestions.map((suggestion) => suggestion.suggestionId));
    for (const selection of selections) {
      await tx.visitSelection.upsert({
        where: {
          tenantId_sourceRef: {
            tenantId: this.tenantUuid,
            sourceRef: selection.visitSelectionId
          }
        },
        create: {
          id: this.toVisitSelectionUuid(selection.visitSelectionId),
          tenantId: this.tenantUuid,
          siteId,
          noteId,
          sourceRef: selection.visitSelectionId,
          sourceSuggestionId:
            selection.sourceSuggestionId && persistedSuggestionIds.has(selection.sourceSuggestionId)
              ? this.toSuggestionUuid(selection.sourceSuggestionId)
              : null,
          category: selection.category,
          label: selection.label,
          status: selection.humanApproved ? 'accepted' : 'candidate',
          confidence: selection.confidence ?? null,
          overrideReason: selection.overrideReason ?? null,
          createdById: null
        },
        update: {
          siteId,
          noteId,
          sourceSuggestionId:
            selection.sourceSuggestionId && persistedSuggestionIds.has(selection.sourceSuggestionId)
              ? this.toSuggestionUuid(selection.sourceSuggestionId)
              : null,
          category: selection.category,
          label: selection.label,
          status: selection.humanApproved ? 'accepted' : 'candidate',
          confidence: selection.confidence ?? null,
          overrideReason: selection.overrideReason ?? null
        }
      });
    }
  }

  private async syncComplianceIssues(
    tx: TransactionClient,
    noteId: string,
    siteId: string,
    issues: ComplianceIssueDto[]
  ): Promise<void> {
    const issueIds = issues.map((issue) => this.toComplianceIssueUuid(issue.complianceIssueId));
    await tx.complianceIssue.deleteMany({
      where: {
        tenantId: this.tenantUuid,
        noteId,
        ...(issueIds.length > 0 ? { id: { notIn: issueIds } } : {})
      }
    });

    for (const issue of issues) {
      await tx.complianceIssue.upsert({
        where: {
          tenantId_sourceRef: {
            tenantId: this.tenantUuid,
            sourceRef: issue.complianceIssueId
          }
        },
        create: {
          id: this.toComplianceIssueUuid(issue.complianceIssueId),
          tenantId: this.tenantUuid,
          siteId,
          noteId,
          sourceRef: issue.complianceIssueId,
          severity: issue.severity,
          status: issue.blocksFinalize ? 'open_blocking' : 'open',
          title: issue.title,
          detail: issue.detail,
          blocksAction: issue.blocksFinalize
        },
        update: {
          siteId,
          noteId,
          severity: issue.severity,
          status: issue.blocksFinalize ? 'open_blocking' : 'open',
          title: issue.title,
          detail: issue.detail,
          blocksAction: issue.blocksFinalize
        }
      });
    }
  }

  private async syncHistoryGaps(
    tx: TransactionClient,
    noteId: string,
    siteId: string,
    questions: HistoryGapQuestionDto[],
    tasks: TaskDto[]
  ): Promise<void> {
    const questionIds = questions.map((question) => this.toHistoryGapUuid(question.historyGapQuestionId));
    await tx.historyGapQuestion.deleteMany({
      where: {
        tenantId: this.tenantUuid,
        noteId,
        ...(questionIds.length > 0 ? { id: { notIn: questionIds } } : {})
      }
    });

    for (const question of questions) {
      const linkedTask = tasks.find((task) => task.noteId === question.noteId && task.title === question.question);
      await tx.historyGapQuestion.upsert({
        where: {
          tenantId_sourceRef: {
            tenantId: this.tenantUuid,
            sourceRef: question.historyGapQuestionId
          }
        },
        create: {
          id: this.toHistoryGapUuid(question.historyGapQuestionId),
          tenantId: this.tenantUuid,
          siteId,
          noteId,
          sourceRef: question.historyGapQuestionId,
          question: question.question,
          supportsItem: question.supportsItem,
          category: question.category,
          confidenceImpact: question.confidenceImpact,
          status: question.status,
          blockerEligible: question.blockerEligible,
          linkedTaskId: linkedTask ? this.toTaskUuid(linkedTask.taskId) : null
        },
        update: {
          siteId,
          noteId,
          question: question.question,
          supportsItem: question.supportsItem,
          category: question.category,
          confidenceImpact: question.confidenceImpact,
          status: question.status,
          blockerEligible: question.blockerEligible,
          linkedTaskId: linkedTask ? this.toTaskUuid(linkedTask.taskId) : null
        }
      });
    }
  }

  private async syncTasks(
    tx: TransactionClient,
    noteId: string,
    siteId: string,
    patientId: string,
    tasks: TaskDto[]
  ): Promise<void> {
    const taskIds = tasks.map((task) => this.toTaskUuid(task.taskId));
    await tx.task.deleteMany({
      where: {
        tenantId: this.tenantUuid,
        noteId,
        ...(taskIds.length > 0 ? { id: { notIn: taskIds } } : {})
      }
    });

    for (const task of tasks) {
      await tx.task.upsert({
        where: {
          tenantId_sourceRef: {
            tenantId: this.tenantUuid,
            sourceRef: task.taskId
          }
        },
        create: {
          id: this.toTaskUuid(task.taskId),
          tenantId: this.tenantUuid,
          siteId,
          noteId,
          patientId,
          sourceRef: task.taskId,
          title: task.title,
          status: task.adjudicationStatus === 'open' ? 'open' : 'adjudicated',
          blocksSigning: task.blocksSigning,
          adjudicationStatus: task.adjudicationStatus,
          ownerRole: task.ownerRole ?? null,
          ownerUserId: null
        },
        update: {
          siteId,
          noteId,
          patientId,
          title: task.title,
          status: task.adjudicationStatus === 'open' ? 'open' : 'adjudicated',
          blocksSigning: task.blocksSigning,
          adjudicationStatus: task.adjudicationStatus,
          ownerRole: task.ownerRole ?? null
        }
      });
    }
  }

  private toSnapshot(record: ReviewPanelRecord): ReviewPanelSnapshot {
    const noteId = record.sourceRef ?? record.id;
    const tasks = record.tasks.sort(byCreatedAt).map((task) => this.toTaskDto(task, noteId, record.patient.safePatientId));
    const complianceIssues = record.complianceIssues.sort(byCreatedAt).map((issue) => this.toComplianceIssueDto(issue, noteId));

    return {
      noteId,
      suggestions: record.suggestions.sort(byCreatedAt).map((suggestion) => this.toSuggestionDto(suggestion, noteId)),
      visitSelections: record.visitSelections.sort(byCreatedAt).map((selection) => this.toVisitSelectionDto(selection, noteId)),
      complianceReview: {
        noteId,
        issues: complianceIssues,
        finalizeDisabled: complianceIssues.some((issue) => issue.blocksFinalize || issue.severity === 'hard_block')
      },
      historyGaps: record.historyGapQuestions.sort(byCreatedAt).map((question) => this.toHistoryGapQuestionDto(question, noteId)),
      tasks
    };
  }

  private toSuggestionDto(record: ReviewPanelRecord['suggestions'][number], noteId: string): SuggestionDto {
    return {
      suggestionId: record.sourceRef,
      noteId,
      category: toVisitSelectionCategory(record.category),
      label: record.label,
      confidence: record.confidence,
      rationale: record.rationale,
      supportingEvidence: jsonStringArray(record.supportingEvidenceJson),
      missingEvidence: jsonStringArray(record.missingEvidenceJson),
      status: toSuggestionStatus(record.status),
      lowConfidenceOverrideRequired: record.lowConfidenceOverrideRequired,
      draftOnly: true
    };
  }

  private toVisitSelectionDto(
    record: ReviewPanelRecord['visitSelections'][number],
    noteId: string
  ): VisitSelectionDto {
    return {
      visitSelectionId: record.sourceRef,
      noteId,
      category: toVisitSelectionCategory(record.category),
      label: record.label,
      ...(record.confidence === null ? {} : { confidence: record.confidence }),
      humanApproved: record.status === 'accepted',
      ...(record.sourceSuggestion ? { sourceSuggestionId: record.sourceSuggestion.sourceRef } : {}),
      ...(record.overrideReason ? { overrideReason: record.overrideReason } : {})
    };
  }

  private toComplianceIssueDto(record: ReviewPanelRecord['complianceIssues'][number], noteId: string): ComplianceIssueDto {
    return {
      complianceIssueId: record.sourceRef,
      noteId,
      severity: toComplianceSeverity(record.severity),
      title: record.title,
      detail: record.detail,
      blocksFinalize: record.blocksAction,
      source: 'deterministic_mock'
    };
  }

  private toHistoryGapQuestionDto(
    record: ReviewPanelRecord['historyGapQuestions'][number],
    noteId: string
  ): HistoryGapQuestionDto {
    return {
      historyGapQuestionId: record.sourceRef,
      noteId,
      question: record.question,
      supportsItem: record.supportsItem,
      category: toHistoryGapCategory(record.category),
      confidenceImpact: toConfidenceImpact(record.confidenceImpact),
      status: toHistoryGapStatus(record.status),
      blockerEligible: record.blockerEligible
    };
  }

  private toTaskDto(record: ReviewPanelRecord['tasks'][number], noteId: string, safePatientId: string): TaskDto {
    return {
      taskId: record.sourceRef,
      noteId,
      safePatientId,
      title: record.title,
      blocksSigning: record.blocksSigning,
      adjudicationStatus: toTaskAdjudicationStatus(record.adjudicationStatus),
      ...(record.ownerRole ? { ownerRole: record.ownerRole } : {})
    };
  }

  private async getScopedNote(tx: TransactionClient, noteId: string) {
    return tx.note.findFirst({
      where: {
        OR: [{ id: this.toNoteUuid(noteId) }, { sourceRef: noteId }],
        ...this.scopedNoteWhere()
      },
      include: { patient: true }
    });
  }

  private includeReviewPanel() {
    return {
      patient: true,
      suggestions: true,
      visitSelections: {
        include: {
          sourceSuggestion: true
        }
      },
      complianceIssues: true,
      historyGapQuestions: {
        include: {
          linkedTask: true
        }
      },
      tasks: true
    } satisfies Prisma.NoteInclude;
  }

  private scopedNoteWhere(): Prisma.NoteWhereInput {
    return {
      tenantId: this.tenantUuid,
      ...(this.siteUuid ? { siteId: this.siteUuid } : {})
    };
  }

  private assertScopeMatchesEntry(entry: StoredAppointment): void {
    if (entry.appointment.tenantId !== this.options.tenantId || entry.note.tenantId !== this.options.tenantId) {
      throw new Error('review panel adapter blocks cross-tenant persistence');
    }

    if (this.options.siteId && (entry.appointment.siteId !== this.options.siteId || entry.note.siteId !== this.options.siteId)) {
      throw new Error('review panel adapter blocks cross-site persistence');
    }
  }

  private assertLowConfidenceAcceptedSuggestionsHaveOverride(entry: StoredAppointment): void {
    for (const suggestion of entry.suggestions ?? []) {
      const overrideReason = this.findOverrideReason(entry, suggestion.suggestionId);
      const decision = canAcceptSuggestion({
        category: suggestion.category,
        confidence: suggestion.confidence,
        ...(overrideReason
          ? {
              overrideReason,
              supportingEvidence: overrideReason,
              nonSupportingEvidence: overrideReason,
              uncertaintyExplanation: overrideReason,
              confidenceImprovementPlan: overrideReason
            }
          : {})
      });
      if (suggestion.status === 'accepted' && !decision.accepted) {
        throw new Error('review panel persistence blocks low-confidence accepted diagnosis without override metadata');
      }
    }
  }

  private findOverrideReason(entry: StoredAppointment, suggestionId: string): string | undefined {
    return (entry.visitSelections ?? []).find((selection) => selection.sourceSuggestionId === suggestionId)?.overrideReason;
  }

  private toNoteUuid(noteId: string): string {
    return isUuid(noteId) ? noteId : toDeterministicPersistenceUuid('note', this.options.tenantId, noteId);
  }

  private toSuggestionUuid(suggestionId: string): string {
    return isUuid(suggestionId) ? suggestionId : toDeterministicPersistenceUuid('suggestion', this.options.tenantId, suggestionId);
  }

  private toVisitSelectionUuid(selectionId: string): string {
    return isUuid(selectionId) ? selectionId : toDeterministicPersistenceUuid('visit-selection', this.options.tenantId, selectionId);
  }

  private toComplianceIssueUuid(issueId: string): string {
    return isUuid(issueId) ? issueId : toDeterministicPersistenceUuid('compliance-issue', this.options.tenantId, issueId);
  }

  private toHistoryGapUuid(questionId: string): string {
    return isUuid(questionId) ? questionId : toDeterministicPersistenceUuid('history-gap', this.options.tenantId, questionId);
  }

  private toTaskUuid(taskId: string): string {
    return isUuid(taskId) ? taskId : toDeterministicPersistenceUuid('task', this.options.tenantId, taskId);
  }
}

export async function getPersistedReviewPanelForAccessContext(
  prisma: PrismaClient,
  access: AccessContext,
  noteId: string
): Promise<ReviewPanelSnapshot | undefined> {
  if (!access.tenantId || !access.siteId) {
    throw new Error('persisted review panel access requires tenant and site scope');
  }

  const repository = createPrismaReviewPanelRepository(prisma, {
    tenantId: access.tenantId,
    siteId: access.siteId
  });
  return repository.getByNoteId(noteId);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function jsonStringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function byCreatedAt(left: { createdAt: Date }, right: { createdAt: Date }): number {
  return left.createdAt.getTime() - right.createdAt.getTime();
}

function toVisitSelectionCategory(value: string): VisitSelectionDto['category'] {
  const allowed: VisitSelectionDto['category'][] = [
    'cpt',
    'hcpcs',
    'icd10',
    'hcc',
    'em',
    'quality_measure',
    'diagnosis',
    'differential',
    'service',
    'procedure',
    'appointment_to_schedule',
    'plan_item',
    'staff_task'
  ];
  return allowed.includes(value as VisitSelectionDto['category']) ? (value as VisitSelectionDto['category']) : 'plan_item';
}

function toSuggestionStatus(value: string): SuggestionDto['status'] {
  return value === 'accepted' || value === 'removed' ? value : 'candidate';
}

function toComplianceSeverity(value: string): ComplianceIssueDto['severity'] {
  return value === 'info' || value === 'warning' || value === 'hard_block' ? value : 'soft_block';
}

function toHistoryGapCategory(value: string): HistoryGapQuestionDto['category'] {
  return value === 'coding_support' || value === 'care_gap' || value === 'plan_clarity' ? value : 'diagnosis_confidence';
}

function toConfidenceImpact(value: string): HistoryGapQuestionDto['confidenceImpact'] {
  return value === 'low' || value === 'medium' ? value : 'high';
}

function toHistoryGapStatus(value: string): HistoryGapQuestionDto['status'] {
  return value === 'sent_to_ma' || value === 'answered' || value === 'closed' ? value : 'open';
}

function toTaskAdjudicationStatus(value: string): TaskDto['adjudicationStatus'] {
  return value === 'answered' || value === 'closed' || value === 'assigned' || value === 'deferred' ? value : 'open';
}
