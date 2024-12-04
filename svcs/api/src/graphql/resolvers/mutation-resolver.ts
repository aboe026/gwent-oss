import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import {
  DeckDbObject,
  FactionDbObject,
  GamePlayerDbObject,
  RedrawDbObject,
  UserDbObject,
} from '@gwent/graphql-schema/database-typings'
import DeckResolver from './deck-resolver'
import DeckStore from '../../database/stores/deck-store'
import DeckUnitResolver from './deck-unit-resolver'
import EventManager from './event-manager'
import { FactionKey, Game, MutationResolvers, User } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from './faction-resolver'
import FactionStore from '../../database/stores/faction-store'
import GameDeckResolver from './game-deck-resolver'
import GameResolver from './game-resolver'
import GameStore from '../../database/stores/game-store'
import { getDeckStats, getDuplicateItems, randomizeOrder } from '@gwent/utils'
import { getRandomSubset } from '@gwent/utils'
import LeaderResolver from './leader-resolver'
import LeaderStore from '../../database/stores/leader-store'
import { MAX_REDRAWS, PLAYER_COUNTS, PubSubEvents, STARTING_HAND_SIZE } from '@gwent/constants'
import { RequestedFields } from '@gwent/graphql-schema'
import UnitStore from '../../database/stores/unit-store'
import UserResolver from './user-resolver'
import UserStore from '../../database/stores/user-store'
import { validateDeck } from '@gwent/validators'

/**
 * A class executing the actions of the GraphQL Mutations defined in the schema.
 */
export default class MutationResolver {
  private static logger = getLogger('mutation-resolver')

