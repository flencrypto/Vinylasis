import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Check, ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface DiscogsSetupGuideProps {
  onGetStarted: () => void
  isConfigured?: boolean
}

export default function DiscogsSetupGuide({ onGetStarted, isConfigured = false }: DiscogsSetupGuideProps) {
  if (isConfigured) {
    return (
      <Card className="bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent border-green-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Check className="w-5 h-5 text-green-400" />
            Discogs API Configured
          </CardTitle>
          <CardDescription className="text-slate-300">
            Your Discogs Personal Access Token is configured and ready to use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={onGetStarted}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Check className="w-4 h-4" />
              Ready to Use
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-accent/10 via-transparent to-transparent border-accent/30">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-accent/20 rounded-lg">
            <Database className="w-6 h-6 text-accent" weight="fill" />
          </div>
          <div>
            <CardTitle className="text-white">Setup Discogs API</CardTitle>
            <CardDescription className="text-slate-300 mt-1">
              Connect to Discogs for accurate pressing identification
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ol className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <span className="text-xs font-bold text-accent">1</span>
              <div className="flex-1">
                <p className="text-sm text-slate-200">Visit Discogs Developer Settings</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xs font-bold text-accent">2</span>
              <div className="flex-1">
                <p className="text-sm text-slate-200">Generate a Personal Access Token</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xs font-bold text-accent">3</span>
              <div className="flex-1">
                <p className="text-sm text-slate-200">⚠️ Copy the token immediately (shown only once)</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xs font-bold text-accent">4</span>
              <div className="flex-1">
                <p className="text-sm text-slate-200">Click "Configure Token" below to enter it</p>
              </div>
            </li>
          </ol>
        </div>

        <div className="flex gap-2 flex-wrap mt-4">
          <Button
            onClick={onGetStarted}
            className="bg-accent hover:bg-accent/90 text-accent-foreground flex-1 gap-2"
            size="lg"
          >
            <ArrowRight className="w-4 h-4" />
            Configure Token
          </Button>
          <Button
            onClick={() => window.open('https://www.discogs.com/settings/developers', '_blank')}
            variant="outline"
            className="flex-1 gap-2"
            size="lg"
          >
            <Database className="w-4 h-4" />
            Open Discogs Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
