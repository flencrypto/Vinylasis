import { BarcodeScanResult } from '@/components/BarcodeScannerWidget'

export async function lookupBarcode(barcode: string): Promise<BarcodeScanResult | null> {
  const prompt = spark.llmPrompt`You are a vinyl record and music product barcode lookup assistant. Given a barcode (UPC/EAN), identify the music release.

Barcode: ${barcode}

Search your knowledge base for this barcode and identify the corresponding vinyl record, CD, or music release. Return detailed information in JSON format.

If the barcode matches a known release, return:
{
  "found": true,
  "barcode": "${barcode}",
  "artist": "Artist name",
  "title": "Album or release title",
  "year": 2023,
  "format": "LP|12\"|7\"|CD|Cassette",
  "label": "Record label name",
  "country": "Country code (US, UK, etc)",
  "catalogNumber": "Catalog number if known",
  "confidence": 0.95
}

If the barcode is NOT found or cannot be identified:
{
  "found": false,
  "barcode": "${barcode}",
  "confidence": 0
}

Return ONLY valid JSON with no additional explanation.`

  try {
    const response = await spark.llm(prompt, 'gpt-4o', true)
    const data = JSON.parse(response)
    
    if (!data.found) {
      return null
    }
    
    return {
      barcode: data.barcode,
      artist: data.artist,
      title: data.title,
      year: data.year,
      format: data.format,
      label: data.label,
      country: data.country,
      catalogNumber: data.catalogNumber,
      confidence: data.confidence
    }
  } catch (error) {
    console.error('Barcode lookup failed:', error)
    return null
  }
}
