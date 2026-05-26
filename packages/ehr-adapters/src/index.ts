export type EhrVendor = 'athenahealth' | 'epic' | 'eclinicalworks' | 'generic_mock';

export interface EhrConnectionStatus {
  vendor: EhrVendor;
  connected: boolean;
  mode: 'disabled' | 'mock' | 'sandbox' | 'production';
  warnings: string[];
}

export interface EhrAdapter {
  getConnectionStatus(): Promise<EhrConnectionStatus>;
  getAppointment(externalAppointmentId: string): Promise<unknown>;
  getPatientDemographics(externalPatientId: string): Promise<unknown>;
  getEncounterContext(externalEncounterId: string): Promise<unknown>;
  writeFinalNote(input: { externalEncounterId: string; finalNoteText: string; idempotencyKey: string }): Promise<{ queued: boolean; externalJobId?: string }>;
}

export class MockEhrAdapter implements EhrAdapter {
  async getConnectionStatus(): Promise<EhrConnectionStatus> {
    return { vendor: 'generic_mock', connected: true, mode: 'mock', warnings: [] };
  }
  async getAppointment(externalAppointmentId: string): Promise<unknown> {
    return { externalAppointmentId, source: 'mock' };
  }
  async getPatientDemographics(externalPatientId: string): Promise<unknown> {
    return { externalPatientId, displayName: 'Synthetic Patient', source: 'mock' };
  }
  async getEncounterContext(externalEncounterId: string): Promise<unknown> {
    return { externalEncounterId, source: 'mock', problems: [], medications: [], allergies: [] };
  }
  async writeFinalNote(input: { externalEncounterId: string; finalNoteText: string; idempotencyKey: string }): Promise<{ queued: boolean; externalJobId?: string }> {
    return { queued: true, externalJobId: `mock-writeback-${input.idempotencyKey}` };
  }
}
