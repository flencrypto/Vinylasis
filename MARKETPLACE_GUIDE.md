# Real Marketplace Integration Guide

VinylVault connects to **live eBay and Discogs APIs** to scan thousands of actual marketplace listings for undervalued records. This guide explains how to set up the integration.

## 🔌 APIs Used

- **eBay Finding API** (`https://svcs.ebay.com/services/search/FindingService/v1`)
- **Discogs Marketplace API** (`https://api.discogs.com/marketplace/search`)

Both are called directly from your browser - no backend server needed!

## 🔑 Getting eBay API Credentials

### Step 1: Create eBay Developer Account
1. Visit [https://developer.ebay.com/](https://developer.ebay.com/)
2. Click "Get started" or "Sign in"
3. Use your existing eBay account or create a new one
4. Complete the developer registration

### Step 2: Create an Application
1. Go to "My Account" → "Application Keys"
2. Click "Create an Application Key"
3. Choose your environment:
   - **Sandbox**: For testing (free, fake listings)
   - **Production**: For real marketplace data (requires approval)
4. Fill in the application details:
   - Application Title: "VinylVault"
   - Brief Description: "Vinyl collection management and bargain hunting"

### Step 3: Get Your App ID
1. Once created, you'll see your keyset
2. Copy the **App ID (Client ID)** - this is what you need
3. Keep this secure - don't share it publicly

### Step 4: Configure in VinylVault
1. Open VinylVault
2. Navigate to the "Bargains" tab
3. Click the ⚙️ Settings icon (top right)
4. Enable "eBay marketplace scanning"
5. Paste your App ID
6. Click "Test eBay Connection" to verify
7. Save settings

## 🔑 Getting Discogs API Credentials

### Option 1: Personal Access Token (Recommended)

This is the easiest method for personal use:

1. Visit [https://www.discogs.com/settings/developers](https://www.discogs.com/settings/developers)
2. Log in to your Discogs account
3. Scroll to "Personal Access Tokens"
4. Click "Generate new token"
5. Enter a token name: "VinylVault"
6. Copy the generated token immediately (you won't see it again!)

### Option 2: OAuth Application (Advanced)

For production apps or if you need user-specific data:

1. Visit [https://www.discogs.com/settings/developers](https://www.discogs.com/settings/developers)
2. Click "Create an Application"
3. Fill in the details:
   - Application Name: "VinylVault"
   - Description: "Vinyl collection management"
   - Application URL: Your app URL
4. Copy your Consumer Key and Consumer Secret

### Configure in VinylVault
1. Open VinylVault
2. Navigate to the "Bargains" tab
3. Click the ⚙️ Settings icon
4. Enable "Discogs marketplace scanning"
5. Enter EITHER:
   - Your Personal Access Token, OR
   - Consumer Key + Consumer Secret
6. Click "Test Discogs Connection" to verify
7. Save settings

## 🎯 How It Works

Once configured, here's what happens when you click "Scan Market":

1. **Watchlist Query Building**
   - VinylVault takes your watchlist items
   - Builds search queries (e.g., "Pink Floyd Dark Side LP")

2. **Real API Calls**
   ```
   GET https://svcs.ebay.com/services/search/FindingService/v1
   → Returns actual live eBay listings
   
   GET https://api.discogs.com/marketplace/search
   → Returns actual Discogs marketplace listings
   ```

3. **AI Bargain Analysis**
   - Each listing is analyzed by GPT-4
   - Scores calculated based on:
     - Price vs estimated market value
     - Title quality and accuracy
     - Condition description
     - Seller category mismatches
     - Promo/test pressing keywords
     - Missing but valuable metadata

4. **Results**
   - Listings with bargain score ≥ 40% are saved
   - Sorted by bargain score (highest first)
   - Each shows estimated upside potential

## 📊 What You Get

### Real Data Examples

**eBay Listing:**
```json
{
  "title": "Beatles Revolver 1966 UK 1st Press PMC 7009",
  "price": 45.00,
  "currency": "GBP",
  "condition": "VG+",
  "seller": "recordcollector123",
  "location": "London, UK",
  "url": "https://www.ebay.co.uk/itm/..."
}
```

**Discogs Listing:**
```json
{
  "title": "The Beatles - Revolver (LP, Album, RE)",
  "price": 38.50,
  "currency": "GBP",
  "condition": "Near Mint (NM or M-) / Very Good Plus (VG+)",
  "seller": "ukvinylshop",
  "location": "United Kingdom"
}
```

### Bargain Signals

VinylVault looks for these signals:

- **Title Mismatch**: "Beatles LP" instead of full title → possible misdescribed gem
- **Low Price**: Listed at £20 but market value is £80 → 75% upside
- **Wrong Category**: Rare jazz record in "Rock" category → fewer bidders
- **Job Lot**: "5 LPs including..." → hidden valuable records
- **Promo Keywords**: "promo", "test pressing", "white label" → rare variants
- **Poor Metadata**: Missing catalog number, vague description → undervalued

## 🔒 Privacy & Rate Limits

- **eBay**: 5,000 calls/day for most applications
- **Discogs**: 60 calls/minute, authenticated
- Your API keys stay in your browser's local storage
- All API calls are made directly from your browser
- No data is sent to VinylVault servers (there are none!)

## 🚀 Tips for Best Results

1. **Add Specific Watches**: "Pink Floyd Dark Side Moon" is better than just "Pink Floyd"
2. **Use Multiple Sources**: Enable both eBay and Discogs
3. **Scan Regularly**: Marketplace changes constantly
4. **Check Listings Quickly**: Good bargains sell fast
5. **Verify Before Buying**: Always check the actual listing carefully

## ❓ Troubleshooting

### "eBay API error: 401"
- Your App ID is incorrect or expired
- Re-generate your application keys

### "Discogs API error: 401"
- Your token is incorrect or expired
- Generate a new Personal Access Token

### "No listings found"
- Your watchlist may be too specific
- Try broader search terms
- Check that marketplaces are enabled

### "Scan is slow"
- Discogs has a rate limit (1 request per second)
- Large watchlists take longer
- This is normal and expected

## 📚 API Documentation

- [eBay Finding API Docs](https://developer.ebay.com/Devzone/finding/Concepts/FindingAPIGuide.html)
- [Discogs API Docs](https://www.discogs.com/developers)

---

**Ready to find bargains?** Set up your API credentials and start scanning!
