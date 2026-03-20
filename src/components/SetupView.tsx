// src/components/SetupView.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  Warning,
  ArrowRight,
  CaretDown,
  CaretUp,
  Link as LinkIcon,
  Gear,
} from '@phosphor-icons/react'
import { INTEGRATIONS, IntegrationDefinition } from '@/integrations/requirements'
import { useIntegrationStatus } from '@/hooks/use-integration-status'

export interface SetupViewProps {
  onGoToSettings: () => void
}

interface IntegrationCardProps {
  integration: IntegrationDefinition
  configured: boolean
  missing: string[]
  onGoToSettings: () => void
}

function IntegrationCard({ integration, configured, missing, onGoToSettings }: IntegrationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const instructionSteps = integration.howToGet.split('\n').filter((s) => s.trim() !== '')

  return (
    <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base text-white">{integration.name}</CardTitle>
              {integration.optional && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-slate-600 text-slate-400 py-0 h-5"
                >
                  Optional
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{integration.description}</p>
          </div>
          <div className="flex-shrink-0">
            {configured ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border gap-1 whitespace-nowrap">
                <CheckCircle className="w-3 h-3" weight="fill" />
                Configured
              </Badge>
            ) : (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 border gap-1 whitespace-nowrap">
                <Warning className="w-3 h-3" weight="fill" />
                Missing keys
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* Required keys with status */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Required Keys
          </p>
          <div className="space-y-1">
            {integration.localStorageKeys.map((key) => {
              const isMissing = missing.includes(key)
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5 bg-slate-900/60"
                >
                  {isMissing ? (
                    <Warning className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" weight="fill" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" weight="fill" />
                  )}
                  <code className="text-xs font-mono text-slate-300 select-all">{key}</code>
                  {isMissing && (
                    <span className="ml-auto text-[10px] text-amber-400">not set</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Features list */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Enables
          </p>
          <div className="flex flex-wrap gap-1">
            {integration.features.map((feature) => (
              <span
                key={feature}
                className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700/70 text-slate-300"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Collapsible "How to get it" */}
        <div className="border-t border-slate-700/50 pt-3">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors w-full text-left"
          >
            {expanded ? (
              <CaretUp className="w-3.5 h-3.5" weight="bold" />
            ) : (
              <CaretDown className="w-3.5 h-3.5" weight="bold" />
            )}
            How to get {integration.name}
          </button>

          {expanded && (
            <div className="mt-2 space-y-3">
              <ol className="space-y-1.5 pl-0">
                {instructionSteps.map((step, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-slate-300">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 text-[10px] font-bold text-slate-400 flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</span>
                  </li>
                ))}
              </ol>
              <a
                href={integration.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
              >
                <LinkIcon className="w-3.5 h-3.5" weight="bold" />
                {integration.link}
              </a>
            </div>
          )}
        </div>

        {/* Configure button */}
        {!configured && (
          <Button
            size="sm"
            onClick={onGoToSettings}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 border-0 gap-2 mt-1"
          >
            <Gear className="w-4 h-4" weight="fill" />
            Configure in Settings
            <ArrowRight className="w-3.5 h-3.5 ml-auto" weight="bold" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function SetupView({ onGoToSettings }: SetupViewProps) {
  const { statuses, configuredCount, totalCount, configuredRequiredCount, requiredCount, refresh } =
    useIntegrationStatus()

  const required = INTEGRATIONS.filter((i) => !i.optional)
  const optional = INTEGRATIONS.filter((i) => i.optional)

  const allRequiredConfigured = configuredRequiredCount === requiredCount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white">Integration Setup</h2>
          <p className="text-slate-400 mt-1 text-sm">
            Configure external services to unlock all VinylVault features. All keys are stored
            locally in your browser.
          </p>
        </div>

        {/* Summary banner */}
        <div
          className={`rounded-xl border p-4 flex items-center gap-3 ${
            allRequiredConfigured
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}
        >
          {allRequiredConfigured ? (
            <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" weight="fill" />
          ) : (
            <Warning className="w-6 h-6 text-amber-400 flex-shrink-0" weight="fill" />
          )}
          <div className="flex-1 min-w-0">
            <p
              className={`font-semibold text-sm ${
                allRequiredConfigured ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {configuredCount} of {totalCount} integrations configured
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {allRequiredConfigured
                ? 'All required integrations are set up. Optional ones unlock additional features.'
                : `${requiredCount - configuredRequiredCount} required integration(s) still need setup.`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            className="text-slate-400 hover:text-white text-xs"
          >
            Refresh
          </Button>
        </div>

        {/* Required Integrations */}
        <section>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Required Integrations
          </h3>
          <div className="space-y-3">
            {required.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                configured={statuses[integration.id]?.configured ?? false}
                missing={statuses[integration.id]?.missing ?? integration.localStorageKeys}
                onGoToSettings={onGoToSettings}
              />
            ))}
          </div>
        </section>

        {/* Optional Integrations */}
        <section>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Optional Integrations
          </h3>
          <div className="space-y-3">
            {optional.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                configured={statuses[integration.id]?.configured ?? false}
                missing={statuses[integration.id]?.missing ?? integration.localStorageKeys}
                onGoToSettings={onGoToSettings}
              />
            ))}
          </div>
        </section>

        {/* Bottom spacer for nav */}
        <div className="h-4" />
      </div>
    </div>
  )
}
