import { Coordinates, ReverseGeocodeResult } from './types';

export function isGeolocationSupported(): boolean {
  return typeof window !== 'undefined' && 'geolocation' in navigator;
}

export function formatGeolocationErrorMessage(error: any): string {
  if (!error) {
    return 'An unexpected error occurred while requesting your location. Please enter your address manually.';
  }

  // Handle standard GeolocationPositionError codes
  if (typeof error.code === 'number') {
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        return 'Location permission was denied. Please enable location access in your browser or device settings, or enter your address manually.';
      case 2: // POSITION_UNAVAILABLE
        return 'Your location could not be determined. Please check your network or GPS connection, or enter your address manually.';
      case 3: // TIMEOUT
        return 'Location request timed out. Please try again or fill in your delivery address manually.';
      default:
        break;
    }
  }

  if (error.message && typeof error.message === 'string') {
    return error.message;
  }

  return 'Unable to retrieve your current location. Please enter your address manually.';
}

export function getUserCurrentCoordinates(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000,
  }
): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error('Geolocation is not supported by your browser. Please enter your address manually.'));
      return;
    }

    // In modern browsers, geolocation requires a secure context (HTTPS) or localhost
    if (
      typeof window !== 'undefined' &&
      window.isSecureContext === false &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      reject(new Error('Location access requires a secure HTTPS connection. Please enter your address manually.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (positionError) => {
        reject(positionError);
      },
      options
    );
  });
}

export async function resolveAddressFromCoordinates(
  coords: Coordinates
): Promise<ReverseGeocodeResult> {
  const response = await fetch('/api/location/reverse-geocode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      latitude: coords.latitude,
      longitude: coords.longitude,
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    const message =
      errorJson?.error?.message ||
      errorJson?.message ||
      `Could not resolve address for location (status ${response.status})`;
    throw new Error(message);
  }

  const json = await response.json();
  const addressResult: ReverseGeocodeResult = json?.data || json;

  if (!addressResult) {
    throw new Error('No address information returned for your current location.');
  }

  return addressResult;
}
