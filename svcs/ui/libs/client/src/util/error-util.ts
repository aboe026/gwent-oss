import { ApolloError } from '@apollo/client'

/**
 * Get any potential errors returned by the GraphQL query/mutation and formats them in a newline-separated string.
 *
 * @param error The potential errors thrown by a GraphQL query/mutation.
 * @returns The potential errors in a newline-separated string. Empty string if no errors thrown.
 */
export function getApolloError(error: ApolloError | undefined): string {
  const resolvedErrors: string[] = []
  if (error?.graphQLErrors) {
    for (const graphqlError of error.graphQLErrors) {
      if (!resolvedErrors.includes(graphqlError.message)) {
        resolvedErrors.push(graphqlError.message)
      }
    }
  }
  if (error?.clientErrors) {
    for (const clientError of error.clientErrors) {
      if (!resolvedErrors.includes(clientError.message)) {
        resolvedErrors.push(clientError.message)
      }
    }
  }
  if (error?.protocolErrors) {
    for (const protocolError of error.protocolErrors) {
      if (!resolvedErrors.includes(protocolError.message)) {
        resolvedErrors.push(protocolError.message)
      }
    }
  }
  if (error?.networkError && !resolvedErrors.includes(error.networkError.message)) {
    resolvedErrors.push(error.networkError.message)
  }
  if (error?.message && !resolvedErrors.includes(error.message)) {
    resolvedErrors.push(error.message)
  }
  return resolvedErrors.join('\n')
}

export async function retryCheckingAuth({
  checkAuth,
  method,
}: {
  // eslint-disable-next-line @typescript-eslint/ban-types
  checkAuth: (error: ApolloError | undefined, callbackAfterReauth: Function) => void
  method: () => Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
  try {
    await method()
  } catch (error: unknown) {
    if (error instanceof ApolloError) {
      checkAuth(error, method)
    } else {
      throw error
    }
  }
}
