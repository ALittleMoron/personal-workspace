import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client.service';
import {
  AdminCacheStatus,
  AdminCacheStatusDto,
  CacheWarmOperation,
  CacheWarmOperationDto,
  mapAdminCacheStatusDto,
  mapCacheWarmOperationDto,
} from '../models/admin-tools.model';

@Injectable({ providedIn: 'root' })
export class AdminToolsService {
  private readonly api = inject(ApiClient);

  getCacheStatus(): Observable<AdminCacheStatus> {
    return this.api
      .get<AdminCacheStatusDto>('/api/admin/tools/cache')
      .pipe(map(mapAdminCacheStatusDto));
  }

  clearCache(): Observable<AdminCacheStatus> {
    return this.api
      .post<AdminCacheStatusDto>('/api/admin/tools/cache/clear', {})
      .pipe(map(mapAdminCacheStatusDto));
  }

  startCacheWarm(): Observable<CacheWarmOperation> {
    return this.api
      .post<CacheWarmOperationDto>('/api/admin/tools/cache/warm', {})
      .pipe(map(mapCacheWarmOperationDto));
  }

  getCacheWarmOperation(operationId: string): Observable<CacheWarmOperation> {
    return this.api
      .get<CacheWarmOperationDto>(`/api/admin/tools/cache/warm/${operationId}`)
      .pipe(map(mapCacheWarmOperationDto));
  }
}
