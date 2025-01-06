import { Combat, DeckUnit, Leader, Move } from '@gwent/graphql-schema/resolver-typings'
import DeckUnitResolver from './deck-unit-resolver'
import LeaderResolver from './leader-resolver'
import {
  MoveDbObject,
  MoveLeaderDbObject,
  MovePassDbObject,
  MoveUnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { MoveType } from '@gwent/graphql-schema'

export default class PlayerMoveResolver {
  static async fromObject({
    move,
    leader,
    deckUnit,
  }: {
    move: MoveDbObject
    leader?: Leader
    deckUnit?: DeckUnit
  }): Promise<Move> {
    if (move.type === MoveType.Leader) {
      const leaderMove = move as MoveLeaderDbObject
      return {
        created: leaderMove.created,
        leader:
          leader ||
          (await LeaderResolver.fromId({
            id: leaderMove.leader,
          })),
        __typename: 'MoveLeader', // TODO: keep "__typename" here or add it in resolves?
      }
    } else if (move.type === MoveType.Pass) {
      const passMove = move as MovePassDbObject
      return {
        created: passMove.created,
        __typename: 'MovePass',
      }
    } else if (move.type === MoveType.Unit) {
      const unitMove = move as MoveUnitDbObject
      return {
        created: unitMove.created,
        unit:
          deckUnit ||
          (await DeckUnitResolver.fromObject({
            deckUnit: unitMove.unit,
          })),
        row: unitMove.row as Combat,
        __typename: 'MoveUnit',
      }
    }
    throw Error(`Invalid Move type "${move.type}".`)
  }
}
