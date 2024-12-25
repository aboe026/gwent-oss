import { GraphQLError, graphql } from 'graphql'

import {
  addDeck,
  addGame,
  addUser,
  getGame,
  getGameDeck,
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
  MovePass,
  MoveUnit,
  RoundResult,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { expectizeGame, expectizeGamePlayer, expectizePlayerRound } from './util/expect-util'
import { getGameFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'
import TestUtil from '../test-util'

describe('play-pass-mutation', () => {
  let self: User
  let opponent: User
  let game: Game
  let deckSelf: Deck
  let deckOpponent: Deck
  beforeAll(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
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
  afterAll(async () => {
    await DbConnector.disconnect()
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
                ${getGameFragment({})}
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
              `Invalid game status "${GameStatus.Decking}": Can only pass for game with status "${GameStatus.Playing}".`
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
                ${getGameFragment({})}
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
              `Invalid game status "${GameStatus.Ordering}": Can only pass for game with status "${GameStatus.Playing}".`
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
                ${getGameFragment({})}
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
              `Invalid game status "${GameStatus.Redrawing}": Can only pass for game with status "${GameStatus.Playing}".`
            ),
          ],
        })
      })
      // TODO: tests for when in DONE state
      it('returns error if not users turn', async () => {
        await expect(
          graphql({
            schema,
            source: `mutation {
              playPass(
                game: "${game.id}"
              ) {
                ${getGameFragment({})}
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
                ${getGameFragment({})}
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
                      moves: [
                        {
                          created: expect.any(Date),
                        } as MovePass,
                      ],
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
        const gameDeckSelf = await getGameDeck({
          gameId: game.id,
          userId: self.id,
        })
        const deckUnit = gameDeckSelf.hand[0]
        const deckUnitCombat = deckUnit.unit.combats ? deckUnit.unit.combats[0] : Combat.Close
        await playUnit({
          gameId: game.id,
          userId: self.id,
          unitId: deckUnit.unit.id,
          combat: deckUnitCombat,
        })
        const gameDeckOpponent = await getGameDeck({
          gameId: game.id,
          userId: opponent.id,
        })
        await playUnit({
          gameId: game.id,
          userId: opponent.id,
          unitId: gameDeckOpponent.hand[0].unit.id,
          combat: gameDeckOpponent.hand[0].unit.combats ? gameDeckOpponent.hand[0].unit.combats[0] : Combat.Close,
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
                ${getGameFragment({})}
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
                        {
                          created: expect.any(Date),
                          unit: deckUnit,
                          row: deckUnitCombat,
                        } as MoveUnit,
                        {
                          created: expect.any(Date),
                        } as MovePass,
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
        const gameDeckSelf = await getGameDeck({
          gameId: game.id,
          userId: self.id,
        })
        const deckUnit = gameDeckSelf.hand[0]
        const deckUnitCombat = deckUnit.unit.combats ? deckUnit.unit.combats[0] : Combat.Close
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
                {
                  created: expect.any(Date),
                  unit: deckUnit,
                  row: deckUnitCombat,
                } as MoveUnit,
                {
                  created: expect.any(Date),
                } as MovePass,
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
                ${getGameFragment({})}
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
                      moves: [
                        {
                          created: expect.any(Date),
                        } as MovePass,
                      ],
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
