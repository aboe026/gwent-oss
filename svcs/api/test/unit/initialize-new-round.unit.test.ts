import InitializeNewRound from '../../src/graphql/resolvers/mutations/util/initialize-new-round'
import deepClone from '../util/deep-clone'
import TestUtil from '../util/test-util'

describe('initialize-new-round', () => {
  it('adds new round to all game players with no score or units and increments game round for game that has no rounds', () => {
    const game = TestUtil.getDbGame({})
    const origGame = deepClone(game)

    InitializeNewRound.initializeNewRound({
      game,
    })

    expect(game).toEqual({
      ...origGame,
      round: 1,
      players: origGame.players.map((player) => {
        return {
          ...player,
          rounds: [TestUtil.getDbPlayerRound({})],
        }
      }),
    })
  })
  it('adds new round to all game players with no score or units and increments game round for game that is in first round', () => {
    const game = TestUtil.getDbGame({
      round: 1,
      players: [
        TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        }),
        TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        }),
      ],
    })
    const origGame = deepClone(game)

    InitializeNewRound.initializeNewRound({
      game,
    })

    expect(game).toEqual({
      ...origGame,
      round: 2,
      players: origGame.players.map((player) => {
        return {
          ...player,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        }
      }),
    })
  })
  it('adds new round to all game players with no score or units and increments game round for game that is in second round', () => {
    const game = TestUtil.getDbGame({
      round: 2,
      players: [
        TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        }),
        TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        }),
      ],
    })
    const origGame = deepClone(game)

    InitializeNewRound.initializeNewRound({
      game,
    })

    expect(game).toEqual({
      ...origGame,
      round: 3,
      players: origGame.players.map((player) => {
        return {
          ...player,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        }
      }),
    })
  })
})
