export type ObjectStorageProvider = 'azure_blob' | 'in_memory';
export type StorageRetentionClass = 'standard' | 'audit' | 'transcript' | 'audio_ephemeral';
export type AzureCredentialSource = 'managed_identity' | 'workload_identity' | 'connection_string_placeholder';

export interface ObjectStorageConfig {
  provider: ObjectStorageProvider;
  accountName?: string;
  containerName: string;
  credentialSource?: AzureCredentialSource;
  productionDeliveryEnabled: boolean;
}

export interface PutObjectInput {
  tenantId: string;
  siteId: string;
  storageKey: string;
  body: string;
  contentType: string;
  retentionClass: StorageRetentionClass;
  traceId: string;
}

export interface StoredObjectMetadata {
  storageProvider: ObjectStorageProvider;
  storageKey: string;
  contentType: string;
  contentLengthBytes: number;
  checksum: string;
  eTag: string;
  retentionClass: StorageRetentionClass;
  createdAt: string;
  traceId: string;
}

export interface SignedDownloadInput {
  tenantId: string;
  siteId: string;
  storageKey: string;
  requestedByUserId: string;
  permission: 'final_note:export' | 'patient_summary:export' | 'audit:export';
  expiresAt: string;
  traceId: string;
}

export interface SignedDownloadMetadata {
  storageProvider: ObjectStorageProvider;
  storageKey: string;
  signedDownloadToken: string;
  signedDownloadExpiresAt: string;
  publicUrl: null;
  permission: SignedDownloadInput['permission'];
  traceId: string;
}

export interface DeliverSignedDownloadInput {
  token: string;
  tenantId: string;
  siteId: string;
  requestedByUserId: string;
  permission: SignedDownloadInput['permission'];
  nowIso: string;
  traceId: string;
}

export interface SignedDownloadDeliveryEvidence {
  status: 'delivered_synthetic';
  storageProvider: ObjectStorageProvider;
  storageKey: string;
  contentType: string;
  contentLengthBytes: number;
  checksum: string;
  eTag: string;
  signedDownloadExpiresAt: string;
  permission: SignedDownloadInput['permission'];
  serverMediated: true;
  publicUrl: null;
  traceId: string;
}

export interface DeleteObjectInput {
  tenantId: string;
  siteId: string;
  storageKey: string;
  approvalId: string;
  traceId: string;
}

export interface ObjectDeletionEvidence {
  storageProvider: ObjectStorageProvider;
  storageKey: string;
  deleted: boolean;
  deletionResult: 'deleted' | 'not_found' | 'blocked_missing_approval' | 'blocked_recovery_window';
  checksum?: string;
  eTag?: string;
  approvalId?: string;
  recoveryWindowStatus: 'recoverable' | 'not_configured' | 'expired';
  traceId: string;
  deletedAt?: string;
}

export interface ObjectStorageAdapter {
  putObject(input: PutObjectInput): StoredObjectMetadata;
  headObject(storageKey: string): StoredObjectMetadata | undefined;
  createSignedDownload(input: SignedDownloadInput): SignedDownloadMetadata;
  validateSignedDownload(token: string, tenantId: string, nowIso: string): SignedDownloadMetadata;
  deliverSignedDownload(input: DeliverSignedDownloadInput): SignedDownloadDeliveryEvidence;
  deleteObject(input: DeleteObjectInput): ObjectDeletionEvidence;
}

interface StoredObject extends StoredObjectMetadata {
  body: string;
  tenantId: string;
  siteId: string;
}

interface StoredToken extends SignedDownloadMetadata {
  tenantId: string;
  siteId: string;
  requestedByUserId: string;
}

export class InMemoryObjectStorageAdapter implements ObjectStorageAdapter {
  private readonly objects = new Map<string, StoredObject>();
  private readonly tokens = new Map<string, StoredToken>();

  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  putObject(input: PutObjectInput): StoredObjectMetadata {
    assertTenantStorageKey(input.tenantId, input.storageKey);
    const metadata: StoredObject = {
      tenantId: input.tenantId,
      siteId: input.siteId,
      storageProvider: 'in_memory',
      storageKey: input.storageKey,
      body: input.body,
      contentType: input.contentType,
      contentLengthBytes: Buffer.byteLength(input.body, 'utf8'),
      checksum: syntheticChecksum(input.body),
      eTag: `etag-${syntheticChecksum(input.body)}`,
      retentionClass: input.retentionClass,
      createdAt: this.now(),
      traceId: input.traceId
    };
    this.objects.set(input.storageKey, metadata);
    return toStoredObjectMetadata(metadata);
  }

  headObject(storageKey: string): StoredObjectMetadata | undefined {
    const stored = this.objects.get(storageKey);
    return stored ? toStoredObjectMetadata(stored) : undefined;
  }

