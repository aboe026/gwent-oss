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

/**
 * A class to convert PlayerMove database objects to their GraphQL equivalent.
 */
export default class PlayerMoveResolver {
  /**
   * Converts a single PlayerMove database object to a single PlayerMove GraphQL object.
   *
   * @param config The configuration used to resolve the PlayerMove.
   * @param config.move The database object to resolve to its GraphQL type.
   * @param config.leader An optional pre-resolved Leader. If not specified, will retreive the Leader from the databae to resolve.
   * @param config.deckUnit An optional pre-resolved DeckUnit. If not specified, will retreive the DeckUnit from the databae to resolve.
   * @returns The resolved PlayerMove object matching its GraphQL schema definition.
   * @throws Error if the move type is invalid.
   */
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
        __typename: 'MoveLeader',
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
