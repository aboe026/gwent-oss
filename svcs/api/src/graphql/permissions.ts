import { allow, rule, shield } from 'graphql-shield'

import env from '../env'
import { NODE_ENV } from '@gwent/env'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'

/**
 * Check if a user is authenticated (has logged in)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
export function isAuthenticated(parent: any, args: any, context: any, info: any) {
  if (!context?.session?.user?._id) {
    return Error(NOT_AUTHENTICATED_MESSAGE)
  }
  return true
}

/**
 * Throws error if rule is not defined for Query/Mutation
 * to prevent someone for forgetting to explicitly set them
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
export function fallback(parent: any, args: any, ctx: any, info: any) {
  switch (info.parentType.name) {
    case 'Query':
      return false
    case 'Mutation':
      return false
    default:
      return true
  }
}

const isAuthenticatedRule = rule({ cache: 'contextual' })(isAuthenticated)
const fallbackRule = rule({ cache: false })(fallback)

export default shield(
  {
    Query: {
      build: allow,
      getCurrentUser: isAuthenticatedRule,
      leaders: isAuthenticatedRule,
      units: isAuthenticatedRule,
      version: allow,
    },
    Mutation: {
      addUser: allow,
      login: allow,
      logout: allow,
    },
  },
  {
    allowExternalErrors: env().NODE_ENV === NODE_ENV.Dev,
    debug: env().NODE_ENV === NODE_ENV.Dev,
    fallbackRule,
    fallbackError: 'Error!',
  }
)
