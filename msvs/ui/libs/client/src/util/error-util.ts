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

/**
 * Perform an operation, and retry if it initially fails due to an Authentication error.
 *
 * @param config The configuration used when executing the method.
 * @param config.checkAuth The method used to check whether the error is an Authentication error.
 * @param config.method The method to execute, potentially twice if there is an Authentication error.
 * @throws Error if the method fails due to an error not related to Authentication.
 */
export async function retryCheckingAuth({
  checkAuth,
  method,
}: {
  checkAuth: CheckAuth
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

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type CheckAuth = (error: ApolloError | undefined, callbackAfterReauth: Function) => void
