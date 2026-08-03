import { GraphQLError, graphql } from 'graphql'

import {
  addDeck,
  addGame,
  addUser,
  getGame,
  getGameDeck,
  getHandUnit,
  playPass,
  playUnit,
  ready,
  setDeck,
  setOrder,
} from './util/graphql-util'
import {
  Combat,
  Deck,
  FactionKey,
  Game,
  GamePlayer,
  GameStatus,
  RoundResult,
  User,
} from '@gwent-oss/graphql-schema/resolver-typings'
import { ensureUnitsInHand } from '@gwent-oss/test-utils'
import {
  expectizeGame,
  expectizeGamePlayer,
  expectizeMovePass,
  expectizeMoveUnit,
  expectizePlayerRound,
} from './util/expect-util'
import funcEnv from './util/func-env'
import { getGameFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'
import TestUtil from '../util/test-util'

describe('play-pass-mutation', () => {
  let self: User
  let opponent: User
  let game: Game
  let deckSelf: Deck
  let deckOpponent: Deck
  beforeEach(async () => {
    self = await addUser(`play-pass-self-${Date.now()}`)
    opponent = await addUser(`play-pass-opponent-${Date.now()}`)
    game = await addGame({
      creator: self,
      opponentNames: [opponent.name],
    })
    deckSelf = await addDeck({
      faction: FactionKey.ScoiaTael,
      name: `play-pass-deck-self-${Date.now()}`,
      userId: self.id,
    })
    deckOpponent = await addDeck({
      faction: FactionKey.NorthernRealms,
      name: `play-pass-deck-opponent-${Date.now()}`,
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
  describe('playPass', () => {
    describe('invalid', () => {
      it('returns error if game is in DECKING status', async () => {
        const game2 = await addGame({
          creator: self,
          opponentNames: [opponent.name],
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              playPass(
                game: "${game2.id}"
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
              `Invalid game status "${GameStatus.Decking}": Can only pass round for game with status "${GameStatus.Playing}".`
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
              playPass(
                game: "${game2.id}"
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
              `Invalid game status "${GameStatus.Ordering}": Can only pass round for game with status "${GameStatus.Playing}".`
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
              playPass(
                game: "${game2.id}"
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
              `Invalid game status "${GameStatus.Redrawing}": Can only pass round for game with status "${GameStatus.Playing}".`
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
              playPass(
                game: "${game2.id}"
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
              `Invalid game status "${GameStatus.Done}": Can only pass round for game with status "${GameStatus.Playing}".`
            ),
          ],
        })
      })
      it('returns error if not users turn', async () => {
        await expect(
          graphql({
            schema,
            source: `mutation {
              playPass(
                game: "${game.id}"
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
          errors: [new GraphQLError('Cannot pass round when it is not your turn.')],
        })
      })
    })
    describe('valid', () => {
      it('plays pass if first turn', async () => {
        const gameDeck = await getGameDeck({
          gameId: game.id,
          userId: self.id,
        })
        const opponentGamePlayer = game.players.find((player) => player.user.id === opponent.id) as GamePlayer
        await expect(
          graphql({
            schema,
            source: `mutation {
              playPass(
                game: "${game.id}"
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
            playPass: expectizeGame({
              creator: game.creator,
              players: [
                expectizeGamePlayer({
                  user: self,
                  gameDeck: gameDeck,
                  order: game.players.find((player) => player.user.id === self.id)?.order,
                  ready: true,
                  rounds: [
                    expectizePlayerRound({
                      moves: [expectizeMovePass()],
                      passed: true,
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
      it('plays pass if second turn', async () => {
        const unitName1 = 'Toruviel'
        const unitName2 = 'Ves'
        await ensureUnitsInHand({
          gameId: game.id,
          mongoConnectionString: funcEnv.MONGO_URL,
          mongoDatabaseName: funcEnv.MONGO_DB,
          unitNames: [unitName1],
          userId: self.id,
        })
        await ensureUnitsInHand({
          gameId: game.id,
          mongoConnectionString: funcEnv.MONGO_URL,
          mongoDatabaseName: funcEnv.MONGO_DB,
          unitNames: [unitName2],
          userId: opponent.id,
        })
        const deckUnitSelf = await getHandUnit({
          gameId: game.id,
          unitName: unitName1,
          userId: self.id,
        })
        const deckUnitOpponent = await getHandUnit({
          gameId: game.id,
          unitName: unitName2,
          userId: opponent.id,
        })
        const deckUnitCombat = Combat.Ranged
        await playUnit({
          gameId: game.id,
          userId: self.id,
          unitId: deckUnitSelf.unit.id,
          combat: deckUnitCombat,
        })
        await playUnit({
          gameId: game.id,
          userId: opponent.id,
          unitId: deckUnitOpponent.unit.id,
          combat: Combat.Close,
        })
        const updatedGame = await getGame({
          gameId: game.id,
          userId: self.id,
        })
        const updatedGameDeck = await getGameDeck({
          gameId: game.id,
          userId: self.id,
        })
        const gamePlayerSelf = updatedGame.players.find((player) => player.user.id === self.id) as GamePlayer
        const selfRound = gamePlayerSelf.rounds[0]
        const gamePlayerOpponent = updatedGame.players.find((player) => player.user.id === opponent.id) as GamePlayer
        await expect(
          graphql({
            schema,
            source: `mutation {
              playPass(
                game: "${game.id}"
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
            playPass: expectizeGame({
              creator: updatedGame.creator,
              players: [
                expectizeGamePlayer({
                  user: self,
                  gameDeck: updatedGameDeck,
                  order: 0,
                  ready: true,
                  rounds: [
                    expectizePlayerRound({
                      moves: [
                        expectizeMoveUnit({
                          unit: TestUtil.getFieldUnit({
                            unit: deckUnitSelf.unit,
                            row: deckUnitCombat,
                          }),
                        }),
                        expectizeMovePass(),
                      ],
                      passed: true,
                      score: selfRound.score,
                      close: selfRound.close,
                      ranged: selfRound.ranged,
                      siege: selfRound.siege,
                    }),
                  ],
                }),
                gamePlayerOpponent,
              ],
              status: GameStatus.Playing,
              round: 1,
              turn: gamePlayerOpponent,
            }),
          },
        })
      })
      it('plays pass after opponent has passed', async () => {
        const unitName = 'Toruviel'
        await ensureUnitsInHand({
          gameId: game.id,
          mongoConnectionString: funcEnv.MONGO_URL,
          mongoDatabaseName: funcEnv.MONGO_DB,
          unitNames: [unitName],
          userId: self.id,
        })
        const gameDeckSelf = await getGameDeck({
          gameId: game.id,
          userId: self.id,
        })
        const deckUnit = gameDeckSelf.hand.find((handUnit) => handUnit.unit.name === unitName)
        if (!deckUnit) {
          throw Error(`Could not find unit "${unitName}" in hand`)
        }
        const deckUnitCombat = Combat.Ranged
        await playUnit({
          gameId: game.id,
          userId: self.id,
          unitId: deckUnit.unit.id,
          combat: deckUnitCombat,
        })
        await playPass({
          gameId: game.id,
          userId: opponent.id,
        })
        const updatedGame = await getGame({
          gameId: game.id,
          userId: self.id,
        })
        const updatedGameDeck = await getGameDeck({
          gameId: game.id,
          userId: self.id,
        })
        updatedGameDeck.discard = [deckUnit]
        const selfRound = (updatedGame.players.find((gamePlayer) => gamePlayer.user.id === self.id) as GamePlayer)
          .rounds[0]
        const gamePlayerSelf = expectizeGamePlayer({
          user: self,
          gameDeck: updatedGameDeck,
          order: 0,
          ready: true,
          rounds: [
            expectizePlayerRound({
              moves: [
                expectizeMoveUnit({
                  unit: TestUtil.getFieldUnit({
                    unit: deckUnit.unit,
                    row: deckUnitCombat,
                  }),
                }),
                expectizeMovePass(),
              ],
              passed: true,
              result: RoundResult.Won,
              score: selfRound.score,
              close: selfRound.close,
              ranged: selfRound.ranged,
              siege: selfRound.siege,
            }),
            expectizePlayerRound({}),
          ],
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              playPass(
                game: "${game.id}"
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
            playPass: expectizeGame({
              creator: updatedGame.creator,
              players: [
                gamePlayerSelf,
                expectizeGamePlayer({
                  gameDeck: await getGameDeck({
                    gameId: game.id,
                    userId: opponent.id,
                  }),
                  user: opponent,
                  order: 1,
                  ready: true,
                  rounds: [
                    expectizePlayerRound({
                      passed: true,
                      result: RoundResult.Lost,
                      moves: [expectizeMovePass()],
                    }),
                    expectizePlayerRound({}),
                  ],
                }),
              ],
              status: GameStatus.Playing,
              round: 2,
              turn: gamePlayerSelf,
            }),
          },
        })
      })
    })
  })
})
