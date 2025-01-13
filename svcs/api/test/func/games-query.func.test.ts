import { graphql } from 'graphql'

import { addDeck, addGame, addUser, ready, setDeck, setOrder } from './util/graphql-util'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { expectizeGame, expectizeGamePlayer, expectizePlayerRound } from './util/expect-util'
import { FactionKey, GameStatus } from '@gwent/graphql-schema/resolver-typings'
import { getGameFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'

describe('games-query', () => {
  beforeAll(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('games', () => {
    it('returns empty array if no games', async () => {
      const name = `games-${Date.now()}`
      const user = await addUser(name)
      await expect(
        graphql({
          schema,
          source: `{
            games {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user.id,
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          games: [],
        },
      })
    })
    it('returns empty array if only game is for other players', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const name3 = `games-3-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      await addUser(name3)
      await addGame({
        opponentNames: [name3],
        creator: user2,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          games: [],
        },
      })
    })
    it('returns single game if one created', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        creator: user1,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          games: [game],
        },
      })
    })
    it('returns single game if one participated', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name1],
        creator: user2,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          games: [game],
        },
      })
    })
    it('returns multiple games for created with same opponent', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      await addUser(name2)
      const game1 = await addGame({
        opponentNames: [name2],
        creator: user1,
      })
      const game2 = await addGame({
        opponentNames: [name2],
        creator: user1,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          games: [game1, game2],
        },
      })
    })
    it('returns multiple games for created with different opponents', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const name3 = `games-3-${Date.now()}`
      const user1 = await addUser(name1)
      await addUser(name2)
      await addUser(name3)
      const game1 = await addGame({
        opponentNames: [name2],
        creator: user1,
      })
      const game2 = await addGame({
        opponentNames: [name3],
        creator: user1,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          games: [game1, game2],
        },
      })
    })
    it('returns multiple games participated with same opponent', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game1 = await addGame({
        opponentNames: [name1],
        creator: user2,
      })
      const game2 = await addGame({
        opponentNames: [name1],
        creator: user2,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          games: [game1, game2],
        },
      })
    })
    it('returns multiple games participated with different opponents', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const name3 = `games-3-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const user3 = await addUser(name3)
      const game1 = await addGame({
        opponentNames: [name1],
        creator: user2,
      })
      const game2 = await addGame({
        opponentNames: [name1],
        creator: user3,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          games: [game1, game2],
        },
      })
    })
    it('returns multiple games for created and participant', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game1 = await addGame({
        opponentNames: [name2],
        creator: user1,
      })
      const game2 = await addGame({
        opponentNames: [name1],
        creator: user2,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          games: [game1, game2],
        },
      })
    })
    it('returns null for factions and leaders if only creator sets deck', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        creator: user1,
      })
      const deck = await addDeck({
        faction: FactionKey.Monsters,
        name: `games-${Date.now()}`,
        userId: user1.id,
      })
      await setDeck({
        deckId: deck.id,
        gameId: game.id,
        userId: user1.id,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          games: [
            expectizeGame({
              creator: user1,
              players: [
                {
                  user: user1,
                },
                {
                  user: user2,
                },
              ],
            }),
          ],
        },
      })
    })
    it('returns null for factions and leaders if only opponent sets deck', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        creator: user1,
      })
      const deck = await addDeck({
        faction: FactionKey.Monsters,
        name: `games-${Date.now()}`,
        userId: user2.id,
      })
      await setDeck({
        deckId: deck.id,
        gameId: game.id,
        userId: user2.id,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          games: [
            expectizeGame({
              creator: user1,
              players: [
                {
                  user: user1,
                },
                {
                  user: user2,
                },
              ],
            }),
          ],
        },
      })
    })
    it('returns factions and leaders if all players set decks', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        creator: user1,
      })
      const deck1 = await addDeck({
        faction: FactionKey.Monsters,
        name: `games-1-${Date.now()}`,
        userId: user1.id,
      })
      const gameDeck1 = await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `games-2-${Date.now()}`,
        userId: user2.id,
      })
      const gameDeck2 = await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      const gamePlayer1 = expectizeGamePlayer({
        gameDeck: gameDeck1,
        user: user1,
      })
      const gamePlayer2 = expectizeGamePlayer({
        gameDeck: gameDeck2,
        user: user2,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          games: [
            expectizeGame({
              creator: user1,
              status: GameStatus.Ordering,
              players: [gamePlayer1, gamePlayer2],
            }),
          ],
        },
      })
    })
    it('returns factions and leaders if order set', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        creator: user1,
      })
      const deck1 = await addDeck({
        faction: FactionKey.Monsters,
        name: `games-1-${Date.now()}`,
        userId: user1.id,
      })
      const gameDeck1 = await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `games-2-${Date.now()}`,
        userId: user2.id,
      })
      const gameDeck2 = await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      const updatedGame = await setOrder({
        gameId: game.id,
        users: [user1.id, user2.id],
        userId: user2.id,
      })
      const gamePlayer1 = expectizeGamePlayer({
        gameDeck: gameDeck1,
        user: user1,
        order: updatedGame.turn?.user.id === user1.id ? 0 : 1,
      })
      const gamePlayer2 = expectizeGamePlayer({
        gameDeck: gameDeck2,
        user: user2,
        order: updatedGame.turn?.user.id === user2.id ? 0 : 1,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          games: [
            expectizeGame({
              creator: user1,
              status: GameStatus.Redrawing,
              players: [gamePlayer1, gamePlayer2],
              turn: updatedGame.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
            }),
          ],
        },
      })
    })
    it('returns factions and leaders if all players ready', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        creator: user1,
      })
      const deck1 = await addDeck({
        faction: FactionKey.Monsters,
        name: `games-1-${Date.now()}`,
        userId: user1.id,
      })
      const gameDeck1 = await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.Monsters,
        name: `games-2-${Date.now()}`,
        userId: user2.id,
      })
      const gameDeck2 = await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      await ready({
        gameId: game.id,
        userId: user1.id,
      })
      const updatedGame = await ready({
        gameId: game.id,
        userId: user2.id,
      })
      const gamePlayer1 = expectizeGamePlayer({
        gameDeck: gameDeck1,
        user: user1,
        order: updatedGame.turn?.user.id === user1.id ? 0 : 1,
        ready: true,
        rounds: [expectizePlayerRound({})],
      })
      const gamePlayer2 = expectizeGamePlayer({
        gameDeck: gameDeck2,
        user: user2,
        order: updatedGame.turn?.user.id === user2.id ? 0 : 1,
        ready: true,
        rounds: [expectizePlayerRound({})],
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          games: [
            expectizeGame({
              creator: user1,
              status: GameStatus.Playing,
              players: [gamePlayer1, gamePlayer2],
              round: 1,
              turn: updatedGame.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
            }),
          ],
        },
      })
    })
  })
})
