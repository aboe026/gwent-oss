import { ObjectId } from 'mongodb'

import {
  Combat,
  ImpactDbObject,
  MoveUnitDbObject,
  MoveReasonType,
  GameUnitOrigin,
} from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
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
    it('throws error if mustered unit not in battlefield', () => {
      const musteredUnit: BattlefieldUnit = {
        row: Combat.Close,
        unit: TestUtil.getDbGameUnit({}),
      }
      const musters = [
        {
          unit: musteredUnit.unit,
          user: new ObjectId(),
        },
      ]
      const message = `Could not find mustered unit "${musteredUnit.unit.unit}" on battlefield`
      testUpdateHistory({
        musters,
        musteredOrigins: {
          [musteredUnit.unit.unit.toString()]: GameUnitOrigin.Hand,
        },
        getBattlefieldUnitResponses: [undefined],
        logPrefix,
        error: Error(`${message}.`),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if mustered unit does not have origin', () => {
      const musteredUnit: BattlefieldUnit = {
        row: Combat.Close,
        unit: TestUtil.getDbGameUnit({}),
      }
      const musters = [
        {
          unit: musteredUnit.unit,
          user: new ObjectId(),
        },
      ]
      const message = `Could not find origin for mustered unit "${musteredUnit.unit.unit}"`
      testUpdateHistory({
        musters,
        musteredOrigins: {},
        getBattlefieldUnitResponses: [musteredUnit],
        logPrefix,
        error: Error(`${message}.`),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('calls addMoveToCurrentPlayer once without impacts close', () => {
      testUpdateHistory({
        logPrefix,
      })
    })
    it('calls addMoveToCurrentPlayer once without impacts ranged', () => {
      testUpdateHistory({
        combat: Combat.Ranged,
        logPrefix,
      })
    })
    it('calls addMoveToCurrentPlayer once without impacts siege', () => {
      testUpdateHistory({
        combat: Combat.Siege,
        logPrefix,
      })
    })
    it('calls addMoveToCurrentPlayer once with scorch impact', () => {
      testUpdateHistory({
        scorches: [
          {
            unit: TestUtil.getDbGameUnit({}),
            user: new ObjectId(),
          },
        ],
        logPrefix,
      })
    })
    it('calls addMoveToCurrentPlayer once with strength impact', () => {
      testUpdateHistory({
        strengths: [
          {
            unit: TestUtil.getDbGameUnit({}),
            user: new ObjectId(),
          },
        ],
        logPrefix,
      })
    })
    it('calls to addMoveToCurrentPlayer for single valid muster', () => {
      const musteredUnit: BattlefieldUnit = {
        row: Combat.Close,
        unit: TestUtil.getDbGameUnit({}),
      }
      const musters = [
        {
          unit: musteredUnit.unit,
          user: new ObjectId(),
        },
      ]
      testUpdateHistory({
        musters,
        musteredOrigins: {
          [musteredUnit.unit.unit.toString()]: GameUnitOrigin.Hand,
        },
        getBattlefieldUnitResponses: [musteredUnit],
        logPrefix,
      })
    })
    it('calls to addMoveToCurrentPlayer for multiple valid muster', () => {
      const musteredUnit1: BattlefieldUnit = {
        row: Combat.Close,
        unit: TestUtil.getDbGameUnit({}),
      }
      const musteredUnit2: BattlefieldUnit = {
        row: Combat.Close,
        unit: TestUtil.getDbGameUnit({}),
      }
      const musters = [
        {
          unit: musteredUnit1.unit,
          user: new ObjectId(),
        },
        {
          unit: musteredUnit2.unit,
          user: new ObjectId(),
        },
      ]
      testUpdateHistory({
        musters,
        musteredOrigins: {
          [musteredUnit2.unit.unit.toString()]: GameUnitOrigin.Undrawn,
          [musteredUnit1.unit.unit.toString()]: GameUnitOrigin.Hand,
        },
        getBattlefieldUnitResponses: [musteredUnit1, musteredUnit2],
        logPrefix,
      })
    })
  })
  describe('addMoveToCurrentPlayer', () => {
    describe('self', () => {
      it('throws error if player not found', () => {
        const userId = new ObjectId()
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
              order: 0,
              ready: true,
              rounds: [TestUtil.getDbPlayerRound({})],
              user: new ObjectId(),
            }),
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
              order: 1,
              ready: true,
              rounds: [TestUtil.getDbPlayerRound({})],
              user: new ObjectId(),
            }),
          ],
          round: 1,
          turn: userId,
        })
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbDeckUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        expect(() =>
          UpdateHistory.addMoveToCurrentPlayer({
            game,
            move,
          })
        ).toThrow(`Could not find player "${game.turn}" on game "${game._id}" to add move to.`)
      })
      it('appends move without other moves in first round', () => {
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 1,
          turn: self.user,
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbDeckUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        expect(
          UpdateHistory.addMoveToCurrentPlayer({
            game,
            move,
          })
        ).toEqual(undefined)

        expect(game).toEqual({
          ...origGame,
          players: [
            {
              ...origGame.players[0],
              rounds: [
                {
                  ...origGame.players[0].rounds[0],
                  moves: [move],
                },
              ],
            },
            origGame.players[1],
          ],
        })
      })
      it('appends move after other moves in first round', () => {
        const oldMove: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbDeckUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [
            TestUtil.getDbPlayerRound({
              moves: [oldMove],
            }),
          ],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 1,
          turn: self.user,
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbDeckUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        expect(
          UpdateHistory.addMoveToCurrentPlayer({
            game,
            move,
          })
        ).toEqual(undefined)

        expect(game).toEqual({
          ...origGame,
          players: [
            {
              ...origGame.players[0],
              rounds: [
                {
                  ...origGame.players[0].rounds[0],
                  moves: [oldMove, move],
                },
              ],
            },
            origGame.players[1],
          ],
        })
      })
      it('appends move without other moves in second round', () => {
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 2,
          turn: self.user,
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbDeckUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        expect(
          UpdateHistory.addMoveToCurrentPlayer({
            game,
            move,
          })
        ).toEqual(undefined)

        expect(game).toEqual({
          ...origGame,
          players: [
            {
              ...origGame.players[0],
              rounds: [
                origGame.players[0].rounds[0],
                {
                  ...origGame.players[0].rounds[1],
                  moves: [move],
                },
              ],
            },
            origGame.players[1],
          ],
        })
      })
      it('appends move after other moves in second round', () => {
        const oldMove: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbDeckUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [
            TestUtil.getDbPlayerRound({}),
            TestUtil.getDbPlayerRound({
              moves: [oldMove],
            }),
          ],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 2,
          turn: self.user,
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbDeckUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        UpdateHistory.addMoveToCurrentPlayer({
          game,
          move,
        })

        expect(game).toEqual({
          ...origGame,
          players: [
            {
              ...origGame.players[0],
              rounds: [
                origGame.players[0].rounds[0],
                {
                  ...origGame.players[0].rounds[1],
                  moves: [oldMove, move],
                },
              ],
            },
            origGame.players[1],
          ],
        })
      })
    })
    describe('opponent', () => {
      it('appends move without other moves in first round', () => {
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 1,
          turn: opponent.user,
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbDeckUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        expect(
          UpdateHistory.addMoveToCurrentPlayer({
            game,
            move,
          })
        ).toEqual(undefined)

        expect(game).toEqual({
          ...origGame,
          players: [
            origGame.players[0],
            {
              ...origGame.players[1],
              rounds: [
                {
                  ...origGame.players[1].rounds[0],
                  moves: [move],
                },
              ],
            },
          ],
        })
      })
      it('appends move after other moves in first round', () => {
        const oldMove: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbDeckUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [
            TestUtil.getDbPlayerRound({
              moves: [oldMove],
            }),
          ],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 1,
          turn: opponent.user,
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbDeckUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        expect(
          UpdateHistory.addMoveToCurrentPlayer({
            game,
            move,
          })
        ).toEqual(undefined)

        expect(game).toEqual({
          ...origGame,
          players: [
            origGame.players[0],
            {
              ...origGame.players[1],
              rounds: [
                {
                  ...origGame.players[1].rounds[0],
                  moves: [oldMove, move],
                },
              ],
            },
          ],
        })
      })
      it('appends move without other moves in second round', () => {
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 2,
          turn: opponent.user,
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbDeckUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        expect(
          UpdateHistory.addMoveToCurrentPlayer({
            game,
            move,
          })
        ).toEqual(undefined)

        expect(game).toEqual({
          ...origGame,
          players: [
            origGame.players[0],
            {
              ...origGame.players[1],
              rounds: [
                origGame.players[1].rounds[0],
                {
                  ...origGame.players[1].rounds[1],
                  moves: [move],
                },
              ],
            },
          ],
        })
      })
      it('appends move after other moves in second round', () => {
        const oldMove: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbDeckUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [
            TestUtil.getDbPlayerRound({}),
            TestUtil.getDbPlayerRound({
              moves: [oldMove],
            }),
          ],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 2,
          turn: opponent.user,
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbDeckUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        expect(
          UpdateHistory.addMoveToCurrentPlayer({
            game,
            move,
          })
        ).toEqual(undefined)

        expect(game).toEqual({
          ...origGame,
          players: [
            origGame.players[0],
            {
              ...origGame.players[1],
              rounds: [
                origGame.players[1].rounds[0],
                {
                  ...origGame.players[1].rounds[1],
                  moves: [oldMove, move],
                },
              ],
            },
          ],
        })
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
  getBattlefieldUnitResponses = [],
  error,
  errorCalls = [],
}: {
  combat?: Combat | null | undefined
  scorches?: ImpactDbObject[] | undefined
  musters?: ImpactDbObject[] | undefined
  strengths?: ImpactDbObject[] | undefined
  musteredOrigins?: MusteredOrigins | undefined
  logPrefix: string
  getBattlefieldUnitResponses?: (BattlefieldUnit | undefined)[]
  error?: Error
  errorCalls?: string[][]
}) {
  const deckUnit = TestUtil.getDbDeckUnit({})
  const playerId = new ObjectId().toString()
  const game = TestUtil.getDbGame({})
  const battlefieldUnit: BattlefieldUnit = {
    row: Combat.Close,
    unit: TestUtil.getDbGameUnit({}),
  }
  const date = new Date()
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => date)
  const move: MoveUnitDbObject = {
    created: date,
    unit: {
      artStyle: deckUnit.artStyle,
      unit: deckUnit.unit,
      effectiveStrength: battlefieldUnit.unit.effectiveStrength,
      effects: battlefieldUnit.unit.effects,
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
  const addMoveToCurrentPlayerSpy = jest.spyOn(UpdateHistory, 'addMoveToCurrentPlayer').mockImplementation()
  const addMoveToCurrentPlayerCalls: any[][] = [
    [
      {
        game,
        move,
      },
    ],
  ]
  const getBattlefieldUnitSpy = jest
    .spyOn(GetBattlefieldUnit, 'getBattlefieldUnit')
    .mockReturnValueOnce(battlefieldUnit)
  for (const getBattlefieldUnitResponse of getBattlefieldUnitResponses) {
    getBattlefieldUnitSpy.mockReturnValueOnce(getBattlefieldUnitResponse)
    if (!error && getBattlefieldUnitResponse) {
      addMoveToCurrentPlayerCalls.push([
        {
          game,
          move: {
            created: date,
            reason: {
              type: MoveReasonType.Muster,
              unit: deckUnit,
            },
            type: MoveType.Unit,
            unit: {
              artStyle: getBattlefieldUnitResponse.unit.artStyle,
              unit: getBattlefieldUnitResponse.unit.unit,
              effectiveStrength: getBattlefieldUnitResponse.unit.effectiveStrength,
              effects: getBattlefieldUnitResponse.unit.effects,
              row: getBattlefieldUnitResponse.row,
            },
            source: {
              origin: musteredOrigins ? musteredOrigins[getBattlefieldUnitResponse.unit.unit.toString()] : 'bad',
            },
          },
        },
      ])
    }
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
