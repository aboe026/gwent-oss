import ApiClient from './api-client'
import {
  BondingExpected,
  E2eHelper,
  MardroemingExpected,
  MoralingExpected,
  MusteringExpected,
  ScorchingExpected,
} from './e2e-helper'
import { Combat, DeckUnit, FactionKey, GameDeck } from '@gwent/node-client'
import E2eUtil from './e2e-util'
import { ensureUnitsInHand, setTurnOrder } from '@gwent/test-utils'
import env from './e2e-env'
import GamePage, {
  GamePlayerExpected,
  HighlightedBattlefieldCard,
  HighlightedHandCard,
  HighlightedHistory,
  HistoryImpactMoves,
  HistoryMove,
  HistoryPass,
  RoundScores,
} from '../page-objects/game-page'
import LoginPage from '../page-objects/login-page'
import { PlayerTurn } from '../components/game-player-info'

export class GameManager {
  public gameId: string
  public self: GameManagerPlayer
  public opponent: GameManagerPlayer
  public moves: (HistoryMove | HistoryPass)[][]
  public shouldVerify: boolean
  public apiDriven: boolean
  public round: number
  public victors?: string[]

  constructor({
    gameId,
    self,
    opponent,
    verify = false,
    apiDriven = true,
  }: {
    gameId: string
    self: GameManagerPlayer
    opponent: GameManagerPlayer
    verify?: boolean
    apiDriven?: boolean
  }) {
    this.gameId = gameId
    this.self = {
      ...self,
      roundScores: [],
    }
    this.opponent = {
      ...opponent,
      roundScores: [],
    }
    this.moves = [[]]
    this.shouldVerify = verify
    this.apiDriven = apiDriven
    this.round = 1
  }

  async initialize({ verify = true, apiDriven = false }: { verify?: boolean; apiDriven?: boolean }) {
    this.shouldVerify = verify
    this.apiDriven = apiDriven
    if (await E2eHelper.isLoggedIn()) {
      await E2eHelper.switchToUser({
        username: this.self.gamePlayer.name,
      })
    } else {
      await E2eUtil.goTo(LoginPage.getUrl())
      await LoginPage.login({
        username: this.self.gamePlayer.name,
      })
    }
    await E2eUtil.goTo(GamePage.getUrl(this.gameId))
    if (verify) {
      await GamePage.verify({
        opponent: this.opponent.gamePlayer,
        self: this.self.gamePlayer,
        hand: this.self.deck.hand,
        moves: this.moves,
        round: this.round,
      })
    }
  }

  async deploy({
    unitName,
    combat,
    effectiveStrength,
    scorching,
    moraling,
    horning,
    mardroeming,
    mustering,
    bonding,
    impacts,
    modifier,
    verify,
  }: {
    unitName: string
    combat?: Combat
    effectiveStrength?: number
    scorching?: ScorchingExpected[]
    moraling?: MoralingExpected[]
    horning?: MoralingExpected[]
    mardroeming?: MardroemingExpected[]
    mustering?: MusteringExpected[]
    bonding?: BondingExpected[]
    impacts?: number
    modifier?: boolean
    verify?: boolean
  }): Promise<DeckUnit> {
    const isSelfTurn = this.self.gamePlayer.turn === PlayerTurn.Current
    const currentPlayer = isSelfTurn ? this.self : this.opponent
    const otherPlayer = isSelfTurn ? this.opponent : this.self

    const unitToMove = currentPlayer.deck.hand.find((unit) => unit.unit.name === unitName)
    if (!unitToMove) {
      throw Error(`Could not find unit "${unitName}" in hand for player "${currentPlayer.gamePlayer.name}"`)
    }
    const combatRow = combat || (unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close)
    if (isSelfTurn && !this.apiDriven) {
      await GamePage.moveUnit({
        unitName: unitToMove.unit.name,
        row: combatRow,
        modifier,
      })
    } else {
      await currentPlayer.client.playUnit({
        gameId: this.gameId,
        unitId: unitToMove.unit.id,
        combat: combatRow,
      })
    }
    E2eHelper.playUnit({
      player: currentPlayer.gamePlayer,
      gameDeck: currentPlayer.deck,
      deckUnit: unitToMove,
      row: combatRow,
      moves: this.moves[this.moves.length - 1],
      switchTurnsWith: otherPlayer.gamePlayer.passed ? currentPlayer.gamePlayer : otherPlayer.gamePlayer,
      effectiveStrength,
      scorching,
      moraling,
      horning,
      mardroeming,
      mustering,
      bonding,
      impacts,
    })
    if (this.shouldVerify || verify) {
      await GamePage.verify({
        opponent: this.opponent.gamePlayer,
        self: this.self.gamePlayer,
        hand: this.self.deck.hand,
        round: this.round,
        moves: this.moves,
      })
    }
    return unitToMove
  }

