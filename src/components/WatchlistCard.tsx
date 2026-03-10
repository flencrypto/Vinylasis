import { WatchlistItem } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, BellSlash, Trash, Circle } from '@phosphor-icons/react'
import { formatCurrency } from '@/lib/helpers'

interface WatchlistCardProps {
  watchlist: WatchlistItem
  onDelete: () => void
  onToggleNotify: () => void
}

const WATCHLIST_TYPE_LABELS: Record<string, string> = {
  artist: 'Artist',
  release: 'Release',
  pressing: 'Pressing',
  freetext: 'Custom Search',
}

const WATCHLIST_TYPE_COLORS: Record<string, string> = {
  artist: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  release: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  pressing: 'bg-green-500/20 text-green-400 border-green-500/30',
  freetext: 'bg-accent/20 text-accent border-accent/30',
}

export function WatchlistCard({ watchlist, onDelete, onToggleNotify }: WatchlistCardProps) {
  const getWatchlistTitle = () => {
    switch (watchlist.type) {
      case 'artist':
        return watchlist.artistName || 'Unnamed Artist'
      case 'release':
        return `${watchlist.artistName || 'Unknown'} - ${watchlist.releaseTitle || 'Unknown Release'}`
      case 'pressing':
        return `${watchlist.artistName || 'Unknown'} - ${watchlist.releaseTitle || 'Unknown'} (Pressing)`
      case 'freetext':
        return watchlist.searchQuery || 'Custom Search'
      default:
        return 'Watch Item'
    }
  }

  const getWatchlistSubtitle = () => {
    if (watchlist.type === 'pressing' && watchlist.pressingDetails) {
      return watchlist.pressingDetails
    }
    return null
  }

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="outline" 
                className={`text-xs ${WATCHLIST_TYPE_COLORS[watchlist.type] || ''}`}
              >
                {WATCHLIST_TYPE_LABELS[watchlist.type] || watchlist.type}
              </Badge>
              {watchlist.notifyOnMatch && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Bell size={12} weight="fill" />
                  <span>Alerts On</span>
                </div>
              )}
            </div>
            <h3 className="text-base font-semibold mb-1">{getWatchlistTitle()}</h3>
            {getWatchlistSubtitle() && (
              <p className="text-sm text-muted-foreground">{getWatchlistSubtitle()}</p>
            )}
          </div>
        </div>

        {watchlist.targetPrice && (
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-medium text-muted-foreground mb-1">Target Price</div>
            <div className="font-mono font-semibold">
              {formatCurrency(watchlist.targetPrice, watchlist.targetCurrency)} or less
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Circle size={6} weight="fill" className="text-accent" />
              <span>Created {new Date(watchlist.createdAt).toLocaleDateString()}</span>
            </div>
            {watchlist.lastScannedAt && (
              <div className="flex items-center gap-1">
                <Circle size={6} weight="fill" className="text-muted-foreground/50" />
                <span>Last scan {new Date(watchlist.lastScannedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleNotify}
              className="gap-2"
            >
              {watchlist.notifyOnMatch ? (
                <>
                  <BellSlash size={16} />
                  Mute
                </>
              ) : (
                <>
                  <Bell size={16} />
                  Notify
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="gap-2"
            >
              <Trash size={16} />
              Remove
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
