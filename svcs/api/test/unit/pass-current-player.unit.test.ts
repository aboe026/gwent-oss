import { ObjectId } from 'mongodb'

import deepClone from '../util/deep-clone'
import PassCurrentPlayer from '../../src/graphql/resolvers/mutations/util/pass-current-player'
import TestUtil from '../util/test-util'

describe('pass-current-player', () => {
  it('throws error if game turn not a player', () => {
    const userId = new ObjectId()
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
      turn: userId,
    })

    expect(() =>
      PassCurrentPlayer.passCurrentPlayer({
        game,
      })
    ).toThrow(`Could not find player "${userId}" on game "${game._id}"`)
  })
  it('sets passed to true for self in first round', () => {
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
      PassCurrentPlayer.passCurrentPlayer({
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
              passed: true,
            },
          ],
        },
        origGame.players[1],
      ],
    })
  })
  it('sets passed to true for self in second round', () => {
    const self = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          passed: true,
        }),
        TestUtil.getDbPlayerRound({}),
      ],
    })
    const opponent = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          passed: true,
        }),
        TestUtil.getDbPlayerRound({}),
      ],
    })
    const game = TestUtil.getDbGame({
      players: [self, opponent],
      round: 2,
      turn: self.user,
    })
    const origGame = deepClone(game)

    expect(
      PassCurrentPlayer.passCurrentPlayer({
        game,
      })
    ).toEqual(undefined)

    expect(game).toEqual({
      ...origGame,
      players: [
        {
          ...origGame.players[0],
          rounds: [
            origGame.players[0].rounds[0],
            {
              ...origGame.players[0].rounds[1],
              passed: true,
            },
          ],
        },
        origGame.players[1],
      ],
    })
  })
  it('sets passed to true for self in third round', () => {
    const self = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          passed: true,
        }),
        TestUtil.getDbPlayerRound({
          passed: true,
        }),
        TestUtil.getDbPlayerRound({}),
      ],
    })
    const opponent = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          passed: true,
        }),
        TestUtil.getDbPlayerRound({
          passed: true,
        }),
        TestUtil.getDbPlayerRound({}),
      ],
    })
    const game = TestUtil.getDbGame({
      players: [self, opponent],
      round: 3,
      turn: self.user,
    })
    const origGame = deepClone(game)

    expect(
      PassCurrentPlayer.passCurrentPlayer({
        game,
      })
    ).toEqual(undefined)

    expect(game).toEqual({
      ...origGame,
      players: [
        {
          ...origGame.players[0],
          rounds: [
            origGame.players[0].rounds[0],
            origGame.players[0].rounds[1],
            {
              ...origGame.players[0].rounds[2],
              passed: true,
            },
          ],
        },
        origGame.players[1],
      ],
    })
  })
  it('sets passed to true for opponent in first round', () => {
    const self = TestUtil.getDbGamePlayer({
      rounds: [TestUtil.getDbPlayerRound({})],
    })
    const opponent = TestUtil.getDbGamePlayer({
      rounds: [TestUtil.getDbPlayerRound({})],
    })
    const game = TestUtil.getDbGame({
      players: [self, opponent],
      round: 1,
      turn: opponent.user,
    })
    const origGame = deepClone(game)

    expect(
      PassCurrentPlayer.passCurrentPlayer({
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
              passed: true,
            },
          ],
        },
      ],
    })
  })
  it('sets passed to true for opponent in second round', () => {
    const self = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          passed: true,
        }),
        TestUtil.getDbPlayerRound({}),
      ],
    })
    const opponent = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          passed: true,
        }),
        TestUtil.getDbPlayerRound({}),
      ],
    })
    const game = TestUtil.getDbGame({
      players: [self, opponent],
      round: 2,
      turn: opponent.user,
    })
    const origGame = deepClone(game)

    expect(
      PassCurrentPlayer.passCurrentPlayer({
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
            origGame.players[1].rounds[0],
            {
              ...origGame.players[1].rounds[1],
              passed: true,
            },
          ],
        },
      ],
    })
  })
  it('sets passed to true for opponent in third round', () => {
    const self = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          passed: true,
        }),
        TestUtil.getDbPlayerRound({
          passed: true,
        }),
        TestUtil.getDbPlayerRound({}),
      ],
    })
    const opponent = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          passed: true,
        }),
        TestUtil.getDbPlayerRound({
          passed: true,
        }),
        TestUtil.getDbPlayerRound({}),
      ],
    })
    const game = TestUtil.getDbGame({
      players: [self, opponent],
      round: 3,
      turn: opponent.user,
    })
    const origGame = deepClone(game)

    expect(
      PassCurrentPlayer.passCurrentPlayer({
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
            origGame.players[1].rounds[0],
            origGame.players[1].rounds[1],
            {
              ...origGame.players[1].rounds[2],
              passed: true,
            },
          ],
        },
      ],
    })
  })
})
