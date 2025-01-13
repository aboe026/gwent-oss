import { GraphQLError, graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { addDeck, addGame, addUser, getGame, getGameDeck, setDeck } from './util/graphql-util'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { expectizeGame, expectizeGameDeck, expectizeGamePlayer, verifyGameDeckSet } from './util/expect-util'
import { FactionKey, GameDeck, GameStatus } from '@gwent/graphql-schema/resolver-typings'
import { getGameDeckFragment } from './util/fragment-util'
import { NOT_AUTHORIZED_MESSAGE } from '@gwent/constants'
import schema from '../../src/graphql/executable-schema'

describe('set-deck-mutation', () => {
  beforeAll(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('setDeck', () => {
    describe('invalid', () => {
      it('returns error if invalid game ID', async () => {
        const name1 = `setDeck-1-${Date.now()}`
        const name2 = `setDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `setDeck-${Date.now()}`,
          userId: user1.id,
        })
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        await expect(
          getGameDeck({
            gameId: game.id,
            userId: user1.id,
          })
        ).resolves.toEqual(null)
        const gameId = 'invalid'
        await expect(
          graphql({
            schema,
            source: `mutation {
            setDeck(
              deck: "${deck.id}"
              game: "${gameId}"
            ) {
              ${getGameDeckFragment()}
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
          errors: [new GraphQLError(`Game ID "${gameId}" not a valid MongoDB ObjectId.`)],
        })
      })
      it('returns error if invalid deck ID', async () => {
        const name1 = `setDeck-1-${Date.now()}`
        const name2 = `setDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        await addDeck({
          faction: FactionKey.Monsters,
          name: `setDeck-${Date.now()}`,
          userId: user1.id,
        })
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        await expect(
          getGameDeck({
            gameId: game.id,
            userId: user1.id,
          })
        ).resolves.toEqual(null)
        const deckId = 'invalid'
        await expect(
          graphql({
            schema,
            source: `mutation {
            setDeck(
              deck: "${deckId}"
              game: "${game.id}"
            ) {
              ${getGameDeckFragment()}
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
          errors: [new GraphQLError(`Deck ID "${deckId}" not a valid MongoDB ObjectId.`)],
        })
      })
      it('throws error if deck does not exist', async () => {
        const name = `setDeck-${Date.now()}`
        const user = await addUser(name)
        const deckId = new ObjectId()
        await expect(
          graphql({
            schema,
            source: `mutation {
              setDeck(
                deck: "${deckId}"
                game: "${new ObjectId()}"
              ) {
                ${getGameDeckFragment()}
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
      it('throws error if game does not exist', async () => {
        const name = `setDeck-${Date.now()}`
        const user = await addUser(name)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `setDeck-${Date.now()}`,
          userId: user.id,
        })
        const gameId = new ObjectId()
        await expect(
          graphql({
            schema,
            source: `mutation {
              setDeck(
                deck: "${deck.id}"
                game: "${gameId}"
              ) {
                ${getGameDeckFragment()}
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
      it('throws error if user is not a player in the game', async () => {
        const name1 = `setDeck-1-${Date.now()}`
        const name2 = `setDeck-2-${Date.now()}`
        const name3 = `setDeck-3-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const user3 = await addUser(name3)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `setDeck-${Date.now()}`,
          userId: user1.id,
        })
        const game = await addGame({
          opponentNames: [name2],
          creator: user3,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              setDeck(
                deck: "${deck.id}"
                game: "${game.id}"
              ) {
                ${getGameDeckFragment()}
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
      it('throws error if deck already set', async () => {
        const name1 = `setDeck-1-${Date.now()}`
        const name2 = `setDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `setDeck-${Date.now()}`,
          userId: user1.id,
        })
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        const gameDeck = await getGameDeck({
          gameId: game.id,
          userId: user1.id,
        })
        expect(gameDeck).toEqual(
          expectizeGameDeck({
            deck: {
              factionKey: deck.faction.key,
              leaderName: deck.leader.name,
              name: deck.name,
              unitNames: deck.units.map((unit) => unit.unit.name),
              user: user1,
            },
            discards: [],
            redraws: [],
          })
        )
        verifyGameDeckSet(gameDeck, deck)
        await expect(
          graphql({
            schema,
            source: `mutation {
              setDeck(
                deck: "${deck.id}"
                game: "${game.id}"
              ) {
                ${getGameDeckFragment()}
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
          errors: [new GraphQLError(`Deck already set for game "${game.id}".`)],
        })
        const gameDeckAfterSet = await getGameDeck({
          gameId: game.id,
          userId: user1.id,
        })
        expect(gameDeckAfterSet).toEqual(
          expectizeGameDeck({
            deck: {
              factionKey: deck.faction.key,
              leaderName: deck.leader.name,
              name: deck.name,
              unitNames: deck.units.map((unit) => unit.unit.name),
              user: user1,
            },
            discards: [],
            redraws: [],
          })
        )
        verifyGameDeckSet(gameDeckAfterSet, deck)
      })
      it('throws error if deck id not valid ObjectId', async () => {
        const name1 = `setDeck-1-${Date.now()}`
        const name2 = `setDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        const deckId = 'invalid'
        await expect(
          graphql({
            schema,
            source: `mutation {
              setDeck(
                deck: "${deckId}"
                game: "${game.id}"
              ) {
                ${getGameDeckFragment()}
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
          errors: [new GraphQLError(`Deck ID "${deckId}" not a valid MongoDB ObjectId.`)],
        })
      })
      it('throws error if user does not own deck', async () => {
        const name1 = `setDeck-1-${Date.now()}`
        const name2 = `setDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `setDeck-${Date.now()}`,
          userId: user2.id,
        })
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              setDeck(
                deck: "${deck.id}"
                game: "${game.id}"
              ) {
                ${getGameDeckFragment()}
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
    })
    describe('valid', () => {
      it('sets deck for game creator', async () => {
        const name1 = `setDeck-1-${Date.now()}`
        const name2 = `setDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `setDeck-${Date.now()}`,
          userId: user1.id,
        })
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        await expect(
          getGameDeck({
            gameId: game.id,
            userId: user1.id,
          })
        ).resolves.toEqual(null)
        const response = await graphql({
          schema,
          source: `mutation {
            setDeck(
              deck: "${deck.id}"
              game: "${game.id}"
            ) {
              ${getGameDeckFragment()}
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
        expect(response).toEqual({
          data: {
            setDeck: expectizeGameDeck({
              deck: {
                factionKey: deck.faction.key,
                leaderName: deck.leader.name,
                name: deck.name,
                unitNames: deck.units.map((unit) => unit.unit.name),
                user: user1,
              },
              discards: [],
              redraws: [],
            }),
          },
        })
        verifyGameDeckSet((response as any).data.setDeck, deck)

        const updatedGame = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        expect(updatedGame).toEqual(
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
          })
        )
        expect(updatedGame.updated.getTime()).toBeGreaterThan(game.updated.getTime())
      })
      it('sets deck for game participant', async () => {
        const name1 = `setDeck-1-${Date.now()}`
        const name2 = `setDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `setDeck-${Date.now()}`,
          userId: user1.id,
        })
        const game = await addGame({
          opponentNames: [name1],
          creator: user2,
        })
        await expect(
          getGameDeck({
            gameId: game.id,
            userId: user1.id,
          })
        ).resolves.toEqual(null)
        const response = await graphql({
          schema,
          source: `mutation {
            setDeck(
              deck: "${deck.id}"
              game: "${game.id}"
            ) {
              ${getGameDeckFragment()}
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
        expect(response).toEqual({
          data: {
            setDeck: expectizeGameDeck({
              deck: {
                factionKey: deck.faction.key,
                leaderName: deck.leader.name,
                name: deck.name,
                unitNames: deck.units.map((unit) => unit.unit.name),
                user: user1,
              },
              discards: [],
              redraws: [],
            }),
          },
        })
        verifyGameDeckSet((response as any).data.setDeck, deck)

        const updatedGame = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        expect(updatedGame).toEqual(
          expectizeGame({
            creator: user2,
            players: [
              {
                user: user2,
              },
              {
                user: user1,
              },
            ],
          })
        )
        expect(updatedGame.updated.getTime()).toBeGreaterThan(game.updated.getTime())
      })
      it('does not set order if all decks set but only creator scoiatael', async () => {
        const name1 = `setDeck-1-${Date.now()}`
        const name2 = `setDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const deck1 = await addDeck({
          faction: FactionKey.ScoiaTael,
          name: `setDeck-1-${Date.now()}`,
          userId: user1.id,
        })
        const deck2 = await addDeck({
          faction: FactionKey.NorthernRealms,
          name: `setDeck-2-${Date.now()}`,
          userId: user2.id,
        })
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        await expect(
          getGameDeck({
            gameId: game.id,
            userId: user1.id,
          })
        ).resolves.toEqual(null)
        await expect(
          getGameDeck({
            gameId: game.id,
            userId: user2.id,
          })
        ).resolves.toEqual(null)
        const response1 = await graphql({
          schema,
          source: `mutation {
            setDeck(
              deck: "${deck1.id}"
              game: "${game.id}"
            ) {
              ${getGameDeckFragment()}
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
        expect(response1).toEqual({
          data: {
            setDeck: expectizeGameDeck({
              deck: {
                factionKey: deck1.faction.key,
                leaderName: deck1.leader.name,
                name: deck1.name,
                unitNames: deck1.units.map((unit) => unit.unit.name),
                user: user1,
              },
              discards: [],
              redraws: [],
            }),
          },
        })
        verifyGameDeckSet((response1 as any).data.setDeck, deck1)

        const updatedGame1 = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        expect(updatedGame1).toEqual(
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
          })
        )
        expect(updatedGame1.updated.getTime()).toBeGreaterThan(game.updated.getTime())

        const response2 = await graphql({
          schema,
          source: `mutation {
            setDeck(
              deck: "${deck2.id}"
              game: "${game.id}"
            ) {
              ${getGameDeckFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user2.id,
              },
            },
          },
        })
        expect(response2).toEqual({
          data: {
            setDeck: expectizeGameDeck({
              deck: {
                factionKey: deck2.faction.key,
                leaderName: deck2.leader.name,
                name: deck2.name,
                unitNames: deck2.units.map((unit) => unit.unit.name),
                user: user2,
              },
              discards: [],
              redraws: [],
            }),
          },
        })
        verifyGameDeckSet((response2 as any).data.setDeck, deck2)

        const updatedGame2 = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        const gamePlayer1 = expectizeGamePlayer({
          gameDeck: response1.data?.setDeck as GameDeck,
          user: user1,
        })
        const gamePlayer2 = expectizeGamePlayer({
          gameDeck: response2.data?.setDeck as GameDeck,
          user: user2,
        })
        expect(updatedGame2).toEqual(
          expectizeGame({
            creator: user1,
            players: [gamePlayer1, gamePlayer2],
            status: GameStatus.Ordering,
          })
        )
        expect(updatedGame2.updated.getTime()).toBeGreaterThan(updatedGame1.updated.getTime())
      })
      it('does not set order if all decks set but only opponent scoiatael', async () => {
        const name1 = `setDeck-1-${Date.now()}`
        const name2 = `setDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const deck1 = await addDeck({
          faction: FactionKey.NorthernRealms,
          name: `setDeck-1-${Date.now()}`,
          userId: user1.id,
        })
        const deck2 = await addDeck({
          faction: FactionKey.ScoiaTael,
          name: `setDeck-2-${Date.now()}`,
          userId: user2.id,
        })
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        await expect(
          getGameDeck({
            gameId: game.id,
            userId: user1.id,
          })
        ).resolves.toEqual(null)
        await expect(
          getGameDeck({
            gameId: game.id,
            userId: user2.id,
          })
        ).resolves.toEqual(null)
        const response1 = await graphql({
          schema,
          source: `mutation {
            setDeck(
              deck: "${deck1.id}"
              game: "${game.id}"
            ) {
              ${getGameDeckFragment()}
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
        expect(response1).toEqual({
          data: {
            setDeck: expectizeGameDeck({
              deck: {
                factionKey: deck1.faction.key,
                leaderName: deck1.leader.name,
                name: deck1.name,
                unitNames: deck1.units.map((unit) => unit.unit.name),
                user: user1,
              },
              discards: [],
              redraws: [],
            }),
          },
        })
        verifyGameDeckSet((response1 as any).data.setDeck, deck1)

        const updatedGame1 = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        expect(updatedGame1).toEqual(
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
          })
        )
        expect(updatedGame1.updated.getTime()).toBeGreaterThan(game.updated.getTime())

        const response2 = await graphql({
          schema,
          source: `mutation {
            setDeck(
              deck: "${deck2.id}"
              game: "${game.id}"
            ) {
              ${getGameDeckFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user2.id,
              },
            },
          },
        })
        expect(response2).toEqual({
          data: {
            setDeck: expectizeGameDeck({
              deck: {
                factionKey: deck2.faction.key,
                leaderName: deck2.leader.name,
                name: deck2.name,
                unitNames: deck2.units.map((unit) => unit.unit.name),
                user: user2,
              },
              discards: [],
              redraws: [],
            }),
          },
        })
        verifyGameDeckSet((response2 as any).data.setDeck, deck2)

        const updatedGame2 = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        const gamePlayer1 = expectizeGamePlayer({
          gameDeck: response1.data?.setDeck as GameDeck,
          user: user1,
        })
        const gamePlayer2 = expectizeGamePlayer({
          gameDeck: response2.data?.setDeck as GameDeck,
          user: user2,
        })
        expect(updatedGame2).toEqual(
          expectizeGame({
            creator: user1,
            players: [gamePlayer1, gamePlayer2],
            status: GameStatus.Ordering,
          })
        )
        expect(updatedGame2.updated.getTime()).toBeGreaterThan(updatedGame1.updated.getTime())
      })
      it('sets order if all players decks set and no scoiatael', async () => {
        const name1 = `setDeck-1-${Date.now()}`
        const name2 = `setDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const deck1 = await addDeck({
          faction: FactionKey.Monsters,
          name: `setDeck-1-${Date.now()}`,
          userId: user1.id,
        })
        const deck2 = await addDeck({
          faction: FactionKey.NorthernRealms,
          name: `setDeck-2-${Date.now()}`,
          userId: user2.id,
        })
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        await expect(
          getGameDeck({
            gameId: game.id,
            userId: user1.id,
          })
        ).resolves.toEqual(null)
        await expect(
          getGameDeck({
            gameId: game.id,
            userId: user2.id,
          })
        ).resolves.toEqual(null)
        const response1 = await graphql({
          schema,
          source: `mutation {
            setDeck(
              deck: "${deck1.id}"
              game: "${game.id}"
            ) {
              ${getGameDeckFragment()}
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
        expect(response1).toEqual({
          data: {
            setDeck: expectizeGameDeck({
              deck: {
                factionKey: deck1.faction.key,
                leaderName: deck1.leader.name,
                name: deck1.name,
                unitNames: deck1.units.map((unit) => unit.unit.name),
                user: user1,
              },
              discards: [],
              redraws: [],
            }),
          },
        })
        verifyGameDeckSet((response1 as any).data.setDeck, deck1)

        const updatedGame1 = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        expect(updatedGame1).toEqual(
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
          })
        )
        expect(updatedGame1.updated.getTime()).toBeGreaterThan(game.updated.getTime())

        const response2 = await graphql({
          schema,
          source: `mutation {
            setDeck(
              deck: "${deck2.id}"
              game: "${game.id}"
            ) {
              ${getGameDeckFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user2.id,
              },
            },
          },
        })
        expect(response2).toEqual({
          data: {
            setDeck: expectizeGameDeck({
              deck: {
                factionKey: deck2.faction.key,
                leaderName: deck2.leader.name,
                name: deck2.name,
                unitNames: deck2.units.map((unit) => unit.unit.name),
                user: user2,
              },
              discards: [],
              redraws: [],
            }),
          },
        })
        verifyGameDeckSet((response2 as any).data.setDeck, deck2)

        const updatedGame2 = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        const gamePlayer1 = expectizeGamePlayer({
          gameDeck: response1.data?.setDeck as GameDeck,
          user: user1,
          order: updatedGame2.turn?.user.id === user1.id ? 0 : 1,
        })
        const gamePlayer2 = expectizeGamePlayer({
          gameDeck: response2.data?.setDeck as GameDeck,
          user: user2,
          order: updatedGame2.turn?.user.id === user2.id ? 0 : 1,
        })
        expect(updatedGame2).toEqual(
          expectizeGame({
            creator: user1,
            players: [gamePlayer1, gamePlayer2],
            status: GameStatus.Redrawing,
            turn: updatedGame2.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
          })
        )
        expect(updatedGame2.updated.getTime()).toBeGreaterThan(updatedGame1.updated.getTime())
      })
      it('sets order if all players decks set and all scoiatael', async () => {
        const name1 = `setDeck-1-${Date.now()}`
        const name2 = `setDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const deck1 = await addDeck({
          faction: FactionKey.ScoiaTael,
          name: `setDeck-1-${Date.now()}`,
          userId: user1.id,
        })
        const deck2 = await addDeck({
          faction: FactionKey.ScoiaTael,
          name: `setDeck-2-${Date.now()}`,
          userId: user2.id,
        })
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        await expect(
          getGameDeck({
            gameId: game.id,
            userId: user1.id,
          })
        ).resolves.toEqual(null)
        await expect(
          getGameDeck({
            gameId: game.id,
            userId: user2.id,
          })
        ).resolves.toEqual(null)
        const response1 = await graphql({
          schema,
          source: `mutation {
            setDeck(
              deck: "${deck1.id}"
              game: "${game.id}"
            ) {
              ${getGameDeckFragment()}
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
        expect(response1).toEqual({
          data: {
            setDeck: expectizeGameDeck({
              deck: {
                factionKey: deck1.faction.key,
                leaderName: deck1.leader.name,
                name: deck1.name,
                unitNames: deck1.units.map((unit) => unit.unit.name),
                user: user1,
              },
              discards: [],
              redraws: [],
            }),
          },
        })
        verifyGameDeckSet((response1 as any).data.setDeck, deck1)

        const updatedGame1 = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        expect(updatedGame1).toEqual(
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
          })
        )
        expect(updatedGame1.updated.getTime()).toBeGreaterThan(game.updated.getTime())

        const response2 = await graphql({
          schema,
          source: `mutation {
            setDeck(
              deck: "${deck2.id}"
              game: "${game.id}"
            ) {
              ${getGameDeckFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user2.id,
              },
            },
          },
        })
        expect(response2).toEqual({
          data: {
            setDeck: expectizeGameDeck({
              deck: {
                factionKey: deck2.faction.key,
                leaderName: deck2.leader.name,
                name: deck2.name,
                unitNames: deck2.units.map((unit) => unit.unit.name),
                user: user2,
              },
              discards: [],
              redraws: [],
            }),
          },
        })
        verifyGameDeckSet((response2 as any).data.setDeck, deck2)

        const updatedGame2 = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        const gamePlayer1 = expectizeGamePlayer({
          gameDeck: response1.data?.setDeck as GameDeck,
          user: user1,
          order: updatedGame2.turn?.user.id === user1.id ? 0 : 1,
        })
        const gamePlayer2 = expectizeGamePlayer({
          gameDeck: response2.data?.setDeck as GameDeck,
          user: user2,
          order: updatedGame2.turn?.user.id === user2.id ? 0 : 1,
        })
        expect(updatedGame2).toEqual(
          expectizeGame({
            creator: user1,
            players: [gamePlayer1, gamePlayer2],
            status: GameStatus.Redrawing,
            turn: updatedGame2.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
          })
        )
        expect(updatedGame2.updated.getTime()).toBeGreaterThan(updatedGame1.updated.getTime())
      })
    })
  })
})
