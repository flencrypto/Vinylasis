import { CollectionItem, MediaGrade, PriceEstimate, ItemImage } from './types'

declare const spark: Window['spark']

export async function generateSEOKeywords(
  item: CollectionItem,
  channel: 'ebay' | 'discogs' | 'shopify'
): Promise<string[]> {
  const keywords: string[] = []

  keywords.push(item.artistName)
  keywords.push(item.releaseTitle)
  keywords.push(item.format)
  keywords.push(`${item.year}`)
  keywords.push(item.country)

  if (item.catalogNumber) {
    keywords.push(item.catalogNumber)
  }

  keywords.push('vinyl')
  keywords.push('record')
  keywords.push('LP')

  if (item.condition.mediaGrade === 'M' || item.condition.mediaGrade === 'NM') {
    keywords.push('mint')
    keywords.push('near mint')
  }

  if (item.year < 1970) {
    keywords.push('vintage')
    keywords.push('original pressing')
  }

  const genreKeywords = inferGenreKeywords(item.artistName)
  keywords.push(...genreKeywords)

  if (channel === 'ebay') {
    keywords.push('collector')
    keywords.push('rare')
  }

  return keywords
}

function inferGenreKeywords(artistName: string): string[] {
  const lowerArtist = artistName.toLowerCase()
  
  const genreMap: Record<string, string[]> = {
    'beatles': ['rock', 'pop', 'british invasion', '60s'],
    'pink floyd': ['progressive rock', 'psychedelic', 'classic rock'],
    'david bowie': ['glam rock', 'art rock', 'classic rock'],
    'led zeppelin': ['hard rock', 'heavy metal', 'classic rock'],
    'miles davis': ['jazz', 'bebop', 'fusion'],
    'kraftwerk': ['electronic', 'krautrock', 'synth'],
    'joy division': ['post-punk', 'new wave', 'alternative'],
    'black sabbath': ['heavy metal', 'doom metal', 'hard rock'],
  }

  for (const [artist, genres] of Object.entries(genreMap)) {
    if (lowerArtist.includes(artist)) {
      return genres
    }
  }

  return ['rock', 'pop']
}

export async function generateListingCopy(
  item: CollectionItem,
  channel: 'ebay' | 'discogs' | 'shopify',
  keywords: string[]
): Promise<{ title: string; subtitle?: string; description: string }> {
  const prompt = spark.llmPrompt`You are an expert vinyl record dealer creating optimized marketplace listings.

Item Details:
- Artist: ${item.artistName}
- Title: ${item.releaseTitle}
- Format: ${item.format}
- Year: ${item.year}
- Country: ${item.country}
- Catalog Number: ${item.catalogNumber || 'N/A'}
- Media Grade: ${item.condition.mediaGrade}
- Sleeve Grade: ${item.condition.sleeveGrade}
- Grading Standard: ${item.condition.gradingStandard}
- Notes: ${item.condition.gradingNotes || 'No additional notes'}

Channel: ${channel}
SEO Keywords: ${keywords.join(', ')}

Create a professional listing with:
1. A compelling, SEO-optimized title (max 80 chars for eBay, can be longer for others)
2. An optional subtitle with key details (only for eBay)
3. A detailed description that includes:
   - Opening hook about the album/artist
   - Pressing details (year, country, catalog number)
   - Condition description (media and sleeve, be specific)
   - Notable features or selling points
   - Grading standard used
   - Any defects or issues mentioned in notes
   - Professional closing

Make it engaging but accurate. Use keywords naturally. Be honest about condition.

Return as JSON with keys: title, subtitle (can be null), description`

  try {
    const response = await spark.llm(prompt, 'gpt-4o', true)
    const parsed = JSON.parse(response)
    
    return {
      title: parsed.title || generateFallbackTitle(item),
      subtitle: parsed.subtitle,
      description: parsed.description || generateFallbackDescription(item),
    }
  } catch (error) {
    console.error('LLM generation failed, using fallback:', error)
    return {
      title: generateFallbackTitle(item),
      subtitle: channel === 'ebay' ? `${item.condition.mediaGrade}/${item.condition.sleeveGrade} ${item.format} ${item.year}` : undefined,
      description: generateFallbackDescription(item),
    }
  }
}

