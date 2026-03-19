import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Key, List } from '@phosphor-icons/react'

interface DiscogsSetupGuideProps {
  isConfigured?: boolean
  onGetStarted: () => void
}

export default function DiscogsSetupGuide({ isConfigured, onGetStarted }: DiscogsSetupGuideProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Discogs API Setup
        </CardTitle>
        <CardDescription>
          Connect to Discogs to unlock powerful collection management features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
                1
              </span>
              <div className="flex-1">
                <p className="text-sm text-foreground">Visit Discogs Settings</p>
                <p className="text-sm text-muted-foreground">Go to Discogs.com and navigate to your account settings</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
                2
              </span>
              <div className="flex-1">
                <p className="text-sm text-foreground">Generate Personal Access Token</p>
                <p className="text-sm text-muted-foreground">Create a new token with read access to your collection</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
                3
              </span>
              <div className="flex-1">
                <p className="text-sm text-foreground">Enter Token Below</p>
                <p className="text-sm text-muted-foreground">Paste your token in the settings to start syncing</p>
              </div>
            </li>
          </ol>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={onGetStarted}
            size="sm"
            className="flex-1 min-w-[140px]"
          >
            {isConfigured ? (
              <>
                <Check className="w-4 h-4" />
                Configured
              </>
            ) : (
              <>
                <List className="w-4 h-4" />
                Configure Token
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
