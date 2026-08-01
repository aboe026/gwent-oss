import { ObjectId } from 'mongodb'

import {
  DeckUnitDbObject,
  FieldUnitDbObject,
  GameDbObject,
  GameUnitDbObject,
  GameUnitOrigin,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import EffectMedic, { Medicing } from '../../src/graphql/resolvers/mutations/play-unit/effect-medic'
import { GameUnitType, MoveType } from '@gwent/graphql-schema'
import GetFieldUnits from '../../src/graphql/resolvers/util/get-field-units'
import TestUtil from '../util/test-util'
import UnitStore from '../../src/database/stores/unit-store'

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
  describe('updateLastMoveImpactWithUnit', () => {
    const logPrefix = 'log-prefix'
    it('throws error if player not on game', () => {
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const game = TestUtil.getDbGame({
        players: [player],
        round: 1,
      })
      const unitId = new ObjectId()
      const playerId = new ObjectId()
      const message = `Could not find player "${playerId}" on game "${game._id}" to update impact with unit for`
      testUpdateLastMoveImpactWithUnit({
        logPrefix,
        game: deepClone(game),
        playerId: playerId,
        unitId,
        expected: Error(`${message}.`),
        updatedGame: game,
        errorCalls: [[`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`]],
      })
    })
    it('throws error if no moves for player', () => {
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const game = TestUtil.getDbGame({
        players: [player],
        round: 1,
      })
      const unitId = new ObjectId()
      const message = `Could not find last move for player "${player.user}" to update impact with unit for`
      testUpdateLastMoveImpactWithUnit({
        logPrefix,
        game: deepClone(game),
        playerId: player.user,
        unitId,
        expected: Error(`${message}.`),
        updatedGame: game,
        errorCalls: [[`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`]],
      })
    })
    it('throws error if last move is of type Pass', () => {
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            moves: [
              TestUtil.getDbMove({
                type: MoveType.Pass,
              }),
            ],
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [player],
        round: 1,
      })
      const unitId = new ObjectId()
      const message = `Invalid last move type "${MoveType.Pass}", expecting "${MoveType.Unit}"`
      testUpdateLastMoveImpactWithUnit({
        logPrefix,
        game: deepClone(game),
        playerId: player.user,
        unitId,
        expected: Error(`${message}.`),
        updatedGame: game,
        errorCalls: [[`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`]],
      })
    })
    it('throws error if last move is of type Leader', () => {
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            moves: [
              TestUtil.getDbMove({
                type: MoveType.Leader,
              }),
            ],
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [player],
        round: 1,
      })
      const unitId = new ObjectId()
      const message = `Invalid last move type "${MoveType.Leader}", expecting "${MoveType.Unit}"`
      testUpdateLastMoveImpactWithUnit({
        logPrefix,
        game: deepClone(game),
        playerId: player.user,
        unitId,
        expected: Error(`${message}.`),
        updatedGame: game,
        errorCalls: [[`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`]],
      })
    })
    it('throws error if no impacts on move', () => {
      const moveUnit = TestUtil.getDbGameUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            moves: [
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: moveUnit,
              }),
            ],
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [player],
        round: 1,
      })
      const unitId = new ObjectId()
      const message = `No impacts found for move to add unit to`
      testUpdateLastMoveImpactWithUnit({
        logPrefix,
        game: deepClone(game),
        playerId: player.user,
        unitId,
        expected: Error(`${message}.`),
        updatedGame: game,
        errorCalls: [[`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`]],
      })
    })
    it('throws error if no impact on move', () => {
      const moveUnit = TestUtil.getDbGameUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            moves: [
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: moveUnit,
                impacts: [],
              }),
            ],
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [player],
        round: 1,
      })
      const unitId = new ObjectId()
      const message = `No impact found for move to add unit to`
      testUpdateLastMoveImpactWithUnit({
        logPrefix,
        game: deepClone(game),
        playerId: player.user,
        unitId,
        expected: Error(`${message}.`),
        updatedGame: game,
        errorCalls: [[`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`]],
      })
    })
    it('throws error if unit already set on impact', () => {
      const moveUnit = TestUtil.getDbGameUnit({})
      const impactUnit = TestUtil.getDbGameUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            moves: [
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: moveUnit,
                impacts: [
                  TestUtil.getDbImpact({
                    unit: impactUnit,
                  }),
                ],
              }),
            ],
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [player],
        round: 1,
      })
      const unitId = new ObjectId()
      const message = `Unit already set to "${impactUnit.unit}" for last move`
      testUpdateLastMoveImpactWithUnit({
        logPrefix,
        game: deepClone(game),
        playerId: player.user,
        unitId,
        expected: Error(`${message}.`),
        updatedGame: game,
        errorCalls: [[`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`]],
      })
    })
    it('throws error if cannot find field unit', () => {
      const moveUnit = TestUtil.getDbGameUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            moves: [
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: moveUnit,
                impacts: [
                  TestUtil.getDbImpact({
                    unit: null,
                  }),
                ],
              }),
            ],
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [player],
        round: 1,
      })
      const unitId = new ObjectId()
      const message = `Could not find unit "${unitId}" on battlefield to update latest impact with`
      testUpdateLastMoveImpactWithUnit({
        logPrefix,
        game: deepClone(game),
        playerId: player.user,
        unitId,
        getFieldUnitResponse: null,
        expected: Error(`${message}.`),
        updatedGame: game,
        errorCalls: [[`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`]],
      })
    })
    it('returns field unit as GameUnitDbObject if all valid without target', () => {
      const moveUnit = TestUtil.getDbGameUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            moves: [
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: moveUnit,
                impacts: [
                  TestUtil.getDbImpact({
                    unit: null,
                  }),
                ],
              }),
            ],
          }),
        ],
      })
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const gameUnit: GameUnitDbObject = {
        ...fieldUnit,
        type: GameUnitType.Field,
      }
      const game = TestUtil.getDbGame({
        players: [player],
        round: 1,
      })
      testUpdateLastMoveImpactWithUnit({
        logPrefix,
        game: deepClone(game),
        playerId: player.user,
        unitId: new ObjectId(),
        getFieldUnitResponse: fieldUnit,
        expected: moveUnit,
        updatedGame: {
          ...game,
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  moves: [
                    {
                      ...game.players[0].rounds[0].moves[0],
                      impacts: [
                        {
                          ...(game.players[0].rounds[0].moves[0] as any).impacts[0],
                          unit: gameUnit,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      })
    })
    it('returns field unit as GameUnitDbObject if all valid with target', () => {
      const moveUnit = TestUtil.getDbGameUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            moves: [
              TestUtil.getDbMove({
                type: MoveType.Unit,
                unit: moveUnit,
                impacts: [
                  TestUtil.getDbImpact({
                    unit: null,
                  }),
                ],
              }),
            ],
          }),
        ],
      })
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const gameUnit: GameUnitDbObject = {
        ...fieldUnit,
        type: GameUnitType.Field,
      }
      const game = TestUtil.getDbGame({
        players: [player],
        round: 1,
      })
      testUpdateLastMoveImpactWithUnit({
        logPrefix,
        game: deepClone(game),
        playerId: player.user,
        targetId: new ObjectId().toString(),
        unitId: new ObjectId(),
        getFieldUnitResponse: fieldUnit,
        expected: moveUnit,
        updatedGame: {
          ...game,
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  moves: [
                    {
                      ...game.players[0].rounds[0].moves[0],
                      impacts: [
                        {
                          ...(game.players[0].rounds[0].moves[0] as any).impacts[0],
                          unit: gameUnit,
                        },
                      ],
                    },
                  ],
                },
              ],
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

async function testUpdateLastMoveImpactWithUnit({
  game,
  logPrefix,
  playerId,
  unitId,
  targetId,
  getFieldUnitResponse,
  expected,
  updatedGame,
  errorCalls = [],
}: {
  game: GameDbObject
  logPrefix: string
  playerId: ObjectId | string
  unitId: ObjectId | string
  targetId?: string | undefined | null
  getFieldUnitResponse?: FieldUnitDbObject | undefined | null
  expected: GameUnitDbObject | Error
  updatedGame?: GameDbObject
  errorCalls?: string[][]
}) {
  const getFieldUnitSpy = jest.spyOn(GetFieldUnits, 'getFieldUnit').mockReturnValue(getFieldUnitResponse || undefined)
  const errorSpy = jest.fn().mockImplementation()
  EffectMedic['logger'] = {
    error: errorSpy,
  } as any

  if (expected instanceof Error) {
    expect(() =>
      EffectMedic['updateLastMoveImpactWithUnit']({
        game,
        logPrefix,
        playerId,
        targetId,
        unitId,
      })
    ).toThrow(expected)
  } else {
    expect(
      EffectMedic['updateLastMoveImpactWithUnit']({
        game,
        logPrefix,
        playerId,
        targetId,
        unitId,
      })
    ).toEqual(expected)
  }
  expect(game).toEqual(updatedGame || game)

  expect(getFieldUnitSpy.mock.calls).toEqual(
    getFieldUnitResponse !== undefined
      ? [
          [
            {
              game,
              unitId,
              userId: targetId || playerId,
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
