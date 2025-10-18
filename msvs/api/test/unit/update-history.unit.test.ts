import { ObjectId } from 'mongodb'

import {
  Combat,
  DeckUnitDbObject,
  GameDbObject,
  GameUnitDbObject,
  GameUnitOrigin,
  ImpactDbObject,
  MoveReasonType,
  MoveUnitDbObject,
  MoveUnitReasonDbObject,
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
      testNewUnitDeployed({
        deckUnit,
        musters,
        logPrefix,
        error: Error(`${message}.`),
        expectedImpacts: [],
        errorCalls: [[`${logPrefix} failed: ${message}, musters: "${JSON.stringify(musters)}"`]],
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
      testNewUnitDeployed({
        deckUnit,
        musters,
        musteredOrigins: {},
        logPrefix,
        error: Error(`${message}.`),
        expectedImpacts: [impact],
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('calls addMoveToCurrentPlayer once without impacts close', () => {
      testNewUnitDeployed({
        logPrefix,
      })
    })
    it('calls addMoveToCurrentPlayer once without impacts ranged', () => {
      testNewUnitDeployed({
        combat: Combat.Ranged,
        logPrefix,
      })
    })
    it('calls addMoveToCurrentPlayer once without impacts siege', () => {
      testNewUnitDeployed({
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
      testNewUnitDeployed({
        deckUnit,
        scorches: {
          [deckUnit.unit.toString()]: [impact],
        },
        logPrefix,
        expectedImpacts: [impact],
      })
    })
    it('calls addMoveToCurrentPlayer once with morale impact', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testNewUnitDeployed({
        deckUnit,
        morales: {
          [deckUnit.unit.toString()]: [impact],
        },
        logPrefix,
        expectedImpacts: [impact],
      })
    })
    it('calls addMoveToCurrentPlayer once with bond impact', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testNewUnitDeployed({
        deckUnit,
        bonds: {
          [deckUnit.unit.toString()]: [impact],
        },
        logPrefix,
        expectedImpacts: [impact],
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
      testNewUnitDeployed({
        logPrefix,
        deckUnit,
        musters,
        musteredOrigins: {
          [musteredUnit.unit.unit.toString()]: GameUnitOrigin.Hand,
        },
        expectedImpacts: [impact],
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
      testNewUnitDeployed({
        deckUnit,
        musters,
        musteredOrigins: {
          [musteredUnit.unit.unit.toString()]: GameUnitOrigin.Hand,
        },
        bonds,
        expectedImpacts: [impact1],
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
      testNewUnitDeployed({
        deckUnit,
        musters,
        musteredOrigins: {
          [musteredUnit2.unit.unit.toString()]: GameUnitOrigin.Undrawn,
          [musteredUnit1.unit.unit.toString()]: GameUnitOrigin.Hand,
        },
        logPrefix,
        expectedImpacts: [impact1, impact2],
      })
    })
    it('calls to addMoveToCurrentPlayer for single mardroeme without mardroemingGameUnit', () => {
      const mardroeming: BattlefieldUnit = {
        row: Combat.Close,
        unit: TestUtil.getDbGameUnit({}),
      }
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: mardroeming.unit,
        user: new ObjectId(),
      }
      const mardroemes = {
        [deckUnit.unit.toString()]: [impact],
      }
      testNewUnitDeployed({
        logPrefix,
        deckUnit,
        mardroemes,
        transformedGameUnits: [
          TestUtil.getDbGameUnit({
            id: impact.unit.unit,
          }),
        ],
        expectedImpacts: [impact],
      })
    })
    it('calls to addMoveToCurrentPlayer for single mardroeme with mardroemingGameUnit', () => {
      const mardroeming: BattlefieldUnit = {
        row: Combat.Close,
        unit: TestUtil.getDbGameUnit({}),
      }
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: mardroeming.unit,
        user: new ObjectId(),
      }
      const mardroemes = {
        [deckUnit.unit.toString()]: [impact],
      }
      testNewUnitDeployed({
        logPrefix,
        deckUnit,
        mardroemes,
        mardroemingGameUnit: mardroeming.unit,
        transformedGameUnits: [
          TestUtil.getDbGameUnit({
            id: impact.unit.unit,
          }),
        ],
        expectedImpacts: [impact],
      })
    })
  })
  describe('newUnitIndirect', () => {
    const logPrefix = 'log-prefix'
    it('throws error if unit not found on battlefield', () => {
      const unitId = new ObjectId()
      const message = `Could not find indirect unit "${unitId}" on battlefield`
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId,
        created: new Date(),
        logPrefix,
        origin: GameUnitOrigin.Nondeck,
        playerId: new ObjectId().toString(),
        reason: {
          type: MoveReasonType.Muster,
        },
        getBattlefieldUnitResponse: undefined,
        error: Error(`${message}.`),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('calls to addMoveToCurrentPlayer without impact', () => {
      const combat = Combat.Close
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          row: combat,
        }),
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getBattlefieldUnitResponse: {
          row: combat,
          unit: move.unit,
        },
        move,
      })
    })
    it('calls to addMoveToCurrentPlayer with scorch impact', () => {
      const combat = Combat.Close
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          row: combat,
        }),
        impacts: [impact],
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getBattlefieldUnitResponse: {
          row: combat,
          unit: move.unit,
        },
        scorches: {
          [move.unit.unit.toString()]: [impact],
        },
        move,
      })
    })
    it('calls to addMoveToCurrentPlayer with mardroeme impact', () => {
      const combat = Combat.Close
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          row: combat,
        }),
        impacts: [impact],
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getBattlefieldUnitResponse: {
          row: combat,
          unit: move.unit,
        },
        mardroemes: {
          [move.unit.unit.toString()]: [impact],
        },
        move,
      })
    })
    it('calls to addMoveToCurrentPlayer with muster impact', () => {
      const combat = Combat.Close
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          row: combat,
        }),
        impacts: [impact],
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getBattlefieldUnitResponse: {
          row: combat,
          unit: move.unit,
        },
        musters: {
          [move.unit.unit.toString()]: [impact],
        },
        move,
      })
    })
    it('calls to addMoveToCurrentPlayer with bond impact', () => {
      const combat = Combat.Close
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          row: combat,
        }),
        impacts: [impact],
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getBattlefieldUnitResponse: {
          row: combat,
          unit: move.unit,
        },
        bonds: {
          [move.unit.unit.toString()]: [impact],
        },
        move,
      })
    })
    it('calls to addMoveToCurrentPlayer with morale impact', () => {
      const combat = Combat.Close
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          row: combat,
        }),
        impacts: [impact],
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getBattlefieldUnitResponse: {
          row: combat,
          unit: move.unit,
        },
        morales: {
          [move.unit.unit.toString()]: [impact],
        },
        move,
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

