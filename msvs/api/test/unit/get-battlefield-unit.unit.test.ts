import { GameDbObject, GameUnitDbObject } from '@gwent/graphql-schema/database-typings'
import getBattlefieldUnit from '../../src/graphql/resolvers/mutations/play-unit/get-battlefield-unit'
import { ObjectId } from 'mongodb'
import TestUtil from '../util/test-util'

describe('get-battlefield-unit', () => {
  it('throws error if user not no game', () => {
    const userId = new ObjectId().toString()
    const game = TestUtil.getDbGame({})
    testGetBattlefieldUnit({
      game,
      unitId: new ObjectId(),
      userId,
      expected: Error(`Could not find player "${userId}" on game "${game._id}"`),
    })
  })
  it('throws error more than 1 user found on game', () => {
    const userId = new ObjectId().toString()
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: userId,
        }),
        TestUtil.getDbGamePlayer({
          user: userId,
        }),
      ],
    })
    testGetBattlefieldUnit({
      game,
      unitId: new ObjectId(),
      userId,
      expected: Error(
        `Found more than 1 player with ID "${userId}" on game "${game._id}": "${JSON.stringify(game.players)}"`
      ),
    })
  })
  describe('round 1', () => {
    const round = 1
    it('returns undefined if unit not found', () => {
      const userId = new ObjectId().toString()
      const game = TestUtil.getDbGame({
        round,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [],
                },
              }),
            ],
          }),
        ],
      })
      testGetBattlefieldUnit({
        game,
        unitId: new ObjectId(),
        userId,
        expected: undefined,
      })
    })
    it('returns unit if found in close combat row', () => {
      const userId = new ObjectId().toString()
      const unit = TestUtil.getDbGameUnit({})
      const game = TestUtil.getDbGame({
        round,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [unit],
                },
              }),
            ],
          }),
        ],
      })
      testGetBattlefieldUnit({
        game,
        unitId: unit.unit,
        userId,
        expected: unit,
      })
    })
    it('returns unit if found in ranged combat row', () => {
      const userId = new ObjectId().toString()
      const unit = TestUtil.getDbGameUnit({})
      const game = TestUtil.getDbGame({
        round,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [unit],
                },
              }),
            ],
          }),
        ],
      })
      testGetBattlefieldUnit({
        game,
        unitId: unit.unit,
        userId,
        expected: unit,
      })
    })
    it('returns unit if found in siege combat row', () => {
      const userId = new ObjectId().toString()
      const unit = TestUtil.getDbGameUnit({})
      const game = TestUtil.getDbGame({
        round,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: {
                  score: 0,
                  units: [unit],
                },
              }),
            ],
          }),
        ],
      })
      testGetBattlefieldUnit({
        game,
        unitId: unit.unit,
        userId,
        expected: unit,
      })
    })
  })
  describe('round 2', () => {
    const round = 2
    it('returns undefined if unit not found', () => {
      const userId = new ObjectId().toString()
      const game = TestUtil.getDbGame({
        round,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({}),
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [],
                },
              }),
            ],
          }),
        ],
      })
      testGetBattlefieldUnit({
        game,
        unitId: new ObjectId(),
        userId,
        expected: undefined,
      })
    })
    it('returns unit if found in close combat row', () => {
      const userId = new ObjectId().toString()
      const unit = TestUtil.getDbGameUnit({})
      const game = TestUtil.getDbGame({
        round,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({}),
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [unit],
                },
              }),
            ],
          }),
        ],
      })
      testGetBattlefieldUnit({
        game,
        unitId: unit.unit,
        userId,
        expected: unit,
      })
    })
    it('returns unit if found in ranged combat row', () => {
      const userId = new ObjectId().toString()
      const unit = TestUtil.getDbGameUnit({})
      const game = TestUtil.getDbGame({
        round,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({}),
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [unit],
                },
              }),
            ],
          }),
        ],
      })
      testGetBattlefieldUnit({
        game,
        unitId: unit.unit,
        userId,
        expected: unit,
      })
    })
    it('returns unit if found in siege combat row', () => {
      const userId = new ObjectId().toString()
      const unit = TestUtil.getDbGameUnit({})
      const game = TestUtil.getDbGame({
        round,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({}),
              TestUtil.getDbPlayerRound({
                siege: {
                  score: 0,
                  units: [unit],
                },
              }),
            ],
          }),
        ],
      })
      testGetBattlefieldUnit({
        game,
        unitId: unit.unit,
        userId,
        expected: unit,
      })
    })
  })
  describe('round 3', () => {
    const round = 3
    it('returns undefined if unit not found', () => {
      const userId = new ObjectId().toString()
      const game = TestUtil.getDbGame({
        round,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({}),
              TestUtil.getDbPlayerRound({}),
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [],
                },
              }),
            ],
          }),
        ],
      })
      testGetBattlefieldUnit({
        game,
        unitId: new ObjectId(),
        userId,
        expected: undefined,
      })
    })
    it('returns unit if found in close combat row', () => {
      const userId = new ObjectId().toString()
      const unit = TestUtil.getDbGameUnit({})
      const game = TestUtil.getDbGame({
        round,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({}),
              TestUtil.getDbPlayerRound({}),
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [unit],
                },
              }),
            ],
          }),
        ],
      })
      testGetBattlefieldUnit({
        game,
        unitId: unit.unit,
        userId,
        expected: unit,
      })
    })
    it('returns unit if found in ranged combat row', () => {
      const userId = new ObjectId().toString()
      const unit = TestUtil.getDbGameUnit({})
      const game = TestUtil.getDbGame({
        round,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({}),
              TestUtil.getDbPlayerRound({}),
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: 0,
                  units: [unit],
                },
              }),
            ],
          }),
        ],
      })
      testGetBattlefieldUnit({
        game,
        unitId: unit.unit,
        userId,
        expected: unit,
      })
    })
    it('returns unit if found in siege combat row', () => {
      const userId = new ObjectId().toString()
      const unit = TestUtil.getDbGameUnit({})
      const game = TestUtil.getDbGame({
        round,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({}),
              TestUtil.getDbPlayerRound({}),
              TestUtil.getDbPlayerRound({
                siege: {
                  score: 0,
                  units: [unit],
                },
              }),
            ],
          }),
        ],
      })
      testGetBattlefieldUnit({
        game,
        unitId: unit.unit,
        userId,
        expected: unit,
      })
    })
  })
})

function testGetBattlefieldUnit({
  game,
  unitId,
  userId,
  expected,
}: {
  game: GameDbObject
  unitId: ObjectId
  userId?: string
  expected: GameUnitDbObject | undefined | Error
}) {
  if (expected instanceof Error) {
    expect(() =>
      getBattlefieldUnit({
        game,
        unitId,
        userId,
      })
    ).toThrow(expected)
  } else {
    expect(
      getBattlefieldUnit({
        game,
        unitId,
        userId,
      })
    ).toEqual(expected)
  }
}
