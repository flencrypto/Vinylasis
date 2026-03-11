import { BargainCard, BargainSignal, MarketListing, WatchlistItem } from './types'

export interface BargainAnalysisInput {
  listing: MarketListing
  watchlistItems?: WatchlistItem[]
}

export interface BargainAnalysisResult {
  bargainScore: number
  estimatedValue?: number
  estimatedUpside?: number
  signals: BargainSignal[]
  matchedRelease?: {
    artistName: string
    releaseTitle: string
    year: number
    catalogNumber?: string
  }
}

export async function analyzeBargainPotential(
  input: BargainAnalysisInput
): Promise<BargainAnalysisResult> {
  const { listing } = input

  const analysisPrompt = spark.llmPrompt`You are a vinyl record bargain detection expert. Analyze this marketplace listing and identify signals that it might be undervalued or misdescribed.

Listing Details:
- Title: ${listing.title}
- Description: ${listing.description || 'No description provided'}
- Price: ${listing.currency} ${listing.price}
- Condition: ${listing.condition || 'Not specified'}
- Source: ${listing.source}

Analyze for these bargain signals:
1. **title_mismatch**: Title doesn't match known release format (misspellings, missing info, poor metadata)
2. **low_price**: Price appears unusually low compared to typical vinyl prices
3. **wrong_category**: May be miscategorized or listed as something else
4. **job_lot**: Appears to be a bundle/lot with potentially high-value items visible
5. **promo_keywords**: Contains promo, test pressing, white label, acetate, or rare variant keywords
6. **poor_metadata**: Seller clearly doesn't know what they have (generic descriptions, no catalog numbers)

For each signal detected:
- Assign a score from 0-100 (higher = stronger signal)
- Provide a brief description of what you detected
- Include evidence from the listing

Also estimate:
- Likely actual market value if identifiable
- Potential upside (estimated value - listing price)
- Matched release details if you can identify the record

Return ONLY valid JSON with this structure:
{
  "bargainScore": (overall 0-100 score),
  "estimatedValue": (number or null),
  "estimatedUpside": (number or null),
  "signals": [
    {
      "type": "title_mismatch" | "low_price" | "wrong_category" | "job_lot" | "promo_keywords" | "poor_metadata",
      "score": (0-100),
      "description": "brief description",
      "evidence": "specific evidence from listing"
    }
  ],
  "matchedRelease": {
    "artistName": "artist name",
    "releaseTitle": "release title",
    "year": year,
    "catalogNumber": "catalog number"
  } or null
}`

  const result = await spark.llm(analysisPrompt, 'gpt-4o', true)
  const analysis = JSON.parse(result)

  return {
    bargainScore: analysis.bargainScore || 0,
    estimatedValue: analysis.estimatedValue || undefined,
    estimatedUpside: analysis.estimatedUpside || undefined,
    signals: analysis.signals || [],
    matchedRelease: analysis.matchedRelease || undefined,
  }
}

export async function generateMockMarketListings(count: number = 10): Promise<MarketListing[]> {
  const prompt = spark.llmPrompt`Generate ${count} realistic marketplace listings for vinyl records that have varying bargain potential. 

Include a mix of:
- Obvious bargains (misspelled titles, low prices, poor descriptions)
- Potential gems (promo copies, test pressings, rare variants poorly described)
- Job lots with hidden value
- Fairly priced items
- Overpriced items

Make the listings feel authentic with real artist names, realistic prices in GBP, typical seller descriptions.

Return ONLY valid JSON with this structure:
{
  "listings": [
    {
      "id": "unique-id",
      "source": "ebay" | "discogs" | "reverb",
      "externalId": "external-listing-id",
      "title": "listing title as seller wrote it",
      "description": "seller description (can be brief or detailed)",
      "price": (number, realistic GBP price),
      "currency": "GBP",
      "condition": "VG" | "VG+" | "EX" | "NM" | "Used" | "Good" | null,
      "seller": "seller username",
      "location": "UK location",
      "url": "https://example.com/listing",
      "listedAt": "ISO date string"
    }
  ]
}`

  const result = await spark.llm(prompt, 'gpt-4o', true)
  const data = JSON.parse(result)
  
  return data.listings || []
}

export async function matchWatchlistToListing(
  listing: MarketListing,
  watchlistItem: WatchlistItem
): Promise<{ matches: boolean; score: number; reason: string }> {
  const prompt = spark.llmPrompt`Analyze if this marketplace listing matches the user's watchlist criteria.

Watchlist Item:
- Type: ${watchlistItem.type}
- Artist: ${watchlistItem.artistName || 'Any'}
- Release: ${watchlistItem.releaseTitle || 'Any'}
- Pressing Details: ${watchlistItem.pressingDetails || 'Any'}
- Search Query: ${watchlistItem.searchQuery || 'None'}
- Target Price: ${watchlistItem.targetPrice ? `${watchlistItem.targetCurrency} ${watchlistItem.targetPrice}` : 'Any price'}

Marketplace Listing:
- Title: ${listing.title}
- Description: ${listing.description || 'No description'}
- Price: ${listing.currency} ${listing.price}
- Condition: ${listing.condition || 'Not specified'}

Determine:
1. Does this listing match the watchlist criteria?
2. Match confidence score (0-100)
3. Brief reason for match or no match

Return ONLY valid JSON:
{
  "matches": true or false,
  "score": (0-100),
  "reason": "explanation of match or why no match"
}`

  const result = await spark.llm(prompt, 'gpt-4o', true)
  const analysis = JSON.parse(result)
  
  return {
    matches: analysis.matches || false,
    score: analysis.score || 0,
    reason: analysis.reason || 'No analysis available',
  }
}

export const analyzeBargain = analyzeBargainPotential
