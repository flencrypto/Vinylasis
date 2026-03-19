import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
interface DiscogsSetupGuideProps {

interface DiscogsSetupGuideProps {
  isConfigured?: boolean
  onGetStarted: () => void
}

            </CardDescription>
        </
      <CardContent>
          <ol clas
              <span className="text-xs font-semi
                <p className="text
            </li>
              <span className="text-xs font-semibold tex
                <p className="text-sm text-slate-200">Generate a new Personal
            </li>
              <s
              
      </CardHeader>>
          </ol>
        </div>
          <ol className="space-y-3 text-sm">
          <Button
            onClick={onGetStarted}
            className="bg-accent hover:bg-accent/90 text-accent-foreground flex-1 gap-2"
            size="sm"
          >
            {isConfigured ? (
              <>
                <Check className="w-4 h-4" />
                Reconfigure Token
                <p className="text-sm text-slate-200">Generate a new Personal Access Token</p>
              </div>
            </li>
            <li className="flex gap-2">
              <span className="text-xs font-semibold text-accent bg-accent/10 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
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
            size="sm"
          >
            {isConfigured ? (
              <>
                <Check className="w-4 h-4" />
                Reconfigure Token
              </>
            ) : (
              <>
