export interface ReverseGeocodeResult {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  hasValidPincode: boolean;
  formattedAddress: string;
  provider: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeolocationNotice {
  message: string;
  pincodeMissing: boolean;
}