function generateFallbackTitle(item: CollectionItem): string {
  const parts = [
    item.artistName,
    '-',
    item.releaseTitle,
    item.format,
  ]

  if (item.catalogNumber) {
    parts.push(item.catalogNumber)
  }

  parts.push(`${item.year}`)
  parts.push(`${item.condition.mediaGrade}/${item.condition.sleeveGrade}`)

  return parts.join(' ').substring(0, 80)
}

function generateFallbackDescription(item: CollectionItem): string {
  return `${item.artistName} - ${item.releaseTitle}

Format: ${item.format}
Year: ${item.year}
Country: ${item.country}
${item.catalogNumber ? `Catalog Number: ${item.catalogNumber}` : ''}

Condition:
Media: ${item.condition.mediaGrade} (${item.condition.gradingStandard} Standard)
Sleeve: ${item.condition.sleeveGrade} (${item.condition.gradingStandard} Standard)

${item.condition.gradingNotes ? `Notes: ${item.condition.gradingNotes}` : ''}

This record has been carefully graded using the ${item.condition.gradingStandard} grading standard. Please review the condition details before purchasing.

${item.notes ? `Additional Information:\n${item.notes}` : ''}

Shipping: We package all records with care using proper mailers and protection.

Thank you for your interest!`
}

export function suggestListingPrice(estimate: PriceEstimate, condition: MediaGrade): number {
  const conditionPremiums: Record<string, number> = {
    'M': 1.2,
    'NM': 1.1,
    'EX': 1.0,
    'VG+': 0.95,
    'VG': 0.85,
    'G': 0.7,
    'F': 0.5,
    'P': 0.3,
  }

  const premium = conditionPremiums[condition] || 1.0
  const basePrice = estimate.estimateMid * premium

  const marketingAdjustment = 1.15

  const suggestedPrice = basePrice * marketingAdjustment

  return Math.round(suggestedPrice * 100) / 100
}

