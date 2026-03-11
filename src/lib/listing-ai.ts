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
    <div style="margin: 30px 0; text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px;">
      <h3 style="margin: 0 0 20px 0; color: #222; font-size: 20px; font-weight: 600; text-align: center;">📸 Photo Gallery</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; max-width: 900px; margin: 0 auto;">
        ${imagesWithUrls.map((img, idx) => `
          <div style="border: 2px solid #ddd; border-radius: 8px; padding: 10px; background: #fff; transition: transform 0.2s;">
            <img src="${img.imgbbDisplayUrl || img.imgbbUrl}" alt="${img.type.replace('_', ' ')} - Image ${idx + 1}" style="width: 100%; height: auto; display: block; border-radius: 4px; max-height: 300px; object-fit: contain;" />
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #666; text-transform: capitalize; font-weight: 500;">${img.type.replace(/_/g, ' ')}</p>
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''

  const conditionHTML = `
    <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border: 3px solid #2c3e50; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 22px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 1px;">🎵 Condition Details</h3>
      <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden;">
        <tr style="background: #34495e;">
          <td style="padding: 15px; font-weight: 700; width: 40%; color: #fff; border-bottom: 2px solid #2c3e50;">Media Grade:</td>
          <td style="padding: 15px; color: #fff; font-weight: 600; border-bottom: 2px solid #2c3e50;">${item.condition.mediaGrade}</td>
        </tr>
        <tr style="background: #ecf0f1;">
          <td style="padding: 15px; font-weight: 700; border-bottom: 1px solid #bdc3c7;">Sleeve Grade:</td>
          <td style="padding: 15px; border-bottom: 1px solid #bdc3c7;">${item.condition.sleeveGrade}</td>
        </tr>
        <tr style="background: #fff;">
          <td style="padding: 15px; font-weight: 700; border-bottom: 1px solid #bdc3c7;">Grading Standard:</td>
          <td style="padding: 15px; border-bottom: 1px solid #bdc3c7;">${item.condition.gradingStandard}</td>
        </tr>
        ${item.condition.gradingNotes ? `
        <tr style="background: #ecf0f1;">
          <td style="padding: 15px; font-weight: 700; vertical-align: top;">Grading Notes:</td>
          <td style="padding: 15px; line-height: 1.6;">${item.condition.gradingNotes}</td>
        </tr>
        ` : ''}
      </table>
    </div>
  `

  const recordDetailsHTML = `
    <div style="background: #fff; border: 2px solid #3498db; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 4px 6px rgba(52,152,219,0.2);">
      <h3 style="margin: 0 0 20px 0; color: #3498db; font-size: 22px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 1px;">💿 Record Information</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #ecf0f1;">
          <td style="padding: 15px; font-weight: 700; width: 40%; border-bottom: 1px solid #bdc3c7;">Artist:</td>
          <td style="padding: 15px; border-bottom: 1px solid #bdc3c7; font-size: 16px;">${item.artistName}</td>
        </tr>
        <tr style="background: #fff;">
          <td style="padding: 15px; font-weight: 700; border-bottom: 1px solid #bdc3c7;">Title:</td>
          <td style="padding: 15px; border-bottom: 1px solid #bdc3c7; font-size: 16px;">${item.releaseTitle}</td>
        </tr>
        <tr style="background: #ecf0f1;">
          <td style="padding: 15px; font-weight: 700; border-bottom: 1px solid #bdc3c7;">Format:</td>
          <td style="padding: 15px; border-bottom: 1px solid #bdc3c7;">${item.format}</td>
        </tr>
        <tr style="background: #fff;">
          <td style="padding: 15px; font-weight: 700; border-bottom: 1px solid #bdc3c7;">Year:</td>
          <td style="padding: 15px; border-bottom: 1px solid #bdc3c7;">${item.year}</td>
        </tr>
        <tr style="background: #ecf0f1;">
          <td style="padding: 15px; font-weight: 700; border-bottom: 1px solid #bdc3c7;">Country:</td>
          <td style="padding: 15px; border-bottom: 1px solid #bdc3c7;">${item.country}</td>
        </tr>
        ${item.catalogNumber ? `
        <tr style="background: #fff;">
          <td style="padding: 15px; font-weight: 700;">Catalog Number:</td>
          <td style="padding: 15px; font-family: 'Courier New', monospace; background: #f8f9fa; border-radius: 4px;">${item.catalogNumber}</td>
        </tr>
        ` : ''}
      </table>
    </div>
  `

  const fullHTML = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 30px 20px; color: #2c3e50; background: #fff; line-height: 1.8;">
      
      <div style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 40px 20px; border-radius: 12px; margin-bottom: 40px; box-shadow: 0 6px 12px rgba(0,0,0,0.15);">
        <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
          ${item.artistName}
        </h1>
        <h2 style="margin: 0; font-size: 24px; font-weight: 400; opacity: 0.95;">
          ${item.releaseTitle}
        </h2>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid rgba(255,255,255,0.3);">
          <span style="display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 14px; margin: 0 5px;">
            ${item.format}
          </span>
          <span style="display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 14px; margin: 0 5px;">
            ${item.year}
          </span>
          <span style="display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 14px; margin: 0 5px;">
            ${item.country}
          </span>
        </div>
      </div>
      
      ${imageGalleryHTML}
      
      <div style="margin: 40px 0; padding: 30px; background: #f8f9fa; border-left: 5px solid #3498db; border-radius: 8px;">
        <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px; font-weight: 600;">📝 Description</h3>
        ${description.split('\n\n').map(para => para.trim() ? `<p style="margin: 15px 0; font-size: 15px; line-height: 1.8; color: #34495e;">${para}</p>` : '').join('')}
      </div>
      
      ${recordDetailsHTML}
      
      ${conditionHTML}
      
      <div style="background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); border: 2px solid #e17055; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 18px; font-weight: 700; text-align: center;">📦 Shipping & Handling</h3>
        <p style="margin: 10px 0; font-size: 15px; text-align: center; color: #2c3e50; line-height: 1.6;">
          <strong>All vinyl records are carefully packaged</strong> using professional record mailers, protective sleeves, and cardboard stiffeners to ensure safe delivery. We ship within 1-2 business days of receiving payment.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 50px; padding-top: 30px; border-top: 3px solid #ecf0f1;">
        <p style="color: #7f8c8d; font-size: 14px; margin: 5px 0;">
          ✨ Thank you for your interest in this record! ✨
        </p>
        <p style="color: #95a5a6; font-size: 13px; margin: 10px 0;">
          Please don't hesitate to ask if you have any questions.
        </p>
        <div style="margin-top: 20px; padding: 15px; background: #ecf0f1; border-radius: 8px; display: inline-block;">
          <p style="margin: 0; color: #2c3e50; font-weight: 600; font-size: 14px;">
            🎧 Happy collecting! 🎧
          </p>
        </div>
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
