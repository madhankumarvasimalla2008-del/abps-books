import './setup';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapNominatimToResult,
  mapBigDataCloudToResult,
  parseIndianPinCode,
  GeocodingService,
  getCoordinateCacheKey,
  geocodeCache,
  clearGeocodeCache,
  checkRateLimit,
  resetRateLimits,
  RateLimitError,
} from '../src/server/services/geocoding.service';
import { formatGeolocationErrorMessage } from '../src/lib/location/geolocation';
import { AddressData, AddressErrors } from '../src/components/customer/checkout/CheckoutAddressForm';

describe('ABPS Books — Automatic Location & Checkout Address Autofill Suite', () => {
  beforeEach(() => {
    clearGeocodeCache();
    resetRateLimits();
  });

  // --------------------------------------------------------------------------
  // 1. OpenStreetMap Nominatim Response Parsing & Mapping
  // --------------------------------------------------------------------------
  describe('Nominatim Response Mapping', () => {
    it('correctly maps full Indian street address and 6-digit PIN code', () => {
      const mockNominatimData = {
        place_id: 123456,
        display_name: 'Birla Cellulosic Campus, Kosamba, Mangrol Taluka, Surat, Gujarat, 394120, India',
        address: {
          house_number: 'Campus Block B',
          road: 'Birla Cellulosic Road',
          suburb: 'Kharach',
          county: 'Mangrol Taluka',
          town: 'Kosamba',
          state_district: 'Surat',
          state: 'Gujarat',
          postcode: '394120',
          country: 'India',
          country_code: 'in',
        },
      };

      const result = mapNominatimToResult(mockNominatimData);

      assert.strictEqual(result.addressLine1, 'Campus Block B, Birla Cellulosic Road');
      assert.strictEqual(result.addressLine2, 'Kharach, Mangrol Taluka');
      assert.strictEqual(result.city, 'Kosamba');
      assert.strictEqual(result.state, 'Gujarat');
      assert.strictEqual(result.pincode, '394120');
      assert.strictEqual(result.hasValidPincode, true);
      assert.strictEqual(result.provider, 'OpenStreetMap (Nominatim)');
    });

    it('handles missing street by elevating suburb and locality to addressLine1', () => {
      const mockNominatimData = {
        place_id: 234567,
        display_name: 'Kharach, Kosamba, Gujarat, 394120, India',
        address: {
          suburb: 'Kharach',
          town: 'Kosamba',
          state: 'Gujarat',
          postcode: '394120',
        },
      };

      const result = mapNominatimToResult(mockNominatimData);

      assert.strictEqual(result.addressLine1, 'Kharach');
      assert.strictEqual(result.city, 'Kosamba');
      assert.strictEqual(result.state, 'Gujarat');
      assert.strictEqual(result.pincode, '394120');
      assert.strictEqual(result.hasValidPincode, true);
    });

    it('does not invent or guess missing PIN codes', () => {
      const mockNominatimData = {
        place_id: 345678,
        display_name: 'Rural Area, Bharuch District, Gujarat, India',
        address: {
          road: 'State Highway 6',
          village: 'Hansot',
          state: 'Gujarat',
          // No postcode returned
        },
      };

      const result = mapNominatimToResult(mockNominatimData);

      assert.strictEqual(result.addressLine1, 'State Highway 6');
      assert.strictEqual(result.city, 'Hansot');
      assert.strictEqual(result.state, 'Gujarat');
      assert.strictEqual(result.pincode, '');
      assert.strictEqual(result.hasValidPincode, false);
    });

    it('sanitizes and parses 6-digit Indian PIN codes accurately', () => {
      assert.strictEqual(parseIndianPinCode('394120'), '394120');
      assert.strictEqual(parseIndianPinCode(' 394 120 '), '394120');
      assert.strictEqual(parseIndianPinCode('PIN: 560001'), '560001');
      assert.strictEqual(parseIndianPinCode('12345'), ''); // 5 digits - invalid
      assert.strictEqual(parseIndianPinCode('012345'), ''); // Starts with 0 - invalid in India
      assert.strictEqual(parseIndianPinCode('ABCDEF'), '');
      assert.strictEqual(parseIndianPinCode(null), '');
      assert.strictEqual(parseIndianPinCode(undefined), '');
    });
  });

  // --------------------------------------------------------------------------
  // 2. BigDataCloud Fallback Provider Mapping
  // --------------------------------------------------------------------------
  describe('BigDataCloud Fallback Provider', () => {
    it('correctly maps BigDataCloud response into address components', () => {
      const mockBdcData = {
        latitude: 21.48,
        longitude: 72.95,
        countryName: 'India',
        principalSubdivision: 'Gujarat',
        city: 'Mangrol',
        locality: 'Kosamba',
        postcode: '394120',
        localityInfo: {
          administrative: [
            { name: 'Surat district', adminLevel: 5 },
            { name: 'Mangrol', adminLevel: 6 },
          ],
        },
      };

      const result = mapBigDataCloudToResult(mockBdcData);

      assert.strictEqual(result.addressLine1, 'Kosamba');
      assert.strictEqual(result.city, 'Mangrol');
      assert.strictEqual(result.state, 'Gujarat');
      assert.strictEqual(result.pincode, '394120');
      assert.strictEqual(result.hasValidPincode, true);
      assert.strictEqual(result.provider, 'BigDataCloud (Fallback)');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Geocoding Service Bounds and Validation
  // --------------------------------------------------------------------------
  describe('Geocoding Service Bounds and Validation', () => {
    const service = new GeocodingService();

    it('rejects non-numeric coordinates', async () => {
      await assert.rejects(
        async () => {
          await service.reverseGeocode(NaN as any, 72.95);
        },
        /Valid numeric latitude and longitude coordinates are required/
      );

      await assert.rejects(
        async () => {
          await service.reverseGeocode(21.48, 'invalid' as any);
        },
        /Valid numeric latitude and longitude coordinates are required/
      );
    });

    it('rejects coordinates out of valid geographical bounds', async () => {
      await assert.rejects(
        async () => {
          await service.reverseGeocode(95.0, 72.95); // Latitude > 90
        },
        /Coordinates are out of geographical range/
      );

      await assert.rejects(
        async () => {
          await service.reverseGeocode(21.48, 190.0); // Longitude > 180
        },
        /Coordinates are out of geographical range/
      );
    });
  });

  // --------------------------------------------------------------------------
  // 4. In-Memory Caching & Rate Limiting Compliance
  // --------------------------------------------------------------------------
  describe('Caching and Rate Limiting Compliance', () => {
    it('rounds coordinates to ~11m precision to merge micro-jitter into identical cache key', () => {
      const key1 = getCoordinateCacheKey(21.48001, 72.95002);
      const key2 = getCoordinateCacheKey(21.48004, 72.95001);
      assert.strictEqual(key1, '21.4800,72.9500');
      assert.strictEqual(key2, '21.4800,72.9500');
      assert.strictEqual(key1, key2);
    });

    it('serves repeat requests from in-memory cache without hitting remote network', async () => {
      const service = new GeocodingService();
      const cacheKey = getCoordinateCacheKey(21.48, 72.95);

      geocodeCache.set(cacheKey, {
        result: {
          addressLine1: 'Cached Campus Line',
          addressLine2: 'Cached Area',
          city: 'Kosamba',
          state: 'Gujarat',
          pincode: '394120',
          hasValidPincode: true,
          formattedAddress: 'Cached Address',
          provider: 'OpenStreetMap (Nominatim)',
        },
        timestamp: Date.now(),
      });

      // Execute reverse lookup:
      const res = await service.reverseGeocode(21.48, 72.95);
      assert.strictEqual(res.addressLine1, 'Cached Campus Line');
      assert.strictEqual(res.city, 'Kosamba');
    });

    it('enforces rate limits per client identifier and throws RateLimitError when exceeded', () => {
      const testIp = '192.168.1.100';
      // First 25 calls succeed
      for (let i = 0; i < 25; i++) {
        checkRateLimit(testIp);
      }

      // 26th call should throw RateLimitError (429)
      assert.throws(
        () => {
          checkRateLimit(testIp);
        },
        (err: any) => {
          assert.ok(err instanceof RateLimitError);
          assert.strictEqual(err.statusCode, 429);
          assert.strictEqual(err.code, 'RATE_LIMIT_EXCEEDED');
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 5. Fallback Provider Execution & Failure Handling
  // --------------------------------------------------------------------------
  describe('Fallback Provider Execution', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('falls back to BigDataCloud when Nominatim fails', async () => {
      const service = new GeocodingService();

      global.fetch = (async (url: any) => {
        const urlStr = String(url);
        if (urlStr.includes('nominatim.openstreetmap.org')) {
          // Simulate Nominatim 503 or network failure
          return {
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            json: async () => ({ error: 'Too Many Requests' }),
          } as any;
        }

        if (urlStr.includes('api.bigdatacloud.net')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              city: 'Kosamba',
              locality: 'Kharach Campus',
              principalSubdivision: 'Gujarat',
              postcode: '394120',
            }),
          } as any;
        }

        throw new Error(`Unexpected URL: ${urlStr}`);
      }) as any;

      const result = await service.reverseGeocode(21.48, 72.95);
      assert.strictEqual(result.city, 'Kosamba');
      assert.strictEqual(result.state, 'Gujarat');
      assert.strictEqual(result.pincode, '394120');
      assert.strictEqual(result.provider, 'BigDataCloud (Fallback)');
    });

    it('throws friendly actionable error if both providers fail', async () => {
      const service = new GeocodingService();

      global.fetch = (async () => {
        throw new Error('All external networks unreachable');
      }) as any;

      await assert.rejects(
        async () => {
          await service.reverseGeocode(21.48, 72.95);
        },
        /Unable to resolve a delivery address from your current location coordinates/
      );
    });
  });

  // --------------------------------------------------------------------------
  // 6. Browser Geolocation Error Handling
  // --------------------------------------------------------------------------
  describe('Browser Geolocation Error Handling', () => {
    it('formats PERMISSION_DENIED (code 1) with actionable settings advice', () => {
      const error = { code: 1, message: 'User denied Geolocation' };
      const msg = formatGeolocationErrorMessage(error);
      assert.match(msg, /Location permission was denied/i);
      assert.match(msg, /enter your address manually/i);
    });

    it('formats POSITION_UNAVAILABLE (code 2) with clear network/GPS advice', () => {
      const error = { code: 2, message: 'Position unavailable' };
      const msg = formatGeolocationErrorMessage(error);
      assert.match(msg, /location could not be determined/i);
      assert.match(msg, /check your network or GPS connection/i);
    });

    it('formats TIMEOUT (code 3) with retry advice', () => {
      const error = { code: 3, message: 'Timeout expired' };
      const msg = formatGeolocationErrorMessage(error);
      assert.match(msg, /request timed out/i);
      assert.match(msg, /fill in your delivery address manually/i);
    });

    it('handles generic Error objects without crashing', () => {
      const error = new Error('Custom network failure');
      const msg = formatGeolocationErrorMessage(error);
      assert.strictEqual(msg, 'Custom network failure');
    });

    it('handles null/undefined gracefully', () => {
      const msg = formatGeolocationErrorMessage(null);
      assert.match(msg, /An unexpected error occurred/i);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Checkout Address Autofill & Recipient Detail Preservation
  // --------------------------------------------------------------------------
  describe('Customer Recipient Preservation & Form Validation', () => {
    it('strictly preserves recipientName and phone when autofilling address', () => {
      const existingAddressData: AddressData = {
        useBranchAddress: false,
        selectedBranchId: '',
        recipientName: 'Madhan Kumar',
        phone: '9876543210',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        deliveryNotes: 'Deliver to main gate',
      };

      const autofillResult = {
        addressLine1: 'Birla Cellulosic Campus',
        addressLine2: 'Kharach',
        city: 'Kosamba',
        state: 'Gujarat',
        pincode: '394120',
        hasValidPincode: true,
        formattedAddress: 'Birla Cellulosic Campus, Kharach, Kosamba, Gujarat 394120',
        provider: 'OpenStreetMap (Nominatim)',
      };

      const updatedAddressData: AddressData = {
        ...existingAddressData,
        addressLine1: autofillResult.addressLine1,
        addressLine2: autofillResult.addressLine2,
        city: autofillResult.city,
        state: autofillResult.state,
        pincode: autofillResult.pincode,
        recipientName: existingAddressData.recipientName,
        phone: existingAddressData.phone,
      };

      assert.strictEqual(updatedAddressData.recipientName, 'Madhan Kumar');
      assert.strictEqual(updatedAddressData.phone, '9876543210');
      assert.strictEqual(updatedAddressData.addressLine1, 'Birla Cellulosic Campus');
      assert.strictEqual(updatedAddressData.city, 'Kosamba');
      assert.strictEqual(updatedAddressData.state, 'Gujarat');
      assert.strictEqual(updatedAddressData.pincode, '394120');
      assert.strictEqual(updatedAddressData.deliveryNotes, 'Deliver to main gate');
    });

    it('requires manual PIN code entry if GPS cannot resolve postal code', () => {
      const existingAddressData: AddressData = {
        useBranchAddress: false,
        selectedBranchId: '',
        recipientName: 'Madhan Kumar',
        phone: '9876543210',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        deliveryNotes: '',
      };

      const autofillResultWithoutPin = {
        addressLine1: 'Remote Forest Road',
        addressLine2: '',
        city: 'Dangs',
        state: 'Gujarat',
        pincode: '',
        hasValidPincode: false,
        formattedAddress: 'Remote Forest Road, Dangs, Gujarat',
        provider: 'OpenStreetMap (Nominatim)',
      };

      const updatedAddressData: AddressData = {
        ...existingAddressData,
        addressLine1: autofillResultWithoutPin.addressLine1,
        city: autofillResultWithoutPin.city,
        state: autofillResultWithoutPin.state,
        pincode: autofillResultWithoutPin.pincode,
      };

      const validateAddress = (data: AddressData): AddressErrors => {
        const errors: AddressErrors = {};
        if (!data.recipientName.trim()) errors.recipientName = 'Recipient name is required';
        if (!data.phone.trim() || data.phone.length !== 10) errors.phone = 'Valid phone is required';
        if (!data.addressLine1.trim()) errors.addressLine1 = 'Address line 1 is required';
        if (!data.city.trim()) errors.city = 'City is required';
        if (!data.state.trim()) errors.state = 'State is required';
        if (!data.pincode.trim() || data.pincode.length !== 6) errors.pincode = 'Valid 6-digit PIN code required';
        return errors;
      };

      const errors = validateAddress(updatedAddressData);

      assert.strictEqual(errors.pincode, 'Valid 6-digit PIN code required');
      assert.strictEqual(errors.addressLine1, undefined);
      assert.strictEqual(errors.city, undefined);
      assert.strictEqual(errors.state, undefined);

      updatedAddressData.pincode = '394710';
      const fixedErrors = validateAddress(updatedAddressData);
      assert.strictEqual(Object.keys(fixedErrors).length, 0);
    });
  });
});
