import { ObjectId } from 'mongodb'

import { Combat } from '@gwent/graphql-schema/resolver-typings'
import {
  DeckUnitDbObject,
  GameDbObject,
  GameUnitDbObject,
  GameUnitOrigin,
  ImpactDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import EffectDecoy from '../../src/graphql/resolvers/mutations/play-unit/effect-decoy'
import EffectMardroeme from '../../src/graphql/resolvers/mutations/play-unit/effect-mardroeme'
import { ImpactsByUnitId } from '../../src/graphql/resolvers/resolver-util'
import modifyBattlefieldWithNewUnit, {
  addNewUnitToBattlefield,
} from '../../src/graphql/resolvers/mutations/play-unit/modify-battlefield-with-new-unit'
import MusterBattlefield, { MusteredOrigins } from '../../src/graphql/resolvers/mutations/play-unit/effect-muster'
import ScorchBattlefield from '../../src/graphql/resolvers/mutations/play-unit/effect-scorch'
import TestUtil from '../util/test-util'

describe('modify-battlefield-with-new-unit', () => {
  describe('modifyBattlefieldWithNewUnit', () => {
    it('returns undefined if no impacts', async () => {
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        newUnit: TestUtil.getDbUnit({}),
      })
    })
    it('returns single impact for muster', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        musterImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        musteredUnits: [
          TestUtil.getDbUnit({
            id: impacts[0].unit.unit,
          }),
        ],
        musteredOrigins: {
          [impacts[0].unit.unit.toString()]: GameUnitOrigin.Hand,
        },
      })
    })
    it('returns multiple impacts for muster', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        musterImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        musteredUnits: [
          TestUtil.getDbUnit({
            id: impacts[0].unit.unit,
          }),
          TestUtil.getDbUnit({
            id: impacts[1].unit.unit,
          }),
        ],
        musteredOrigins: {
          [impacts[0].unit.unit.toString()]: GameUnitOrigin.Hand,
          [impacts[1].unit.unit.toString()]: GameUnitOrigin.Undrawn,
        },
      })
    })
    it('returns single impact for scorch', () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        scorchImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
      })
    })
    it('returns multiple impacts for scorch', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        scorchImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
      })
    })
    it('returns single impact for mardroeme', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        mardroemeImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        mardroemeTransformedUnits: [
          TestUtil.getDbUnit({
            id: impacts[0].unit.unit,
          }),
        ],
        mardroemeTransformedGameUnits: [
          TestUtil.getDbGameUnit({
            id: impacts[0].unit.unit,
          }),
        ],
        mardroemingGameUnit: TestUtil.getDbGameUnit({
          id: newDeckUnit.unit,
        }),
      })
    })
    it('returns multiple impacts for mardroeme', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        mardroemeImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        mardroemeTransformedUnits: [
          TestUtil.getDbUnit({
            id: impacts[0].unit.unit,
          }),
          TestUtil.getDbUnit({
            id: impacts[1].unit.unit,
          }),
        ],
        mardroemeTransformedGameUnits: [
          TestUtil.getDbGameUnit({
            id: impacts[0].unit.unit,
          }),
          TestUtil.getDbGameUnit({
            id: impacts[1].unit.unit,
          }),
        ],
        mardroemingGameUnit: TestUtil.getDbGameUnit({
          id: newDeckUnit.unit,
        }),
      })
    })
    it('returns single impact and deckUnitAddedToHand for decoy', () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        decoyImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        deckUnitAddedToHand: impacts[0].unit,
      })
    })
  })
  describe('addNewUnitToBattlefield', () => {
    describe('close combat', () => {
      const combat = Combat.Close
      describe('only unit', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    close: {
                      score: 0,
                      units: [newDeckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    close: {
                      score: 0,
                      units: [],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    close: {
                      score: 0,
                      units: [newDeckUnit],
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    close: {
                      score: 0,
                      units: [],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('other units', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    close: {
                      score: 0,
                      units: [origGame.players[0].rounds[0].close.units[0], newDeckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    close: {
                      score: 0,
                      units: [origGame.players[0].rounds[0].close.units[0]],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [origGame.players[1].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    close: {
                      score: 0,
                      units: [origGame.players[1].rounds[0].close.units[0], newDeckUnit],
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [origGame.players[1].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    close: {
                      score: 0,
                      units: [origGame.players[1].rounds[0].close.units[0]],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('second round', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    close: {
                      score: 0,
                      units: [newDeckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    close: {
                      score: 0,
                      units: [],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[1].rounds[0],
                  {
                    ...origGame.players[1].rounds[1],
                    close: {
                      score: 0,
                      units: [newDeckUnit],
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[1].rounds[0],
                  {
                    ...origGame.players[1].rounds[1],
                    close: {
                      score: 0,
                      units: [],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
    })
    describe('ranged combat', () => {
      const combat = Combat.Ranged
      describe('only unit', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    ranged: {
                      score: 0,
                      units: [newDeckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    ranged: {
                      score: 0,
                      units: [],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    ranged: {
                      score: 0,
                      units: [newDeckUnit],
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    ranged: {
                      score: 0,
                      units: [],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('other units', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    ranged: {
                      score: 0,
                      units: [origGame.players[0].rounds[0].ranged.units[0], newDeckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    ranged: {
                      score: 0,
                      units: [origGame.players[0].rounds[0].ranged.units[0]],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [origGame.players[1].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    ranged: {
                      score: 0,
                      units: [origGame.players[1].rounds[0].ranged.units[0], newDeckUnit],
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [origGame.players[1].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    ranged: {
                      score: 0,
                      units: [origGame.players[1].rounds[0].ranged.units[0]],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('second round', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    ranged: {
                      score: 0,
                      units: [newDeckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    ranged: {
                      score: 0,
                      units: [],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[1].rounds[0],
                  {
                    ...origGame.players[1].rounds[1],
                    ranged: {
                      score: 0,
                      units: [newDeckUnit],
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[1].rounds[0],
                  {
                    ...origGame.players[1].rounds[1],
                    ranged: {
                      score: 0,
                      units: [],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
    })
    describe('siege combat', () => {
      const combat = Combat.Siege
      describe('only unit', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    siege: {
                      score: 0,
                      units: [newDeckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    siege: {
                      score: 0,
                      units: [],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    siege: {
                      score: 0,
                      units: [newDeckUnit],
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    siege: {
                      score: 0,
                      units: [],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('other units', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    siege: {
                      score: 0,
                      units: [origGame.players[0].rounds[0].siege.units[0], newDeckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    siege: {
                      score: 0,
                      units: [origGame.players[0].rounds[0].siege.units[0]],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [origGame.players[1].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    siege: {
                      score: 0,
                      units: [origGame.players[1].rounds[0].siege.units[0], newDeckUnit],
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [origGame.players[1].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    siege: {
                      score: 0,
                      units: [origGame.players[1].rounds[0].siege.units[0]],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('second round', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    siege: {
                      score: 0,
                      units: [newDeckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    siege: {
                      score: 0,
                      units: [],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[1].rounds[0],
                  {
                    ...origGame.players[1].rounds[1],
                    siege: {
                      score: 0,
                      units: [newDeckUnit],
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[1].rounds[0],
                  {
                    ...origGame.players[1].rounds[1],
                    siege: {
                      score: 0,
                      units: [],
                      modifier: newDeckUnit,
                    },
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
    })
    describe('no combat', () => {
      const combat = null
      describe('only unit', () => {
        it('removes from hand and does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: origGame.players[0].rounds,
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: origGame.players[1].rounds,
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('other units', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
                rounds: origGame.players[0].rounds,
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [origGame.players[1].deck.hand[0]],
                },
                rounds: origGame.players[1].rounds,
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('second round', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: origGame.players[0].rounds,
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: origGame.players[1].rounds,
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
    })
  })
})

async function testModifyBattlefieldWithNewUnit({
  newDeckUnit,
  newUnit,
  musterImpacts = {},
  musteredUnits = [],
  musteredOrigins = {},
  scorchImpacts = {},
  mardroemeImpacts = {},
  mardroemeTransformedGameUnits = [],
  mardroemeTransformedUnits = [],
  mardroemingGameUnit,
  decoyImpacts = {},
  deckUnitAddedToHand,
}: {
  newDeckUnit: DeckUnitDbObject
  newUnit: UnitDbObject
  musterImpacts?: ImpactsByUnitId
  musteredUnits?: UnitDbObject[]
  musteredOrigins?: MusteredOrigins
  scorchImpacts?: ImpactsByUnitId
  mardroemeImpacts?: ImpactsByUnitId
  mardroemeTransformedUnits?: UnitDbObject[]
  mardroemeTransformedGameUnits?: GameUnitDbObject[]
  mardroemingGameUnit?: GameUnitDbObject
  decoyImpacts?: ImpactsByUnitId
  deckUnitAddedToHand?: DeckUnitDbObject
}) {
  const battlefieldUnits = [TestUtil.getDbUnit({})]
  const combat = Combat.Close
  const targetId = new ObjectId().toString()
  const effects = [TestUtil.getDbEffect({})]
  const game = TestUtil.getDbGame({})
  const logPrefix = 'log-prefix'

  const musterBattlefieldSpy = jest.spyOn(MusterBattlefield, 'musterBattlefield').mockResolvedValue({
    impacts: musterImpacts,
    musteredUnits,
    musteredOrigins,
  })
  const scorchBattlefieldSpy = jest.spyOn(ScorchBattlefield, 'scorchBattlefield').mockReturnValue(scorchImpacts)
  const transformBerserkersSpy = jest.spyOn(EffectMardroeme, 'transformBerserkers').mockResolvedValue({
    impacts: mardroemeImpacts,
    transformedUnits: mardroemeTransformedUnits,
    transformedGameUnits: mardroemeTransformedGameUnits,
    mardroemingGameUnit: mardroemingGameUnit,
  })
  const decoyFromBattlefieldSpy = jest.spyOn(EffectDecoy, 'decoyFromBattlefield').mockReturnValue({
    impacts: decoyImpacts,
    deckUnitAddedToHand,
  })

  await expect(
    modifyBattlefieldWithNewUnit({
      battlefieldUnits,
      effects,
      game,
      logPrefix,
      newDeckUnit,
      newUnit,
      combat,
      targetId,
    })
  ).resolves.toEqual({
    scorches: scorchImpacts,
    musters: musterImpacts,
    musteredUnits,
    musteredOrigins,
    mardroemes: mardroemeImpacts,
    transformedUnits: mardroemeTransformedUnits,
    transformedGameUnits: mardroemeTransformedGameUnits,
    mardroemingGameUnit: mardroemingGameUnit,
    decoys: decoyImpacts,
    deckUnitsAddedToHand: deckUnitAddedToHand ? [deckUnitAddedToHand] : [],
  })

  expect(musterBattlefieldSpy.mock.calls).toEqual([
    [
      {
        battlefieldUnits,
        effects,
        game,
        logPrefix,
        newDeckUnit,
      },
    ],
  ])
  expect(scorchBattlefieldSpy.mock.calls).toEqual([
    [
      {
        battlefieldUnits,
        effects,
        game,
        logPrefix,
        newDeckUnit,
      },
    ],
  ])
  expect(transformBerserkersSpy.mock.calls).toEqual([
    [
      {
        battlefieldUnits: [...battlefieldUnits, ...musteredUnits],
        effects,
        game,
        logPrefix,
        newDeckUnit,
        combat,
      },
    ],
  ])
  expect(decoyFromBattlefieldSpy.mock.calls).toEqual([
    [
      {
        game,
        logPrefix,
        newDeckUnit,
        combat,
        targetId,
      },
    ],
  ])
}

function testAddNewUnitToBattlefield({
  combat,
  newDeckUnit,
  newUnit,
  game,
  expected,
}: {
  combat: Combat | null
  newDeckUnit: DeckUnitDbObject
  newUnit: UnitDbObject
  game: GameDbObject
  expected: GameDbObject
}) {
  expect(
    addNewUnitToBattlefield({
      combat,
      game,
      newDeckUnit,
      newUnit,
    })
  ).toEqual(undefined)

  expect(game).toEqual(expected)
}
