import { ObjectId } from 'mongodb'

import { Combat } from '@gwent/graphql-schema/resolver-typings'
import {
  DeckUnitDbObject,
  GameDbObject,
  GameUnitOrigin,
  ImpactDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
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
        scorchImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
      })
    })
  })
  describe('addNewUnitToBattlefield', () => {
    describe('close combat', () => {
      const combat = Combat.Close
      describe('only unit', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
      })
      describe('other units', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
      })
      describe('second round', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
      })
      describe('other units', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
      })
      describe('second round', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
      })
      describe('other units', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
      })
      describe('second round', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
      })
    })
    describe('no combat', () => {
      const combat = null
      describe('only unit', () => {
        it('removes from hand and does not addi it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
      })
      describe('other units', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
      })
      describe('second round', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
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
            expected,
          })
        })
      })
    })
  })
})

async function testModifyBattlefieldWithNewUnit({
  newDeckUnit,
  musterImpacts = {},
  musteredUnits = [],
  musteredOrigins = {},
  scorchImpacts = {},
}: {
  newDeckUnit: DeckUnitDbObject
  musterImpacts?: ImpactsByUnitId
  musteredUnits?: UnitDbObject[]
  musteredOrigins?: MusteredOrigins
  scorchImpacts?: ImpactsByUnitId
}) {
  const battlefieldUnits = [TestUtil.getDbUnit({})]
  const combat = Combat.Close
  const effects = [TestUtil.getDbEffect({})]
  const game = TestUtil.getDbGame({})
  const logPrefix = 'log-prefix'

  const musterBattlefieldSpy = jest.spyOn(MusterBattlefield, 'musterBattlefield').mockResolvedValue({
    impacts: musterImpacts,
    musteredUnits,
    musteredOrigins,
  })
  const scorchBattlefieldSpy = jest.spyOn(ScorchBattlefield, 'scorchBattlefield').mockReturnValue(scorchImpacts)

  await expect(
    modifyBattlefieldWithNewUnit({
      battlefieldUnits,
      effects,
      game,
      logPrefix,
      newDeckUnit,
      combat,
    })
  ).resolves.toEqual({
    scorches: scorchImpacts,
    musters: musterImpacts,
    musteredUnits,
    musteredOrigins,
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
}

function testAddNewUnitToBattlefield({
  combat,
  newDeckUnit,
  game,
  expected,
}: {
  combat: Combat | null
  newDeckUnit: DeckUnitDbObject
  game: GameDbObject
  expected: GameDbObject
}) {
  expect(
    addNewUnitToBattlefield({
      combat,
      game,
      newDeckUnit,
    })
  ).toEqual(undefined)

  expect(game).toEqual(expected)
}
