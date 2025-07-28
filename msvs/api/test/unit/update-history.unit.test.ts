import { ObjectId } from 'mongodb'

import {
  Combat,
  ImpactDbObject,
  MoveUnitDbObject,
  MoveReasonType,
  GameUnitOrigin,
} from '@gwent/graphql-schema/database-typings'
import GetBattlefieldUnit, {
  BattlefieldUnit,
} from '../../src/graphql/resolvers/mutations/play-unit/get-battlefield-unit'
import { MoveType } from '@gwent/graphql-schema'
import { MusteredOrigins } from '../../src/graphql/resolvers/mutations/play-unit/muster-battlefield'
import TestUtil from '../util/test-util'
import UpdateHistory from '../../src/graphql/resolvers/mutations/play-unit/update-history'

describe('update-history', () => {
  describe('newUnitDeployed', () => {
    const logPrefix = 'log-prefix'
    it('throws error if musters without origin', () => {
      const message = 'No origins provided for musters'
      testUpdateHistory({
        musters: [],
        logPrefix,
        error: Error(`${message}.`),
        errorCalls: [[`${logPrefix} failed: ${message}, musters: "[]"`]],
      })
    })
  })
})

function testUpdateHistory({
  combat = Combat.Close,
  scorches,
  musters,
  strengths,
  musteredOrigins,
  logPrefix,
  getBattlefieldUnitResponses = [
    {
      row: Combat.Close,
      unit: TestUtil.getDbGameUnit({}),
    },
  ],
  error,
  errorCalls = [],
}: {
  combat?: Combat | null | undefined
  scorches?: ImpactDbObject[] | undefined
  musters?: ImpactDbObject[] | undefined
  strengths?: ImpactDbObject[] | undefined
  musteredOrigins?: MusteredOrigins | undefined
  logPrefix: string
  getBattlefieldUnitResponses?: BattlefieldUnit[]
  error?: Error
  errorCalls?: string[][]
}) {
  const deckUnit = TestUtil.getDbDeckUnit({})
  const playerId = new ObjectId().toString()
  const game = TestUtil.getDbGame({})
  const date = new Date()
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => date)
  const move: MoveUnitDbObject = {
    created: date,
    unit: {
      artStyle: deckUnit.artStyle,
      unit: deckUnit.unit,
      effectiveStrength: getBattlefieldUnitResponses[0].unit.effectiveStrength,
      effects: getBattlefieldUnitResponses[0].unit.effects,
      row: combat,
    },
    impacts: scorches || musters || strengths,
    reason: {
      type: MoveReasonType.Deploy,
    },
    source: {
      origin: GameUnitOrigin.Hand,
    },
    type: MoveType.Unit,
  }
  const getBattlefieldUnitSpy = jest.spyOn(GetBattlefieldUnit, 'getBattlefieldUnit')
  for (const getBattlefieldUnitResponse of getBattlefieldUnitResponses) {
    getBattlefieldUnitSpy.mockReturnValueOnce(getBattlefieldUnitResponse)
  }
  const getBattlefieldUnitCalls: any[][] = [
    [
      {
        game,
        unitId: deckUnit.unit,
        userId: playerId,
      },
    ],
  ]
  if (musters && musteredOrigins) {
    for (const muster of musters) {
      getBattlefieldUnitCalls.push([
        {
          game,
          unitId: muster.unit.unit,
          userId: playerId,
        },
      ])
    }
  }
  const addMoveToCurrentPlayerSpy = jest.spyOn(UpdateHistory, 'addMoveToCurrentPlayer').mockImplementation()
  const addMoveToCurrentPlayerCalls: any[][] = [
    [
      {
        game,
        move,
      },
    ],
  ]
  const errorSpy = jest.fn().mockImplementation()
  UpdateHistory['logger'] = {
    error: errorSpy,
  } as any

  if (error) {
    expect(() =>
      UpdateHistory.newUnitDeployed({
        combat,
        deckUnit,
        game,
        musteredOrigins,
        musters,
        playerId,
        logPrefix,
        scorches,
        strengths,
      })
    ).toThrow(error)
  } else {
    expect(
      UpdateHistory.newUnitDeployed({
        combat,
        deckUnit,
        game,
        musteredOrigins,
        musters,
        playerId,
        logPrefix,
        scorches,
        strengths,
      })
    ).toEqual(undefined)
  }

  expect(dateSpy.mock.calls).toEqual([[]])
  expect(getBattlefieldUnitSpy.mock.calls).toEqual(getBattlefieldUnitCalls)
  expect(addMoveToCurrentPlayerSpy.mock.calls).toEqual(addMoveToCurrentPlayerCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
