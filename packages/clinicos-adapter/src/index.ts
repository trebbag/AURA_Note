export interface ClinicOsModeContext {
  enabled: boolean;
  tenantId: string;
  siteId: string;
  visitGraphId?: string;
  npCockpitContextId?: string;
}

export interface ClinicOsAdapter {
  getModeContext(): Promise<ClinicOsModeContext>;
  publishAuraNoteEvent(event: unknown): Promise<void>;
  mapVisitContext(input: { localAppointmentId: string; localNoteId: string }): Promise<{ visitGraphId?: string; m17ContextId?: string }>;
}

export class MockClinicOsAdapter implements ClinicOsAdapter {
  async getModeContext(): Promise<ClinicOsModeContext> {
    return { enabled: false, tenantId: 'demo-tenant', siteId: 'demo-site' };
  }
  async publishAuraNoteEvent(_event: unknown): Promise<void> {}
  async mapVisitContext(): Promise<{ visitGraphId?: string; m17ContextId?: string }> {
    return {};
  }
}
