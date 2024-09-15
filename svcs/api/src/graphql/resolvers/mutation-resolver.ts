import { getLogger } from 'log4js'

import { FactionKey, MutationResolvers, User } from '@gwent/graphql-schema/resolver-typings'
import DeckStore from '../../database/stores/deck-store'
import FactionStore from '../../database/stores/faction-store'
import GameStore from '../../database/stores/game-store'
import { getDeckStats, getUniqueItems } from '@gwent/utils'
import { getRandomSubset } from '@gwent/utils'
import LeaderStore from '../../database/stores/leader-store'
import UnitStore from '../../database/stores/unit-store'
import {
  DeckDbObject,
  FactionDbObject,
  GamePlayerDbObject,
  RedrawDbObject,
  UserDbObject,
} from '@gwent/graphql-schema/database-typings'
import UserStore from '../../database/stores/user-store'
import { validateDeck } from '@gwent/validators'
import { MAX_REDRAWS, PLAYER_COUNTS, STARTING_HAND_SIZE } from '@gwent/constants'
import DeckUnitResolver from './deck-unit-resolver'
import UserResolver from './user-resolver'
import DeckResolver from './deck-resolver'
import FactionResolver from './faction-resolver'
import LeaderResolver from './leader-resolver'
import { ObjectId } from 'mongodb'
import GameResolver from './game-resolver'
import GameDeckResolver from './game-deck-resolver'
import { RequestedFields } from '@gwent/graphql-schema'

export default class MutationResolver {
  private static logger = getLogger('mutation-resolver')

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
          const message = `Faction with key "${factionKey}" not found.`
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
          const message = `Leader "${leaderId}" does not exist.`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        const leader = leaders[0]
        const leaderFaction = factionMap[leader.faction.toString()]
        if (leaderFaction.key !== factionKey) {
          const message = `Leader "${leader._id}" faction "${leaderFaction.key}" does not match deck faction "${factionKey}".`
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
            errors.push(`Unit "${unitInput.id}" does not exist.`)
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
          MutationResolver.logger.debug(`${logPrefix} failed validateDeck: ${message}`)
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
            err.message = message
            // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
            return err as any // eslint-disable-line @typescript-eslint/no-explicit-any
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
        return DeckResolver.fromObject({
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
          MutationResolver.logger.trace(`${logPrefix} creator: "${creatorName}"`)
        }
        const opponentNames = getUniqueItems<string>(args.opponentNames.filter((name) => name !== creatorName))
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} opponentNames: "${JSON.stringify(opponentNames)}"`)
        }
        if (opponentNames.length < PLAYER_COUNTS.Min - 1) {
          const message = `Not enough opponents for game at "${opponentNames.length}", minimum is "${
            PLAYER_COUNTS.Min - 1
          }".`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (opponentNames.length > PLAYER_COUNTS.Max - 1) {
          const message = `Excessive number of opponents for game at "${opponentNames.length}", maximum is "${
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
        return GameResolver.fromObject({
          game,
          users: resolvedOpponents,
          neutralFactionStats: RequestedFields.getArgument(info, 'addGame.players.faction.stats.neutrals'),
          neutralLeaderStats: RequestedFields.getArgument(info, 'addGame.players.leader.faction.stats.neutrals'),
        })
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
        }
        try {
          const user = await UserStore.add(name, password)
          if (MutationResolver.logger.isTraceEnabled()) {
            MutationResolver.logger.trace(`${logPrefix} user: "${JSON.stringify(user)}"`)
          }
          return UserResolver.fromObject(user)
        } catch (err: unknown) {
          const alreadyExistsMessage = `User "${name}" already exists`
          if (err instanceof Error && err.message === alreadyExistsMessage) {
            const message = 'User already exists.'
            MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
            // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
            return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
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
        }
        let user: UserDbObject
        try {
          user = await UserStore.validate(name, password)
          if (MutationResolver.logger.isTraceEnabled()) {
            MutationResolver.logger.trace(`${logPrefix} user: "${JSON.stringify(user)}"`)
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.message === `Invalid credentials for user "${name}"`) {
            MutationResolver.logger.debug(`${logPrefix} failed: ${err.message}`)
            // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
            return err as any // eslint-disable-line @typescript-eslint/no-explicit-any
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
        }
        const gameId = args.game
        const game = await GameStore.getById({
          id: gameId,
        })
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} game: "${JSON.stringify(game)}"`)
        }
        if (!game) {
          const message = `Game "${gameId}" does not exist.`
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
          const message = 'Not a player on game.'
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (!player.deck.from) {
          const message = 'Must set deck first.'
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (player.ready) {
          const message = 'Already marked as ready.'
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
        return GameResolver.fromObject({
          game: updatedGame,
          neutralFactionStats: RequestedFields.getArgument(info, 'ready.players.faction.stats.neutrals'),
          neutralLeaderStats: RequestedFields.getArgument(info, 'ready.players.leader.faction.stats.neutrals'),
        })
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
          const message = `Game "${gameId}" does not exist.`
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
          const message = 'Not a player on game.'
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (player.ready) {
          const message = 'Cannot redraw after game is marked as ready.'
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (!player.deck.from) {
          const message = 'Cannot redraw before deck is set.'
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (player.deck.redraws.length >= MAX_REDRAWS) {
          const message = `Cannot exceed maximum redraw limit of "${MAX_REDRAWS}".`
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        const redrawnIds = player.deck.redraws.map((redraw) => redraw.from.unit.toString())
        const cardToRedraw = player.deck.hand.find((deckUnit) => deckUnit.unit.toString() === unitId)
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} cardToRedraw: "${JSON.stringify(cardToRedraw)}"`)
        }
        if (!cardToRedraw) {
          const message = 'Invalid unit, does not exist in hand.'
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
          subsetSize: 1,
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
          const message = `Could not update game "${gameId}" to redraw unit "${unitId}" in probable race condition collision.`
          MutationResolver.logger.error(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        return DeckUnitResolver.fromObject({
          deckUnit: newCard,
          neutralStats: RequestedFields.getArgument(info, 'redraw.unit.faction.stats.neutrals'),
        })
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
          const message = `Deck "${deckId}" does not exist.`
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
          const message = `Game "${gameId}" does not exist.`
          MutationResolver.logger.error(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }

        const player = game.players.find((player) => player.user.toString() === userId.toString())
        if (MutationResolver.logger.isTraceEnabled()) {
          MutationResolver.logger.trace(`${logPrefix} player: "${JSON.stringify(player)}"`)
        }
        if (!player) {
          const message = 'Not a player on game.'
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (player.deck.from !== null && player.deck.from !== undefined) {
          const message = 'Deck already set.'
          MutationResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }

        const hand = getRandomSubset({
          items: deck.units,
          subsetSize: STARTING_HAND_SIZE,
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
          const message = `Could not update game "${gameId}" in probable race condition collision.`
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
        return GameDeckResolver.fromObject({
          gameDeck: updatedPlayer.deck,
          neutralDeckStats: RequestedFields.getArgument(info, 'setDeck.from.faction.stats.neutrals'),
          neutralLeaderStats: RequestedFields.getArgument(info, 'setDeck.from.leader.faction.stats.neutrals'),
          neutralUnitStats: RequestedFields.getArgument(info, 'setDeck.from.units.unit.faction.stats.neutrals'),
        })
      },
    }
  }
}
