-- WO-031 local RLS evidence for the persisted schedule/note slice.
-- Applies only to core tables currently exercised by the Prisma schedule adapter.

ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tenant" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aura_note_tenant_isolation ON "Tenant";
CREATE POLICY aura_note_tenant_isolation ON "Tenant"
  USING ("id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("id" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "Site" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Site" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aura_note_tenant_isolation ON "Site";
CREATE POLICY aura_note_tenant_isolation ON "Site"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aura_note_tenant_isolation ON "User";
CREATE POLICY aura_note_tenant_isolation ON "User"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Patient" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aura_note_tenant_isolation ON "Patient";
CREATE POLICY aura_note_tenant_isolation ON "Patient"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aura_note_tenant_isolation ON "Appointment";
CREATE POLICY aura_note_tenant_isolation ON "Appointment"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "Note" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Note" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aura_note_tenant_isolation ON "Note";
CREATE POLICY aura_note_tenant_isolation ON "Note"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "IdempotencyRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IdempotencyRecord" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aura_note_tenant_isolation ON "IdempotencyRecord";
CREATE POLICY aura_note_tenant_isolation ON "IdempotencyRecord"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "PatientLinkage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PatientLinkage" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aura_note_tenant_isolation ON "PatientLinkage";
CREATE POLICY aura_note_tenant_isolation ON "PatientLinkage"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "ChartContextSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChartContextSnapshot" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aura_note_tenant_isolation ON "ChartContextSnapshot";
CREATE POLICY aura_note_tenant_isolation ON "ChartContextSnapshot"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
