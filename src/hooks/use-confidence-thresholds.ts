import { useKV } from '@github/spark/hooks'

interface ConfidenceThresholds {
  imageClassification: number
  pressingIdentification: number
  conditionGrading: number
  bargainDetection: number
}

const defaultThresholds: ConfidenceThresholds = {
  imageClassification: 75,
  pressingIdentification: 70,
  conditionGrading: 65,
  bargainDetection: 80,
}

export function useConfidenceThresholds() {
  const [thresholds] = useKV<ConfidenceThresholds>(
    'vinyl-vault-confidence-thresholds',
    defaultThresholds
  )

  const checkConfidence = (type: keyof ConfidenceThresholds, score: number): boolean => {
    const threshold = thresholds?.[type] ?? defaultThresholds[type]
    return score >= threshold
  }

  const getThreshold = (type: keyof ConfidenceThresholds): number => {
    return thresholds?.[type] ?? defaultThresholds[type]
  }

  return {
    thresholds: thresholds ?? defaultThresholds,
    checkConfidence,
    getThreshold,
  }
}
