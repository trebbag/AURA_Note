import type { EhrWritebackTarget } from '@aura-note/contracts';

export type EhrVendor = 'athenahealth' | 'epic' | 'eclinicalworks' | 'generic_mock';
export type EhrAdapterMode = 'disabled' | 'mock' | 'sandbox' | 'production';
export type ChartContextSliceType =
  | 'demographics'
  | 'encounter'
  | 'appointment'
  | 'problems'
  | 'diagnoses_history'
  | 'medications'
  | 'allergies'
  | 'immunizations'
  | 'vitals'
  | 'labs'
  | 'documents'
  | 'prior_notes'
  | 'procedures'
  | 'social_history'
  | 'quality'
  | 'payer'
  | 'tasks'
  | 'billing_context';

export interface EhrConnectionStatus {
  vendor: EhrVendor;
  connected: boolean;
  mode: EhrAdapterMode;
  tenantId: string;
  siteId: string;
  health: 'ok' | 'degraded' | 'disabled' | 'failed';
  warnings: string[];
}

export interface EhrAdapterConfig {
  vendor: EhrVendor;
  mode: EhrAdapterMode;
  tenantId: string;
  siteId: string;
  apiBaseUrl?: string;
  clientIdConfigured?: boolean;
  clientSecretConfigured?: boolean;
  simulateFailure?: boolean;
}

export interface PatientSearchQuery {
  safePatientId?: string;
  externalPatientRef?: string;
  searchToken?: string;
}

export interface PatientCanonical {
  safePatientId: string;
  externalPatientRef: string;
  sourceSystem: EhrVendor;
  displayLabel: string;
  demographicsAvailable: boolean;
}

export interface PatientSearchResult {
  patient: PatientCanonical;
  matchConfidence: number;
  source: 'mock' | 'athenahealth_sandbox';
}

export interface AppointmentCanonical {
  externalAppointmentId: string;
  safePatientId: string;
  externalPatientRef: string;
  clinicianId: string;
  startsAt: string;
  durationMinutes: number;
  visitType: string;
  sourceSystem: EhrVendor;
}

export interface EncounterCanonical {
  externalEncounterId: string;
  externalAppointmentId: string;
  safePatientId: string;
  externalPatientRef: string;
  visitType: string;
  sourceSystem: EhrVendor;
  status: 'open' | 'locked' | 'closed' | 'unknown';
}

export interface ChartContextSlice {
  sliceType: ChartContextSliceType;
  sourceSystem: EhrVendor;
  sourceRecordRef: string;
  value: Record<string, unknown>;
  effectiveAt: string;
  freshness: 'current_visit' | 'recent' | 'historical' | 'unknown';
  sourceQuality: 'high' | 'medium' | 'low';
  phiClassification: 'phi_reference' | 'restricted';
  allowedPurposes: Array<'care' | 'documentation' | 'billing_review' | 'ai_context_packaging'>;
  evidenceIds: string[];
}

export interface ChartContextPackage {
  chartContextPackageId: string;
  tenantId: string;
  siteId: string;
  safePatientId: string;
  externalPatientRef: string;
  externalEncounterId: string;
  sourceSystem: EhrVendor;
  requestedSlices: ChartContextSliceType[];
  slices: ChartContextSlice[];
  staleSliceCount: number;
  createdAt: string;
  warnings: string[];
}

export interface WritebackPayload {
  externalEncounterId: string;
  target: EhrWritebackTarget;
  content: string;
  idempotencyKey: string;
  humanApproved: boolean;
}

export interface WritebackResult {
  target: EhrWritebackTarget;
  vendor: EhrVendor;
  queued: boolean;
  configured: boolean;
  retryable: boolean;
  status: 'not_configured' | 'queued' | 'failed' | 'unsupported_by_vendor';
  externalJobId?: string;
  failureReason?: string;
}

export interface WritebackCapabilityMatrix {
  vendor: EhrVendor;
  finalNote: boolean;
  patientSummary: boolean;
  tasks: boolean;
  attachments: boolean;
  configured: boolean;
  unsupportedReasons: string[];
}

export interface AdapterHealth {
  status: EhrConnectionStatus;
  capabilities: WritebackCapabilityMatrix;
  checkedAt: string;
}

