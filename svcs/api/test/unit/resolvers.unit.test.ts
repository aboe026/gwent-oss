import { ObjectId } from 'mongodb'

import AppInfo from '../../src/app-info'
import CardStore from '../../src/database/card-store'
import resolvers from '../../src/graphql/resolvers'
import { version } from '../../package.json'

describe('resolvers', () => {
  describe('leader', () => {
    it('returns _id as string for id field', () => {
      const id = '000000000000000000000002'
      expect(
        (resolvers.Leader as any).id({
          _id: new ObjectId(id),
        })
      ).toEqual(id)
    })
  })
  describe('unit', () => {
    it('returns _id as string for id field', () => {
      const id = '000000000000000000000002'
      expect(
        (resolvers.Unit as any).id({
          _id: new ObjectId(id),
        })
      ).toEqual(id)
    })
  })
  describe('query', () => {
    describe('leaders', () => {
      it('calls out to card store getLeaders method', async () => {
        const value: any[] = []
        const getLeadersSpy = jest.spyOn(CardStore, 'getLeaders').mockResolvedValue(value)

        await expect((resolvers.Query as any).leaders()).resolves.toEqual(value)

        expect(getLeadersSpy.mock.calls).toEqual([[]])
      })
    })
    describe('units', () => {
      it('calls out to card store getUnits method', async () => {
        const value: any[] = []
        const getUnitsSpy = jest.spyOn(CardStore, 'getUnits').mockResolvedValue(value)

        await expect((resolvers.Query as any).units()).resolves.toEqual(value)

        expect(getUnitsSpy.mock.calls).toEqual([[]])
      })
    })
    describe('version', () => {
      it('returns package json version', () => {
        expect((resolvers.Query as any).version()).toEqual(version)
      })
    })
    describe('build', () => {
      it('calls out to app info getBuildNumber method', async () => {
        const value = 1
        const getBuildNumberSpy = jest.spyOn(AppInfo, 'getBuildNumber').mockResolvedValue(value)

        await expect((resolvers.Query as any).build()).resolves.toEqual(value)

        expect(getBuildNumberSpy.mock.calls).toEqual([[]])
      })
    })
  })
})
