import { GraphQLError, graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { addDeck, addGame, addUser, getGame, getGameDeck, ready, redraw, setDeck } from './util/graphql-util'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { Deck, DeckUnit, FactionKey, GameDeck, GameStatus } from '@gwent/graphql-schema/resolver-typings'
import { expectizeGame, expectizeGameDeck, expectizeGamePlayer } from './util/expect-util'
import { getDeckUnitFragment, getGameDeckFragment, getGameFragment } from './util/fragment-util'
import { MAX_REDRAWS, NOT_AUTHORIZED_MESSAGE, STARTING_HAND_SIZE } from '@gwent/constants'
import schema from '../../src/graphql/executable-schema'

describe('game', () => {
  beforeAll(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('game', () => {
    describe('invalid', () => {
      it('throws error if invalid ObjectId', async () => {
        const name = `game-${Date.now()}`
        const user = await addUser(name)
        await expect(
          graphql({
            schema,
            source: `{
              game(id: "invalid") {
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
      it('throws error if game does not exist', async () => {
        const name = `game-${Date.now()}`
        const user = await addUser(name)
        await expect(
          graphql({
            schema,
            source: `{
              game(id: "${new ObjectId()}") {
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
      it('throws error if user is not participant of game', async () => {
        const name1 = `game-1-${Date.now()}`
        const name2 = `game-2-${Date.now()}`
        const name3 = `game-3-${Date.now()}`
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
            source: `{
              game(id: "${game.id}") {
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
    })
    describe('valid', () => {
      it('returns game if user is creator', async () => {
        const name1 = `game-1-${Date.now()}`
        const name2 = `game-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        await expect(
          graphql({
            schema,
            source: `{
              game(id: "${game.id}") {
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
          data: {
            game: expectizeGame({
              creator: user1,
              players: [
                {
                  user: user1,
                },
                {
                  user: user2,
                },
              ],
              status: GameStatus.Decking,
            }),
          },
        })
      })
      it('returns game if user is a participant but not owner', async () => {
        const name1 = `game-1-${Date.now()}`
        const name2 = `game-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name1],
          userId: user2.id,
        })
        await expect(
          graphql({
            schema,
            source: `{
              game(id: "${game.id}") {
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
          data: {
            game: expectizeGame({
              creator: user2,
              players: [
                {
                  user: user2,
                },
                {
                  user: user1,
                },
              ],
              status: GameStatus.Decking,
            }),
          },
        })
      })
      it('does not return faction leader and count deatils if only creator ready', async () => {
        const name1 = `game-1-${Date.now()}`
        const name2 = `game-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `game-1-deck-${Date.now()}`,
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
              game(id: "${game.id}") {
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
          data: {
            game: expectizeGame({
              creator: user1,
              players: [
                {
                  user: user1,
                },
                {
                  user: user2,
                },
              ],
              status: GameStatus.Decking,
            }),
          },
        })
      })
      it('does not return faction leader and count deatils if only opponent ready', async () => {
        const name1 = `game-1-${Date.now()}`
        const name2 = `game-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name1],
          userId: user2.id,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `game-1-deck-${Date.now()}`,
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
              game(id: "${game.id}") {
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
          data: {
            game: expectizeGame({
              creator: user2,
              players: [
                {
                  user: user2,
                },
                {
                  user: user1,
                },
              ],
              status: GameStatus.Decking,
            }),
          },
        })
      })
      it('returns faction leader and count details after all players ready', async () => {
        const name1 = `game-1-${Date.now()}`
        const name2 = `game-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        const deck1 = await addDeck({
          faction: FactionKey.NorthernRealms,
          name: `game-1-deck-${Date.now()}`,
          userId: user1.id,
        })
        const deck2 = await addDeck({
          faction: FactionKey.Monsters,
          name: `game-2-deck-${Date.now()}`,
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
        })
        const gamePlayer2 = expectizeGamePlayer({
          gameDeck: gameDeck2,
          user: user2,
          order: updatedGame.turn?.user.id === user2.id ? 0 : 1,
          ready: true,
        })
        await expect(
          graphql({
            schema,
            source: `{
              game(id: "${game.id}") {
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
          data: {
            game: expectizeGame({
              creator: user1,
              players: [gamePlayer1, gamePlayer2],
              status: GameStatus.Playing,
              turn: updatedGame.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
            }),
          },
        })
      })
    })
  })
  describe('setDeck', () => {
    describe('invalid', () => {
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
                ${getGameDeckFragment({})}
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
                ${getGameDeckFragment({})}
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
          userId: user3.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              setDeck(
                deck: "${deck.id}"
                game: "${game.id}"
              ) {
                ${getGameDeckFragment({})}
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
          userId: user1.id,
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
                ${getGameDeckFragment({})}
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
          userId: user1.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              setDeck(
                deck: "invalid"
                game: "${game.id}"
              ) {
                ${getGameDeckFragment({})}
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
          userId: user1.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              setDeck(
                deck: "${deck.id}"
                game: "${game.id}"
              ) {
                ${getGameDeckFragment({})}
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
          userId: user1.id,
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
              ${getGameDeckFragment({})}
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
          userId: user2.id,
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
              ${getGameDeckFragment({})}
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
      it('returns stats without neutrals if neutrals is false', async () => {
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
          userId: user1.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
            setDeck(
              deck: "${deck.id}"
              game: "${game.id}"
            ) {
              ${getGameDeckFragment({
                statsModifier: '(neutrals: false)',
              })}
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
      })
      it('returns stats with neutrals if neutrals is true', async () => {
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
          userId: user1.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
            setDeck(
              deck: "${deck.id}"
              game: "${game.id}"
            ) {
              ${getGameDeckFragment({
                statsModifier: '(neutrals: true)',
              })}
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
            setDeck: expectizeGameDeck({
              deck: {
                factionKey: deck.faction.key,
                leaderName: deck.leader.name,
                name: deck.name,
                unitNames: deck.units.map((unit) => unit.unit.name),
                user: user1,
                neutrals: true,
              },
              discards: [],
              redraws: [],
            }),
          },
        })
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
          userId: user1.id,
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
              ${getGameDeckFragment({})}
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
              ${getGameDeckFragment({})}
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
          userId: user1.id,
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
              ${getGameDeckFragment({})}
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
              ${getGameDeckFragment({})}
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
          userId: user1.id,
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
              ${getGameDeckFragment({})}
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
              ${getGameDeckFragment({})}
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
          userId: user1.id,
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
              ${getGameDeckFragment({})}
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
              ${getGameDeckFragment({})}
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
  describe('gameDeck', () => {
    describe('invalid', () => {
      it('throws error if game does not exist', async () => {
        const name = `gameDeck-${Date.now()}`
        const user = await addUser(name)
        const id = new ObjectId()
        await expect(
          graphql({
            schema,
            source: `{
              gameDeck(game: "${id.toString()}") {
                ${getGameDeckFragment({})}
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
            gameDeck: null,
          },
          errors: [new GraphQLError(NOT_AUTHORIZED_MESSAGE)],
        })
      })
      it('throws error if user not a player on game', async () => {
        const name1 = `gameDeck-1-${Date.now()}`
        const name2 = `gameDeck-2-${Date.now()}`
        const name3 = `gameDeck-3-${Date.now()}`
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
            source: `{
              gameDeck(game: "${game.id}") {
                ${getGameDeckFragment({})}
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
            gameDeck: null,
          },
          errors: [new GraphQLError(NOT_AUTHORIZED_MESSAGE)],
        })
      })
    })
    describe('valid', () => {
      it('returns null if no deck set for game', async () => {
        const name1 = `gameDeck-1-${Date.now()}`
        const name2 = `gameDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        await expect(
          graphql({
            schema,
            source: `{
              gameDeck(game: "${game.id}") {
                ${getGameDeckFragment({})}
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
            gameDeck: null,
          },
        })
      })
      it('returns null if deck set for opponent', async () => {
        const name1 = `gameDeck-1-${Date.now()}`
        const name2 = `gameDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `gameDeck-${Date.now()}`,
          userId: user2.id,
        })
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
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
              gameDeck(game: "${game.id}") {
                ${getGameDeckFragment({})}
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
            gameDeck: null,
          },
        })
      })
      it('returns game deck if set for creator', async () => {
        const name1 = `gameDeck-1-${Date.now()}`
        const name2 = `gameDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `gameDeck-${Date.now()}`,
          userId: user1.id,
        })
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        const gameDeck = await graphql({
          schema,
          source: `{
            gameDeck(game: "${game.id}") {
              ${getGameDeckFragment({})}
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
        expect(gameDeck).toEqual({
          data: {
            gameDeck: expectizeGameDeck({
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
        verifyGameDeckSet((gameDeck.data as any).gameDeck as GameDeck, deck)
      })
      it('returns game deck if set for participant', async () => {
        const name1 = `gameDeck-1-${Date.now()}`
        const name2 = `gameDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `gameDeck-${Date.now()}`,
          userId: user1.id,
        })
        const game = await addGame({
          opponentNames: [name1],
          userId: user2.id,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        const gameDeck = await graphql({
          schema,
          source: `{
            gameDeck(game: "${game.id}") {
              ${getGameDeckFragment({})}
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
        expect(gameDeck).toEqual({
          data: {
            gameDeck: expectizeGameDeck({
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
        verifyGameDeckSet((gameDeck.data as any).gameDeck as GameDeck, deck)
      })
      it('returns without neutrals if neutrals is false', async () => {
        const statsModifier = '(neutrals: false)'
        const name1 = `gameDeck-1-${Date.now()}`
        const name2 = `gameDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `gameDeck-${Date.now()}`,
          userId: user1.id,
          statsModifier,
        })
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        const gameDeck = await graphql({
          schema,
          source: `{
            gameDeck(game: "${game.id}") {
              ${getGameDeckFragment({
                statsModifier,
              })}
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
        expect(gameDeck).toEqual({
          data: {
            gameDeck: expectizeGameDeck({
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
        verifyGameDeckSet((gameDeck.data as any).gameDeck as GameDeck, deck)
      })
      it('returns with neutrals if neutrals is true', async () => {
        const statsModifier = '(neutrals: true)'
        const name1 = `gameDeck-1-${Date.now()}`
        const name2 = `gameDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `gameDeck-${Date.now()}`,
          userId: user1.id,
          statsModifier,
        })
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        const gameDeck = await graphql({
          schema,
          source: `{
            gameDeck(game: "${game.id}") {
              ${getGameDeckFragment({
                statsModifier,
              })}
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
        expect(gameDeck).toEqual({
          data: {
            gameDeck: expectizeGameDeck({
              deck: {
                factionKey: deck.faction.key,
                leaderName: deck.leader.name,
                name: deck.name,
                unitNames: deck.units.map((unit) => unit.unit.name),
                user: user1,
                neutrals: true,
              },
              discards: [],
              redraws: [],
            }),
          },
        })
        verifyGameDeckSet((gameDeck.data as any).gameDeck as GameDeck, deck)
      })
    })
  })
  describe('redraw', () => {
    describe('invalid', () => {
      it('throws error if game does not exist', async () => {
        const name = `redraw-${Date.now()}`
        const user = await addUser(name)
        const id = new ObjectId()
        await expect(
          graphql({
            schema,
            source: `mutation {
              redraw(
                game: "${id.toString()}"
                unit: "${new ObjectId()}"
              ) {
                ${getDeckUnitFragment({})}
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
        const name1 = `redraw-1-${Date.now()}`
        const name2 = `redraw-2-${Date.now()}`
        const name3 = `redraw-3-${Date.now()}`
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
              redraw(
                game: "${game.id}"
                unit: "${new ObjectId()}"
              ) {
                ${getDeckUnitFragment({})}
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
      it('throws error if deck not set', async () => {
        const name1 = `redraw-1-${Date.now()}`
        const name2 = `redraw-2-${Date.now()}`
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
              redraw(
                game: "${game.id}"
                unit: "${new ObjectId()}"
              ) {
                ${getDeckUnitFragment({})}
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
          errors: [new GraphQLError(`Cannot redraw before deck is set for game "${game.id}".`)],
        })
      })
      it('throws error if ready', async () => {
        const name1 = `redraw-1-${Date.now()}`
        const name2 = `redraw-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-${Date.now()}`,
          userId: user1.id,
        })
        const gameDeck = await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        await ready({
          gameId: game.id,
          userId: user1.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              redraw(
                game: "${game.id}"
                unit: "${gameDeck.hand[3].unit.id}"
              ) {
                ${getDeckUnitFragment({})}
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
          errors: [new GraphQLError(`Cannot redraw after game "${game.id}" is marked as ready.`)],
        })
      })
      it('throws error if maximum redraws exceeded', async () => {
        const name1 = `redraw-1-${Date.now()}`
        const name2 = `redraw-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-${Date.now()}`,
          userId: user1.id,
        })
        const gameDeck = await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        await redraw({
          gameId: game.id,
          unitId: gameDeck.hand[0].unit.id,
          userId: user1.id,
        })
        await redraw({
          gameId: game.id,
          unitId: gameDeck.hand[1].unit.id,
          userId: user1.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              redraw(
                game: "${game.id}"
                unit: "${gameDeck.hand[3].unit.id}"
              ) {
                ${getDeckUnitFragment({})}
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
          errors: [new GraphQLError(`Cannot exceed maximum redraw limit of "${MAX_REDRAWS}" for game "${game.id}".`)],
        })
      })
      it('throws error if unit does not exist in hand', async () => {
        const name1 = `redraw-1-${Date.now()}`
        const name2 = `redraw-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-${Date.now()}`,
          userId: user1.id,
        })
        const gameDeck = await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        const unitId = gameDeck.undrawn[0].unit.id
        await expect(
          graphql({
            schema,
            source: `mutation {
              redraw(
                game: "${game.id}"
                unit: "${unitId}"
              ) {
                ${getDeckUnitFragment({})}
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
          errors: [new GraphQLError(`Unit with ID "${unitId}" does not exist in hand for game "${game.id}".`)],
        })
      })
      it('throws error if try to redraw same card twice', async () => {
        const name1 = `redraw-1-${Date.now()}`
        const name2 = `redraw-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-${Date.now()}`,
          userId: user1.id,
        })
        const gameDeck = await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        const unitToRedraw = gameDeck.hand[0].unit.id
        await redraw({
          gameId: game.id,
          unitId: unitToRedraw,
          userId: user1.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              redraw(
                game: "${game.id}"
                unit: "${unitToRedraw}"
              ) {
                ${getDeckUnitFragment({})}
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
          errors: [new GraphQLError(`Unit with ID "${unitToRedraw}" does not exist in hand for game "${game.id}".`)],
        })
      })
    })
    describe('valid', () => {
      it('both players redraw cards twice', async () => {
        const name1 = `redraw-1-${Date.now()}`
        const name2 = `redraw-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        const deck1 = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-1-${Date.now()}`,
          userId: user1.id,
        })
        const deck2 = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-2-${Date.now()}`,
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
        const updatedGame = await getGame({
          gameId: game.id,
          userId: user1.id,
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
        expect(updatedGame).toEqual(
          expectizeGame({
            creator: user1,
            players: [gamePlayer1, gamePlayer2],
            status: GameStatus.Redrawing,
            turn: updatedGame.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
          })
        )
        expect(updatedGame.updated.getTime()).toBeGreaterThan(game.updated.getTime())

        const unitToRedraw1 = gameDeck1.hand[0]
        const response1 = await graphql({
          schema,
          source: `mutation {
            redraw(
              game: "${game.id}"
              unit: "${unitToRedraw1.unit.id}"
            ) {
              ${getDeckUnitFragment({})}
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
            redraw: expect.any(Object),
          },
        })
        const redrawn1 = (response1 as any).data.redraw as DeckUnit
        const undrawnMatch1 = gameDeck1.undrawn.find((deckUnit) => deckUnit.unit.id === redrawn1.unit.id)
        expect(undrawnMatch1).not.toEqual(undefined)
        expect(redrawn1).toEqual(undrawnMatch1)
        const updatedGameDeck1 = await getGameDeck({
          gameId: game.id,
          userId: user1.id,
        })
        expect(updatedGameDeck1.discard).toEqual([])
        expect(updatedGameDeck1.from).toEqual(deck1)
        expect(updatedGameDeck1.hand).toEqual([
          ...gameDeck1.hand.filter((deckUnit) => deckUnit.unit.id !== unitToRedraw1.unit.id),
          redrawn1,
        ])
        expect(updatedGameDeck1.redraws).toEqual([
          {
            from: unitToRedraw1,
            to: updatedGameDeck1.redraws[0].to,
          },
        ])
        expect(updatedGameDeck1.undrawn).toEqual([
          ...gameDeck1.undrawn.filter((deckUnit) => deckUnit.unit.id !== redrawn1.unit.id),
          unitToRedraw1,
        ])
        const updatedGame2 = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        expect(updatedGame2).toEqual(
          expectizeGame({
            creator: user1,
            players: [gamePlayer1, gamePlayer2],
            status: GameStatus.Redrawing,
            turn: updatedGame.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
          })
        )
        expect(updatedGame2.updated.getTime()).toBeGreaterThan(updatedGame.updated.getTime())

        const unitToRedraw2 = updatedGameDeck1.hand[updatedGameDeck1.hand.length - 1]
        const response2 = await graphql({
          schema,
          source: `mutation {
            redraw(
              game: "${game.id}"
              unit: "${unitToRedraw2.unit.id}"
            ) {
              ${getDeckUnitFragment({})}
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
        expect(response2).toEqual({
          data: {
            redraw: expect.any(Object),
          },
        })
        const redrawn2 = (response2 as any).data.redraw as DeckUnit
        const undrawnMatch2 = updatedGameDeck1.undrawn.find((deckUnit) => deckUnit.unit.id === redrawn2.unit.id)
        expect(undrawnMatch2).not.toEqual(undefined)
        expect(redrawn2).toEqual(undrawnMatch2)
        const updatedGameDeck2 = await getGameDeck({
          gameId: game.id,
          userId: user1.id,
        })
        expect(updatedGameDeck2.discard).toEqual([])
        expect(updatedGameDeck2.from).toEqual(deck1)
        expect(updatedGameDeck2.hand).toEqual([
          ...updatedGameDeck1.hand.filter((deckUnit) => deckUnit.unit.id !== unitToRedraw2.unit.id),
          redrawn2,
        ])
        expect(updatedGameDeck2.redraws).toEqual([
          {
            from: unitToRedraw1,
            to: updatedGameDeck1.redraws[0].to,
          },
          {
            from: unitToRedraw2,
            to: updatedGameDeck2.redraws[1].to,
          },
        ])
        expect(updatedGameDeck2.undrawn).toEqual([
          ...updatedGameDeck1.undrawn.filter((deckUnit) => deckUnit.unit.id !== redrawn2.unit.id),
          unitToRedraw2,
        ])
        const updatedGame3 = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        expect(updatedGame3).toEqual(
          expectizeGame({
            creator: user1,
            players: [gamePlayer1, gamePlayer2],
            status: GameStatus.Redrawing,
            turn: updatedGame.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
          })
        )
        expect(updatedGame3.updated.getTime()).toBeGreaterThan(updatedGame2.updated.getTime())

        const unitToRedraw3 = gameDeck2.hand[0]
        const response3 = await graphql({
          schema,
          source: `mutation {
            redraw(
              game: "${game.id}"
              unit: "${unitToRedraw3.unit.id}"
            ) {
              ${getDeckUnitFragment({})}
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
        expect(response3).toEqual({
          data: {
            redraw: expect.any(Object),
          },
        })
        const redrawn3 = (response3 as any).data.redraw as DeckUnit
        const undrawnMatch3 = gameDeck2.undrawn.find((deckUnit) => deckUnit.unit.id === redrawn3.unit.id)
        expect(undrawnMatch3).not.toEqual(undefined)
        expect(redrawn3).toEqual(undrawnMatch3)
        const updatedGameDeck3 = await getGameDeck({
          gameId: game.id,
          userId: user2.id,
        })
        expect(updatedGameDeck3.discard).toEqual([])
        expect(updatedGameDeck3.from).toEqual(deck2)
        expect(updatedGameDeck3.hand).toEqual([
          ...gameDeck2.hand.filter((deckUnit) => deckUnit.unit.id !== unitToRedraw3.unit.id),
          redrawn3,
        ])
        expect(updatedGameDeck3.redraws).toEqual([
          {
            from: unitToRedraw3,
            to: updatedGameDeck3.redraws[0].to,
          },
        ])
        expect(updatedGameDeck3.undrawn).toEqual([
          ...gameDeck2.undrawn.filter((deckUnit) => deckUnit.unit.id !== redrawn3.unit.id),
          unitToRedraw3,
        ])
        const updatedGame4 = await getGame({
          gameId: game.id,
          userId: user2.id,
        })
        expect(updatedGame4).toEqual(
          expectizeGame({
            creator: user1,
            players: [gamePlayer1, gamePlayer2],
            status: GameStatus.Redrawing,
            turn: updatedGame.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
          })
        )
        expect(updatedGame4.updated.getTime()).toBeGreaterThan(updatedGame3.updated.getTime())

        const unitToRedraw4 = gameDeck2.hand[gameDeck2.hand.length - 1]
        const response4 = await graphql({
          schema,
          source: `mutation {
            redraw(
              game: "${game.id}"
              unit: "${unitToRedraw4.unit.id}"
            ) {
              ${getDeckUnitFragment({})}
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
        expect(response4).toEqual({
          data: {
            redraw: expect.any(Object),
          },
        })
        const redrawn4 = (response4 as any).data.redraw as DeckUnit
        const undrawnMatch4 = gameDeck2.undrawn.find((deckUnit) => deckUnit.unit.id === redrawn4.unit.id)
        expect(undrawnMatch4).not.toEqual(undefined)
        expect(redrawn4).toEqual(undrawnMatch4)
        const updatedGameDeck4 = await getGameDeck({
          gameId: game.id,
          userId: user2.id,
        })
        expect(updatedGameDeck4.discard).toEqual([])
        expect(updatedGameDeck4.from).toEqual(deck2)
        expect(updatedGameDeck4.hand).toEqual([
          ...updatedGameDeck3.hand.filter((deckUnit) => deckUnit.unit.id !== unitToRedraw4.unit.id),
          redrawn4,
        ])
        expect(updatedGameDeck4.redraws).toEqual([
          {
            from: unitToRedraw3,
            to: updatedGameDeck3.redraws[0].to,
          },
          {
            from: unitToRedraw4,
            to: updatedGameDeck4.redraws[1].to,
          },
        ])
        expect(updatedGameDeck4.undrawn).toEqual([
          ...updatedGameDeck3.undrawn.filter((deckUnit) => deckUnit.unit.id !== redrawn4.unit.id),
          unitToRedraw4,
        ])
        const updatedGame5 = await getGame({
          gameId: game.id,
          userId: user2.id,
        })
        expect(updatedGame5).toEqual(
          expectizeGame({
            creator: user1,
            players: [gamePlayer1, gamePlayer2],
            status: GameStatus.Redrawing,
            turn: updatedGame.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
          })
        )
        expect(updatedGame5.updated.getTime()).toBeGreaterThan(updatedGame4.updated.getTime())
      })
      it('returns stats without neutrals if neutrals is false', async () => {
        const statsModifier = '(neutrals: false)'
        const name1 = `redraw-1-${Date.now()}`
        const name2 = `redraw-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-1-${Date.now()}`,
          userId: user1.id,
          statsModifier,
        })
        const gameDeck = await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
          statsModifier,
        })
        const unitToRedraw = gameDeck.hand[0]
        const response = await graphql({
          schema,
          source: `mutation {
            redraw(
              game: "${game.id}"
              unit: "${unitToRedraw.unit.id}"
            ) {
              ${getDeckUnitFragment({
                statsModifier,
              })}
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
            redraw: expect.any(Object),
          },
        })
        const redrawn = (response as any).data.redraw as DeckUnit
        const undrawnMatch = gameDeck.undrawn.find((deckUnit) => deckUnit.unit.id === redrawn.unit.id)
        expect(undrawnMatch).not.toEqual(undefined)
        expect(redrawn).toEqual(undrawnMatch)
        const updatedGameDeck1 = await getGameDeck({
          gameId: game.id,
          userId: user1.id,
          statsModifier,
        })
        expect(updatedGameDeck1.discard).toEqual([])
        expect(updatedGameDeck1.from).toEqual(deck)
        expect(updatedGameDeck1.hand).toEqual([
          ...gameDeck.hand.filter((deckUnit) => deckUnit.unit.id !== unitToRedraw.unit.id),
          redrawn,
        ])
        expect(updatedGameDeck1.redraws).toEqual([
          {
            from: unitToRedraw,
            to: updatedGameDeck1.redraws[0].to,
          },
        ])
        expect(updatedGameDeck1.undrawn).toEqual([
          ...gameDeck.undrawn.filter((deckUnit) => deckUnit.unit.id !== redrawn.unit.id),
          unitToRedraw,
        ])
      })
      it('returns stats with neutrals if neutrals is true', async () => {
        const statsModifier = '(neutrals: true)'
        const name1 = `redraw-1-${Date.now()}`
        const name2 = `redraw-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-1-${Date.now()}`,
          userId: user1.id,
          statsModifier,
        })
        const gameDeck = await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
          statsModifier,
        })
        const unitToRedraw = gameDeck.hand[0]
        const response = await graphql({
          schema,
          source: `mutation {
            redraw(
              game: "${game.id}"
              unit: "${unitToRedraw.unit.id}"
            ) {
              ${getDeckUnitFragment({
                statsModifier,
              })}
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
            redraw: expect.any(Object),
          },
        })
        const redrawn = (response as any).data.redraw as DeckUnit
        const undrawnMatch = gameDeck.undrawn.find((deckUnit) => deckUnit.unit.id === redrawn.unit.id)
        expect(undrawnMatch).not.toEqual(undefined)
        expect(redrawn).toEqual(undrawnMatch)
        const updatedGameDeck1 = await getGameDeck({
          gameId: game.id,
          userId: user1.id,
          statsModifier,
        })
        expect(updatedGameDeck1.discard).toEqual([])
        expect(updatedGameDeck1.from).toEqual(deck)
        expect(updatedGameDeck1.hand).toEqual([
          ...gameDeck.hand.filter((deckUnit) => deckUnit.unit.id !== unitToRedraw.unit.id),
          redrawn,
        ])
        expect(updatedGameDeck1.redraws).toEqual([
          {
            from: unitToRedraw,
            to: updatedGameDeck1.redraws[0].to,
          },
        ])
        expect(updatedGameDeck1.undrawn).toEqual([
          ...gameDeck.undrawn.filter((deckUnit) => deckUnit.unit.id !== redrawn.unit.id),
          unitToRedraw,
        ])
      })
    })
  })
  describe('ready', () => {
    describe('invalid', () => {
      it('returns error if game does not exist', async () => {
        const name = `ready-${Date.now()}`
        const user = await addUser(name)
        await expect(
          graphql({
            schema,
            source: `mutation {
              ready(game: "${new ObjectId()}") {
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
      it('returns error if not a player on game', async () => {
        const name1 = `ready-1-${Date.now()}`
        const name2 = `ready-2-${Date.now()}`
        const name3 = `ready-3-${Date.now()}`
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
              ready(game: "${game.id}") {
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
      it('returns error if deck not set', async () => {
        const name1 = `ready-1-${Date.now()}`
        const name2 = `ready-2-${Date.now()}`
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
              ready(game: "${game.id}") {
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
          errors: [new GraphQLError(`Must set deck on game "${game.id}" first.`)],
        })
      })
      it('returns error if already marked as ready', async () => {
        const name1 = `ready-1-${Date.now()}`
        const name2 = `ready-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-${Date.now()}`,
          userId: user1.id,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        await ready({
          gameId: game.id,
          userId: user1.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              ready(game: "${game.id}") {
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
          errors: [new GraphQLError(`Game "${game.id}" already marked as ready.`)],
        })
      })
    })
    describe('valid', () => {
      it('marks game as ready if creator', async () => {
        const name1 = `ready-1-${Date.now()}`
        const name2 = `ready-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-${Date.now()}`,
          userId: user1.id,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        const updatedGame = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        const response = await graphql({
          schema,
          source: `mutation {
            ready(game: "${game.id}") {
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
        expect(response).toEqual({
          data: {
            ready: expectizeGame({
              creator: user1,
              players: [
                {
                  user: user1,
                  ready: true,
                },
                {
                  user: user2,
                },
              ],
            }),
          },
        })
        if (response.data?.ready) {
          expect(new Date((response.data.ready as any).updated).getTime()).toBeGreaterThan(
            new Date(updatedGame.updated).getTime()
          )
        }
      })
      it('marks game as ready if opponent', async () => {
        const name1 = `ready-1-${Date.now()}`
        const name2 = `ready-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name1],
          userId: user2.id,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-${Date.now()}`,
          userId: user1.id,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        const updatedGame = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        const response = await graphql({
          schema,
          source: `mutation {
            ready(game: "${game.id}") {
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
        expect(response).toEqual({
          data: {
            ready: expectizeGame({
              creator: user2,
              players: [
                {
                  user: user2,
                },
                {
                  user: user1,
                  ready: true,
                },
              ],
            }),
          },
        })
        if (response.data?.ready) {
          expect(new Date((response.data.ready as any).updated).getTime()).toBeGreaterThan(
            new Date(updatedGame.updated).getTime()
          )
        }
      })
      it('does not add neutrals to stats if neutrals is false', async () => {
        const name1 = `ready-1-${Date.now()}`
        const name2 = `ready-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        const deck1 = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-1-${Date.now()}`,
          userId: user1.id,
        })
        const deck2 = await addDeck({
          faction: FactionKey.NorthernRealms,
          name: `ready-2-${Date.now()}`,
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
        const updatedGame = await ready({
          gameId: game.id,
          userId: user2.id,
        })
        const response = await graphql({
          schema,
          source: `mutation {
            ready(game: "${game.id}") {
              ${getGameFragment({
                statsModifier: '(neutrals: false)',
              })}
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
          order: updatedGame.turn?.user.id === user1.id ? 0 : 1,
          ready: true,
        })
        const gamePlayer2 = expectizeGamePlayer({
          gameDeck: gameDeck2,
          user: user2,
          order: updatedGame.turn?.user.id === user2.id ? 0 : 1,
          ready: true,
        })
        expect(response).toEqual({
          data: {
            ready: expectizeGame({
              creator: user1,
              status: GameStatus.Playing,
              players: [gamePlayer1, gamePlayer2],
              turn: updatedGame.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
            }),
          },
        })
        if (response.data?.ready) {
          expect(new Date((response.data.ready as any).updated).getTime()).toBeGreaterThan(
            new Date(updatedGame.updated).getTime()
          )
        }
      })
      it('adds neutrals to stats if neutrals is true', async () => {
        const name1 = `ready-1-${Date.now()}`
        const name2 = `ready-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          userId: user1.id,
        })
        const deck1 = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-1-${Date.now()}`,
          userId: user1.id,
          statsModifier: '(neutrals: true)',
        })
        const deck2 = await addDeck({
          faction: FactionKey.NorthernRealms,
          name: `ready-2-${Date.now()}`,
          userId: user2.id,
          statsModifier: '(neutrals: true)',
        })
        const gameDeck1 = await setDeck({
          deckId: deck1.id,
          gameId: game.id,
          userId: user1.id,
          statsModifier: '(neutrals: true)',
        })
        const gameDeck2 = await setDeck({
          deckId: deck2.id,
          gameId: game.id,
          userId: user2.id,
          statsModifier: '(neutrals: true)',
        })
        const updatedGame = await ready({
          gameId: game.id,
          userId: user2.id,
        })
        const response = await graphql({
          schema,
          source: `mutation {
            ready(game: "${game.id}") {
              ${getGameFragment({
                statsModifier: '(neutrals: true)',
              })}
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
          order: updatedGame.turn?.user.id === user1.id ? 0 : 1,
          ready: true,
        })
        const gamePlayer2 = expectizeGamePlayer({
          gameDeck: gameDeck2,
          user: user2,
          order: updatedGame.turn?.user.id === user2.id ? 0 : 1,
          ready: true,
        })
        expect(response).toEqual({
          data: {
            ready: expectizeGame({
              creator: user1,
              status: GameStatus.Playing,
              players: [gamePlayer1, gamePlayer2],
              turn: updatedGame.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
            }),
          },
        })
        if (response.data?.ready) {
          expect(new Date((response.data.ready as any).updated).getTime()).toBeGreaterThan(
            new Date(updatedGame.updated).getTime()
          )
        }
      })
    })
  })
})

function verifyGameDeckSet(gameDeck: GameDeck, deck: Deck) {
  expect(gameDeck.hand).toHaveLength(STARTING_HAND_SIZE)
  expect(gameDeck.undrawn).toHaveLength(deck.units.length - STARTING_HAND_SIZE)
  for (const handUnit of gameDeck.hand) {
    expect(gameDeck.undrawn.find((deckUnit) => deckUnit.unit.id === handUnit.unit.id)).toEqual(undefined)
  }
}