  async pass({
    verify,
    switchTurnsWith,
    victors,
  }: {
    verify?: boolean
    switchTurnsWith?: GamePlayerExpected
    victors?: string[]
  }) {
    const isSelfTurn = this.self.gamePlayer.turn === PlayerTurn.Current
    const currentPlayer = isSelfTurn ? this.self : this.opponent
    const otherPlayer = isSelfTurn ? this.opponent : this.self
    if (victors) {
      this.victors = victors
    }

    if (isSelfTurn && !this.apiDriven) {
      await GamePage.pass({})
    } else {
      await currentPlayer.client.playPass({
        gameId: this.gameId,
      })
    }
    E2eHelper.playPass({
      player: currentPlayer.gamePlayer,
      round: this.round,
      switchTurnsWith: switchTurnsWith || otherPlayer.gamePlayer,
      moves: this.moves[this.moves.length - 1],
    })

    if (this.self.gamePlayer.passed && this.opponent.gamePlayer.passed) {
      if (this.self.roundScores && this.opponent.roundScores) {
        this.self.roundScores.push(this.self.gamePlayer.score || 0)
        this.opponent.roundScores.push(this.opponent.gamePlayer.score || 0)
      }
      const losers: GamePlayerExpected[] = []
      if (this.self.gamePlayer.score !== undefined && this.opponent.gamePlayer.score !== undefined) {
        if (this.self.gamePlayer.score === this.opponent.gamePlayer.score) {
          losers.push(...[this.self.gamePlayer, this.opponent.gamePlayer])
        } else if (this.self.gamePlayer.score > this.opponent.gamePlayer.score) {
          losers.push(this.opponent.gamePlayer)
        } else {
          losers.push(this.self.gamePlayer)
        }
      }
      E2eHelper.endRound({
        self: this.self.gamePlayer,
        opponent: this.opponent.gamePlayer,
        losers,
        gameOver: !!this.victors,
      })
      if (!this.victors) {
        this.moves.push([])
        this.round++
      }
    }

    if (this.shouldVerify || verify) {
      await GamePage.verify({
        opponent: this.opponent.gamePlayer,
        self: this.self.gamePlayer,
        hand: this.self.deck.hand,
        moves: this.moves,
        round: this.round,
        victors: this.victors,
        rounds: this.getRoundScores(),
      })
    }
  }

  async verify({
    highlightedHandCard,
    highlightedBattlefieldCard,
    highlightedHistory,
  }: {
    highlightedHandCard?: HighlightedHandCard
    highlightedBattlefieldCard?: HighlightedBattlefieldCard
    highlightedHistory?: HighlightedHistory
    impacts?: HistoryImpactMoves[]
  }) {
    await GamePage.verify({
      opponent: this.opponent.gamePlayer,
      self: this.self.gamePlayer,
      hand: this.self.deck.hand,
      moves: this.moves,
      round: this.round,
      victors: this.victors,
      rounds: this.getRoundScores(),
      highlightedHandCard,
      highlightedBattlefieldCard,
      highlightedHistory,
    })
  }

  getHandUnit({ name, opponent }: { name: string; opponent?: boolean }): DeckUnit {
    return E2eHelper.getHandUnit({
      deck: opponent ? this.opponent.deck : this.self.deck,
      name,
    })
  }

  switchPlayers() {
    const self = this.self
    const opponent = this.opponent
    this.self = opponent
    this.opponent = self
  }

  private getRoundScores(): RoundScores[] {
    const roundScores: RoundScores[] = []
    if (this.victors && this.self.roundScores && this.opponent.roundScores) {
      for (let i = 0; i < this.round; i++) {
        roundScores.push({
          creator: this.self.roundScores[i] || 0,
          opponent: this.opponent.roundScores[i] || 0,
        })
      }
    }
    return roundScores
  }
}

