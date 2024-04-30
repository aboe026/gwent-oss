import { allow, rule, shield } from 'graphql-shield'

import env from '../env'
import { NODE_ENV } from '@gwent/env'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'

export const NO_RULE_DEFINED = 'No rule defined.'

/**
 * Check if a user is authenticated (has logged in).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
export function isAuthenticated(parent: any, args: any, context: any, info: any) {
  if (!context?.session?.user?._id) {
    return Error(NOT_AUTHENTICATED_MESSAGE)
  }
  return true
}

/**
 * Throws error if rule is not defined for Query/Mutation.
 * to prevent someone for forgetting to explicitly set them.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars
export function fallback(parent: any, args: any, ctx: any, info: any) {
  const noRuleDefinedError = Error(NO_RULE_DEFINED)
  switch (info.parentType.name) {
    case 'Query':
      return noRuleDefinedError
    case 'Mutation':
      return noRuleDefinedError
    default:
      return true
  }
}

const isAuthenticatedRule = rule({ cache: 'contextual' })(isAuthenticated)
const fallbackRule = rule({ cache: false })(fallback)

export default shield(
  {
    Query: {
      application: allow,
      currentUser: isAuthenticatedRule,
      decks: isAuthenticatedRule,
      factions: isAuthenticatedRule,
      leaders: isAuthenticatedRule,
      settings: isAuthenticatedRule,
      units: isAuthenticatedRule,
    },
    Mutation: {
      addDeck: isAuthenticatedRule,
      addUser: allow,
      login: allow,
      logout: allow,
    },
  },
  {
    allowExternalErrors: env().NODE_ENV === NODE_ENV.Dev,
    debug: env().NODE_ENV === NODE_ENV.Dev,
    fallbackRule,
    fallbackError: 'Internal Server Error.',
  }
)
