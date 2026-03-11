import { useState, useMemo } from 'react'
import { TrendAlert, TrendAlertSeverity, TrendAlertType } from '@/lib/types'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendUp,
  TrendDown,
  CheckCircle,
  X,
  Eye,
  Trophy,
  WarningCircle,
  Lightning,
} from '@phosphor-icons/react'
import { formatCurrency, formatDate } from '@/lib/helpers'
import { cn } from '@/lib/utils'

interface TrendAlertsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  alerts: TrendAlert[]
  onMarkAsRead: (alertId: string) => void
  onDismiss: (alertId: string) => void
  onDismissAll: () => void
  onViewItem: (itemId: string) => void
}

export function TrendAlertsDialog({
  open,
  onOpenChange,
  alerts,
  onMarkAsRead,
  onDismiss,
  onDismissAll,
  onViewItem,
}: TrendAlertsDialogProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'gains' | 'losses'>('all')

  const filteredAlerts = useMemo(() => {
    let filtered = alerts.filter((a) => !a.dismissed)

    if (activeTab === 'gains') {
      filtered = filtered.filter(
        (a) => a.type === 'significant_gain' || a.type === 'rapid_increase' || a.type === 'milestone_reached'
      )
    } else if (activeTab === 'losses') {
      filtered = filtered.filter(
        (a) => a.type === 'significant_loss' || a.type === 'rapid_decrease'
      )
    }

    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [alerts, activeTab])

  const summary = useMemo(() => {
    const active = alerts.filter((a) => !a.dismissed)
    return {
      total: active.length,
      unread: active.filter((a) => !a.read).length,
      gains: active.filter(
        (a) => a.type === 'significant_gain' || a.type === 'rapid_increase' || a.type === 'milestone_reached'
      ).length,
      losses: active.filter(
        (a) => a.type === 'significant_loss' || a.type === 'rapid_decrease'
      ).length,
    }
  }, [alerts])

  const getAlertIcon = (type: TrendAlertType, severity: TrendAlertSeverity) => {
    const iconSize = 24
    const weight = severity === 'critical' ? 'fill' : 'bold'

    switch (type) {
      case 'significant_gain':
      case 'rapid_increase':
        return <TrendUp size={iconSize} weight={weight} className="text-green-500" />
      case 'significant_loss':
      case 'rapid_decrease':
        return <TrendDown size={iconSize} weight={weight} className="text-red-500" />
      case 'milestone_reached':
        return <Trophy size={iconSize} weight={weight} className="text-accent" />
      default:
        return <WarningCircle size={iconSize} weight={weight} className="text-muted-foreground" />
    }
  }

  const getSeverityBadge = (severity: TrendAlertSeverity) => {
    const variants = {
      critical: 'bg-red-500/20 text-red-500 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      low: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    }

    return (
      <Badge variant="outline" className={cn('capitalize', variants[severity])}>
        {severity === 'critical' && <Lightning size={12} weight="fill" className="mr-1" />}
        {severity}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <TrendUp className="text-accent" size={24} weight="bold" />
            </div>
            <div>
              Trend Alerts
              {summary.unread > 0 && (
                <span className="ml-3 text-sm font-normal text-muted-foreground">
                  {summary.unread} unread
                </span>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Monitor significant value changes in your collection
          </DialogDescription>
        </DialogHeader>

        <div className="px-6">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="p-3 bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1">Total Alerts</div>
              <div className="text-2xl font-bold">{summary.total}</div>
            </Card>
            <Card className="p-3 bg-green-500/10">
              <div className="text-xs text-muted-foreground mb-1">Value Gains</div>
              <div className="text-2xl font-bold text-green-500">{summary.gains}</div>
            </Card>
            <Card className="p-3 bg-red-500/10">
              <div className="text-xs text-muted-foreground mb-1">Value Losses</div>
              <div className="text-2xl font-bold text-red-500">{summary.losses}</div>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid grid-cols-3 w-fit">
                <TabsTrigger value="all">
                  All ({summary.total})
                </TabsTrigger>
                <TabsTrigger value="gains" className="text-green-500 data-[state=active]:text-green-500">
                  Gains ({summary.gains})
                </TabsTrigger>
                <TabsTrigger value="losses" className="text-red-500 data-[state=active]:text-red-500">
                  Losses ({summary.losses})
                </TabsTrigger>
              </TabsList>

              {summary.total > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismissAll}
                  className="gap-2"
                >
                  <CheckCircle size={16} />
                  Dismiss All
                </Button>
              )}
            </div>

            <TabsContent value={activeTab} className="m-0">
              <ScrollArea className="h-[400px] pr-4">
                {filteredAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {filteredAlerts.map((alert) => (
                      <Card
                        key={alert.id}
                        className={cn(
                          'p-4 transition-all hover:shadow-md',
                          !alert.read && 'border-accent/50 bg-accent/5'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getAlertIcon(alert.type, alert.severity)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <div className="font-semibold text-sm mb-1">
                                  {alert.artistName}
                                </div>
                                <div className="text-xs text-muted-foreground mb-2">
                                  {alert.itemTitle}
                                </div>
                              </div>
                              {getSeverityBadge(alert.severity)}
                            </div>

                            <p className="text-sm mb-3">{alert.message}</p>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                              <div className="flex items-center gap-2">
                                <span>Previous:</span>
                                <span className="font-mono font-semibold text-foreground">
                                  {formatCurrency(alert.previousValue, alert.currency)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span>Current:</span>
                                <span className={cn(
                                  'font-mono font-semibold',
                                  alert.changeAmount > 0 ? 'text-green-500' : 'text-red-500'
                                )}>
                                  {formatCurrency(alert.currentValue, alert.currency)}
                                </span>
                              </div>
                              <div className={cn(
                                'font-semibold',
                                alert.changeAmount > 0 ? 'text-green-500' : 'text-red-500'
                              )}>
                                {alert.changeAmount > 0 ? '+' : ''}
                                {alert.changePercent.toFixed(1)}%
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                {formatDate(alert.createdAt)}
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    onViewItem(alert.itemId)
                                    onMarkAsRead(alert.id)
                                  }}
                                  className="gap-1 h-7 text-xs"
                                >
                                  <Eye size={14} />
                                  View Item
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDismiss(alert.id)}
                                  className="gap-1 h-7 text-xs"
                                >
                                  <X size={14} />
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center border-dashed">
                    <CheckCircle size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" weight="thin" />
                    <h3 className="text-lg font-semibold mb-2">No Alerts</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === 'all'
                        ? "You're all caught up! No trend alerts at this time."
                        : activeTab === 'gains'
                        ? 'No value gains to report.'
                        : 'No value losses to report.'}
                    </p>
                  </Card>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-6 pt-4 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Alerts are generated automatically when items in your collection experience significant value
            changes (±15% or more). Critical alerts trigger at ±30% changes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
