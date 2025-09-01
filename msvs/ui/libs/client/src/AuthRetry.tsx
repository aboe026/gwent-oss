import { ApolloClient } from '@apollo/client'
import { useEffect } from 'react'

import { Exact } from '@gwent/graphql-schema/apollo-typings'
import { useUserContext } from './UserContext'

/**
 * Allow user to re-authenticate with system to retry operation if their session times out.
 *
 * @param error The Error to check for authentication failure.
 * @param operation The GraphQL operation to perform after user successfully authenticates.
 */
export function useAuthRetry<T>(
  error: unknown,
  operation: (variables?: Partial<Exact<{ [key: string]: never }>> | undefined) => Promise<ApolloClient.QueryResult<T>>
) {
  const { checkAuth } = useUserContext()
  useEffect(() => {
    if (error) {
      checkAuth(error, operation)
    }
  }, [error])
}
