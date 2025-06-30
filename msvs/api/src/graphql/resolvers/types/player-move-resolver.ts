import { Leader, Move } from '@gwent/graphql-schema/resolver-typings'
import {
  GameUnit,
  MoveDbObject,
  MoveLeaderDbObject,
  MovePassDbObject,
  MoveUnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import GameUnitResolver from './game-unit-resolver'
import LeaderResolver from './leader-resolver'
import MoveImpactResolver from './move-impact-resolver'
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
    gameUnit,
  }: {
    move: MoveDbObject
    leader?: Leader
    gameUnit?: GameUnit
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
        unit: await GameUnitResolver.fromObject({
          gameUnit: unitMove.unit,
          unit: gameUnit ? gameUnit.unit : undefined,
        }),
        impacts: await MoveImpactResolver.fromArray({
          impacts: unitMove.impacts,
        }),
        __typename: 'MoveUnit',
      }
    }
    throw Error(`Invalid Move type "${move.type}".`)
  }
}
