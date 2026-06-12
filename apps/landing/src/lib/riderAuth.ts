/**
 * Rider web auth — مصادقة الراكب من المتصفح (موقع ثابت → توكن client-side).
 * يكلّم rider-api مباشرةً (نفس نمط تطبيق الموبايل: OTP ثم Bearer token).
 *
 * ملاحظة أمنية: التوكن في localStorage (مطابق لسلوك التطبيق). تحصين لاحق
 * ممكن (httpOnly cookie) يتطلّب تحويل الموقع من static-export إلى SSR.
 */

const RIDER_API_URL =
  process.env.NEXT_PUBLIC_RIDER_API_URL ?? 'https://api.hancr.com/rider/graphql';

const TOKEN_KEY = 'hancr_rider_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

type GqlResult<T> = { data?: T; errors?: { message: string }[] };

async function gql<T>(
  query: string,
  variables: Record<string, unknown>,
  authed = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (authed) {
    const t = getToken();
    if (t) headers['authorization'] = `Bearer ${t}`;
  }
  const res = await fetch(RIDER_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as GqlResult<T>;
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  if (!json.data) throw new Error('No data');
  return json.data;
}

export async function sendOtp(
  phone: string,
): Promise<{ success: boolean; message: string }> {
  const data = await gql<{ sendOtp: { success: boolean; message: string } }>(
    `mutation SendOtp($input: SendOtpInput!) { sendOtp(input: $input) { success message } }`,
    { input: { phone } },
  );
  return data.sendOtp;
}

export interface RiderProfile {
  id: number;
  phoneNumber: string;
  firstName?: string | null;
  lastName?: string | null;
  balance: number;
  currency: string;
  rating: number;
  totalRides: number;
}

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<{ accessToken: string; rider: RiderProfile; isNewUser: boolean }> {
  const data = await gql<{
    verifyOtp: {
      accessToken: string;
      rider: RiderProfile;
      isNewUser: boolean;
    };
  }>(
    `mutation VerifyOtp($input: VerifyOtpInput!) {
      verifyOtp(input: $input) {
        accessToken
        isNewUser
        rider { id phoneNumber firstName lastName balance currency rating totalRides }
      }
    }`,
    { input: { phone, code } },
  );
  setToken(data.verifyOtp.accessToken);
  return data.verifyOtp;
}

export interface RiderRide {
  id: number;
  status: string;
  costAfterCoupon: number;
  currency: string;
  createdOn: string;
}

/** يجلب بيانات الراكب الحالي (يتطلّب توكن). */
export async function fetchMe(): Promise<RiderProfile> {
  const data = await gql<{ me: RiderProfile }>(
    `query Me { me { id phoneNumber firstName lastName balance currency rating totalRides } }`,
    {},
    true,
  );
  return data.me;
}

export interface WebService {
  id: number;
  name: string;
  nameEn?: string | null;
}

export async function fetchServices(regionId = 1): Promise<WebService[]> {
  const data = await gql<{ services: WebService[] }>(
    `query Services($regionId: Int!) { services(regionId: $regionId) { id name nameEn } }`,
    { regionId },
    true,
  );
  return data.services ?? [];
}

export interface WebSavedPlace {
  id: number;
  label: string;
  address?: string | null;
  lat: number;
  lng: number;
}

export async function fetchSavedPlaces(): Promise<WebSavedPlace[]> {
  const data = await gql<{ savedPlaces: WebSavedPlace[] }>(
    `query SavedPlaces { savedPlaces { id label address lat lng } }`,
    {},
    true,
  );
  return data.savedPlaces ?? [];
}

export interface RouteEstimate {
  distanceMeters: number;
  durationSeconds: number;
  estimatedFare: number;
  currency: string;
}

export async function routePreview(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  serviceId: number,
): Promise<RouteEstimate> {
  const data = await gql<{ routePreview: RouteEstimate }>(
    `query RoutePreview($input: RoutePreviewInput!) {
      routePreview(input: $input) {
        distanceMeters durationSeconds estimatedFare currency
      }
    }`,
    { input: { origin, destination, serviceId } },
    true,
  );
  return data.routePreview;
}

/** إنشاء طلب رحلة فعلي من الويب (نفس mutation التطبيق، authed). */
export async function createOrder(input: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  originAddress: string;
  destinationAddress: string;
  serviceId: number;
  regionId?: number;
}): Promise<{ id: number; status: string }> {
  const data = await gql<{ createOrder: { id: number; status: string } }>(
    `mutation CreateOrder($input: CreateOrderInput!) {
      createOrder(input: $input) { id status }
    }`,
    {
      input: {
        points: [input.origin, input.destination],
        addresses: [input.originAddress, input.destinationAddress],
        serviceId: input.serviceId,
        regionId: input.regionId ?? 1,
      },
    },
    true,
  );
  return data.createOrder;
}