export interface EhrAdapter {
  readonly vendor: EhrVendor;
  getConnectionStatus(): Promise<EhrConnectionStatus>;
  healthCheck(): Promise<AdapterHealth>;
  searchPatients(query: PatientSearchQuery): Promise<PatientSearchResult[]>;
  getPatient(patientRef: string): Promise<PatientCanonical>;
  getSchedule(startIso: string, endIso: string): Promise<AppointmentCanonical[]>;
  getAppointment(externalAppointmentId: string): Promise<AppointmentCanonical>;
  getEncounter(externalEncounterId: string): Promise<EncounterCanonical>;
  getChartContext(input: {
    safePatientId: string;
    externalPatientRef: string;
    externalEncounterId: string;
    requestedSlices: ChartContextSliceType[];
  }): Promise<ChartContextPackage>;
  writeFinalNote(input: WritebackPayload): Promise<WritebackResult>;
  writePatientSummary(input: WritebackPayload): Promise<WritebackResult>;
  writeTasks(input: Array<Omit<WritebackPayload, 'target'>>): Promise<WritebackResult[]>;
  getWritebackCapabilities(): Promise<WritebackCapabilityMatrix>;
}

const DEFAULT_TENANT_ID = 'tenant-synthetic-primary';
const DEFAULT_SITE_ID = 'site-synthetic-primary';

export class DisabledEhrAdapter implements EhrAdapter {
  readonly vendor: EhrVendor;
  protected readonly config: EhrAdapterConfig;

  constructor(config: Partial<EhrAdapterConfig> = {}) {
    this.vendor = config.vendor ?? 'generic_mock';
    this.config = {
      vendor: this.vendor,
      mode: 'disabled',
      tenantId: config.tenantId ?? DEFAULT_TENANT_ID,
      siteId: config.siteId ?? DEFAULT_SITE_ID
    };
  }

  async getConnectionStatus(): Promise<EhrConnectionStatus> {
    return {
      vendor: this.vendor,
      connected: false,
      mode: 'disabled',
      tenantId: this.config.tenantId,
      siteId: this.config.siteId,
      health: 'disabled',
      warnings: ['EHR adapter disabled. Standalone mode remains available.']
    };
  }

  async healthCheck(): Promise<AdapterHealth> {
    return {
      status: await this.getConnectionStatus(),
      capabilities: await this.getWritebackCapabilities(),
      checkedAt: new Date().toISOString()
    };
  }

  async searchPatients(_query: PatientSearchQuery): Promise<PatientSearchResult[]> {
    return [];
  }

  async getPatient(patientRef: string): Promise<PatientCanonical> {
    return createSyntheticPatient(this.vendor, patientRef);
  }

  async getSchedule(_startIso: string, _endIso: string): Promise<AppointmentCanonical[]> {
    return [];
  }

  async getAppointment(externalAppointmentId: string): Promise<AppointmentCanonical> {
    return createSyntheticAppointment(this.vendor, externalAppointmentId);
  }

  async getEncounter(externalEncounterId: string): Promise<EncounterCanonical> {
    return createSyntheticEncounter(this.vendor, externalEncounterId);
  }

  async getChartContext(input: {
    safePatientId: string;
    externalPatientRef: string;
    externalEncounterId: string;
    requestedSlices: ChartContextSliceType[];
  }): Promise<ChartContextPackage> {
    return createChartContextPackage({
      vendor: this.vendor,
      mode: 'disabled',
      tenantId: this.config.tenantId,
      siteId: this.config.siteId,
      ...input
    });
  }

  async writeFinalNote(input: WritebackPayload): Promise<WritebackResult> {
    return this.disabledWriteback(input.target);
  }

  async writePatientSummary(input: WritebackPayload): Promise<WritebackResult> {
    return this.disabledWriteback(input.target);
  }

  async writeTasks(input: Array<Omit<WritebackPayload, 'target'>>): Promise<WritebackResult[]> {
    return input.map(() => this.disabledWriteback('final_note'));
  }

  async getWritebackCapabilities(): Promise<WritebackCapabilityMatrix> {
    return {
      vendor: this.vendor,
      finalNote: false,
      patientSummary: false,
      tasks: false,
      attachments: false,
      configured: false,
      unsupportedReasons: ['Adapter is disabled or not configured.']
    };
  }

