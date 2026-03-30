// src/services/discogs-service.ts
// Vinylasis Discogs API Client — Production Grade

import { toast } from 'sonner'; // Shadcn toast (luxury gold styling)

const BASE_URL = 'https://api.discogs.com';
const USER_AGENT = 'Vinylasis/1.2 +https://github.com/flencrypto/Vinylasis';
const REQUEST_TIMEOUT_MS = 30_000;
const MIN_TOKEN_LENGTH = 20;

const RATE_LIMIT = {
  limit: 60,
  remaining: 60,
  reset: Date.now() + 60000,
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DiscogsSearchParams {
  query?: string;
  artist?: string;
  release_title?: string;
  label?: string;
  catno?: string;
  format?: string;
  country?: string;
  year?: string;
  genre?: string;
  style?: string;
  type?: 'release' | 'master' | 'artist' | 'label';
  per_page?: number;
  page?: number;
}

export interface DiscogsMarketplaceSearchParams {
  query?: string;
  artist?: string;
  release_title?: string;
  label?: string;
  catalog_number?: string;
  format?: string;
  country?: string;
  year?: string;
  genre?: string;
  style?: string;
  sort?: 'listed' | 'price';
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface DiscogsSearchResult {
  id: number;
  type: string;
  title: string;
  year?: string;
  country?: string;
  format?: string[];
  label?: string[];
  catno?: string;
  thumb?: string;
  cover_image?: string;
  uri?: string;
  master_id?: number;
  master_url?: string;
  resource_url?: string;
  community?: {
    have: number;
    want: number;
  };
}

export interface DiscogsPagination {
  page: number;
  pages: number;
  per_page: number;
  items: number;
  urls?: {
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
  };
}

export interface DiscogsSearchResponse {
  pagination: DiscogsPagination;
  results: DiscogsSearchResult[];
}

export interface DiscogsTrack {
  position: string;
  title: string;
  duration: string;
  type_?: string;
}

export interface DiscogsImage {
  uri: string;
  type: 'primary' | 'secondary';
  width: number;
  height: number;
  resource_url?: string;
  uri150?: string;
}

export interface DiscogsRelease {
  id: number;
  title: string;
  artists?: Array<{ name: string; id: number; role?: string }>;
  artists_sort?: string;
  labels?: Array<{ name: string; id: number; catno?: string }>;
  formats?: Array<{ name: string; qty: string; descriptions?: string[] }>;
  genres?: string[];
  styles?: string[];
  year?: number;
  country?: string;
  released?: string;
  released_formatted?: string;
  tracklist?: DiscogsTrack[];
  images?: DiscogsImage[];
  notes?: string;
  community?: {
    have: number;
    want: number;
    rating?: { count: number; average: number };
  };
  identifiers?: Array<{ type: string; value: string }>;
  extraartists?: Array<{ name: string; role: string }>;
  series?: Array<{ name: string; id: number; catno?: string }>;
  companies?: Array<{ name: string; id: number; entity_type: string }>;
  num_for_sale?: number;
  lowest_price?: number;
  uri?: string;
  resource_url?: string;
  master_id?: number;
  master_url?: string;
  data_quality?: string;
  status?: string;
}

export interface DiscogsPriceStats {
  lowestPrice: number | null;
  highestPrice: number | null;
  medianPrice: number | null;
  averagePrice: number | null;
  numForSale: number;
  currency: string;
}

export interface DiscogsMarketplaceListing {
  id: number;
  status: string;
  ships_from: string;
  uri: string;
  comments?: string;
  seller: {
    username: string;
    rating: string;
    ships_from?: string;
    url?: string;
  };
  release: {
    id: number;
    description: string;
    year?: number;
    catalog_number?: string;
    format?: string;
    images?: Array<{ uri: string; type: string }>;
    resource_url?: string;
    uri?: string;
  };
  price: {
    value: number;
    currency: string;
  };
  original_price?: {
    value: number;
    currency: string;
    curr_abbr?: string;
  };
  condition: string;
  sleeve_condition?: string;
  posted: string;
  allow_offers?: boolean;
  audio?: boolean;
}

export interface DiscogsMarketplaceResponse {
  pagination: DiscogsPagination;
  listings: DiscogsMarketplaceListing[];
}

export interface DiscogsConnectionResult {
  success: boolean;
  message: string;
  username?: string;
  totalResults?: number;
}

// ─── Cache entry ─────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// ─── Service class ───────────────────────────────────────────────────────────

class DiscogsService {
  private token: string;
  private cache = new Map<string, CacheEntry<unknown>>();

  constructor(token = '') {
    this.token = token;
  }

  // ─── Token management ──────────────────────────────────────────────────

  setToken(token: string): void {
    this.token = token.trim();
    this.cache.clear();
  }

  getToken(): string {
    return this.token;
  }

  hasToken(): boolean {
    return this.token.length > 0;
  }

  // ─── Rate limit ────────────────────────────────────────────────────────

  private updateRateLimitFromHeaders(headers: Headers): void {
    const limit = headers.get('X-Discogs-Ratelimit');
    const remaining = headers.get('X-Discogs-Ratelimit-Remaining');
    const reset = headers.get('X-Discogs-Ratelimit-Reset');

    if (limit) RATE_LIMIT.limit = parseInt(limit, 10);
    if (remaining) RATE_LIMIT.remaining = parseInt(remaining, 10);
    if (reset) RATE_LIMIT.reset = parseInt(reset, 10) * 1000;
  }

  getRateLimitStatus(): { limit: number; remaining: number; reset: number } {
    return { ...RATE_LIMIT };
  }

  // ─── Internal cache helpers ────────────────────────────────────────────

  private cacheGet<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private cacheSet<T>(key: string, data: T, ttlMs: number): void {
    // Prune up to 100 expired entries when the cache grows large,
    // avoiding a full O(n) scan on every write.
    if (this.cache.size > 500) {
      const now = Date.now();
      let pruned = 0;
      for (const [k, v] of this.cache) {
        if (now > v.expiresAt) {
          this.cache.delete(k);
          if (++pruned >= 100) break;
        }
      }
    }
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  invalidateCache(): void {
    this.cache.clear();
  }

  // ─── Build default headers ─────────────────────────────────────────────

  private buildHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'User-Agent': USER_AGENT,
      Accept: 'application/vnd.discogs.v2.html+json',
    };

    if (this.token) {
      headers['Authorization'] = `Discogs token=${this.token}`;
    }

    return headers;
  }

  // ─── Core fetch with rate-limit and retry logic ────────────────────────

  private async fetchWithRetry<T>(
    url: string,
    maxRetries = 3,
    cacheTtlMs?: number,
    cacheKey?: string,
  ): Promise<T> {
    if (cacheKey && cacheTtlMs) {
      const cached = this.cacheGet<T>(cacheKey);
      if (cached !== null) return cached;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          headers: this.buildHeaders(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        this.updateRateLimitFromHeaders(response.headers);

        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const delay = retryAfterHeader
            ? parseInt(retryAfterHeader, 10) * 1000
            : 1000 * Math.pow(2, attempt);

          toast.warning(
            `Discogs rate limit reached — retrying in ${Math.round(delay / 1000)}s (${attempt + 1}/${maxRetries})`,
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          lastError = new Error(`Discogs rate limit exceeded (429)`);
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          let message = `${response.status} ${response.statusText}`;
          try {
            const parsed = JSON.parse(errorBody);
            if (parsed?.message) message = parsed.message;
          } catch {
            // ignore
          }

          if (response.status === 401) {
            toast.error(
              'Discogs authentication failed — please verify your Personal Access Token in Settings.',
            );
            throw new Error(`Discogs authentication failed (401): ${message}`);
          }

          if (response.status === 404) {
            throw new Error(`Discogs resource not found (404): ${message}`);
          }

          if (response.status >= 500 && attempt < maxRetries - 1) {
            const delay = 1000 * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
            lastError = new Error(`Discogs server error (${response.status}): ${message}`);
            continue;
          }

          throw new Error(`Discogs API error (${response.status}): ${message}`);
        }

        const data = (await response.json()) as T;

        if (cacheKey && cacheTtlMs) {
          this.cacheSet(cacheKey, data, cacheTtlMs);
        }

        return data;
      } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error(
            `Discogs request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds. Please try again.`,
          );
        }

        // Re-throw non-retryable errors immediately
        if (
          err instanceof Error &&
          (err.message.includes('401') || err.message.includes('authentication failed'))
        ) {
          throw err;
        }

        lastError = err as Error;

        if (attempt < maxRetries - 1) {
          const delay = 1000 * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError ?? new Error('Discogs request failed after all retries');
  }

  // ─── Public API ────────────────────────────────────────────────────────

  /**
   * Search the Discogs database for releases, masters, artists, or labels.
   *
   * Results are cached for 1 hour.
   */
  async searchDatabase(params: DiscogsSearchParams): Promise<DiscogsSearchResponse> {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }
    if (!searchParams.has('per_page')) searchParams.set('per_page', '50');
    if (!searchParams.has('type')) searchParams.set('type', 'release');

    const url = `${BASE_URL}/database/search?${searchParams.toString()}`;
    const cacheKey = `db:${url}`;

    return this.fetchWithRetry<DiscogsSearchResponse>(url, 3, 60 * 60 * 1000, cacheKey);
  }

  /**
   * Fetch full release metadata by Discogs release ID.
   *
   * Results are cached for 24 hours.
   */
  async getRelease(releaseId: number): Promise<DiscogsRelease> {
    const url = `${BASE_URL}/releases/${releaseId}`;
    const cacheKey = `release:${releaseId}`;

    return this.fetchWithRetry<DiscogsRelease>(url, 3, 24 * 60 * 60 * 1000, cacheKey);
  }

  /**
   * Fetch master release metadata by Discogs master ID.
   *
   * Results are cached for 24 hours.
   */
  async getMasterRelease(masterId: number): Promise<DiscogsRelease> {
    const url = `${BASE_URL}/masters/${masterId}`;
    const cacheKey = `master:${masterId}`;

    return this.fetchWithRetry<DiscogsRelease>(url, 3, 24 * 60 * 60 * 1000, cacheKey);
  }

  /**
   * Fetch marketplace statistics for a release (lowest price, num for sale, etc.).
   *
   * Results are cached for 15 minutes.
   */
  async getReleasePriceStats(releaseId: number): Promise<DiscogsPriceStats> {
    const cacheKey = `price:${releaseId}`;
    const cached = this.cacheGet<DiscogsPriceStats>(cacheKey);
    if (cached !== null) return cached;

    const release = await this.getRelease(releaseId);

    const stats: DiscogsPriceStats = {
      lowestPrice: release.lowest_price ?? null,
      highestPrice: null,
      medianPrice: null,
      averagePrice: null,
      numForSale: release.num_for_sale ?? 0,
      currency: 'USD',
    };

    this.cacheSet(cacheKey, stats, 15 * 60 * 1000);
    return stats;
  }

  /**
   * Search the Discogs Marketplace for active listings.
   *
   * Results are cached for 30 minutes.
   */
  async searchMarketplace(
    params: DiscogsMarketplaceSearchParams,
  ): Promise<DiscogsMarketplaceResponse> {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }
    if (!searchParams.has('per_page')) searchParams.set('per_page', '100');

    const url = `${BASE_URL}/marketplace/search?${searchParams.toString()}`;
    const cacheKey = `mp:${url}`;

    return this.fetchWithRetry<DiscogsMarketplaceResponse>(url, 3, 30 * 60 * 1000, cacheKey);
  }

  /**
   * Fetch a specific marketplace listing by ID.
   *
   * Results are cached for 10 minutes.
   */
  async getMarketplaceListing(listingId: number): Promise<DiscogsMarketplaceListing> {
    const url = `${BASE_URL}/marketplace/listings/${listingId}`;
    const cacheKey = `listing:${listingId}`;

    return this.fetchWithRetry<DiscogsMarketplaceListing>(url, 3, 10 * 60 * 1000, cacheKey);
  }

  /**
   * Verify that the configured token can reach the Discogs API.
   *
   * Returns a typed result rather than throwing so callers can handle
   * authentication errors gracefully without try/catch.
   */
  async testConnection(): Promise<DiscogsConnectionResult> {
    if (!this.token) {
      return {
        success: false,
        message:
          'No Personal Access Token configured. Add your Discogs token in Settings.',
      };
    }

    if (this.token.length < MIN_TOKEN_LENGTH) {
      return {
        success: false,
        message:
          'Token appears too short — please re-copy your Personal Access Token from Discogs → Settings → Developers.',
      };
    }

    try {
      const data = await this.searchDatabase({ query: 'vinyl', type: 'release', per_page: 1 });
      const total = data.pagination?.items ?? 0;

      return {
        success: true,
        message: `Connected — Discogs database contains ${total.toLocaleString()} releases.`,
        totalResults: total,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, message };
    }
  }

  /**
   * Fetch the currently authenticated user's identity.
   *
   * Requires a valid Personal Access Token.
   */
  async getIdentity(): Promise<{ username: string; id: number; resource_url: string }> {
    const url = `${BASE_URL}/oauth/identity`;
    // Use a hash of the token rather than any prefix so no partial token
    // is embedded in cache keys that could appear in logs or diagnostics.
    let tokenHash = 0;
    for (let i = 0; i < this.token.length; i++) {
      tokenHash = ((tokenHash << 5) - tokenHash + this.token.charCodeAt(i)) | 0;
    }
    const cacheKey = `identity:${Math.abs(tokenHash).toString(36)}`;

    return this.fetchWithRetry<{ username: string; id: number; resource_url: string }>(
      url,
      2,
      60 * 60 * 1000,
      cacheKey,
    );
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const discogsService = new DiscogsService(
  typeof localStorage !== 'undefined'
    ? (localStorage.getItem('discogs_personal_token') ?? '')
    : '',
);

export { DiscogsService };
