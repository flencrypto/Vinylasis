import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, List } from '@phosphor-icons/react'

interface DiscogsSetupGuideProps {
  isConfigured: boolean
  onGetStarted: () => void
}

export default function DiscogsSetupGuide({ isConfigured, onGetStarted }: DiscogsSetupGuideProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Discogs API Setup
        </CardTitle>
        <CardDescription>
          Connect your Discogs account to unlock collection management features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                1
              </span>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Create a Discogs account at discogs.com
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                2
              </span>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Generate your API token from Settings → Developers
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                3
              </span>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Enter your token in the configuration dialog
                </p>
              </div>
            </li>
          </ol>
          <Button
            onClick={onGetStarted}
            className="w-full"
            size="sm"
          >
            {isConfigured ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Configured
              </>
            ) : (
              <>
                <List className="w-4 h-4 mr-2" />
                Get Started
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
