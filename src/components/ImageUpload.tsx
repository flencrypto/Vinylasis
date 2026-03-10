import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { ImageType, ItemImage } from '@/lib/types'
import { Camera, Trash, Image as ImageIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  images: ItemImage[]
  onImagesChange: (images: ItemImage[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onImagesChange, maxImages = 10 }: ImageUploadProps) {
  const [selectedType, setSelectedType] = useState<ImageType>('front_cover')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (images.length >= maxImages) {
      return
    }

    const newImages: ItemImage[] = []

    for (let i = 0; i < files.length && images.length + newImages.length < maxImages; i++) {
      const file = files[i]
      
      if (!file.type.startsWith('image/')) continue

      const dataUrl = await fileToDataUrl(file)
      
      newImages.push({
        id: `img-${Date.now()}-${i}`,
        type: selectedType,
        dataUrl,
        mimeType: file.type,
        uploadedAt: new Date().toISOString()
      })
    }

    onImagesChange([...images, ...newImages])
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (imageId: string) => {
    onImagesChange(images.filter(img => img.id !== imageId))
  }

  const handleTypeChange = (imageId: string, newType: ImageType) => {
    onImagesChange(
      images.map(img => img.id === imageId ? { ...img, type: newType } : img)
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label>Image Type</Label>
          <Select value={selectedType} onValueChange={(value: ImageType) => setSelectedType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="front_cover">Front Cover</SelectItem>
              <SelectItem value="back_cover">Back Cover</SelectItem>
              <SelectItem value="label">Label</SelectItem>
              <SelectItem value="runout">Runout / Matrix</SelectItem>
              <SelectItem value="insert">Insert</SelectItem>
              <SelectItem value="spine">Spine</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= maxImages}
          className="gap-2"
        >
          <Camera size={18} />
          Upload Images
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="relative group overflow-hidden">
              <div className="aspect-square bg-muted">
                <img
                  src={image.dataUrl}
                  alt={image.type}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 space-y-2">
                <Select
                  value={image.type}
                  onValueChange={(value: ImageType) => handleTypeChange(image.id, value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="front_cover">Front Cover</SelectItem>
                    <SelectItem value="back_cover">Back Cover</SelectItem>
                    <SelectItem value="label">Label</SelectItem>
                    <SelectItem value="runout">Runout / Matrix</SelectItem>
                    <SelectItem value="insert">Insert</SelectItem>
                    <SelectItem value="spine">Spine</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveImage(image.id)}
                  className="w-full gap-2"
                >
                  <Trash size={14} />
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <Card className="border-dashed">
          <div className="p-12 text-center">
            <ImageIcon size={48} className="mx-auto mb-4 text-muted-foreground" weight="thin" />
            <p className="text-sm text-muted-foreground">
              No images uploaded yet. Add photos of your vinyl to enable AI identification.
            </p>
          </div>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Upload up to {maxImages} images. Include front/back covers, labels, and runout areas for best identification results.
      </p>
    </div>
  )
}
