import { ApolloError } from '@apollo/client'

export function getApolloError(error: ApolloError | undefined): string {
  let resolvedError = ''
  if (error?.networkError && 'result' in error.networkError) {
    resolvedError = error.networkError.result.errors.map((error: { message: string }) => error.message).join('\n')
  } else if (error?.message) {
    resolvedError = error.message
  }
  return resolvedError
}
