import deepClone from '../util/deep-clone'
import TestUtil from '../util/test-util'
import ClearBattlefieldCards from '../../src/graphql/resolvers/mutations/util/clear-battlefield-cards'

describe('clear-battlefield-cards', () => {
  describe('first round', () => {
    it('moves nothing to discard if no discard and no units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 1,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

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
        round: 1,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

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
    it('moves close to discard if no discards and close unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 1,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[0].close.units,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[0].close.units,
            },
          },
        ],
      })
    })
    it('moves ranged to discard if no discards and ranged unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 1,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[0].ranged.units,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[0].ranged.units,
            },
          },
        ],
      })
    })
    it('moves siege to discard if no discards and siege unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 1,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[0].siege.units,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[0].siege.units,
            },
          },
        ],
      })
    })
    it('moves close and ranged to discard if no discards and close and ranged units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 1,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[0].close.units[0], origGame.players[0].rounds[0].ranged.units[0]],
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[0].close.units[0], origGame.players[1].rounds[0].ranged.units[0]],
            },
          },
        ],
      })
    })
    it('moves close and siege to discard if no discards and close and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 1,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[0].close.units[0], origGame.players[0].rounds[0].siege.units[0]],
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[0].close.units[0], origGame.players[1].rounds[0].siege.units[0]],
            },
          },
        ],
      })
    })
    it('moves ranged and siege to discard if no discards and ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 1,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[0].ranged.units[0], origGame.players[0].rounds[0].siege.units[0]],
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[1].rounds[0].ranged.units[0], origGame.players[1].rounds[0].siege.units[0]],
            },
          },
        ],
      })
    })
    it('moves close ranged and siege to discard if no discards and close ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 1,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

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
              ],
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
              ],
            },
          },
        ],
      })
    })
    it('moves multiple close ranged and siege to discard if existing discards and close ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
          }),
        ],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
        }),
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
          }),
        ],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
        }),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 1,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

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
                origGame.players[0].rounds[0].close.units[0],
                origGame.players[0].rounds[0].close.units[1],
                origGame.players[0].rounds[0].ranged.units[0],
                origGame.players[0].rounds[0].ranged.units[1],
                origGame.players[0].rounds[0].siege.units[0],
                origGame.players[0].rounds[0].siege.units[1],
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
                origGame.players[1].rounds[0].close.units[0],
                origGame.players[1].rounds[0].close.units[1],
                origGame.players[1].rounds[0].ranged.units[0],
                origGame.players[1].rounds[0].ranged.units[1],
                origGame.players[1].rounds[0].siege.units[0],
                origGame.players[1].rounds[0].siege.units[1],
              ],
            },
          },
        ],
      })
    })
  })
  describe('second round', () => {
    it('moves nothing to discard if no discard and no units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 2,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

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
        round: 2,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

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
    it('moves close to discard if no discards and close unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 2,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[1].close.units,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[1].close.units,
            },
          },
        ],
      })
    })
    it('moves ranged to discard if no discards and ranged unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 2,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[1].ranged.units,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[1].ranged.units,
            },
          },
        ],
      })
    })
    it('moves siege to discard if no discards and siege unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 2,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[1].siege.units,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[1].siege.units,
            },
          },
        ],
      })
    })
    it('moves close and ranged to discard if no discards and close and ranged units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 2,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[1].close.units[0], origGame.players[0].rounds[1].ranged.units[0]],
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[1].close.units[0], origGame.players[1].rounds[1].ranged.units[0]],
            },
          },
        ],
      })
    })
    it('moves close and siege to discard if no discards and close and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 2,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[1].close.units[0], origGame.players[0].rounds[1].siege.units[0]],
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[1].close.units[0], origGame.players[1].rounds[1].siege.units[0]],
            },
          },
        ],
      })
    })
    it('moves ranged and siege to discard if no discards and ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 2,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[1].ranged.units[0], origGame.players[0].rounds[1].siege.units[0]],
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[1].ranged.units[0], origGame.players[1].rounds[1].siege.units[0]],
            },
          },
        ],
      })
    })
    it('moves close ranged and siege to discard if no discards and close ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 2,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

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
              ],
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
              ],
            },
          },
        ],
      })
    })
    it('moves multiple close ranged and siege to discard if existing discards and close ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
          }),
        ],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
        }),
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
          }),
        ],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
        }),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 2,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

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
                origGame.players[0].rounds[1].close.units[0],
                origGame.players[0].rounds[1].close.units[1],
                origGame.players[0].rounds[1].ranged.units[0],
                origGame.players[0].rounds[1].ranged.units[1],
                origGame.players[0].rounds[1].siege.units[0],
                origGame.players[0].rounds[1].siege.units[1],
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
                origGame.players[1].rounds[1].close.units[0],
                origGame.players[1].rounds[1].close.units[1],
                origGame.players[1].rounds[1].ranged.units[0],
                origGame.players[1].rounds[1].ranged.units[1],
                origGame.players[1].rounds[1].siege.units[0],
                origGame.players[1].rounds[1].siege.units[1],
              ],
            },
          },
        ],
      })
    })
  })
  describe('third round', () => {
    it('moves nothing to discard if no discard and no units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 3,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

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
        round: 3,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

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
    it('moves close to discard if no discards and close unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 3,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[2].close.units,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[2].close.units,
            },
          },
        ],
      })
    })
    it('moves ranged to discard if no discards and ranged unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 3,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[2].ranged.units,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[2].ranged.units,
            },
          },
        ],
      })
    })
    it('moves siege to discard if no discards and siege unit deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 3,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: origGame.players[0].rounds[2].siege.units,
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: origGame.players[1].rounds[2].siege.units,
            },
          },
        ],
      })
    })
    it('moves close and ranged to discard if no discards and close and ranged units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 3,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[2].close.units[0], origGame.players[0].rounds[2].ranged.units[0]],
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[2].close.units[0], origGame.players[1].rounds[2].ranged.units[0]],
            },
          },
        ],
      })
    })
    it('moves close and siege to discard if no discards and close and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 3,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[2].close.units[0], origGame.players[0].rounds[2].siege.units[0]],
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[2].close.units[0], origGame.players[1].rounds[2].siege.units[0]],
            },
          },
        ],
      })
    })
    it('moves ranged and siege to discard if no discards and ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 3,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            deck: {
              ...origGame.players[0].deck,
              discard: [origGame.players[0].rounds[2].ranged.units[0], origGame.players[0].rounds[2].siege.units[0]],
            },
          },
          {
            ...origGame.players[1],
            deck: {
              ...origGame.players[1].deck,
              discard: [origGame.players[1].rounds[2].ranged.units[0], origGame.players[1].rounds[2].siege.units[0]],
            },
          },
        ],
      })
    })
    it('moves close ranged and siege to discard if no discards and close ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({})],
            },
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 3,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

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
              ],
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
              ],
            },
          },
        ],
      })
    })
    it('moves multiple close ranged and siege to discard if existing discards and close ranged and siege units deployed ', () => {
      const self = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
          }),
        ],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
        }),
      })
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            },
          }),
        ],
        deck: TestUtil.getDbGameDeck({
          discard: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
        }),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 3,
        turn: self.user,
      })
      const origGame = deepClone(game)

      expect(
        ClearBattlefieldCards.clearBattlefieldCards({
          game,
        })
      ).toEqual(undefined)

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
                origGame.players[0].rounds[2].close.units[0],
                origGame.players[0].rounds[2].close.units[1],
                origGame.players[0].rounds[2].ranged.units[0],
                origGame.players[0].rounds[2].ranged.units[1],
                origGame.players[0].rounds[2].siege.units[0],
                origGame.players[0].rounds[2].siege.units[1],
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
                origGame.players[1].rounds[2].close.units[0],
                origGame.players[1].rounds[2].close.units[1],
                origGame.players[1].rounds[2].ranged.units[0],
                origGame.players[1].rounds[2].ranged.units[1],
                origGame.players[1].rounds[2].siege.units[0],
                origGame.players[1].rounds[2].siege.units[1],
              ],
            },
          },
        ],
      })
    })
  })
})
