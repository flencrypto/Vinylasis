# Marketplace, Web3 Wallet & NFT Minting Configuration Guide

## Overview

This guide covers configuration and setup for three critical VinylVault features:
1. **Marketplace Configuration** - eBay and Discogs API integration for live bargain scanning
2. **Web3 Wallet Connection** - Solana wallet integration (Phantom, Solflare, Backpack)
3. **NFT Minting** - Mint vinyl records as Solana NFTs with Metaplex Core

---

## 1. Marketplace Configuration

### Current Implementation Status
✅ **Completed:**
- Settings UI for eBay App ID and Discogs tokens
- Connection testing for both marketplaces
- Marketplace scanner service with real API integration
- Configuration validation and persistence
- Error handling and user feedback

### Configuration Steps

#### eBay Setup
1. Navigate to **Settings** tab
2. Scroll to **Marketplace Configuration**
3. Enable **eBay marketplace scanning**
4. Enter your **eBay App ID** (Client ID)
   - Get this from [eBay Developers](https://developer.ebay.com/)
   - Create an application
   - Copy the "App ID (Client ID)" from your application dashboard
5. Optionally set **Marketplace ID** (defaults to EBAY-US)
   - Examples: `EBAY-GB`, `EBAY-DE`, `EBAY-AU`
6. Click **Test eBay Connection** to verify
7. Click **Save Settings**

#### Discogs Setup
1. Navigate to **Settings** tab
2. Scroll to **Marketplace Configuration**
3. Enable **Discogs marketplace scanning**
4. **Option A - Personal Access Token (Recommended):**
   - Visit [Discogs Developer Settings](https://www.discogs.com/settings/developers)
   - Generate a Personal Access Token
   - Paste token in **Personal Access Token** field
5. **Option B - OAuth (Advanced):**
   - Create an application at Discogs
   - Enter **Consumer Key** and **Consumer Secret**
6. Click **Test Discogs Connection** to verify
7. Click **Save Settings**

### Using Marketplace Integration

#### Bargains View
1. Navigate to **Bargains** tab
2. Click **Marketplace Settings** to configure (if not done)
3. Add watchlist items in the **Watchlist** tab
4. Click **Scan Market** to search live listings
5. System queries both eBay and Discogs APIs
6. AI analyzes listings for bargain signals
7. Results appear as **Bargain Cards** with:
   - Bargain score (0-100)
   - Estimated upside
   - Signal reasons (underpriced, misdescribed, rare variant)
   - Link to original listing

#### Watchlist Tab
1. Click **Add Watch** button
2. Select watch type:
   - **Artist**: Monitor all releases by artist
   - **Release**: Specific album/single
   - **Pressing**: Specific pressing variant
   - **Free Text**: Custom search query
3. Set optional target price
4. Enable notifications
5. System will scan marketplaces when you click "Scan Market" or on schedule

###Files To Review
- `/src/components/MarketplaceSettingsDialog.tsx` - Configuration UI
- `/src/lib/marketplace-scanner.ts` - Scanner service
- `/src/lib/marketplace-ebay.ts` - eBay Finding API integration
- `/src/lib/marketplace-discogs.ts` - Discogs Marketplace API integration

---

## 2. Web3 Wallet Connection

### Current Implementation Status
✅ **Completed:**
- Multi-wallet support (Phantom, Solflare, Backpack)
- Auto-detection of installed wallets
- Connection/disconnection flows
- Session persistence via localStorage
- Auto-reconnection on page reload
- Event listeners for account changes
- WalletConnect component UI

### Supported Wallets

| Wallet | Network | Installation |
|--------|---------|--------------|
| **Phantom** | Solana | [phantom.app](https://phantom.app/) |
| **Solflare** | Solana | [solflare.com](https://solflare.com/) |
| **Backpack** | Solana | [backpack.app](https://backpack.app/) |

### Configuration Steps

#### For Users
1. Install one of the supported Solana wallets as a browser extension
2. Create/import a wallet account
3. Switch network to **Solana Devnet** (for testing)
4. In VinylVault, navigate to **NFTs** tab
5. Click **Connect Wallet** button
6. Dialog shows available wallets
7. Click your installed wallet
8. Approve connection in wallet popup
9. Wallet address appears in header

#### Wallet Persistence
- Connection state saved to `localStorage` under key `vinylvault_wallet`
- Auto-reconnects on page reload if wallet still connected
- Disconnects automatically if wallet extension disconnects

#### Handling Multiple Devices
- Wallet connection is per-browser/device
- Users must reconnect on each device
- NFT minting history synced via `useKV` (browser-based key-value store)

### Code Integration

#### Using the Wallet Hook
```typescript
import { useWallet } from '@/hooks/use-wallet'

function MyComponent() {
  const { wallet, isConnected, connect, disconnect } = useWallet()
  
  if (!isConnected) {
    return <WalletConnect />
  }
  
  return (
    <div>
      <p>Connected: {wallet?.publicKey}</p>
      <p>Wallet Type: {wallet?.walletType}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  )
}
```

#### WalletConnect Component
```typescript
import { WalletConnect } from '@/components/WalletConnect'

// Renders connect button when disconnected
// Renders wallet info + controls when connected
<WalletConnect className="w-full sm:w-auto" />
```

### Files To Review
- `/src/hooks/use-wallet.ts` - Wallet state management hook
- `/src/components/WalletConnect.tsx` - Wallet UI component
- Global wallet types in `use-wallet.ts` for `window.solana`, `window.solflare`, `window.backpack`

---

## 3. NFT Minting

### Current Implementation Status
✅ **Completed:**
- NFT metadata generation from CollectionItem
- Simulated minting workflow (devnet simulation)
- Minted NFT storage and tracking
- NFT gallery view
- Transaction history
- Batch minting dialog structure
- Integration with Metaplex NFT standards

⚠️ **In Progress:**
- Full NFT View UI implementation
- NFTCard component
- NFTTransactionHistoryDialog component
- BatchNFTMintDialog component
- Actual Solana blockchain integration (currently simulated)

### Minting Architecture

#### NFT Metadata Structure
Each vinyl record is converted to NFT metadata following Metaplex standards:

```typescript
{
  name: "Artist Name - Album Title",
  symbol: "VNYL",
  description: "Physical vinyl record...",
  image: "[cover image URL]",
  external_url: "https://vinylvault.app/items/[id]",
  attributes: [
    { trait_type: "Artist", value: "Artist Name" },
    { trait_type: "Album", value: "Album Title" },
    { trait_type: "Format", value: "LP" },
    { trait_type: "Year", value: "1975" },
    { trait_type: "Country", value: "UK" },
    { trait_type: "Media Grade", value: "NM" },
    { trait_type: "Sleeve Grade", value: "EX" },
    { trait_type: "Catalog Number", value: "ABC-123" }
  ],
  properties: {
    category: "image",
    files: [{ uri: "[image]", type: "image/jpeg" }],
    creators: [{ address: "[wallet]", share: 100 }]
  }
}
```

#### Royalty Configuration
- Default: **10% (1000 basis points)**
- Configurable per-mint: 0-10% (0-1000 basis points)
- Royalties paid on secondary NFT sales
- Creator receives percentage of resale price

#### Minting Workflow
1. User selects vinyl item from collection
2. Clicks "Mint as NFT" button
3. MintNFTDialog opens showing:
   - NFT preview with metadata
   - Network selection (devnet/mainnet)
   - Royalty percentage slider
   - Estimated minting cost
4. User confirms mint
5. System:
   - Prepares NFT metadata from item
   - (In production) Uploads metadata to decentralized storage (Arweave/IPFS)
   - (In production) Calls Solana program to mint NFT
   - Records minted NFT in local storage
6. NFT appears in NFT Gallery

### NFT View Features

#### Gallery Tab
- Grid display of all minted NFTs
- Each card shows:
  - Album cover image
  - Artist - Title
  - Mint address (truncated)
  - Network badge (Devnet/Mainnet)
  - View transaction button
  - Quick actions (view on explorer, share)

#### History Tab
- Chronological list of minting transactions
- Transaction details:
  - Mint address
  - Transaction signature
  - Timestamp
  - Network
  - Link to Solana Explorer

#### Stats Cards
- **Total Minted**: Count of NFTs
- **Collection Value**: Sum of estimated values
- **Network**: Active network (Devnet/Mainnet)
- **Wallet**: Connected wallet address

### Batch Minting
-Allow minting multiple records at once
- Select unminted items from collection
- Configure royalties for all
- Mint sequentially with progress tracking
- Error handling for failed mints

### Network Configuration

#### Devnet (Current Default)
- **Purpose**: Testing and development
- **Cost**: Free (devnet SOL from faucet)
- **Explorer**: `https://explorer.solana.com/address/[address]?cluster=devnet`
- **RPC**: `https://api.devnet.solana.com`
- **Notes**: NFTs have no real value, can be minted freely

#### Mainnet (Production)
- **Purpose**: Real NFTs with value
- **Cost**: Transaction fees in SOL (~0.00001-0.0001 SOL per mint)
- **Explorer**: `https://explorer.solana.com/address/[address]`
- **RPC**: `https://api.mainnet-beta.solana.com`
- **Notes**: Requires real SOL for gas fees

### Files To Review
- `/src/lib/solana-nft.ts` - NFT metadata types and helpers
- `/src/lib/solana-service.ts` - Minting service and simulation
- `/src/components/MintNFTDialog.tsx` - Minting UI
- `/src/components/NFTView.tsx` - Gallery and history views
- `/src/lib/types.ts` - MintedNFT and related types

### Production Deployment Checklist

For moving from simulation to real minting:

- [ ] Integrate `@solana/web3.js` for blockchain transactions
- [ ] Integrate `@metaplex-foundation/mpl-token-metadata` for NFT standards
- [ ] Set up decentralized storage (Arweave, IPFS, or NFT.Storage)
- [ ] Implement metadata upload before minting
- [ ] Add transaction confirmation waiting
- [ ] Implement retry logic for failed transactions
- [ ] Add SOL balance checking before minting
- [ ] Switch default network to mainnet
- [ ] Add cost estimation UI
- [ ] Implement transaction signing with connected wallet
- [ ] Add error recovery for partial batch mints
- [ ] Implement NFT transfer tracking (optional)

---

## Security Considerations

### API Keys Storage
- **Current**: Stored in browser via `useKV` hook (Spark's persistent storage)
- **Access**: Client-side only, persists across sessions
- **Recommendation**: For production, move API calls to server-side proxy to protect keys

### Wallet Security
- **Private Keys**: Never exposed to application, managed by wallet extension
- **Signatures**: Requested from wallet for each transaction
- **Connection**: Can be revoked by user at any time
- **Best Practice**: Always validate wallet ownership before sensitive operations

### NFT Metadata
- **Images**: Should be hosted on decentralized storage (IPFS/Arweave) for permanence
- **Metadata**: Currently includes all item details - consider privacy implications
- **External URLs**: Point to VinylVault app - ensure long-term domain stability

---

## Troubleshooting

### Marketplace Issues

#### "eBay Connection Failed"
- **Cause**: Invalid App ID or API rate limit exceeded
- **Solution**: 
  1. Verify App ID is correct
  2. Check you're using Production keys (not Sandbox)
  3. Wait 1 minute if rate limited
  4. Ensure internet connection is stable

#### "Discogs 401 Unauthorized"
- **Cause**: Invalid or expired token
- **Solution**:
  1. Regenerate Personal Access Token at Discogs
  2. Re-enter token in settings
  3. Test connection again

#### "No Bargains Found"
- **Cause**: No matching listings or too-restrictive watchlist
- **Solution**:
  1. Broaden watchlist search terms
  2. Try different artist/release combinations
  3. Check if marketplaces have active listings for your search

### Wallet Issues

#### "No Wallet Detected"
- **Cause**: Wallet extension not installed or disabled
- **Solution**:
  1. Install Phantom, Solflare, or Backpack extension
  2. Refresh page after installation
  3. Enable extension in browser settings
  4. Try a different browser if issues persist

#### "Wallet Won't Connect"
- **Cause**: User rejected connection or wallet locked
- **Solution**:
  1. Unlock wallet extension
  2. Try connecting again
  3. Approve connection popup
  4. Check wallet is on correct network (Solana)

#### "Connection Lost After Refresh"
- **Cause**: Wallet disconnected or extension updated
- **Solution**:
  1. Click "Connect Wallet" again
  2. Wallet should auto-reconnect if still connected
  3. Check `localStorage` has `vinylvault_wallet` key

### NFT Minting Issues

#### "Mint Failed - No Wallet Connected"
- **Cause**: Wallet disconnected before minting
- **Solution**: Reconnect wallet and try again

#### "Insufficient SOL Balance" (Mainnet)
- **Cause**: Not enough SOL for transaction fees
- **Solution**: Add SOL to wallet (0.01 SOL minimum recommended)

#### "Transaction Timeout"
- **Cause**: Network congestion or RPC issues
- **Solution**:
  1. Wait 30 seconds and retry
  2. Switch RPC endpoint if available
  3. Check Solana status page for network issues

---

## Testing Guide

### Test Marketplace Configuration
1. Use test eBay Sandbox credentials
2. Use Discogs test token
3. Create simple watchlist (e.g., "Pink Floyd")
4. Click "Scan Market"
5. Verify bargains appear
6. Check bargain scores make sense
7. Click "View Listing" to verify links work

### Test Wallet Connection
1. Install Phantom wallet extension
2. Create/import test wallet
3. Switch to Solana Devnet
4. In VinylVault, click "Connect Wallet"
5. Approve connection
6. Verify wallet address displays
7. Refresh page - verify auto-reconnect
8. Click disconnect - verify clean disconnect

### Test NFT Minting (Simulated)
1. Connect wallet (devnet)
2. Add test vinyl item to collection
3. Navigate to NFTs tab
4. Click "Mint NFT" (if available) or use MintNFTDialog
5. Configure royalty percentage
6. Confirm mint
7. Verify NFT appears in gallery
8. Check transaction history
9. Verify NFT details match vinyl item

---

## API Rate Limits

### eBay Finding API
- **Limit**: 5,000 calls per day per App ID
- **Rate**: ~3 calls per second sustained
- **Recommendation**: Cache results, batch queries

### Discogs API
- **Authenticated**: 60 requests per minute
- **Unauthenticated**: 25 requests per minute  
- **Recommendation**: Use Personal Access Token for higher limits

### Solana RPC
- **Public RPC**: Rate limited, variable
- **Recommendation**: Use Helius, QuickNode, or Alchemy for production
- **Cost**: Free tiers available, paid plans for high volume

---

## Future Enhancements

### Marketplace
- [ ] Auto-schedule marketplace scans (hourly/daily)
- [ ] Push notifications for high-score bargains
- [ ] Price tracking and alerts
- [ ] Saved searches with email notifications
- [ ] Multi-marketplace comparison in single view
- [ ] Integration with more marketplaces (Reverb LP, MusicStack)

### Wallet & Web3
- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] WalletConnect protocol for mobile wallets
- [ ] Hardware wallet support (Ledger)
- [ ] Wallet balance display
- [ ] Transaction history from blockchain

### NFT Minting
- [ ] Real Metaplex minting integration
- [ ] Arweave/IPFS metadata storage
- [ ] NFT collections (group related records)
- [ ] Fractional ownership NFTs
- [ ] NFT marketplace listing from app
- [ ] QR code linking physical vinyl to NFT
- [ ] NFC tag integration
- [ ] Transfer/burn NFT functionality
- [ ] Royalty payout tracking

---

## Resources

### Documentation
- [eBay Finding API Docs](https://developer.ebay.com/DevZone/finding/Concepts/FindingAPIGuide.html)
- [Discogs API Docs](https://www.discogs.com/developers)
- [Solana Documentation](https://docs.solana.com/)
- [Metaplex Documentation](https://docs.metaplex.com/)
- [Phantom Developer Docs](https://docs.phantom.app/)

### Tools
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [Solana Devnet Faucet](https://faucet.solana.com/)
- [Metaplex NFT Standard](https://docs.metaplex.com/programs/token-metadata/)

### Support
- Discogs API Forum: https://www.discogs.com/forum/thread/731593
- Solana Discord: https://discord.com/invite/solana
- Metaplex Discord: https://discord.com/invite/metaplex

---

## Conclusion

This configuration guide covers the three major integration areas for VinylVault:

1. **Marketplace Configuration**: Live eBay and Discogs API integration for real-time bargain hunting
2. **Web3 Wallet Connection**: Solana wallet support with multi-wallet compatibility  
3. **NFT Minting**: Convert vinyl records to blockchain-verified NFTs with royalties

All three features are designed to work together:
- Use marketplace scanner to find bargains
- Purchase rare vinyl
- Mint as NFT to establish provenance
- Earn royalties on future resales

The current implementation provides a solid foundation with simulated minting (devnet) and real marketplace integration. Production deployment requires additional blockchain integration work but the architecture is ready.

**Next Steps:**
1. Configure eBay and Discogs API credentials in Settings
2. Install and connect a Solana wallet
3. Test marketplace scanning with watchlist items
4. Explore NFT minting simulation
5. Review code files listed in each section
6. Plan production blockchain integration

For questions or issues, refer to the Troubleshooting section or review the linked source files.
