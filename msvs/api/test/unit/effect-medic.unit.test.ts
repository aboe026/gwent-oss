import {
  DeckUnitDbObject,
  GameDbObject,
  GameUnitDbObject,
  GameUnitOrigin,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import EffectMedic, { Medicing } from '../../src/graphql/resolvers/mutations/play-unit/effect-medic'
import TestUtil from '../util/test-util'
import { GameUnitType } from '@gwent/graphql-schema'
import deepClone from '../util/deep-clone'
import UnitStore from '../../src/database/stores/unit-store'
import { ObjectId } from 'mongodb'

describe('effect-medic', () => {
  describe('deployMedicOrReviveUnit', () => {
    const logPrefix = 'log-prefix'
    it('throws error if cannot find player for medic', async () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const player = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbDeckUnit({})],
        }),
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnit],
            }),
          }),
        ],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const game = TestUtil.getDbGame({
        players: [player],
        turn: new ObjectId(),
      })
      const origGame = deepClone(game)
      const message = `Could not find current game player for deploying medic "${newDeckUnit.unit}"`

      await testDeployMedicOrReviveUnit({
        game,
        isMedic: true,
        isSpy: false,
        logPrefix,
        newDeckUnit,
        targetId: undefined,
        expected: Error(`${message}.`),
        updatedGame: origGame,
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if cannot find player for reviving', async () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const player = TestUtil.getDbGamePlayer({
        reviving: true,
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbDeckUnit({})],
        }),
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnit],
            }),
          }),
        ],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const game = TestUtil.getDbGame({
        players: [player],
        turn: new ObjectId(),
      })
      const origGame = deepClone(game)
      const message = `Could not find current game player for reviving unit "${newDeckUnit.unit}"`

      await testDeployMedicOrReviveUnit({
        game,
        isMedic: false,
        isSpy: false,
        logPrefix,
        newDeckUnit,
        targetId: undefined,
        expected: Error(`${message}.`),
        updatedGame: origGame,
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('sets player reviving to false if medic without eligible units to revive', async () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const player = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbDeckUnit({})],
        }),
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnit],
            }),
          }),
        ],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const game = TestUtil.getDbGame({
        players: [player],
        turn: player.user,
      })
      const origGame = deepClone(game)

      await testDeployMedicOrReviveUnit({
        game,
        isMedic: true,
        isSpy: false,
        logPrefix,
        newDeckUnit,
        targetId: undefined,
        unitGetResponse: [],
        expected: {
          impacts: {
            [newDeckUnit.unit.toString()]: [],
          },
          medicingUnit: undefined,
        },
        updatedGame: {
          ...origGame,
          players: [
            {
              ...player,
              reviving: false,
            },
          ],
        },
      })
    })
    it('sets player reviving to true if medic with eligible units to revive', async () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const player = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbDeckUnit({})],
        }),
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnit],
            }),
          }),
        ],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const game = TestUtil.getDbGame({
        players: [player],
        turn: player.user,
      })
      const origGame = deepClone(game)

      await testDeployMedicOrReviveUnit({
        game,
        isMedic: true,
        isSpy: false,
        logPrefix,
        newDeckUnit,
        targetId: undefined,
        unitGetResponse: [TestUtil.getDbUnit({})],
        expected: {
          impacts: {
            [newDeckUnit.unit.toString()]: [
              {
                user: player.user,
                source: {
                  origin: GameUnitOrigin.Discard,
                },
                unit: undefined,
              },
            ],
          },
          medicingUnit: undefined,
        },
        updatedGame: {
          ...origGame,
          players: [
            {
              ...player,
              reviving: true,
            },
          ],
        },
      })
    })
    it('updates last move history if reviving and sets player reviving to true if medic with eligible units to revive', async () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const medicingUnit: GameUnitDbObject = {
        ...fieldUnit,
        type: GameUnitType.Field,
      }
      const player = TestUtil.getDbGamePlayer({
        reviving: true,
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbDeckUnit({})],
        }),
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnit],
            }),
          }),
        ],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const game = TestUtil.getDbGame({
        players: [player],
        turn: player.user,
      })
      const origGame = deepClone(game)

      await testDeployMedicOrReviveUnit({
        game,
        isMedic: true,
        isSpy: false,
        logPrefix,
        newDeckUnit,
        targetId: undefined,
        updateLastMoveImpactWithUnitResponse: medicingUnit,
        unitGetResponse: [TestUtil.getDbUnit({})],
        expected: {
          impacts: {
            [newDeckUnit.unit.toString()]: [
              {
                user: player.user,
                source: {
                  origin: GameUnitOrigin.Discard,
                },
                unit: undefined,
              },
            ],
          },
          medicingUnit,
        },
        updatedGame: {
          ...origGame,
          players: [
            {
              ...player,
              reviving: true,
            },
          ],
        },
      })
    })
    it('updates last move history if reviving and sets reviving to false if not medic', async () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const medicingUnit: GameUnitDbObject = {
        ...fieldUnit,
        type: GameUnitType.Field,
      }
      const player = TestUtil.getDbGamePlayer({
        reviving: true,
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbDeckUnit({})],
        }),
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnit],
            }),
          }),
        ],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const game = TestUtil.getDbGame({
        players: [player],
        turn: player.user,
      })
      const origGame = deepClone(game)

      await testDeployMedicOrReviveUnit({
        game,
        isMedic: false,
        isSpy: false,
        logPrefix,
        newDeckUnit,
        targetId: new ObjectId().toString(),
        updateLastMoveImpactWithUnitResponse: medicingUnit,
        expected: {
          impacts: {},
          medicingUnit,
        },
        updatedGame: {
          ...origGame,
          players: [
            {
              ...player,
              reviving: false,
            },
          ],
        },
      })
    })
    it('updates last move history if reviving and passes targetId if spy', async () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const medicingUnit: GameUnitDbObject = {
        ...fieldUnit,
        type: GameUnitType.Field,
      }
      const player = TestUtil.getDbGamePlayer({
        reviving: true,
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbDeckUnit({})],
        }),
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnit],
            }),
          }),
        ],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const game = TestUtil.getDbGame({
        players: [player],
        turn: player.user,
      })
      const origGame = deepClone(game)

      await testDeployMedicOrReviveUnit({
        game,
        isMedic: false,
        isSpy: true,
        logPrefix,
        newDeckUnit,
        targetId: new ObjectId().toString(),
        updateLastMoveImpactWithUnitResponse: medicingUnit,
        expected: {
          impacts: {},
          medicingUnit,
        },
        updatedGame: {
          ...origGame,
          players: [
            {
              ...player,
              reviving: false,
            },
          ],
        },
      })
    })
  })
})