export default async function createGameManager({
  label,
  self,
  opponent,
  opponentFirst,
}: {
  label: string
  self?: GameManagerSetupPlayer
  opponent?: GameManagerSetupPlayer
  opponentFirst?: boolean
}): Promise<GameManager> {
  const selfUser = await new ApiClient({}).addUser({
    name: `self-${label}`,
  })
  const opponentUser = await new ApiClient({}).addUser({
    name: `opponent-${label}`,
  })
  const selfClient = new ApiClient({
    username: selfUser.name,
  })
  const opponentClient = new ApiClient({
    username: opponentUser.name,
  })

  const game = await selfClient.addGame([opponentUser.name])

  const selfFaction = self?.faction
    ? self.faction
    : opponent?.faction === FactionKey.ScoiaTael
      ? FactionKey.NorthernRealms
      : FactionKey.ScoiaTael
  const opponentFaction = opponent?.faction
    ? opponent.faction
    : selfFaction === FactionKey.ScoiaTael
      ? FactionKey.NorthernRealms
      : FactionKey.ScoiaTael
  const selfDeck = await selfClient.addDeck({
    faction: selfFaction,
    leaderName: self?.leader || getDefaultLeaderName(selfFaction),
    name: `self-deck-${label}`,
    unitNames: await E2eHelper.getUnitsForDeck({
      client: selfClient,
      faction: selfFaction,
      specials: [...(self?.specialUnitNames || []), ...(self?.handUnitNames || [])],
      ignores: self?.ignoreUnitNames,
    }),
  })
  const opponentDeck = await opponentClient.addDeck({
    faction: opponentFaction,
    leaderName: opponent?.leader || getDefaultLeaderName(opponentFaction),
    name: `opponent-deck-${label}`,
    unitNames: await E2eHelper.getUnitsForDeck({
      client: opponentClient,
      faction: opponentFaction,
      specials: [...(opponent?.specialUnitNames || []), ...(opponent?.handUnitNames || [])],
      ignores: opponent?.ignoreUnitNames,
    }),
  })

  await selfClient.setDeck({
    deckId: selfDeck.id,
    gameId: game.id,
  })
  await opponentClient.setDeck({
    deckId: opponentDeck.id,
    gameId: game.id,
  })

  const firstPlayerId = opponentFirst ? opponentUser.id : selfUser.id
  const secondPlayerId = opponentFirst ? selfUser.id : opponentUser.id
  if (
    (selfFaction === FactionKey.ScoiaTael && opponentFaction !== FactionKey.ScoiaTael) ||
    (opponentFaction === FactionKey.ScoiaTael && selfFaction !== FactionKey.ScoiaTael)
  ) {
    const scoiataelClient = selfFaction === FactionKey.ScoiaTael ? selfClient : opponentClient
    await scoiataelClient.setOrder({
      gameId: game.id,
      userIds: [firstPlayerId, secondPlayerId],
    })
  } else {
    await setTurnOrder({
      gameId: game.id,
      mongoConnectionString: env.MONGO_URL,
      mongoDatabaseName: env.MONGO_DB,
      userIds: [firstPlayerId, secondPlayerId],
    })
  }

  await selfClient.ready(game.id)
  const updatedGame = await opponentClient.ready(game.id)

  if (self?.handUnitNames) {
    await ensureUnitsInHand({
      gameId: game.id,
      mongoConnectionString: env.MONGO_URL,
      mongoDatabaseName: env.MONGO_DB,
      unitNames: self.handUnitNames,
      userId: selfUser.id,
      excludeNames: self.excludeHandUnitNames,
    })
  }
  if (opponent?.handUnitNames) {
    await ensureUnitsInHand({
      gameId: game.id,
      mongoConnectionString: env.MONGO_URL,
      mongoDatabaseName: env.MONGO_DB,
      unitNames: opponent.handUnitNames,
      userId: opponentUser.id,
      excludeNames: opponent.excludeHandUnitNames,
    })
  }

  const selfGameDeck = await selfClient.getGameDeck(game.id)
  const opponentGameDeck = await opponentClient.getGameDeck(game.id)
  return new GameManager({
    gameId: game.id,
    self: {
      client: selfClient,
      deck: selfGameDeck,
      gamePlayer: E2eHelper.getGamePlayer({
        player: {
          user: selfUser,
          client: selfClient,
          deck: selfDeck,
          gameDeck: selfGameDeck,
        },
        turn: updatedGame.turn?.user.id === selfUser.id ? PlayerTurn.Current : undefined,
        ready: true,
        passed: false,
        score: 0,
      }),
    },
    opponent: {
      client: opponentClient,
      deck: opponentGameDeck,
      gamePlayer: E2eHelper.getGamePlayer({
        player: {
          user: opponentUser,
          client: opponentClient,
          deck: opponentDeck,
          gameDeck: opponentGameDeck,
        },
        turn: updatedGame.turn?.user.id === opponentUser.id ? PlayerTurn.Current : undefined,
        ready: true,
        score: 0,
      }),
    },
  })
}

function getDefaultLeaderName(faction: FactionKey): string {
  if (faction === FactionKey.Monsters) {
    return 'Eredin King of the Wild Hunt'
  }
  if (faction === FactionKey.NilfgaardianEmpire) {
    return 'Emhyr var Emreis His Imperial Majesty'
  }
  if (faction === FactionKey.NorthernRealms) {
    return 'Foltest Lord Commander of the North'
  }
  if (faction === FactionKey.ScoiaTael) {
    return 'Francesca Findabair Pureblood Elf'
  }
  if (faction === FactionKey.Skellige) {
    return 'Crach an Craite'
  }
  throw Error(`Cannot determine leader for invalid faction key "${faction}"`)
}

interface GameManagerSetupPlayer {
  faction: FactionKey
  leader?: string
  specialUnitNames?: string[]
  handUnitNames?: string[]
  ignoreUnitNames?: string[]
  excludeHandUnitNames?: string[]
}

interface GameManagerPlayer {
  gamePlayer: GamePlayerExpected
  deck: GameDeck
  client: ApiClient
  roundScores?: number[]
}
