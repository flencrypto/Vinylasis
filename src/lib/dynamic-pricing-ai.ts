import { CollectionItem, MediaGrade, SleeveGrade } from './types'
import { fetchComparableSales, ComparableSale, generateDetailedValuation } from './valuation-service'

declare const spark: Window['spark']

export interface DynamicPricingStrategy {
  strategy: 'competitive' | 'premium' | 'quick_sale' | 'market_rate'
  description: string
  priceAdjustment: number
}

export interface MarketIntelligence {
  demandSignal: 'high' | 'medium' | 'low'
  supplyLevel: 'scarce' | 'limited' | 'abundant'
  competitiveLandscape: {
    lowestPrice: number
    highestPrice: number
    averagePrice: number
    activeListing: number
  }
  seasonalFactor: number
  trendMomentum: 'increasing' | 'stable' | 'decreasing'
}

export interface AutoPricingRecommendation {
  recommendedPrice: number
  priceFloor: number
  priceCeiling: number
  currency: string
  confidence: number
  strategy: DynamicPricingStrategy
  marketIntelligence: MarketIntelligence
  reasoning: string[]
  competitivePosition: 'below_market' | 'at_market' | 'above_market'
  expectedSaleSpeed: 'fast' | 'moderate' | 'slow'
  profitMargin: number
}

export async function generateAutoPricing(
  item: CollectionItem,
  options?: {
    strategy?: 'competitive' | 'premium' | 'quick_sale' | 'market_rate'
    targetProfitMargin?: number
    considerSeasonality?: boolean
  }
): Promise<AutoPricingRecommendation> {
  const strategy = options?.strategy || 'market_rate'
  const targetMargin = options?.targetProfitMargin || 0.20
  const considerSeasonality = options?.considerSeasonality !== false

  const comps = await fetchComparableSales(item, { 
    maxResults: 30, 
    recencyDays: 60,
    includeInternal: true 
  })

  const valuation = await generateDetailedValuation(item, comps)

  const marketIntel = await analyzeMarketIntelligence(item, comps)

  const pricingStrategy = getPricingStrategy(strategy, marketIntel)

  const basePrice = valuation.estimateMid

  let adjustedPrice = basePrice * pricingStrategy.priceAdjustment

  if (considerSeasonality) {
    adjustedPrice *= marketIntel.seasonalFactor
  }

  if (marketIntel.demandSignal === 'high' && marketIntel.supplyLevel === 'scarce') {
    adjustedPrice *= 1.15
  } else if (marketIntel.demandSignal === 'low' && marketIntel.supplyLevel === 'abundant') {
    adjustedPrice *= 0.90
  }

  const priceFloor = calculatePriceFloor(item, basePrice, targetMargin)
  const priceCeiling = calculatePriceCeiling(basePrice, marketIntel)

  const finalPrice = Math.max(priceFloor, Math.min(adjustedPrice, priceCeiling))

  const reasoning = await generatePricingReasoning(
    item,
    finalPrice,
    basePrice,
    marketIntel,
    pricingStrategy,
    valuation.comparableSalesCount
  )

  const competitivePosition = determineCompetitivePosition(
    finalPrice,
    marketIntel.competitiveLandscape.averagePrice
  )

  const expectedSaleSpeed = estimateSaleSpeed(
    competitivePosition,
    marketIntel.demandSignal,
    item.condition.mediaGrade
  )

  const profitMargin = item.purchasePrice 
    ? ((finalPrice - item.purchasePrice) / item.purchasePrice)
    : targetMargin

  return {
    recommendedPrice: Math.round(finalPrice * 100) / 100,
    priceFloor: Math.round(priceFloor * 100) / 100,
    priceCeiling: Math.round(priceCeiling * 100) / 100,
    currency: item.purchaseCurrency || 'GBP',
    confidence: calculatePricingConfidence(comps.length, marketIntel),
    strategy: pricingStrategy,
    marketIntelligence: marketIntel,
    reasoning,
    competitivePosition,
    expectedSaleSpeed,
    profitMargin: Math.round(profitMargin * 100) / 100,
  }
}

