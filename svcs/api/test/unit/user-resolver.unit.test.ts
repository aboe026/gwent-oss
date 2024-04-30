import { ObjectId } from 'mongodb'

import UserResolver from '../../src/graphql/resolvers/user-resolver'

describe('user-resolver', () => {
  describe('id', () => {
    it('returns _id as string', () => {
      const id = '000000000000000000000002'
      expect(
        (UserResolver.id as any)({
          _id: new ObjectId(id),
        })
      ).toEqual(id)
    })
  })
})