function testNewUnitDeployed({
  deckUnit = TestUtil.getDbDeckUnit({}),
  combat = Combat.Close,
  scorches = {},
  musters = {},
  morales = {},
  mardroemes = {},
  bonds = {},
  musteredOrigins,
  transformedGameUnits,
  mardroemingGameUnit,
  logPrefix,
  error,
  expectedImpacts: expectedImpacts,
  errorCalls = [],
}: {
  deckUnit?: DeckUnitDbObject
  combat?: Combat | null | undefined
  scorches?: ImpactsByUnitId
  musters?: ImpactsByUnitId
  morales?: ImpactsByUnitId
  mardroemes?: ImpactsByUnitId
  bonds?: ImpactsByUnitId
  musteredOrigins?: MusteredOrigins | undefined
  transformedGameUnits?: GameUnitDbObject[]
  mardroemingGameUnit?: GameUnitDbObject
  logPrefix: string
  error?: Error
  expectedImpacts?: ImpactDbObject[]
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
    impacts: expectedImpacts,
    reason: {
      type: MoveReasonType.Deploy,
    },
    source: {
      origin: GameUnitOrigin.Hand,
    },
    type: MoveType.Unit,
  }
  const addMoveToCurrentPlayerSpy = jest.spyOn(UpdateHistory, 'addMoveToCurrentPlayer').mockImplementation()
  const getBattlefieldUnitSpy = jest
    .spyOn(GetBattlefieldUnit, 'getBattlefieldUnit')
    .mockReturnValueOnce(battlefieldUnit)
  const newUnitIndirectSpy = jest.spyOn(UpdateHistory as any, 'newUnitIndirect').mockImplementation()
  const newUnitIndirectCalls: any[][] = []
  if (musters[deckUnit.unit.toString()]) {
    for (const muster of musters[deckUnit.unit.toString()]) {
      if (musteredOrigins && musteredOrigins[muster.unit.unit.toString()]) {
        newUnitIndirectCalls.push([
          {
            bonds,
            created: move.created,
            game,
            logPrefix,
            mardroemes,
            morales,
            musters,
            origin: musteredOrigins && musteredOrigins[muster.unit.unit.toString()],
            playerId,
            reason: {
              type: MoveReasonType.Muster,
              unit: deckUnit,
            },
            scorches,
            unitId: muster.unit.unit,
          },
        ])
      }
    }
  }
  if (transformedGameUnits) {
    for (const transformedGameUnit of transformedGameUnits) {
      newUnitIndirectCalls.push([
        {
          bonds,
          created: move.created,
          game,
          logPrefix,
          mardroemes,
          morales,
          musters,
          origin: GameUnitOrigin.Nondeck,
          playerId,
          reason: {
            type: MoveReasonType.Transform,
            unit: mardroemingGameUnit
              ? {
                  artStyle: mardroemingGameUnit.artStyle,
                  unit: mardroemingGameUnit.unit,
                }
              : deckUnit,
          },
          scorches,
          unitId: transformedGameUnit.unit,
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
        mardroemes,
        transformedGameUnits,
        mardroemingGameUnit,
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
        mardroemes,
        transformedGameUnits,
        mardroemingGameUnit,
      })
    ).toEqual(undefined)
  }

  expect(dateSpy.mock.calls).toEqual([[]])
  expect(getBattlefieldUnitSpy.mock.calls).toEqual([
    [
      {
        game,
        unitId: deckUnit.unit,
        userId: playerId,
      },
    ],
  ])
  expect(addMoveToCurrentPlayerSpy.mock.calls).toEqual([
    [
      {
        game,
        move,
      },
    ],
  ])
  expect(newUnitIndirectSpy.mock.calls).toEqual(newUnitIndirectCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

function testNewUnitIndirect({
  game,
  unitId,
  created,
  playerId,
  logPrefix,
  origin,
  scorches = {},
  mardroemes = {},
  musters = {},
  bonds = {},
  morales = {},
  reason,
  getBattlefieldUnitResponse,
  move,
  error,
  errorCalls = [],
}: {
  game: GameDbObject
  unitId: ObjectId
  created: Date
  playerId: string
  logPrefix: string
  origin: GameUnitOrigin
  scorches?: ImpactsByUnitId
  mardroemes?: ImpactsByUnitId
  musters?: ImpactsByUnitId
  bonds?: ImpactsByUnitId
  morales?: ImpactsByUnitId
  reason: MoveUnitReasonDbObject
  getBattlefieldUnitResponse: BattlefieldUnit | undefined
  move?: MoveUnitDbObject
  error?: Error
  errorCalls?: string[][]
}) {
  const getBattlefieldUnitSpy = jest
    .spyOn(GetBattlefieldUnit, 'getBattlefieldUnit')
    .mockReturnValue(getBattlefieldUnitResponse)
  const addMoveToCurrentPlayerSpy = jest.spyOn(UpdateHistory as any, 'addMoveToCurrentPlayer').mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  UpdateHistory['logger'] = {
    error: errorSpy,
  } as any

  if (error) {
    expect(() =>
      UpdateHistory['newUnitIndirect']({
        bonds,
        created,
        game,
        logPrefix,
        mardroemes,
        morales,
        musters,
        origin,
        playerId,
        reason,
        scorches,
        unitId,
      })
    ).toThrow(error)
  } else {
    expect(
      UpdateHistory['newUnitIndirect']({
        bonds,
        created,
        game,
        logPrefix,
        mardroemes,
        morales,
        musters,
        origin,
        playerId,
        reason,
        scorches,
        unitId,
      })
    ).toEqual(undefined)
  }

  expect(getBattlefieldUnitSpy.mock.calls).toEqual([
    [
      {
        game,
        unitId,
        userId: playerId,
      },
    ],
  ])
  expect(addMoveToCurrentPlayerSpy.mock.calls).toEqual(
    error
      ? []
      : [
          [
            {
              game,
              move,
            },
          ],
        ]
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
