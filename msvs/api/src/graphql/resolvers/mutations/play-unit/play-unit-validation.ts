import { getLogger } from 'log4js'

import { Combat, MutationPlayUnitArgs } from '@gwent/graphql-schema/resolver-typings'
import { Context } from '@gwent/graphql-schema/context'
import { DeckUnitDbObject, GameDbObject, GameStatus, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import { GraphQLResolveInfo } from 'graphql'
import PresentableError from '../../../../util/presentable-error'
import ResolverUtil from '../../resolver-util'
import UnitStore from '../../../../database/stores/unit-store'

/**
 * A class for validating the playUnit GraphQL Mutation.
 */
export default class PlayUnitValidation {
  private static logger = getLogger('PlayUnitValidation')

  /**
   * Validates the inputs for playing a unit in a game.
   *
   * @param args The arguments for playing the unit.
   * @param context The session containing the user playing the unit.
   * @param info The information about the GraphQL request.
   * @returns The information needed to play the unit in the game.
   * @throws PresentableError if known problem playing unit.
   */
  static async playUnitValidation(
    args: MutationPlayUnitArgs,
    context: Context,
    info: GraphQLResolveInfo
  ): Promise<ValidatedPlayUnit> {
    const resolverUtil = new ResolverUtil({
      logger: PlayUnitValidation.logger,
    })

    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'playUnit mutation',
    })
    const gameId = args.game
    const unitId = args.unit
    let combat = args.combat

    const logPrefix = `playUnit by "${userId}" for unit "${unitId}" on game "${gameId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    resolverUtil.verifyMongoIds({
      ids: [unitId],
      label: 'Unit ID',
    })

    const { game, player } = await resolverUtil.getGamePlayer({
      gameId,
      userId,
      status: GameStatus.Playing,
      turn: true,
      label: 'play units',
    })

    const deckUnits = player.deck.hand.filter((hand) => hand.unit.toString() === unitId)
    if (deckUnits.length === 0) {
      const message = 'Unit not in hand.'
      PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    } else if (deckUnits.length > 1) {
      const message = `Found more than 1 unit with ID "${unitId}"`
      PlayUnitValidation.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(deckUnits)}"`)
      throw new PresentableError(`${message}.`)
    }
    const deckUnit = deckUnits[0]

    const units = await UnitStore.get({
      ids: [unitId],
    })

    if (PlayUnitValidation.logger.isTraceEnabled()) {
      PlayUnitValidation.logger.trace(`${logPrefix} units: "${JSON.stringify(units)}"`)
    }

    if (units.length === 0) {
      const message = 'Unit does not exist.'
      PlayUnitValidation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    } else if (units.length > 1) {
      const message = `Found multiple units with ID "${unitId}"`
      PlayUnitValidation.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(units)}"`)
      throw new PresentableError(`${message}.`)
    }
    const unit = units[0]

    if (unit.combats && unit.combats.length > 1 && !combat) {
      const message = `Must specify combat: One of "${JSON.stringify(unit.combats)}".`
      PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    if (unit.combats && unit.combats.length > 0 && combat && !unit.combats.includes(combat)) {
      const message = `Combat "${combat}" does match unit combats of "${JSON.stringify(unit.combats)}".`
      PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    if (unit.combats && unit.combats.length === 1 && !combat) {
      combat = unit.combats[0] as Combat
    }

    return {
      combat,
      deckUnit,
      game,
      logPrefix,
      unit,
    }
  }
}

export interface ValidatedPlayUnit {
  combat?: Combat | null
  deckUnit: DeckUnitDbObject
  game: GameDbObject
  logPrefix: string
  unit: UnitDbObject
}
