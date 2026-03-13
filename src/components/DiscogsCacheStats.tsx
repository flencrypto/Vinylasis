import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Trash, ArrowClockwise, CheckCircle } from '@phosphor-icons/react'
import { discogsCache } from '@/lib/discogs-cache-service'
import { toast } from 'sonner'

export function DiscogsCacheStats() {
  const [stats, setStats] = useState({
    hits: 0,
    misses: 0,
    totalQueries: 0,
    cachedQueries: 0,
    cacheSize: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const cacheStats = await discogsCache.getStats()
      setStats(cacheStats)
    } catch (error) {
      console.error('Failed to load cache stats:', error)
      toast.error('Failed to load cache statistics')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearCache = async () => {
    setIsClearing(true)
    try {
      await discogsCache.clear()
      toast.success('Cache cleared successfully')
      await loadStats()
    } catch (error) {
      console.error('Failed to clear cache:', error)
      toast.error('Failed to clear cache')
    } finally {
      setIsClearing(false)
    }
  }

  const handleCleanExpired = async () => {
    setIsLoading(true)
    try {
      const cleanedCount = await discogsCache.cleanExpired()
      toast.success(`Removed ${cleanedCount} expired cache ${cleanedCount === 1 ? 'entry' : 'entries'}`)
      await loadStats()
    } catch (error) {
      console.error('Failed to clean expired cache:', error)
      toast.error('Failed to clean expired cache')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const hitRate = stats.totalQueries > 0 
    ? Math.round((stats.hits / stats.totalQueries) * 100) 
    : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-slate-400">Total Queries</p>
          <p className="text-2xl font-bold text-white">{stats.totalQueries}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-slate-400">Cache Size</p>
          <p className="text-2xl font-bold text-white">{stats.cacheSize}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-slate-400">Cache Hits</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-green-400">{stats.hits}</p>
            {stats.hits > 0 && (
              <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" weight="fill" />
                Saved API calls
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-slate-400">Cache Misses</p>
          <p className="text-2xl font-bold text-slate-300">{stats.misses}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-300">Cache Hit Rate</p>
          <p className="text-sm font-semibold text-accent">{hitRate}%</p>
        </div>
        <Progress value={hitRate} className="h-2" />
        <p className="text-xs text-slate-500">
          {hitRate >= 75 && 'Excellent cache performance'}
          {hitRate >= 50 && hitRate < 75 && 'Good cache performance'}
          {hitRate >= 25 && hitRate < 50 && 'Moderate cache performance'}
          {hitRate < 25 && stats.totalQueries > 0 && 'Cache is warming up'}
          {stats.totalQueries === 0 && 'No queries cached yet'}
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleClearCache}
          disabled={isClearing || stats.cacheSize === 0}
          variant="outline"
          size="sm"
          className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <Trash className="w-4 h-4 mr-2" />
          Clear Cache
        </Button>

        <Button
          onClick={handleCleanExpired}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <ArrowClockwise className="w-4 h-4 mr-2" />
          Clean Expired
        </Button>
      </div>

      <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-slate-300">About Cache</p>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• Marketplace searches cached for 24 hours</li>
          <li>• Database searches cached for 7 days</li>
          <li>• Maximum 1000 entries (auto-cleanup enabled)</li>
          <li>• All data stored locally on your device</li>
        </ul>
      </div>
    </div>
  )
}
