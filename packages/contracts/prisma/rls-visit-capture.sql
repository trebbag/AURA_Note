-- WO-034 local RLS evidence for visit capture runtime tables.
-- Applies only to VisitSession, RecordingAsset, Transcript, and TranscriptSegment.

ALTER TABLE "VisitSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VisitSession" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aura_note_tenant_isolation ON "VisitSession";
CREATE POLICY aura_note_tenant_isolation ON "VisitSession"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "RecordingAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecordingAsset" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aura_note_tenant_isolation ON "RecordingAsset";
CREATE POLICY aura_note_tenant_isolation ON "RecordingAsset"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "Transcript" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transcript" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aura_note_tenant_isolation ON "Transcript";
CREATE POLICY aura_note_tenant_isolation ON "Transcript"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "TranscriptSegment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TranscriptSegment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aura_note_tenant_isolation ON "TranscriptSegment";
CREATE POLICY aura_note_tenant_isolation ON "TranscriptSegment"
  USING ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
