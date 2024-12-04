import { Deck, GameDeck, User } from '@gwent/graphql-schema/resolver-typings'
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
  }: {
    player: ContextGamePlayer
    turn?: PlayerTurn
    ready?: boolean
  }): GamePlayerExpected {
    const gamePlayer: GamePlayerExpected = {
      name: player.user.name,
      discard: 0,
      faction: player.deck.faction,
      leader: player.deck.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: player.deck.units.length - STARTING_HAND_SIZE,
      from: player.deck,
    }
    if (turn !== undefined) {
      gamePlayer.turn = turn
    }
    if (ready !== undefined) {
      gamePlayer.ready = ready
    }
    return gamePlayer
  }
}