  /**
   * Get the methods correlating to the GraphQL Mutations defined in the schema.
   *
   * @returns The methods used to resolve Mutations defined in the GraphQL schema.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getResolvers(): MutationResolvers<any, any> {
    return {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      addDeck: async (parent, args, context, info) => {
        const userId = context.session.user._id
        const logPrefix = `addDeck by "${userId}"`
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
          MutationResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          MutationResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
        const name = args.name
        const factionKey = args.faction
        const leaderId = args.leader
        const unitsInput = args.units
        if (factionKey === FactionKey.Neutral) {
          const message = `Cannot create Deck with "${FactionKey.Neutral}" faction.`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        const factions = await FactionStore.get({})
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} factions: "${JSON.stringify(factions)}"`)
        }
        const factionMap: {
          [x: string]: FactionDbObject
        } = {}
        for (const faction of factions) {
          factionMap[faction._id.toString()] = faction
        }
        const faction = factions.find((faction) => faction.key === factionKey)
        if (!faction) {
          const message = `Faction with key "${factionKey}" does not exist.`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        const leaders = await LeaderStore.get({
          ids: [leaderId],
        })
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} leaders: "${JSON.stringify(leaders)}"`)
        }
        if (!leaders || leaders.length === 0) {
          const message = `Leader with ID "${leaderId}" does not exist.`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        const leader = leaders[0]
        const leaderFaction = factionMap[leader.faction.toString()]
        if (leaderFaction.key !== factionKey) {
          const message = `Faction key "${leaderFaction.key}" for leader "${leaderId}" does not match deck faction key "${factionKey}".`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        const units = await UnitStore.get({
          ids: unitsInput.map((unit) => unit.id),
        })
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} units: "${JSON.stringify(units)}"`)
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
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
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
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} deckUnits: "${JSON.stringify(deckUnits)}"`)
        }
        errors = validateDeck({
          deckUnits: deckUnits,
          faction: factionKey,
        })
        if (errors.length > 0) {
          const message = errors.join('\n')
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        let deck: DeckDbObject
        try {
          deck = await DeckStore.add({
            factionId: faction?._id,
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
            MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
            // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
            return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
          }
          MutationResolver.logger.error(Error(`${logPrefix} failed: ${err}`))
          throw err
        }
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} deck: "${JSON.stringify(deck)}"`)
        }
        const resolvedFaction = await FactionResolver.fromObject({
          faction,
          neutralStats: RequestedFields.getArgument(info, 'addDeck.faction.stats.neutrals'),
        })
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} resolvedFaction: "${JSON.stringify(resolvedFaction)}"`)
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
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      addGame: async (parent, args, context, info) => {
        const userId = context.session.user._id
        const creatorName = context.session.user.name
        const logPrefix = `addGame by "${userId}"`
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
          MutationResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          MutationResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
          MutationResolver.logger.trace(`${logPrefix} creator: "${creatorName}"`)
        }
        const opponentNames = args.opponentNames
        const duplicateNames = getDuplicateItems(opponentNames)
        if (duplicateNames.length > 0) {
          const message = `Invalid opponents: names ${JSON.stringify(duplicateNames)} are duplicates.`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (opponentNames.includes(creatorName)) {
          const message = 'Invalid opponents: cannot include self.'
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (opponentNames.length < PLAYER_COUNTS.Min - 1) {
          const message = `Not enough opponents for game at "${opponentNames.length}", minimum is "${
            PLAYER_COUNTS.Min - 1
          }".`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (opponentNames.length > PLAYER_COUNTS.Max - 1) {
          const message = `Excessive opponents for game at "${opponentNames.length}", maximum is "${
            PLAYER_COUNTS.Max - 1
          }".`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        const opponents = await UserStore.getByNames(opponentNames)
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} opponents: "${JSON.stringify(opponents)}"`)
        }
        const resolvedOpponents: User[] = []
        const errors = []
        for (const opponentName of opponentNames) {
          const opponent = opponents.find((opponent) => opponent.name === opponentName)
          if (!opponent) {
            errors.push(`User with name "${opponentName}" does not exist`)
          } else {
            resolvedOpponents.push(UserResolver.fromObject(opponent))
          }
        }
        if (errors.length > 0) {
          const message = `${errors.join(',')}.`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} resolvedOpponents: "${JSON.stringify(resolvedOpponents)}"`)
        }
        const game = await GameStore.add({
          creatorId: userId,
          opponentIds: resolvedOpponents.map((opponent) => opponent.id),
        })
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} game: "${JSON.stringify(game)}"`)
        }
        // neutral stats resolving not really needed here (since no decks are set when game initially created)
        // but left in for good measure
        const resolvedGame = await GameResolver.fromObject({
          game,
          users: resolvedOpponents,
          neutralFactionStats: RequestedFields.getArgument(info, 'addGame.players.faction.stats.neutrals'),
          neutralLeaderStats: RequestedFields.getArgument(info, 'addGame.players.leader.faction.stats.neutrals'),
        })

        EventManager.pubsub.publish(PubSubEvents.GameAdded, {
          gameAdded: resolvedGame,
        })

        return resolvedGame
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      addUser: async (parent, args, context, info) => {
        const name = args.name
        const password = args.password
        const logPrefix = `addUser for user "${name}"`
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          MutationResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
        try {
          const user = await UserStore.add(name, password)
          if (MutationResolver.logger.isTraceEnabled()) {
            MutationResolver.logger.trace(`${logPrefix} user: "${JSON.stringify(user)}"`)
          }
          return UserResolver.fromObject(user)
        } catch (err: unknown) {
          const alreadyExistsMessage = `User with name "${name}" already exists.`
          if (err instanceof Error && err.message === alreadyExistsMessage) {
            MutationResolver.logger.debug(`${logPrefix} failed: ${alreadyExistsMessage}`)
            // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
            return Error(alreadyExistsMessage) as any // eslint-disable-line @typescript-eslint/no-explicit-any
          }
          MutationResolver.logger.error(Error(`${logPrefix} failed: ${err}`))
          throw err
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      login: async (parent, args, context, info) => {
        const name = args.name
        const password = args.password
        const logPrefix = `login for user "${name}"`
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          MutationResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
        let user: UserDbObject
        try {
          user = await UserStore.validate(name, password)
          if (MutationResolver.logger.isTraceEnabled()) {
            MutationResolver.logger.trace(`${logPrefix} user: "${JSON.stringify(user)}"`)
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.message === `Invalid credentials for user "${name}"`) {
            const message = `Invalid credentials for user "${name}".`
            MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
            // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
            return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
          }
          MutationResolver.logger.error(Error(`${logPrefix} failed: ${err}`))
          throw err
        }
        if (!context) {
          MutationResolver.logger.trace(`${logPrefix}: context not set, defining.`)
          context = {
            session: {
              user,
            },
          }
        } else if (!context.session) {
          MutationResolver.logger.trace(`${logPrefix}: session not set, defining.`)
          context.session = {
            user,
          }
        } else {
          MutationResolver.logger.trace(`${logPrefix}: setting user on context session.`)
          context.session.user = user
        }
        return UserResolver.fromObject(user)
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      logout: (parent, args, context, info) => {
        const userId = context?.session?.user?._id
        const logPrefix = `logout for user "${userId}"`
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          MutationResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
        if (userId) {
          MutationResolver.logger.debug(`${logPrefix}: removing from session.`)
          delete context.session.user
          return true
        }
        return false
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ready: async (parent, args, context, info) => {
        const userId = context.session.user._id
        const logPrefix = `ready by "${userId}"`
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
          MutationResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          MutationResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
        const gameId = args.game
        const game = await GameStore.getById({
          id: gameId,
        })
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} game: "${JSON.stringify(game)}"`)
        }
        if (!game) {
          const message = `Game with ID "${gameId}" does not exist.`
          MutationResolver.logger.error(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        const player: GamePlayerDbObject | undefined = game.players.find(
          (player) => player.user.toString() === userId.toString()
        )
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} player: "${JSON.stringify(player)}"`)
        }
        if (!player) {
          const message = `Not a player on game "${gameId}".`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (!player.deck.from) {
          const message = `Must set deck on game "${gameId}" first.`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (player.ready) {
          const message = `Game "${gameId}" already marked as ready.`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }

        const updatedGame = await GameStore.setReady({
          gameId,
          userId,
        })
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`)
        }
        if (!updatedGame) {
          const message = `Could not set player as ready for game "${gameId}" in probable race condition collision.`
          MutationResolver.logger.error(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        const resolvedGame = await GameResolver.fromObject({
          game: updatedGame,
          neutralFactionStats: RequestedFields.getArgument(info, 'ready.players.faction.stats.neutrals'),
          neutralLeaderStats: RequestedFields.getArgument(info, 'ready.players.leader.faction.stats.neutrals'),
        })

        EventManager.pubsub.publish(PubSubEvents.GameReady, {
          gameReady: resolvedGame,
        })

        return resolvedGame
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      redraw: async (parent, args, context, info) => {
        const userId = context.session.user._id
        const logPrefix = `redraw by "${userId}"`
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
          MutationResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          MutationResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
        const gameId = args.game
        const unitId = args.unit
        const game = await GameStore.getById({
          id: gameId,
        })
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} game: "${JSON.stringify(game)}"`)
        }
        if (!game) {
          const message = `Game with ID "${gameId}" does not exist.`
          MutationResolver.logger.error(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        const player: GamePlayerDbObject | undefined = game.players.find(
          (player) => player.user.toString() === userId.toString()
        )
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} player: "${JSON.stringify(player)}"`)
        }
        if (!player) {
          const message = `Not a player on game "${gameId}".`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (player.ready) {
          const message = `Cannot redraw after game "${gameId}" is marked as ready.`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (!player.deck.from) {
          const message = `Cannot redraw before deck is set for game "${gameId}".`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (player.deck.redraws.length >= MAX_REDRAWS) {
          const message = `Cannot exceed maximum redraw limit of "${MAX_REDRAWS}" for game "${gameId}".`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        const redrawnIds = player.deck.redraws.map((redraw) => redraw.from.unit.toString())
        const cardToRedraw = player.deck.hand.find((deckUnit) => deckUnit.unit.toString() === unitId)
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} cardToRedraw: "${JSON.stringify(cardToRedraw)}"`)
        }
        if (!cardToRedraw) {
          const message = `Unit with ID "${unitId}" does not exist in hand for game "${gameId}".`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        // make sure we don't redraw card that was previously chosen for redraw
        const redrawPool = player.deck.undrawn.filter((deckUnit) => !redrawnIds.includes(deckUnit.unit.toString()))
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} redrawPool: "${JSON.stringify(redrawPool)}"`)
        }
        const newCard = getRandomSubset({
          items: redrawPool,
          size: 1,
        })[0]
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} newCard: "${JSON.stringify(newCard)}"`)
        }
        const newUndrawn = player.deck.undrawn.filter(
          (deckUnit) => deckUnit.unit.toString() !== newCard.unit.toString()
        )
        newUndrawn.push(cardToRedraw)
        const newHand = player.deck.hand.filter((deckUnit) => deckUnit.unit.toString() !== unitId)
        newHand.push(newCard)
        const newRedraws: RedrawDbObject[] = [
          ...player.deck.redraws,
          {
            from: cardToRedraw,
            to: newCard,
          },
        ]

        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} newHand: "${JSON.stringify(newHand)}"`)
          MutationResolver.logger.trace(`${logPrefix} newRedraws: "${JSON.stringify(newRedraws)}"`)
          MutationResolver.logger.trace(`${logPrefix} newUndrawn: "${JSON.stringify(newUndrawn)}"`)
        }

        const updatedGame = await GameStore.redraw({
          currentRedraws: player.deck.redraws,
          gameId,
          newHand,
          newRedraws,
          newUndrawn,
          userId,
        })

        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`)
        }
        if (!updatedGame) {
          const message = `Could not redraw unit "${unitId}" on game "${gameId}" in probable race condition collision.`
          MutationResolver.logger.error(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        const resolvedTo = await DeckUnitResolver.fromObject({
          deckUnit: newCard,
          neutralStats: RequestedFields.getArgument(info, 'redraw.unit.faction.stats.neutrals'),
        })
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} resolvedTo: "${JSON.stringify(resolvedTo)}"`)
        }

        const resolvedGame = await GameResolver.fromObject({
          game: updatedGame,
        })
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`)
        }
        const resolvedFrom = await DeckUnitResolver.fromObject({
          deckUnit: cardToRedraw,
        })
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} resolvedFrom: "${JSON.stringify(resolvedFrom)}"`)
        }

        EventManager.pubsub.publish(PubSubEvents.UnitRedrawn, {
          unitRedrawn: {
            from: resolvedFrom,
            game: resolvedGame,
            to: resolvedTo,
            ownerId: userId,
          },
        })

        return resolvedTo
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setDeck: async (parent, args, context, info) => {
        const userId = context.session.user._id
        const logPrefix = `setDeck by "${userId}"`
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
          MutationResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          MutationResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
        const gameId = args.game
        const deckId = args.deck

        const deck = await DeckStore.getById({
          id: deckId,
        })
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} deck: "${JSON.stringify(deck)}"`)
        }
        if (!deck) {
          const message = `Deck with ID "${deckId}" does not exist.`
          MutationResolver.logger.error(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }

        const game = await GameStore.getById({
          id: gameId,
        })
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} game: "${JSON.stringify(game)}"`)
        }
        if (!game) {
          const message = `Game with ID "${gameId}" does not exist.`
          MutationResolver.logger.error(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }

        const player = game.players.find((player) => player.user.toString() === userId.toString())
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} player: "${JSON.stringify(player)}"`)
        }
        if (!player) {
          const message = `Not a player on game "${gameId}".`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (player.deck.from !== null && player.deck.from !== undefined) {
          const message = `Deck already set for game "${gameId}".`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }

        const hand = getRandomSubset({
          items: deck.units,
          size: STARTING_HAND_SIZE,
        })
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} hand: "${JSON.stringify(hand)}"`)
        }
        const handIds = hand.map((deckUnit) => deckUnit.unit.toString())
        const undrawn = deck.units.filter((deckUnit) => !handIds.includes(deckUnit.unit.toString()))
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} undrawn: "${JSON.stringify(undrawn)}"`)
        }

        const updatedGame = await GameStore.setDeck({
          deck,
          gameId,
          hand,
          undrawn,
          userId,
        })

        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`)
        }
        if (!updatedGame) {
          const message = `Could not set deck "${deckId}" on game "${gameId}" in probable race condition collision.`
          MutationResolver.logger.error(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        const updatedPlayer = updatedGame.players.find((gamePlayer) => gamePlayer.user.toString() === userId.toString())
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} updatedPlayer: "${JSON.stringify(updatedPlayer)}"`)
        }
        if (!updatedPlayer) {
          const message = `Could not get player after setting deck "${deckId}" on game "${gameId}".`
          MutationResolver.logger.error(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        const resolvedDeck = await GameDeckResolver.fromObject({
          gameDeck: updatedPlayer.deck,
          neutralDeckStats: RequestedFields.getArgument(info, 'setDeck.from.faction.stats.neutrals'),
          neutralLeaderStats: RequestedFields.getArgument(info, 'setDeck.from.leader.faction.stats.neutrals'),
          neutralUnitStats: RequestedFields.getArgument(info, 'setDeck.from.units.unit.faction.stats.neutrals'),
        })
        const resolvedGame = await GameResolver.fromObject({
          game: updatedGame,
        })
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`)
        }

        EventManager.pubsub.publish(PubSubEvents.DeckSet, {
          deckSet: {
            deck: resolvedDeck,
            game: resolvedGame,
          },
        })

        if (!updatedGame.players.find((player) => !player.deck.from)) {
          // all players have chosen decks, notify clients
          EventManager.pubsub.publish(PubSubEvents.GameSet, {
            gameSet: resolvedGame,
          })
          await MutationResolver.setGameTurnOrder({
            userId,
            gameId,
            logPrefix: `setOrder via ${logPrefix}`,
            allowImplicit: false,
          })
        }

        return resolvedDeck
      },
      setOrder: async (parent, args, context, info) => {
        const userId = context.session.user._id
        const logPrefix = `setOrder by "${userId}"`
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
          MutationResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          MutationResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }

        return MutationResolver.setGameTurnOrder({
          userId,
          gameId: args.game,
          logPrefix,
          userIds: args.users,
          allowImplicit: true,
        })
      },
    }
  }
  private static async setGameTurnOrder({
    userId,
    gameId,
    userIds,
    logPrefix,
    allowImplicit,
  }: {
    userId: string
    gameId: string
    userIds?: string[] | null
    logPrefix: string
    allowImplicit: boolean
  }): Promise<Game> {
    const game = await GameStore.getById({
      id: gameId,
    })
    if (MutationResolver.logger.isTraceEnabled()) {
      MutationResolver.logger.trace(`${logPrefix} game: "${JSON.stringify(game)}"`)
    }
    if (!game) {
      const message = `Game with ID "${gameId}" does not exist.`
      MutationResolver.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const player = game.players.find((player) => player.user.toString() === userId.toString())
    if (MutationResolver.logger.isTraceEnabled()) {
      MutationResolver.logger.trace(`${logPrefix} player: "${JSON.stringify(player)}"`)
    }
    if (!player) {
      const message = `Not a player on game "${gameId}".`
      MutationResolver.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    // cannot set order before all players choose deck
    // because cannot tell if there is only 1 user with ScoiaTael deck
    // (and therefore can choose the order for the game)
    // until all players have chosen decks
    if (game.players.some((player) => !player.deck.from)) {
      const message = `Not all players have chosen decks yet for game "${gameId}".`
      MutationResolver.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    if (game.turn) {
      const message = `Game with ID "${gameId}" already has order set.`
      MutationResolver.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const factions = await FactionStore.get({
      keys: [FactionKey.ScoiaTael],
    })
    if (!factions || factions.length === 0) {
      const message = `Could not find faction with key "${FactionKey.ScoiaTael}".`
      MutationResolver.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    } else if (factions.length > 1) {
      const message = `Found more than 1 faction with key "${FactionKey.ScoiaTael}".`
      MutationResolver.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    } else if (factions[0].key !== FactionKey.ScoiaTael) {
      const message = `Faction key of "${factions[0].key}" does not match "${FactionKey.ScoiaTael}".`
      MutationResolver.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const scoiaTaelId = factions[0]._id.toString()
    const scoiaTaelPlayers = game.players.filter((player) => player.deck.from?.faction.toString() === scoiaTaelId)
    if (scoiaTaelPlayers.length > 1 && userIds && userIds.length > 0) {
      const message = `Cannot set explicit order as more than 1 player has chosen a deck of faction "${FactionKey.ScoiaTael}" for game "${gameId}".`
      MutationResolver.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (scoiaTaelPlayers.length === 0 && userIds && userIds.length > 0) {
      const message = `Cannot set explicit order as deck faction ID "${player.deck.from?.faction}" does not match "${FactionKey.ScoiaTael}" faction ID of "${scoiaTaelId}".`
      MutationResolver.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (scoiaTaelPlayers.length === 1 && (!userIds || userIds.length === 0) && !allowImplicit) {
      const message = `Cannot set order randomly as another player for game "${gameId}" has a deck faction of "${FactionKey.ScoiaTael}" which allows them to set game order.`
      MutationResolver.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (scoiaTaelPlayers.length === 1 && player.deck.from?.faction.toString() !== scoiaTaelId) {
      const message = `Cannot set order as another player for game "${gameId}" has a deck faction of "${FactionKey.ScoiaTael}" which allows them to set game order.`
      MutationResolver.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    if (userIds && userIds.length > 0) {
      const playerIdsInGame = game.players.map((player) => player.user.toString())
      const playersIdsNotInGame: string[] = []
      for (const userId of userIds) {
        if (!playerIdsInGame.includes(userId.toString())) {
          playersIdsNotInGame.push(userId)
        }
      }
      if (playersIdsNotInGame.length > 0) {
        const message = `Cannot set order as users(s) ${JSON.stringify(
          playersIdsNotInGame
        )} are not players on game "${gameId}".`
        MutationResolver.logger.warn(`${logPrefix} failed: ${message}`)
        return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      if (userIds.length !== game.players.length) {
        const message = `Cannot set order as users count of "${userIds.length}" does not match player count of "${game.players.length}" for game "${gameId}".`
        MutationResolver.logger.warn(`${logPrefix} failed: ${message}`)
        return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      const duplicateUserIds = getDuplicateItems<string>(userIds)
      if (duplicateUserIds.length > 0) {
        const message = `Cannot set order for game "${gameId}" due to duplicate user ID(s) ${JSON.stringify(
          duplicateUserIds
        )} specified.`
        MutationResolver.logger.warn(`${logPrefix} failed: ${message}`)
        return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    }

    const updatedGame = await GameStore.setOrder({
      gameId,
      userIds: userIds && userIds.length > 0 ? userIds : randomizeOrder(game.players.map((player) => player.user)),
    })
    if (MutationResolver.logger.isTraceEnabled()) {
      MutationResolver.logger.trace(`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`)
    }
    if (!updatedGame) {
      const message = `Could not set order on game "${gameId}" in probable race condition collision.`
      MutationResolver.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const resolvedGame = await GameResolver.fromObject({
      game: updatedGame,
    })

    EventManager.pubsub.publish(PubSubEvents.OrderSet, {
      orderSet: resolvedGame,
    })

    return resolvedGame
  }
}
