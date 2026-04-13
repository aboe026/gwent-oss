import { ObjectId } from 'mongodb'

import {
  Combat,
  DeckUnitDbObject,
  GameDbObject,
  GamePlayerDbObject,
  ImpactDbObject,
  PlayerCombatRowDbObject,
} from '@gwent/graphql-schema/database-typings'
import EffectDecoy, { PotentialDecoy } from '../../src/graphql/resolvers/mutations/play-unit/effect-decoy'
import PresentableError from '../../src/util/presentable-error'
import TestUtil from '../util/test-util'

describe('effect-decoy', () => {
  describe('decoyFromBattlefield', () => {
    const logPrefix = 'log-prefix'
    it('does not return impact or deckUnit added to hand if no targetId', () => {
      const combat = Combat.Close
      const targetId = ''
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({}),
            ranged: TestUtil.getDbPlayerCombatRow({
              score: 1,
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              score: 2,
            }),
          }),
        ],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      testDecoyFromBattlefield({
        logPrefix,
        combat,
        targetId,
        isDecoy: false,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        expected: {
          impacts: {},
          deckUnitAddedToHand: undefined,
        },
      })
    })
    it('does not return impact or deckUnit added to hand if no targetId', () => {
      const combat = Combat.Close
      const targetId = ''
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({}),
            ranged: TestUtil.getDbPlayerCombatRow({
              score: 1,
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              score: 2,
            }),
          }),
        ],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      testDecoyFromBattlefield({
        logPrefix,
        combat,
        targetId,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        expected: {
          impacts: {},
          deckUnitAddedToHand: undefined,
        },
      })
    })
    it('does not return impact or deckUnit added to hand if no combat', () => {
      const targetId = new ObjectId().toString()
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({}),
            ranged: TestUtil.getDbPlayerCombatRow({
              score: 1,
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              score: 2,
            }),
          }),
        ],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      testDecoyFromBattlefield({
        logPrefix,
        targetId,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        expected: {
          impacts: {},
          deckUnitAddedToHand: undefined,
        },
      })
    })
    it('throws error if cannot find user on game', () => {
      const combat = Combat.Close
      const targetId = new ObjectId().toString()
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({}),
            ranged: TestUtil.getDbPlayerCombatRow({
              score: 1,
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              score: 2,
            }),
          }),
        ],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const game = TestUtil.getDbGame({
        players: [player],
        turn: new ObjectId(),
        round: 1,
      })
      const message = `Could not find player "${game.turn}" in game "${game._id}"`
      testDecoyFromBattlefield({
        logPrefix,
        combat,
        targetId,
        game,
        newDeckUnit,
        expected: new PresentableError(message),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if no impact found for target', () => {
      const combat = Combat.Close
      const targetId = new ObjectId().toString()
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({}),
            ranged: TestUtil.getDbPlayerCombatRow({
              score: 1,
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              score: 2,
            }),
          }),
        ],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const message = `Decoy "${newDeckUnit.unit}" did not get applied for unit "${targetId}"`
      testDecoyFromBattlefield({
        logPrefix,
        combat,
        targetId,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        decoyFromRowResponse: undefined,
        expected: new PresentableError(message),
        decoyFromRowCalls: [
          [
            {
              player,
              row: player.rounds[0].close,
              targetId,
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns impact and deckUnit added to hand if decoyFromRow returns single impact in close combat', () => {
      const combat = Combat.Close
      const targetId = new ObjectId().toString()
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({}),
            ranged: TestUtil.getDbPlayerCombatRow({
              score: 1,
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              score: 2,
            }),
          }),
        ],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbTacoUnit({}),
        user: player.user,
      }
      testDecoyFromBattlefield({
        logPrefix,
        combat,
        targetId,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        decoyFromRowResponse: impact,
        expected: {
          impacts: {
            [newDeckUnit.unit.toString()]: [impact],
          },
          deckUnitAddedToHand: impact.unit,
        },
        decoyFromRowCalls: [
          [
            {
              player,
              row: player.rounds[0].close,
              targetId,
            },
          ],
        ],
      })
    })
    it('returns impact and deckUnit added to hand if decoyFromRow returns single impact in ranged combat', () => {
      const combat = Combat.Ranged
      const targetId = new ObjectId().toString()
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({}),
            ranged: TestUtil.getDbPlayerCombatRow({
              score: 1,
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              score: 2,
            }),
          }),
        ],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbTacoUnit({}),
        user: player.user,
      }
      testDecoyFromBattlefield({
        logPrefix,
        combat,
        targetId,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        decoyFromRowResponse: impact,
        expected: {
          impacts: {
            [newDeckUnit.unit.toString()]: [impact],
          },
          deckUnitAddedToHand: impact.unit,
        },
        decoyFromRowCalls: [
          [
            {
              player,
              row: player.rounds[0].ranged,
              targetId,
            },
          ],
        ],
      })
    })
    it('returns impact and deckUnit added to hand if decoyFromRow returns single impact in siege combat', () => {
      const combat = Combat.Siege
      const targetId = new ObjectId().toString()
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({}),
            ranged: TestUtil.getDbPlayerCombatRow({
              score: 1,
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              score: 2,
            }),
          }),
        ],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbTacoUnit({}),
        user: player.user,
      }
      testDecoyFromBattlefield({
        logPrefix,
        combat,
        targetId,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        decoyFromRowResponse: impact,
        expected: {
          impacts: {
            [newDeckUnit.unit.toString()]: [impact],
          },
          deckUnitAddedToHand: impact.unit,
        },
        decoyFromRowCalls: [
          [
            {
              player,
              row: player.rounds[0].siege,
              targetId,
            },
          ],
        ],
      })
    })
  })
  describe('decoyFromRow', () => {
    it('returns undefined if row undefined', () => {
      testDecoyFromRow({
        row: undefined,
        expected: undefined,
      })
    })
    it('returns undefined if target not in row units', () => {
      testDecoyFromRow({
        row: {
          score: 0,
          units: [],
        },
        expected: undefined,
      })
    })
    it('returns impact if target in row', () => {
      const userId = new ObjectId()
      const target = TestUtil.getDbFieldUnit({})
      testDecoyFromRow({
        player: TestUtil.getDbGamePlayer({
          user: userId,
        }),
        row: {
          score: 0,
          units: [target],
        },
        targetId: target.unit.toString(),
        expected: {
          unit: TestUtil.convertFieldDbUnitToTacoDbUnit(target),
          user: userId,
        },
      })
    })
  })
})

