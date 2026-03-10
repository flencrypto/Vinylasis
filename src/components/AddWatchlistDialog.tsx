import { useState } from 'react'
import { WatchlistItem, WatchlistType } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

interface AddWatchlistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (watchlistItem: WatchlistItem) => void
  collectionId: string
}

export function AddWatchlistDialog({ open, onOpenChange, onAdd, collectionId }: AddWatchlistDialogProps) {
  const [type, setType] = useState<WatchlistType>('artist')
  const [artistName, setArtistName] = useState('')
  const [releaseTitle, setReleaseTitle] = useState('')
  const [pressingDetails, setPressingDetails] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [targetCurrency, setTargetCurrency] = useState('GBP')
  const [notifyOnMatch, setNotifyOnMatch] = useState(true)

  const handleSubmit = () => {
    const newWatchlistItem: WatchlistItem = {
      id: `watchlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      collectionId,
      type,
      artistName: artistName || undefined,
      releaseTitle: releaseTitle || undefined,
      pressingDetails: pressingDetails || undefined,
      searchQuery: searchQuery || undefined,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      targetCurrency,
      notifyOnMatch,
      createdAt: new Date().toISOString(),
    }

    onAdd(newWatchlistItem)
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setType('artist')
    setArtistName('')
    setReleaseTitle('')
    setPressingDetails('')
    setSearchQuery('')
    setTargetPrice('')
    setTargetCurrency('GBP')
    setNotifyOnMatch(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to Watchlist</DialogTitle>
          <DialogDescription>
            Set up a watch for records you're hunting. We'll scan the market and notify you of potential matches.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="watch-type">Watch Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as WatchlistType)}>
              <SelectTrigger id="watch-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="artist">Artist - Track all releases by an artist</SelectItem>
                <SelectItem value="release">Specific Release - Track a specific album/single</SelectItem>
                <SelectItem value="pressing">Specific Pressing - Track a variant/pressing</SelectItem>
                <SelectItem value="freetext">Free Text Search - Custom search query</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'freetext' ? (
            <div className="space-y-2">
              <Label htmlFor="search-query">Search Query</Label>
              <Textarea
                id="search-query"
                placeholder="Enter custom search terms (e.g., 'Beatles white album UK first pressing')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Enter any keywords or phrases you want to search for across marketplace listings
              </p>
            </div>
          ) : (
            <>
              {(type === 'artist' || type === 'release' || type === 'pressing') && (
                <div className="space-y-2">
                  <Label htmlFor="artist-name">Artist Name</Label>
                  <Input
                    id="artist-name"
                    placeholder="e.g., David Bowie, The Beatles"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                  />
                </div>
              )}

              {(type === 'release' || type === 'pressing') && (
                <div className="space-y-2">
                  <Label htmlFor="release-title">Release Title</Label>
                  <Input
                    id="release-title"
                    placeholder="e.g., Low, Abbey Road"
                    value={releaseTitle}
                    onChange={(e) => setReleaseTitle(e.target.value)}
                  />
                </div>
              )}

              {type === 'pressing' && (
                <div className="space-y-2">
                  <Label htmlFor="pressing-details">Pressing Details</Label>
                  <Textarea
                    id="pressing-details"
                    placeholder="Country, year, catalog number, matrix, or other identifiers"
                    value={pressingDetails}
                    onChange={(e) => setPressingDetails(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Add specific pressing info like "UK 1977 RCA PL 12030" or "Original US pressing"
                  </p>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target-price">Target Price (Optional)</Label>
              <Input
                id="target-price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={targetCurrency} onValueChange={setTargetCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="notify-toggle" className="text-base cursor-pointer">
                Notify on Match
              </Label>
              <p className="text-sm text-muted-foreground">
                Get alerts when bargains matching this watch are found
              </p>
            </div>
            <Switch
              id="notify-toggle"
              checked={notifyOnMatch}
              onCheckedChange={setNotifyOnMatch}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add to Watchlist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
