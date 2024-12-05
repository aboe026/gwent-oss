import { ObjectId } from 'mongodb'

import { Dlc } from '@gwent/graphql-schema/resolver-typings'
import { DlcDbObject } from '@gwent/graphql-schema/database-typings'
import DlcResolver from '../../src/graphql/resolvers/types/dlc-resolver'
import DlcStore from '../../src/database/stores/dlc-store'
import TestUtil from '../test-util'
import Verifier from '../../src/util/verifier'

describe('dlc-resolver', () => {
  describe('fromObject', () => {
    it('returns dlc object if defined', () => {
      const dlc = TestUtil.getDbDlc()
      expect(DlcResolver.fromObject(dlc)).toEqual({
        created: dlc.created,
        id: dlc._id.toString(),
        image: dlc.image,
        key: dlc.key,
        name: dlc.name,
      })
    })
  })
  describe('fromId', () => {
    it('calls to fromIds and returns first result if ObjectId', async () => {
      const id = new ObjectId()
      await testResolveFromId({
        id,
        fromIdsCalls: [[[id]]],
      })
    })
    it('calls to fromIds and returns first result if string', async () => {
      const id = new ObjectId().toString()
      await testResolveFromId({
        id,
        fromIdsCalls: [[[id]]],
      })
    })
  })
  describe('fromIds', () => {
    it('throws error if verifyObjects throws error', async () => {
      const dlc = TestUtil.getDbDlc()
      await testResolveFromIds({
        ids: [dlc._id],
        dlcGetResponse: [],
        verifyObjectsError: `Could not find dlcs "["${dlc._id}"]" to resolve.`,
        dlcGetCalls: [
          [
            {
              ids: [dlc._id],
            },
          ],
        ],
      })
    })
    it('returns empty array if given empty array', async () => {
      await testResolveFromIds({
        ids: [],
        dlcResolveObjectResponse: [],
      })
    })
    it('returns single dlc if single ObjectId', async () => {
      const dlc = TestUtil.getDbDlc()
      await testResolveFromIds({
        ids: [dlc._id],
        dlcGetResponse: [dlc],
        dlcResolveObjectResponse: [TestUtil.getDlcFromDbDlc(dlc)],
        dlcGetCalls: [
          [
            {
              ids: [dlc._id],
            },
          ],
        ],
        dlcResolveObjectCalls: [[dlc]],
      })
    })
    it('returns single dlc if single string', async () => {
      const dlc = TestUtil.getDbDlc()
      await testResolveFromIds({
        ids: [dlc._id.toString()],
        dlcGetResponse: [dlc],
        dlcResolveObjectResponse: [TestUtil.getDlcFromDbDlc(dlc)],
        dlcGetCalls: [
          [
            {
              ids: [dlc._id.toString()],
            },
          ],
        ],
        dlcResolveObjectCalls: [[dlc]],
      })
    })
    it('returns multiple dlcs if ObjectId and string', async () => {
      const dlc1 = TestUtil.getDbDlc()
      const dlc2 = TestUtil.getDbDlc()
      await testResolveFromIds({
        ids: [dlc1._id, dlc2._id.toString()],
        dlcGetResponse: [dlc1, dlc2],
        dlcResolveObjectResponse: [TestUtil.getDlcFromDbDlc(dlc1), TestUtil.getDlcFromDbDlc(dlc2)],
        dlcGetCalls: [
          [
            {
              ids: [dlc1._id, dlc2._id.toString()],
            },
          ],
        ],
        dlcResolveObjectCalls: [[dlc1], [dlc2]],
      })
    })
  })
})

async function testResolveFromId({ id, fromIdsCalls = [] }: { id: ObjectId | string; fromIdsCalls?: any[][] }) {
  const dlc = TestUtil.getDlc({
    id,
  })
  const dlcResolverSpy = jest.spyOn(DlcResolver, 'fromIds').mockResolvedValue([dlc])

  await expect(DlcResolver.fromId(id)).resolves.toEqual(dlc)

  expect(dlcResolverSpy.mock.calls).toEqual(fromIdsCalls)
}

async function testResolveFromIds({
  ids,
  dlcGetResponse = [],
  verifyObjectsError,
  dlcResolveObjectResponse = [],
  dlcGetCalls = [],
  dlcResolveObjectCalls = [],
}: {
  ids: (ObjectId | string)[]
  dlcGetResponse?: DlcDbObject[]
  verifyObjectsError?: string
  dlcResolveObjectResponse?: Dlc[]
  dlcGetCalls?: any[][]
  dlcResolveObjectCalls?: any[][]
}) {
  const dlcGetSpy = jest.spyOn(DlcStore, 'get').mockResolvedValue(dlcGetResponse)
  const verifyObjectsSpy = jest.spyOn(Verifier, 'checkObjects')
  if (verifyObjectsError) {
    verifyObjectsSpy.mockImplementation(() => {
      throw Error(verifyObjectsError)
    })
  } else {
    verifyObjectsSpy.mockReturnValue()
  }
  const dlcResolveObjectSpy = jest.spyOn(DlcResolver, 'fromObject')
  for (const dlc of dlcResolveObjectResponse) {
    dlcResolveObjectSpy.mockReturnValueOnce(dlc)
  }

  const promise = DlcResolver.fromIds(ids)
  if (verifyObjectsError) {
    await expect(promise).rejects.toThrow(Error(verifyObjectsError))
  } else {
    await expect(promise).resolves.toEqual(dlcResolveObjectResponse)
  }

  expect(dlcGetSpy.mock.calls).toEqual(dlcGetCalls)
  expect(verifyObjectsSpy.mock.calls).toEqual(
    ids.length === 0
      ? []
      : [
          [
            {
              expectedKeys: ids,
              objects: dlcGetResponse,
              field: '_id',
              logger: DlcResolver['logger'],
              label: 'dlcs',
            },
          ],
        ]
  )
  expect(dlcResolveObjectSpy.mock.calls).toEqual(dlcResolveObjectCalls)
}