async function testDeployMedicOrReviveUnit({
  game,
  newDeckUnit,
  isMedic,
  isSpy,
  targetId,
  logPrefix,
  updateLastMoveImpactWithUnitResponse,
  unitGetResponse,
  updatedGame,
  expected,
  errorCalls = [],
}: {
  game: GameDbObject
  newDeckUnit: DeckUnitDbObject
  isMedic: boolean
  isSpy: boolean
  targetId: string | undefined | null
  logPrefix: string
  updateLastMoveImpactWithUnitResponse?: GameUnitDbObject
  unitGetResponse?: UnitDbObject[]
  updatedGame: GameDbObject
  expected: Medicing | Error
  errorCalls?: string[][]
}) {
  const player = game.players.find((player) => player.user.toString() === game.turn?.toString())
  const updateLastMoveImpactWithUnitSpy = jest
    .spyOn(EffectMedic as any, 'updateLastMoveImpactWithUnit')
    .mockReturnValue(updateLastMoveImpactWithUnitResponse)
  const unitGetSpy = jest.spyOn(UnitStore, 'get')
  if (unitGetResponse) {
    unitGetSpy.mockResolvedValue(unitGetResponse)
  }
  const errorSpy = jest.fn().mockImplementation()
  EffectMedic['logger'] = {
    error: errorSpy,
  } as any

  const promise = EffectMedic.deployMedicOrReviveUnit({
    game,
    isMedic,
    isSpy,
    logPrefix,
    newDeckUnit,
    targetId,
  })
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(game).toEqual(updatedGame)
  expect(updateLastMoveImpactWithUnitSpy.mock.calls).toEqual(
    updateLastMoveImpactWithUnitResponse
      ? [
          [
            {
              game,
              logPrefix,
              playerId: player?.user,
              unitId: newDeckUnit.unit,
              targetId: isSpy ? targetId : undefined,
            },
          ],
        ]
      : []
  )
  expect(unitGetSpy.mock.calls).toEqual(
    unitGetResponse
      ? [
          [
            {
              ids: player?.deck.discard.map((discard) => discard.unit.toString()),
              specials: false,
              heroes: false,
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
