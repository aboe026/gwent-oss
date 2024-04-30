import { ObjectId } from 'mongodb'

import EffectResolver from '../../src/graphql/resolvers/effect-resolver'

describe('effect-resolver', () => {
  describe('id', () => {
    it('returns _id as string', () => {
      const id = '000000000000000000000002'
      expect(
        (EffectResolver.id as any)({
          _id: new ObjectId(id),
        })
      ).toEqual(id)
    })
  })
})
