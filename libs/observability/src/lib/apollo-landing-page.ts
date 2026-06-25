import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

export function buildApolloLandingPagePlugins() {
  if (process.env['NODE_ENV'] === 'production') {
    return [];
  }

  return [ApolloServerPluginLandingPageLocalDefault()];
}
