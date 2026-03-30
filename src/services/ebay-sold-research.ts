// src/services/ebay-sold-research.ts

/** eBay UK Seller Hub category ID for Vinyl Records */
const EBAY_VINYL_CATEGORY_ID = 11233;

/** eBay condition IDs: 3000 = Very Good Plus, 4000 = Very Good, 5000 = Good Plus */
const EBAY_CONDITION_FILTERS = [3000, 4000, 5000];

export class EbaySoldResearchService {
  static getDeepLink(query: string = ''): string {
    const base = 'https://www.ebay.co.uk/sh/research?marketplace=EBAY-UK&tabName=SOLD';
    const encoded = encodeURIComponent(query.trim());
    if (!encoded) return base;
    const categoryParam = `categoryId%3A%5B${EBAY_VINYL_CATEGORY_ID}%5D`;
    const conditionParam = `condition%3A%5B${EBAY_CONDITION_FILTERS.join('%7C')}%5D`;
    return `${base}&keyword=${encoded}&_trkparms=${categoryParam}%7C%7C${conditionParam}`;
  }

  // Pre-fill with pressing details from our ValuationEngine
  static forVinyl(pressing: {
    catalogNumber?: string;
    title?: string;
    artist?: string;
  }): string {
    const searchTerm = [
      pressing.artist,
      pressing.title,
      pressing.catalogNumber,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return this.getDeepLink(searchTerm);
  }
}
