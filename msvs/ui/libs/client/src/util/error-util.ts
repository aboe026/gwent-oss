import {
  CombinedGraphQLErrors,
  CombinedProtocolErrors,
  LocalStateError,
  ServerError,
  ServerParseError,
  UnconventionalError,
} from '@apollo/client/errors'

/**
 * Get the messages of any potential errors returned by the GraphQL query/mutation and formats them in a newline-separated string.
 *
 * @param error The potential error thrown by a GraphQL query/mutation.
 * @returns The potential error messages in a newline-separated string. Empty string if no errors thrown.
 */
export function getErrorMessages(error: unknown): string {
  const resolvedErrors: string[] = []

  if (error) {
    if (CombinedGraphQLErrors.is(error)) {
      // Handle GraphQL errors
      for (const graphqlError of error.errors) {
        resolvedErrors.push(graphqlError.message)
      }
    } else if (CombinedProtocolErrors.is(error)) {
      // Handle multipart subscription protocol errors
      for (const protocolError of error.errors) {
        resolvedErrors.push(protocolError.message)
      }
    } else if (LocalStateError.is(error)) {
      // Handle errors thrown by the `LocalState` class
      resolvedErrors.push(error.message)
    } else if (ServerError.is(error)) {
      // Handle server HTTP errors
      resolvedErrors.push(error.message)
    } else if (ServerParseError.is(error)) {
      // Handle JSON parse errors
      resolvedErrors.push(error.message)
    } else if (UnconventionalError.is(error)) {
      // Handle errors thrown by irregular types
      resolvedErrors.push(error.message)
    } else if (error instanceof Error) {
      // Handle other errors
      resolvedErrors.push(error.message)
    } else {
      // Handle case where we don't know what the error object is
      console.error(error)
      resolvedErrors.push(JSON.stringify(error))
    }
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
    checkAuth(error, method)
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type CheckAuth = (error: unknown, callbackAfterReauth: Function) => void
