import { ReverseGeocodeResult } from '@/lib/location/types';
import { AppError } from '@/server/errors';

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests. Please wait a moment before trying again.') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  footway?: string;
  street?: string;
  house_number?: string;
  building?: string;
  amenity?: string;
  suburb?: string;
  neighbourhood?: string;
  residential?: string;
  subdistrict?: string;
  locality?: string;
  village?: string;
  hamlet?: string;
  town?: string;
  city?: string;
  city_district?: string;
  municipality?: string;
  county?: string;
  state?: string;
  state_district?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

export interface NominatimResponse {
  place_id?: number;
  display_name?: string;
  address?: NominatimAddress;
  error?: string;
}

export function parseIndianPinCode(rawCode?: string | null): string {
  if (!rawCode) return '';
  const cleaned = rawCode.trim().replace(/\s+/g, '');
  const match = cleaned.match(/\b([1-9][0-9]{5})\b/);
  return match ? match[1] : '';
}

export function mapNominatimToResult(data: NominatimResponse): ReverseGeocodeResult {
  const addr = data.address || {};

  const streetPart = [
    addr.house_number || addr.building || addr.amenity,
    addr.road || addr.pedestrian || addr.footway || addr.street,
  ]
    .filter(Boolean)
    .join(', ');

  const areaPart = [
    addr.suburb || addr.neighbourhood || addr.residential || addr.locality,
    addr.subdistrict || addr.county,
  ]
    .filter(Boolean)
    .join(', ');

  let addressLine1 = streetPart;
  let addressLine2 = areaPart;

  if (!addressLine1 && areaPart) {
    addressLine1 = areaPart;
    addressLine2 = addr.state_district || '';
  } else if (!addressLine1 && data.display_name) {
    const parts = data.display_name.split(',').map((p) => p.trim());
    addressLine1 = parts[0] || '';
    addressLine2 = parts.slice(1, 3).join(', ');
  }

  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.city_district ||
    addr.county ||
    '';

  const state = addr.state || addr.state_district || '';
  const parsedPincode = parseIndianPinCode(addr.postcode);

  return {
    addressLine1: addressLine1 || city || 'Current Location',
    addressLine2: addressLine2 || '',
    city,
    state,
    pincode: parsedPincode,
    hasValidPincode: parsedPincode.length === 6,
    formattedAddress: data.display_name || '',
    provider: 'OpenStreetMap (Nominatim)',
  };
}

export function mapBigDataCloudToResult(data: any): ReverseGeocodeResult {
  const city = data.city || data.locality || '';
  const state = data.principalSubdivision || '';
  const parsedPincode = parseIndianPinCode(data.postcode);

  const adminTaluka = data.localityInfo?.administrative?.find(
    (a: any) => a.adminLevel === 6 || a.adminLevel === 5
  )?.name;

  return {
    addressLine1: data.locality || city || 'Current Location',
    addressLine2: adminTaluka && adminTaluka !== city ? adminTaluka : '',
    city,
    state,
    pincode: parsedPincode,
    hasValidPincode: parsedPincode.length === 6,
    formattedAddress: [city, state, parsedPincode].filter(Boolean).join(', '),
    provider: 'BigDataCloud (Fallback)',
  };
}

// --------------------------------------------------------------------------
// Nominatim Policy Compliance: In-Memory Caching & Rate Limiting
// --------------------------------------------------------------------------
interface CachedGeocodeEntry {
  result: ReverseGeocodeResult;
  timestamp: number;
}

export const geocodeCache = new Map<string, CachedGeocodeEntry>();
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours TTL
const MAX_CACHE_ENTRIES = 500;

export function getCoordinateCacheKey(lat: number, lon: number): string {
  // Round to 4 decimal places (~11 meters precision), merging nearby micro-jitter
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

export function clearGeocodeCache(): void {
  geocodeCache.clear();
}

// Global pacing for Nominatim to guarantee <= 1 request/second compliance
let lastNominatimRequestTime = 0;
const MIN_NOMINATIM_INTERVAL_MS = 1050;

async function paceNominatimRequest(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastNominatimRequestTime;
  if (elapsed < MIN_NOMINATIM_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_NOMINATIM_INTERVAL_MS - elapsed));
  }
  lastNominatimRequestTime = Date.now();
}

// Per-client rate limiter to prevent abuse
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export const clientRateLimits = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 25; // 25 requests per minute per IP

export function checkRateLimit(clientId: string): void {
  const now = Date.now();
  const entry = clientRateLimits.get(clientId);

  if (!entry || now > entry.resetTime) {
    clientRateLimits.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    throw new RateLimitError('Too many location requests. Please wait a moment before trying again.');
  }

  entry.count++;
}

export function resetRateLimits(): void {
  clientRateLimits.clear();
}

export class GeocodingService {
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult> {
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      throw new Error('Valid numeric latitude and longitude coordinates are required');
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error('Coordinates are out of geographical range (-90 to 90 lat, -180 to 180 lon)');
    }

    // 1. Check in-memory cache
    const cacheKey = getCoordinateCacheKey(latitude, longitude);
    const cached = geocodeCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.result;
    }

    const saveToCache = (result: ReverseGeocodeResult) => {
      if (geocodeCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = geocodeCache.keys().next().value;
        if (oldestKey) geocodeCache.delete(oldestKey);
      }
      geocodeCache.set(cacheKey, { result, timestamp: Date.now() });
    };

    // 2. Primary Provider: OpenStreetMap Nominatim
    try {
      await paceNominatimRequest();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ABPS-Books-Storefront/1.0 (https://abps-books.vercel.app; support@abpsbooks.edu)',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json: NominatimResponse = await res.json();
        if (json && !json.error && json.address) {
          const result = mapNominatimToResult(json);
          saveToCache(result);
          return result;
        }
      }
    } catch (err: any) {
      // Safe logging without exposing sensitive coordinate data
      console.warn('[Geocoding] Primary provider (Nominatim) failed, attempting fallback');
    }

    // 3. Secondary Fallback Provider: BigDataCloud Reverse Geocode API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (fallbackRes.ok) {
        const fallbackJson = await fallbackRes.json();
        if (fallbackJson && (fallbackJson.city || fallbackJson.locality || fallbackJson.principalSubdivision)) {
          const result = mapBigDataCloudToResult(fallbackJson);
          saveToCache(result);
          return result;
        }
      }
    } catch (fallbackErr: any) {
      // Safe logging without exposing sensitive coordinate data
      console.warn('[Geocoding] Secondary fallback provider unavailable');
    }

    throw new Error('Unable to resolve a delivery address from your current location coordinates');
  }
}

export const geocodingService = new GeocodingService();