export function generateEbayHTMLDescription(
  item: CollectionItem,
  description: string,
  hostedImages: ItemImage[]
): string {
  const imagesWithUrls = hostedImages.filter(img => img.imgbbUrl || img.imgbbDisplayUrl)
  
  const imageGalleryHTML = imagesWithUrls.length > 0 ? `
    <div style="margin: 20px 0; text-align: center;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; max-width: 800px; margin: 0 auto;">
        ${imagesWithUrls.map(img => `
          <div style="border: 1px solid #e0e0e0; padding: 5px; background: #fff;">
            <img src="${img.imgbbDisplayUrl || img.imgbbUrl}" alt="${img.type.replace('_', ' ')}" style="width: 100%; height: auto; display: block;" />
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #666; text-transform: capitalize;">${img.type.replace('_', ' ')}</p>
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''

  const conditionHTML = `
    <div style="background: #f9f9f9; border: 2px solid #333; padding: 15px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">Condition Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; font-weight: bold; width: 40%;">Media Grade:</td>
          <td style="padding: 8px;">${item.condition.mediaGrade}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Sleeve Grade:</td>
          <td style="padding: 8px;">${item.condition.sleeveGrade}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Grading Standard:</td>
          <td style="padding: 8px;">${item.condition.gradingStandard}</td>
        </tr>
        ${item.condition.gradingNotes ? `
        <tr>
          <td style="padding: 8px; font-weight: bold; vertical-align: top;">Notes:</td>
          <td style="padding: 8px;">${item.condition.gradingNotes}</td>
        </tr>
        ` : ''}
      </table>
    </div>
  `

  const recordDetailsHTML = `
    <div style="background: #fff; border: 1px solid #ddd; padding: 15px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">Record Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; font-weight: bold; width: 40%;">Artist:</td>
          <td style="padding: 8px;">${item.artistName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Title:</td>
          <td style="padding: 8px;">${item.releaseTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Format:</td>
          <td style="padding: 8px;">${item.format}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Year:</td>
          <td style="padding: 8px;">${item.year}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Country:</td>
          <td style="padding: 8px;">${item.country}</td>
        </tr>
        ${item.catalogNumber ? `
        <tr>
          <td style="padding: 8px; font-weight: bold;">Catalog Number:</td>
          <td style="padding: 8px;">${item.catalogNumber}</td>
        </tr>
        ` : ''}
      </table>
    </div>
  `

  const fullHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #333; margin-bottom: 20px; font-size: 24px; border-bottom: 3px solid #333; padding-bottom: 10px;">
        ${item.artistName} - ${item.releaseTitle}
      </h2>
      
      ${imageGalleryHTML}
      
      <div style="margin: 20px 0; line-height: 1.6;">
        ${description.split('\n').map(para => para.trim() ? `<p style="margin: 10px 0;">${para}</p>` : '').join('')}
      </div>
      
      ${recordDetailsHTML}
      
      ${conditionHTML}
      
      <div style="background: #fffbf0; border: 1px solid #ffd700; padding: 15px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333; font-size: 14px;">📦 Shipping Information</h3>
        <p style="margin: 5px 0; font-size: 13px;">All vinyl records are shipped with care using proper record mailers and protective packaging to ensure safe delivery.</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">Thank you for your interest in this record. Please feel free to ask any questions!</p>
      </div>
    </div>
  `

  return fullHTML
}

export async function generateBulkListings(
  items: CollectionItem[],
  channel: 'ebay' | 'discogs' | 'shopify'
): Promise<Array<{ itemId: string; title: string; description: string; price: number }>> {
  const listings = []

  for (const item of items) {
    const keywords = await generateSEOKeywords(item, channel)
    const copy = await generateListingCopy(item, channel, keywords)
    const estimate = { estimateMid: 50, currency: item.purchaseCurrency } as PriceEstimate
    const price = suggestListingPrice(estimate, item.condition.mediaGrade)

    listings.push({
      itemId: item.id,
      title: copy.title,
      description: copy.description,
      price,
    })
  }

  return listings
}

export interface EbayListingPackage {
  title: string
  subtitle?: string
  htmlDescription: string
  plainDescription: string
  price: number
  currency: string
  imageUrls: string[]
  seoKeywords: string[]
  condition: {
    media: string
    sleeve: string
  }
  requiresImgBBUpload: boolean
  missingImageCount: number
}

export async function generateEbayListingPackage(
  item: CollectionItem,
  images: ItemImage[],
  channel: 'ebay' | 'discogs' | 'shopify' = 'ebay'
): Promise<EbayListingPackage> {
  const keywords = await generateSEOKeywords(item, channel)
  const copy = await generateListingCopy(item, channel, keywords)
  const estimate = { estimateMid: 50, currency: item.purchaseCurrency } as PriceEstimate
  const price = suggestListingPrice(estimate, item.condition.mediaGrade)

  const hostedImages = images.filter(img => img.imgbbUrl || img.imgbbDisplayUrl)
  const unhostedImages = images.filter(img => !img.imgbbUrl && !img.imgbbDisplayUrl)
  
  const imageUrls = hostedImages.map(img => img.imgbbDisplayUrl || img.imgbbUrl || '').filter(Boolean)
  
  const htmlDescription = generateEbayHTMLDescription(item, copy.description, hostedImages)

  return {
    title: copy.title,
    subtitle: copy.subtitle,
    htmlDescription,
    plainDescription: copy.description,
    price,
    currency: item.purchaseCurrency,
    imageUrls,
    seoKeywords: keywords,
    condition: {
      media: item.condition.mediaGrade,
      sleeve: item.condition.sleeveGrade
    },
    requiresImgBBUpload: unhostedImages.length > 0,
    missingImageCount: unhostedImages.length
  }
}
