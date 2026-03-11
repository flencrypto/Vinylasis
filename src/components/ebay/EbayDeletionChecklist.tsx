import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Circle, 
  HardDrives, 
  Bell, 
  ShieldCheck, 
  FileText, 
  Code,
  Warning,
  Copy,
  ArrowSquareOut
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ChecklistItem {
  id: string
  label: string
  description?: string
  codeExample?: string
}

const CHECKLIST_SECTIONS = {
  preSetup: {
    title: '1. Pre-Setup: Prepare Your Endpoint',
    icon: HardDrives,
    color: 'text-blue-500',
    items: [
      {
        id: 'https-endpoint',
        label: 'Create an HTTPS endpoint (no localhost, no internal IPs)',
        description: 'Must be publicly accessible and use SSL/TLS'
      },
      {
        id: 'get-post-support',
        label: 'Ensure it supports GET and POST',
        description: 'GET for challenge verification, POST for notifications'
      },
      {
        id: 'challenge-logic',
        label: 'Implement logic to receive challenge_code via GET',
        description: 'Your endpoint must extract challengeCode from query params'
      },
      {
        id: 'hash-implementation',
        label: 'Hash challengeCode + verificationToken + endpointURL',
        description: 'Use SHA-256 in the correct order',
        codeExample: `const crypto = require('crypto');

function generateChallengeResponse(challengeCode, verificationToken, endpointURL) {
  const hash = crypto
    .createHash('sha256')
    .update(challengeCode + verificationToken + endpointURL)
    .digest('hex');
  return hash;
}`
      },
      {
        id: 'json-response',
        label: 'Return JSON: { "challengeResponse": "<sha256_hex_value>" }',
        description: 'Must be valid JSON with no BOM',
        codeExample: `app.get('/ebay-notifications', (req, res) => {
  const { challenge_code } = req.query;
  const response = generateChallengeResponse(
    challenge_code,
    process.env.EBAY_VERIFICATION_TOKEN,
    process.env.ENDPOINT_URL
  );
  res.json({ challengeResponse: response });
});`
      },
      {
        id: 'json-library',
        label: 'Use a proper JSON library (avoid BOM issues)',
        description: 'Most modern frameworks handle this automatically'
      },
      {
        id: 'local-test',
        label: 'Test locally to ensure endpoint returns 200 OK with valid JSON',
        description: 'Use curl or Postman before submitting to eBay'
      }
    ]
  },
  subscribe: {
    title: '2. Subscribe to Notifications',
    icon: Bell,
    color: 'text-purple-500',
    items: [
      {
        id: 'sign-in-portal',
        label: 'Sign in → Application Keys → Notifications',
        description: 'Navigate to eBay Developer Portal'
      },
      {
        id: 'select-deletion',
        label: 'Select Marketplace Account Deletion',
        description: 'Choose the notification type'
      },
      {
        id: 'alert-email',
        label: 'Enter an alert email (used only if endpoint fails)',
        description: 'Fallback contact for endpoint failures'
      },
      {
        id: 'endpoint-url',
        label: 'Enter your Notification Endpoint URL',
        description: 'Must match the URL used in hash calculation'
      },
      {
        id: 'verification-token',
        label: 'Enter a 32–80 character verification token (A–Z, 0–9, _, -)',
        description: 'Generate a strong random token and store it securely'
      },
      {
        id: 'save-subscribe',
        label: 'Click Save → eBay sends the challenge request',
        description: 'Your endpoint must respond correctly'
      },
      {
        id: 'confirm-activation',
        label: 'Confirm endpoint responds correctly and subscription activates',
        description: 'Check for success message in portal'
      },
      {
        id: 'test-notification',
        label: 'Use Send Test Notification to verify end-to-end flow',
        description: 'Ensure your POST handler works'
      }
    ]
  },
  optOut: {
    title: '3. Opt-Out (Only If You Store No eBay User Data)',
    icon: ShieldCheck,
    color: 'text-amber-500',
    items: [
      {
        id: 'toggle-opt-out',
        label: 'Toggle "Not persisting eBay data" → ON',
        description: 'ONLY if you genuinely store zero eBay user data'
      },
      {
        id: 'confirm-popup',
        label: 'Confirm the pop-up',
        description: 'Read the warning carefully'
      },
      {
        id: 'exemption-reason',
        label: 'Select an exemption reason',
        description: 'Must be accurate and truthful'
      },
      {
        id: 'add-notes',
        label: 'Optionally add notes',
        description: 'Explain your data handling if needed'
      },
      {
        id: 'submit-exemption',
        label: 'Submit the exemption request',
        description: 'Wait for approval'
      },
      {
        id: 'understand-penalties',
        label: 'Understand that incorrect claims can lead to penalties',
        description: 'False declarations violate eBay policies'
      }
    ]
  },
  handleNotifications: {
    title: '4. Handle Incoming Notifications',
    icon: FileText,
    color: 'text-green-500',
    items: [
      {
        id: 'accept-post',
        label: 'Accept HTTP POST with JSON payload',
        description: 'Parse the notification body',
        codeExample: `app.post('/ebay-notifications', async (req, res) => {
  // Acknowledge immediately
  res.status(200).send();
  
  // Process asynchronously
  const notification = req.body;
  await processAccountDeletion(notification);
});`
      },
      {
        id: 'respond-200',
        label: 'Immediately respond with 200, 201, 202, or 204',
        description: 'Never delay acknowledgement'
      },
      {
        id: 'no-delay',
        label: 'Never delay acknowledgement — retries continue for 24 hours',
        description: 'Process deletion asynchronously after responding'
      },
      {
        id: 'fix-downtime',
        label: 'Fix any downtime within 30 days or risk non-compliance',
        description: 'Monitor endpoint health actively'
      },
      {
        id: 'delete-data',
        label: 'After acknowledging, delete the user\'s data unless legally required to retain it',
        description: 'GDPR and privacy law compliance'
      },
      {
        id: 'irreversible-deletion',
        label: 'Ensure deletion is irreversible even with highest system privileges',
        description: 'Hard delete, not soft delete'
      }
    ]
  },
  verifyAuthenticity: {
    title: '5. Verify Notification Authenticity',
    icon: Code,
    color: 'text-red-500',
    items: [
      {
        id: 'use-sdk',
        label: 'Use the Event Notification SDK (Java, Node.js, .NET, PHP, Go)',
        description: 'Recommended approach for production'
      },
      {
        id: 'decode-signature',
        label: 'Decode signature header',
        description: 'Extract x-ebay-signature from headers'
      },
      {
        id: 'fetch-public-key',
        label: 'Fetch public key via Notification API (cached for ~1 hour)',
        description: 'Use getPublicKey endpoint'
      },
      {
        id: 'verify-signature',
        label: 'Verify signature → process payload',
        description: 'Only process verified notifications',
        codeExample: `const { verifySignature } = require('ebay-event-notification-sdk');

async function validateNotification(req) {
  const signature = req.headers['x-ebay-signature'];
  const payload = JSON.stringify(req.body);
  
  const isValid = await verifySignature(signature, payload);
  if (!isValid) {
    throw new Error('Invalid notification signature');
  }
}`
      },
      {
        id: 'manual-verification',
        label: 'Manual: Base64-decode x-ebay-signature and verify with getPublicKey',
        description: 'Alternative to SDK'
      },
      {
        id: 'cache-key',
        label: 'Cache public key to avoid rate limits',
        description: 'Store for up to 1 hour'
      }
    ]
  },
  payloadStructure: {
    title: '6. Understand the Payload Structure',
    icon: FileText,
    color: 'text-cyan-500',
    items: [
      {
        id: 'notification-id',
        label: 'notificationId',
        description: 'Unique identifier for the notification'
      },
      {
        id: 'event-date',
        label: 'eventDate (when user requested deletion)',
        description: 'Timestamp of deletion request'
      },
      {
        id: 'publish-date',
        label: 'publishDate',
        description: 'When notification was sent'
      },
      {
        id: 'publish-attempt',
        label: 'publishAttemptCount',
        description: 'Retry counter'
      },
      {
        id: 'username',
        label: 'username (may be replaced with immutable ID for US users)',
        description: 'User identifier'
      },
      {
        id: 'user-id',
        label: 'userId (immutable)',
        description: 'Permanent user identifier'
      },
      {
        id: 'eias-token',
        label: 'eiasToken',
        description: 'Enterprise identity token',
        codeExample: `{
  "notificationId": "abc123",
  "eventDate": "2024-01-15T10:30:00.000Z",
  "publishDate": "2024-01-15T10:30:05.000Z",
  "publishAttemptCount": 1,
  "username": "user_abc",
  "userId": "12345678",
  "eiasToken": "token_xyz"
}`
      }
    ]
  },
  variableVolume: {
    title: '7. Be Prepared for Variable Volume',
    icon: Warning,
    color: 'text-orange-500',
    items: [
      {
        id: 'expect-zero',
        label: 'Expect many days with zero notifications',
        description: 'Normal operational pattern'
      },
      {
        id: 'expect-bursts',
        label: 'Expect occasional bursts — up to ~1500/day',
        description: 'Plan for peak capacity'
      },
      {
        id: 'scale-system',
        label: 'Ensure your system scales accordingly',
        description: 'Use queues and async processing'
      }
    ]
  }
}