  protected disabledWriteback(target: EhrWritebackTarget): WritebackResult {
    return {
      target,
      vendor: this.vendor,
      queued: false,
      configured: false,
      retryable: false,
      status: 'not_configured',
      failureReason: 'EHR writeback is not configured.'
    };
  }
}

export class MockEhrAdapter extends DisabledEhrAdapter {
  readonly vendor: EhrVendor = 'generic_mock';

  constructor(config: Partial<EhrAdapterConfig> = {}) {
    super({ ...config, vendor: 'generic_mock', mode: 'mock' });
  }

  override async getConnectionStatus(): Promise<EhrConnectionStatus> {
    return {
      vendor: this.vendor,
      connected: true,
      mode: 'mock',
      tenantId: this.config.tenantId,
      siteId: this.config.siteId,
      health: 'ok',
      warnings: []
    };
  }

  override async searchPatients(query: PatientSearchQuery): Promise<PatientSearchResult[]> {
    return [
      {
        patient: createSyntheticPatient(this.vendor, query.externalPatientRef ?? 'mock-patient-ref-001'),
        matchConfidence: 0.98,
        source: 'mock'
      }
    ];
  }

  override async getSchedule(startIso: string, _endIso: string): Promise<AppointmentCanonical[]> {
    return [
      {
        ...createSyntheticAppointment(this.vendor, 'mock-appointment-001'),
        startsAt: startIso
      }
    ];
  }

  override async getChartContext(input: {
    safePatientId: string;
    externalPatientRef: string;
    externalEncounterId: string;
    requestedSlices: ChartContextSliceType[];
  }): Promise<ChartContextPackage> {
    return createChartContextPackage({
      vendor: this.vendor,
      mode: 'mock',
      tenantId: this.config.tenantId,
      siteId: this.config.siteId,
      ...input
    });
  }

  override async writeFinalNote(input: WritebackPayload): Promise<WritebackResult> {
    return this.mockWriteback(input);
  }

  override async writePatientSummary(input: WritebackPayload): Promise<WritebackResult> {
    return this.mockWriteback(input);
  }

  override async writeTasks(input: Array<Omit<WritebackPayload, 'target'>>): Promise<WritebackResult[]> {
    return input.map((payload) => this.mockWriteback({ ...payload, target: 'final_note' }));
  }

  override async getWritebackCapabilities(): Promise<WritebackCapabilityMatrix> {
    return {
      vendor: this.vendor,
      finalNote: true,
      patientSummary: true,
      tasks: true,
      attachments: false,
      configured: true,
      unsupportedReasons: ['Attachments remain deferred in the mock adapter.']
    };
  }

  protected mockWriteback(input: WritebackPayload): WritebackResult {
    if (!input.humanApproved) {
      return {
        target: input.target,
        vendor: this.vendor,
        queued: false,
        configured: true,
        retryable: false,
        status: 'failed',
        failureReason: 'Human approval is required before EHR writeback queueing.'
      };
    }

    return {
      target: input.target,
      vendor: this.vendor,
      queued: true,
      configured: true,
      retryable: false,
      status: 'queued',
      externalJobId: `mock-writeback-${input.idempotencyKey}`
    };
  }
}

export class AthenahealthAdapter extends MockEhrAdapter {
  readonly vendor = 'athenahealth' as const;
  private readonly athenaConfig: EhrAdapterConfig;

  constructor(config: Partial<EhrAdapterConfig> = {}) {
    super({ ...config, vendor: 'athenahealth', mode: config.mode ?? 'sandbox' });
    this.athenaConfig = {
      vendor: 'athenahealth',
      mode: config.mode ?? 'sandbox',
      tenantId: config.tenantId ?? DEFAULT_TENANT_ID,
      siteId: config.siteId ?? DEFAULT_SITE_ID,
      ...(config.apiBaseUrl ? { apiBaseUrl: config.apiBaseUrl } : {}),
      clientIdConfigured: config.clientIdConfigured ?? false,
      clientSecretConfigured: config.clientSecretConfigured ?? false,
      simulateFailure: config.simulateFailure ?? false
    };
  }

