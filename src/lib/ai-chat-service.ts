import { CollectionItem } from './types'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  itemContext?: string
  suggestedCorrection?: ChatCorrection
  correctionApplied?: boolean
}

export interface ChatCorrection {
  field: string
  originalValue: string
  suggestedValue: string
  reasoning: string
  confidence: number
}

export interface LearningData {
  id: string
  question: string
  originalAnswer: string
  userCorrection: string
  context: {
    itemId?: string
    artistName?: string
    releaseTitle?: string
  }
  timestamp: string
  applied: boolean
}

export async function askAboutRecord(
  question: string,
  item: CollectionItem,
  allItems: CollectionItem[],
  conversationHistory: ChatMessage[]
): Promise<{ answer: string; suggestedCorrections?: ChatCorrection[] }> {
  const contextPrompt = spark.llmPrompt`You are a vinyl record expert assistant for VinylVault, a professional record collection management system.

Context about this record:
- Artist: ${item.artistName}
- Title: ${item.releaseTitle}
- Format: ${item.format}
- Year: ${item.year}
- Country: ${item.country}
- Catalog Number: ${item.catalogNumber || 'Not specified'}
- Condition: Media ${item.condition.mediaGrade} / Sleeve ${item.condition.sleeveGrade}
- Purchase Price: ${item.purchasePrice ? `${item.purchaseCurrency} ${item.purchasePrice}` : 'Not recorded'}
- Notes: ${item.notes || 'None'}

User's question: ${question}

Previous conversation context:
${conversationHistory.slice(-4).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Provide a helpful, knowledgeable answer about this record. If you notice any potential data quality issues (incorrect artist name spelling, wrong year, unusual catalog number format, etc.), mention them naturally in your response.

Format your response as JSON with:
{
  "answer": "Your detailed answer here",
  "suggestedCorrections": [
    {
      "field": "artistName",
      "originalValue": "current value",
      "suggestedValue": "corrected value",
      "reasoning": "why this correction is suggested",
      "confidence": 0.85
    }
  ]
}

Only include suggestedCorrections if you notice clear errors. Keep the answer conversational and informative.`

  try {
    const response = await spark.llm(contextPrompt, 'gpt-4o', true)
    const parsed = JSON.parse(response)
    
    return {
      answer: parsed.answer || response,
      suggestedCorrections: parsed.suggestedCorrections || []
    }
  } catch (error) {
    console.error('AI chat error:', error)
    return {
      answer: "I'm having trouble processing that question right now. Please try again.",
      suggestedCorrections: []
    }
  }
}

export async function askGeneralQuestion(
  question: string,
  allItems: CollectionItem[],
  conversationHistory: ChatMessage[]
): Promise<string> {
  const stats = {
    totalRecords: allItems.length,
    formats: allItems.reduce((acc, item) => {
      acc[item.format] = (acc[item.format] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    topArtists: Object.entries(
      allItems.reduce((acc, item) => {
        acc[item.artistName] = (acc[item.artistName] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([artist, count]) => `${artist} (${count})`),
  }

  const contextPrompt = spark.llmPrompt`You are a vinyl record expert assistant for VinylVault.

User's collection overview:
- Total records: ${stats.totalRecords}
- Formats: ${Object.entries(stats.formats).map(([f, c]) => `${f}: ${c}`).join(', ')}
- Top artists: ${stats.topArtists.join(', ')}

Previous conversation:
${conversationHistory.slice(-4).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User's question: ${question}

Provide a helpful, knowledgeable answer about vinyl records, collecting, grading, or their collection. Be conversational and informative.`

  try {
    const response = await spark.llm(contextPrompt, 'gpt-4o', false)
    return response
  } catch (error) {
    console.error('AI chat error:', error)
    return "I'm having trouble processing that question right now. Please try again."
  }
}

export async function generateRecordInsights(
  item: CollectionItem,
  learningData: LearningData[]
): Promise<string> {
  const relevantLearning = learningData.filter(
    ld => ld.context.artistName === item.artistName || ld.context.releaseTitle === item.releaseTitle
  )

  const contextPrompt = spark.llmPrompt`You are analyzing a vinyl record in VinylVault.

Record details:
- Artist: ${item.artistName}
- Title: ${item.releaseTitle}
- Format: ${item.format}
- Year: ${item.year}
- Country: ${item.country}
- Catalog Number: ${item.catalogNumber || 'Not specified'}
- Condition: Media ${item.condition.mediaGrade} / Sleeve ${item.condition.sleeveGrade}
- Purchase Price: ${item.purchasePrice ? `${item.purchaseCurrency} ${item.purchasePrice}` : 'Not recorded'}

${relevantLearning.length > 0 ? `
Previous learning from user feedback about this artist/release:
${relevantLearning.map(ld => `- Q: ${ld.question}\n  Original: ${ld.originalAnswer}\n  Correction: ${ld.userCorrection}`).join('\n')}
` : ''}

Provide 3-5 interesting insights about this record, such as:
- Historical significance
- Pressing variations to watch for
- Market trends
- Collecting tips
- Notable tracks

Keep it concise and relevant to collectors.`

  try {
    const response = await spark.llm(contextPrompt, 'gpt-4o-mini', false)
    return response
  } catch (error) {
    console.error('Insights generation error:', error)
    return 'Unable to generate insights at this time.'
  }
}
