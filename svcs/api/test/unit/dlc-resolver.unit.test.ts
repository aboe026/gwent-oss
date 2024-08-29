import { DlcDbObject, DlcKey } from '@gwent/graphql-schema/database-typings'
import { DlcResolver } from '../../src/graphql/resolvers/dlc-resolver'
import { ObjectId } from 'mongodb'
import { Dlc } from '@gwent/graphql-schema/resolver-typings'
import DlcStore from '../../src/database/stores/dlc-store'

describe('dlc-resolver', () => {
  describe('resolveFromObject', () => {
    it('returns null if dlc not passed', () => {
      expect(DlcResolver.resolveFromObject()).toEqual(null)
    })
    it('returns null if dlc is undefined', () => {
      expect(DlcResolver.resolveFromObject(undefined)).toEqual(null)
    })
    it('returns null if dlc is null', () => {
      expect(DlcResolver.resolveFromObject(undefined)).toEqual(null)
    })
    it('returns dlc object if defined', () => {
      const dlc: DlcDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        image: 'dlc-image',
        key: DlcKey.BloodAndWine.toString(),
        name: 'dlc-name',
      }
      expect(DlcResolver.resolveFromObject(dlc)).toEqual({
        created: dlc.created,
        id: dlc._id.toString(),
        image: dlc.image,
        key: dlc.key,
        name: dlc.name,
      })
    })
  })
  describe('resolveFromId', () => {
    it('does not call to resolveFromIds and returns null if no id', async () => {
      await testResolveFromId({
        passId: false,
      })
    })
    it('does not call to resolveFromIds and returns null if undefined', async () => {
      await testResolveFromId({
        id: undefined,
      })
    })
    it('does not call to resolveFromIds and returns null if empty string', async () => {
      await testResolveFromId({
        id: '',
      })
    })
    it('calls to resolveFromIds and returns first result if ObjectId', async () => {
      const id = new ObjectId()
      await testResolveFromId({
        id,
        expected: true,
        resolveFromIdsCalls: [[[id]]],
      })
    })
  })
  describe('resolveFromIds', () => {
    it('returns empty array if given empty array', async () => {
      const dlcGetSpy = jest.spyOn(DlcStore, 'get').mockResolvedValue([])

      await expect(DlcResolver.resolveFromIds([])).resolves.toEqual([])

      expect(dlcGetSpy.mock.calls).toEqual([])
    })
    it('returns single dlc if single id', async () => {
      const dlc: DlcDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        image: 'dlc-iamge',
        key: DlcKey.BloodAndWine,
        name: 'dlc-name',
      }
      const dlcGetSpy = jest.spyOn(DlcStore, 'get').mockResolvedValue([dlc])

      await expect(DlcResolver.resolveFromIds([dlc._id])).resolves.toEqual([
        {
          created: dlc.created,
          id: dlc._id.toString(),
          image: dlc.image,
          key: DlcKey.BloodAndWine,
          name: dlc.name,
        },
      ])

      expect(dlcGetSpy.mock.calls).toEqual([
        [
          {
            ids: [dlc._id],
          },
        ],
      ])
    })
  })
})

async function testResolveFromId({
  id,
  passId = true,
  expected,
  resolveFromIdsCalls = [],
}: {
  id?: ObjectId | string
  passId?: boolean
  expected?: boolean
  resolveFromIdsCalls?: any[][]
}) {
  const dlc: Dlc = {
    created: new Date(),
    id: (id || '').toString(),
    image: 'dlc-image',
    key: DlcKey.BloodAndWine,
    name: 'dlc-name',
  }
  const dlcResolverSpy = jest.spyOn(DlcResolver, 'resolveFromIds').mockResolvedValue([dlc])

  await expect(passId ? DlcResolver.resolveFromId(id) : DlcResolver.resolveFromId()).resolves.toEqual(
    expected ? dlc : null
  )

  expect(dlcResolverSpy.mock.calls).toEqual(resolveFromIdsCalls)
}
