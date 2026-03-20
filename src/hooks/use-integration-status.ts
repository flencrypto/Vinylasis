// src/hooks/use-integration-status.ts
import { useState, useEffect, useCallback } from 'react'
import {
  INTEGRATIONS,
  getIntegrationStatus,
  isIntegrationConfigured,
} from '@/integrations/requirements'

export interface IntegrationStatuses {
  [integrationId: string]: { configured: boolean; missing: string[] }
}

export interface UseIntegrationStatusReturn {
  statuses: IntegrationStatuses
  isConfigured: (id: string) => boolean
  refresh: () => void
  configuredCount: number
  totalCount: number
  requiredCount: number
  configuredRequiredCount: number
}

export function useIntegrationStatus(): UseIntegrationStatusReturn {
  const [statuses, setStatuses] = useState<IntegrationStatuses>(() => getIntegrationStatus())

  const refresh = useCallback(() => {
    setStatuses(getIntegrationStatus())
  }, [])

  useEffect(() => {
    // 'storage' fires on cross-tab/window localStorage changes.
    // 'vinyl-vault-ls-updated' is a custom event dispatched by same-tab
    // components (e.g. SettingsView) after writing localStorage keys, so
    // the status hook refreshes within the same browsing context too.
    const handleStorage = () => refresh()
    window.addEventListener('storage', handleStorage)
    window.addEventListener('vinyl-vault-ls-updated', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('vinyl-vault-ls-updated', handleStorage)
    }
  }, [refresh])

  const isConfigured = useCallback(
    (id: string): boolean => {
      return statuses[id]?.configured ?? isIntegrationConfigured(id)
    },
    [statuses]
  )

  const totalCount = INTEGRATIONS.length
  const configuredCount = Object.values(statuses).filter((s) => s.configured).length
  const requiredIntegrations = INTEGRATIONS.filter((i) => !i.optional)
  const requiredCount = requiredIntegrations.length
  const configuredRequiredCount = requiredIntegrations.filter(
    (i) => statuses[i.id]?.configured
  ).length

  return {
    statuses,
    isConfigured,
    refresh,
    configuredCount,
    totalCount,
    requiredCount,
    configuredRequiredCount,
  }
}
