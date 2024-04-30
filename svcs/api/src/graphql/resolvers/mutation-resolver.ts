import {
  Combat,
  DeckCard,
  Dlc,
  Effect,
  Faction,
  FactionKey,
  MutationResolvers,
} from '@gwent/graphql-schema/resolver-typings'
import DeckStore from '../../database/stores/deck-store'
import FactionStore from '../../database/stores/faction-store'
import { getDeckStats } from '@gwent/utils'
import LeaderStore from '../../database/stores/leader-store'
import { resolveEffects } from './resolver-util'
import UnitStore from '../../database/stores/unit-store'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserStore from '../../database/stores/user-store'
import { validateDeck } from '@gwent/validators'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MutationResolver: MutationResolvers<any, any> = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addDeck: async (parent, args, context, info) => {
    if (args.faction === FactionKey.Neutral) {
      return Error(`Cannot create Deck with "${FactionKey.Neutral}" faction.`)
    }
    const factions = await FactionStore.get({})
    const factionMap: {
      [x: string]: Faction
    } = {}
    for (const faction of factions) {
      factionMap[faction._id.toString()] = faction as any as Faction // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const faction = factions.find((faction) => faction.key === args.faction)
    if (!faction) {
      return Error(`Faction with key "${args.faction}" not found.`)
    }
    const leaders = await LeaderStore.get({
      ids: [args.leader],
    })
    if (!leaders || leaders.length === 0) {
      return Error(`Invalid leader ID "${args.leader}": Does not exist.`)
    }
    const leaderFaction = factionMap[leaders[0].faction.toString()]
    if (leaderFaction.key !== args.faction) {
      return Error(
        `Invalid leader ID "${args.leader}": Faction "${leaderFaction.key}" does not match deck faction of "${args.faction}".`
      )
    }
    const units = await UnitStore.get({
      ids: args.units.map((card) => card.id),
    })
    let errors: string[] = []
    const cards: DeckCard[] = []
    for (const unit of args.units) {
      const dbUnit = units.find((dbUnit) => dbUnit._id.toString() === unit.id)
      if (!dbUnit) {
        errors.push(`Invalid unit ID "${unit.id}": Does not exist.`)
      } else {
        cards.push({
          artStyle: unit.artStyle === undefined || unit.artStyle === null ? 1 : unit.artStyle,
          unit: {
            id: unit.id,
            ...dbUnit,
            combats: dbUnit.combats as Combat[] | undefined,
            dlc: dbUnit.dlc as Dlc | undefined,
            effects: (await resolveEffects(dbUnit)) as any as Effect[], // eslint-disable-line @typescript-eslint/no-explicit-any
            scorchScope: dbUnit.scorchScope as Combat | undefined,
            faction: factionMap[dbUnit.faction.toString()],
          },
        })
      }
    }
    if (errors.length > 0) {
      return Error(errors.join('\n')) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    errors = validateDeck({
      cards,
      faction: args.faction,
    })
    if (errors.length > 0) {
      return Error(errors.join('\n')) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const userId = context.session.user._id
    try {
      return await DeckStore.add({
        factionId: faction?._id,
        leaderId: args.leader,
        name: args.name,
        stats: getDeckStats(cards),
        units: cards.map((card) => {
          return {
            id: card.unit.id,
            artStyle: card.artStyle,
          }
        }),
        userId,
      })
    } catch (err: unknown) {
      if (err instanceof Error && err.message === `Deck with name "${args.name}" already exists for user "${userId}"`) {
        // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
        err.message = `Deck with name "${args.name}" already exists` // exclude user ID for security
        return err as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      throw err
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addUser: async (parent, args, context, info) => {
    try {
      return await UserStore.add(args.name, args.password)
    } catch (err: unknown) {
      if (err instanceof Error && err.message === `User "${args.name}" already exists`) {
        // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
        return err as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      throw err
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  login: async (parent, args, context, info) => {
    let user: UserDbObject
    try {
      user = await UserStore.validate(args.name, args.password)
    } catch (err: unknown) {
      if (err instanceof Error && err.message === `Invalid credentials for user "${args.name}"`) {
        // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
        return err as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      throw err
    }
    if (!context) {
      context = {
        session: {
          user,
        },
      }
    } else if (!context.session) {
      context.session = {
        user,
      }
    } else {
      context.session.user = user
    }
    return user
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logout: (parent, args, context, info) => {
    if (context?.session?.user) {
      delete context.session.user
      return true
    }
    return false
  },
}

export default MutationResolver
