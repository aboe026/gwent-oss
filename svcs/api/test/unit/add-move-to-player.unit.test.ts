import { ObjectId } from 'mongodb'

import AddMoveToPlayer from '../../src/graphql/resolvers/mutations/util/add-move-to-player'
import { Combat, MoveUnitDbObject } from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import { MoveType } from '@gwent/graphql-schema'
import TestUtil from '../util/test-util'

describe('add-move-to-player', () => {
  describe('self', () => {
    it('appends move without other moves in first round', () => {
      const self = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 0,
        ready: true,
        rounds: [TestUtil.getDbPlayerRound({})],
        user: new ObjectId(),
      })
      const opponent = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 1,
        ready: true,
        rounds: [TestUtil.getDbPlayerRound({})],
        user: new ObjectId(),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 1,
        turn: self.user,
      })
      const origGame = deepClone(game)
      const move: MoveUnitDbObject = {
        created: new Date(),
        row: Combat.Close,
        type: MoveType.Unit,
        unit: TestUtil.getDbDeckUnit({}),
      }

      AddMoveToPlayer.addMoveToPlayer({
        game,
        move,
      })
      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...self,
            rounds: [
              {
                ...self.rounds[0],
                moves: [move],
              },
            ],
          },
          opponent,
        ],
      })
    })
    it('appends move after other moves in first round', () => {
      const oldMove: MoveUnitDbObject = {
        created: new Date(),
        row: Combat.Ranged,
        type: MoveType.Unit,
        unit: TestUtil.getDbDeckUnit({}),
      }
      const self = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 0,
        ready: true,
        rounds: [
          TestUtil.getDbPlayerRound({
            moves: [oldMove],
          }),
        ],
        user: new ObjectId(),
      })
      const opponent = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 1,
        ready: true,
        rounds: [TestUtil.getDbPlayerRound({})],
        user: new ObjectId(),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 1,
        turn: self.user,
      })
      const origGame = deepClone(game)
      const move: MoveUnitDbObject = {
        created: new Date(),
        row: Combat.Close,
        type: MoveType.Unit,
        unit: TestUtil.getDbDeckUnit({}),
      }

      AddMoveToPlayer.addMoveToPlayer({
        game,
        move,
      })

      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...self,
            rounds: [
              {
                ...self.rounds[0],
                moves: [oldMove, move],
              },
            ],
          },
          opponent,
        ],
      })
    })
    it('appends move without other moves in second round', () => {
      const self = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 0,
        ready: true,
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        user: new ObjectId(),
      })
      const opponent = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 1,
        ready: true,
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        user: new ObjectId(),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 2,
        turn: self.user,
      })
      const origGame = deepClone(game)
      const move: MoveUnitDbObject = {
        created: new Date(),
        row: Combat.Close,
        type: MoveType.Unit,
        unit: TestUtil.getDbDeckUnit({}),
      }

      AddMoveToPlayer.addMoveToPlayer({
        game,
        move,
      })
      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...self,
            rounds: [
              self.rounds[0],
              {
                ...self.rounds[1],
                moves: [move],
              },
            ],
          },
          opponent,
        ],
      })
    })
    it('appends move after other moves in second round', () => {
      const oldMove: MoveUnitDbObject = {
        created: new Date(),
        row: Combat.Ranged,
        type: MoveType.Unit,
        unit: TestUtil.getDbDeckUnit({}),
      }
      const self = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 0,
        ready: true,
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            moves: [oldMove],
          }),
        ],
        user: new ObjectId(),
      })
      const opponent = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 1,
        ready: true,
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        user: new ObjectId(),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 2,
        turn: self.user,
      })
      const origGame = deepClone(game)
      const move: MoveUnitDbObject = {
        created: new Date(),
        row: Combat.Close,
        type: MoveType.Unit,
        unit: TestUtil.getDbDeckUnit({}),
      }

      AddMoveToPlayer.addMoveToPlayer({
        game,
        move,
      })
      expect(game).toEqual({
        ...origGame,
        players: [
          {
            ...self,
            rounds: [
              self.rounds[0],
              {
                ...self.rounds[1],
                moves: [oldMove, move],
              },
            ],
          },
          opponent,
        ],
      })
    })
  })
  describe('opponent', () => {
    it('appends move without other moves in first round', () => {
      const self = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 0,
        ready: true,
        rounds: [TestUtil.getDbPlayerRound({})],
        user: new ObjectId(),
      })
      const opponent = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 1,
        ready: true,
        rounds: [TestUtil.getDbPlayerRound({})],
        user: new ObjectId(),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 1,
        turn: opponent.user,
      })
      const origGame = deepClone(game)
      const move: MoveUnitDbObject = {
        created: new Date(),
        row: Combat.Close,
        type: MoveType.Unit,
        unit: TestUtil.getDbDeckUnit({}),
      }

      AddMoveToPlayer.addMoveToPlayer({
        game,
        move,
      })

      expect(game).toEqual({
        ...origGame,
        players: [
          self,
          {
            ...opponent,
            rounds: [
              {
                ...opponent.rounds[0],
                moves: [move],
              },
            ],
          },
        ],
      })
    })
    it('appends move after other moves in first round', () => {
      const oldMove: MoveUnitDbObject = {
        created: new Date(),
        row: Combat.Ranged,
        type: MoveType.Unit,
        unit: TestUtil.getDbDeckUnit({}),
      }
      const self = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 0,
        ready: true,
        rounds: [TestUtil.getDbPlayerRound({})],
        user: new ObjectId(),
      })
      const opponent = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 1,
        ready: true,
        rounds: [
          TestUtil.getDbPlayerRound({
            moves: [oldMove],
          }),
        ],
        user: new ObjectId(),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 1,
        turn: opponent.user,
      })
      const origGame = deepClone(game)
      const move: MoveUnitDbObject = {
        created: new Date(),
        row: Combat.Close,
        type: MoveType.Unit,
        unit: TestUtil.getDbDeckUnit({}),
      }

      AddMoveToPlayer.addMoveToPlayer({
        game,
        move,
      })

      expect(game).toEqual({
        ...origGame,
        players: [
          self,
          {
            ...opponent,
            rounds: [
              {
                ...opponent.rounds[0],
                moves: [oldMove, move],
              },
            ],
          },
        ],
      })
    })
    it('appends move without other moves in second round', () => {
      const self = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 0,
        ready: true,
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        user: new ObjectId(),
      })
      const opponent = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 1,
        ready: true,
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        user: new ObjectId(),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 2,
        turn: opponent.user,
      })
      const origGame = deepClone(game)
      const move: MoveUnitDbObject = {
        created: new Date(),
        row: Combat.Close,
        type: MoveType.Unit,
        unit: TestUtil.getDbDeckUnit({}),
      }

      AddMoveToPlayer.addMoveToPlayer({
        game,
        move,
      })

      expect(game).toEqual({
        ...origGame,
        players: [
          self,
          {
            ...opponent,
            rounds: [
              opponent.rounds[0],
              {
                ...opponent.rounds[1],
                moves: [move],
              },
            ],
          },
        ],
      })
    })
    it('appends move after other moves in second round', () => {
      const oldMove: MoveUnitDbObject = {
        created: new Date(),
        row: Combat.Ranged,
        type: MoveType.Unit,
        unit: TestUtil.getDbDeckUnit({}),
      }
      const self = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 0,
        ready: true,
        rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        user: new ObjectId(),
      })
      const opponent = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        order: 1,
        ready: true,
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            moves: [oldMove],
          }),
        ],
        user: new ObjectId(),
      })
      const game = TestUtil.getDbGame({
        players: [self, opponent],
        round: 2,
        turn: opponent.user,
      })
      const origGame = deepClone(game)
      const move: MoveUnitDbObject = {
        created: new Date(),
        row: Combat.Close,
        type: MoveType.Unit,
        unit: TestUtil.getDbDeckUnit({}),
      }

      AddMoveToPlayer.addMoveToPlayer({
        game,
        move,
      })

      expect(game).toEqual({
        ...origGame,
        players: [
          self,
          {
            ...opponent,
            rounds: [
              opponent.rounds[0],
              {
                ...opponent.rounds[1],
                moves: [oldMove, move],
              },
            ],
          },
        ],
      })
    })
  })
})
