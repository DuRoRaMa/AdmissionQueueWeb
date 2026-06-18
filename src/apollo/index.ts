import { ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { setContext } from '@apollo/client/link/context';

function getAuthToken(): string {
  return localStorage.getItem('token') || '';
}

const httpLink = createHttpLink({
  uri: `${import.meta.env.VITE_BASE_URL}/graphql`
});

const authLink = setContext((_, { headers }) => {
  const token = getAuthToken();

  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: `${import.meta.env.VITE_WS_URL}/graphql/`,
    connectionParams: () => {
      const token = getAuthToken();

      return {
        ...(token ? { token } : {})
      };
    },
    shouldRetry: () => true
  })
);

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);

    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

const cache = new InMemoryCache();

const apolloClient = new ApolloClient({
  link,
  cache
});

export default apolloClient;
