import CalculateGameScores from '../../src/graphql/resolvers/mutations/util/calculate-game-scores'
import TestUtil from '../util/test-util'
import deepClone from '../util/deep-clone'

describe('calculate-game-scores', () => {
  describe('calculateScores', () => {
    it('sets scores to zero if no units in of any combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual(origGame)
    })
    it('sets scores to zero for first player if single unit without effective strength in close combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            rounds: [
              {
                ...origGame.players[0].rounds[0],
                close: {
                  ...origGame.players[0].rounds[0].close,
                  score: 0,
                },
                score: 0,
              },
            ],
          },
          origGame.players[1],
        ],
      })
    })
    it('sets scores to zero for second player if single unit without effective strength in close combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          origGame.players[0],
          {
            ...origGame.players[1],
            rounds: [
              {
                ...origGame.players[1].rounds[0],
                close: {
                  ...origGame.players[1].rounds[0].close,
                  score: 0,
                },
                score: 0,
              },
            ],
          },
        ],
      })
    })
    it('sets scores to zero for first player if single unit without effective strength in ranged combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            rounds: [
              {
                ...origGame.players[0].rounds[0],
                ranged: {
                  ...origGame.players[0].rounds[0].ranged,
                  score: 0,
                },
                score: 0,
              },
            ],
          },
          origGame.players[1],
        ],
      })
    })
    it('sets scores to zero for second player if single unit without effective strength in ranged combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          origGame.players[0],
          {
            ...origGame.players[1],
            rounds: [
              {
                ...origGame.players[1].rounds[0],
                ranged: {
                  ...origGame.players[1].rounds[0].ranged,
                  score: 0,
                },
                score: 0,
              },
            ],
          },
        ],
      })
    })
    it('sets scores to zero for first player if single unit without effective strength in siege combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            rounds: [
              {
                ...origGame.players[0].rounds[0],
                siege: {
                  ...origGame.players[0].rounds[0].siege,
                  score: 0,
                },
                score: 0,
              },
            ],
          },
          origGame.players[1],
        ],
      })
    })
    it('sets scores to zero for second player if single unit without effective strength in siege combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          origGame.players[0],
          {
            ...origGame.players[1],
            rounds: [
              {
                ...origGame.players[1].rounds[0],
                siege: {
                  ...origGame.players[1].rounds[0].siege,
                  score: 0,
                },
                score: 0,
              },
            ],
          },
        ],
      })
    })
    it('sets score for first player if single unit in close combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 1,
                    }),
                  ],
                },
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            rounds: [
              {
                ...origGame.players[0].rounds[0],
                close: {
                  ...origGame.players[0].rounds[0].close,
                  score: 1,
                },
                score: 1,
              },
            ],
          },
          origGame.players[1],
        ],
      })
    })
    it('sets score for second player if single unit in close combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 1,
                    }),
                  ],
                },
              }),
            ],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          origGame.players[0],
          {
            ...origGame.players[1],
            rounds: [
              {
                ...origGame.players[1].rounds[0],
                close: {
                  ...origGame.players[1].rounds[0].close,
                  score: 1,
                },
                score: 1,
              },
            ],
          },
        ],
      })
    })
    it('sets score for first player if single unit in ranged combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 1,
                    }),
                  ],
                },
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            rounds: [
              {
                ...origGame.players[0].rounds[0],
                ranged: {
                  ...origGame.players[0].rounds[0].ranged,
                  score: 1,
                },
                score: 1,
              },
            ],
          },
          origGame.players[1],
        ],
      })
    })
    it('sets score for second player if single unit in ranged combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 1,
                    }),
                  ],
                },
              }),
            ],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          origGame.players[0],
          {
            ...origGame.players[1],
            rounds: [
              {
                ...origGame.players[1].rounds[0],
                ranged: {
                  ...origGame.players[1].rounds[0].ranged,
                  score: 1,
                },
                score: 1,
              },
            ],
          },
        ],
      })
    })
    it('sets score for first player if single unit in siege combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 1,
                    }),
                  ],
                },
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            rounds: [
              {
                ...origGame.players[0].rounds[0],
                siege: {
                  ...origGame.players[0].rounds[0].siege,
                  score: 1,
                },
                score: 1,
              },
            ],
          },
          origGame.players[1],
        ],
      })
    })
    it('sets score for second player if single unit in siege combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 1,
                    }),
                  ],
                },
              }),
            ],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          origGame.players[0],
          {
            ...origGame.players[1],
            rounds: [
              {
                ...origGame.players[1].rounds[0],
                siege: {
                  ...origGame.players[1].rounds[0].siege,
                  score: 1,
                },
                score: 1,
              },
            ],
          },
        ],
      })
    })
    it('sets score for both players if single unit in close combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 1,
                    }),
                  ],
                },
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 2,
                    }),
                  ],
                },
              }),
            ],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            rounds: [
              {
                ...origGame.players[0].rounds[0],
                close: {
                  ...origGame.players[0].rounds[0].close,
                  score: 1,
                },
                score: 1,
              },
            ],
          },
          {
            ...origGame.players[1],
            rounds: [
              {
                ...origGame.players[1].rounds[0],
                close: {
                  ...origGame.players[1].rounds[0].close,
                  score: 2,
                },
                score: 2,
              },
            ],
          },
        ],
      })
    })
    it('sets score for both players if single unit in ranged combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 1,
                    }),
                  ],
                },
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 2,
                    }),
                  ],
                },
              }),
            ],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            rounds: [
              {
                ...origGame.players[0].rounds[0],
                ranged: {
                  ...origGame.players[0].rounds[0].ranged,
                  score: 1,
                },
                score: 1,
              },
            ],
          },
          {
            ...origGame.players[1],
            rounds: [
              {
                ...origGame.players[1].rounds[0],
                ranged: {
                  ...origGame.players[1].rounds[0].ranged,
                  score: 2,
                },
                score: 2,
              },
            ],
          },
        ],
      })
    })
    it('sets score for both players if single unit in siege combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 1,
                    }),
                  ],
                },
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 2,
                    }),
                  ],
                },
              }),
            ],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            rounds: [
              {
                ...origGame.players[0].rounds[0],
                siege: {
                  ...origGame.players[0].rounds[0].siege,
                  score: 1,
                },
                score: 1,
              },
            ],
          },
          {
            ...origGame.players[1],
            rounds: [
              {
                ...origGame.players[1].rounds[0],
                siege: {
                  ...origGame.players[1].rounds[0].siege,
                  score: 2,
                },
                score: 2,
              },
            ],
          },
        ],
      })
    })
    it('sets score for both players if single unit in close and ranged combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 1,
                    }),
                  ],
                },
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 2,
                    }),
                  ],
                },
              }),
            ],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            rounds: [
              {
                ...origGame.players[0].rounds[0],
                close: {
                  ...origGame.players[0].rounds[0].close,
                  score: 1,
                },
                score: 1,
              },
            ],
          },
          {
            ...origGame.players[1],
            rounds: [
              {
                ...origGame.players[1].rounds[0],
                ranged: {
                  ...origGame.players[1].rounds[0].ranged,
                  score: 2,
                },
                score: 2,
              },
            ],
          },
        ],
      })
    })
    it('sets score for both players if single unit in close and siege combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 1,
                    }),
                  ],
                },
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 2,
                    }),
                  ],
                },
              }),
            ],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            rounds: [
              {
                ...origGame.players[0].rounds[0],
                close: {
                  ...origGame.players[0].rounds[0].close,
                  score: 1,
                },
                score: 1,
              },
            ],
          },
          {
            ...origGame.players[1],
            rounds: [
              {
                ...origGame.players[1].rounds[0],
                siege: {
                  ...origGame.players[1].rounds[0].siege,
                  score: 2,
                },
                score: 2,
              },
            ],
          },
        ],
      })
    })
    it('sets score for both players if single unit in ranged and siege combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 1,
                    }),
                  ],
                },
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 2,
                    }),
                  ],
                },
              }),
            ],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            rounds: [
              {
                ...origGame.players[0].rounds[0],
                ranged: {
                  ...origGame.players[0].rounds[0].ranged,
                  score: 1,
                },
                score: 1,
              },
            ],
          },
          {
            ...origGame.players[1],
            rounds: [
              {
                ...origGame.players[1].rounds[0],
                siege: {
                  ...origGame.players[1].rounds[0].siege,
                  score: 2,
                },
                score: 2,
              },
            ],
          },
        ],
      })
    })
    it('sets score for both players if multiple units in same combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 1,
                    }),
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 2,
                    }),
                  ],
                },
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 3,
                    }),
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 4,
                    }),
                  ],
                },
              }),
            ],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            rounds: [
              {
                ...origGame.players[0].rounds[0],
                close: {
                  ...origGame.players[0].rounds[0].close,
                  score: 3,
                },
                score: 3,
              },
            ],
          },
          {
            ...origGame.players[1],
            rounds: [
              {
                ...origGame.players[1].rounds[0],
                close: {
                  ...origGame.players[1].rounds[0].close,
                  score: 7,
                },
                score: 7,
              },
            ],
          },
        ],
      })
    })
    it('sets score for both players if multiple units in different combat', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 1,
                    }),
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 2,
                    }),
                  ],
                },
                ranged: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 4,
                    }),
                  ],
                },
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 5,
                    }),
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 6,
                    }),
                  ],
                },
                siege: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 7,
                    }),
                    TestUtil.getDbGameUnit({
                      effectiveStrength: 8,
                    }),
                  ],
                },
              }),
            ],
          }),
        ],
        round: 1,
      })
      const origGame = deepClone(game)

      expect(
        CalculateGameScores.calculateScores({
          game,
        })
      ).toEqual(undefined)

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...origGame.players[0],
            rounds: [
              {
                ...origGame.players[0].rounds[0],
                close: {
                  ...origGame.players[0].rounds[0].close,
                  score: 3,
                },
                ranged: {
                  ...origGame.players[0].rounds[0].ranged,
                  score: 4,
                },
                score: 7,
              },
            ],
          },
          {
            ...origGame.players[1],
            rounds: [
              {
                ...origGame.players[1].rounds[0],
                ranged: {
                  ...origGame.players[1].rounds[0].ranged,
                  score: 11,
                },
                siege: {
                  ...origGame.players[1].rounds[0].siege,
                  score: 15,
                },
                score: 26,
              },
            ],
          },
        ],
      })
    })
  })
  describe('calculateScoreForRow', () => {
    it('returns zero if no units in row', () => {
      expect(
        CalculateGameScores['calculateScoreForRow']({
          units: [],
        })
      ).toEqual(0)
    })
    it('returns zero if single unit without effective strength', () => {
      expect(
        CalculateGameScores['calculateScoreForRow']({
          units: [TestUtil.getDbGameUnit({})],
        })
      ).toEqual(0)
    })
    it('returns zero if multiple units without effective strength', () => {
      expect(
        CalculateGameScores['calculateScoreForRow']({
          units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
        })
      ).toEqual(0)
    })
    it('returns effective strength if single unit with effective strength', () => {
      expect(
        CalculateGameScores['calculateScoreForRow']({
          units: [
            TestUtil.getDbGameUnit({
              effectiveStrength: 1,
            }),
          ],
        })
      ).toEqual(1)
    })
    it('returns effective strength if single unit with effective strength and unit without effective strength', () => {
      expect(
        CalculateGameScores['calculateScoreForRow']({
          units: [
            TestUtil.getDbGameUnit({
              effectiveStrength: 1,
            }),
            TestUtil.getDbGameUnit({}),
          ],
        })
      ).toEqual(1)
    })
    it('returns effective strength if unit without effective strength and single unit with effective strength', () => {
      expect(
        CalculateGameScores['calculateScoreForRow']({
          units: [
            TestUtil.getDbGameUnit({}),
            TestUtil.getDbGameUnit({
              effectiveStrength: 1,
            }),
          ],
        })
      ).toEqual(1)
    })
    it('returns sum of effective strengths if multiple units with effective strength', () => {
      expect(
        CalculateGameScores['calculateScoreForRow']({
          units: [
            TestUtil.getDbGameUnit({
              effectiveStrength: 1,
            }),
            TestUtil.getDbGameUnit({
              effectiveStrength: 1,
            }),
          ],
        })
      ).toEqual(2)
    })
    it('returns sum of effective strengths if multiple units with effective strength and multiple units without effective strength', () => {
      expect(
        CalculateGameScores['calculateScoreForRow']({
          units: [
            TestUtil.getDbGameUnit({}),
            TestUtil.getDbGameUnit({
              effectiveStrength: 1,
            }),
            TestUtil.getDbGameUnit({}),
            TestUtil.getDbGameUnit({
              effectiveStrength: 1,
            }),
            TestUtil.getDbGameUnit({}),
          ],
        })
      ).toEqual(2)
    })
  })
})
