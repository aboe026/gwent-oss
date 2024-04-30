import { ObjectId } from 'mongodb'

import DlcResolver from '../../src/graphql/resolvers/dlc-resolver'

describe('dlc-resolver', () => {
  describe('id', () => {
    it('returns _id as string', () => {
      const id = '000000000000000000000002'
      expect(
        (DlcResolver.id as any)({
          _id: new ObjectId(id),
        })
      ).toEqual(id)
    })
  })
})
