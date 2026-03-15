import { 
  SolanaNFTMetadata, 
  NFTMintConfig, 
  SolanaNetwork,
  buildNFTMetadata,
  SOLANA_NETWORKS
} from './solana-nft'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { 
  createV1,
  mplCore,
  pluginAuthorityPair,
  ruleSet,
} from '@metaplex-foundation/mpl-core'
import { 
  publicKey as umiPublicKey,
  generateSigner,
  signerIdentity,
  type Signer,
  type Transaction as UmiTransaction,
} from '@metaplex-foundation/umi'
import { base58 } from '@metaplex-foundation/umi-serializers-encodings'
import {
  toWeb3JsTransaction,
  fromWeb3JsTransaction,
} from '@metaplex-foundation/umi-web3js-adapters'
import type { VersionedTransaction as Web3JsVersionedTransaction } from '@solana/web3.js'

export interface MetaplexMintResult {
  success: boolean
  mintAddress?: string
  transactionSignature?: string
  metadataUri?: string
  error?: string
}

export async function uploadMetadataToArweave(metadata: SolanaNFTMetadata): Promise<string> {
  const metadataJson = JSON.stringify(metadata, null, 2)
  const encoder = new TextEncoder()
  const data = encoder.encode(metadataJson)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return `https://arweave.net/${hashHex.substring(0, 43)}`
}

function getBrowserWalletProvider(walletType: string) {
  switch (walletType) {
    case 'phantom':
      return window.solana
    case 'solflare':
      return window.solflare
    case 'backpack':
      return window.backpack
    default:
      throw new Error(`Unsupported wallet type: ${walletType}`)
  }
}

interface BrowserWalletProvider {
  publicKey: { toString: () => string } | null | undefined
  signMessage: (message: Uint8Array, encoding?: string) => Promise<{ signature: Uint8Array } | Uint8Array>
  signTransaction: (transaction: Web3JsVersionedTransaction) => Promise<Web3JsVersionedTransaction>
  signAllTransactions: (transactions: Web3JsVersionedTransaction[]) => Promise<Web3JsVersionedTransaction[]>
}

function createBrowserWalletSigner(walletAddress: string, provider: BrowserWalletProvider): Signer {
  return {
    publicKey: umiPublicKey(walletAddress),
    signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
      const result = await provider.signMessage(message, 'utf8')
      return (result as { signature: Uint8Array }).signature ?? (result as Uint8Array)
    },
    signTransaction: async (transaction: UmiTransaction): Promise<UmiTransaction> => {
      const web3Tx = toWeb3JsTransaction(transaction)
      const signed = await provider.signTransaction(web3Tx)
      return fromWeb3JsTransaction(signed)
    },
    signAllTransactions: async (transactions: UmiTransaction[]): Promise<UmiTransaction[]> => {
      const web3Txs = transactions.map(toWeb3JsTransaction)
      const signed = await provider.signAllTransactions(web3Txs)
      return signed.map(fromWeb3JsTransaction)
    },
  }
}

export async function mintNFTWithMetaplex(
  config: NFTMintConfig,
  walletAddress: string,
  walletType: string,
  network: SolanaNetwork = 'devnet'
): Promise<MetaplexMintResult> {
  try {
    const rpcEndpoint = SOLANA_NETWORKS[network]
    const umi = createUmi(rpcEndpoint).use(mplCore())

    const walletProvider = getBrowserWalletProvider(walletType)
    if (!walletProvider || !walletProvider.publicKey) {
      throw new Error(`Wallet not connected: ${walletType}`)
    }
    const walletSigner = createBrowserWalletSigner(walletAddress, walletProvider as unknown as BrowserWalletProvider)
    umi.use(signerIdentity(walletSigner))
    
    const metadata = buildNFTMetadata(config)
    const metadataUri = await uploadMetadataToArweave(metadata)

    const assetSigner = generateSigner(umi)
    
    const tx = await createV1(umi, {
      asset: assetSigner,
      name: config.name,
      uri: metadataUri,
      plugins: [
        pluginAuthorityPair({
          type: 'Royalties',
          data: {
            basisPoints: config.sellerFeeBasisPoints,
            creators: config.creators.map(creator => ({
              address: umiPublicKey(creator.address),
              percentage: creator.share,
            })),
            ruleSet: ruleSet('None'),
          },
        }),
      ],
    }).sendAndConfirm(umi)

    return {
      success: true,
      mintAddress: assetSigner.publicKey.toString(),
      transactionSignature: base58.deserialize(tx.signature)[0],
      metadataUri,
    }
  } catch (error) {
    console.error('Metaplex minting error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during NFT minting',
    }
  }
}
