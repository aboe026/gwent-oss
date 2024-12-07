import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { Deck, FactionKey, MutationAddDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import { DeckDbObject, FactionDbObject } from '@gwent/graphql-schema/database-typings'
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
import { NOT_AUTHENTICATED_MESSAGE, PubSubEvents } from '@gwent/constants'
import { RequestedFields } from '@gwent/graphql-schema'
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
   */
  static async addDeck(args: MutationAddDeckArgs, context: Context, info: GraphQLResolveInfo): Promise<Deck> {
    const userId = context.session?.user?._id
    if (!userId) {
      AddDeckMutation.logger.error(`No user on context for addDeck mutation: "${JSON.stringify(context.session)}".`)
      return Error(NOT_AUTHENTICATED_MESSAGE) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const logPrefix = `addDeck by "${userId}"`
    if (AddDeckMutation.logger.isTraceEnabled()) {
      AddDeckMutation.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
      AddDeckMutation.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      AddDeckMutation.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
    const name = args.name
    const factionKey = args.faction
    const leaderId = args.leader
    const unitsInput = args.units
    if (!ObjectId.isValid(leaderId)) {
      const message = `Leader ID "${leaderId}" is not a valid MongoDB ObjectId.`
      AddDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    for (const unitInput of unitsInput) {
      if (!ObjectId.isValid(unitInput.id)) {
        const message = `Unit ID "${unitInput.id}" is not a valid MongoDB ObjectId.`
        AddDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
        return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    }
    if (factionKey === FactionKey.Neutral) {
      const message = `Cannot create Deck with "${FactionKey.Neutral}" faction.`
      AddDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const factions = await FactionStore.get({})
    if (AddDeckMutation.logger.isTraceEnabled()) {
      AddDeckMutation.logger.trace(`${logPrefix} factions: "${JSON.stringify(factions)}"`)
    }
    const factionMap: {
      [x: string]: FactionDbObject
    } = {}
    for (const faction of factions) {
      factionMap[faction._id.toString()] = faction
    }
    const matchedFactions = factions.filter((faction) => faction.key === factionKey)
    if (matchedFactions.length === 0) {
      const message = `Faction with key "${factionKey}" does not exist.`
      AddDeckMutation.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (matchedFactions.length > 1) {
      const message = `Found more than 1 Faction with key "${factionKey}"`
      AddDeckMutation.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(matchedFactions)}"`)
      return Error(`${message}.`) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const faction = matchedFactions[0]
    const leaders = await LeaderStore.get({
      ids: [leaderId],
    })
    if (AddDeckMutation.logger.isTraceEnabled()) {
      AddDeckMutation.logger.trace(`${logPrefix} leaders: "${JSON.stringify(leaders)}"`)
    }
    if (!leaders || leaders.length === 0) {
      const message = `Leader with ID "${leaderId}" does not exist.`
      AddDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (leaders.length > 1) {
      const message = `Found more than 1 Leader with ID "${leaderId}"`
      AddDeckMutation.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(leaders)}"`)
      return Error(`${message}.`) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const leader = leaders[0]
    const leaderFaction = factionMap[leader.faction.toString()]
    if (leaderFaction.key !== factionKey) {
      const message = `Faction key "${leaderFaction.key}" for leader "${leaderId}" does not match deck faction key "${factionKey}".`
      AddDeckMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
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
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const deckUnits = await DeckUnitResolver.fromArray({
      deckUnits: unitsInput.map((unit) => {
        return {
          artStyle: unit.artStyle === undefined || unit.artStyle === null ? 1 : unit.artStyle,
          unit: new ObjectId(unit.id),
        }
      }),
      neutralStats: RequestedFields.getArgument(info, 'addDeck.units.unit.faction.stats.neutrals'),
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
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
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
        // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
        return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      AddDeckMutation.logger.error(Error(`${logPrefix} failed: ${err}`))
      throw err
    }
    if (AddDeckMutation.logger.isTraceEnabled()) {
      AddDeckMutation.logger.trace(`${logPrefix} deck: "${JSON.stringify(deck)}"`)
    }
    const resolvedFaction = await FactionResolver.fromObject({
      faction,
      neutralStats: RequestedFields.getArgument(info, 'addDeck.faction.stats.neutrals'),
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
        neutralStats: RequestedFields.getArgument(info, 'addDeck.leader.faction.stats.neutrals'),
      }),
      units: deckUnits,
      neutralDeckStats: RequestedFields.getArgument(info, 'addDeck.faction.stats.neutrals'),
    })

    EventManager.pubsub.publish(PubSubEvents.DeckAdded, {
      deckAdded: resolvedDeck,
    })

    return resolvedDeck
  }
}