  createSignedDownload(input: SignedDownloadInput): SignedDownloadMetadata {
    const object = this.objects.get(input.storageKey);
    if (!object || object.tenantId !== input.tenantId || object.siteId !== input.siteId) {
      throw new Error('storage download denied for missing or wrong-tenant object');
    }

    const token = `dl-${syntheticChecksum([
      input.tenantId,
      input.siteId,
      input.storageKey,
      input.requestedByUserId,
      input.permission,
      input.expiresAt,
      input.traceId
    ].join('|'))}`;
    const metadata: StoredToken = {
      tenantId: input.tenantId,
      siteId: input.siteId,
      requestedByUserId: input.requestedByUserId,
      storageProvider: 'in_memory',
      storageKey: input.storageKey,
      signedDownloadToken: token,
      signedDownloadExpiresAt: input.expiresAt,
      publicUrl: null,
      permission: input.permission,
      traceId: input.traceId
    };
    this.tokens.set(token, metadata);
    return toSignedDownloadMetadata(metadata);
  }

  validateSignedDownload(token: string, tenantId: string, nowIso: string): SignedDownloadMetadata {
    const metadata = this.tokens.get(token);
    if (!metadata || metadata.tenantId !== tenantId) {
      throw new Error('storage download denied for wrong tenant');
    }
    if (new Date(metadata.signedDownloadExpiresAt) <= new Date(nowIso)) {
      throw new Error('storage download token expired');
    }
    return toSignedDownloadMetadata(metadata);
  }

  deliverSignedDownload(input: DeliverSignedDownloadInput): SignedDownloadDeliveryEvidence {
    const token = this.tokens.get(input.token);
    if (!token || token.tenantId !== input.tenantId) {
      throw new Error('storage download denied for wrong tenant');
    }
    if (token.siteId !== input.siteId) {
      throw new Error('storage download denied for wrong site');
    }
    if (token.permission !== input.permission) {
      throw new Error('storage download denied for wrong permission');
    }
    if (token.requestedByUserId !== input.requestedByUserId) {
      throw new Error('storage download denied for wrong requester');
    }
    if (new Date(token.signedDownloadExpiresAt) <= new Date(input.nowIso)) {
      throw new Error('storage download token expired');
    }
    const object = this.objects.get(token.storageKey);
    if (!object || object.tenantId !== input.tenantId || object.siteId !== input.siteId) {
      throw new Error('storage object missing for download');
    }
    return {
      status: 'delivered_synthetic',
      storageProvider: object.storageProvider,
      storageKey: object.storageKey,
      contentType: object.contentType,
      contentLengthBytes: object.contentLengthBytes,
      checksum: object.checksum,
      eTag: object.eTag,
      signedDownloadExpiresAt: token.signedDownloadExpiresAt,
      permission: token.permission,
      serverMediated: true,
      publicUrl: null,
      traceId: input.traceId
    };
  }

  deleteObject(input: DeleteObjectInput): ObjectDeletionEvidence {
    const object = this.objects.get(input.storageKey);
    if (!input.approvalId) {
      return {
        storageProvider: 'in_memory',
        storageKey: input.storageKey,
        deleted: false,
        deletionResult: 'blocked_missing_approval',
        recoveryWindowStatus: 'recoverable',
        traceId: input.traceId
      };
    }
    if (!object) {
      return {
        storageProvider: 'in_memory',
        storageKey: input.storageKey,
        deleted: false,
        deletionResult: 'not_found',
        approvalId: input.approvalId,
        recoveryWindowStatus: 'not_configured',
        traceId: input.traceId
      };
    }
    if (object.tenantId !== input.tenantId || object.siteId !== input.siteId) {
      throw new Error('storage deletion denied for wrong tenant or site');
    }
    this.objects.delete(input.storageKey);
    return {
      storageProvider: 'in_memory',
      storageKey: input.storageKey,
      deleted: true,
      deletionResult: 'deleted',
      checksum: object.checksum,
      eTag: object.eTag,
      approvalId: input.approvalId,
      recoveryWindowStatus: 'recoverable',
      traceId: input.traceId,
      deletedAt: this.now()
    };
  }
}

export class AzureBlobObjectStorageAdapter {
  readonly config: Required<Pick<ObjectStorageConfig, 'provider' | 'accountName' | 'containerName' | 'credentialSource'>>;

  constructor(config: ObjectStorageConfig) {
    const validation = validateAzureBlobStorageConfig(config);
    if (!validation.ready) {
      throw new Error(`Azure Blob storage config invalid: ${validation.missing.join(', ')}`);
    }
    const accountName = config.accountName;
    const credentialSource = config.credentialSource;
    if (!accountName || !credentialSource) {
      throw new Error('Azure Blob storage config invalid after validation');
    }
    this.config = {
      provider: 'azure_blob',
      accountName,
      containerName: config.containerName,
      credentialSource
    };
  }

