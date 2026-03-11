import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CloudArrowUp, Check, Warning, X, Image as ImageIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ItemImage } from '@/lib/types'
import { uploadImageToImgBB } from '@/lib/imgbb-service'
import { useKV } from '@github/spark/hooks'

interface ImgBBUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: ItemImage[]
  onUploadComplete: (uploadedImages: ItemImage[]) => void
}

interface UploadStatus {
  imageId: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  uploadedImage?: ItemImage
}

export default function ImgBBUploadDialog({
  open,
  onOpenChange,
  images,
  onUploadComplete
}: ImgBBUploadDialogProps) {
  const [apiKeys] = useKV<{ imgbbKey?: string }>('vinyl-vault-api-keys', {})
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const imagesToUpload = images.filter(img => !img.imgbbUrl && !img.imgbbDisplayUrl)

  const handleUploadAll = async () => {
    if (!apiKeys?.imgbbKey) {
      toast.error('imgBB API key not configured', {
        description: 'Please add your API key in Settings'
      })
      return
    }

    if (imagesToUpload.length === 0) {
      toast.info('All images are already hosted')
      return
    }

    setIsUploading(true)
    const statuses: UploadStatus[] = imagesToUpload.map(img => ({
      imageId: img.id,
      status: 'pending'
    }))
    setUploadStatuses(statuses)

    const uploadedImages: ItemImage[] = []
    let completed = 0

    for (let i = 0; i < imagesToUpload.length; i++) {
      const image = imagesToUpload[i]
      
      setUploadStatuses(prev => 
        prev.map(s => s.imageId === image.id ? { ...s, status: 'uploading' } : s)
      )

      try {
        const name = `${image.type}-${image.id}`
        const result = await uploadImageToImgBB(image.dataUrl, apiKeys.imgbbKey!, name)
        
        const uploadedImage: ItemImage = {
          ...image,
          imgbbUrl: result.url,
          imgbbDisplayUrl: result.displayUrl,
          imgbbThumbUrl: result.thumbUrl,
          imgbbDeleteUrl: result.deleteUrl
        }

        uploadedImages.push(uploadedImage)
        
        setUploadStatuses(prev => 
          prev.map(s => s.imageId === image.id 
            ? { ...s, status: 'success', uploadedImage } 
            : s
          )
        )

        completed++
        setUploadProgress((completed / imagesToUpload.length) * 100)

        toast.success(`Uploaded ${image.type}`, {
          description: `${completed} of ${imagesToUpload.length} complete`
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        
        setUploadStatuses(prev => 
          prev.map(s => s.imageId === image.id 
            ? { ...s, status: 'error', error: errorMessage } 
            : s
          )
        )

        toast.error(`Failed to upload ${image.type}`, {
          description: errorMessage
        })

        completed++
        setUploadProgress((completed / imagesToUpload.length) * 100)
      }
    }

    setIsUploading(false)

    if (uploadedImages.length > 0) {
      toast.success('Upload complete!', {
        description: `${uploadedImages.length} of ${imagesToUpload.length} images uploaded successfully`
      })
      onUploadComplete(uploadedImages)
    }
  }

  const successCount = uploadStatuses.filter(s => s.status === 'success').length
  const errorCount = uploadStatuses.filter(s => s.status === 'error').length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudArrowUp className="w-6 h-6" weight="fill" />
            Upload Images to imgBB
          </DialogTitle>
          <DialogDescription>
            Upload {imagesToUpload.length} image{imagesToUpload.length !== 1 ? 's' : ''} to imgBB for use in eBay listings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!apiKeys?.imgbbKey && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <Warning className="h-5 w-5 text-amber-500" weight="fill" />
              <AlertDescription className="ml-2">
                imgBB API key not configured. Please add your API key in Settings before uploading.
              </AlertDescription>
            </Alert>
          )}

          {imagesToUpload.length === 0 && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <Check className="h-5 w-5 text-green-500" weight="fill" />
              <AlertDescription className="ml-2">
                All images are already hosted on imgBB!
              </AlertDescription>
            </Alert>
          )}

          {imagesToUpload.length > 0 && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {isUploading ? 'Uploading...' : 'Ready to upload'}
                  </span>
                  <span className="font-semibold">
                    {successCount > 0 && `${successCount} uploaded`}
                    {errorCount > 0 && `, ${errorCount} failed`}
                  </span>
                </div>
                {isUploading && (
                  <Progress value={uploadProgress} className="h-2" />
                )}
              </div>

              {uploadStatuses.length > 0 && (
                <ScrollArea className="h-64 border rounded-lg p-4">
                  <div className="space-y-3">
                    {uploadStatuses.map((status) => {
                      const image = imagesToUpload.find(img => img.id === status.imageId)
                      if (!image) return null

                      return (
                        <div key={status.imageId} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                          <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                            <img 
                              src={image.dataUrl} 
                              alt={image.type}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm capitalize">
                              {image.type.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {status.status === 'pending' && 'Waiting...'}
                              {status.status === 'uploading' && 'Uploading...'}
                              {status.status === 'success' && 'Uploaded successfully'}
                              {status.status === 'error' && status.error}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {status.status === 'pending' && (
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            )}
                            {status.status === 'uploading' && (
                              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            )}
                            {status.status === 'success' && (
                              <Check className="w-5 h-5 text-green-500" weight="bold" />
                            )}
                            {status.status === 'error' && (
                              <X className="w-5 h-5 text-red-500" weight="bold" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}

              {uploadStatuses.length === 0 && (
                <div className="border rounded-lg p-6 text-center">
                  <CloudArrowUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground" weight="fill" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {imagesToUpload.length} image{imagesToUpload.length !== 1 ? 's' : ''} ready to upload
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {imagesToUpload.slice(0, 6).map((img) => (
                      <div key={img.id} className="w-16 h-16 bg-muted rounded overflow-hidden">
                        <img 
                          src={img.dataUrl} 
                          alt={img.type}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {imagesToUpload.length > 6 && (
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                        +{imagesToUpload.length - 6}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            {uploadStatuses.length > 0 && successCount > 0 ? 'Done' : 'Cancel'}
          </Button>
          {imagesToUpload.length > 0 && (
            <Button 
              onClick={handleUploadAll}
              disabled={isUploading || !apiKeys?.imgbbKey}
              className="gap-2"
            >
              <CloudArrowUp className="w-4 h-4" />
              {isUploading ? 'Uploading...' : `Upload ${imagesToUpload.length} Image${imagesToUpload.length !== 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
