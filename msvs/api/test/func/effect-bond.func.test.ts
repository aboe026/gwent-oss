import { graphql } from 'graphql'

import {
  addDeck,
  addGame,
  addUser,
  getGame,
  getGameDeck,
  playUnit,
  ready,
  setDeck,
  setOrder,
} from './util/graphql-util'
import {
  Combat,
  Deck,
  EffectKey,
  FactionKey,
  Game,
  GamePlayer,
  GameStatus,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import { EFFECT_OPERATOR } from '@gwent/constants'
import { ensureUnitsInHand } from '@gwent/test-utils'
import { expectizeGame, expectizeGamePlayer, expectizeMoveUnit, expectizePlayerRound } from './util/expect-util'
import funcEnv from './util/func-env'
import { getGameFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'
import TestUtil from '../util/test-util'

describe('effect-bond', () => {
  let self: User
  let opponent: User
  let game: Game
  let deckSelf: Deck
  let deckOpponent: Deck
  beforeEach(async () => {
    self = await addUser(`effect-bond-self-${Date.now()}`)
    opponent = await addUser(`effect-bond-opponent-${Date.now()}`)
    game = await addGame({
      creator: self,
      opponentNames: [opponent.name],
    })
    deckSelf = await addDeck({
      faction: FactionKey.NorthernRealms,
      name: `effect-bond-deck-self-${Date.now()}`,
      userId: self.id,
    })
    deckOpponent = await addDeck({
      faction: FactionKey.ScoiaTael,
      name: `effect-bond-deck-opponent-${Date.now()}`,
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
      userId: opponent.id,
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
  it('bond unit played by itself does not effect itself', async () => {
    const unitName = 'Blue Stripes Commando'
    await ensureUnitsInHand({
      gameId: game.id,
      userId: self.id,
      mongoConnectionString: funcEnv.MONGO_URL,
      mongoDatabaseName: funcEnv.MONGO_DB,
      unitNames: [unitName],
    })

    const gameDeck = await getGameDeck({
      gameId: game.id,
      userId: self.id,
    })

    const unitSelf1 = gameDeck.hand.find((unit) => unit.unit.name === unitName)
    if (!unitSelf1) {
      throw Error(`Could not find unit "${unitName}" in hand`)
    }

    gameDeck.hand = gameDeck.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)
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
                    score: unitSelf1.unit.strength || 0,
                    units: [
                      TestUtil.getFieldUnit({
                        unit: unitSelf1.unit,
                      }),
                    ],
                  },
                  moves: [
                    expectizeMoveUnit({
                      unit: TestUtil.getFieldUnit({
                        unit: unitSelf1.unit,
                      }),
                      impacts: [],
                    }),
                  ],
                  ranged: TestUtil.getPlayerCombatRow({}),
                  siege: TestUtil.getPlayerCombatRow({}),
                  score: unitSelf1.unit.strength || 0,
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
  it('bond unit played when matching unit already on battlefield doubles each effective strength', async () => {
    const unitName1 = 'Blue Stripes Commando'
    const unitName2 = 'Toruviel'
    const unitName3 = 'Blue Stripes Commando'
    await ensureUnitsInHand({
      gameId: game.id,
      userId: self.id,
      mongoConnectionString: funcEnv.MONGO_URL,
      mongoDatabaseName: funcEnv.MONGO_DB,
      unitNames: [unitName1, unitName3],
    })
    await ensureUnitsInHand({
      gameId: game.id,
      userId: opponent.id,
      mongoConnectionString: funcEnv.MONGO_URL,
      mongoDatabaseName: funcEnv.MONGO_DB,
      unitNames: [unitName2],
    })

    const gameDeckSelf = await getGameDeck({
      gameId: game.id,
      userId: self.id,
    })
    const gameDeckOpponent = await getGameDeck({
      gameId: game.id,
      userId: opponent.id,
    })

    const unitSelf1 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName1)
    if (!unitSelf1) {
      throw Error(`Could not find unit "${unitName1}" in hand`)
    }
    const combatUnit1 = Combat.Close
    const effectBond = unitSelf1.unit.effects?.find((effect) => effect.key === EffectKey.Bond)
    if (!effectBond) {
      throw Error(`Could not find "${EffectKey.Bond}" effect on "${unitName1}" unit`)
    }
    await playUnit({
      gameId: game.id,
      unitId: unitSelf1.unit.id,
      combat: combatUnit1,
      userId: self.id,
    })
    gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)

    const unitOpponent1 = gameDeckOpponent.hand.find((unit) => unit.unit.name === unitName2)
    if (!unitOpponent1) {
      throw Error(`Could not find unit "${unitName2}" in hand`)
    }
    const combatUnitOpponent = Combat.Ranged
    await playUnit({
      gameId: game.id,
      unitId: unitOpponent1.unit.id,
      combat: combatUnitOpponent,
      userId: opponent.id,
    })
    gameDeckOpponent.hand = gameDeckOpponent.hand.filter((handUnit) => handUnit.unit.id !== unitOpponent1.unit.id)

    const unitSelf2 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName3)
    if (!unitSelf2) {
      throw Error(`Could not find unit "${unitName3}" in hand`)
    }
    const combatUnit2 = Combat.Close

    gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf2.unit.id)
    const expectedGamePlayer = expectizeGamePlayer({
      user: opponent,
      gameDeck: gameDeckOpponent,
      order: 1,
      ready: true,
      rounds: [
        expectizePlayerRound({
          close: TestUtil.getPlayerCombatRow({}),
          moves: [
            expectizeMoveUnit({
              unit: TestUtil.getFieldUnit({
                unit: unitOpponent1.unit,
                artStyle: unitOpponent1.artStyle,
                effectiveStrength: unitOpponent1.unit.strength || 0,
                row: combatUnitOpponent,
              }),
            }),
          ],
          ranged: {
            score: unitOpponent1.unit.strength || 0,
            units: [
              TestUtil.getFieldUnit({
                unit: unitOpponent1.unit,
                artStyle: unitOpponent1.artStyle,
                row: combatUnitOpponent,
                effectiveStrength: unitOpponent1.unit.strength || 0,
              }),
            ],
          },
          siege: TestUtil.getPlayerCombatRow({}),
          score: unitOpponent1.unit.strength || 0,
        }),
      ],
    })
    const fieldUnit1 = TestUtil.getFieldUnit({
      unit: unitSelf1.unit,
      effectiveStrength: 8,
      row: combatUnit1,
      effects: [
        {
          operator: EFFECT_OPERATOR.Double,
          total: 8,
          reason: {
            effect: effectBond,
            unit: unitSelf2.unit,
          },
        },
      ],
    })
    const fieldUnit2 = TestUtil.getFieldUnit({
      unit: unitSelf2.unit,
      effectiveStrength: 8,
      row: combatUnit2,
      effects: [
        {
          operator: EFFECT_OPERATOR.Double,
          total: 8,
          reason: {
            effect: effectBond,
            unit: unitSelf1.unit,
          },
        },
      ],
    })

    await expect(
      graphql({
        schema,
        source: `mutation {
            playUnit(
              game: "${game.id}"
              unit: "${unitSelf2.unit.id}"
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
              gameDeck: gameDeckSelf,
              order: 0,
              ready: true,
              rounds: [
                expectizePlayerRound({
                  close: {
                    score: 16,
                    units: [fieldUnit1, fieldUnit2],
                  },
                  moves: [
                    expectizeMoveUnit({
                      unit: TestUtil.getFieldUnit({
                        unit: unitSelf1.unit,
                        effectiveStrength: 4,
                        row: combatUnit1,
                      }),
                      impacts: [],
                    }),
                    expectizeMoveUnit({
                      unit: fieldUnit2,
                      impacts: [
                        TestUtil.getImpact({
                          unit: fieldUnit1,
                          user: self,
                        }),
                      ],
                    }),
                  ],
                  ranged: TestUtil.getPlayerCombatRow({}),
                  siege: TestUtil.getPlayerCombatRow({}),
                  score: 16,
                }),
              ],
            }),
            expectedGamePlayer,
          ],
          status: GameStatus.Playing,
          round: 1,
          turn: expectedGamePlayer,
        }),
      },
    })
  })
})
