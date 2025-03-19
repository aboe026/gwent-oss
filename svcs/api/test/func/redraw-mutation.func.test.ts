import { GraphQLError, graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { addDeck, addGame, addUser, getGame, getGameDeck, ready, redraw, setDeck } from './util/graphql-util'
import { DeckUnit, FactionKey, GameStatus } from '@gwent/graphql-schema/resolver-typings'
import { expectizeGame, expectizeGamePlayer } from './util/expect-util'
import { getDeckUnitFragment } from './util/fragment-util'
import { MAX_REDRAWS, NOT_AUTHORIZED_MESSAGE } from '@gwent/constants'
import schema from '../../src/graphql/executable-schema'

describe('redraw-mutation', () => {
  describe('redraw', () => {
    describe('invalid', () => {
      it('returns error if invalid game ID', async () => {
        const name1 = `redraw-1-${Date.now()}`
        const name2 = `redraw-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
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
        await setDeck({
          deckId: deck2.id,
          gameId: game.id,
          userId: user2.id,
        })

        const unitToRedraw1 = gameDeck1.hand[0]
        const gameId = 'invalid'
        await expect(
          graphql({
            schema,
            source: `mutation {
            redraw(
              game: "${gameId}"
              unit: "${unitToRedraw1.unit.id}"
            ) {
              ${getDeckUnitFragment()}
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
      it('returns error if invalid unit ID', async () => {
        const name1 = `redraw-1-${Date.now()}`
        const name2 = `redraw-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
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
        const unitId = 'invalid'

        await expect(
          graphql({
            schema,
            source: `mutation {
            redraw(
              game: "${game.id}"
              unit: "${unitId}"
            ) {
              ${getDeckUnitFragment()}
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
          errors: [new GraphQLError(`Unit ID "${unitId}" is not a valid MongoDB ObjectId.`)],
        })
      })
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
                ${getDeckUnitFragment()}
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
          creator: user2,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              redraw(
                game: "${game.id}"
                unit: "${new ObjectId()}"
              ) {
                ${getDeckUnitFragment()}
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
          creator: user1,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              redraw(
                game: "${game.id}"
                unit: "${new ObjectId()}"
              ) {
                ${getDeckUnitFragment()}
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
              `Invalid game status "${GameStatus.Decking}": Can only redraw for game with status "${GameStatus.Redrawing}".`
            ),
          ],
        })
      })
      it('throws error if ready', async () => {
        const name1 = `redraw-1-${Date.now()}`
        const name2 = `redraw-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        const deckSelf = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-self-${Date.now()}`,
          userId: user1.id,
        })
        const deckOpponent = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-opponent-${Date.now()}`,
          userId: user2.id,
        })
        const gameDeckSelf = await setDeck({
          deckId: deckSelf.id,
          gameId: game.id,
          userId: user1.id,
        })
        await setDeck({
          deckId: deckOpponent.id,
          gameId: game.id,
          userId: user2.id,
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
                unit: "${gameDeckSelf.hand[3].unit.id}"
              ) {
                ${getDeckUnitFragment()}
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
          errors: [new GraphQLError(`Redraw not allowed after game marked as ready.`)],
        })
      })
      it('throws error if maximum redraws exceeded', async () => {
        const name1 = `redraw-1-${Date.now()}`
        const name2 = `redraw-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        const deckSelf = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-self-${Date.now()}`,
          userId: user1.id,
        })
        const deckOpponent = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-opponent-${Date.now()}`,
          userId: user2.id,
        })
        const gameDeckSelf = await setDeck({
          deckId: deckSelf.id,
          gameId: game.id,
          userId: user1.id,
        })
        await setDeck({
          deckId: deckOpponent.id,
          gameId: game.id,
          userId: user2.id,
        })
        await redraw({
          gameId: game.id,
          unitId: gameDeckSelf.hand[0].unit.id,
          userId: user1.id,
        })
        await redraw({
          gameId: game.id,
          unitId: gameDeckSelf.hand[1].unit.id,
          userId: user1.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              redraw(
                game: "${game.id}"
                unit: "${gameDeckSelf.hand[2].unit.id}"
              ) {
                ${getDeckUnitFragment()}
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
          errors: [new GraphQLError(`Cannot exceed maximum redraw limit of "${MAX_REDRAWS}".`)],
        })
      })
      it('throws error if unit does not exist in hand', async () => {
        const name1 = `redraw-1-${Date.now()}`
        const name2 = `redraw-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        const deckSelf = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-self-${Date.now()}`,
          userId: user1.id,
        })
        const deckOpponent = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-opponent-${Date.now()}`,
          userId: user2.id,
        })
        const gameDeckSelf = await setDeck({
          deckId: deckSelf.id,
          gameId: game.id,
          userId: user1.id,
        })
        await setDeck({
          deckId: deckOpponent.id,
          gameId: game.id,
          userId: user2.id,
        })
        const unitId = gameDeckSelf.undrawn[0].unit.id
        await expect(
          graphql({
            schema,
            source: `mutation {
              redraw(
                game: "${game.id}"
                unit: "${unitId}"
              ) {
                ${getDeckUnitFragment()}
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
          errors: [new GraphQLError('Unit not in hand.')],
        })
      })
      it('throws error if try to redraw same card twice', async () => {
        const name1 = `redraw-1-${Date.now()}`
        const name2 = `redraw-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        const deckSelf = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-self-${Date.now()}`,
          userId: user1.id,
        })
        const deckOpponent = await addDeck({
          faction: FactionKey.Monsters,
          name: `redraw-opponent-${Date.now()}`,
          userId: user2.id,
        })
        const gameDeckSelf = await setDeck({
          deckId: deckSelf.id,
          gameId: game.id,
          userId: user1.id,
        })
        await setDeck({
          deckId: deckOpponent.id,
          gameId: game.id,
          userId: user2.id,
        })
        const unitToRedraw = gameDeckSelf.hand[0].unit.id
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
                ${getDeckUnitFragment()}
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
          errors: [new GraphQLError('Unit not in hand.')],
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
          creator: user1,
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
              ${getDeckUnitFragment()}
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
              ${getDeckUnitFragment()}
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
              ${getDeckUnitFragment()}
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
              ${getDeckUnitFragment()}
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
    })
  })
})
