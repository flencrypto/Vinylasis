interface CachedDiscogsQuery {
  query: string
  queryHash: string
  data: any
  timestamp: number
  expiresAt: number
}

interface CacheStats {
  hits: number
  misses: number
  totalQueries: number
  cachedQueries: number
  cacheSize: number
}

const CACHE_PREFIX = 'discogs_cache_'
const CACHE_STATS_KEY = 'discogs_cache_stats'
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000
const MAX_CACHE_ENTRIES = 1000

export class DiscogsCacheService {
  private static instance: DiscogsCacheService
  
  private constructor() {}
  
  static getInstance(): DiscogsCacheService {
    if (!DiscogsCacheService.instance) {
      DiscogsCacheService.instance = new DiscogsCacheService()
    }
    return DiscogsCacheService.instance
  }

  private generateQueryHash(queryParams: Record<string, any>): string {
    const sortedKeys = Object.keys(queryParams).sort()
    const normalizedQuery = sortedKeys
      .map(key => `${key}:${queryParams[key]}`)
      .join('|')
    
    let hash = 0
    for (let i = 0; i < normalizedQuery.length; i++) {
      const char = normalizedQuery.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return `${CACHE_PREFIX}${Math.abs(hash).toString(36)}`
  }

  async get<T>(queryParams: Record<string, any>): Promise<T | null> {
    const queryHash = this.generateQueryHash(queryParams)
    
    try {
      const cached = await spark.kv.get<CachedDiscogsQuery>(queryHash)
      
      if (!cached) {
        await this.updateStats({ misses: 1 })
        return null
      }

      if (Date.now() > cached.expiresAt) {
        await spark.kv.delete(queryHash)
        await this.updateStats({ misses: 1 })
        return null
      }

      await this.updateStats({ hits: 1 })
      return cached.data as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set<T>(
    queryParams: Record<string, any>,
    data: T,
    ttlMs: number = DEFAULT_TTL_MS
  ): Promise<void> {
    const queryHash = this.generateQueryHash(queryParams)
    
    try {
      await this.enforceMaxCacheSize()

      const cached: CachedDiscogsQuery = {
        query: JSON.stringify(queryParams),
        queryHash,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttlMs,
      }

      await spark.kv.set(queryHash, cached)
      await this.updateStats({ cacheSize: 1 })
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async invalidate(queryParams: Record<string, any>): Promise<void> {
    const queryHash = this.generateQueryHash(queryParams)
    
    try {
      await spark.kv.delete(queryHash)
      await this.updateStats({ cacheSize: -1 })
    } catch (error) {
      console.error('Cache invalidate error:', error)
    }
  }

  async clear(): Promise<void> {
    try {
      const allKeys = await spark.kv.keys()
      const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX))
      
      for (const key of cacheKeys) {
        await spark.kv.delete(key)
      }

      await spark.kv.set(CACHE_STATS_KEY, {
        hits: 0,
        misses: 0,
        totalQueries: 0,
        cachedQueries: 0,
        cacheSize: 0,
      } as CacheStats)
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const stats = await spark.kv.get<CacheStats>(CACHE_STATS_KEY)
      
      if (!stats) {
        const defaultStats: CacheStats = {
          hits: 0,
          misses: 0,
          totalQueries: 0,
          cachedQueries: 0,
          cacheSize: 0,
        }
        await spark.kv.set(CACHE_STATS_KEY, defaultStats)
        return defaultStats
      }

      return stats
    } catch (error) {
      console.error('Get stats error:', error)
      return {
        hits: 0,
        misses: 0,
        totalQueries: 0,
        cachedQueries: 0,
        cacheSize: 0,
      }
    }
  }

  private async updateStats(changes: Partial<CacheStats>): Promise<void> {
    try {
      const stats = await this.getStats()
      
      const updatedStats: CacheStats = {
        hits: stats.hits + (changes.hits || 0),
        misses: stats.misses + (changes.misses || 0),
        totalQueries: stats.totalQueries + (changes.hits || 0) + (changes.misses || 0),
        cachedQueries: stats.cachedQueries,
        cacheSize: Math.max(0, stats.cacheSize + (changes.cacheSize || 0)),
      }

      await spark.kv.set(CACHE_STATS_KEY, updatedStats)
    } catch (error) {
      console.error('Update stats error:', error)
    }
  }

  private async enforceMaxCacheSize(): Promise<void> {
    try {
      const allKeys = await spark.kv.keys()
      const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX))
      
      if (cacheKeys.length >= MAX_CACHE_ENTRIES) {
        const entries: Array<{ key: string; timestamp: number }> = []
        
        for (const key of cacheKeys) {
          const cached = await spark.kv.get<CachedDiscogsQuery>(key)
          if (cached) {
            entries.push({ key, timestamp: cached.timestamp })
          }
        }

        entries.sort((a, b) => a.timestamp - b.timestamp)

        const toDelete = entries.slice(0, Math.floor(MAX_CACHE_ENTRIES * 0.2))
        for (const entry of toDelete) {
          await spark.kv.delete(entry.key)
        }
      }
    } catch (error) {
      console.error('Enforce max cache size error:', error)
    }
  }

  async cleanExpired(): Promise<number> {
    let cleaned = 0
    
    try {
      const allKeys = await spark.kv.keys()
      const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX))
      
      for (const key of cacheKeys) {
        const cached = await spark.kv.get<CachedDiscogsQuery>(key)
        
        if (cached && Date.now() > cached.expiresAt) {
          await spark.kv.delete(key)
          cleaned++
        }
      }

      if (cleaned > 0) {
        await this.updateStats({ cacheSize: -cleaned })
      }
    } catch (error) {
      console.error('Clean expired error:', error)
    }

    return cleaned
  }

  async getCacheHitRate(): Promise<number> {
    const stats = await this.getStats()
    if (stats.totalQueries === 0) {
      return 0
    }
    return (stats.hits / stats.totalQueries) * 100
  }
}

export const discogsCache = DiscogsCacheService.getInstance()
