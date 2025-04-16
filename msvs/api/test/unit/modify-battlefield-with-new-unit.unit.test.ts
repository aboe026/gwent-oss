import { Combat } from '@gwent/graphql-schema/resolver-typings'
import deepClone from '../util/deep-clone'
import modifyBattlefieldWithNewUnit from '../../src/graphql/resolvers/mutations/play-unit/modify-battlefield-with-new-unit'
import TestUtil from '../util/test-util'
import { DeckUnitDbObject, GameDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import * as scorchBattlefield from '../../src/graphql/resolvers/mutations/play-unit/scorch-battlefield'

describe('modify-battlefield-with-new-unit', () => {
  describe('modifyBattlefieldWithNewUnit', () => {
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

          testModifyBattlefieldWithNewUnit({
            battlefieldUnits: self.deck.hand.map((handUnit) =>
              TestUtil.getDbUnit({
                id: handUnit.unit,
              })
            ),
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

function testModifyBattlefieldWithNewUnit({
  combat,
  battlefieldUnits,
  newDeckUnit,
  game,
  expected,
}: {
  combat: Combat
  battlefieldUnits: UnitDbObject[]
  newDeckUnit: DeckUnitDbObject
  game: GameDbObject
  expected: GameDbObject
}) {
  const effects = [TestUtil.getDbEffect({})]
  const scorchBattlefieldSpy = jest.spyOn(scorchBattlefield, 'default').mockImplementation()

  expect(
    modifyBattlefieldWithNewUnit({
      combat,
      battlefieldUnits,
      game,
      effects,
      newDeckUnit,
    })
  ).toEqual(undefined)

  expect(game).toEqual(expected)
  expect(scorchBattlefieldSpy.mock.calls).toEqual([
    [
      {
        battlefieldUnits,
        effects,
        game,
        newDeckUnit,
      },
    ],
  ])
}
