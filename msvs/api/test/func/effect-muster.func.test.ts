import { graphql } from 'graphql'

import { addDeck, addGame, addUser, getGame, getGameDeck, ready, setDeck } from './util/graphql-util'
import {
  Deck,
  FactionKey,
  Game,
  GamePlayer,
  GameStatus,
  GameUnitOrigin,
  MoveReasonType,
  User,
} from '@gwent-oss/graphql-schema/resolver-typings'
import { ensureUnitsInHand, setTurnOrder } from '@gwent-oss/test-utils'
import { expectizeGame, expectizeGamePlayer, expectizeMoveUnit, expectizePlayerRound } from './util/expect-util'
import funcEnv from './util/func-env'
import { getGameFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'
import { sortObjectArray } from '@gwent-oss/utils'
import TestUtil from '../util/test-util'

describe('effect-muster', () => {
  let self: User
  let opponent: User
  let game: Game
  let deckSelf: Deck
  let deckOpponent: Deck
  beforeEach(async () => {
    self = await addUser(`effect-muster-self-${Date.now()}`)
    opponent = await addUser(`effect-muster-opponent-${Date.now()}`)
    game = await addGame({
      creator: self,
      opponentNames: [opponent.name],
    })
    deckSelf = await addDeck({
      faction: FactionKey.Monsters,
      name: `effect-muster-deck-self-${Date.now()}`,
      userId: self.id,
    })
    deckOpponent = await addDeck({
      faction: FactionKey.NorthernRealms,
      name: `effect-muster-deck-opponent-${Date.now()}`,
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
    await setTurnOrder({
      gameId: game.id,
      mongoConnectionString: funcEnv.MONGO_URL,
      mongoDatabaseName: funcEnv.MONGO_DB,
      userIds: [self.id, opponent.id],
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
  it('muster unit without effectPrefix musters other units from hand and undrawn', async () => {
    const unitName = 'Ghoul'
    await ensureUnitsInHand({
      gameId: game.id,
      userId: self.id,
      mongoConnectionString: funcEnv.MONGO_URL,
      mongoDatabaseName: funcEnv.MONGO_DB,
      unitNames: [unitName, unitName],
      excludeNames: [unitName],
    })

    const gameDeck = await getGameDeck({
      gameId: game.id,
      userId: self.id,
    })

    const unitSelf1 = sortObjectArray({
      array: gameDeck.hand,
      sortProperties: ['unit.id'],
    }).find((unit) => unit.unit.name === unitName)
    if (!unitSelf1) {
      throw Error(`Could not find unit "${unitName}" in hand`)
    }
    const fieldUnitSelf1 = TestUtil.getFieldUnit({
      unit: unitSelf1.unit,
    })
    gameDeck.hand = gameDeck.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)

    const unitSelf2 = sortObjectArray({
      array: gameDeck.hand,
      sortProperties: ['unit.id'],
    }).find((unit) => unit.unit.name === unitName)
    if (!unitSelf2) {
      throw Error(`Could not find second unit "${unitName}" in hand`)
    }
    const fieldUnitSelf2 = TestUtil.getFieldUnit({
      unit: unitSelf2.unit,
    })
    gameDeck.hand = gameDeck.hand.filter((handUnit) => handUnit.unit.id !== unitSelf2.unit.id)

    const unitSelf3 = sortObjectArray({
      array: gameDeck.undrawn,
      sortProperties: ['unit.id'],
    }).find((unit) => unit.unit.name === unitName)
    if (!unitSelf3) {
      throw Error(`Could not find unit "${unitName}" in undrawn`)
    }
    const fieldUnitSelf3 = TestUtil.getFieldUnit({
      unit: unitSelf3.unit,
    })
    gameDeck.undrawn = gameDeck.undrawn.filter((undrawnUnit) => undrawnUnit.unit.id !== unitSelf3.unit.id)

    const opponentGamePlayer = game.players.find((player) => player.user.id === opponent.id) as GamePlayer

    await expect(
      graphql({
        schema,
        source: `mutation {
          playUnit(
            game: "${game.id}"
            unit: "${unitSelf1.unit.id}"
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
              order: 0,
              ready: true,
              rounds: [
                expectizePlayerRound({
                  close: {
                    score: 3,
                    units: [fieldUnitSelf1, fieldUnitSelf2, fieldUnitSelf3],
                  },
                  moves: [
                    expectizeMoveUnit({
                      unit: fieldUnitSelf1,
                      impacts: [
                        TestUtil.getImpact({
                          unit: fieldUnitSelf2,
                          user: self,
                          source: TestUtil.getSource({}),
                        }),
                        TestUtil.getImpact({
                          unit: fieldUnitSelf3,
                          user: self,
                          source: TestUtil.getSource({
                            origin: GameUnitOrigin.Undrawn,
                          }),
                        }),
                      ],
                    }),
                    expectizeMoveUnit({
                      unit: fieldUnitSelf2,
                      reason: {
                        type: MoveReasonType.Muster,
                        unit: fieldUnitSelf1,
                      },
                      impacts: [],
                    }),
                    expectizeMoveUnit({
                      unit: fieldUnitSelf3,
                      reason: {
                        type: MoveReasonType.Muster,
                        unit: fieldUnitSelf1,
                      },
                      source: TestUtil.getSource({
                        origin: GameUnitOrigin.Undrawn,
                      }),
                      impacts: [],
                    }),
                  ],
                  ranged: TestUtil.getPlayerCombatRow({}),
                  siege: TestUtil.getPlayerCombatRow({}),
                  score: 3,
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
  it('muster unit with prefix musters other units from hand and undrawn', async () => {
    const unitName1 = 'Vampire: Bruxa'
    const unitName2 = 'Vampire: Ekimmara'
    const unitName3 = 'Vampire: Fleder'
    const unitName4 = 'Vampire: Garkain'
    const unitName5 = 'Vampire: Katakan'
    await ensureUnitsInHand({
      gameId: game.id,
      userId: self.id,
      mongoConnectionString: funcEnv.MONGO_URL,
      mongoDatabaseName: funcEnv.MONGO_DB,
      unitNames: [unitName1, unitName2, unitName3],
      excludeNames: [unitName4, unitName5],
    })

    const gameDeck = await getGameDeck({
      gameId: game.id,
      userId: self.id,
    })

    const unitSelf1 = sortObjectArray({
      array: gameDeck.hand,
      sortProperties: ['unit.id'],
    }).find((unit) => unit.unit.name === unitName1)
    if (!unitSelf1) {
      throw Error(`Could not find unit "${unitName1}" in hand`)
    }
    const fieldUnitSelf1 = TestUtil.getFieldUnit({
      unit: unitSelf1.unit,
    })
    gameDeck.hand = gameDeck.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)

    const unitSelf2 = sortObjectArray({
      array: gameDeck.hand,
      sortProperties: ['unit.id'],
    }).find((unit) => unit.unit.name === unitName2)
    if (!unitSelf2) {
      throw Error(`Could not find second unit "${unitName2}" in hand`)
    }
    const fieldUnitSelf2 = TestUtil.getFieldUnit({
      unit: unitSelf2.unit,
    })
    gameDeck.hand = gameDeck.hand.filter((handUnit) => handUnit.unit.id !== unitSelf2.unit.id)

    const unitSelf3 = sortObjectArray({
      array: gameDeck.hand,
      sortProperties: ['unit.id'],
    }).find((unit) => unit.unit.name === unitName3)
    if (!unitSelf3) {
      throw Error(`Could not find unit "${unitName3}" in hand`)
    }
    const fieldUnitSelf3 = TestUtil.getFieldUnit({
      unit: unitSelf3.unit,
    })
    gameDeck.hand = gameDeck.hand.filter((undrawnUnit) => undrawnUnit.unit.id !== unitSelf3.unit.id)

    const unitSelf4 = sortObjectArray({
      array: gameDeck.undrawn,
      sortProperties: ['unit.id'],
    }).find((unit) => unit.unit.name === unitName4)
    if (!unitSelf4) {
      throw Error(`Could not find unit "${unitName4}" in undrawn`)
    }
    const fieldUnitSelf4 = TestUtil.getFieldUnit({
      unit: unitSelf4.unit,
    })
    gameDeck.undrawn = gameDeck.undrawn.filter((undrawnUnit) => undrawnUnit.unit.id !== unitSelf4.unit.id)

    const unitSelf5 = sortObjectArray({
      array: gameDeck.undrawn,
      sortProperties: ['unit.id'],
    }).find((unit) => unit.unit.name === unitName5)
    if (!unitSelf5) {
      throw Error(`Could not find unit "${unitName5}" in undrawn`)
    }
    const fieldUnitSelf5 = TestUtil.getFieldUnit({
      unit: unitSelf5.unit,
    })
    gameDeck.undrawn = gameDeck.undrawn.filter((undrawnUnit) => undrawnUnit.unit.id !== unitSelf5.unit.id)

    const opponentGamePlayer = game.players.find((player) => player.user.id === opponent.id) as GamePlayer
    await expect(
      graphql({
        schema,
        source: `mutation {
          playUnit(
            game: "${game.id}"
            unit: "${unitSelf1.unit.id}"
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
              order: 0,
              ready: true,
              rounds: [
                expectizePlayerRound({
                  close: {
                    score: 21,
                    units: [fieldUnitSelf1, fieldUnitSelf2, fieldUnitSelf3, fieldUnitSelf4, fieldUnitSelf5],
                  },
                  moves: [
                    expectizeMoveUnit({
                      unit: fieldUnitSelf1,
                      impacts: [
                        TestUtil.getImpact({
                          unit: fieldUnitSelf2,
                          user: self,
                          source: TestUtil.getSource({}),
                        }),
                        TestUtil.getImpact({
                          unit: fieldUnitSelf3,
                          user: self,
                          source: TestUtil.getSource({}),
                        }),
                        TestUtil.getImpact({
                          unit: fieldUnitSelf4,
                          user: self,
                          source: TestUtil.getSource({
                            origin: GameUnitOrigin.Undrawn,
                          }),
                        }),
                        TestUtil.getImpact({
                          unit: fieldUnitSelf5,
                          user: self,
                          source: TestUtil.getSource({
                            origin: GameUnitOrigin.Undrawn,
                          }),
                        }),
                      ],
                    }),
                    expectizeMoveUnit({
                      unit: fieldUnitSelf2,
                      reason: {
                        type: MoveReasonType.Muster,
                        unit: fieldUnitSelf1,
                      },
                      impacts: [],
                    }),
                    expectizeMoveUnit({
                      unit: fieldUnitSelf3,
                      reason: {
                        type: MoveReasonType.Muster,
                        unit: fieldUnitSelf1,
                      },
                      impacts: [],
                    }),
                    expectizeMoveUnit({
                      unit: fieldUnitSelf4,
                      reason: {
                        type: MoveReasonType.Muster,
                        unit: fieldUnitSelf1,
                      },
                      source: TestUtil.getSource({
                        origin: GameUnitOrigin.Undrawn,
                      }),
                      impacts: [],
                    }),
                    expectizeMoveUnit({
                      unit: fieldUnitSelf5,
                      reason: {
                        type: MoveReasonType.Muster,
                        unit: fieldUnitSelf1,
                      },
                      source: TestUtil.getSource({
                        origin: GameUnitOrigin.Undrawn,
                      }),
                      impacts: [],
                    }),
                  ],
                  ranged: TestUtil.getPlayerCombatRow({}),
                  siege: TestUtil.getPlayerCombatRow({}),
                  score: 21,
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
