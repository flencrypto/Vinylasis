import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Upload,
  X,
  CheckCircle,
  Warning,
  CircleNotch,
  Image as ImageIcon,
  Files,
  ArrowRight,
} from '@phosphor-icons/react'
import { ItemImage, CollectionItem, Format, MediaGrade, SleeveGrade } from '@/lib/types'
import { analyzeVinylImage } from '@/lib/image-analysis-ai'
import { identifyPressing } from '@/lib/pressing-identification-ai'
import { analyzeConditionFromImages, suggestGradingNotes } from '@/lib/condition-grading-ai'
import { toast } from 'sonner'
import { useKV } from '@github/spark/hooks'

interface BatchRecordUploadDialogProps {
  onOpenChange:

 

  result?: CollectionIt
}
export default functi
  onOpenChange,
  const [items, se
  const [isProcessing, se

 

      return new Promise<ItemImage>((resolve) => 
       
            id:
            type: 'front_cover' as
            uploadedAt: new Date().toISOString(),
        }
      })



        currentGroup.push(img)
          if (currentGroup.length 

        }

        id: `batch-${Date.now()}-${idx}
        status: 'pending',
      }))
      setBatches((prev) => [...prev, ...newBatche
            dataUrl: reader.result as string,
            type: 'unknown',
            fileName: file.name,
            addedAt: new Date().toISOString(),
          })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(imagePromises).then((images) => {
      const groupedImages: ItemImage[][] = []
      let currentGroup: ItemImage[] = []

      images.forEach((img, idx) => {
        currentGroup.push(img)
        if ((idx + 1) % 4 === 0 || idx === images.length - 1) {
          if (currentGroup.length > 0) {
            groupedImages.push([...currentGroup])
            currentGroup = []
          }
        }
      })

      const newBatches: RecordBatch[] = groupedImages.map((imgGroup, idx) => ({
        id: `batch-${Date.now()}-${idx}`,
        images: imgGroup,
        status: 'pending',
        progress: 0,
      }))

      setBatches((prev) => [...prev, ...newBatches])
      toast.success(`Added ${newBatches.length} record batch(es)`)
    })

    e.target.value = ''
  }

  const removeBatch = (batchId: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== batchId))
  }

  const processBatch = async (batch: RecordBatch): Promise<CollectionItem> => {
    setBatches((prev) =>
      prev.map((b) =>
        b.id === batch.id ? { ...b, status: 'processing', progress: 10 } : b
      )
    )

    try {
      const imageAnalysisResults = await Promise.all(
        batch.images.map((img) => analyzeVinylImage(img.dataUrl, img.type))
      )

      setBatches((prev) =>
        prev.map((b) => (b.id === batch.id ? { ...b, progress: 30 } : b))
      )

      const pressingCandidates = await identifyPressing({
        imageAnalysis: imageAnalysisResults,
        discogsSearchEnabled: false,
      })

      const bestCandidate = pressingCandidates[0]

        },
        createdAt: new Date().toISOString(),
      }

          b.id === batch.i
            : b
      )

      const errorMessage =
      setBatches((prev) =>

            : b
      )
    }

    const pendingBatches = batches.filt
      toast.error('No batches to process')
    }
    setIsProcessing(true)

      setCurrentBatchIndex(i)
        const item = await processBatch(pendingBatches[i])
      } catch (error) {
      }

      setItems((currentItems) 
    }
    setIsProcessing(fals
  }
  const clearCompleted = () => {
      prev.filter((b) => b.status !== 'completed' && b.status !== 'error')
  }
  const completedCount = batches.filt
  const pendingCount = batches.filter((b) => 

    <Dialog open={open} onOpe
        <DialogHeader>
            <Files className="w-5 h-5" />
       

          </DialogDescript

          <div className="f
              variant="outline"
              o
         
       

                mult
                class
              />

              {batches.len
                  <Badg
                  </Badge>
                    <Badge variant="default">{completedCount} completed</
               
         
       
          </div>
     
   

                  <ImageIcon className="w
                <div className="space-y-2">
                  <p className="text-s
                    contain 3-5 images of 
            
     

                {batches.
                    <div className="flex items-s

                            <div
                             
           
                                alt=""
                              />
                       
                      </div>
       
     

                            <p classN
                            </p>

     

                          
                              
   

                                
                        
                              <Badge variant="destructive" className="gap-
     
   

                                size="sm"
                                onClick={() => removeBatch(batch.id)}
                                <X className="w-4 h-4" />
                            )}

          
                            <Progress value={batch.p
                              {batch.progress}% complete
                      

                          <div className=
                              {b
                        
                             
                            </p>
                        )}
                        {batch
                       

                ))}
            </ScrollArea>


            <div className="text-s
                <span>{pendingCount} batch(es) ready to process</span>
            </div>
            <
                <Button variant="outline" size="s
                </Button

                onClick={processAllBa
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </Button>

            <div className="flex items-center gap-2">
              {batches.length > 0 && (
                <>
                  <Badge variant="secondary">
                    {batches.length} batch(es)
                  </Badge>
                  {completedCount > 0 && (
                    <Badge variant="default">{completedCount} completed</Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge variant="destructive">{errorCount} failed</Badge>
                  )}
                </>
              )}
            </div>
          </div>

          <Separator />

          {batches.length === 0 ? (
            <Card className="flex-1 flex items-center justify-center p-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">No batches yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Upload vinyl images to create batches. Each batch should
                    contain 3-5 images of a single record (cover, labels, runouts).
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4">
                {batches.map((batch, idx) => (
                  <Card key={batch.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="grid grid-cols-2 gap-1 w-24 h-24">
                          {batch.images.slice(0, 4).map((img) => (
                            <div
                              key={img.id}
                              className="w-full h-full bg-muted rounded overflow-hidden"
                            >
                              <img
                                src={img.dataUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm">
                              Batch #{idx + 1}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {batch.images.length} image(s)
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {batch.status === 'pending' && (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                            {batch.status === 'processing' && (
                              <Badge variant="default" className="gap-1">
                                <CircleNotch className="w-3 h-3 animate-spin" />
                                Processing
                              </Badge>
                            )}
                            {batch.status === 'completed' && (
                              <Badge variant="default" className="gap-1 bg-green-600">
                                <CheckCircle className="w-3 h-3" weight="fill" />
                                Completed
                              </Badge>
                            )}
                            {batch.status === 'error' && (
                              <Badge variant="destructive" className="gap-1">
                                <Warning className="w-3 h-3" weight="fill" />
                                Error
                              </Badge>
                            )}

                            {batch.status === 'pending' && !isProcessing && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeBatch(batch.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {batch.status === 'processing' && (
                          <div className="space-y-1">
                            <Progress value={batch.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {batch.progress}% complete
                            </p>
                          </div>
                        )}

                        {batch.status === 'completed' && batch.result && (
                          <div className="text-xs space-y-1">
                            <p className="font-medium">
                              {batch.result.artistName} - {batch.result.releaseTitle}
                            </p>
                            <p className="text-muted-foreground">
                              {batch.result.format} • {batch.result.year} •{' '}
                              {batch.result.condition.mediaGrade}/
                              {batch.result.condition.sleeveGrade}
                            </p>
                          </div>
                        )}

                        {batch.status === 'error' && (
                          <p className="text-xs text-destructive">{batch.error}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          <Separator />

          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {pendingCount > 0 && (
                <span>{pendingCount} batch(es) ready to process</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {(completedCount > 0 || errorCount > 0) && !isProcessing && (
                <Button variant="outline" size="sm" onClick={clearCompleted}>
                  Clear Completed
                </Button>
              )}

              <Button
                onClick={processAllBatches}
                disabled={isProcessing || pendingCount === 0}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <CircleNotch className="w-4 h-4 animate-spin" />
                    Processing {currentBatchIndex !== null ? `${currentBatchIndex + 1}/${pendingCount}` : '...'}
                  </>
                ) : (
                  <>
                    Process All
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
                disabled={isProcessing || pendingCount === 0}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <CircleNotch className="w-4 h-4 animate-spin" />
                    Processing {currentBatchIndex !== null ? `${currentBatchIndex + 1}/${pendingCount}` : '...'}
                  </>
                ) : (
                  <>
                    Process All
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