  buildBlobUrl(storageKey: string): string {
    return `https://${this.config.accountName}.blob.core.windows.net/${this.config.containerName}/${encodeURI(storageKey)}`;
  }

  buildPutRequest(input: PutObjectInput) {
    assertTenantStorageKey(input.tenantId, input.storageKey);
    return {
      method: 'PUT' as const,
      url: this.buildBlobUrl(input.storageKey),
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'x-ms-meta-tenant-id': input.tenantId,
        'x-ms-meta-site-id': input.siteId,
        'x-ms-meta-retention-class': input.retentionClass,
        'x-ms-meta-trace-id': input.traceId,
        'content-type': input.contentType
      },
      contentLengthBytes: Buffer.byteLength(input.body, 'utf8'),
      checksum: syntheticChecksum(input.body)
    };
  }
}

export function validateAzureBlobStorageConfig(config: Partial<ObjectStorageConfig>) {
  const missing: string[] = [];
  if (config.provider !== 'azure_blob') missing.push('provider=azure_blob');
  if (!config.accountName) missing.push('AZURE_STORAGE_ACCOUNT_NAME');
  if (!config.containerName) missing.push('AZURE_STORAGE_CONTAINER_NAME');
  if (!config.credentialSource) missing.push('AZURE_STORAGE_CREDENTIAL_SOURCE');
  return {
    ready: missing.length === 0,
    missing,
    productionDeliveryEnabled: config.productionDeliveryEnabled === true
  };
}

export function buildStorageKey(parts: {
  tenantId: string;
  siteId: string;
  recordClass: 'exports' | 'audit-exports' | 'raw-audio' | 'transcripts';
  recordId: string;
  fileName: string;
}): string {
  return [
    'tenants',
    parts.tenantId,
    'sites',
    parts.siteId,
    parts.recordClass,
    parts.recordId,
    parts.fileName.replaceAll(' ', '-')
  ].join('/');
}

export function syntheticChecksum(content: string): string {
  let hash = 0;
  for (let index = 0; index < content.length; index += 1) {
    hash = (hash * 31 + content.charCodeAt(index)) >>> 0;
  }
  return `synthetic-${hash.toString(16).padStart(8, '0')}`;
}

export interface BackupRestorePostureInput {
  azureSoftDeleteEnabled: boolean;
  azureVersioningEnabled: boolean;
  databaseBackupConfigured: boolean;
  restoreDrillEvidenceRecorded: boolean;
  evidenceRetentionDays: number;
  productionRestoreExecutionApproved: boolean;
  traceId: string;
}

export interface BackupRestoreReadinessEvidence {
  status: 'ready_synthetic' | 'blocked_review';
  objectStorageSoftDeleteRequired: true;
  objectStorageVersioningRequired: true;
  databaseBackupRequired: true;
  restoreExecutionEnabled: false;
  evidenceRetentionDays: number;
  missing: string[];
  traceId: string;
}

export function evaluateBackupRestoreReadiness(input: BackupRestorePostureInput): BackupRestoreReadinessEvidence {
  const missing: string[] = [];
  if (!input.azureSoftDeleteEnabled) missing.push('AZURE_BLOB_SOFT_DELETE_ENABLED');
  if (!input.azureVersioningEnabled) missing.push('AZURE_BLOB_VERSIONING_ENABLED');
  if (!input.databaseBackupConfigured) missing.push('DATABASE_BACKUP_CONFIGURED');
  if (!input.restoreDrillEvidenceRecorded) missing.push('RESTORE_DRILL_EVIDENCE_RECORDED');
  if (input.evidenceRetentionDays < 365) missing.push('EVIDENCE_RETENTION_DAYS>=365');

  return {
    status: missing.length === 0 ? 'ready_synthetic' : 'blocked_review',
    objectStorageSoftDeleteRequired: true,
    objectStorageVersioningRequired: true,
    databaseBackupRequired: true,
    restoreExecutionEnabled: false,
    evidenceRetentionDays: input.evidenceRetentionDays,
    missing,
    traceId: input.traceId
  };
}

function assertTenantStorageKey(tenantId: string, storageKey: string): void {
  if (!storageKey.startsWith(`tenants/${tenantId}/`)) {
    throw new Error('storage key must be tenant-scoped');
  }
}

function toStoredObjectMetadata(object: StoredObject): StoredObjectMetadata {
  const { body: _body, tenantId: _tenantId, siteId: _siteId, ...metadata } = object;
  return metadata;
}

function toSignedDownloadMetadata(token: StoredToken): SignedDownloadMetadata {
  const { tenantId: _tenantId, siteId: _siteId, requestedByUserId: _requestedByUserId, ...metadata } = token;
  return metadata;
}
