import { ApolloError } from '@apollo/client'

/**
 * Get any potential errors returned by the GraphQL query/mutation and formats them in a newline-separated string.
 *
 * @param error The potential errors thrown by a GraphQL query/mutation.
 * @returns The potential errors in a newline-separated string. Empty string if no errors thrown.
 */
export function getApolloError(error: ApolloError | undefined): string {
  let resolvedError = ''
  if (error?.networkError && 'result' in error.networkError) {
    resolvedError = error.networkError.result.errors.map((error: { message: string }) => error.message).join('\n')
  } else if (error?.message) {
    resolvedError = error.message
  }
  return resolvedError
}
