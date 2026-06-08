#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertExists(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    throw new Error(`Missing Figma backend catch-up artifact: ${relativePath}`);
  }
}

function assertIncludes(relativePath, needles) {
  const content = read(relativePath);
  for (const needle of needles) {
    if (!content.includes(needle)) {
      throw new Error(`${relativePath} is missing required Figma backend catch-up evidence: ${needle}`);
    }
  }
}

function assertNoPrototypeBackendImports() {
  const scannedFiles = [
    'apps/api/src/app-shell/app-shell.service.ts',
    'apps/api/src/app-shell/app-shell.controller.ts',
    'apps/api/src/notes/notes.controller.ts',
    'apps/api/src/schedule/schedule.service.ts',
    'apps/web/app/aura-note/page.tsx',
    'apps/web/app/aura-note/finalization/[noteId]/finalization-client.tsx',
    'apps/web/app/aura-note/workspace/[appointmentId]/workspace-client.tsx',
    'apps/web/app/aura-note/app-shell-client.tsx',
    'apps/web/lib/aura-note-api-client.ts'
  ];
  for (const file of scannedFiles) {
    const content = read(file);
    for (const forbidden of ["from '@supabase", 'from "supabase', 'createClient(']) {
      if (content.includes(forbidden)) {
        throw new Error(`${file} contains prohibited prototype backend usage: ${forbidden}`);
      }
    }
  }
}

function assertNoLaunchClaims() {
  const forbidden = [
    'production launch approved',
    'HIPAA certified',
    'claim submission enabled',
    'autonomous finalization enabled',
    'live PHI processing enabled'
  ];
  const files = [
    'docs/FIGMA_MAKE_BACKEND_CATCH_UP_AUDIT.md',
    'docs/FRONTEND_RUNTIME_INTEGRATION.md',
    'RUN_LOG.md',
    'repo_status.json'
  ];
  for (const file of files) {
    const content = read(file).toLowerCase();
    for (const phrase of forbidden) {
      if (content.includes(phrase.toLowerCase())) {
        throw new Error(`${file} contains prohibited launch/live-readiness claim: ${phrase}`);
      }
    }
  }
}

assertExists('docs/FIGMA_MAKE_BACKEND_CATCH_UP_AUDIT.md');
assertExists('docs/FIGMA_MAKE_ZIP_REFERENCE_AUDIT.md');
assertExists('apps/api/src/app-shell/app-shell.service.ts');
assertExists('apps/api/src/app-shell/app-shell.controller.ts');
assertExists('apps/api/src/app-shell/app-shell.module.ts');
assertExists('apps/api/src/app-shell/app-shell.e2e.test.ts');
assertExists('apps/web/app/aura-note/app-shell-client.tsx');

