import { 
  SolanaNFTMetadata, 
  NFTMintConfig, 
  MintedNFT, 
  SolanaNetwork,
  buildNFTMetadata,
  NFT_SYMBOL 
} from './solana-nft'
import { CollectionItem } from './types'

export interface MintNFTResult {
  success: boolean
  mintAddress?: string
  transactionSignature?: string
  metadataUri?: string
  error?: string
}

export async function prepareNFTMetadataFromItem(
  item: CollectionItem,
  walletAddress: string
): Promise<NFTMintConfig> {
  const itemImageUrl = item.images?.[0] || 'https://via.placeholder.com/600x600?text=No+Image'
  
  const attributes = [
    { trait_type: 'Artist', value: item.artistName },
    { trait_type: 'Album', value: item.releaseTitle },
    { trait_type: 'Format', value: item.format },
    { trait_type: 'Year', value: item.year },
    { trait_type: 'Country', value: item.country },
    { trait_type: 'Media Grade', value: item.condition.mediaGrade },
    { trait_type: 'Sleeve Grade', value: item.condition.sleeveGrade },
    { trait_type: 'Grading Standard', value: item.condition.gradingStandard },
  ]

  if (item.catalogNumber) {
    attributes.push({ trait_type: 'Catalog Number', value: item.catalogNumber })
  }

  if (item.purchasePrice && item.purchaseCurrency) {
    attributes.push({ 
      trait_type: 'Purchase Price', 
      value: `${item.purchasePrice} ${item.purchaseCurrency}` 
    })
  }

  if (item.acquisitionDate) {
    attributes.push({ trait_type: 'Acquisition Date', value: item.acquisitionDate })
  }

  const name = `${item.artistName} - ${item.releaseTitle} (${item.year})`
  const description = `
${name}

Format: ${item.format}
Country: ${item.country}
${item.catalogNumber ? `Catalog Number: ${item.catalogNumber}` : ''}

Condition:
Media: ${item.condition.mediaGrade} (${item.condition.gradingStandard})
Sleeve: ${item.condition.sleeveGrade} (${item.condition.gradingStandard})

${item.notes ? `Notes: ${item.notes}` : ''}

This NFT represents a verified physical vinyl record in the VinylVault collection, providing on-chain provenance and authenticity tracking.
  `.trim()

  return {
    itemId: item.id,
    name: name.substring(0, 32),
    symbol: NFT_SYMBOL,
    description,
    imageUrl: itemImageUrl,
    sellerFeeBasisPoints: 1000,
    creators: [
      {
        address: walletAddress,
        share: 100,
      },
    ],
    attributes,
  }
}

export async function uploadMetadataToIPFS(metadata: SolanaNFTMetadata): Promise<string> {
  const metadataJson = JSON.stringify(metadata, null, 2)
  const blob = new Blob([metadataJson], { type: 'application/json' })
  const file = new File([blob], 'metadata.json', { type: 'application/json' })
  
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('https://api.nft.storage/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_NFT_STORAGE_KEY || ''}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`IPFS upload failed: ${response.statusText}`)
  }

  const data = await response.json()
  return `https://ipfs.io/ipfs/${data.value.cid}`
}

export async function simulateMintNFT(
  config: NFTMintConfig,
  walletAddress: string,
  network: SolanaNetwork = 'devnet'
): Promise<MintNFTResult> {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const metadata = buildNFTMetadata(config)
    
    const mockMetadataUri = `https://arweave.net/mock-${Date.now()}`
    const mockMintAddress = `${walletAddress.substring(0, 8)}...${Math.random().toString(36).substring(2, 10)}`
    const mockSignature = `mock-sig-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    return {
      success: true,
      mintAddress: mockMintAddress,
      transactionSignature: mockSignature,
      metadataUri: mockMetadataUri,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during NFT minting',
    }
  }
}

export function buildMintedNFTRecord(
  mintResult: MintNFTResult,
  config: NFTMintConfig,
  walletAddress: string,
  network: SolanaNetwork
): MintedNFT {
  if (!mintResult.success || !mintResult.mintAddress || !mintResult.transactionSignature || !mintResult.metadataUri) {
    throw new Error('Cannot build NFT record from failed mint result')
  }

  return {
    id: `nft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    itemId: config.itemId,
    mintAddress: mintResult.mintAddress,
    metadataUri: mintResult.metadataUri,
    transactionSignature: mintResult.transactionSignature,
    network,
    mintedAt: new Date().toISOString(),
    ownerAddress: walletAddress,
    sellerFeeBasisPoints: config.sellerFeeBasisPoints,
  }
}

export function getRoyaltyPercentage(sellerFeeBasisPoints: number): number {
  return sellerFeeBasisPoints / 100
}

export function formatRoyaltyBadge(sellerFeeBasisPoints: number): string {
  const percentage = getRoyaltyPercentage(sellerFeeBasisPoints)
  return `${percentage}% Royalty`
}
