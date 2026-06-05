'use client';

import { ApolloProvider } from '@apollo/client';
import type { ReactNode } from 'react';
import { apolloClient } from '@/lib/apollo';

export function ApolloWrapper({ children }: { children: ReactNode }) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
