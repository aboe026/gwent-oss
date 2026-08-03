import { ObjectId } from 'mongodb'

import { Combat, DeckUnitDbObject, GameDbObject } from '@gwent-oss/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import EffectSpy, { PotentialSpies } from '../../src/graphql/resolvers/mutations/play-unit/effect-spy'
import { GameUnitType } from '@gwent-oss/graphql-schema'
import TestUtil from '../util/test-util'
import * as utils from '@gwent-oss/utils'

describe('effect-spy', () => {
  describe('spyBattlefield', () => {
    const logPrefix = 'log-prefix'
    it('throws error if cannot find opponent', () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const undrawn1 = TestUtil.getDbDeckUnit({})
      const undrawn2 = TestUtil.getDbDeckUnit({})
      const self = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          undrawn: [undrawn1, undrawn2],
        }),
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({}),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        turn: self.user,
        round: 1,
      })
      const targetId = new ObjectId().toString()
      const message = `Could not find opponent "${targetId}"`
      testSpyBattlefield({
        logPrefix,
        game,
        newDeckUnit,
        combat: Combat.Close,
        targetId,
        isSpy: true,
        expected: Error(message),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if cannot find self', () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const undrawn1 = TestUtil.getDbDeckUnit({})
      const undrawn2 = TestUtil.getDbDeckUnit({})
      const self = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          undrawn: [undrawn1, undrawn2],
        }),
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({}),
          }),
        ],
      })
      const turn = new ObjectId()
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        turn,
        round: 1,
      })
      const message = `Could not find current turn user "${turn}"`
      testSpyBattlefield({
        logPrefix,
        game,
        newDeckUnit,
        combat: Combat.Close,
        targetId: opponent.user.toString(),
        isSpy: true,
        expected: Error(message),
        debugCalls: [
          [`${logPrefix} putting spy "${newDeckUnit.unit}" in "${Combat.Close}" row of opponent "${opponent.user}"`],
        ],
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('does not apply spy if isSpy false', () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const undrawn1 = TestUtil.getDbDeckUnit({})
      const undrawn2 = TestUtil.getDbDeckUnit({})
      const self = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          undrawn: [undrawn1, undrawn2],
        }),
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({}),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        turn: self.user,
        round: 1,
      })
      testSpyBattlefield({
        logPrefix,
        game,
        newDeckUnit,
        combat: Combat.Close,
        targetId: opponent.user.toString(),
        isSpy: false,
        expected: {
          deckUnitsAddedToHand: [],
          impacts: {},
        },
      })
    })
    describe('close combat', () => {
      const combat = Combat.Close
      it('adds spy to opponent and self hands 0 from undrawn if 0 available in undrawn', () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            undrawn: [],
          }),
        })
        const opponent = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              close: TestUtil.getDbPlayerCombatRow({}),
            }),
          ],
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          turn: self.user,
          round: 1,
        })
        const updatedGame = deepClone(game)
        testSpyBattlefield({
          logPrefix,
          game,
          newDeckUnit,
          combat,
          targetId: opponent.user.toString(),
          isSpy: true,
          getRandomNumberResponses: [0],
          expected: {
            deckUnitsAddedToHand: [],
            impacts: {
              [newDeckUnit.unit.toString()]: [],
            },
          },
          updatedGame: {
            ...updatedGame,
            players: [
              {
                ...updatedGame.players[0],
              },
              {
                ...updatedGame.players[1],
                rounds: [
                  {
                    ...updatedGame.players[1].rounds[0],
                    close: {
                      ...updatedGame.players[1].rounds[0].close,
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    },
                  },
                ],
              },
            ],
          },
          debugCalls: [
            [`${logPrefix} putting spy "${newDeckUnit.unit}" in "${combat}" row of opponent "${opponent.user}"`],
          ],
        })
      })
      it('adds spy to opponent and self hands 1 from undrawn if 1 available in undrawn', () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const undrawn = TestUtil.getDbDeckUnit({})
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            undrawn: [undrawn],
          }),
        })
        const opponent = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              close: TestUtil.getDbPlayerCombatRow({}),
            }),
          ],
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          turn: self.user,
          round: 1,
        })
        const updatedGame = deepClone(game)
        testSpyBattlefield({
          logPrefix,
          game,
          newDeckUnit,
          combat,
          targetId: opponent.user.toString(),
          isSpy: true,
          getRandomNumberResponses: [0],
          expected: {
            deckUnitsAddedToHand: [undrawn],
            impacts: {
              [newDeckUnit.unit.toString()]: [
                {
                  unit: TestUtil.getDbGameUnit({
                    artStyle: undrawn.artStyle,
                    id: undrawn.unit,
                    type: GameUnitType.Deck,
                  }),
                  user: self.user,
                },
              ],
            },
          },
          updatedGame: {
            ...updatedGame,
            players: [
              {
                ...updatedGame.players[0],
                deck: {
                  ...updatedGame.players[0].deck,
                  hand: [undrawn],
                  undrawn: [],
                },
              },
              {
                ...updatedGame.players[1],
                rounds: [
                  {
                    ...updatedGame.players[1].rounds[0],
                    close: {
                      ...updatedGame.players[1].rounds[0].close,
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    },
                  },
                ],
              },
            ],
          },
          getRandomNumberCalls: [
            [
              {
                min: 0,
                max: 0,
              },
            ],
          ],
          debugCalls: [
            [`${logPrefix} putting spy "${newDeckUnit.unit}" in "${combat}" row of opponent "${opponent.user}"`],
            [`${logPrefix} moving undrawn unit "${undrawn.unit}" to hand due to spy "${newDeckUnit.unit}"`],
          ],
        })
      })
      it('adds spy to opponent and self hands 2 from undrawn if 2 available in undrawn', () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const undrawn1 = TestUtil.getDbDeckUnit({})
        const undrawn2 = TestUtil.getDbDeckUnit({})
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            undrawn: [undrawn1, undrawn2],
          }),
        })
        const opponent = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              close: TestUtil.getDbPlayerCombatRow({}),
            }),
          ],
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          turn: self.user,
          round: 1,
        })
        const updatedGame = deepClone(game)
        testSpyBattlefield({
          logPrefix,
          game,
          newDeckUnit,
          combat,
          targetId: opponent.user.toString(),
          isSpy: true,
          getRandomNumberResponses: [0, 0],
          expected: {
            deckUnitsAddedToHand: [undrawn1, undrawn2],
            impacts: {
              [newDeckUnit.unit.toString()]: [
                {
                  unit: TestUtil.getDbGameUnit({
                    artStyle: undrawn1.artStyle,
                    id: undrawn1.unit,
                    type: GameUnitType.Deck,
                  }),
                  user: self.user,
                },
                {
                  unit: TestUtil.getDbGameUnit({
                    artStyle: undrawn2.artStyle,
                    id: undrawn2.unit,
                    type: GameUnitType.Deck,
                  }),
                  user: self.user,
                },
              ],
            },
          },
          updatedGame: {
            ...updatedGame,
            players: [
              {
                ...updatedGame.players[0],
                deck: {
                  ...updatedGame.players[0].deck,
                  hand: [undrawn1, undrawn2],
                  undrawn: [],
                },
              },
              {
                ...updatedGame.players[1],
                rounds: [
                  {
                    ...updatedGame.players[1].rounds[0],
                    close: {
                      ...updatedGame.players[1].rounds[0].close,
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    },
                  },
                ],
              },
            ],
          },
          getRandomNumberCalls: [
            [
              {
                min: 0,
                max: 1,
              },
            ],
            [
              {
                min: 0,
                max: 0,
              },
            ],
          ],
          debugCalls: [
            [`${logPrefix} putting spy "${newDeckUnit.unit}" in "${combat}" row of opponent "${opponent.user}"`],
            [`${logPrefix} moving undrawn unit "${undrawn1.unit}" to hand due to spy "${newDeckUnit.unit}"`],
            [`${logPrefix} moving undrawn unit "${undrawn2.unit}" to hand due to spy "${newDeckUnit.unit}"`],
          ],
        })
      })
      it('adds spy to opponent and self hands 2 from undrawn if more than 2 available in undrawn', () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const undrawn1 = TestUtil.getDbDeckUnit({})
        const undrawn2 = TestUtil.getDbDeckUnit({})
        const undrawn3 = TestUtil.getDbDeckUnit({})
        const undrawn4 = TestUtil.getDbDeckUnit({})
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            undrawn: [undrawn1, undrawn2, undrawn3, undrawn4],
          }),
        })
        const opponent = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              close: TestUtil.getDbPlayerCombatRow({}),
            }),
          ],
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          turn: self.user,
          round: 1,
        })
        const updatedGame = deepClone(game)
        testSpyBattlefield({
          logPrefix,
          game,
          newDeckUnit,
          combat,
          targetId: opponent.user.toString(),
          isSpy: true,
          getRandomNumberResponses: [2, 0],
          expected: {
            deckUnitsAddedToHand: [undrawn3, undrawn1],
            impacts: {
              [newDeckUnit.unit.toString()]: [
                {
                  unit: TestUtil.getDbGameUnit({
                    artStyle: undrawn3.artStyle,
                    id: undrawn3.unit,
                    type: GameUnitType.Deck,
                  }),
                  user: self.user,
                },
                {
                  unit: TestUtil.getDbGameUnit({
                    artStyle: undrawn1.artStyle,
                    id: undrawn1.unit,
                    type: GameUnitType.Deck,
                  }),
                  user: self.user,
                },
              ],
            },
          },
          updatedGame: {
            ...updatedGame,
            players: [
              {
                ...updatedGame.players[0],
                deck: {
                  ...updatedGame.players[0].deck,
                  hand: [undrawn3, undrawn1],
                  undrawn: [undrawn2, undrawn4],
                },
              },
              {
                ...updatedGame.players[1],
                rounds: [
                  {
                    ...updatedGame.players[1].rounds[0],
                    close: {
                      ...updatedGame.players[1].rounds[0].close,
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    },
                  },
                ],
              },
            ],
          },
          getRandomNumberCalls: [
            [
              {
                min: 0,
                max: 3,
              },
            ],
            [
              {
                min: 0,
                max: 2,
              },
            ],
          ],
          debugCalls: [
            [`${logPrefix} putting spy "${newDeckUnit.unit}" in "${combat}" row of opponent "${opponent.user}"`],
            [`${logPrefix} moving undrawn unit "${undrawn3.unit}" to hand due to spy "${newDeckUnit.unit}"`],
            [`${logPrefix} moving undrawn unit "${undrawn1.unit}" to hand due to spy "${newDeckUnit.unit}"`],
          ],
        })
      })
    })
    describe('ranged combat', () => {
      const combat = Combat.Ranged
      it('adds spy to opponent and self hands 0 from undrawn if 0 available in undrawn', () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            undrawn: [],
          }),
        })
        const opponent = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              ranged: TestUtil.getDbPlayerCombatRow({}),
            }),
          ],
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          turn: self.user,
          round: 1,
        })
        const updatedGame = deepClone(game)
        testSpyBattlefield({
          logPrefix,
          game,
          newDeckUnit,
          combat,
          targetId: opponent.user.toString(),
          isSpy: true,
          getRandomNumberResponses: [0],
          expected: {
            deckUnitsAddedToHand: [],
            impacts: {
              [newDeckUnit.unit.toString()]: [],
            },
          },
          updatedGame: {
            ...updatedGame,
            players: [
              {
                ...updatedGame.players[0],
              },
              {
                ...updatedGame.players[1],
                rounds: [
                  {
                    ...updatedGame.players[1].rounds[0],
                    ranged: {
                      ...updatedGame.players[1].rounds[0].ranged,
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    },
                  },
                ],
              },
            ],
          },
          debugCalls: [
            [`${logPrefix} putting spy "${newDeckUnit.unit}" in "${combat}" row of opponent "${opponent.user}"`],
          ],
        })
      })
      it('adds spy to opponent and self hands 1 from undrawn if 1 available in undrawn', () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const undrawn = TestUtil.getDbDeckUnit({})
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            undrawn: [undrawn],
          }),
        })
        const opponent = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              ranged: TestUtil.getDbPlayerCombatRow({}),
            }),
          ],
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          turn: self.user,
          round: 1,
        })
        const updatedGame = deepClone(game)
        testSpyBattlefield({
          logPrefix,
          game,
          newDeckUnit,
          combat,
          targetId: opponent.user.toString(),
          isSpy: true,
          getRandomNumberResponses: [0],
          expected: {
            deckUnitsAddedToHand: [undrawn],
            impacts: {
              [newDeckUnit.unit.toString()]: [
                {
                  unit: TestUtil.getDbGameUnit({
                    artStyle: undrawn.artStyle,
                    id: undrawn.unit,
                    type: GameUnitType.Deck,
                  }),
                  user: self.user,
                },
              ],
            },
          },
          updatedGame: {
            ...updatedGame,
            players: [
              {
                ...updatedGame.players[0],
                deck: {
                  ...updatedGame.players[0].deck,
                  hand: [undrawn],
                  undrawn: [],
                },
              },
              {
                ...updatedGame.players[1],
                rounds: [
                  {
                    ...updatedGame.players[1].rounds[0],
                    ranged: {
                      ...updatedGame.players[1].rounds[0].ranged,
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    },
                  },
                ],
              },
            ],
          },
          getRandomNumberCalls: [
            [
              {
                min: 0,
                max: 0,
              },
            ],
          ],
          debugCalls: [
            [`${logPrefix} putting spy "${newDeckUnit.unit}" in "${combat}" row of opponent "${opponent.user}"`],
            [`${logPrefix} moving undrawn unit "${undrawn.unit}" to hand due to spy "${newDeckUnit.unit}"`],
          ],
        })
      })
      it('adds spy to opponent and self hands 2 from undrawn if 2 available in undrawn', () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const undrawn1 = TestUtil.getDbDeckUnit({})
        const undrawn2 = TestUtil.getDbDeckUnit({})
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            undrawn: [undrawn1, undrawn2],
          }),
        })
        const opponent = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              ranged: TestUtil.getDbPlayerCombatRow({}),
            }),
          ],
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          turn: self.user,
          round: 1,
        })
        const updatedGame = deepClone(game)
        testSpyBattlefield({
          logPrefix,
          game,
          newDeckUnit,
          combat,
          targetId: opponent.user.toString(),
          isSpy: true,
          getRandomNumberResponses: [0, 0],
          expected: {
            deckUnitsAddedToHand: [undrawn1, undrawn2],
            impacts: {
              [newDeckUnit.unit.toString()]: [
                {
                  unit: TestUtil.getDbGameUnit({
                    artStyle: undrawn1.artStyle,
                    id: undrawn1.unit,
                    type: GameUnitType.Deck,
                  }),
                  user: self.user,
                },
                {
                  unit: TestUtil.getDbGameUnit({
                    artStyle: undrawn2.artStyle,
                    id: undrawn2.unit,
                    type: GameUnitType.Deck,
                  }),
                  user: self.user,
                },
              ],
            },
          },
          updatedGame: {
            ...updatedGame,
            players: [
              {
                ...updatedGame.players[0],
                deck: {
                  ...updatedGame.players[0].deck,
                  hand: [undrawn1, undrawn2],
                  undrawn: [],
                },
              },
              {
                ...updatedGame.players[1],
                rounds: [
                  {
                    ...updatedGame.players[1].rounds[0],
                    ranged: {
                      ...updatedGame.players[1].rounds[0].ranged,
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    },
                  },
                ],
              },
            ],
          },
          getRandomNumberCalls: [
            [
              {
                min: 0,
                max: 1,
              },
            ],
            [
              {
                min: 0,
                max: 0,
              },
            ],
          ],
          debugCalls: [
            [`${logPrefix} putting spy "${newDeckUnit.unit}" in "${combat}" row of opponent "${opponent.user}"`],
            [`${logPrefix} moving undrawn unit "${undrawn1.unit}" to hand due to spy "${newDeckUnit.unit}"`],
            [`${logPrefix} moving undrawn unit "${undrawn2.unit}" to hand due to spy "${newDeckUnit.unit}"`],
          ],
        })
      })
      it('adds spy to opponent and self hands 2 from undrawn if more than 2 available in undrawn', () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const undrawn1 = TestUtil.getDbDeckUnit({})
        const undrawn2 = TestUtil.getDbDeckUnit({})
        const undrawn3 = TestUtil.getDbDeckUnit({})
        const undrawn4 = TestUtil.getDbDeckUnit({})
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            undrawn: [undrawn1, undrawn2, undrawn3, undrawn4],
          }),
        })
        const opponent = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              ranged: TestUtil.getDbPlayerCombatRow({}),
            }),
          ],
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          turn: self.user,
          round: 1,
        })
        const updatedGame = deepClone(game)
        testSpyBattlefield({
          logPrefix,
          game,
          newDeckUnit,
          combat,
          targetId: opponent.user.toString(),
          isSpy: true,
          getRandomNumberResponses: [2, 0],
          expected: {
            deckUnitsAddedToHand: [undrawn3, undrawn1],
            impacts: {
              [newDeckUnit.unit.toString()]: [
                {
                  unit: TestUtil.getDbGameUnit({
                    artStyle: undrawn3.artStyle,
                    id: undrawn3.unit,
                    type: GameUnitType.Deck,
                  }),
                  user: self.user,
                },
                {
                  unit: TestUtil.getDbGameUnit({
                    artStyle: undrawn1.artStyle,
                    id: undrawn1.unit,
                    type: GameUnitType.Deck,
                  }),
                  user: self.user,
                },
              ],
            },
          },
          updatedGame: {
            ...updatedGame,
            players: [
              {
                ...updatedGame.players[0],
                deck: {
                  ...updatedGame.players[0].deck,
                  hand: [undrawn3, undrawn1],
                  undrawn: [undrawn2, undrawn4],
                },
              },
              {
                ...updatedGame.players[1],
                rounds: [
                  {
                    ...updatedGame.players[1].rounds[0],
                    ranged: {
                      ...updatedGame.players[1].rounds[0].ranged,
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    },
                  },
                ],
              },
            ],
          },
          getRandomNumberCalls: [
            [
              {
                min: 0,
                max: 3,
              },
            ],
            [
              {
                min: 0,
                max: 2,
              },
            ],
          ],
          debugCalls: [
            [`${logPrefix} putting spy "${newDeckUnit.unit}" in "${combat}" row of opponent "${opponent.user}"`],
            [`${logPrefix} moving undrawn unit "${undrawn3.unit}" to hand due to spy "${newDeckUnit.unit}"`],
            [`${logPrefix} moving undrawn unit "${undrawn1.unit}" to hand due to spy "${newDeckUnit.unit}"`],
          ],
        })
      })
    })
    describe('siege combat', () => {
      const combat = Combat.Siege
      it('adds spy to opponent and self hands 0 from undrawn if 0 available in undrawn', () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            undrawn: [],
          }),
        })
        const opponent = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              siege: TestUtil.getDbPlayerCombatRow({}),
            }),
          ],
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          turn: self.user,
          round: 1,
        })
        const updatedGame = deepClone(game)
        testSpyBattlefield({
          logPrefix,
          game,
          newDeckUnit,
          combat,
          targetId: opponent.user.toString(),
          isSpy: true,
          getRandomNumberResponses: [0],
          expected: {
            deckUnitsAddedToHand: [],
            impacts: {
              [newDeckUnit.unit.toString()]: [],
            },
          },
          updatedGame: {
            ...updatedGame,
            players: [
              {
                ...updatedGame.players[0],
              },
              {
                ...updatedGame.players[1],
                rounds: [
                  {
                    ...updatedGame.players[1].rounds[0],
                    siege: {
                      ...updatedGame.players[1].rounds[0].siege,
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    },
                  },
                ],
              },
            ],
          },
          debugCalls: [
            [`${logPrefix} putting spy "${newDeckUnit.unit}" in "${combat}" row of opponent "${opponent.user}"`],
          ],
        })
      })
      it('adds spy to opponent and self hands 1 from undrawn if 1 available in undrawn', () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const undrawn = TestUtil.getDbDeckUnit({})
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            undrawn: [undrawn],
          }),
        })
        const opponent = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              siege: TestUtil.getDbPlayerCombatRow({}),
            }),
          ],
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          turn: self.user,
          round: 1,
        })
        const updatedGame = deepClone(game)
        testSpyBattlefield({
          logPrefix,
          game,
          newDeckUnit,
          combat,
          targetId: opponent.user.toString(),
          isSpy: true,
          getRandomNumberResponses: [0],
          expected: {
            deckUnitsAddedToHand: [undrawn],
            impacts: {
              [newDeckUnit.unit.toString()]: [
                {
                  unit: TestUtil.getDbGameUnit({
                    artStyle: undrawn.artStyle,
                    id: undrawn.unit,
                    type: GameUnitType.Deck,
                  }),
                  user: self.user,
                },
              ],
            },
          },
          updatedGame: {
            ...updatedGame,
            players: [
              {
                ...updatedGame.players[0],
                deck: {
                  ...updatedGame.players[0].deck,
                  hand: [undrawn],
                  undrawn: [],
                },
              },
              {
                ...updatedGame.players[1],
                rounds: [
                  {
                    ...updatedGame.players[1].rounds[0],
                    siege: {
                      ...updatedGame.players[1].rounds[0].siege,
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    },
                  },
                ],
              },
            ],
          },
          getRandomNumberCalls: [
            [
              {
                min: 0,
                max: 0,
              },
            ],
          ],
          debugCalls: [
            [`${logPrefix} putting spy "${newDeckUnit.unit}" in "${combat}" row of opponent "${opponent.user}"`],
            [`${logPrefix} moving undrawn unit "${undrawn.unit}" to hand due to spy "${newDeckUnit.unit}"`],
          ],
        })
      })
      it('adds spy to opponent and self hands 2 from undrawn if 2 available in undrawn', () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const undrawn1 = TestUtil.getDbDeckUnit({})
        const undrawn2 = TestUtil.getDbDeckUnit({})
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            undrawn: [undrawn1, undrawn2],
          }),
        })
        const opponent = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              siege: TestUtil.getDbPlayerCombatRow({}),
            }),
          ],
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          turn: self.user,
          round: 1,
        })
        const updatedGame = deepClone(game)
        testSpyBattlefield({
          logPrefix,
          game,
          newDeckUnit,
          combat,
          targetId: opponent.user.toString(),
          isSpy: true,
          getRandomNumberResponses: [0, 0],
          expected: {
            deckUnitsAddedToHand: [undrawn1, undrawn2],
            impacts: {
              [newDeckUnit.unit.toString()]: [
                {
                  unit: TestUtil.getDbGameUnit({
                    artStyle: undrawn1.artStyle,
                    id: undrawn1.unit,
                    type: GameUnitType.Deck,
                  }),
                  user: self.user,
                },
                {
                  unit: TestUtil.getDbGameUnit({
                    artStyle: undrawn2.artStyle,
                    id: undrawn2.unit,
                    type: GameUnitType.Deck,
                  }),
                  user: self.user,
                },
              ],
            },
          },
          updatedGame: {
            ...updatedGame,
            players: [
              {
                ...updatedGame.players[0],
                deck: {
                  ...updatedGame.players[0].deck,
                  hand: [undrawn1, undrawn2],
                  undrawn: [],
                },
              },
              {
                ...updatedGame.players[1],
                rounds: [
                  {
                    ...updatedGame.players[1].rounds[0],
                    siege: {
                      ...updatedGame.players[1].rounds[0].siege,
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    },
                  },
                ],
              },
            ],
          },
          getRandomNumberCalls: [
            [
              {
                min: 0,
                max: 1,
              },
            ],
            [
              {
                min: 0,
                max: 0,
              },
            ],
          ],
          debugCalls: [
            [`${logPrefix} putting spy "${newDeckUnit.unit}" in "${combat}" row of opponent "${opponent.user}"`],
            [`${logPrefix} moving undrawn unit "${undrawn1.unit}" to hand due to spy "${newDeckUnit.unit}"`],
            [`${logPrefix} moving undrawn unit "${undrawn2.unit}" to hand due to spy "${newDeckUnit.unit}"`],
          ],
        })
      })
      it('adds spy to opponent and self hands 2 from undrawn if more than 2 available in undrawn', () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const undrawn1 = TestUtil.getDbDeckUnit({})
        const undrawn2 = TestUtil.getDbDeckUnit({})
        const undrawn3 = TestUtil.getDbDeckUnit({})
        const undrawn4 = TestUtil.getDbDeckUnit({})
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            undrawn: [undrawn1, undrawn2, undrawn3, undrawn4],
          }),
        })
        const opponent = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              siege: TestUtil.getDbPlayerCombatRow({}),
            }),
          ],
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          turn: self.user,
          round: 1,
        })
        const updatedGame = deepClone(game)
        testSpyBattlefield({
          logPrefix,
          game,
          newDeckUnit,
          combat,
          targetId: opponent.user.toString(),
          isSpy: true,
          getRandomNumberResponses: [2, 0],
          expected: {
            deckUnitsAddedToHand: [undrawn3, undrawn1],
            impacts: {
              [newDeckUnit.unit.toString()]: [
                {
                  unit: TestUtil.getDbGameUnit({
                    artStyle: undrawn3.artStyle,
                    id: undrawn3.unit,
                    type: GameUnitType.Deck,
                  }),
                  user: self.user,
                },
                {
                  unit: TestUtil.getDbGameUnit({
                    artStyle: undrawn1.artStyle,
                    id: undrawn1.unit,
                    type: GameUnitType.Deck,
                  }),
                  user: self.user,
                },
              ],
            },
          },
          updatedGame: {
            ...updatedGame,
            players: [
              {
                ...updatedGame.players[0],
                deck: {
                  ...updatedGame.players[0].deck,
                  hand: [undrawn3, undrawn1],
                  undrawn: [undrawn2, undrawn4],
                },
              },
              {
                ...updatedGame.players[1],
                rounds: [
                  {
                    ...updatedGame.players[1].rounds[0],
                    siege: {
                      ...updatedGame.players[1].rounds[0].siege,
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    },
                  },
                ],
              },
            ],
          },
          getRandomNumberCalls: [
            [
              {
                min: 0,
                max: 3,
              },
            ],
            [
              {
                min: 0,
                max: 2,
              },
            ],
          ],
          debugCalls: [
            [`${logPrefix} putting spy "${newDeckUnit.unit}" in "${combat}" row of opponent "${opponent.user}"`],
            [`${logPrefix} moving undrawn unit "${undrawn3.unit}" to hand due to spy "${newDeckUnit.unit}"`],
            [`${logPrefix} moving undrawn unit "${undrawn1.unit}" to hand due to spy "${newDeckUnit.unit}"`],
          ],
        })
      })
    })
  })
})

