export interface SolanaNFTMetadata {
  name: string
  symbol: string
  description: string
  image: string
  external_url?: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
  properties: {
    category: 'image'
    files: Array<{
      uri: string
      type: string
    }>
    creators: Array<{
      address: string
      share: number
    }>
  }
}

export interface NFTMintConfig {
  itemId: string
  name: string
  symbol: string
  description: string
  imageUrl: string
  sellerFeeBasisPoints: number
  creators: Array<{
    address: string
    share: number
  }>
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
}

export interface MintedNFT {
  id: string
  itemId: string
  mintAddress: string
  metadataUri: string
  transactionSignature: string
  network: 'mainnet-beta' | 'devnet' | 'testnet'
  mintedAt: string
  ownerAddress: string
  sellerFeeBasisPoints: number
}

export interface NFTTransfer {
  id: string
  nftId: string
  fromAddress: string
  toAddress: string
  transactionSignature: string
  transferredAt: string
  salePrice?: number
  currency?: string
}

export const SOLANA_NETWORKS = {
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  'devnet': 'https://api.devnet.solana.com',
  'testnet': 'https://api.testnet.solana.com',
} as const

export type SolanaNetwork = keyof typeof SOLANA_NETWORKS

export interface SolanaConfig {
  network: SolanaNetwork
  rpcEndpoint?: string
}

export const DEFAULT_SOLANA_CONFIG: SolanaConfig = {
  network: 'devnet',
}

export const NFT_SYMBOL = 'VNYL'

export function buildNFTMetadata(config: NFTMintConfig): SolanaNFTMetadata {
  return {
    name: config.name,
    symbol: config.symbol,
    description: config.description,
    image: config.imageUrl,
    external_url: `https://vinylaysis.app/items/${config.itemId}`,
    attributes: config.attributes,
    properties: {
      category: 'image',
      files: [
        {
          uri: config.imageUrl,
          type: 'image/jpeg',
        },
      ],
      creators: config.creators,
    },
  }
}

export function getExplorerUrl(signature: string, network: SolanaNetwork): string {
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`
  return `https://explorer.solana.com/tx/${signature}${cluster}`
}

export function getAddressExplorerUrl(address: string, network: SolanaNetwork): string {
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`
  return `https://explorer.solana.com/address/${address}${cluster}`
}

export function validateSolanaAddress(address: string): boolean {
  try {
    const decoded = atob(address)
    return decoded.length === 32
  } catch {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
  }
}
