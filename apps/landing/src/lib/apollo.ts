/**
 * Apollo Client for HANCR Landing page.
 * Connects (client-side only) to admin-api at port 3002.
 *
 * All operations are PUBLIC (no auth) — used only for lead submission
 * from forms on the marketing site. Admin-side queries go through
 * the separate admin-panel client.
 */
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from '@apollo/client';

const ADMIN_API_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'https://api.hancr.com/graphql';

export const apolloClient = new ApolloClient({
  link: createHttpLink({ uri: ADMIN_API_URL }),
  cache: new InMemoryCache(),
  defaultOptions: {
    mutate: { fetchPolicy: 'no-cache' },
    query: { fetchPolicy: 'network-only' },
  },
});
