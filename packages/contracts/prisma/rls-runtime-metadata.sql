ALTER TABLE "Template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Template" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS template_tenant_isolation ON "Template";
CREATE POLICY template_tenant_isolation ON "Template"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "DotPhrase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DotPhrase" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dot_phrase_tenant_isolation ON "DotPhrase";
CREATE POLICY dot_phrase_tenant_isolation ON "DotPhrase"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "CoachingReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoachingReport" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS coaching_report_tenant_isolation ON "CoachingReport";
CREATE POLICY coaching_report_tenant_isolation ON "CoachingReport"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "AuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditEvent" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_event_tenant_isolation ON "AuditEvent";
CREATE POLICY audit_event_tenant_isolation ON "AuditEvent"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "DomainEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DomainEvent" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS domain_event_tenant_isolation ON "DomainEvent";
CREATE POLICY domain_event_tenant_isolation ON "DomainEvent"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "IntegrationConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntegrationConnection" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS integration_connection_tenant_isolation ON "IntegrationConnection";
CREATE POLICY integration_connection_tenant_isolation ON "IntegrationConnection"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "ModeMapping" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ModeMapping" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mode_mapping_tenant_isolation ON "ModeMapping";
CREATE POLICY mode_mapping_tenant_isolation ON "ModeMapping"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "FeatureFlag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeatureFlag" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feature_flag_tenant_isolation ON "FeatureFlag";
CREATE POLICY feature_flag_tenant_isolation ON "FeatureFlag"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "SupportStatusSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportStatusSnapshot" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_status_snapshot_tenant_isolation ON "SupportStatusSnapshot";
CREATE POLICY support_status_snapshot_tenant_isolation ON "SupportStatusSnapshot"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
