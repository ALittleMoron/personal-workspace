import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client.service';
import {
  CacheStatus,
  CacheStatusDto,
  CacheWarmOperation,
  CacheWarmOperationDto,
  mapCacheStatusDto,
  mapCacheWarmOperationDto,
} from '../models/tools.model';

@Injectable({ providedIn: 'root' })
export class ToolsService {
  private readonly api = inject(ApiClient);

  getCacheStatus(): Observable<CacheStatus> {
    return this.api.get<CacheStatusDto>('/api/tools/cache').pipe(map(mapCacheStatusDto));
  }

  clearCache(): Observable<CacheStatus> {
    return this.api.post<CacheStatusDto>('/api/tools/cache/clear', {}).pipe(map(mapCacheStatusDto));
  }

  startCacheWarm(): Observable<CacheWarmOperation> {
    return this.api
      .post<CacheWarmOperationDto>('/api/tools/cache/warm', {})
      .pipe(map(mapCacheWarmOperationDto));
  }

  getCacheWarmOperation(operationId: string): Observable<CacheWarmOperation> {
    return this.api
      .get<CacheWarmOperationDto>(`/api/tools/cache/warm/${operationId}`)
      .pipe(map(mapCacheWarmOperationDto));
  }
}
