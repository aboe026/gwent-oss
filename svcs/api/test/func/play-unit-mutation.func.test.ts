import { GraphQLError, graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import {
  addDeck,
  addGame,
  addUser,
  getGame,
  getGameDeck,
  playPass,
  ready,
  setDeck,
  setOrder,
} from './util/graphql-util'
import {
  Combat,
  Deck,
  DeckUnit,
  FactionKey,
  Game,
  GamePlayer,
  GameStatus,
  GameUnit,
  MoveUnit,
  PlayerCombatRow,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import { expectizeGame, expectizeGamePlayer, expectizePlayerRound } from './util/expect-util'
import { getGameFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'
import TestUtil from '../test-util'

describe('play-unit-mutation', () => {
  let self: User
  let opponent: User
  let game: Game
  let deckSelf: Deck
  let deckOpponent: Deck
  beforeEach(async () => {
    self = await addUser(`play-unit-self-${Date.now()}`)
    opponent = await addUser(`play-unit-opponent-${Date.now()}`)
    game = await addGame({
      creator: self,
      opponentNames: [opponent.name],
    })
    deckSelf = await addDeck({
      faction: FactionKey.ScoiaTael,
      name: `play-unit-deck-self-${Date.now()}`,
      userId: self.id,
    })
    deckOpponent = await addDeck({
      faction: FactionKey.NorthernRealms,
      name: `play-unit-deck-opponent-${Date.now()}`,
      userId: opponent.id,
    })
    await setDeck({
      deckId: deckSelf.id,
      gameId: game.id,
      userId: self.id,
    })
    await setDeck({
      deckId: deckOpponent.id,
      gameId: game.id,
      userId: opponent.id,
    })
    await setOrder({
      gameId: game.id,
      userId: self.id,
      users: [self.id, opponent.id],
    })
    await ready({
      gameId: game.id,
      userId: self.id,
    })
    await ready({
      gameId: game.id,
      userId: opponent.id,
    })
    game = await getGame({
      gameId: game.id,
      userId: self.id,
    })
  })
  describe('playUnit', () => {
    describe('invalid', () => {
      it('returns error if unit is not valid ObjectID', async () => {
        await expect(
          graphql({
            schema,
            source: `mutation {
              playUnit(
                game: "${game.id}"
                combat: ${Combat.Close}
                unit: "invalid"
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(self),
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(`Unit ID "invalid" is not a valid MongoDB ObjectId.`)],
        })
      })
      it('returns error if game is in DECKING status', async () => {
        const game2 = await addGame({
          creator: self,
          opponentNames: [opponent.name],
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              playUnit(
                game: "${game2.id}"
                combat: ${Combat.Close}
                unit: "${new ObjectId()}"
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(self),
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [
            new GraphQLError(
              `Invalid game status "${GameStatus.Decking}": Can only play units for game with status "${GameStatus.Playing}".`
            ),
          ],
        })
      })
      it('returns error if game is in ORDERING status', async () => {
        const game2 = await addGame({
          creator: self,
          opponentNames: [opponent.name],
        })
        await setDeck({
          deckId: deckSelf.id,
          gameId: game2.id,
          userId: self.id,
        })
        await setDeck({
          deckId: deckOpponent.id,
          gameId: game2.id,
          userId: opponent.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              playUnit(
                game: "${game2.id}"
                combat: ${Combat.Close}
                unit: "${new ObjectId()}"
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(self),
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [
            new GraphQLError(
              `Invalid game status "${GameStatus.Ordering}": Can only play units for game with status "${GameStatus.Playing}".`
            ),
          ],
        })
      })
      it('returns error if game is in REDRAWING status', async () => {
        const game2 = await addGame({
          creator: self,
          opponentNames: [opponent.name],
        })
        await setDeck({
          deckId: deckSelf.id,
          gameId: game2.id,
          userId: self.id,
        })
        await setDeck({
          deckId: deckOpponent.id,
          gameId: game2.id,
          userId: opponent.id,
        })
        await setOrder({
          gameId: game2.id,
          userId: self.id,
          users: [self.id, opponent.id],
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              playUnit(
                game: "${game2.id}"
                combat: ${Combat.Close}
                unit: "${new ObjectId()}"
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(self),
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [
            new GraphQLError(
              `Invalid game status "${GameStatus.Redrawing}": Can only play units for game with status "${GameStatus.Playing}".`
            ),
          ],
        })
      })
      it('returns error if game is in DONE status', async () => {
        const game2 = await addGame({
          creator: self,
          opponentNames: [opponent.name],
        })
        await setDeck({
          deckId: deckSelf.id,
          gameId: game2.id,
          userId: self.id,
        })
        await setDeck({
          deckId: deckOpponent.id,
          gameId: game2.id,
          userId: opponent.id,
        })
        await setOrder({
          gameId: game2.id,
          userId: self.id,
          users: [self.id, opponent.id],
        })
        await ready({
          gameId: game2.id,
          userId: self.id,
        })
        await ready({
          gameId: game2.id,
          userId: opponent.id,
        })
        await playPass({
          gameId: game2.id,
          userId: self.id,
        })
        await playPass({
          gameId: game2.id,
          userId: opponent.id,
        })
        await playPass({
          gameId: game2.id,
          userId: opponent.id,
        })
        await playPass({
          gameId: game2.id,
          userId: self.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              playUnit(
                game: "${game2.id}"
                combat: ${Combat.Close}
                unit: "${new ObjectId()}"
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(self),
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [
            new GraphQLError(
              `Invalid game status "${GameStatus.Done}": Can only play units for game with status "${GameStatus.Playing}".`
            ),
          ],
        })
      })
      it('returns error if not users turn', async () => {
        await expect(
          graphql({
            schema,
            source: `mutation {
              playUnit(
                game: "${game.id}"
                combat: ${Combat.Close}
                unit: "${new ObjectId()}"
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(opponent),
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError('Cannot play units when it is not your turn.')],
        })
      })
      it('returns error if unit not in hand', async () => {
        const unitId = new ObjectId()
        await expect(
          graphql({
            schema,
            source: `mutation {
              playUnit(
                game: "${game.id}"
                combat: ${Combat.Close}
                unit: "${unitId}"
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(game.turn?.user.id === self.id ? self : opponent),
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError('Unit not in hand.')],
        })
      })
      it('returns error if no combat specified on multi combat unit', async () => {
        const gameDeck = await getGameDeck({
          gameId: game.id,
          userId: self.id,
        })
        let multiCombatDeckUnit: DeckUnit | undefined = undefined
        for (let i = 0; i < gameDeck.hand.length && !multiCombatDeckUnit; i++) {
          const deckUnit = gameDeck.hand[i]
          if (deckUnit.unit.combats && deckUnit.unit.combats.length > 1) {
            multiCombatDeckUnit = deckUnit
          }
        }
        if (!multiCombatDeckUnit) {
          throw Error('Could not find unit with multiple combats in hand')
        }
        await expect(
          graphql({
            schema,
            source: `mutation {
              playUnit(
                game: "${game.id}"
                unit: "${multiCombatDeckUnit.unit.id}"
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(self),
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [
            new GraphQLError(`Must specify combat: One of "${JSON.stringify(multiCombatDeckUnit.unit.combats)}".`),
          ],
        })
      })
      it('returns error if combat does not match unit combat', async () => {
        const gameDeck = await getGameDeck({
          gameId: game.id,
          userId: self.id,
        })
        const deckUnit = gameDeck.hand[0]
        const combats = [Combat.Close, Combat.Ranged, Combat.Siege]
        if (deckUnit.unit.combats) {
          for (const combat of deckUnit.unit.combats) {
            const index = combats.indexOf(combat)
            if (index >= 0) {
              combats.splice(index, 1)
            }
          }
        }
        const combat = combats[0]
        await expect(
          graphql({
            schema,
            source: `mutation {
              playUnit(
                game: "${game.id}"
                combat: ${combat}
                unit: "${deckUnit.unit.id}"
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(self),
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [
            new GraphQLError(
              `Combat "${combat}" does match unit combats of "${JSON.stringify(deckUnit.unit.combats)}".`
            ),
          ],
        })
      })
    })
    describe('valid', () => {
      it('play single combat unit without specifying combat', async () => {
        const gameDeck = await getGameDeck({
          gameId: game.id,
          userId: self.id,
        })
        let singleCombatDeckUnit: DeckUnit | undefined = undefined
        let combat: Combat | undefined = undefined
        for (let i = 0; i < gameDeck.hand.length && !singleCombatDeckUnit; i++) {
          const deckUnit = gameDeck.hand[i]
          if (deckUnit.unit.combats && deckUnit.unit.combats.length === 1) {
            singleCombatDeckUnit = deckUnit
            combat = deckUnit.unit.combats[0]
          }
        }
        if (!singleCombatDeckUnit || !combat) {
          throw Error('Could not find unit in hand with only single eligible combat')
        }
        const expectedCombatRow: PlayerCombatRow = {
          score: singleCombatDeckUnit.unit.strength || 0,
          units: [
            {
              ...singleCombatDeckUnit,
              effectiveStrength: singleCombatDeckUnit.unit.strength || 0,
            } as GameUnit,
          ],
        }

        const emptyCombatRow: PlayerCombatRow = {
          score: 0,
          units: [],
        }
        gameDeck.hand = gameDeck.hand.filter((handUnit) => handUnit.unit.id !== singleCombatDeckUnit.unit.id)
        const opponentGamePlayer = game.players.find((player) => player.user.id === opponent.id) as GamePlayer
        await expect(
          graphql({
            schema,
            source: `mutation {
              playUnit(
                game: "${game.id}"
                unit: "${singleCombatDeckUnit.unit.id}"
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(self),
              },
            },
          })
        ).resolves.toEqual({
          data: {
            playUnit: expectizeGame({
              creator: game.creator,
              players: [
                expectizeGamePlayer({
                  user: self,
                  gameDeck,
                  order: game.players.find((player) => player.user.id === self.id)?.order,
                  ready: true,
                  rounds: [
                    expectizePlayerRound({
                      close: combat === Combat.Close ? expectedCombatRow : emptyCombatRow,
                      moves: [
                        {
                          created: expect.any(Date),
                          row: combat,
                          unit: singleCombatDeckUnit,
                        } as MoveUnit,
                      ],
                      ranged: combat === Combat.Ranged ? expectedCombatRow : emptyCombatRow,
                      siege: combat === Combat.Siege ? expectedCombatRow : emptyCombatRow,
                      score: singleCombatDeckUnit.unit.strength || 0,
                    }),
                  ],
                }),
                opponentGamePlayer,
              ],
              status: GameStatus.Playing,
              round: 1,
              turn: opponentGamePlayer,
            }),
          },
        })
      })
      it('play single combat unit specifying combat', async () => {
        const gameDeck = await getGameDeck({
          gameId: game.id,
          userId: self.id,
        })
        let singleCombatDeckUnit: DeckUnit | undefined = undefined
        let combat: Combat | undefined = undefined
        for (let i = 0; i < gameDeck.hand.length && !singleCombatDeckUnit; i++) {
          const deckUnit = gameDeck.hand[i]
          if (deckUnit.unit.combats && deckUnit.unit.combats.length === 1) {
            singleCombatDeckUnit = deckUnit
            combat = deckUnit.unit.combats[0]
          }
        }
        if (!singleCombatDeckUnit || !combat) {
          throw Error('Could not find unit in hand with only single eligible combat')
        }
        const expectedCombatRow: PlayerCombatRow = {
          score: singleCombatDeckUnit.unit.strength || 0,
          units: [
            {
              ...singleCombatDeckUnit,
              effectiveStrength: singleCombatDeckUnit.unit.strength || 0,
            } as GameUnit,
          ],
        }

        const emptyCombatRow: PlayerCombatRow = {
          score: 0,
          units: [],
        }
        gameDeck.hand = gameDeck.hand.filter((handUnit) => handUnit.unit.id !== singleCombatDeckUnit.unit.id)
        const opponentGamePlayer = game.players.find((player) => player.user.id === opponent.id) as GamePlayer
        await expect(
          graphql({
            schema,
            source: `mutation {
              playUnit(
                game: "${game.id}"
                combat: ${combat}
                unit: "${singleCombatDeckUnit.unit.id}"
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(self),
              },
            },
          })
        ).resolves.toEqual({
          data: {
            playUnit: expectizeGame({
              creator: game.creator,
              players: [
                expectizeGamePlayer({
                  user: self,
                  gameDeck,
                  order: game.players.find((player) => player.user.id === self.id)?.order,
                  ready: true,
                  rounds: [
                    expectizePlayerRound({
                      close: combat === Combat.Close ? expectedCombatRow : emptyCombatRow,
                      moves: [
                        {
                          created: expect.any(Date),
                          row: combat,
                          unit: singleCombatDeckUnit,
                        } as MoveUnit,
                      ],
                      ranged: combat === Combat.Ranged ? expectedCombatRow : emptyCombatRow,
                      siege: combat === Combat.Siege ? expectedCombatRow : emptyCombatRow,
                      score: singleCombatDeckUnit.unit.strength || 0,
                    }),
                  ],
                }),
                opponentGamePlayer,
              ],
              status: GameStatus.Playing,
              round: 1,
              turn: opponentGamePlayer,
            }),
          },
        })
      })
      it('play multi combat unit specifying combat', async () => {
        const gameDeck = await getGameDeck({
          gameId: game.id,
          userId: self.id,
        })
        let multiCombatDeckUnit: DeckUnit | undefined = undefined
        let combat: Combat | undefined = undefined
        for (let i = 0; i < gameDeck.hand.length && !multiCombatDeckUnit; i++) {
          const deckUnit = gameDeck.hand[i]
          if (deckUnit.unit.combats && deckUnit.unit.combats.length > 1) {
            multiCombatDeckUnit = deckUnit
            combat = deckUnit.unit.combats[0]
          }
        }
        if (!multiCombatDeckUnit || !combat) {
          throw Error('Could not find unit in hand with multiple eligible combats')
        }
        const expectedCombatRow: PlayerCombatRow = {
          score: multiCombatDeckUnit.unit.strength || 0,
          units: [
            {
              ...multiCombatDeckUnit,
              effectiveStrength: multiCombatDeckUnit.unit.strength || 0,
            } as GameUnit,
          ],
        }

        const emptyCombatRow: PlayerCombatRow = {
          score: 0,
          units: [],
        }
        gameDeck.hand = gameDeck.hand.filter((handUnit) => handUnit.unit.id !== multiCombatDeckUnit.unit.id)
        const opponentGamePlayer = game.players.find((player) => player.user.id === opponent.id) as GamePlayer
        await expect(
          graphql({
            schema,
            source: `mutation {
              playUnit(
                game: "${game.id}"
                unit: "${multiCombatDeckUnit.unit.id}"
                combat: ${combat}
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(self),
              },
            },
          })
        ).resolves.toEqual({
          data: {
            playUnit: expectizeGame({
              creator: game.creator,
              players: [
                expectizeGamePlayer({
                  user: self,
                  gameDeck,
                  order: game.players.find((player) => player.user.id === self.id)?.order,
                  ready: true,
                  rounds: [
                    expectizePlayerRound({
                      close: combat === Combat.Close ? expectedCombatRow : emptyCombatRow,
                      moves: [
                        {
                          created: expect.any(Date),
                          row: combat,
                          unit: multiCombatDeckUnit,
                        } as MoveUnit,
                      ],
                      ranged: combat === Combat.Ranged ? expectedCombatRow : emptyCombatRow,
                      siege: combat === Combat.Siege ? expectedCombatRow : emptyCombatRow,
                      score: multiCombatDeckUnit.unit.strength || 0,
                    }),
                  ],
                }),
                opponentGamePlayer,
              ],
              status: GameStatus.Playing,
              round: 1,
              turn: opponentGamePlayer,
            }),
          },
        })
      })
    })
  })
})
