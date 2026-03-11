import { WatchlistItem } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash, Bell, BellSlash, MusicNotes, Disc, MagnifyingGlass } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

export interface WatchlistCardProps {
  watchlistItem: WatchlistItem
  onDelete: () => void
  onToggleNotifications: () => void
}

export function WatchlistCard({ watchlistItem, onDelete, onToggleNotifications }: WatchlistCardProps) {
  const getWatchlistTypeLabel = () => {
    switch (watchlistItem.type) {
      case 'artist':
        return 'Artist'
      case 'release':
        return 'Release'
      case 'pressing':
        return 'Pressing'
      case 'freetext':
        return 'Search'
    }
  }

  const getWatchlistDisplay = () => {
    const parts: string[] = []
    
    if (watchlistItem.artistName) parts.push(watchlistItem.artistName)
    if (watchlistItem.releaseTitle) parts.push(watchlistItem.releaseTitle)
    if (watchlistItem.pressingDetails) parts.push(watchlistItem.pressingDetails)
    if (watchlistItem.searchQuery && parts.length === 0) parts.push(watchlistItem.searchQuery)
    
    return parts.join(' - ') || 'Untitled Watch'
  }

  const getWatchlistIcon = () => {
    switch (watchlistItem.type) {
      case 'artist':
        return <MusicNotes className="w-5 h-5" weight="fill" />
      case 'release':
      case 'pressing':
        return <Disc className="w-5 h-5" weight="fill" />
      case 'freetext':
        return <MagnifyingGlass className="w-5 h-5" weight="fill" />
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 text-accent">
                {getWatchlistIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {getWatchlistTypeLabel()}
                  </Badge>
                  {watchlistItem.notifyOnMatch && (
                    <Badge variant="default" className="text-xs bg-accent/20 text-accent border-accent/30">
                      <Bell size={10} weight="fill" className="mr-1" />
                      Alerts On
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold truncate">{getWatchlistDisplay()}</h3>
                {watchlistItem.targetPrice && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Target: {watchlistItem.targetCurrency} {watchlistItem.targetPrice.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleNotifications}
              >
                {watchlistItem.notifyOnMatch ? (
                  <Bell size={16} weight="fill" className="text-accent" />
                ) : (
                  <BellSlash size={16} />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash size={16} weight="fill" />
              </Button>
            </div>
          </div>
          
          {watchlistItem.lastScannedAt && (
            <div className="text-xs text-muted-foreground pt-2 border-t border-border">
              Last scanned {formatDistanceToNow(new Date(watchlistItem.lastScannedAt), { addSuffix: true })}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
