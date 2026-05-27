ALTER TABLE "FinalizationRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinalizationRun" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finalization_run_tenant_isolation ON "FinalizationRun";
CREATE POLICY finalization_run_tenant_isolation ON "FinalizationRun"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "WizardStepDecision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WizardStepDecision" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wizard_step_decision_tenant_isolation ON "WizardStepDecision";
CREATE POLICY wizard_step_decision_tenant_isolation ON "WizardStepDecision"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "EnhancedNoteVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EnhancedNoteVersion" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enhanced_note_version_tenant_isolation ON "EnhancedNoteVersion";
CREATE POLICY enhanced_note_version_tenant_isolation ON "EnhancedNoteVersion"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "PatientSummaryVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PatientSummaryVersion" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS patient_summary_version_tenant_isolation ON "PatientSummaryVersion";
CREATE POLICY patient_summary_version_tenant_isolation ON "PatientSummaryVersion"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "BillingAttestation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillingAttestation" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS billing_attestation_tenant_isolation ON "BillingAttestation";
CREATE POLICY billing_attestation_tenant_isolation ON "BillingAttestation"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "DraftClaimPreview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DraftClaimPreview" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS draft_claim_preview_tenant_isolation ON "DraftClaimPreview";
CREATE POLICY draft_claim_preview_tenant_isolation ON "DraftClaimPreview"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "ExportArtifact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExportArtifact" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS export_artifact_tenant_isolation ON "ExportArtifact";
CREATE POLICY export_artifact_tenant_isolation ON "ExportArtifact"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "EhrWritebackJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EhrWritebackJob" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ehr_writeback_job_tenant_isolation ON "EhrWritebackJob";
CREATE POLICY ehr_writeback_job_tenant_isolation ON "EhrWritebackJob"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
