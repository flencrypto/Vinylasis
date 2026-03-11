import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, Warning, CloudArrowUp, CheckCircle } from '@phosphor-icons/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { EbayListingPackage } from '@/lib/listing-ai'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ItemImage } from '@/lib/types'
import ImgBBUploadDialog from './ImgBBUploadDialog'

interface EbayListingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listingPackage: EbayListingPackage
  images?: ItemImage[]
  onImagesUploaded?: (uploadedImages: ItemImage[]) => void
}

export default function EbayListingDialog({
  open,
  onOpenChange,
  listingPackage,
  images = [],
  onImagesUploaded
}: EbayListingDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    toast.success(`${fieldName} copied to clipboard`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleUploadComplete = (uploadedImages: ItemImage[]) => {
    setShowUploadDialog(false)
    onImagesUploaded?.(uploadedImages)
    toast.success('Images uploaded!', {
      description: 'HTML description has been updated with hosted images'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            eBay Listing Package
          </DialogTitle>
          <DialogDescription>
            Ready-to-use eBay listing with hosted images and HTML description
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <div className="space-y-6">
            {listingPackage.requiresImgBBUpload && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <Warning className="h-5 w-5 text-amber-500" weight="fill" />
                <AlertDescription className="ml-2">
                  <div className="flex items-center justify-between">
                    <span>
                      {listingPackage.missingImageCount} image{listingPackage.missingImageCount !== 1 ? 's' : ''} need to be uploaded to imgBB before publishing to eBay
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setShowUploadDialog(true)}
                      className="gap-2 ml-4"
                    >
                      <CloudArrowUp className="w-4 h-4" />
                      Upload Images
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {!listingPackage.requiresImgBBUpload && listingPackage.imageUrls.length > 0 && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" weight="fill" />
                <AlertDescription className="ml-2">
                  All {listingPackage.imageUrls.length} images are hosted on imgBB and ready for eBay
                </AlertDescription>
              </Alert>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-muted-foreground">LISTING TITLE</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(listingPackage.title, 'Title')}
                  className="gap-2"
                >
                  {copiedField === 'Title' ? (
                    <>
                      <Check className="w-4 h-4" weight="bold" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-lg font-semibold leading-tight">{listingPackage.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{listingPackage.title.length} characters</p>
            </div>

            {listingPackage.subtitle && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">SUBTITLE</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(listingPackage.subtitle!, 'Subtitle')}
                      className="gap-2"
                    >
                      {copiedField === 'Subtitle' ? (
                        <>
                          <Check className="w-4 h-4" weight="bold" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-base">{listingPackage.subtitle}</p>
                </div>
              </>
            )}

            <Separator />

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">IMAGES ({listingPackage.imageUrls.length})</h3>
              {listingPackage.imageUrls.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {listingPackage.imageUrls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                        <img
                          src={url}
                          alt={`Image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Badge className="absolute top-2 right-2 bg-green-600 text-white text-xs">
                        <CheckCircle size={12} weight="fill" className="mr-1" />
                        Hosted
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No images hosted on imgBB yet</p>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">DESCRIPTION</h3>
              <Tabs defaultValue="html" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="plain">Plain Text</TabsTrigger>
                </TabsList>
                <TabsContent value="html" className="mt-4">
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(listingPackage.htmlDescription, 'HTML Description')}
                      className="absolute top-2 right-2 gap-2 z-10"
                    >
                      {copiedField === 'HTML Description' ? (
                        <>
                          <Check className="w-4 h-4" weight="bold" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <ScrollArea className="h-64 bg-muted/30 rounded-lg p-4">
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                        {listingPackage.htmlDescription}
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>
                <TabsContent value="preview" className="mt-4">
                  <ScrollArea className="h-96 border rounded-lg bg-white">
                    <div dangerouslySetInnerHTML={{ __html: listingPackage.htmlDescription }} />
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="plain" className="mt-4">
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(listingPackage.plainDescription, 'Plain Description')}
                      className="absolute top-2 right-2 gap-2 z-10"
                    >
                      {copiedField === 'Plain Description' ? (
                        <>
                          <Check className="w-4 h-4" weight="bold" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <ScrollArea className="h-64 bg-muted/30 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap">{listingPackage.plainDescription}</p>
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">PRICE</h3>
                <div className="text-3xl font-bold text-accent">
                  ${listingPackage.price.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{listingPackage.currency}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">CONDITION</h3>
                <div className="flex gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Media</div>
                    <Badge variant="outline" className="text-base px-3 py-1 mt-1">
                      {listingPackage.condition.media}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Sleeve</div>
                    <Badge variant="outline" className="text-base px-3 py-1 mt-1">
                      {listingPackage.condition.sleeve}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {listingPackage.seoKeywords.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">SEO KEYWORDS</h3>
                  <div className="flex flex-wrap gap-2">
                    {listingPackage.seoKeywords.map((keyword, idx) => (
                      <Badge key={idx} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {listingPackage.imageUrls.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">IMAGE URLS (for API)</h3>
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(listingPackage.imageUrls.join('\n'), 'Image URLs')}
                      className="absolute top-2 right-2 gap-2 z-10"
                    >
                      {copiedField === 'Image URLs' ? (
                        <>
                          <Check className="w-4 h-4" weight="bold" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <ScrollArea className="h-32 bg-muted/30 rounded-lg p-4">
                      <pre className="text-xs font-mono">
                        {listingPackage.imageUrls.map((url, idx) => `${idx + 1}. ${url}`).join('\n')}
                      </pre>
                    </ScrollArea>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button 
            onClick={() => {
              handleCopy(listingPackage.htmlDescription, 'eBay Listing Package')
              toast.success('Ready to paste into eBay!', {
                description: 'HTML description copied to clipboard'
              })
            }}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy HTML for eBay
          </Button>
        </div>
      </DialogContent>

      {showUploadDialog && images.length > 0 && (
        <ImgBBUploadDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          images={images}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </Dialog>
  )
}
