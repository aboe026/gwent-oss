import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Combat, MutationPlayUnitArgs } from '@gwent/graphql-schema/resolver-typings'
import { Context } from '@gwent/graphql-schema/context'
import {
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  GameStatus,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import EffectStore from '../../../../database/stores/effect-store'
import GetBattlefieldUnit from './get-battlefield-unit'
import getRoundUnits from './get-round-units'
import { GraphQLResolveInfo } from 'graphql'
import Permissions from '../../../permissions'
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
   * @throws {PresentableError} if known problem playing unit.
   */
  static async playUnitValidation(
    args: MutationPlayUnitArgs,
    context: Context,
    info: GraphQLResolveInfo
  ): Promise<ValidatedPlayUnit> {
    const { _id: userId } = Permissions.isAuthenticated({
      context,
      label: 'playUnit mutation',
    })
    const { game, player } = await Permissions.isGamePlayer({
      gameId: args.game,
      userId,
      label: 'playUnit mutation',
    })
    const unitId = args.unit
    let combat = args.combat
    let targetId = args.target

    const logPrefix = `playUnit by "${userId}" for unit "${unitId}" on game "${game._id}"`
    const resolverUtil = new ResolverUtil({
      logger: PlayUnitValidation.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    resolverUtil.verifyMongoIds({
      ids: [unitId],
      label: 'Unit ID',
    })

    resolverUtil.validateGame({
      game,
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

    let effects: EffectDbObject[] | undefined = undefined
    if (unit.effects) {
      effects = await EffectStore.get({
        ids: unit.effects,
      })
    }
    const isDecoy = effects && effects.some((effect) => effect.key === EffectKey.Decoy)
    const isSpy = effects && effects.some((effect) => effect.key === EffectKey.Spy)
    const isWeather = effects && effects.some((effect) => effect.key === EffectKey.Weather)

    let roundUnits: UnitDbObject[] | undefined = undefined

    if (!isDecoy && !isWeather) {
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
    }

    if (unit.modifier) {
      const round = player.rounds[game.round - 1]
      const row = combat === Combat.Close ? round.close : combat === Combat.Ranged ? round.ranged : round.siege
      if (row.modifier) {
        const message = `Modifier for row "${combat}" already set as unit "${row.modifier.unit}".`
        PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
    }

    if (isDecoy) {
      if (!targetId) {
        const message = `Argument "target" required for units with "${EffectKey.Decoy}" effect.`
        PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }

      resolverUtil.verifyMongoIds({
        ids: [targetId],
        label: 'Target ID',
      })

      const battlefieldUnit = GetBattlefieldUnit.getBattlefieldUnit({
        game,
        unitId: targetId,
        userId,
      })

      if (!battlefieldUnit) {
        const message = `Target "${targetId}" does not exist on the battlefield for player "${userId}".`
        PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }

      roundUnits = await getRoundUnits({
        game,
        unitBeingPlayed: unit,
      })
      const target = roundUnits.find((unit) => unit._id.toString() === targetId)
      if (!target) {
        const message = `Could not find Unit for target "${targetId}".`
        PlayUnitValidation.logger.error(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      if (target.hero) {
        const message = `Invalid decoy target "${targetId}": Cannot be hero.`
        PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      if (target.special) {
        const message = `Invalid decoy target "${targetId}": Cannot be special.`
        PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      if (combat && battlefieldUnit.row !== combat) {
        const message = `Invalid combat "${combat}": Target "${targetId}" is in row "${battlefieldUnit.row}".`
        PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      combat = battlefieldUnit.row
    }

    if (isSpy) {
      const opponents = game.players.filter((player) => player.user.toString() !== userId.toString())
      if (!targetId) {
        if (opponents.length === 1) {
          targetId = opponents[0].user.toString()
        } else {
          const message = `Argument "target" required for units with "${EffectKey.Spy}" effect and game with multiple opponents.`
          PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
          throw new PresentableError(message)
        }
      } else {
        resolverUtil.verifyMongoIds({
          ids: [targetId],
          label: 'Target ID',
        })

        if (targetId === userId.toString()) {
          const message = `Invalid spy target "${targetId}": Cannot be self, must be an opponent.`
          PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
          throw new PresentableError(message)
        }
        const opponent = opponents.find((player) => player.user.toString() === targetId)
        if (!opponent) {
          const message = `Invalid spy target "${targetId}": Could not find that opponent on game.`
          PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
          throw new PresentableError(message)
        }
      }
    }

    if (isWeather) {
      combat = undefined
    }

    return {
      combat,
      deckUnit,
      game,
      logPrefix,
      unit,
      targetId,
      roundUnits,
      effects,
      isDecoy: !!isDecoy,
      isSpy: !!isSpy,
      isWeather: !!isWeather,
      userId,
    }
  }
}

export interface ValidatedPlayUnit {
  combat?: Combat | null
  deckUnit: DeckUnitDbObject
  game: GameDbObject
  logPrefix: string
  unit: UnitDbObject
  targetId: string | undefined | null
  roundUnits?: UnitDbObject[]
  effects?: EffectDbObject[]
  isDecoy: boolean
  isSpy: boolean
  isWeather: boolean
  userId: ObjectId
}
