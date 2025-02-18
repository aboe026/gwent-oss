import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { Deck, FactionKey, MutationAddDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import { DeckAddedPayload } from '../subscription-resolver'
import { DeckDbObject } from '@gwent/graphql-schema/database-typings'
import DeckResolver from '../types/deck-resolver'
import DeckStore from '../../../database/stores/deck-store'
import DeckUnitResolver from '../types/deck-unit-resolver'
import EventManager from '../../event-manager'
import FactionResolver from '../types/faction-resolver'
import FactionStore from '../../../database/stores/faction-store'
import { getDeckStats } from '@gwent/utils'
import { GraphQLResolveInfo } from 'graphql'
import LeaderResolver from '../types/leader-resolver'
import LeaderStore from '../../../database/stores/leader-store'
import PresentableError from '../../../util/presentable-error'
import { PubSubEvents } from '@gwent/constants'
import ResolverUtil from '../resolver-util'
import UnitStore from '../../../database/stores/unit-store'
import { validateDeck } from '@gwent/validators'

/**
 * A class for executing the addDeck GraphQL Mutation.
 */
export default class AddDeckMutation {
  private static logger = getLogger('AddDeckMutation')

  /**
   * Add a Deck for a user.
   *
   * @param args The arguments for adding a deck.
   * @param context The session containing the user adding the deck.
   * @param info The information about the GraphQL request.
   * @returns The Deck that was added.
   * @throws PresentableError if problem adding deck.
   */
  static async addDeck(args: MutationAddDeckArgs, context: Context, info: GraphQLResolveInfo): Promise<Deck> {
    const resolverUtil = new ResolverUtil({
      logger: AddDeckMutation.logger,
    })

    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'addDeck mutation',
    })

    const logPrefix = `addDeck by "${userId}"`
    resolverUtil.setLogPrefix(logPrefix)
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
      AddDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
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
      AddDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const units = await UnitStore.get({
      ids: unitsInput.map((unit) => unit.id),
    })
    if (AddDeckMutation.logger.isTraceEnabled()) {
      AddDeckMutation.logger.trace(`${logPrefix} units: "${JSON.stringify(units)}"`)
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
      AddDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
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
    if (AddDeckMutation.logger.isTraceEnabled()) {
      AddDeckMutation.logger.trace(`${logPrefix} deckUnits: "${JSON.stringify(deckUnits)}"`)
    }
    errors = validateDeck({
      deckUnits: deckUnits,
      faction: factionKey,
    })
    if (errors.length > 0) {
      const message = errors.join('\n')
      AddDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    let deck: DeckDbObject
    try {
      deck = await DeckStore.add({
        factionId: faction._id,
        leaderId: leaderId,
        name: name,
        stats: getDeckStats(deckUnits),
        units: deckUnits.map((deckUnit) => {
          return {
            unit: deckUnit.unit.id,
            artStyle: deckUnit.artStyle,
          }
        }),
        userId,
      })
    } catch (err: unknown) {
      if (err instanceof Error && err.message === `Deck with name "${name}" already exists for user "${userId}"`) {
        const message = `Deck with name "${name}" already exists.` // exclude user ID for security
        AddDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }
      AddDeckMutation.logger.error(Error(`${logPrefix} failed: ${err}`))
      throw err
    }
    if (AddDeckMutation.logger.isTraceEnabled()) {
      AddDeckMutation.logger.trace(`${logPrefix} deck: "${JSON.stringify(deck)}"`)
    }
    const resolvedFaction = await FactionResolver.fromObject({
      faction: faction,
    })
    if (AddDeckMutation.logger.isTraceEnabled()) {
      AddDeckMutation.logger.trace(`${logPrefix} resolvedFaction: "${JSON.stringify(resolvedFaction)}"`)
    }
    const resolvedDeck = await DeckResolver.fromObject({
      deck,
      faction: resolvedFaction,
      leader: await LeaderResolver.fromObject({
        leader,
        faction: resolvedFaction,
      }),
      units: deckUnits,
    })

    EventManager.pubsub.publish(PubSubEvents.DeckAdded, {
      deckAdded: resolvedDeck,
    } as DeckAddedPayload)

    return resolvedDeck
  }
}
