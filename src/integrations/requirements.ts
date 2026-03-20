// src/integrations/requirements.ts
// Single source of truth for all integration requirements

export interface IntegrationDefinition {
  id: string
  name: string
  description: string
  localStorageKeys: string[]
  optional: boolean
  howToGet: string
  link: string
  features: string[]
}

export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Powers AI condition grading, image analysis, and listing generation using GPT-4 Vision.',
    localStorageKeys: ['openai_api_key'],
    optional: false,
    howToGet: `1. Go to https://platform.openai.com/signup and create an account.\n2. Navigate to https://platform.openai.com/api-keys.\n3. Click "Create new secret key".\n4. Copy the key (starts with sk-...) and paste it in Settings.\n5. Ensure your account has GPT-4 Vision access (requires billing setup).`,
    link: 'https://platform.openai.com/api-keys',
    features: [
      'AI condition grading',
      'Record image analysis',
      'Automated listing generation',
      'Pressing identification',
      'Bargain detection scoring',
    ],
  },
  {
    id: 'discogs',
    name: 'Discogs',
    description: 'Provides marketplace search, release valuation, and pressing identification via the Discogs database.',
    localStorageKeys: ['discogs_personal_token'],
    optional: false,
    howToGet: `1. Create a free account at https://www.discogs.com/register.\n2. Go to https://www.discogs.com/settings/developers.\n3. Click "Generate new token".\n4. Copy your Personal Access Token and paste it in Settings.\n5. (Optional) For OAuth: create an app at the same page to get Consumer Key & Secret.`,
    link: 'https://www.discogs.com/settings/developers',
    features: [
      'Discogs marketplace search',
      'Release valuation',
      'Pressing identification',
      'Price history lookup',
      'Collection sync',
    ],
  },
  {
    id: 'ebay',
    name: 'eBay Developer',
    description: 'Enables eBay deal scanning, live listing searches, and price comparison against eBay marketplace.',
    localStorageKeys: ['ebay_client_id', 'ebay_client_secret'],
    optional: false,
    howToGet: `1. Go to https://developer.ebay.com and sign in with your eBay account.\n2. Navigate to "My Account" → "Application Access Keys".\n3. Create a new application (Production keys).\n4. Copy your App ID (Client ID) and Client Secret.\n5. Paste both values in Settings under eBay.\n6. Note: App ID is also used as "ebay_app_id" internally.`,
    link: 'https://developer.ebay.com/my/keys',
    features: [
      'eBay deal scanning',
      'Live eBay listing search',
      'eBay price comparison',
      'Bargain detection from eBay',
    ],
  },
  {
    id: 'imgbb',
    name: 'ImgBB',
    description: 'Hosts record images for marketplace listings, providing stable public URLs for eBay/Discogs listings.',
    localStorageKeys: ['imgbb_api_key'],
    optional: false,
    howToGet: `1. Go to https://imgbb.com and create a free account.\n2. Navigate to https://api.imgbb.com.\n3. Click "Get API Key".\n4. Copy your API key and paste it in Settings.\n5. Free tier supports up to 32MB image uploads.`,
    link: 'https://api.imgbb.com',
    features: [
      'Image hosting for listings',
      'Stable image URLs for eBay',
      'Record photo uploads',
    ],
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    description: 'Optional alternative AI provider using Grok for record analysis and listing generation.',
    localStorageKeys: ['xai_api_key'],
    optional: true,
    howToGet: `1. Go to https://console.x.ai and sign in with your X/Twitter account.\n2. Navigate to the API section.\n3. Create a new API key.\n4. Copy and paste it in Settings under xAI.\n5. Used as a fallback or alternative to OpenAI.`,
    link: 'https://console.x.ai',
    features: [
      'Alternative AI analysis',
      'Grok-powered listing generation',
      'Condition grading (fallback)',
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI',
    description: 'Optional cost-effective AI alternative for analysis and listing generation.',
    localStorageKeys: ['deepseek_api_key'],
    optional: true,
    howToGet: `1. Go to https://platform.deepseek.com and create an account.\n2. Navigate to "API Keys" in your dashboard.\n3. Create a new API key.\n4. Copy and paste it in Settings under DeepSeek.\n5. DeepSeek offers competitive pricing as an OpenAI alternative.`,
    link: 'https://platform.deepseek.com',
    features: [
      'Alternative AI analysis',
      'Cost-effective listing generation',
      'Condition grading (fallback)',
    ],
  },
  {
    id: 'pinata',
    name: 'Pinata (IPFS)',
    description: 'Stores NFT metadata on IPFS via Pinata for permanent, decentralised record NFT metadata.',
    localStorageKeys: ['pinata_jwt'],
    optional: true,
    howToGet: `1. Go to https://app.pinata.cloud and create a free account.\n2. Navigate to "API Keys" in your dashboard.\n3. Click "New Key" and enable the "pinFileToIPFS" permission.\n4. Copy the JWT token (not the API key) and paste it in Settings.\n5. Free tier includes 1GB storage.`,
    link: 'https://app.pinata.cloud/developers/api-keys',
    features: [
      'NFT metadata storage on IPFS',
      'Solana NFT minting',
      'Permanent decentralised metadata',
    ],
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    description: 'Sends deal alert notifications to your Telegram chat when bargains are found.',
    localStorageKeys: ['telegram_bot_token', 'telegram_chat_id'],
    optional: true,
    howToGet: `1. Open Telegram and search for @BotFather.\n2. Send /newbot and follow the prompts to create your bot.\n3. Copy the bot token provided (format: 123456:ABC-DEF...).\n4. Start a chat with your bot, then visit: https://api.telegram.org/bot<TOKEN>/getUpdates\n5. Find your chat_id in the response (a number like 123456789).\n6. Paste both the bot token and chat ID in Settings.`,
    link: 'https://core.telegram.org/bots#botfather',
    features: [
      'Deal alert notifications',
      'Bargain detection alerts',
      'Watchlist match notifications',
    ],
  },
]

/**
 * Safe wrapper around localStorage.getItem that returns null without throwing
 * in restricted environments (e.g. sandboxed iframes, private browsing).
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Returns the list of localStorage keys that are missing (empty/null) for the given integration.
 */
export function getMissingKeys(integrationId: string): string[] {
  const integration = INTEGRATIONS.find((i) => i.id === integrationId)
  if (!integration) return []
  return integration.localStorageKeys.filter((key) => {
    const value = safeGetItem(key)
    return !value || value.trim() === ''
  })
}

/**
 * Returns true if all required localStorage keys for the integration are present and non-empty.
 */
export function isIntegrationConfigured(integrationId: string): boolean {
  return getMissingKeys(integrationId).length === 0
}

/**
 * Returns status of all integrations.
 */
export function getIntegrationStatus(): Record<string, { configured: boolean; missing: string[] }> {
  return Object.fromEntries(
    INTEGRATIONS.map((integration) => {
      const missing = getMissingKeys(integration.id)
      return [integration.id, { configured: missing.length === 0, missing }]
    })
  )
}
