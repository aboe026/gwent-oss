import { GraphQLError, graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { addDeck, addGame, addUser, setDeck, setOrder } from './util/graphql-util'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { expectizeGame, expectizeGamePlayer } from './util/expect-util'
import { FactionKey, Game, GameStatus } from '@gwent/graphql-schema/resolver-typings'
import { getGameFragment } from './util/fragment-util'
import { NOT_AUTHORIZED_MESSAGE } from '@gwent/constants'
import schema from '../../src/graphql/executable-schema'

describe('setOrder', () => {
  beforeAll(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('invalid', () => {
    it('throws error if game does not exist', async () => {
      const name = `setOrder-${Date.now()}`
      const user = await addUser(name)
      const id = new ObjectId()
      await expect(
        graphql({
          schema,
          source: `mutation {
              setOrder(
                game: "${id.toString()}"
              ) {
                ${getGameFragment({})}
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
        data: null,
        errors: [new GraphQLError(NOT_AUTHORIZED_MESSAGE)],
      })
    })
    it('throws error if player not part of game', async () => {
      const name1 = `setOrder-1-${Date.now()}`
      const name2 = `setOrder-2-${Date.now()}`
      const name3 = `setOrder-3-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      await addUser(name3)
      const game = await addGame({
        opponentNames: [name3],
        userId: user2.id,
      })
      await expect(
        graphql({
          schema,
          source: `mutation {
              setOrder(
                game: "${game.id}"
              ) {
                ${getGameFragment({})}
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
        data: null,
        errors: [new GraphQLError(NOT_AUTHORIZED_MESSAGE)],
      })
    })
    it('throws error if no decks set', async () => {
      const name1 = `setOrder-1-${Date.now()}`
      const name2 = `setOrder-2-${Date.now()}`
      const user1 = await addUser(name1)
      await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      await expect(
        graphql({
          schema,
          source: `mutation {
              setOrder(
                game: "${game.id}"
              ) {
                ${getGameFragment({})}
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
        data: null,
        errors: [new GraphQLError(`Not all players have chosen decks yet for game "${game.id}".`)],
      })
    })
    it('throws error if only self deck set', async () => {
      const name1 = `setOrder-1-${Date.now()}`
      const name2 = `setOrder-2-${Date.now()}`
      const user1 = await addUser(name1)
      await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `setOrder-deck-self-${Date.now()}`,
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
          source: `mutation {
              setOrder(
                game: "${game.id}"
              ) {
                ${getGameFragment({})}
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
        data: null,
        errors: [new GraphQLError(`Not all players have chosen decks yet for game "${game.id}".`)],
      })
    })
    it('throws error if only opponent deck set', async () => {
      const name1 = `setOrder-1-${Date.now()}`
      const name2 = `setOrder-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `setOrder-deck-opponent-${Date.now()}`,
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
          source: `mutation {
              setOrder(
                game: "${game.id}"
              ) {
                ${getGameFragment({})}
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
        data: null,
        errors: [new GraphQLError(`Not all players have chosen decks yet for game "${game.id}".`)],
      })
    })
    it('throws error if order already set', async () => {
      const name1 = `setOrder-1-${Date.now()}`
      const name2 = `setOrder-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck1 = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `setOrder-${Date.now()}`,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.Monsters,
        name: `setOrder-${Date.now()}`,
        userId: user2.id,
      })
      await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      await setOrder({
        gameId: game.id,
        users: [user1.id, user2.id],
        userId: user1.id,
      })
      await expect(
        graphql({
          schema,
          source: `mutation {
              setOrder(
                game: "${game.id}"
              ) {
                ${getGameFragment({})}
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
        data: null,
        errors: [new GraphQLError(`Game with ID "${game.id}" already has order set.`)],
      })
    })
    it('throws error if setting explicit order with deck that is not scoitael', async () => {
      const name1 = `setOrder-1-${Date.now()}`
      const name2 = `setOrder-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck1 = await addDeck({
        faction: FactionKey.NorthernRealms,
        name: `setOrder-${Date.now()}`,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `setOrder-${Date.now()}`,
        userId: user2.id,
      })
      await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      await expect(
        graphql({
          schema,
          source: `mutation {
              setOrder(
                game: "${game.id}"
                users: ["${user1.id}", "${user2.id}"]
              ) {
                ${getGameFragment({})}
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
        data: null,
        errors: [
          new GraphQLError(
            `Cannot set order as another player for game "${game.id}" has a deck faction of "${FactionKey.ScoiaTael}" which allows them to set game order.`
          ),
        ],
      })
    })
    it('throws error if setting implicit order with deck that is not scoitael', async () => {
      const name1 = `setOrder-1-${Date.now()}`
      const name2 = `setOrder-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck1 = await addDeck({
        faction: FactionKey.NorthernRealms,
        name: `setOrder-${Date.now()}`,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `setOrder-${Date.now()}`,
        userId: user2.id,
      })
      await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      await expect(
        graphql({
          schema,
          source: `mutation {
              setOrder(
                game: "${game.id}"
              ) {
                ${getGameFragment({})}
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
        data: null,
        errors: [
          new GraphQLError(
            `Cannot set order as another player for game "${game.id}" has a deck faction of "${FactionKey.ScoiaTael}" which allows them to set game order.`
          ),
        ],
      })
    })
    it('throws error if first user not a player on game', async () => {
      const name1 = `setOrder-1-${Date.now()}`
      const name2 = `setOrder-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck1 = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `setOrder-${Date.now()}`,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.NorthernRealms,
        name: `setOrder-${Date.now()}`,
        userId: user2.id,
      })
      await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      const id = new ObjectId().toString()
      await expect(
        graphql({
          schema,
          source: `mutation {
              setOrder(
                game: "${game.id}"
                users: ["${id}", "${user2.id}"]
              ) {
                ${getGameFragment({})}
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
        data: null,
        errors: [new GraphQLError(`Cannot set order as users(s) ["${id}"] are not players on game "${game.id}".`)],
      })
    })
    it('throws error if second user not a player on game', async () => {
      const name1 = `setOrder-1-${Date.now()}`
      const name2 = `setOrder-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck1 = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `setOrder-${Date.now()}`,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.NorthernRealms,
        name: `setOrder-${Date.now()}`,
        userId: user2.id,
      })
      await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      const id = new ObjectId().toString()
      await expect(
        graphql({
          schema,
          source: `mutation {
              setOrder(
                game: "${game.id}"
                users: ["${user1.id}", "${id}"]
              ) {
                ${getGameFragment({})}
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
        data: null,
        errors: [new GraphQLError(`Cannot set order as users(s) ["${id}"] are not players on game "${game.id}".`)],
      })
    })
    it('throws error if all users not a player on game', async () => {
      const name1 = `setOrder-1-${Date.now()}`
      const name2 = `setOrder-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck1 = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `setOrder-${Date.now()}`,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.NorthernRealms,
        name: `setOrder-${Date.now()}`,
        userId: user2.id,
      })
      await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      const id1 = new ObjectId().toString()
      const id2 = new ObjectId().toString()
      await expect(
        graphql({
          schema,
          source: `mutation {
              setOrder(
                game: "${game.id}"
                users: ["${id1}", "${id2}"]
              ) {
                ${getGameFragment({})}
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
        data: null,
        errors: [
          new GraphQLError(`Cannot set order as users(s) ["${id1}","${id2}"] are not players on game "${game.id}".`),
        ],
      })
    })
    it('throws error if not all players specified', async () => {
      const name1 = `setOrder-1-${Date.now()}`
      const name2 = `setOrder-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck1 = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `setOrder-${Date.now()}`,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.NorthernRealms,
        name: `setOrder-${Date.now()}`,
        userId: user2.id,
      })
      await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      await expect(
        graphql({
          schema,
          source: `mutation {
              setOrder(
                game: "${game.id}"
                users: ["${user1.id}"]
              ) {
                ${getGameFragment({})}
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
        data: null,
        errors: [
          new GraphQLError(
            `Cannot set order as users count of "1" does not match player count of "2" for game "${game.id}".`
          ),
        ],
      })
    })
    it('throws error if duplicate players specified', async () => {
      const name1 = `setOrder-1-${Date.now()}`
      const name2 = `setOrder-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck1 = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `setOrder-${Date.now()}`,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.NorthernRealms,
        name: `setOrder-${Date.now()}`,
        userId: user2.id,
      })
      await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      await expect(
        graphql({
          schema,
          source: `mutation {
              setOrder(
                game: "${game.id}"
                users: ["${user1.id}", "${user1.id}"]
              ) {
                ${getGameFragment({})}
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
        data: null,
        errors: [new GraphQLError(`Cannot set order for game "${game.id}" as duplicate user IDs specified.`)],
      })
    })
  })
  describe('valid', () => {
    it('explicit order self first', async () => {
      const name1 = `setOrder-1-${Date.now()}`
      const name2 = `setOrder-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck1 = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `setOrder-${Date.now()}`,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.NorthernRealms,
        name: `setOrder-${Date.now()}`,
        userId: user2.id,
      })
      const gameDeck1 = await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      const gameDeck2 = await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      const response = await graphql({
        schema,
        source: `mutation {
              setOrder(
                game: "${game.id}"
                users: ["${user1.id}", "${user2.id}"]
              ) {
                ${getGameFragment({})}
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
      const gamePlayer1 = expectizeGamePlayer({
        gameDeck: gameDeck1,
        user: user1,
        order: 0,
      })
      expect(response).toEqual({
        data: {
          setOrder: expectizeGame({
            creator: user1,
            players: [
              gamePlayer1,
              expectizeGamePlayer({
                gameDeck: gameDeck2,
                user: user2,
                order: 1,
              }),
            ],
            status: GameStatus.Redrawing,
            turn: gamePlayer1,
          }),
        },
      })
    })
    it('explicit order self second', async () => {
      const name1 = `setOrder-1-${Date.now()}`
      const name2 = `setOrder-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck1 = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `setOrder-${Date.now()}`,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.NorthernRealms,
        name: `setOrder-${Date.now()}`,
        userId: user2.id,
      })
      const gameDeck1 = await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      const gameDeck2 = await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      const response = await graphql({
        schema,
        source: `mutation {
              setOrder(
                game: "${game.id}"
                users: ["${user2.id}", "${user1.id}"]
              ) {
                ${getGameFragment({})}
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
      const gamePlayer2 = expectizeGamePlayer({
        gameDeck: gameDeck2,
        user: user2,
        order: 0,
      })
      expect(response).toEqual({
        data: {
          setOrder: expectizeGame({
            creator: user1,
            players: [
              expectizeGamePlayer({
                gameDeck: gameDeck1,
                user: user1,
                order: 1,
              }),
              gamePlayer2,
            ],
            status: GameStatus.Redrawing,
            turn: gamePlayer2,
          }),
        },
      })
    })
    it('implicit order', async () => {
      const name1 = `setOrder-1-${Date.now()}`
      const name2 = `setOrder-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck1 = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `setOrder-${Date.now()}`,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.NorthernRealms,
        name: `setOrder-${Date.now()}`,
        userId: user2.id,
      })
      const gameDeck1 = await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      const gameDeck2 = await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      const response = await graphql({
        schema,
        source: `mutation {
              setOrder(
                game: "${game.id}"
              ) {
                ${getGameFragment({})}
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
      const selfFirst = (response.data?.setOrder as Game).turn?.user.id === user1.id
      const gamePlayer1 = expectizeGamePlayer({
        gameDeck: gameDeck1,
        user: user1,
        order: selfFirst ? 0 : 1,
      })
      const gamePlayer2 = expectizeGamePlayer({
        gameDeck: gameDeck2,
        user: user2,
        order: selfFirst ? 1 : 0,
      })
      expect(response).toEqual({
        data: {
          setOrder: expectizeGame({
            creator: user1,
            players: [gamePlayer1, gamePlayer2],
            status: GameStatus.Redrawing,
            turn: selfFirst ? gamePlayer1 : gamePlayer2,
          }),
        },
      })
    })
  })
})
