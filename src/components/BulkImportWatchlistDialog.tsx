import { useState } from 'react'
import { WatchlistItem } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { FileArrowUp, CheckCircle, WarningCircle, Upload } from '@phosphor-icons/react'
import { toast } from 'sonner'

export interface BulkImportWatchlistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (items: WatchlistItem[]) => void
}

interface ParsedRow {
  artistName?: string
  releaseTitle?: string
  pressingDetails?: string
  targetPrice?: number
  valid: boolean
  error?: string
  originalLine: string
}

const EXAMPLE_CSV = `The Beatles,Abbey Road,,50.00
Pink Floyd,Dark Side of the Moon,UK 1st Press,120.00
Led Zeppelin,Physical Graffiti,,80.00
David Bowie,Low,RCA PL 12030,65.00`

const EXAMPLE_TSV = `The Beatles\tAbbey Road\t\t50.00
Pink Floyd\tDark Side of the Moon\tUK 1st Press\t120.00
Led Zeppelin\tPhysical Graffiti\t\t80.00
David Bowie\tLow\tRCA PL 12030\t65.00`

export function BulkImportWatchlistDialog({ open, onOpenChange, onImport }: BulkImportWatchlistDialogProps) {
  const [inputText, setInputText] = useState('')
  const [format, setFormat] = useState<'csv' | 'tsv' | 'lines'>('csv')
  const [targetCurrency, setTargetCurrency] = useState('GBP')
  const [notifyOnMatch, setNotifyOnMatch] = useState(true)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [isParsing, setIsParsing] = useState(false)

  const handleParse = () => {
    setIsParsing(true)
    setParsedRows([])

    try {
      const lines = inputText.trim().split('\n').filter(line => line.trim().length > 0)
      const parsed: ParsedRow[] = []

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        let parts: string[] = []

        if (format === 'csv') {
          parts = trimmedLine.split(',').map(p => p.trim())
        } else if (format === 'tsv') {
          parts = trimmedLine.split('\t').map(p => p.trim())
        } else {
          parts = [trimmedLine]
        }

        const artistName = parts[0] || undefined
        const releaseTitle = parts[1] || undefined
        const pressingDetails = parts[2] || undefined
        const priceStr = parts[3] || undefined

        let targetPrice: number | undefined
        let error: string | undefined

        if (priceStr) {
          const parsed = parseFloat(priceStr)
          if (!isNaN(parsed) && parsed > 0) {
            targetPrice = parsed
          } else {
            error = `Invalid price: ${priceStr}`
          }
        }

        const valid = !!(artistName && !error)

        parsed.push({
          artistName,
          releaseTitle,
          pressingDetails,
          targetPrice,
          valid,
          error,
          originalLine: trimmedLine,
        })
      }

      setParsedRows(parsed)

      if (parsed.length === 0) {
        toast.error('No valid rows found')
      } else {
        const validCount = parsed.filter(r => r.valid).length
        toast.success(`Parsed ${validCount} of ${parsed.length} rows`)
      }
    } catch (err) {
      toast.error('Failed to parse input')
      console.error(err)
    } finally {
      setIsParsing(false)
    }
  }

  const handleImport = () => {
    const validRows = parsedRows.filter(r => r.valid)

    if (validRows.length === 0) {
      toast.error('No valid items to import')
      return
    }

    const newItems: WatchlistItem[] = validRows.map(row => ({
      id: `watchlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      collectionId: 'default',
      type: row.releaseTitle ? 'release' : 'artist',
      artistName: row.artistName,
      releaseTitle: row.releaseTitle,
      pressingDetails: row.pressingDetails,
      targetPrice: row.targetPrice,
      targetCurrency,
      notifyOnMatch,
      createdAt: new Date().toISOString(),
    }))

    onImport(newItems)
    toast.success(`Imported ${newItems.length} watchlist items`)
    handleReset()
    onOpenChange(false)
  }

  const handleReset = () => {
    setInputText('')
    setParsedRows([])
  }

  const handleLoadExample = () => {
    if (format === 'csv') {
      setInputText(EXAMPLE_CSV)
    } else if (format === 'tsv') {
      setInputText(EXAMPLE_TSV)
    } else {
      setInputText('The Beatles\nPink Floyd\nLed Zeppelin\nDavid Bowie')
    }
    setParsedRows([])
  }

  const validCount = parsedRows.filter(r => r.valid).length
  const invalidCount = parsedRows.length - validCount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArrowUp className="w-5 h-5 text-accent" weight="duotone" />
            Bulk Import Watchlist
          </DialogTitle>
          <DialogDescription>
            Import multiple watchlist items at once using CSV, TSV, or line-separated text
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Input Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as 'csv' | 'tsv' | 'lines')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Comma-separated)</SelectItem>
                  <SelectItem value="tsv">TSV (Tab-separated)</SelectItem>
                  <SelectItem value="lines">Artist per Line</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select value={targetCurrency} onValueChange={setTargetCurrency}>
                <SelectTrigger>
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

          {format !== 'lines' && (
            <Alert>
              <AlertDescription className="text-xs font-mono">
                Format: Artist, Release Title, Pressing Details, Target Price
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Input Data</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLoadExample}
              >
                Load Example
              </Button>
            </div>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                format === 'csv'
                  ? 'The Beatles,Abbey Road,,50.00\nPink Floyd,Dark Side of the Moon,UK 1st Press,120.00'
                  : format === 'tsv'
                  ? "The Beatles\tAbbey Road\t\t50.00\nPink Floyd\tDark Side of the Moon\tUK 1st Press\t120.00"
                  : 'The Beatles\nPink Floyd\nLed Zeppelin'
              }
              rows={8}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="notify-bulk" className="text-sm font-medium">
                Alert on Matches
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Notify when bargains are found for imported items
              </p>
            </div>
            <Switch
              id="notify-bulk"
              checked={notifyOnMatch}
              onCheckedChange={setNotifyOnMatch}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleParse}
              disabled={!inputText.trim() || isParsing}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Parse Input
            </Button>
          </div>

          {parsedRows.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Preview</h3>
                <div className="flex gap-2">
                  <Badge variant="default" className="bg-accent text-accent-foreground">
                    <CheckCircle className="w-3 h-3 mr-1" weight="fill" />
                    {validCount} Valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive">
                      <WarningCircle className="w-3 h-3 mr-1" weight="fill" />
                      {invalidCount} Invalid
                    </Badge>
                  )}
                </div>
              </div>

              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {parsedRows.map((row, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        row.valid
                          ? 'bg-accent/5 border-accent/20'
                          : 'bg-destructive/5 border-destructive/20'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {row.valid ? (
                          <CheckCircle className="w-4 h-4 text-accent mt-0.5" weight="fill" />
                        ) : (
                          <WarningCircle className="w-4 h-4 text-destructive mt-0.5" weight="fill" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            {row.artistName && (
                              <span className="font-semibold text-sm">{row.artistName}</span>
                            )}
                            {row.releaseTitle && (
                              <span className="text-sm text-muted-foreground">
                                - {row.releaseTitle}
                              </span>
                            )}
                            {row.pressingDetails && (
                              <Badge variant="outline" className="text-xs">
                                {row.pressingDetails}
                              </Badge>
                            )}
                          </div>
                          {row.targetPrice && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Target: {targetCurrency} {row.targetPrice.toFixed(2)}
                            </p>
                          )}
                          {row.error && (
                            <p className="text-xs text-destructive mt-1">{row.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleReset()
              onOpenChange(false)
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={validCount === 0}
            className="flex-1"
          >
            Import {validCount} {validCount === 1 ? 'Item' : 'Items'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
