import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ItemImage, PressingCandidate } from '@/lib/types'
import { ImageUpload } from '@/components/ImageUpload'
import { analyzeVinylImage, identifyPressing } from '@/lib/image-analysis-ai'
import { Sparkle, CheckCircle, Warning, ArrowRight } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface PressingIdentificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (candidate: PressingCandidate, images: ItemImage[]) => void
}

export function PressingIdentificationDialog({
  open,
  onOpenChange,
  onSelect
}: PressingIdentificationDialogProps) {
  const [images, setImages] = useState<ItemImage[]>([])
  const [artistHint, setArtistHint] = useState('')
  const [titleHint, setTitleHint] = useState('')
  const [yearHint, setYearHint] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [candidates, setCandidates] = useState<PressingCandidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<PressingCandidate | null>(null)

  const handleAnalyze = async () => {
    if (images.length === 0) {
      toast.error('Please upload at least one image')
      return
    }

    setIsAnalyzing(true)
    setProgress(0)
    setCandidates([])

    try {
      setProgress(20)
      toast.info('Analyzing images...')

      const analysisPromises = images.map(img => 
        analyzeVinylImage(img.dataUrl, img.type)
      )

      const analysisResults = await Promise.all(analysisPromises)
      
      setProgress(60)
      toast.info('Identifying pressing...')

      const userHints = {
        artist: artistHint || undefined,
        title: titleHint || undefined,
        year: yearHint ? parseInt(yearHint) : undefined,
      }

      const identifiedCandidates = await identifyPressing(analysisResults, userHints)
      
      setProgress(100)
      setCandidates(identifiedCandidates)

      if (identifiedCandidates.length > 0) {
        toast.success(`Found ${identifiedCandidates.length} potential match${identifiedCandidates.length > 1 ? 'es' : ''}`)
        setSelectedCandidate(identifiedCandidates[0])
      } else {
        toast.warning('No confident matches found. Try adding more images or hints.')
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      toast.error('Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSelectCandidate = () => {
    if (!selectedCandidate) return
    onSelect(selectedCandidate, images)
    handleReset()
    onOpenChange(false)
  }

  const handleReset = () => {
    setImages([])
    setArtistHint('')
    setTitleHint('')
    setYearHint('')
    setCandidates([])
    setSelectedCandidate(null)
    setProgress(0)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500'
    if (confidence >= 0.6) return 'text-yellow-500'
    return 'text-orange-500'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence'
    if (confidence >= 0.6) return 'Medium Confidence'
    return 'Low Confidence'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkle size={24} weight="fill" className="text-accent" />
            AI Pressing Identification
          </DialogTitle>
          <DialogDescription>
            Upload images of your vinyl and let AI identify the pressing details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">Upload Images</h3>
              <ImageUpload images={images} onImagesChange={setImages} maxImages={6} />
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-3">Optional Hints (improves accuracy)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="artistHint">Artist</Label>
                  <Input
                    id="artistHint"
                    value={artistHint}
                    onChange={(e) => setArtistHint(e.target.value)}
                    placeholder="David Bowie"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="titleHint">Album Title</Label>
                  <Input
                    id="titleHint"
                    value={titleHint}
                    onChange={(e) => setTitleHint(e.target.value)}
                    placeholder="Low"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearHint">Year</Label>
                  <Input
                    id="yearHint"
                    type="number"
                    value={yearHint}
                    onChange={(e) => setYearHint(e.target.value)}
                    placeholder="1977"
                  />
                </div>
              </div>
            </div>
          </div>

          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Analyzing...</span>
                <span className="font-mono">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {candidates.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Identified Pressings</h3>
              <div className="space-y-3">
                {candidates.map((candidate) => (
                  <Card
                    key={candidate.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedCandidate?.id === candidate.id
                        ? 'ring-2 ring-accent bg-accent/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {selectedCandidate?.id === candidate.id && (
                            <CheckCircle size={20} weight="fill" className="text-accent" />
                          )}
                          <h4 className="font-semibold">
                            {candidate.artistName} - {candidate.releaseTitle}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="font-mono">{candidate.catalogNumber || 'N/A'}</span>
                          <span>•</span>
                          <span>{candidate.pressingName}</span>
                          <span>•</span>
                          <span>{candidate.year}</span>
                          <span>•</span>
                          <span>{candidate.country}</span>
                        </div>
                        {candidate.matrixNumbers && candidate.matrixNumbers.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Matrix:</span>
                            <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              {candidate.matrixNumbers.join(' / ')}
                            </code>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">{candidate.reasoning}</p>
                        {candidate.matchedIdentifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {candidate.matchedIdentifiers.map((id, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {id}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right space-y-1">
                        <div className={`text-2xl font-bold font-mono ${getConfidenceColor(candidate.confidence)}`}>
                          {Math.round(candidate.confidence * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getConfidenceLabel(candidate.confidence)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleReset()
                onOpenChange(false)
              }}
            >
              Cancel
            </Button>
            <div className="flex gap-3">
              {candidates.length === 0 ? (
                <Button
                  onClick={handleAnalyze}
                  disabled={images.length === 0 || isAnalyzing}
                  className="gap-2"
                >
                  <Sparkle size={18} />
                  Analyze Images
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleReset}>
                    Start Over
                  </Button>
                  <Button
                    onClick={handleSelectCandidate}
                    disabled={!selectedCandidate}
                    className="gap-2"
                  >
                    Use Selected Pressing
                    <ArrowRight size={18} />
                  </Button>
                </>
              )}
            </div>
          </div>

          {candidates.length > 0 && (
            <div className="bg-muted/50 border border-border rounded-lg p-3 flex items-start gap-3">
              <Warning size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                AI identification is a helpful starting point but may not be 100% accurate. Always verify pressing details against known sources and your physical record.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
