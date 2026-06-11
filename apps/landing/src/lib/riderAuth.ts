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

export async function sendOtp(phone: string): Promise<void> {
  await gql(
    `mutation SendOtp($input: SendOtpInput!) { sendOtp(input: $input) { success } }`,
    { input: { phone } },
  );
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