  override async getConnectionStatus(): Promise<EhrConnectionStatus> {
    if (this.athenaConfig.mode === 'disabled') {
      return {
        vendor: this.vendor,
        connected: false,
        mode: 'disabled',
        tenantId: this.athenaConfig.tenantId,
        siteId: this.athenaConfig.siteId,
        health: 'disabled',
        warnings: ['Athenahealth adapter is isolated and disabled until sandbox credentials are configured.']
      };
    }

    return {
      vendor: this.vendor,
      connected: this.athenaConfig.mode === 'sandbox',
      mode: this.athenaConfig.mode,
      tenantId: this.athenaConfig.tenantId,
      siteId: this.athenaConfig.siteId,
      health: this.athenaConfig.simulateFailure ? 'failed' : 'ok',
      warnings: this.athenaConfig.clientIdConfigured && this.athenaConfig.clientSecretConfigured
        ? ['Athenahealth sandbox scaffold only; no live API calls are made in WO-010.']
        : ['Athenahealth credentials are not configured; using sandbox fixture behavior only.']
    };
  }

  override async searchPatients(query: PatientSearchQuery): Promise<PatientSearchResult[]> {
    return [
      {
        patient: createSyntheticPatient(this.vendor, query.externalPatientRef ?? 'athena-patient-ref-synthetic-001'),
        matchConfidence: 0.96,
        source: 'athenahealth_sandbox'
      }
    ];
  }

  override async getChartContext(input: {
    safePatientId: string;
    externalPatientRef: string;
    externalEncounterId: string;
    requestedSlices: ChartContextSliceType[];
  }): Promise<ChartContextPackage> {
    return createChartContextPackage({
      vendor: this.vendor,
      mode: this.athenaConfig.mode,
      tenantId: this.athenaConfig.tenantId,
      siteId: this.athenaConfig.siteId,
      ...input
    });
  }

  override async getWritebackCapabilities(): Promise<WritebackCapabilityMatrix> {
    const configured = this.athenaConfig.clientIdConfigured === true && this.athenaConfig.clientSecretConfigured === true;
    return {
      vendor: this.vendor,
      finalNote: configured,
      patientSummary: configured,
      tasks: false,
      attachments: false,
      configured,
      unsupportedReasons: configured
        ? ['Task writeback and attachments remain deferred for the athenahealth scaffold.']
        : ['Athenahealth sandbox credentials are not configured.']
    };
  }

  override async writeFinalNote(input: WritebackPayload): Promise<WritebackResult> {
    return this.athenaWriteback(input);
  }

  override async writePatientSummary(input: WritebackPayload): Promise<WritebackResult> {
    return this.athenaWriteback(input);
  }

  private async athenaWriteback(input: WritebackPayload): Promise<WritebackResult> {
    const capabilities = await this.getWritebackCapabilities();
    if (!capabilities.configured) {
      return {
        target: input.target,
        vendor: this.vendor,
        queued: false,
        configured: false,
        retryable: false,
        status: 'not_configured',
        failureReason: 'Athenahealth credentials are not configured.'
      };
    }
    if (this.athenaConfig.simulateFailure) {
      return {
        target: input.target,
        vendor: this.vendor,
        queued: false,
        configured: true,
        retryable: true,
        status: 'failed',
        failureReason: 'Synthetic athenahealth sandbox writeback failure.'
      };
    }
    return {
      target: input.target,
      vendor: this.vendor,
      queued: true,
      configured: true,
      retryable: false,
      status: 'queued',
      externalJobId: `athena-sandbox-writeback-${input.idempotencyKey}`
    };
  }
}

export function createEhrAdapter(config: Partial<EhrAdapterConfig> = {}): EhrAdapter {
  if (config.vendor === 'athenahealth') {
    return new AthenahealthAdapter(config);
  }
  if (config.mode === 'mock' || config.vendor === 'generic_mock') {
    return new MockEhrAdapter(config);
  }
  return new DisabledEhrAdapter(config);
}

export function validateChartContextPackage(context: ChartContextPackage): string[] {
  const errors: string[] = [];
  if (!context.safePatientId.startsWith('safe-patient-')) errors.push('safePatientId must be a safe synthetic identifier');
  if (!context.externalEncounterId.trim()) errors.push('externalEncounterId is required');
  if (context.slices.length === 0) errors.push('at least one chart context slice is required');
  for (const slice of context.slices) {
    if (slice.evidenceIds.length === 0) {
      errors.push(`${slice.sliceType} slice must include evidence IDs`);
    }
  }
  return errors;
}

