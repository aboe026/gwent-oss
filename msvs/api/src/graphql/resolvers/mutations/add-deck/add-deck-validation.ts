import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { DeckUnit, FactionDbObject, LeaderDbObject } from '@gwent/graphql-schema/database-typings'
import DeckUnitResolver from '../../types/deck-unit-resolver'
import { FactionKey, MutationAddDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import FactionStore from '../../../../database/stores/faction-store'
import { GraphQLResolveInfo } from 'graphql'
import LeaderStore from '../../../../database/stores/leader-store'
import Permissions from '../../../permissions'
import PresentableError from '../../../../util/presentable-error'
import ResolverUtil from '../../resolver-util'
import UnitStore from '../../../../database/stores/unit-store'
import { ValidateDeck } from '@gwent/validators'

/**
 * A class for validating the addDeck GraphQL Mutation.
 */
export default class AddDeckValidation {
  private static logger = getLogger('AddDeckValidation')

  /**
   * Validates the inputs for adding a new deck.
   *
   * @param args The arguments for adding a deck.
   * @param context The session containing the user adding the deck.
   * @param info The information about the GraphQL request.
   * @returns The information needed to add the deck.
   * @throws {PresentableError} if known problem adding deck.
   */
  static async addDeckValidation(
    args: MutationAddDeckArgs,
    context: Context,
    info: GraphQLResolveInfo
  ): Promise<ValidatedAddDeck> {
    const { _id: userId } = Permissions.isAuthenticated({
      context,
      label: 'addDeck mutation',
    })

    const logPrefix = `addDeck by "${userId}"`
    const resolverUtil = new ResolverUtil({
      logger: AddDeckValidation.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    const name = args.name
    const factionKey = args.faction
    const leaderId = args.leader
    const unitsInput = args.units

    resolverUtil.verifyMongoIds({
      ids: [leaderId],
      label: 'Leader ID',
    })
    resolverUtil.verifyMongoIds({
      ids: unitsInput.map((unitInput) => unitInput.id),
      label: 'Unit ID',
    })

    if (factionKey === FactionKey.Neutral) {
      const message = `Faction "${FactionKey.Neutral}" not allowed.`
      AddDeckValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const faction = await FactionStore.getByKey({
      key: factionKey,
      logPrefix,
    })
    const leader = await LeaderStore.getById({
      id: leaderId,
      logPrefix,
    })

    if (leader.faction.toString() !== faction._id.toString()) {
      const message = `Faction ID "${leader.faction}" for leader "${leaderId}" does not match deck faction ID "${faction._id}".`
      AddDeckValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const units = await UnitStore.get({
      ids: unitsInput.map((unit) => unit.id),
    })
    if (AddDeckValidation.logger.isTraceEnabled()) {
      AddDeckValidation.logger.trace(`${logPrefix} units: "${JSON.stringify(units)}"`)
    }
    let errors: string[] = []
    for (const unitInput of unitsInput) {
      const dbUnit = units.find((dbUnit) => dbUnit._id.toString() === unitInput.id)
      if (!dbUnit) {
        errors.push(`Unit with ID "${unitInput.id}" does not exist.`)
      }
    }
    if (errors.length > 0) {
      const message = errors.join('\n')
      AddDeckValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    const deckUnits = await DeckUnitResolver.fromArray({
      deckUnits: unitsInput.map((unit) => {
        return {
          artStyle: unit.artStyle === undefined || unit.artStyle === null ? 1 : unit.artStyle,
          unit: new ObjectId(unit.id),
        }
      }),
    })
    if (AddDeckValidation.logger.isTraceEnabled()) {
      AddDeckValidation.logger.trace(`${logPrefix} deckUnits: "${JSON.stringify(deckUnits)}"`)
    }
    errors = ValidateDeck.fromDeckUnits({
      deckUnits: deckUnits,
      faction: factionKey,
    })
    if (errors.length > 0) {
      const message = errors.join('\n')
      AddDeckValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    return {
      deckUnits,
      faction,
      leader,
      logPrefix,
      name,
      userId,
    }
  }
}

export interface ValidatedAddDeck {
  deckUnits: DeckUnit[]
  faction: FactionDbObject
  leader: LeaderDbObject
  logPrefix: string
  name: string
  userId: ObjectId
}
