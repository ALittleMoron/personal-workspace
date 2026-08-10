export type CacheDomain = 'i18n';
export type CacheWarmStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface CacheWarmSummaryDto {
  attempted: number;
  written: number;
  skipped: number;
}

export interface CacheWarmOperationDto {
  operationId: string;
  status: CacheWarmStatus;
  queuedAt: string;
  summary: CacheWarmSummaryDto | null;
}

export interface AdminCacheDomainStatusDto {
  domain: CacheDomain;
  keyCount: number;
  minimumRemainingTtlSeconds: number | null;
  nonExpiringKeyCount: number;
}

export interface AdminCacheStatusDto {
  enabled: boolean;
  configuredTtlSeconds: number;
  scheduledWarmIntervalSeconds: number;
  domains: AdminCacheDomainStatusDto[];
  lastManualWarmOperation: CacheWarmOperationDto | null;
}

export interface CacheWarmSummary {
  attempted: number;
  written: number;
  skipped: number;
}

export interface CacheWarmOperation {
  operationId: string;
  status: CacheWarmStatus;
  queuedAt: string;
  summary: CacheWarmSummary | null;
}

export interface AdminCacheDomainStatus {
  domain: CacheDomain;
  keyCount: number;
  minimumRemainingTtlSeconds: number | null;
  nonExpiringKeyCount: number;
}

export interface AdminCacheStatus {
  enabled: boolean;
  configuredTtlSeconds: number;
  scheduledWarmIntervalSeconds: number;
  domains: AdminCacheDomainStatus[];
  lastManualWarmOperation: CacheWarmOperation | null;
}

export function mapCacheWarmOperationDto(dto: CacheWarmOperationDto): CacheWarmOperation {
  return {
    operationId: dto.operationId,
    status: dto.status,
    queuedAt: dto.queuedAt,
    summary:
      dto.summary === null
        ? null
        : {
            attempted: dto.summary.attempted,
            written: dto.summary.written,
            skipped: dto.summary.skipped,
          },
  };
}

export function mapAdminCacheStatusDto(dto: AdminCacheStatusDto): AdminCacheStatus {
  return {
    enabled: dto.enabled,
    configuredTtlSeconds: dto.configuredTtlSeconds,
    scheduledWarmIntervalSeconds: dto.scheduledWarmIntervalSeconds,
    domains: dto.domains.map((domain) => ({
      domain: domain.domain,
      keyCount: domain.keyCount,
      minimumRemainingTtlSeconds: domain.minimumRemainingTtlSeconds,
      nonExpiringKeyCount: domain.nonExpiringKeyCount,
    })),
    lastManualWarmOperation:
      dto.lastManualWarmOperation === null
        ? null
        : mapCacheWarmOperationDto(dto.lastManualWarmOperation),
  };
}
