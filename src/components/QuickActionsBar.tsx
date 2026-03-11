import BarcodeScannerWidget, { BarcodeScanResult } from './BarcodeScannerWidget'
import { Card } from '@/components/ui/card'
import { Barcode, Camera, MagicWand } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface QuickActionsBarProps {
  onBarcodeScanned?: (result: BarcodeScanResult) => void
}

export default function QuickActionsBar({ onBarcodeScanned }: QuickActionsBarProps) {
  const handleBarcodeScan = (result: BarcodeScanResult) => {
    toast.success(`Found: ${result.artist} - ${result.title}`)
    if (onBarcodeScanned) {
      onBarcodeScanned(result)
    }
  }

  return (
    <div className="px-4 py-3 bg-gradient-to-br from-slate-900/50 to-slate-950/50 border-b border-slate-800">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-2">
        <BarcodeScannerWidget variant="card" onScanComplete={handleBarcodeScan} />
        
        <Card className="p-4 bg-card/50 border-border/50 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-muted/30 rounded-xl flex items-center justify-center">
              <Camera className="w-6 h-6 text-muted-foreground" weight="bold" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">Snap ID</h3>
              <p className="text-xs text-muted-foreground truncate">Photo lookup</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/50 border-border/50 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-muted/30 rounded-xl flex items-center justify-center">
              <MagicWand className="w-6 h-6 text-muted-foreground" weight="bold" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">Batch Add</h3>
              <p className="text-xs text-muted-foreground truncate">Multiple scans</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
