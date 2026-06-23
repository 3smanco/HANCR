/**
 * Apollo Client for HANCR Admin Panel
 * Connects to admin-api at port 3002
 */
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
  split,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import Cookies from 'js-cookie';

const ADMIN_API_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:3002/graphql';

const TOKEN_COOKIE = 'hancr_admin_token';
const ADMIN_COOKIE = 'hancr_admin_user';
const SESSION_COOKIE_OPTIONS = {
  expires: 7,
  sameSite: 'Strict' as const,
  path: '/',
};
const SESSION_COOKIE_REMOVE_OPTIONS = { path: '/' };

function sessionCookieOptions() {
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:';
  return secure
    ? { ...SESSION_COOKIE_OPTIONS, secure: true }
    : SESSION_COOKIE_OPTIONS;
}

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

// ─── WebSocket link (للاشتراكات الحيّة — SOS map / live) ─────────────────────
// نشتقّ عنوان ws من عنوان الـHTTP (http→ws, https→wss).
const wsLink =
  typeof window !== 'undefined'
    ? new GraphQLWsLink(
        createClient({
          url: ADMIN_API_URL.replace(/^http/, 'ws'),
          connectionParams: () => {
            const token = Cookies.get(TOKEN_COOKIE);
            return { authorization: token ? `Bearer ${token}` : '' };
          },
          retryAttempts: 5,
          shouldRetry: () => true,
        }),
      )
    : null;

// split: الاشتراكات → ws، الباقي → http+auth.
const splitLink =
  wsLink != null
    ? split(
        ({ query }) => {
          const def = getMainDefinition(query);
          return (
            def.kind === 'OperationDefinition' &&
            def.operation === 'subscription'
          );
        },
        wsLink,
        ApolloLink.from([authLink, httpLink]),
      )
    : ApolloLink.from([authLink, httpLink]);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'network-only' },
    query: { fetchPolicy: 'network-only' },
  },
});

// ─── Token helpers ──────────────────────────────────────────────────────────

export function saveAdminToken(token: string): void {
  Cookies.set(TOKEN_COOKIE, token, sessionCookieOptions());
}

export function clearAdminToken(): void {
  Cookies.remove(TOKEN_COOKIE, SESSION_COOKIE_REMOVE_OPTIONS);
  Cookies.remove(ADMIN_COOKIE, SESSION_COOKIE_REMOVE_OPTIONS);
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
  Cookies.set(ADMIN_COOKIE, JSON.stringify(admin), sessionCookieOptions());
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
