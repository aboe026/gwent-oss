import { Combat, Deck, GameDeck, User } from '@gwent/graphql-schema/resolver-typings'
import ApiClient from './api-client'
import { GamePlayerExpected } from '../page-objects/game-page'
import { STARTING_HAND_SIZE } from '@gwent/constants'
import { PlayerTurn } from '../components/game-player-info'

export interface ContextGamePlayer {
  user: User
  client: ApiClient
  deck: Deck
  gameDeck: GameDeck
}

export class E2eHelper {
  static getGamePlayer({
    player,
    turn,
    ready,
    passed,
    score,
    hand = STARTING_HAND_SIZE,
  }: {
    player: ContextGamePlayer
    turn?: PlayerTurn
    ready?: boolean
    passed?: boolean
    score?: number
    hand?: number
  }): GamePlayerExpected {
    const gamePlayer: GamePlayerExpected = {
      name: player.user.name,
      discard: 0,
      faction: player.deck.faction,
      leader: player.deck.leader,
      hand,
      undrawn: player.deck.units.length - STARTING_HAND_SIZE,
      from: player.deck,
      score,
    }
    if (turn !== undefined) {
      gamePlayer.turn = turn
    }
    if (ready !== undefined) {
      gamePlayer.ready = ready
    }
    if (passed !== undefined) {
      gamePlayer.passed = passed
    }
    return gamePlayer
  }

  static addUnitToGamePlayer({
    player,
    unitName,
    score,
    row,
  }: {
    player: GamePlayerExpected
    unitName: string
    score: number
    row: Combat
  }): void {
    if (row === Combat.Close) {
      player.close = {
        score: (player.close?.score || 0) + score,
        unitNames: [...(player.close?.unitNames || []), unitName],
      }
    } else if (row === Combat.Ranged) {
      player.ranged = {
        score: (player.ranged?.score || 0) + score,
        unitNames: [...(player.ranged?.unitNames || []), unitName],
      }
    } else if (row === Combat.Siege) {
      player.siege = {
        score: (player.siege?.score || 0) + score,
        unitNames: [...(player.siege?.unitNames || []), unitName],
      }
    }
  }

  static resetPlayerCombatRow({ player, row }: { player: GamePlayerExpected; row: Combat }) {
    if (row === Combat.Close) {
      player.close = {
        score: 0,
        unitNames: [],
      }
    } else if (row === Combat.Ranged) {
      player.ranged = {
        score: 0,
        unitNames: [],
      }
    } else if (row === Combat.Siege) {
      player.siege = {
        score: 0,
        unitNames: [],
      }
    }
  }
}
