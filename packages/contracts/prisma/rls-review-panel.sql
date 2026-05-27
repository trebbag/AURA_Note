ALTER TABLE "Suggestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Suggestion" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS suggestion_tenant_isolation ON "Suggestion";
CREATE POLICY suggestion_tenant_isolation ON "Suggestion"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "VisitSelection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VisitSelection" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS visit_selection_tenant_isolation ON "VisitSelection";
CREATE POLICY visit_selection_tenant_isolation ON "VisitSelection"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "ComplianceIssue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ComplianceIssue" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS compliance_issue_tenant_isolation ON "ComplianceIssue";
CREATE POLICY compliance_issue_tenant_isolation ON "ComplianceIssue"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "HistoryGapQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HistoryGapQuestion" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS history_gap_question_tenant_isolation ON "HistoryGapQuestion";
CREATE POLICY history_gap_question_tenant_isolation ON "HistoryGapQuestion"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS task_tenant_isolation ON "Task";
CREATE POLICY task_tenant_isolation ON "Task"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
