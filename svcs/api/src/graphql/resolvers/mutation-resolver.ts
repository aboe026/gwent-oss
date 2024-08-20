import log4js from 'log4js'

import { Faction, FactionKey, MutationResolvers, User } from '@gwent/graphql-schema/resolver-typings'
import DeckStore from '../../database/stores/deck-store'
import FactionStore from '../../database/stores/faction-store'
import GameStore from '../../database/stores/game-store'
import { getDeckStats } from '@gwent/utils'
import { getRandomSubset } from '@gwent/utils'
import LeaderStore from '../../database/stores/leader-store'
import UnitStore from '../../database/stores/unit-store'
import { DeckDbObject, GamePlayerDbObject, RedrawDbObject, UserDbObject } from '@gwent/graphql-schema/database-typings'
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

const logger = log4js.getLogger('mutation-resolver')

/**
 * Resolver for GraphQL Mutations
 * which are used to modify data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MutationResolver: MutationResolvers<any, any> = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addDeck: async (parent, args, context, info) => {
    const userId = context.session.user._id
    const name = args.name
    const factionKey = args.faction
    const leaderId = args.leader
    const unitsInput = args.units
    if (factionKey === FactionKey.Neutral) {
      return Error(`Cannot create Deck with "${FactionKey.Neutral}" faction.`)
    }
    const factions = await FactionStore.get({})
    const factionMap: {
      [x: string]: Faction
    } = {}
    for (const faction of factions) {
      factionMap[faction._id.toString()] = faction as any as Faction // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const faction = factions.find((faction) => faction.key === factionKey)
    if (!faction) {
      return Error(`Faction with key "${factionKey}" not found.`)
    }
    const leaders = await LeaderStore.get({
      ids: [leaderId],
    })
    if (!leaders || leaders.length === 0) {
      return Error(`Invalid leader ID "${leaderId}": Does not exist.`)
    }
    const leader = leaders[0]
    const leaderFaction = factionMap[leader.faction.toString()]
    if (leaderFaction.key !== factionKey) {
      return Error(
        `Invalid leader ID "${leaderId}": Faction "${leaderFaction.key}" does not match deck faction of "${factionKey}".`
      )
    }
    const units = await UnitStore.get({
      ids: unitsInput.map((unit) => unit.id),
    })
    let errors: string[] = []
    for (const unitInput of unitsInput) {
      const dbUnit = units.find((dbUnit) => dbUnit._id.toString() === unitInput.id)
      if (!dbUnit) {
        errors.push(`Invalid unit ID "${unitInput.id}": Does not exist.`)
      }
    }
    if (errors.length > 0) {
      return Error(errors.join('\n')) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const deckUnits = await DeckUnitResolver.resolveFromArray({
      deckUnits: unitsInput.map((unit) => {
        return {
          artStyle: unit.artStyle === undefined || unit.artStyle === null ? 1 : unit.artStyle,
          unit: new ObjectId(unit.id),
        }
      }),
      neutralStats: RequestedFields.getArgument(info, 'addDeck.units.unit.faction.stats.neutrals'),
    })
    errors = validateDeck({
      deckUnits: deckUnits,
      faction: factionKey,
    })
    if (errors.length > 0) {
      return Error(errors.join('\n')) as any // eslint-disable-line @typescript-eslint/no-explicit-any
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
        logger.debug(err.message)
        // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
        err.message = `Deck with name "${name}" already exists` // exclude user ID for security
        return err as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      logger.error(err)
      throw err
    }
    const resolvedFaction = await FactionResolver.resolveFromObject({
      faction,
      neutralStats: RequestedFields.getArgument(info, 'addDeck.faction.stats.neutrals'),
    })
    return DeckResolver.resolveFromObject({
      deck,
      faction: resolvedFaction,
      leader: await LeaderResolver.resolveFromObject({
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
    const creatorId = context.session.user._id
    const opponentNames = args.opponentNames.filter((name) => name !== context.session.user.name)
    if (opponentNames.length < PLAYER_COUNTS.Min - 1) {
      logger.debug(`addGame failed for user ${creatorId}": Not enough opponents for game at "${opponentNames.length}".`)
      return Error(
        `Not enough opponents for game at "${opponentNames.length}". Need at least "${PLAYER_COUNTS.Min - 1}" opponent${
          PLAYER_COUNTS.Min - 1 > 1 ? 's' : ''
        }.`
      )
    }
    if (opponentNames.length > PLAYER_COUNTS.Max - 1) {
      logger.debug(
        `addGame failed for user ${creatorId}": Excessive number of opponents for game at "${opponentNames.length}".`
      )
      return Error(
        `Excessive number of opponents for game at "${opponentNames.length}". Cannot have more than "${
          PLAYER_COUNTS.Max - 1
        }" opponent${PLAYER_COUNTS.Max - 1 > 1 ? 's' : ''}.`
      )
    }
    const opponents: User[] = []
    const errors = []
    for (const opponentName of opponentNames) {
      try {
        const user = await UserStore.getByName(opponentName)
        opponents.push(UserResolver.resolveByObject(user))
      } catch (err: unknown) {
        if (err instanceof Error && err.message === `User with name "${opponentName}" does not exist`) {
          logger.debug(`addGame failed for user ${creatorId}": User with name "${opponentName}" does not exist.`)
          // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
          errors.push(err.message)
        } else {
          throw err
        }
      }
    }
    if (errors.length > 0) {
      return Error(errors.join(', ')) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const game = await GameStore.add({
      creatorId,
      opponentIds: opponents.map((opponent) => opponent.id),
    })
    // neutral stats resolving not really needed here (since no decks are set when game initially created)
    // but left in for good measure
    return GameResolver.resolveFromObject({
      game,
      users: opponents,
      neutralFactionStats: RequestedFields.getArgument(info, 'addGame.players.faction.stats.neutrals'),
      neutralLeaderStats: RequestedFields.getArgument(info, 'addGame.players.leader.faction.stats.neutrals'),
    })
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addUser: async (parent, args, context, info) => {
    const name = args.name
    const password = args.password
    try {
      const user = await UserStore.add(name, password)
      return UserResolver.resolveByObject(user)
    } catch (err: unknown) {
      const alreadyExistsMessage = `User "${name}" already exists`
      if (err instanceof Error && err.message === alreadyExistsMessage) {
        logger.error(`Error adding user: ${alreadyExistsMessage}`)
        // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
        return err as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      logger.error(`Error adding user "${name}": ${err}`)
      throw err
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  login: async (parent, args, context, info) => {
    const name = args.name
    const password = args.password
    let user: UserDbObject
    try {
      user = await UserStore.validate(name, password)
    } catch (err: unknown) {
      if (err instanceof Error && err.message === `Invalid credentials for user "${name}"`) {
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
    return UserResolver.resolveByObject(user)
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logout: (parent, args, context, info) => {
    if (context?.session?.user) {
      delete context.session.user
      return true
    }
    return false
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ready: async (parent, args, context, info) => {
    const userId = context.session.user._id
    const gameId = args.game
    const game = await GameStore.getById({
      id: gameId,
    })
    const logPrefix = `Could not set user "${userId}" as ready on game "${gameId}":`
    if (!game) {
      const message = 'Game does not exist.'
      logger.error(`${logPrefix} ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const player: GamePlayerDbObject | undefined = game.players.find(
      (player) => player.user.toString() === userId.toString()
    )
    if (!player) {
      const message = 'Not a player on this game.'
      logger.error(`${logPrefix} ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (!player.deck.from) {
      const message = 'Must set deck first.'
      logger.error(`${logPrefix} ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (player.ready) {
      const message = 'Already marked as ready.'
      logger.error(`${logPrefix} ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const updatedGame = await GameStore.setReady({
      gameId: gameId,
      userId,
    })
    if (!updatedGame) {
      const message = 'Could not set player as ready in probably race condition collision'
      logger.error(`${logPrefix} ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    return GameResolver.resolveFromObject({
      game: updatedGame,
      neutralFactionStats: RequestedFields.getArgument(info, 'ready.players.faction.stats.neutrals'),
      neutralLeaderStats: RequestedFields.getArgument(info, 'ready.players.leader.faction.stats.neutrals'),
    })
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  redraw: async (parent, args, context, info) => {
    const userId = context.session.user._id
    const gameId = args.game
    const unitId = args.unit
    const game = await GameStore.getById({
      id: gameId,
    })
    const logPrefix = `Could not redraw unit "${unitId}" for user "${userId}" on game "${gameId}":`
    if (!game) {
      const message = 'Game does not exist.'
      logger.error(`${logPrefix} ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const player: GamePlayerDbObject | undefined = game.players.find(
      (player) => player.user.toString() === userId.toString()
    )
    if (!player) {
      const message = 'Not a player on this game.'
      logger.error(`${logPrefix} ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (player.ready) {
      const message = 'Cannot redraw after game is marked as ready.'
      logger.error(`${logPrefix} ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (!player.deck.from) {
      const message = 'Cannot redraw before deck is set.'
      logger.error(`${logPrefix} ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (player.deck.redraws.length >= MAX_REDRAWS) {
      const message = `Cannot exceed maximum redraw limit of "${MAX_REDRAWS}".`
      logger.error(`${logPrefix} ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const redrawnIds = player.deck.redraws.map((redraw) => redraw.from.unit.toString())
    const cardToRedraw = player.deck.hand.find((deckUnit) => deckUnit.unit.toString() === unitId)
    if (!cardToRedraw) {
      const message = 'Unit does not exist in hand.'
      logger.error(`${logPrefix} ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    // make sure we don't redraw card that was previously chosen for redraw
    const redrawPool = player.deck.undrawn.filter((deckUnit) => !redrawnIds.includes(deckUnit.unit.toString()))
    const newCard = getRandomSubset({
      items: redrawPool,
      subsetSize: 1,
    })[0]
    const newUndrawn = player.deck.undrawn.filter((deckUnit) => deckUnit.unit.toString() !== newCard.unit.toString())
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

    const updatedGame = await GameStore.redraw({
      currentRedraws: player.deck.redraws,
      gameId: gameId,
      newHand,
      newRedraws,
      newUndrawn,
      userId,
    })

    if (!updatedGame) {
      const message = 'Could not update game with new card in probably race condition collision'
      logger.error(`${logPrefix} ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    return DeckUnitResolver.resolveFromObject({
      deckUnit: newCard,
      neutralStats: RequestedFields.getArgument(info, 'redraw.unit.faction.stats.neutrals'),
    })
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setDeck: async (parent, args, context, info) => {
    const userId = context.session.user._id
    const gameId = args.game
    const deckId = args.deck
    const decks = await DeckStore.getByIds([deckId])
    if (!decks || decks.length === 0) {
      const message = `Deck with ID "${deckId}" does not exist`
      logger.error(message)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (decks.length > 1) {
      const message = `Too many decks at "${decks.length}" with ID "${deckId}"`
      logger.error(`Cannot set deck: ${message}`)
      return Error(message)
    }
    const deck = decks[0]

    const game = await GameStore.getById({
      id: gameId,
    })
    if (!game) {
      const message = `Game with ID "${gameId}" does not exist`
      logger.error(`Cannot set deck: ${message}`)
      return Error(message)
    }

    const player = game.players.find((player) => player.user.toString() === userId.toString())
    if (!player) {
      const message = `User "${userId}" is not a player on game "${gameId}"`
      logger.error(`Cannot set deck: ${message}`)
      return Error(message)
    }
    if (player.deck.from !== null) {
      logger.error(`Cannot set deck: User "${userId}" has already chosen deck "${player.deck.from}"`)
      return Error('Deck already set')
    }

    const hand = getRandomSubset({
      items: deck.units,
      subsetSize: STARTING_HAND_SIZE,
    })
    const handIds = hand.map((deckUnit) => deckUnit.unit.toString())
    const undrawn = deck.units.filter((deckUnit) => !handIds.includes(deckUnit.unit.toString()))

    const updatedGame = await GameStore.setDeck({
      deck,
      gameId: gameId,
      hand,
      undrawn,
      userId,
    })
    if (!updatedGame) {
      logger.error(
        `Could not set deck "${gameId}" on game "${gameId}" for player "${userId}": game updated underneath operation in probable race condition collision`
      )
      return Error(
        `Could not set deck "${deckId}" on game "${gameId}": game updated underneath operation in probable race condition collision`
      ) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const updatedPlayer = updatedGame.players.find((gamePlayer) => gamePlayer.user.toString() === userId.toString())
    if (!updatedPlayer) {
      logger.error(`Could not get player "${userId}" after setting deck on game "${gameId}"`)
      return Error('Could not get player after setting deck on game')
    }
    return GameDeckResolver.resolveFromObject({
      gameDeck: updatedPlayer.deck,
      neutralDeckStats: RequestedFields.getArgument(info, 'setDeck.from.faction.stats.neutrals'),
      neutralLeaderStats: RequestedFields.getArgument(info, 'setDeck.from.leader.faction.stats.neutrals'),
      neutralUnitStats: RequestedFields.getArgument(info, 'setDeck.from.units.unit.faction.stats.neutrals'),
    })
  },
}

export default MutationResolver
