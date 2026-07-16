import deepClone from '../util/deep-clone'
import TestUtil from '../util/test-util'
import clearBattlefieldUnits from '../../src/graphql/resolvers/mutations/play-pass/clear-battlefield-units'

describe('clear-battlefield-units', () => {
  describe('first round', () => {
    const round = 1
    it('moves nothing to discard if no discard and no units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [],
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [],
            },
          },
        ],
      })
    })
    it('moves nothing to discard if previous discards and no units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbDeckUnit({})],
        }),
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbDeckUnit({})],
        }),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].deck.discard,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].deck.discard,
            },
          },
        ],
      })
    })
    it('moves close unit to discard if no discards and close unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[0].close.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[0].close.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves close modifier to discard if no discards and close modifier deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[0].close.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[0].close.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves ranged unit to discard if no discards and ranged unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[0].ranged.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[0].ranged.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves ranged modifier to discard if no discards and ranged modifier deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[0].ranged.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[0].ranged.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves siege unit to discard if no discards and siege unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[0].siege.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[0].siege.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves siege modifier to discard if no discards and siege modifier deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            siege: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            siege: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[0].siege.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[0].siege.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves single weather to discard if no discards and single weather deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            weathers: [TestUtil.getDbWeatherUnit({})],
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            weathers: [TestUtil.getDbWeatherUnit({})],
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[0].weathers,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[0].weathers,
            },
          },
        ],
      })
    })
    it('moves close and ranged units to discard if no discards and close and ranged units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[0].rounds[0].close.units[0],
                origGame.players[0].rounds[0].ranged.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [
                origGame.players[1].rounds[0].close.units[0],
                origGame.players[1].rounds[0].ranged.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves close and siege units to discard if no discards and close and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[0].close.units[0], origGame.players[0].rounds[0].siege.units[0]].map(
                (unit) => {
                  return {
                    artStyle: unit.artStyle,
                    unit: unit.unit,
                  }
                }
              ),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[0].close.units[0], origGame.players[1].rounds[0].siege.units[0]].map(
                (unit) => {
                  return {
                    artStyle: unit.artStyle,
                    unit: unit.unit,
                  }
                }
              ),
            },
          },
        ],
      })
    })
    it('moves ranged and siege units to discard if no discards and ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[0].rounds[0].ranged.units[0],
                origGame.players[0].rounds[0].siege.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[1].rounds[0].ranged.units[0],
                origGame.players[1].rounds[0].siege.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves close ranged and siege units to discard if no discards and close ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[0].rounds[0].close.units[0],
                origGame.players[0].rounds[0].ranged.units[0],
                origGame.players[0].rounds[0].siege.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [
                origGame.players[1].rounds[0].close.units[0],
                origGame.players[1].rounds[0].ranged.units[0],
                origGame.players[1].rounds[0].siege.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves close ranged and siege modifiers to discard if no discards and close ranged and siege modifiers deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[0].rounds[0].close.modifier,
                origGame.players[0].rounds[0].ranged.modifier,
                origGame.players[0].rounds[0].siege.modifier,
              ].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [
                origGame.players[1].rounds[0].close.modifier,
                origGame.players[1].rounds[0].ranged.modifier,
                origGame.players[1].rounds[0].siege.modifier,
              ].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves multiple weathers to discard if no discards and multiple weathers deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            weathers: [TestUtil.getDbWeatherUnit({}), TestUtil.getDbWeatherUnit({})],
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            weathers: [TestUtil.getDbWeatherUnit({}), TestUtil.getDbWeatherUnit({})],
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[0].weathers,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[0].weathers,
            },
          },
        ],
      })
    })
    it('moves multiple close ranged and siege units to discard if existing discards and close ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
        }),
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
        }),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[0].deck.discard[0],
                origGame.players[0].deck.discard[1],
                ...[
                  origGame.players[0].rounds[0].close.units[0],
                  origGame.players[0].rounds[0].close.units[1],
                  origGame.players[0].rounds[0].ranged.units[0],
                  origGame.players[0].rounds[0].ranged.units[1],
                  origGame.players[0].rounds[0].siege.units[0],
                  origGame.players[0].rounds[0].siege.units[1],
                ].map((unit) => {
                  return {
                    artStyle: unit.artStyle,
                    unit: unit.unit,
                  }
                }),
              ],
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [
                origGame.players[1].deck.discard[0],
                origGame.players[1].deck.discard[1],
                ...[
                  origGame.players[1].rounds[0].close.units[0],
                  origGame.players[1].rounds[0].close.units[1],
                  origGame.players[1].rounds[0].ranged.units[0],
                  origGame.players[1].rounds[0].ranged.units[1],
                  origGame.players[1].rounds[0].siege.units[0],
                  origGame.players[1].rounds[0].siege.units[1],
                ].map((unit) => {
                  return {
                    artStyle: unit.artStyle,
                    unit: unit.unit,
                  }
                }),
              ],
            },
          },
        ],
      })
    })
  })
  describe('second round', () => {
    const round = 2
    it('moves nothing to discard if no discard and no units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [],
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [],
            },
          },
        ],
      })
    })
    it('moves nothing to discard if previous discards and no units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbDeckUnit({})],
        }),
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbDeckUnit({})],
        }),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].deck.discard,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].deck.discard,
            },
          },
        ],
      })
    })
    it('moves close unit to discard if no discards and close unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[1].close.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[1].close.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves close modifier to discard if no discards and close modifier deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[1].close.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[1].close.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves ranged unit to discard if no discards and ranged unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[1].ranged.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[1].ranged.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves ranged modifier to discard if no discards and ranged modifier deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[1].ranged.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[1].ranged.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves siege unit to discard if no discards and siege unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[1].siege.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[1].siege.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves siege modifier to discard if no discards and siege modifier deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            siege: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            siege: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[1].siege.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[1].siege.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves single weather to discard if no discards and single weather deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            weathers: [TestUtil.getDbWeatherUnit({})],
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            weathers: [TestUtil.getDbWeatherUnit({})],
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[1].weathers,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[1].weathers,
            },
          },
        ],
      })
    })
    it('moves close and ranged units to discard if no discards and close and ranged units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[0].rounds[1].close.units[0],
                origGame.players[0].rounds[1].ranged.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [
                origGame.players[1].rounds[1].close.units[0],
                origGame.players[1].rounds[1].ranged.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves close and siege units to discard if no discards and close and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[1].close.units[0], origGame.players[0].rounds[1].siege.units[0]].map(
                (unit) => {
                  return {
                    artStyle: unit.artStyle,
                    unit: unit.unit,
                  }
                }
              ),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[1].close.units[0], origGame.players[1].rounds[1].siege.units[0]].map(
                (unit) => {
                  return {
                    artStyle: unit.artStyle,
                    unit: unit.unit,
                  }
                }
              ),
            },
          },
        ],
      })
    })
    it('moves ranged and siege units to discard if no discards and ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[0].rounds[1].ranged.units[0],
                origGame.players[0].rounds[1].siege.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[1].rounds[1].ranged.units[0],
                origGame.players[1].rounds[1].siege.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves close ranged and siege units to discard if no discards and close ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[0].rounds[1].close.units[0],
                origGame.players[0].rounds[1].ranged.units[0],
                origGame.players[0].rounds[1].siege.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [
                origGame.players[1].rounds[1].close.units[0],
                origGame.players[1].rounds[1].ranged.units[0],
                origGame.players[1].rounds[1].siege.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves close ranged and siege modifiers to discard if no discards and close ranged and siege modifiers deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[0].rounds[1].close.modifier,
                origGame.players[0].rounds[1].ranged.modifier,
                origGame.players[0].rounds[1].siege.modifier,
              ].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [
                origGame.players[1].rounds[1].close.modifier,
                origGame.players[1].rounds[1].ranged.modifier,
                origGame.players[1].rounds[1].siege.modifier,
              ].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves multiple weathers to discard if no discards and multiple weathers deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            weathers: [TestUtil.getDbWeatherUnit({}), TestUtil.getDbWeatherUnit({})],
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            weathers: [TestUtil.getDbWeatherUnit({}), TestUtil.getDbWeatherUnit({})],
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[1].weathers,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[1].weathers,
            },
          },
        ],
      })
    })
    it('moves multiple close ranged and siege units to discard if existing discards and close ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
        }),
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
        }),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[0].deck.discard[0],
                origGame.players[0].deck.discard[1],
                ...[
                  origGame.players[0].rounds[1].close.units[0],
                  origGame.players[0].rounds[1].close.units[1],
                  origGame.players[0].rounds[1].ranged.units[0],
                  origGame.players[0].rounds[1].ranged.units[1],
                  origGame.players[0].rounds[1].siege.units[0],
                  origGame.players[0].rounds[1].siege.units[1],
                ].map((unit) => {
                  return {
                    artStyle: unit.artStyle,
                    unit: unit.unit,
                  }
                }),
              ],
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [
                origGame.players[1].deck.discard[0],
                origGame.players[1].deck.discard[1],
                ...[
                  origGame.players[1].rounds[1].close.units[0],
                  origGame.players[1].rounds[1].close.units[1],
                  origGame.players[1].rounds[1].ranged.units[0],
                  origGame.players[1].rounds[1].ranged.units[1],
                  origGame.players[1].rounds[1].siege.units[0],
                  origGame.players[1].rounds[1].siege.units[1],
                ].map((unit) => {
                  return {
                    artStyle: unit.artStyle,
                    unit: unit.unit,
                  }
                }),
              ],
            },
          },
        ],
      })
    })
  })
  describe('second round', () => {
    const round = 3
    it('moves nothing to discard if no discard and no units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [],
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [],
            },
          },
        ],
      })
    })
    it('moves nothing to discard if previous discards and no units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbDeckUnit({})],
        }),
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbDeckUnit({})],
        }),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].deck.discard,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].deck.discard,
            },
          },
        ],
      })
    })
    it('moves close unit to discard if no discards and close unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[2].close.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[2].close.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves close modifier to discard if no discards and close modifier deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[2].close.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[2].close.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves ranged unit to discard if no discards and ranged unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[2].ranged.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[2].ranged.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves ranged modifier to discard if no discards and ranged modifier deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[2].ranged.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[2].ranged.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves siege unit to discard if no discards and siege unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[2].siege.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[2].siege.units.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves siege modifier to discard if no discards and siege modifier deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            siege: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            siege: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[2].siege.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[2].siege.modifier].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves single weather to discard if no discards and single weather deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            weathers: [TestUtil.getDbWeatherUnit({})],
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            weathers: [TestUtil.getDbWeatherUnit({})],
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[2].weathers,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[2].weathers,
            },
          },
        ],
      })
    })
    it('moves close and ranged units to discard if no discards and close and ranged units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[0].rounds[2].close.units[0],
                origGame.players[0].rounds[2].ranged.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [
                origGame.players[1].rounds[2].close.units[0],
                origGame.players[1].rounds[2].ranged.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves close and siege units to discard if no discards and close and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[2].close.units[0], origGame.players[0].rounds[2].siege.units[0]].map(
                (unit) => {
                  return {
                    artStyle: unit.artStyle,
                    unit: unit.unit,
                  }
                }
              ),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[2].close.units[0], origGame.players[1].rounds[2].siege.units[0]].map(
                (unit) => {
                  return {
                    artStyle: unit.artStyle,
                    unit: unit.unit,
                  }
                }
              ),
            },
          },
        ],
      })
    })
    it('moves ranged and siege units to discard if no discards and ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[0].rounds[2].ranged.units[0],
                origGame.players[0].rounds[2].siege.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[1].rounds[2].ranged.units[0],
                origGame.players[1].rounds[2].siege.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves close ranged and siege units to discard if no discards and close ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[0].rounds[2].close.units[0],
                origGame.players[0].rounds[2].ranged.units[0],
                origGame.players[0].rounds[2].siege.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [
                origGame.players[1].rounds[2].close.units[0],
                origGame.players[1].rounds[2].ranged.units[0],
                origGame.players[1].rounds[2].siege.units[0],
              ].map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: unit.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves close ranged and siege modifiers to discard if no discards and close ranged and siege modifiers deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[0].rounds[2].close.modifier,
                origGame.players[0].rounds[2].ranged.modifier,
                origGame.players[0].rounds[2].siege.modifier,
              ].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [
                origGame.players[1].rounds[2].close.modifier,
                origGame.players[1].rounds[2].ranged.modifier,
                origGame.players[1].rounds[2].siege.modifier,
              ].map((unit) => {
                return {
                  artStyle: unit?.artStyle,
                  unit: unit?.unit,
                }
              }),
            },
          },
        ],
      })
    })
    it('moves multiple weathers to discard if no discards and multiple weathers deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            weathers: [TestUtil.getDbWeatherUnit({}), TestUtil.getDbWeatherUnit({})],
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            weathers: [TestUtil.getDbWeatherUnit({}), TestUtil.getDbWeatherUnit({})],
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[2].weathers,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[2].weathers,
            },
          },
        ],
      })
    })
    it('moves multiple close ranged and siege units to discard if existing discards and close ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
        }),
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})],
        }),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(clearBattlefieldUnits(game)).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [
                origGame.players[0].deck.discard[0],
                origGame.players[0].deck.discard[1],
                ...[
                  origGame.players[0].rounds[2].close.units[0],
                  origGame.players[0].rounds[2].close.units[1],
                  origGame.players[0].rounds[2].ranged.units[0],
                  origGame.players[0].rounds[2].ranged.units[1],
                  origGame.players[0].rounds[2].siege.units[0],
                  origGame.players[0].rounds[2].siege.units[1],
                ].map((unit) => {
                  return {
                    artStyle: unit.artStyle,
                    unit: unit.unit,
                  }
                }),
              ],
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [
                origGame.players[1].deck.discard[0],
                origGame.players[1].deck.discard[1],
                ...[
                  origGame.players[1].rounds[2].close.units[0],
                  origGame.players[1].rounds[2].close.units[1],
                  origGame.players[1].rounds[2].ranged.units[0],
                  origGame.players[1].rounds[2].ranged.units[1],
                  origGame.players[1].rounds[2].siege.units[0],
                  origGame.players[1].rounds[2].siege.units[1],
                ].map((unit) => {
                  return {
                    artStyle: unit.artStyle,
                    unit: unit.unit,
                  }
                }),
              ],
            },
          },
        ],
      })
    })
  })
})
