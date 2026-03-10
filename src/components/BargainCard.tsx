import { BargainCard as BargainCardType, BargainSignal } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Sparkle, TrendUp, ArrowSquareOut, Eye, EyeSlash, Trash } from '@phosphor-icons/react'
import { formatCurrency } from '@/lib/helpers'
import { motion } from 'framer-motion'

interface BargainCardProps {
  bargain: BargainCardType
  onView: () => void
  onDelete: () => void
  onMarkViewed: () => void
}

const SIGNAL_LABELS: Record<string, string> = {
  title_mismatch: 'Title Mismatch',
  low_price: 'Low Price',
  wrong_category: 'Wrong Category',
  job_lot: 'Job Lot',
  promo_keywords: 'Promo/Rare Keywords',
  poor_metadata: 'Poor Metadata',
}

const SIGNAL_COLORS: Record<string, string> = {
  title_mismatch: 'text-blue-400',
  low_price: 'text-green-400',
  wrong_category: 'text-yellow-400',
  job_lot: 'text-purple-400',
  promo_keywords: 'text-pink-400',
  poor_metadata: 'text-orange-400',
}

export function BargainCard({ bargain, onView, onDelete, onMarkViewed }: BargainCardProps) {
  const { listing, bargainScore, estimatedValue, estimatedUpside, signals, matchedRelease } = bargain

  const scoreColor = 
    bargainScore >= 80 ? 'text-green-400' :
    bargainScore >= 60 ? 'text-accent' :
    bargainScore >= 40 ? 'text-yellow-400' :
    'text-muted-foreground'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className={`p-6 relative ${!bargain.viewed ? 'border-accent/50 shadow-lg shadow-accent/10' : ''}`}>
        {!bargain.viewed && (
          <div className="absolute top-3 right-3">
            <Badge variant="default" className="bg-accent text-accent-foreground">
              New
            </Badge>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold mb-1 truncate">{listing.title}</h3>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span className="font-mono">{formatCurrency(listing.price, listing.currency)}</span>
                <span>•</span>
                <span>{listing.source}</span>
                {listing.condition && (
                  <>
                    <span>•</span>
                    <span>{listing.condition}</span>
                  </>
                )}
                {listing.location && (
                  <>
                    <span>•</span>
                    <span>{listing.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkle size={18} weight="fill" className={scoreColor} />
                <span className="text-sm font-medium">Bargain Score</span>
              </div>
              <span className={`text-2xl font-bold font-mono ${scoreColor}`}>{bargainScore}</span>
            </div>
            <Progress value={bargainScore} className="h-2" />
          </div>

          {matchedRelease && (
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-medium text-muted-foreground mb-1">Likely Record</div>
              <div className="font-semibold">{matchedRelease.artistName}</div>
              <div className="text-sm">{matchedRelease.releaseTitle}</div>
              <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                {matchedRelease.year && <span>{matchedRelease.year}</span>}
                {matchedRelease.catalogNumber && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{matchedRelease.catalogNumber}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {(estimatedValue || estimatedUpside) && (
            <div className="grid grid-cols-2 gap-3">
              {estimatedValue && (
                <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Est. Value</div>
                  <div className="font-mono font-semibold text-lg">
                    {formatCurrency(estimatedValue, listing.currency)}
                  </div>
                </div>
              )}
              {estimatedUpside && estimatedUpside > 0 && (
                <div className="bg-accent/10 rounded-lg p-3 border border-accent/30">
                  <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendUp size={14} weight="bold" />
                    Upside
                  </div>
                  <div className="font-mono font-semibold text-lg text-accent">
                    +{formatCurrency(estimatedUpside, listing.currency)}
                  </div>
                </div>
              )}
            </div>
          )}

          {signals.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Why This is Interesting</div>
              <div className="space-y-2">
                {signals.map((signal: BargainSignal, index: number) => (
                  <div key={index} className="bg-muted/30 rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${SIGNAL_COLORS[signal.type] || 'text-foreground'}`}>
                        {SIGNAL_LABELS[signal.type] || signal.type}
                      </span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {signal.score}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{signal.description}</p>
                    {signal.evidence && (
                      <p className="text-xs text-muted-foreground/70 mt-1 italic">"{signal.evidence}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="default"
              className="flex-1 gap-2"
              onClick={onView}
              asChild
            >
              <a href={listing.url} target="_blank" rel="noopener noreferrer">
                <ArrowSquareOut size={18} />
                View Listing
              </a>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onMarkViewed}
              title={bargain.viewed ? "Mark as unviewed" : "Mark as viewed"}
            >
              {bargain.viewed ? <EyeSlash size={18} /> : <Eye size={18} />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onDelete}
              title="Remove from bargains"
            >
              <Trash size={18} />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
