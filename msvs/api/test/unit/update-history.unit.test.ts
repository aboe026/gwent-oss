import { ObjectId } from 'mongodb'

import {
  Combat,
  ImpactDbObject,
  MoveUnitDbObject,
  MoveReasonType,
  GameUnitOrigin,
  DeckUnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import GetBattlefieldUnit, {
  BattlefieldUnit,
} from '../../src/graphql/resolvers/mutations/play-unit/get-battlefield-unit'
import { ImpactsByUnitId } from '../../src/graphql/resolvers/resolver-util'
import { MoveType } from '@gwent/graphql-schema'
import { MusteredOrigins } from '../../src/graphql/resolvers/mutations/play-unit/effect-muster'
import TestUtil from '../util/test-util'
import UpdateHistory from '../../src/graphql/resolvers/mutations/play-unit/update-history'

describe('update-history', () => {
  describe('newUnitDeployed', () => {
    const logPrefix = 'log-prefix'
    it('throws error if musters without origin', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const musters = {
        [deckUnit.unit.toString()]: [],
      }
      const message = 'No origins provided for musters'
      testUpdateHistory({
        deckUnit,
        musters,
        logPrefix,
        error: Error(`${message}.`),
        expectedMoveImpacts: [],
        errorCalls: [[`${logPrefix} failed: ${message}, musters: "${JSON.stringify(musters)}"`]],
      })
    })
    it('throws error if mustered unit not in battlefield', () => {
      const musteredUnit: BattlefieldUnit = {
        row: Combat.Close,
        unit: TestUtil.getDbGameUnit({}),
      }
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: musteredUnit.unit,
        user: new ObjectId(),
      }
      const musters = {
        [deckUnit.unit.toString()]: [impact],
      }
      const message = `Could not find mustered unit "${musteredUnit.unit.unit}" on battlefield`
      testUpdateHistory({
        deckUnit,
        musters,
        musteredOrigins: {
          [musteredUnit.unit.unit.toString()]: GameUnitOrigin.Hand,
        },
        getBattlefieldUnitResponses: [undefined],
        logPrefix,
        error: Error(`${message}.`),
        expectedMoveImpacts: [impact],
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if mustered unit does not have origin', () => {
      const musteredUnit: BattlefieldUnit = {
        row: Combat.Close,
        unit: TestUtil.getDbGameUnit({}),
      }
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: musteredUnit.unit,
        user: new ObjectId(),
      }
      const musters = {
        [deckUnit.unit.toString()]: [impact],
      }
      const message = `Could not find origin for mustered unit "${musteredUnit.unit.unit}"`
      testUpdateHistory({
        deckUnit,
        musters,
        musteredOrigins: {},
        getBattlefieldUnitResponses: [musteredUnit],
        logPrefix,
        error: Error(`${message}.`),
        expectedMoveImpacts: [impact],
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
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testUpdateHistory({
        deckUnit,
        scorches: {
          [deckUnit.unit.toString()]: [impact],
        },
        logPrefix,
        expectedMoveImpacts: [impact],
      })
    })
    it('calls addMoveToCurrentPlayer once with morale impact', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testUpdateHistory({
        deckUnit,
        morales: {
          [deckUnit.unit.toString()]: [impact],
        },
        logPrefix,
        expectedMoveImpacts: [impact],
      })
    })
    it('calls addMoveToCurrentPlayer once with bond impact', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testUpdateHistory({
        deckUnit,
        bonds: {
          [deckUnit.unit.toString()]: [impact],
        },
        logPrefix,
        expectedMoveImpacts: [impact],
      })
    })
    it('calls to addMoveToCurrentPlayer for single valid muster without own impact', () => {
      const musteredUnit: BattlefieldUnit = {
        row: Combat.Close,
        unit: TestUtil.getDbGameUnit({}),
      }
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: musteredUnit.unit,
        user: new ObjectId(),
      }
      const musters = {
        [deckUnit.unit.toString()]: [impact],
      }
      testUpdateHistory({
        deckUnit,
        musters,
        musteredOrigins: {
          [musteredUnit.unit.unit.toString()]: GameUnitOrigin.Hand,
        },
        getBattlefieldUnitResponses: [musteredUnit],
        expectedMoveImpacts: [impact],
        logPrefix,
      })
    })
    it('calls to addMoveToCurrentPlayer for single valid muster with own impact', () => {
      const musteredUnit: BattlefieldUnit = {
        row: Combat.Close,
        unit: TestUtil.getDbGameUnit({}),
      }
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact1: ImpactDbObject = {
        unit: musteredUnit.unit,
        user: new ObjectId(),
      }
      const impact2: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const musters = {
        [deckUnit.unit.toString()]: [impact1],
      }
      const bonds = {
        [musteredUnit.unit.unit.toString()]: [impact2],
      }
      testUpdateHistory({
        deckUnit,
        musters,
        musteredOrigins: {
          [musteredUnit.unit.unit.toString()]: GameUnitOrigin.Hand,
        },
        bonds,
        getBattlefieldUnitResponses: [musteredUnit],
        expectedMoveImpacts: [impact1],
        expectedMusterImpacts: [impact2],
        logPrefix,
      })
    })
    it('calls to addMoveToCurrentPlayer for multiple valid musters', () => {
      const musteredUnit1: BattlefieldUnit = {
        row: Combat.Close,
        unit: TestUtil.getDbGameUnit({}),
      }
      const musteredUnit2: BattlefieldUnit = {
        row: Combat.Close,
        unit: TestUtil.getDbGameUnit({}),
      }
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact1: ImpactDbObject = {
        unit: musteredUnit1.unit,
        user: new ObjectId(),
      }
      const impact2: ImpactDbObject = {
        unit: musteredUnit2.unit,
        user: new ObjectId(),
      }
      const musters = {
        [deckUnit.unit.toString()]: [impact1, impact2],
      }
      testUpdateHistory({
        deckUnit,
        musters,
        musteredOrigins: {
          [musteredUnit2.unit.unit.toString()]: GameUnitOrigin.Undrawn,
          [musteredUnit1.unit.unit.toString()]: GameUnitOrigin.Hand,
        },
        getBattlefieldUnitResponses: [musteredUnit1, musteredUnit2],
        logPrefix,
        expectedMoveImpacts: [impact1, impact2],
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
  deckUnit = TestUtil.getDbDeckUnit({}),
  combat = Combat.Close,
  scorches = {},
  musters = {},
  morales = {},
  bonds = {},
  musteredOrigins,
  logPrefix,
  getBattlefieldUnitResponses = [],
  error,
  expectedMoveImpacts,
  expectedMusterImpacts,
  errorCalls = [],
}: {
  deckUnit?: DeckUnitDbObject
  combat?: Combat | null | undefined
  scorches?: ImpactsByUnitId
  musters?: ImpactsByUnitId
  morales?: ImpactsByUnitId
  bonds?: ImpactsByUnitId
  musteredOrigins?: MusteredOrigins | undefined
  logPrefix: string
  getBattlefieldUnitResponses?: (BattlefieldUnit | undefined)[]
  error?: Error
  expectedMoveImpacts?: ImpactDbObject[]
  expectedMusterImpacts?: ImpactDbObject[]
  errorCalls?: string[][]
}) {
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
    impacts: expectedMoveImpacts,
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
            impacts: expectedMusterImpacts,
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
    for (const muster of musters[deckUnit.unit.toString()]) {
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
        morales,
        bonds,
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
        morales,
        bonds,
      })
    ).toEqual(undefined)
  }

  expect(dateSpy.mock.calls).toEqual([[]])
  expect(getBattlefieldUnitSpy.mock.calls).toEqual(getBattlefieldUnitCalls)
  expect(addMoveToCurrentPlayerSpy.mock.calls).toEqual(addMoveToCurrentPlayerCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
