import { NextRequest } from 'next/server';
import { z } from 'zod';
import { geocodingService, checkRateLimit } from '@/server/services/geocoding.service';
import { handleApiError, successResponse } from '@/server/utils/api-response';

const reverseGeocodeSchema = z.object({
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
});

function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'anonymous-client';
}

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req);
    checkRateLimit(clientId);

    const body = await req.json();
    const { latitude, longitude } = reverseGeocodeSchema.parse(body);

    const address = await geocodingService.reverseGeocode(latitude, longitude);
    return successResponse(address);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req);
    checkRateLimit(clientId);

    const { searchParams } = new URL(req.url);
    const rawLat = parseFloat(searchParams.get('lat') || searchParams.get('latitude') || '');
    const rawLng = parseFloat(searchParams.get('lng') || searchParams.get('lon') || searchParams.get('longitude') || '');

    const { latitude, longitude } = reverseGeocodeSchema.parse({
      latitude: rawLat,
      longitude: rawLng,
    });

    const address = await geocodingService.reverseGeocode(latitude, longitude);
    return successResponse(address);
  } catch (error) {
    return handleApiError(error);
  }
}
