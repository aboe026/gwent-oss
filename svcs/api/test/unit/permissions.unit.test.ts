import { ObjectId } from 'mongodb'

import { fallback, isAuthenticated } from '../../src/graphql/permissions'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'

describe('permissions', () => {
  describe('fallback', () => {
    it('returns false if parentType is Query', () => {
      const info = {
        parentType: {
          name: 'Query',
        },
      }
      expect(fallback(undefined, undefined, undefined, info)).toEqual(false)
    })
    it('returns false if parentType is Mutation', () => {
      const info = {
        parentType: {
          name: 'Mutation',
        },
      }
      expect(fallback(undefined, undefined, undefined, info)).toEqual(false)
    })
    it('returns true if parentType is neither Query or Mutation', () => {
      const info = {
        parentType: {
          name: 'User',
        },
      }
      expect(fallback(undefined, undefined, undefined, info)).toEqual(true)
    })
  })
  describe('isAuthenticated', () => {
    it('returns error if session undefined', () => {
      const context = {
        session: undefined,
      }
      expect(isAuthenticated(undefined, undefined, context, undefined)).toEqual(Error(NOT_AUTHENTICATED_MESSAGE))
    })
    it('returns true if user defined on session', () => {
      const context = {
        session: {
          user: {
            _id: new ObjectId(),
          },
        },
      }
      expect(isAuthenticated(undefined, undefined, context, undefined)).toEqual(true)
    })
  })
})