async function analyzeMarketIntelligence(
  item: CollectionItem,
  comps: ComparableSale[]
): Promise<MarketIntelligence> {
  const recentComps = comps.filter(comp => {
    const daysSince = (Date.now() - new Date(comp.soldAt).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince <= 30
  })

  const demandSignal = calculateDemandSignal(recentComps.length, comps.length)
  
  const supplyLevel = estimateSupplyLevel(item, comps)

  const prices = comps.map(c => c.soldPrice)
  const competitiveLandscape = {
    lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
    highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
    averagePrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
    activeListing: comps.length,
  }

  const seasonalFactor = calculateSeasonalFactor(new Date().getMonth())

  const trendMomentum = calculateTrendMomentum(comps)

  return {
    demandSignal,
    supplyLevel,
    competitiveLandscape,
    seasonalFactor,
    trendMomentum,
  }
}

function calculateDemandSignal(
  recentSales: number,
  totalSales: number
): 'high' | 'medium' | 'low' {
  if (recentSales >= 5) return 'high'
  if (recentSales >= 2 || totalSales >= 8) return 'medium'
  return 'low'
}

function estimateSupplyLevel(
  item: CollectionItem,
  comps: ComparableSale[]
): 'scarce' | 'limited' | 'abundant' {
  const isRare = item.notes?.toLowerCase().includes('rare') ||
                 item.notes?.toLowerCase().includes('limited') ||
                 item.catalogNumber?.toLowerCase().includes('ltd')

  if (isRare || comps.length <= 3) return 'scarce'
  if (comps.length <= 10) return 'limited'
  return 'abundant'
}

function calculateSeasonalFactor(month: number): number {
  const seasonalMultipliers: Record<number, number> = {
    0: 0.95,
    1: 0.95,
    2: 1.00,
    3: 1.05,
    4: 1.05,
    5: 1.00,
    6: 0.95,
    7: 0.95,
    8: 1.00,
    9: 1.05,
    10: 1.10,
    11: 1.15,
  }

  return seasonalMultipliers[month] || 1.0
}

function calculateTrendMomentum(comps: ComparableSale[]): 'increasing' | 'stable' | 'decreasing' {
  if (comps.length < 4) return 'stable'

  const sorted = [...comps].sort((a, b) => 
    new Date(a.soldAt).getTime() - new Date(b.soldAt).getTime()
  )

  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2))
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2))

  const avgFirst = firstHalf.reduce((sum, c) => sum + c.soldPrice, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((sum, c) => sum + c.soldPrice, 0) / secondHalf.length

  const change = (avgSecond - avgFirst) / avgFirst

  if (change > 0.12) return 'increasing'
  if (change < -0.12) return 'decreasing'
  return 'stable'
}

function getPricingStrategy(
  strategy: 'competitive' | 'premium' | 'quick_sale' | 'market_rate',
  marketIntel: MarketIntelligence
): DynamicPricingStrategy {
  const strategies: Record<string, DynamicPricingStrategy> = {
    competitive: {
      strategy: 'competitive',
      description: 'Price below market average to sell quickly and gain competitive edge',
      priceAdjustment: 0.90,
    },
    premium: {
      strategy: 'premium',
      description: 'Price above market to maximize profit on rare/high-quality items',
      priceAdjustment: 1.20,
    },
    quick_sale: {
      strategy: 'quick_sale',
      description: 'Price aggressively low for fast turnover and immediate cash flow',
      priceAdjustment: 0.80,
    },
    market_rate: {
      strategy: 'market_rate',
      description: 'Price at market median for balanced sale speed and profit',
      priceAdjustment: 1.00,
    },
  }

  const base = strategies[strategy]

  if (marketIntel.trendMomentum === 'increasing' && strategy === 'market_rate') {
    return {
      ...base,
      priceAdjustment: 1.08,
      description: base.description + ' (adjusted up for rising trend)',
    }
  }

  if (marketIntel.trendMomentum === 'decreasing' && strategy === 'premium') {
    return {
      ...base,
      priceAdjustment: 1.10,
      description: base.description + ' (adjusted down for falling trend)',
    }
  }

  return base
}

function calculatePriceFloor(
  item: CollectionItem,
  basePrice: number,
  targetMargin: number
): number {
  if (item.purchasePrice) {
    const costBasedFloor = item.purchasePrice * (1 + targetMargin)
    return Math.max(costBasedFloor, basePrice * 0.60)
  }

  return basePrice * 0.65
}

function calculatePriceCeiling(
  basePrice: number,
  marketIntel: MarketIntelligence
): number {
  if (marketIntel.supplyLevel === 'scarce' && marketIntel.demandSignal === 'high') {
    return basePrice * 1.80
  }

  if (marketIntel.competitiveLandscape.highestPrice > 0) {
    return Math.min(
      basePrice * 1.50,
      marketIntel.competitiveLandscape.highestPrice * 1.10
    )
  }

  return basePrice * 1.40
}

