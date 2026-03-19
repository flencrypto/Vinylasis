import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Check, ArrowRight, Info, Lightning, TestTube } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
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
            Discogs API Configured
          <CardDescription className="text-slate-300">
          </CardDescription>
        <CardContent>
            <Button
            Your Discogs Personal Access Token is configured and ready to use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
      </Card>
              onClick={onGetStarted}
              className="bg-green-500 hover:bg-green-600 text-white"
      <CardHeader>
          <di
              <Check className="w-4 h-4" />
              Ready to Use
            </Button>
              Co
        </CardContent>
        </div
    )
   

          
    <Card className="bg-gradient-to-br from-accent/10 via-transparent to-transparent border-accent/30">
            VinylV
        <div className="flex items-start gap-3">
          <div className="p-2 bg-accent/20 rounded-lg">
            <Database className="w-6 h-6 text-accent" weight="fill" />
                
          <div>
            <CardTitle className="text-white">Setup Discogs API</CardTitle>
            <CardDescription className="text-slate-300 mt-1">
              Connect to Discogs for accurate pressing identification
            </CardDescription>
          </div>
              
              </div
            <li className="flex items-sta
                <span className="text-xs font-bold text-accent">5<
              <div className="flex-1">
                  ⚠️ Copy the token immediately (sho
              </div>
            <li
                <span className="text-xs font-bold text-accent">
              <div className="flex-1">
              </div>
            <l
              

              </div>
          </ol>

          <Button
            className="bg-accent hover:bg-accent/90 text-accent-foreground flex-1 gap-2"
          >
              </div>
              <div className="flex-1">
            onClick={() => window.open('/DISCOGS_API_S
            size="lg"
          >
            Full Guide
        </div>
    </Card>
}





















































                <p className="text-sm text-slate-200">Click "Configure Token" below to enter it</p>
              </div>
            </li>
          </ol>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={onGetStarted}
            className="bg-accent hover:bg-accent/90 text-accent-foreground flex-1 gap-2"




















