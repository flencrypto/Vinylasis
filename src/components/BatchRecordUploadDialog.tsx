import { Dialog, DialogContent } from '@/components/ui/dialog'

interface BatchRecordUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function BatchRecordUploadDialog({ open, onOpenChange }: BatchRecordUploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <p>Dialog placeholder</p>
      </DialogContent>
    </Dialog>
  )
}
