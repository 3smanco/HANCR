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
  let res: Response;
  try {
    res = await fetch(RIDER_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    // فشل الشبكة (لا اتصال / DNS / CORS) — لا استجابة من الخادم أصلاً.
    throw new Error('NETWORK_ERROR');
  }
  if (!res.ok && res.status >= 500) {
    throw new Error(`SERVER_ERROR:${res.status}`);
  }
  let json: GqlResult<T>;
  try {
    json = (await res.json()) as GqlResult<T>;
  } catch {
    throw new Error(`SERVER_ERROR:${res.status}`);
  }
  if (json.errors?.length) {
    // أخطاء GraphQL (تحقّق/منطق أعمال) — رسالة الخادم قابلة للعرض.
    throw new Error(`VALIDATION:${json.errors[0].message}`);
  }
  if (!json.data) throw new Error(`SERVER_ERROR:${res.status}`);
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

/** رمز ربط مؤقّت من دخول Google/الإيميل — يُمرَّر مع verifyOtp لربط الهوية. */
let pendingToken: string | null = null;

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
    { input: { phone, code, pendingToken } },
  );
  pendingToken = null; // استُهلك رمز الربط
  setToken(data.verifyOtp.accessToken);
  return data.verifyOtp;
}

// ─── دخول الإيميل (OTP) + Google ───
export interface WebAuthResult {
  success: boolean;
  needsPhone: boolean;
  accessToken?: string | null;
  rider?: RiderProfile | null;
  isNewUser?: boolean | null;
  message?: string | null;
}

const AUTH_RESULT_FIELDS = `
  success needsPhone pendingToken accessToken isNewUser message
  rider { id phoneNumber firstName lastName balance currency rating totalRides }
`;

export async function sendEmailOtp(
  email: string,
): Promise<{ success: boolean; message: string }> {
  const data = await gql<{ sendEmailOtp: { success: boolean; message: string } }>(
    `mutation SendEmailOtp($input: SendEmailOtpInput!) { sendEmailOtp(input: $input) { success message } }`,
    { input: { email } },
  );
  return data.sendEmailOtp;
}

/** يعالج AuthResult: دخول كامل (setToken) أو needsPhone (حفظ pendingToken). */
function handleAuthResult(r: WebAuthResult & { pendingToken?: string | null }): WebAuthResult {
  if (r.needsPhone) {
    pendingToken = r.pendingToken ?? null;
    return r;
  }
  if (r.accessToken) setToken(r.accessToken);
  return r;
}

export async function verifyEmailOtp(
  email: string,
  code: string,
): Promise<WebAuthResult> {
  const data = await gql<{ verifyEmailOtp: WebAuthResult & { pendingToken?: string | null } }>(
    `mutation VerifyEmailOtp($input: VerifyEmailOtpInput!) {
      verifyEmailOtp(input: $input) { ${AUTH_RESULT_FIELDS} }
    }`,
    { input: { email, code } },
  );
  return handleAuthResult(data.verifyEmailOtp);
}

export async function googleAuth(idToken: string): Promise<WebAuthResult> {
  const data = await gql<{ googleAuth: WebAuthResult & { pendingToken?: string | null } }>(
    `mutation GoogleAuth($input: GoogleAuthInput!) {
      googleAuth(input: $input) { ${AUTH_RESULT_FIELDS} }
    }`,
    { input: { idToken } },
  );
  return handleAuthResult(data.googleAuth);
}

/** تسجيل الخروج: يُبطل الجلسة على الخادم ثم يمسح التوكن محلياً. */
export async function logout(): Promise<void> {
  try {
    await gql(`mutation { logout }`, {}, true);
  } catch {
    // حتى لو فشل الإبطال على الخادم، نمسح محلياً.
  }
  pendingToken = null;
  clearToken();
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

export async function fetchServices(regionId: number): Promise<WebService[]> {
  const data = await gql<{ services: WebService[] }>(
    `query Services($regionId: Int!) { services(regionId: $regionId) { id name nameEn } }`,
    { regionId },
    true,
  );
  return data.services ?? [];
}

export interface RegionLookup {
  id: number;
  name: string;
  nameEn: string;
  currency: string;
  countryId?: number | null;
  cityId?: number | null;
}

/** يحدّد المنطقة المخدومة عند نقطة جغرافية (عام، بلا مصادقة). */
export async function nearestRegion(
  lat: number,
  lng: number,
): Promise<RegionLookup | null> {
  const data = await gql<{ nearestRegion: RegionLookup | null }>(
    `query NearestRegion($lat: Float!, $lng: Float!) {
      nearestRegion(lat: $lat, lng: $lng) { id name nameEn currency countryId cityId }
    }`,
    { lat, lng },
  );
  return data.nearestRegion;
}

/** قائمة المناطق المفعّلة عالمياً (عام، بلا مصادقة) — لصفحة /cities. */
export async function activeRegions(): Promise<RegionLookup[]> {
  const data = await gql<{ activeRegions: RegionLookup[] }>(
    `query ActiveRegions { activeRegions { id name nameEn currency countryId cityId } }`,
    {},
  );
  return data.activeRegions ?? [];
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
  polyline?: string | null;
}

export async function routePreview(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  serviceId: number,
): Promise<RouteEstimate> {
  const data = await gql<{ routePreview: RouteEstimate }>(
    `query RoutePreview($input: RoutePreviewInput!) {
      routePreview(input: $input) {
        distanceMeters durationSeconds estimatedFare currency polyline
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
  regionId: number;
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
        regionId: input.regionId,
      },
    },
    true,
  );
  return data.createOrder;
}