export default function EbayDeletionChecklist() {
  const [completedItems, setCompletedItems] = useKV<string[]>('ebay-deletion-checklist', [])
  const [endpointUrl, setEndpointUrl] = useKV<string>('ebay-endpoint-url', '')
  const [verificationToken, setVerificationToken] = useKV<string>('ebay-verification-token', '')
  const [alertEmail, setAlertEmail] = useKV<string>('ebay-alert-email', '')
  const [notes, setNotes] = useKV<string>('ebay-checklist-notes', '')
  const [activeTab, setActiveTab] = useState('preSetup')

  const toggleItem = (itemId: string) => {
    setCompletedItems((current) => {
      const items = current || []
      if (items.includes(itemId)) {
        return items.filter(id => id !== itemId)
      }
      return [...items, itemId]
    })
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
    const length = 64
    let token = ''
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    for (let i = 0; i < length; i++) {
      token += chars[array[i] % chars.length]
    }
    setVerificationToken(token)
    toast.success('Verification token generated')
  }

  const totalItems = Object.values(CHECKLIST_SECTIONS).reduce(
    (sum, section) => sum + section.items.length,
    0
  )
  const completedCount = completedItems?.length || 0
  const progressPercent = (completedCount / totalItems) * 100

  const getSectionProgress = (sectionKey: string) => {
    const section = CHECKLIST_SECTIONS[sectionKey as keyof typeof CHECKLIST_SECTIONS]
    const sectionCompleted = section.items.filter(item => 
      completedItems?.includes(item.id)
    ).length
    return {
      completed: sectionCompleted,
      total: section.items.length,
      percent: (sectionCompleted / section.items.length) * 100
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                eBay Marketplace Account Deletion
              </h1>
              <p className="text-slate-400 text-lg">
                Developer compliance checklist for notification endpoint setup
              </p>
            </div>
            <Badge 
              variant={progressPercent === 100 ? 'default' : 'secondary'}
              className="text-lg px-4 py-2"
            >
              {completedCount} / {totalItems}
            </Badge>
          </div>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 font-medium">Overall Progress</span>
                  <span className="text-slate-400">{progressPercent.toFixed(0)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-amber-950/20 border-amber-900/50">
            <Warning className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-200">
              <strong>Important:</strong> This checklist is based on the official eBay Developers Program guide.
              Incorrect implementation can lead to non-compliance penalties.
              {' '}
              <a 
                href="https://developer.ebay.com/develop/guides/marketplace-account-deletion"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-100 inline-flex items-center gap-1"
              >
                View official documentation
                <ArrowSquareOut className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>
        </div>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Configuration</CardTitle>
            <CardDescription>Store your endpoint details for reference</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint-url" className="text-slate-300">
                  Endpoint URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="endpoint-url"
                    placeholder="https://api.yourapp.com/ebay-notifications"
                    value={endpointUrl}
                    onChange={(e) => setEndpointUrl(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white"
                  />
                  {endpointUrl && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(endpointUrl, 'Endpoint URL')}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert-email" className="text-slate-300">
                  Alert Email
                </Label>
                <Input
                  id="alert-email"
                  type="email"
                  placeholder="alerts@yourapp.com"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-token" className="text-slate-300">
                Verification Token (32-80 characters)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="verification-token"
                  placeholder="Generate or enter your verification token"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-white font-mono"
                  type="password"
                />
                <Button
                  variant="outline"
                  onClick={generateToken}
                  className="shrink-0"
                >
                  Generate
                </Button>
                {verificationToken && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(verificationToken, 'Token')}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Length: {verificationToken?.length || 0} / 80 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-300">
                Implementation Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Track your implementation progress, issues, or important details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-7 w-full bg-slate-900/50 border border-slate-800">
            {Object.entries(CHECKLIST_SECTIONS).map(([key, section]) => {
              const progress = getSectionProgress(key)
              const Icon = section.icon
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="relative data-[state=active]:bg-slate-800"
                >
                  <div className="flex flex-col items-center gap-1">
                    <Icon className={`h-5 w-5 ${section.color}`} />
                    <span className="text-xs hidden lg:block">
                      {progress.completed}/{progress.total}
                    </span>
                    {progress.percent === 100 && (
                      <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-500" />
                    )}
                  </div>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {Object.entries(CHECKLIST_SECTIONS).map(([key, section]) => {
            const Icon = section.icon
            return (
              <TabsContent key={key} value={key} className="space-y-4">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className={`h-6 w-6 ${section.color}`} />
                      <div className="flex-1">
                        <CardTitle className="text-white">{section.title}</CardTitle>
                      </div>
                      <Badge variant="outline">
                        {getSectionProgress(key).completed} / {getSectionProgress(key).total}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {section.items.map((item) => {
                      const isCompleted = completedItems?.includes(item.id) || false
                      return (
                        <div key={item.id} className="space-y-2">
                          <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                            <Checkbox
                              id={item.id}
                              checked={isCompleted}
                              onCheckedChange={() => toggleItem(item.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 space-y-1">
                              <Label
                                htmlFor={item.id}
                                className={`cursor-pointer text-base ${
                                  isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'
                                }`}
                              >
                                {item.label}
                              </Label>
                              {item.description && (
                                <p className="text-sm text-slate-400">{item.description}</p>
                              )}
                              {'codeExample' in item && item.codeExample && (
                                <div className="mt-2">
                                  <div className="relative">
                                    <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto">
                                      <code>{item.codeExample}</code>
                                    </pre>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => copyToClipboard(item.codeExample || '', 'Code')}
                                      className="absolute top-2 right-2 h-8 w-8"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-600 shrink-0" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </div>
  )
}