function testDecoyFromBattlefield({
  game,
  logPrefix,
  newDeckUnit,
  combat,
  targetId,
  isDecoy = true,
  decoyFromRowResponse,
  expected,
  decoyFromRowCalls = [],
  errorCalls = [],
}: {
  game: GameDbObject
  logPrefix: string
  newDeckUnit: DeckUnitDbObject
  combat?: Combat
  targetId: string | undefined | null
  isDecoy?: boolean
  decoyFromRowResponse?: ImpactDbObject | undefined
  expected: PotentialDecoy | Error
  decoyFromRowCalls?: any[][]
  errorCalls?: any[][]
}) {
  const decoyFromRowSpy = jest.spyOn(EffectDecoy as any, 'decoyFromRow').mockReturnValueOnce(decoyFromRowResponse)
  const errorSpy = jest.fn().mockImplementation()
  EffectDecoy['logger'] = {
    error: errorSpy,
  } as any

  if (expected instanceof Error) {
    expect(() =>
      EffectDecoy.decoyFromBattlefield({
        game,
        logPrefix,
        newDeckUnit,
        combat,
        targetId,
        isDecoy,
      })
    ).toThrow(expected)
  } else {
    expect(
      EffectDecoy.decoyFromBattlefield({
        game,
        logPrefix,
        newDeckUnit,
        combat,
        targetId,
        isDecoy,
      })
    ).toEqual(expected)
  }

  expect(decoyFromRowSpy.mock.calls).toEqual(decoyFromRowCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

function testDecoyFromRow({
  row,
  targetId = new ObjectId().toString(),
  player = TestUtil.getDbGamePlayer({}),
  expected,
}: {
  row: PlayerCombatRowDbObject | undefined
  targetId?: string
  player?: GamePlayerDbObject
  expected: ImpactDbObject | undefined
}) {
  if (player) {
    expect(player.deck.hand.findIndex((handUnit) => handUnit.unit.toString() === targetId.toString())).toEqual(-1)
  }

  expect(
    EffectDecoy['decoyFromRow']({
      player,
      row,
      targetId,
    })
  ).toEqual(expected)

  if (player) {
    if (expected) {
      expect(
        player.deck.hand.findIndex((handUnit) => handUnit.unit.toString() === targetId.toString())
      ).toBeGreaterThanOrEqual(0)
    } else {
      expect(player.deck.hand.findIndex((handUnit) => handUnit.unit.toString() === targetId.toString())).toEqual(-1)
    }
  }
}
