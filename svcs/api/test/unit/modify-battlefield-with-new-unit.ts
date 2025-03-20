import { ObjectId } from 'mongodb'

import { Combat } from '@gwent/graphql-schema/resolver-typings'
import deepClone from '../util/deep-clone'
import modifyBattlefieldWithNewUnit from '../../src/graphql/resolvers/mutations/util/modify-battlefield-with-new-unit'
import TestUtil from '../util/test-util'

describe('modify-battlefield-with-new-unit', () => {
  describe('modifyBattlefieldWithNewUnit', () => {
    describe('close combat', () => {
      describe('only unit', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Close,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [deckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Close,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [deckUnit],
                    },
                  },
                ],
              },
            ],
          })
        })
      })
      describe('other units', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Close,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [origGame.players[0].rounds[0].close.units[0], deckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Close,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [origGame.players[1].rounds[0].close.units[0], deckUnit],
                    },
                  },
                ],
              },
            ],
          })
        })
      })
      describe('second round', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Close,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [deckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Close,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [deckUnit],
                    },
                  },
                ],
              },
            ],
          })
        })
      })
    })
    describe('ranged combat', () => {
      describe('only unit', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Ranged,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [deckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Ranged,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [deckUnit],
                    },
                  },
                ],
              },
            ],
          })
        })
      })
      describe('other units', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Ranged,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [origGame.players[0].rounds[0].ranged.units[0], deckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Ranged,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [origGame.players[1].rounds[0].ranged.units[0], deckUnit],
                    },
                  },
                ],
              },
            ],
          })
        })
      })
      describe('second round', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Ranged,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [deckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Ranged,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [deckUnit],
                    },
                  },
                ],
              },
            ],
          })
        })
      })
    })
    describe('siege combat', () => {
      describe('only unit', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Siege,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [deckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Siege,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [deckUnit],
                    },
                  },
                ],
              },
            ],
          })
        })
      })
      describe('other units', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Siege,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [origGame.players[0].rounds[0].siege.units[0], deckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Siege,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [origGame.players[1].rounds[0].siege.units[0], deckUnit],
                    },
                  },
                ],
              },
            ],
          })
        })
      })
      describe('second round', () => {
        it('removes from hand and adds it to row for round for first player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Siege,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [deckUnit],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const handUnitId = new ObjectId()
          const deckUnit = TestUtil.getDbDeckUnit({
            id: handUnitId,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: handUnitId,
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

          expect(
            modifyBattlefieldWithNewUnit({
              game,
              deckUnit,
              combat: Combat.Siege,
            })
          ).toEqual(undefined)

          expect(game).toEqual({
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
                      units: [deckUnit],
                    },
                  },
                ],
              },
            ],
          })
        })
      })
    })
  })
})