function createSyntheticPatient(vendor: EhrVendor, externalPatientRef: string): PatientCanonical {
  return {
    safePatientId: 'safe-patient-synthetic-001',
    externalPatientRef,
    sourceSystem: vendor,
    displayLabel: 'Synthetic patient record',
    demographicsAvailable: true
  };
}

function createSyntheticAppointment(vendor: EhrVendor, externalAppointmentId: string): AppointmentCanonical {
  return {
    externalAppointmentId,
    safePatientId: 'safe-patient-synthetic-001',
    externalPatientRef: `${vendor}-patient-ref-synthetic-001`,
    clinicianId: 'clinician-synthetic-001',
    startsAt: '2026-05-26T14:00:00.000Z',
    durationMinutes: 30,
    visitType: 'Chronic follow-up',
    sourceSystem: vendor
  };
}

function createSyntheticEncounter(vendor: EhrVendor, externalEncounterId: string): EncounterCanonical {
  return {
    externalEncounterId,
    externalAppointmentId: `${vendor}-appointment-synthetic-001`,
    safePatientId: 'safe-patient-synthetic-001',
    externalPatientRef: `${vendor}-patient-ref-synthetic-001`,
    visitType: 'Chronic follow-up',
    sourceSystem: vendor,
    status: 'open'
  };
}

function createChartContextPackage(input: {
  vendor: EhrVendor;
  mode: EhrAdapterMode;
  tenantId: string;
  siteId: string;
  safePatientId: string;
  externalPatientRef: string;
  externalEncounterId: string;
  requestedSlices: ChartContextSliceType[];
}): ChartContextPackage {
  const requestedSlices: ChartContextSliceType[] =
    input.requestedSlices.length > 0 ? input.requestedSlices : ['problems', 'medications', 'allergies'];
  const slices = requestedSlices.map((sliceType, index): ChartContextSlice => ({
    sliceType,
    sourceSystem: input.vendor,
    sourceRecordRef: `${input.vendor}-${sliceType}-synthetic-${index + 1}`,
    value: syntheticSliceValue(sliceType),
    effectiveAt: '2026-05-26T14:00:00.000Z',
    freshness: input.mode === 'disabled' ? 'unknown' : 'recent',
    sourceQuality: input.mode === 'disabled' ? 'low' : 'high',
    phiClassification: 'phi_reference',
    allowedPurposes: ['care', 'documentation', 'billing_review', 'ai_context_packaging'],
    evidenceIds: [`evidence-${sliceType}-synthetic-${index + 1}`]
  }));

  return {
    chartContextPackageId: `chart-context-${input.vendor}-${input.externalEncounterId}`,
    tenantId: input.tenantId,
    siteId: input.siteId,
    safePatientId: input.safePatientId,
    externalPatientRef: input.externalPatientRef,
    externalEncounterId: input.externalEncounterId,
    sourceSystem: input.vendor,
    requestedSlices,
    slices,
    staleSliceCount: input.mode === 'disabled' ? slices.length : 0,
    createdAt: new Date().toISOString(),
    warnings: input.mode === 'disabled' ? ['EHR disabled; chart context is synthetic placeholder data.'] : []
  };
}

function syntheticSliceValue(sliceType: ChartContextSliceType): Record<string, unknown> {
  switch (sliceType) {
    case 'medications':
      return { items: ['Synthetic medication reconciliation item'] };
    case 'allergies':
      return { items: ['Synthetic allergy review item'] };
    case 'problems':
      return { items: ['Synthetic chronic condition item'] };
    case 'labs':
      return { items: ['Synthetic A1c trend item'] };
    case 'documents':
      return { items: ['Synthetic prior document reference'] };
    case 'vitals':
      return { items: ['Synthetic blood pressure trend'] };
    case 'quality':
      return { items: ['Synthetic quality gap item'] };
    case 'payer':
      return { items: ['Synthetic coverage summary item'] };
    default:
      return { items: [`Synthetic ${sliceType} context item`] };
  }
}