function testSpyBattlefield({
  game,
  logPrefix,
  newDeckUnit,
  combat,
  targetId,
  isSpy,
  getRandomNumberResponses,
  expected,
  updatedGame,
  getRandomNumberCalls = [],
  errorCalls = [],
  debugCalls = [],
}: {
  game: GameDbObject
  logPrefix: string
  newDeckUnit: DeckUnitDbObject
  combat: Combat | null | undefined
  targetId: string | undefined | null
  isSpy: boolean
  getRandomNumberResponses?: number[]
  expected: PotentialSpies | Error
  updatedGame?: GameDbObject
  getRandomNumberCalls?: any[][]
  errorCalls?: string[][]
  debugCalls?: string[][]
}) {
  const getRandomNumberSpy = jest.spyOn(utils, 'getRandomNumber')
  if (getRandomNumberResponses) {
    for (const getRandomNumberResponse of getRandomNumberResponses) {
      getRandomNumberSpy.mockReturnValueOnce(getRandomNumberResponse)
    }
  }
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  EffectSpy['logger'] = {
    error: errorSpy,
    debug: debugSpy,
  } as any

  if (expected instanceof Error) {
    expect(() =>
      EffectSpy.spyBattlefield({
        combat,
        game,
        isSpy,
        logPrefix,
        newDeckUnit,
        targetId,
      })
    ).toThrow(expected)
  } else {
    expect(
      EffectSpy.spyBattlefield({
        combat,
        game,
        isSpy,
        logPrefix,
        newDeckUnit,
        targetId,
      })
    ).toEqual(expected)
  }

  if (updatedGame) {
    expect(game).toEqual(updatedGame)
  }
  expect(getRandomNumberSpy.mock.calls).toEqual(getRandomNumberCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
}
