/**
 * Apollo Client for HANCR Admin Panel
 * Connects to admin-api at port 3002
 */
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import Cookies from 'js-cookie';

const ADMIN_API_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:3002/graphql';

const TOKEN_COOKIE = 'hancr_admin_token';
const ADMIN_COOKIE = 'hancr_admin_user';

// ─── HTTP + Auth links ──────────────────────────────────────────────────────
const httpLink = createHttpLink({ uri: ADMIN_API_URL });

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? Cookies.get(TOKEN_COOKIE) : null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'network-only' },
    query: { fetchPolicy: 'network-only' },
  },
});

// ─── Token helpers ──────────────────────────────────────────────────────────

export function saveAdminToken(token: string): void {
  Cookies.set(TOKEN_COOKIE, token, { expires: 7, sameSite: 'Strict' });
}

export function clearAdminToken(): void {
  Cookies.remove(TOKEN_COOKIE);
  Cookies.remove(ADMIN_COOKIE);
}

export function getAdminToken(): string | undefined {
  return typeof window !== 'undefined' ? Cookies.get(TOKEN_COOKIE) : undefined;
}

// ─── Admin profile helpers (persistence across page refresh) ────────────────

export interface AdminProfile {
  id: number;
  email: string;
  role: string;
}

export function saveAdminProfile(admin: AdminProfile): void {
  Cookies.set(ADMIN_COOKIE, JSON.stringify(admin), {
    expires: 7,
    sameSite: 'Strict',
  });
}

export function getAdminProfile(): AdminProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = Cookies.get(ADMIN_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminProfile;
  } catch {
    return null;
  }
}
