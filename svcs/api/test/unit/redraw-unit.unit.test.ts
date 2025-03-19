import { ObjectId } from 'mongodb'

import RedrawUnit from '../../src/graphql/resolvers/mutations/util/redraw-unit'
import TestUtil from '../util/test-util'
import * as utils from '@gwent/utils'
import deepClone from '../util/deep-clone'
import { DeckUnitDbObject, GameDbObject, RedrawDbObject } from '@gwent/graphql-schema/database-typings'

describe('redraw-unit', () => {
  describe('redrawUnit', () => {
    const logPrefix = 'unit-test-log-prefix'
    it('throws error if player not found', () => {
      const self = TestUtil.getDbGamePlayer({})
      const invalidUser = new ObjectId()
      const game = TestUtil.getDbGame({
        players: [self, TestUtil.getDbGamePlayer({})],
        turn: invalidUser,
      })
      const message = `Could not find player "${invalidUser}" on game "${game._id}" to redraw unit "${game.round}" for.`

      testRedrawUnit({
        game,
        logPrefix,
        unitId: new ObjectId().toString(),
        expected: Error(message),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if unit not in hand', () => {
      const self = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          hand: [TestUtil.getDbDeckUnit({})],
        }),
      })
      const game = TestUtil.getDbGame({
        players: [self, TestUtil.getDbGamePlayer({})],
        turn: self.user,
      })
      const message = 'Unit not in hand.'

      testRedrawUnit({
        game,
        logPrefix,
        unitId: new ObjectId().toString(),
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('replaces unit from hand with random unit in undrawn, adding transaction to deck redraws', () => {
      const unitId = new ObjectId()
      const previousRedraw = TestUtil.getDbDeckUnit({})
      const from = TestUtil.getDbDeckUnit({
        id: unitId,
      })
      const to = TestUtil.getDbDeckUnit({})
      const self = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          hand: [from],
          undrawn: [to],
          redraws: [
            {
              from: previousRedraw,
              to: TestUtil.getDbDeckUnit({}),
            },
          ],
        }),
      })
      const game = TestUtil.getDbGame({
        players: [self, TestUtil.getDbGamePlayer({})],
        turn: self.user,
      })

      testRedrawUnit({
        game,
        logPrefix,
        unitId: unitId.toString(),
        getRandomSubsetResponse: [to],
        redrawPool: [to],
        expected: {
          from: deepClone(from),
          to: deepClone(to),
        },
        expectedHand: [deepClone(to)],
        expectedUndrawn: [deepClone(from)],
      })
    })
    it('logs to trace if enabled', () => {
      const unitId = new ObjectId()
      const previousRedraw = TestUtil.getDbDeckUnit({})
      const from = TestUtil.getDbDeckUnit({
        id: unitId,
      })
      const to = TestUtil.getDbDeckUnit({})
      const self = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          hand: [from],
          undrawn: [to],
          redraws: [
            {
              from: previousRedraw,
              to: TestUtil.getDbDeckUnit({}),
            },
          ],
        }),
      })
      const game = TestUtil.getDbGame({
        players: [self, TestUtil.getDbGamePlayer({})],
        turn: self.user,
      })
      const redrawPool = [deepClone(to)]

      testRedrawUnit({
        game,
        logPrefix,
        unitId: unitId.toString(),
        getRandomSubsetResponse: [deepClone(to)],
        redrawPool,
        expected: {
          from: deepClone(from),
          to: deepClone(to),
        },
        expectedHand: [deepClone(to)],
        expectedUndrawn: [deepClone(from)],
        traceEnabled: true,
        traceCalls: [
          [`${logPrefix} redrawFrom: "${JSON.stringify(deepClone(from))}"`],
          [`${logPrefix} redrawPool: "${JSON.stringify(redrawPool)}"`],
          [`${logPrefix} redrawTo: "${JSON.stringify(deepClone(to))}"`],
        ],
      })
    })
  })
})

function testRedrawUnit({
  game,
  logPrefix,
  unitId,
  getRandomSubsetResponse,
  redrawPool,
  expectedHand,
  expectedUndrawn,
  expected,
  errorCalls = [],
  warnCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  game: GameDbObject
  logPrefix: string
  unitId: string
  getRandomSubsetResponse?: DeckUnitDbObject[]
  redrawPool?: DeckUnitDbObject[]
  expectedUndrawn?: DeckUnitDbObject[]
  expectedHand?: DeckUnitDbObject[]
  expected: Error | RedrawDbObject
  errorCalls?: string[][]
  warnCalls?: string[][]
  traceCalls?: string[][]
  traceEnabled?: boolean
}) {
  const getRandomSubsetSpy = jest.spyOn(utils, 'getRandomSubset')
  if (getRandomSubsetResponse) {
    getRandomSubsetSpy.mockReturnValue(getRandomSubsetResponse)
  }
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  RedrawUnit['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any
  const origGame = deepClone(game)

  if (expected instanceof Error) {
    expect(() => {
      RedrawUnit.redrawUnit({
        game,
        logPrefix,
        unitId,
      })
    }).toThrow(expected)
  } else {
    expect(
      RedrawUnit.redrawUnit({
        game,
        logPrefix,
        unitId,
      })
    ).toEqual(expected)
  }

  expect(game).toEqual(
    expected instanceof Error
      ? origGame
      : {
          ...origGame,
          players: [
            {
              ...origGame.players[0],
              deck: {
                ...origGame.players[0].deck,
                undrawn: expectedUndrawn,
                hand: expectedHand,
                redraws: [...origGame.players[0].deck.redraws, expected],
              },
            },
            origGame.players[1],
          ],
        }
  )
  expect(getRandomSubsetSpy.mock.calls).toEqual(
    expected instanceof Error
      ? []
      : [
          [
            {
              items: redrawPool,
              size: 1,
            },
          ],
        ]
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