async function generatePricingReasoning(
  item: CollectionItem,
  finalPrice: number,
  basePrice: number,
  marketIntel: MarketIntelligence,
  strategy: DynamicPricingStrategy,
  compsCount: number
): Promise<string[]> {
  const prompt = spark.llmPrompt`You are a vinyl record pricing expert. Generate 3-5 concise bullet points explaining a pricing recommendation.

Item Details:
- Artist: ${item.artistName}
- Title: ${item.releaseTitle}
- Format: ${item.format}
- Year: ${item.year}
- Country: ${item.country}
- Media Grade: ${item.condition.mediaGrade}
- Sleeve Grade: ${item.condition.sleeveGrade}

Market Analysis:
- Comparable Sales Found: ${compsCount}
- Demand Signal: ${marketIntel.demandSignal}
- Supply Level: ${marketIntel.supplyLevel}
- Market Trend: ${marketIntel.trendMomentum}
- Seasonal Factor: ${(marketIntel.seasonalFactor * 100 - 100).toFixed(0)}%
- Average Competitor Price: £${marketIntel.competitiveLandscape.averagePrice.toFixed(2)}

Pricing:
- Base Valuation: £${basePrice.toFixed(2)}
- Recommended Price: £${finalPrice.toFixed(2)}
- Strategy: ${strategy.strategy}

Generate concise, specific reasoning points that explain why this price makes sense. Focus on market dynamics, condition impact, and strategic positioning. Keep each point under 15 words.

Return as JSON with a single property "reasoning" containing an array of strings.`

  try {
    const response = await spark.llm(prompt, 'gpt-4o-mini', true)
    const parsed = JSON.parse(response)
    return parsed.reasoning || generateFallbackReasoning(marketIntel, strategy, compsCount)
  } catch (error) {
    console.error('Failed to generate AI reasoning, using fallback:', error)
    return generateFallbackReasoning(marketIntel, strategy, compsCount)
  }
}

function generateFallbackReasoning(
  marketIntel: MarketIntelligence,
  strategy: DynamicPricingStrategy,
  compsCount: number
): string[] {
  const reasons: string[] = []

  if (compsCount >= 5) {
    reasons.push(`Strong pricing confidence with ${compsCount} comparable sales`)
  } else if (compsCount > 0) {
    reasons.push(`Moderate confidence based on ${compsCount} comparable sales`)
  } else {
    reasons.push('Estimate based on format, year, and condition heuristics')
  }

  if (marketIntel.demandSignal === 'high') {
    reasons.push('High demand detected - premium pricing supported')
  } else if (marketIntel.demandSignal === 'low') {
    reasons.push('Lower demand suggests competitive pricing needed')
  }

  if (marketIntel.trendMomentum === 'increasing') {
    reasons.push('Rising price trend supports higher valuation')
  } else if (marketIntel.trendMomentum === 'decreasing') {
    reasons.push('Falling trend suggests conservative pricing')
  }

  if (marketIntel.seasonalFactor > 1.05) {
    reasons.push('Seasonal boost applied for peak buying period')
  }

  reasons.push(`${strategy.strategy.replace('_', ' ')} strategy for optimal results`)

  return reasons.slice(0, 5)
}

function determineCompetitivePosition(
  price: number,
  marketAvg: number
): 'below_market' | 'at_market' | 'above_market' {
  if (marketAvg === 0) return 'at_market'

  const ratio = price / marketAvg

  if (ratio < 0.92) return 'below_market'
  if (ratio > 1.08) return 'above_market'
  return 'at_market'
}

function estimateSaleSpeed(
  position: 'below_market' | 'at_market' | 'above_market',
  demand: 'high' | 'medium' | 'low',
  condition: MediaGrade
): 'fast' | 'moderate' | 'slow' {
  const isPristine = condition === 'M' || condition === 'NM'

  if (position === 'below_market') {
    return demand === 'low' ? 'moderate' : 'fast'
  }

  if (position === 'above_market') {
    return isPristine && demand === 'high' ? 'moderate' : 'slow'
  }

  if (demand === 'high') return 'fast'
  if (demand === 'medium') return 'moderate'
  return 'slow'
}

function calculatePricingConfidence(
  compsCount: number,
  marketIntel: MarketIntelligence
): number {
  let confidence = 0.40

  if (compsCount >= 10) confidence += 0.30
  else if (compsCount >= 5) confidence += 0.20
  else if (compsCount >= 2) confidence += 0.10

  if (marketIntel.demandSignal === 'high') confidence += 0.10
  if (marketIntel.supplyLevel === 'scarce') confidence += 0.05
  if (marketIntel.trendMomentum === 'stable') confidence += 0.10

  return Math.min(confidence, 0.95)
}
