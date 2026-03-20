// src/components/IntegrationGateDialog.tsx
import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Warning, Key, ArrowRight, X } from '@phosphor-icons/react'
import {
  INTEGRATIONS,
  getMissingKeys,
  isIntegrationConfigured,
} from '@/integrations/requirements'

export interface IntegrationGateDialogProps {
  integrationId: string
  featureName: string
  onProceed?: () => void
  onGoToSettings?: () => void
  children: React.ReactNode
  asChild?: boolean
}

export default function IntegrationGateDialog({
  integrationId,
  featureName,
  onProceed,
  onGoToSettings,
  children,
}: IntegrationGateDialogProps) {
  const [open, setOpen] = useState(false)

  const integration = INTEGRATIONS.find((i) => i.id === integrationId)

  const handleChildClick = useCallback(
    (e: React.MouseEvent) => {
      // Check at click-time for freshest localStorage values
      if (isIntegrationConfigured(integrationId)) {
        // Pass through — let onProceed fire
        if (onProceed) {
          e.preventDefault()
          e.stopPropagation()
          onProceed()
        }
        // else let the original click propagate naturally
      } else {
        e.preventDefault()
        e.stopPropagation()
        setOpen(true)
      }
    },
    [integrationId, onProceed]
  )

  const handleGoToSettings = useCallback(() => {
    setOpen(false)
    if (onGoToSettings) {
      onGoToSettings()
    }
  }, [onGoToSettings])

  if (!integration) {
    // Unknown integration — just render children as-is
    return <>{children}</>
  }

  const missingKeys = getMissingKeys(integrationId)
  const instructionSteps = integration.howToGet.split('\n').filter((s) => s.trim() !== '')

  return (
    <>
      {/* Wrap children in a span that intercepts clicks */}
      <span
        onClick={handleChildClick}
        style={{ display: 'contents' }}
        role="presentation"
      >
        {children}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-lg">
              <Warning className="w-5 h-5 text-amber-400 flex-shrink-0" weight="fill" />
              Setup Required: {integration.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm mt-1">
              <span className="font-medium text-slate-300">{featureName}</span> requires{' '}
              {integration.name} to be configured.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* What this integration does */}
            <div className="bg-slate-800/60 rounded-lg p-3 text-sm text-slate-300">
              {integration.description}
            </div>

            {/* Missing keys */}
            {missingKeys.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Missing Keys
                </p>
                <div className="space-y-1.5">
                  {missingKeys.map((key) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-md px-3 py-2"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" weight="bold" />
                      <code className="text-xs font-mono text-amber-300 select-all">{key}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How to get it */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                How to Get It
              </p>
              <ol className="space-y-1.5">
                {instructionSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-slate-300">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-slate-700 text-[10px] font-bold text-slate-400 flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step.replace(/^\d+\.\s*/, '')}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Official link */}
            <a
              href={integration.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" weight="bold" />
              {integration.link}
            </a>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800">
            <Button
              onClick={handleGoToSettings}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
            >
              <ArrowRight className="w-4 h-4" weight="bold" />
              Go to Settings
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white gap-2"
            >
              <X className="w-4 h-4" weight="bold" />
              Dismiss
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
