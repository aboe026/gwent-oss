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
import GetFieldUnits from '../../util/get-field-units'
import getRoundUnits from '../util/get-round-units'
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
    let targetIds = args.targets

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
    const medicEffect = effects && effects.find((effect) => effect.key === EffectKey.Medic)
    const isMedic = !!medicEffect

    let roundUnits: UnitDbObject[] | undefined = undefined
    const unitsToRevive: UnitDbObject[] = []

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
      if (!targetIds) {
        const message = `Argument "targets" required for units with "${EffectKey.Decoy}" effect.`
        PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      if (targetIds.length === 0) {
        const message = `Argument "targets" empty, must have single unit ID for units with "${EffectKey.Decoy}" effect.`
        PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      if (targetIds.length > 1) {
        const message = `Argument "targets" contains multiple entries, must be only 1 unit ID for units with "${EffectKey.Decoy}" effect.`
        PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }

      resolverUtil.verifyMongoIds({
        ids: targetIds,
        label: 'Target ID',
      })
      const targetId = targetIds[0]

      const fieldUnit = GetFieldUnits.getFieldUnit({
        game,
        unitId: targetId,
        userId,
      })

      if (!fieldUnit) {
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
      if (combat && fieldUnit.row !== combat) {
        const message = `Invalid combat "${combat}": Target "${targetId}" is in row "${fieldUnit.row}".`
        PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      combat = fieldUnit.row as Combat
    }

    if (isSpy) {
      let targetId = ''
      const opponents = game.players.filter((player) => player.user.toString() !== userId.toString())
      if (!targetIds) {
        if (opponents.length === 1) {
          targetId = opponents[0].user.toString()
        } else {
          const message = `Argument "target" required for units with "${EffectKey.Spy}" effect and game with multiple opponents.`
          PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
          throw new PresentableError(message)
        }
      } else {
        if (targetIds.length === 0) {
          const message = `Argument "targets" empty, must have single user ID for units with "${EffectKey.Spy}" effect.`
          PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
          throw new PresentableError(message)
        }
        if (targetIds.length > 1) {
          const message = `Argument "targets" contains multiple entries, must be only 1 user ID for units with "${EffectKey.Spy}" effect.`
          PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
          throw new PresentableError(message)
        }

        resolverUtil.verifyMongoIds({
          ids: targetIds,
          label: 'Target ID',
        })

        targetId = targetIds[0]

        if (targetId === userId.toString()) {
          const message = `Invalid spy target "${targetIds}": Cannot be self, must be an opponent.`
          PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
          throw new PresentableError(message)
        }
        const opponent = opponents.find((player) => player.user.toString() === targetId)
        if (!opponent) {
          const message = `Invalid spy target "${targetIds}": Could not find that opponent on game.`
          PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
          throw new PresentableError(message)
        }
      }

      targetIds = [targetId]
    }

    // TODO: break these out into separate methods?
    if (isMedic) {
      const lostUnits = await UnitStore.get({
        ids: player.deck.discard.map((discard) => discard.unit),
      })
      if (targetIds) {
        resolverUtil.verifyMongoIds({
          ids: targetIds,
          label: 'Target ID',
        })
        for (const targetId of targetIds) {
          const targetUnit = lostUnits.find((lostUnit) => lostUnit._id.toString() === targetId)
          if (targetUnit) {
            if (targetUnit.hero) {
              const message = `Invalid target "${targetId}": Cannot revive hero.`
              PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
              throw new PresentableError(message)
            } else if (targetUnit.special) {
              const message = `Invalid target "${targetId}": Cannot revive special.`
              PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
              throw new PresentableError(message)
            }
          } else {
            const message = `Invalid target "${targetId}": Not in Discard pile.`
            PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
            throw new PresentableError(message)
          }
        }
      }
      const revivableUnits = lostUnits.filter((unit) => !unit.special && !unit.hero)
      const reviveAttempts = (targetIds || []).length
      if (reviveAttempts > revivableUnits.length) {
        const message = `Cannot attempt to revive more units (${reviveAttempts}) that are eligible in discard pile (${revivableUnits.length}).`
        PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      console.log(`TEST reviveAttempts: "${reviveAttempts}"`)
      console.log(`TEST targetIds: "${JSON.stringify(targetIds)}"`)
      console.log(`TEST revivableUnits: "${JSON.stringify(revivableUnits)}"`)
      if ((!targetIds || targetIds.length === 0) && revivableUnits.length > 0) {
        const message = `Must specify unit to revive with medic using the "targets" argument.`
        PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }

      if (targetIds) {
        for (let i = 0; i < reviveAttempts; i++) {
          console.log(`TEST i: "${i}"`)
          const targetId = targetIds[i]
          console.log(`TEST targetId: "${targetId}"`)
          const indexToRevive = revivableUnits.findIndex((unit) => unit._id.toString() === targetId)
          if (indexToRevive < 0) {
            const message = `Invalid target "${targetId}": Not an eligible unit in discard pile.`
            PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
            throw new PresentableError(message)
          }
          const unitToRevive = revivableUnits[indexToRevive]
          console.log(`TEST unitToRevive: "${JSON.stringify(unitToRevive)}"`)
          unitsToRevive.push(unitToRevive)
          revivableUnits.splice(indexToRevive, 1)
          const revivedMedic =
            unitToRevive.effects &&
            unitToRevive.effects.some((effect) => effect.toString() === medicEffect._id.toString())
          console.log(`TEST revivedMedic: "${revivedMedic}"`)
          const lastAttempt = i === reviveAttempts - 1
          console.log(`TEST lastAttempt: "${lastAttempt}"`)
          if (!revivedMedic && !lastAttempt) {
            const message = `Invalid target "${targetId}": Lacks Medic effect to revive further units.`
            PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
            throw new PresentableError(message)
          }
          if (revivedMedic && lastAttempt && revivableUnits.length > 0) {
            // reviving another medic, which must revive another card if there are any eligible (can never play medic without reviving units if eligible)
            const message = `Invalid target "${targetId}": Revived medic must revive another eligible unit in discard pile.`
            PlayUnitValidation.logger.warn(`${logPrefix} failed: ${message}`)
            throw new PresentableError(message)
          }
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
      targetIds,
      roundUnits,
      unitsToRevive,
      effects,
      isDecoy: !!isDecoy,
      isSpy: !!isSpy,
      isWeather: !!isWeather,
      isMedic,
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
  targetIds: string[] | undefined | null
  roundUnits?: UnitDbObject[]
  unitsToRevive?: UnitDbObject[]
  effects?: EffectDbObject[]
  isDecoy: boolean
  isSpy: boolean
  isWeather: boolean
  isMedic: boolean
  userId: ObjectId
}