assertIncludes('docs/FIGMA_MAKE_BACKEND_CATCH_UP_AUDIT.md', [
  'AI Powered Clinical Note Editor',
  'Step by Step Workflow Wizard',
  'Local ZIP Reference Package',
  'docs/FIGMA_MAKE_ZIP_REFERENCE_AUDIT.md',
  'adapt/rebuild',
  'Supabase',
  'RevenuePilot',
  'GET /api/v1/app-shell',
  'GET /api/v1/notes/{noteId}/content',
  'GET /api/v1/schedule/appointments/{appointmentId}/workspace-validation',
  'POST /api/v1/schedule/appointments/{appointmentId}/chart-intake-status',
  'GET /api/v1/documentation-workspace/appointments/{appointmentId}/transcript/live',
  'POST /api/v1/notes/{noteId}/visit-selections/{visitSelectionId}/remove',
  'POST /api/v1/notes/{noteId}/compliance/issues/{complianceIssueId}/actions',
  'GET /api/v1/notes/{noteId}/finalization',
  'GET /api/v1/standalone/operations/runtime',
  'EvidenceSpanDto',
  'FinalizationEditorVariantDto',
  'PatientQuestionWorkflowDto',
  'CarePlanItemDto',
  'OperationsRuntimeViewDto',
  'aura_markdown_v1',
  'submittedClaim: false',
  'No raw PHI'
]);
assertIncludes('docs/FIGMA_MAKE_ZIP_REFERENCE_AUDIT.md', [
  'AI-Powered Clinical Note Editor.zip',
  'Step by Step Workflow Wizard.zip',
  '.figma-make-reference/',
  'Design 1 source reference',
  'Design 2 source reference',
  'Rejected Design 1 prototype behavior',
  'Rejected or adapted Design 2 prototype behavior',
  'Production-intended routes must use typed API clients and backend state',
  'final pixel-perfect Figma approval'
]);
assertIncludes('packages/contracts/src/index.ts', [
  'AppShellViewDto',
  'ClinicalWorkflowDashboardDto',
  'NotificationDto',
  'ActivityFeedItemDto',
  'NoteContentDto',
  'NoteVersionDto',
  'AutosaveStatusDto',
  'note.content_autosaved.v1',
  'note.version_restored.v1',
  'ScheduleQueryDto',
  'ScheduleAppointmentMetadataDto',
  'WorkspaceValidationDto',
  'TranscriptLiveViewDto',
  'VisitSelectionRemoveRequestDto',
  'ComplianceIssueActionRequestDto',
  'EvidenceSpanDto',
  'FinalizationStepItemStatusDto',
  'FinalizationEditorVariantDto',
  'PatientQuestionWorkflowDto',
  'CarePlanItemDto',
  'PatientInsightSnapshotDto',
  'BillingValidationDetailDto',
  'FinalizationDispatchMetadataDto',
  'OperationsRuntimeViewDto',
  'OperationsAnalyticsSnapshotDto',
  'OperationsSettingsSummaryDto',
  'appointment.workspace_validation_checked.v1',
  'chart_context.intake_status_updated.v1',
  'transcript.live_view_polled.v1',
  'visit_selection.removed.v1',
  'compliance.issue_action_recorded.v1',
  'revenuePilotBrandingAccepted: false',
  'supabaseBackendAccepted: false',
  'patientFacingRevenueExposed: false'
]);
assertIncludes('packages/contracts/openapi/aura-note.v1.yaml', [
  '/app-shell:',
  '/notes/{noteId}/content:',
  '/notes/{noteId}/content/autosave:',
  '/notes/{noteId}/versions:',
  '/notes/{noteId}/versions/{versionId}/restore:',
  '/schedule/appointments/{appointmentId}/workspace-validation:',
  '/schedule/appointments/{appointmentId}/chart-intake-status:',
  '/documentation-workspace/appointments/{appointmentId}/transcript/live:',
  '/notes/{noteId}/suggestions/{suggestionId}/restore:',
  '/notes/{noteId}/visit-selections/{visitSelectionId}/remove:',
  '/notes/{noteId}/visit-selections/{visitSelectionId}/category:',
  '/notes/{noteId}/compliance/issues/{complianceIssueId}/actions:',
  '/standalone/operations/runtime:',
  'operationId: getAppShell',
  'operationId: autosaveNoteContent',
  'operationId: validateWorkspaceEntry',
  'operationId: updateChartIntakeStatus',
  'operationId: getTranscriptLiveView',
  'operationId: getStandaloneOperationsRuntime',
  'operationId: removeVisitSelection',
  'operationId: recordComplianceIssueAction',
  'EvidenceSpan',
  'FinalizationEditorVariant',
  'FinalizationDispatchMetadata',
  'OperationsRuntimeView',
  'OperationsAnalyticsSnapshot',
  'OperationsSettingsSummary',
  'AppShellResponse',
  'NoteContentResponse',
  'ScheduleAppointmentMetadata',
  'WorkspaceValidationResponse',
  'ClinicalWorkflowDashboard',
  'revenuePilotBrandingAccepted',
  'supabaseBackendAccepted'
]);
assertIncludes('apps/api/src/app.module.ts', ['AppShellModule']);
assertIncludes('apps/api/src/app-shell/app-shell.service.ts', [
  'getAppShell',
  'createApiEnvelope',
  'audit.event_recorded.v1',
  'productionLaunchApproved: false',
  'liveVendorActionsEnabled: false',
  'submittedClaim: false',
  'supabaseBackendAccepted: false'
]);
assertIncludes('apps/api/src/app-shell/app-shell.e2e.test.ts', [
  '/api/v1/app-shell',
  'revenuePilotBrandingAccepted',
  'supabaseBackendAccepted',
  'tenant-other'
]);
assertIncludes('apps/api/src/notes/notes.controller.ts', [
  'getNoteContent',
  'autosaveNoteContent',
  'listNoteVersions',
  'restoreNoteVersion'
]);
assertIncludes('apps/api/src/schedule/schedule.service.ts', [
  'aura_markdown_v1',
  'note.content_autosaved.v1',
  'note.version_restored.v1',
  'createScheduleMetadata',
  'validateWorkspaceEntry',
  'updateChartIntakeStatus',
  'appointment.workspace_validation_checked.v1',
  'chart_context.intake_status_updated.v1',
  'getTranscriptLiveViewByAppointment',
  'removeVisitSelection',
  'changeVisitSelectionCategory',
  'recordComplianceIssueAction',
  'refreshFinalizationDesignRuntime',
  'createFinalizationEvidenceSpans',
  'createFinalizationEditorVariants',
  'createFinalizationPatientQuestions',
  'createFinalizationCarePlanItems',
  'createFinalizationBillingValidation',
  'transcript.live_view_polled.v1',
  'visit_selection.category_changed.v1',
  'compliance.issue_action_recorded.v1',
  'containsForbiddenPhiText',
  'draft_note:edit'
]);
assertIncludes('apps/api/src/schedule/schedule.e2e.test.ts', [
  '/content/autosave',
  '/versions',
  '/workspace-validation',
  '/chart-intake-status',
  '/transcript/live',
  '/visit-selections/',
  '/compliance/issues/',
  'note.content_autosaved.v1',
  'appointment.workspace_validation_checked.v1',
  'chart_context.intake_status_updated.v1',
  'transcript.live_view_polled.v1',
  'visit_selection.category_changed.v1',
  'compliance.issue_action_recorded.v1',
  'dispatchMetadata.submittedClaim',
  'editorVariants.some',
  'patientInsightSnapshot.predictiveInsightsEnabled',
  'MRN: SYNTHETIC-MRN'
]);
assertIncludes('apps/api/src/operations/operations.service.ts', [
  'getOperationsRuntime',
  'createOperationsRuntime',
  'standalone_operations_api_composite',
  'productionAnalyticsVendorEnabled: false',
  'secretValuesReturned: false',
  'claimSubmissionEnabled: false',
  'operational.readiness_checked.v1'
]);
assertIncludes('apps/api/src/operations/operations.controller.ts', ['getOperationsRuntime']);
assertIncludes('apps/api/src/operations/operations.e2e.test.ts', [
  '/api/v1/standalone/operations/runtime',
  'standalone_operations_api_composite',
  'secretValuesReturned',
  'aiPreferencesGovernedBy',
  'operational.readiness_checked.v1'
]);
assertIncludes('apps/web/lib/aura-note-api-client.ts', [
  'AppShellResponseDto',
  'getAppShell',
  'OperationsRuntimeResponseDto',
  'getOperationsRuntime',
  'NoteContentResponseDto',
  'ScheduleQueryDto',
  'TranscriptLiveViewDto',
  'VisitSelectionRemoveRequestDto',
  'ComplianceIssueActionRequestDto',
  'validateWorkspaceEntry',
  'updateChartIntakeStatus',
  'autosaveNoteContent',
  'restoreNoteVersion',
  'getTranscriptLiveView',
  'removeVisitSelection',
  'recordComplianceIssueAction'
]);
assertIncludes('apps/web/app/aura-note/page.tsx', ['getAppShell', 'AuraNoteAppShell']);
assertIncludes('apps/web/app/aura-note/workspace/[appointmentId]/workspace-client.tsx', [
  'getNoteContent',
  'autosaveNoteContent',
  'restoreNoteVersion',
  'getTranscriptLiveView',
  'removeVisitSelection',
  'recordComplianceIssueAction',
  'aura_markdown_v1'
]);
assertIncludes('apps/web/app/aura-note/operations/page.tsx', [
  'getOperationsRuntime',
  'Operations runtime',
  'Analytics and settings',
  'Figma operations source reference',
  'Design 1 Operations Mapping',
  'prototypeImport=false',
  'typedApiClient=true',
  'Analytics dashboard tabs',
  'Settings dashboard tabs',
  'Billing & Coding',
  'Health Outcomes',
  'Note Quality',
  'Staff Performance',
  'Suggestion Governance',
  'Advanced Controls',
  'Operations Analytics',
  'Backend-backed operations analytics series',
  'Analytics Series',
  'Settings And Governance Runtime',
  'Operations activity feed',
  'Settings Runtime',
  'productionAnalyticsVendorEnabled'
]);
assertIncludes('apps/web/app/aura-note/finalization/[noteId]/finalization-client.tsx', [
  'Finalization workflow board',
  'Finalization Progress',
  'Canonical finalization step context',
  'Visit Selections Review',
  'Draft Claim Preview Review',
  'Selected And Suggested Item Review',
  'Evidence questions and dispatch',
  'Evidence highlighter',
  'Patient questions popup',
  'Billing dispatch dock',
  'Finalization runtime state',
  'Evidence Spans',
  'Dual Editor Variants',
  'Patient Questions',
  'Care Plan Candidates',
  'Patient Insight Snapshot',
  'Billing Validation',
  'Dispatch Metadata',
  'Patient summary side',
  'submittedClaim=',
  'Patient portal enabled'
]);
assertIncludes('apps/web/app/aura-note/schedule/page.tsx', [
  'validateWorkspaceEntry',
  'updateChartIntakeStatus',
  'Figma schedule builder',
  'Schedule command card',
  'Schedule filter summary',
  'Backend-backed schedule filters',
  'Workspace validation result'
]);
assertIncludes('apps/web/app/aura-note/drafts/page.tsx', [
  'Figma draft notes table',
  'Active Documentation Table',
  'typed API state'
]);
assertIncludes('apps/web/app/aura-note/finalized/page.tsx', [
  'Figma finalized notes table',
  'Read-Only Artifact Table',
  'writable=false'
]);
assertIncludes('apps/web/app/aura-note/app-shell-client.tsx', [
  'figma-node-shell',
  'Dashboard quick actions',
  'Clinical command dashboard',
  'dashboard-quick-actions',
  'AURA Note Dashboard',
  'AURA Note sections',
  'Disabled Feature States',
  'dashboard-feed-grid'
]);
assertIncludes('apps/web/app/aura-note/workspace/[appointmentId]/workspace-client.tsx', [
  'Editor command deck',
  'Editor toolbar',
  'Draft markdown changes persist only after Autosave.',
  'Audio wave and transcript controls',
  'Documentation workspace',
  'Rich text editor surface',
  'Selected codes bar',
  'Suggestions panel',
  'Figma compliance drawer',
  'Compliance And Quality Drawer',
  'AURA Note &lt;75%'
]);
assertIncludes('apps/web/e2e/aura-note-routes.spec.ts', [
  'Figma schedule builder',
  'Schedule filter summary',
  'Dashboard quick actions',
  'Clinical command dashboard',
  'Editor command deck',
  'Editor toolbar',
  'Figma compliance drawer',
  'Selected codes bar',
  'Suggestions panel',
  'Analytics and settings',
  'Figma operations source reference',
  'Analytics dashboard tabs',
  'Settings dashboard tabs',
  'Operations runtime',
  'Backend-backed operations analytics series',
  'Analytics Series',
  'productionAnalyticsVendorEnabled=false',
  'Operations runtime composed',
  'Finalization workflow board',
  'Canonical finalization step context',
  'Evidence questions and dispatch',
  'Evidence highlighter',
  'Patient questions popup',
  'Billing dispatch dock',
  'Finalization Progress',
  'Finalization runtime state',
  'Evidence Spans',
  'Dual Editor Variants',
  'Dispatch Metadata',
  'submittedClaim=false',
  'Patient portal enabled: false'
]);
assertIncludes('docs/FIGMA_DATA_AND_API_MAP.md', ['GET /app-shell', 'note content/autosave/version', 'workspace-validation', 'chart-intake-status', 'transcript/live', 'visit-selections/{visitSelectionId}/remove', 'compliance/issues/{complianceIssueId}/actions', 'finalization runtime state', 'EvidenceSpanDto', 'Figma Make prototype-only Supabase']);
assertIncludes('docs/FRONTEND_RUNTIME_INTEGRATION.md', [
  'GET /api/v1/app-shell',
  'POST /api/v1/notes/{noteId}/content/autosave',
  'GET /api/v1/schedule/appointments/{appointmentId}/workspace-validation',
  'POST /api/v1/schedule/appointments/{appointmentId}/chart-intake-status',
  'GET /api/v1/documentation-workspace/appointments/{appointmentId}/transcript/live',
  'POST /api/v1/notes/{noteId}/visit-selections/{visitSelectionId}/remove',
  'POST /api/v1/notes/{noteId}/compliance/issues/{complianceIssueId}/actions',
  'GET /api/v1/notes/{noteId}/finalization',
  'Design 2 finalization runtime state',
  'figma:backend-catch-up-readiness'
]);
assertIncludes('package.json', ['"figma:backend-catch-up-readiness"']);
assertIncludes('.github/workflows/ci.yml', ['pnpm figma:backend-catch-up-readiness']);

assertNoPrototypeBackendImports();
assertNoLaunchClaims();

console.log(
  JSON.stringify(
    {
      status: 'ready_synthetic',
      gate: 'figma_backend_catch_up',
      appShellDtoPresent: true,
      apiRoutePresent: true,
      typedClientPresent: true,
      noteContentAutosavePresent: true,
      scheduleRuntimeMetadataPresent: true,
      workspaceValidationPresent: true,
      chartIntakeMetadataOnlyPresent: true,
      reviewDispositionActionsPresent: true,
      complianceIssueActionsPresent: true,
      transcriptLiveViewPresent: true,
      finalizationDesignRuntimePresent: true,
      operationsRuntimePresent: true,
      figmaSourceNodeVisualSurfacesPresent: true,
      auraNoteBrandingPreserved: true,
      prototypeBackendRejected: true,
      livePhiOrVendorTouched: false,
      productionLaunchClaimed: false
    },
    null,
    2
  )
);
