import { ObjectId } from 'mongodb'

import FactionScoiaTaelAbility from '../../src/graphql/resolvers/mutations/set-order/faction-scoiatael-ability'
import { GamePlayerDbObject, ImpactDbObject } from '@gwent-oss/graphql-schema/database-typings'
import { MoveType } from '@gwent-oss/graphql-schema'
import TestUtil from '../util/test-util'
import UpdateHistory from '../../src/graphql/resolvers/mutations/util/update-history'

describe('FactionScoiaTaelAbility', () => {
  describe('attemptAbility', () => {
    const logPrefix = 'log-prefix'
    const scoiaTaelFactionId = new ObjectId().toString()
    const userIdsForOrder = [new ObjectId().toString(), new ObjectId().toString()]
    it('does nothing if no scoiatael players', () => {
      testAttemptAbility({
        logPrefix,
        scoiaTaelFactionId,
        scoiaTaelPlayers: [],
        userIdsForOrder,
        debugCalls: [
          [`${logPrefix} no players with Scoia'Tael faction "${scoiaTaelFactionId}", not triggering faction ability.`],
        ],
      })
    })
    it('calls to add move to player without impact if multiple scoiatael players', () => {
      testAttemptAbility({
        logPrefix,
        scoiaTaelFactionId,
        scoiaTaelPlayers: [TestUtil.getDbGamePlayer({}), TestUtil.getDbGamePlayer({})],
        userIdsForOrder,
        expectedImpacts: [],
        debugCalls: [
          [
            `${logPrefix} found multiple players with Scoia'Tael faction "${scoiaTaelFactionId}", not triggering faction ability.`,
          ],
        ],
      })
    })
    it('calls to add move to player with impact if single scoiatael player', () => {
      testAttemptAbility({
        logPrefix,
        scoiaTaelFactionId,
        scoiaTaelPlayers: [TestUtil.getDbGamePlayer({})],
        userIdsForOrder,
        expectedImpacts: [
          {
            user: new ObjectId(userIdsForOrder[0]),
          },
          {
            user: new ObjectId(userIdsForOrder[1]),
          },
        ],
        debugCalls: [
          [
            `${logPrefix} found single player with Scoia'Tael faction "${scoiaTaelFactionId}", triggering faction ability to set order.`,
          ],
        ],
      })
    })
  })
})

function testAttemptAbility({
  logPrefix,
  scoiaTaelFactionId,
  scoiaTaelPlayers,
  userIdsForOrder,
  expectedImpacts,
  debugCalls = [],
}: {
  logPrefix: string
  scoiaTaelFactionId: string
  scoiaTaelPlayers: GamePlayerDbObject[]
  userIdsForOrder: string[]
  expectedImpacts?: ImpactDbObject[]
  debugCalls?: string[][]
}) {
  const game = TestUtil.getDbGame({})
  const created = new Date()
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
  const addMoveToPlayerSpy = jest.spyOn(UpdateHistory, 'addMoveToPlayer').mockReturnValue()
  const debugSpy = jest.fn()
  FactionScoiaTaelAbility['logger'] = {
    debug: debugSpy,
  } as any

  expect(
    FactionScoiaTaelAbility.attemptAbility({
      game,
      logPrefix,
      scoiaTaelFactionId,
      scoiaTaelPlayers,
      userIdsForOrder,
    })
  ).toEqual(undefined)

  expect(dateSpy.mock.calls).toEqual(scoiaTaelPlayers.map(() => []))
  expect(addMoveToPlayerSpy.mock.calls).toEqual(
    scoiaTaelPlayers.map((scoiaTaelPlayer) => {
      return [
        {
          game,
          logPrefix,
          playerId: scoiaTaelPlayer.user,
          move: {
            created,
            faction: new ObjectId(scoiaTaelFactionId),
            type: MoveType.Faction,
            impacts: expectedImpacts,
          },
        },
      ]
    })
  )
  expect(debugSpy.mock.calls).toEqual(debugCalls)
}
