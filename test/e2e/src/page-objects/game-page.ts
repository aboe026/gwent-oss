import { ObjectId } from 'mongodb'
import { Selector, t } from 'testcafe'

import { Deck, DeckUnit, Faction, UnitStats } from '@gwent/graphql-schema/resolver-typings'
import DeckEditor from '../components/deck-editor'
import DeckList, { DeckInfo } from '../components/deck-list'
import E2eUtil from '../util/e2e-util'
import GamePlayerInfo, { PlayerTurn } from '../components/game-player-info'
import { GAME_ORDER_COIN_FLIP_DURATION_SECONDS, HTML_CLASSES, HTML_IDS, MAX_REDRAWS, ROUTES } from '@gwent/constants'
import { Leader } from '@gwent/graphql-schema/resolver-typings'
import { sortObjectArray } from '@gwent/utils'

const newGameContainer = Selector(`#${HTML_IDS.GameNewContainer}`)
const existingGameContainer = Selector(`#${HTML_IDS.GameContainer}`)
const authErrorContainer = Selector(`#${HTML_IDS.GameAuthErrorContainer}`)

export default class GamePage {
  static elements = {
    NewGameContainer: newGameContainer,
    NewGameCreate: newGameContainer.find(`#${HTML_IDS.GameNewCreate}`),
    NewGameError: newGameContainer.find(`#${HTML_IDS.GameNewError}`),
    NewGameCancel: newGameContainer.find(`#${HTML_IDS.GameNewCancel}`),
    InfoSelfContainer: existingGameContainer.find(`#${HTML_IDS.GameInfoSelfContainer}`),
    InfoOpponentContainer: existingGameContainer.find(`#${HTML_IDS.GameInfoOpponentContainer}`),
    Hand: existingGameContainer.find(`#${HTML_IDS.GameHand}`),
    HandIcon: existingGameContainer.find(`.${HTML_CLASSES.GameHandIcon}`),
    HistoryIcon: existingGameContainer.find(`.${HTML_CLASSES.GameHistoryIcon}`),
    CenterContainer: existingGameContainer.find(`#${HTML_IDS.GameCenterContainer}`),
    SetDeck: existingGameContainer.find(`#${HTML_IDS.GameSetDeck}`),
    Ready: existingGameContainer.find(`#${HTML_IDS.GameReady}`),
    UnitBoard: existingGameContainer.find(`.${HTML_CLASSES.GameUnitBoardSide}`),
    RedrawCard: existingGameContainer.find(`.${HTML_CLASSES.GameDeckRedrawCard}`),
    RedrawAvailable: existingGameContainer.find(`.${HTML_CLASSES.GameDeckRedrawAvailable}`),
    RedrawPair: existingGameContainer.find(`.${HTML_CLASSES.GameDeckRedrawPair}`),
    RedrawInstructions: existingGameContainer.find(`#${HTML_IDS.GameDeckRedrawInstructions}`),
    DeckError: existingGameContainer.find(`#${HTML_IDS.GameDeckError}`),
    RedrawError: existingGameContainer.find(`#${HTML_IDS.GameRedrawError}`),
    ReadyError: existingGameContainer.find(`#${HTML_IDS.GameReadyError}`),
    AuthErrorContainer: authErrorContainer,
    AuthErrorViewGames: authErrorContainer.find(`#${HTML_IDS.GameAuthErrorViewGames}`),
    Refresh: existingGameContainer.find(`#${HTML_IDS.GameRefresh}`),
    OrderContainer: existingGameContainer.find(`#${HTML_IDS.GameOrderContainer}`),
    OrderTable: existingGameContainer.find(`#${HTML_IDS.GameOrderTable}`),
    OrderSet: existingGameContainer.find(`#${HTML_IDS.GameOrderSet}`),
    OrderWaiting: existingGameContainer.find(`#${HTML_IDS.GameOrderWaiting}`),
    CoinTossContainer: existingGameContainer.find(`#${HTML_IDS.GameOrderCoinToss}`),
  }

  static getUrl(gameId?: string): string {
    return E2eUtil.getUrl(ROUTES.Game.path.replace(':gameId', gameId || 'new'))
  }

  static async getPlayerField(index: number) {
    return GamePage.elements.NewGameContainer.find(`#player${index}`)
  }

  static async setOpponents(opponentNames: string[]) {
    for (let i = 0; i < opponentNames.length; i++) {
      await t.typeText(await GamePage.getPlayerField(i + 2), opponentNames[i])
    }
  }

  static async verifyCreator(creatorName: string) {
    await t.expect((await GamePage.getPlayerField(1)).getAttribute('value')).eql(creatorName)
  }

  static async verifyOpponents(opponentNames: string[]) {
    for (let i = 0; i < opponentNames.length; i++) {
      await t.expect((await GamePage.getPlayerField(i + 2)).getAttribute('value')).eql(opponentNames[i])
    }
  }

  static async verifyNew({ creator, opponents }: { creator: string; opponents: string[] }) {
    await GamePage.verifyCreator(creator)
    await GamePage.verifyOpponents(opponents)
  }

  static async clickNewCancel() {
    await t.click(GamePage.elements.NewGameCancel)
  }

  static async createGame({
    creator,
    opponents,
    error,
    verify = true,
  }: {
    creator: string
    opponents: string[]
    error?: string
    verify?: boolean
  }) {
    if (verify) {
      await GamePage.verifyNew({
        creator,
        opponents: [],
      })
    }
    await GamePage.setOpponents(opponents)
    if (verify) {
      await GamePage.verifyNew({
        creator,
        opponents,
      })
    }
    await GamePage.clickCreate()
    if (error) {
      await t.expect(GamePage.elements.NewGameError.innerText).eql(error)
    }
  }

  static async clickCreate() {
    await t.click(GamePage.elements.NewGameCreate)
  }

  static async verifySelf({
    name,
    discards,
    faction,
    hand,
    leader,
    score,
    undrawn,
    losses,
    from,
    turn,
  }: {
    name: string
    losses?: number
    score?: number
    faction?: Faction
    leader?: Leader
    undrawn?: number
    hand?: number
    discards?: number
    from?: Deck | null
    turn?: PlayerTurn
  }) {
    const info = new GamePlayerInfo(GamePage.elements.InfoSelfContainer)
    await info.verify({
      name,
      discards,
      faction,
      hand,
      leader,
      score,
      undrawn,
      losses,
      from,
      turn,
    })
  }

  static async verifyOpponent({
    name,
    discards,
    faction,
    hand,
    leader,
    score,
    undrawn,
    losses,
    turn,
  }: {
    name: string
    losses?: number
    score?: number
    faction?: Faction
    leader?: Leader
    undrawn?: number
    hand?: number
    discards?: number
    turn?: PlayerTurn
  }) {
    const info = new GamePlayerInfo(GamePage.elements.InfoOpponentContainer)
    await info.verify({
      name,
      discards,
      faction,
      hand,
      leader,
      score,
      undrawn,
      losses,
      turn,
    })
  }

  static async getCard(name: string) {
    return GamePage.elements.Hand.find(`.${HTML_CLASSES.UnitGameCardContainer}`).withAttribute('title', name)
  }

  static async verifyHand({ names }: { names?: string[] }) {
    if (names) {
      await t.expect(GamePage.elements.HandIcon.exists).notOk()
      const actualNames: (string | null)[] = []
      for (let i = 0; i < names.length; i++) {
        const card = await GamePage.elements.Hand.child(i)
        actualNames.push(await card.find(`.${HTML_CLASSES.UnitGameCardContainer}`).getAttribute('title'))
      }
      await t.expect(actualNames).eql(names)
    } else {
      await t.expect(GamePage.elements.HandIcon.exists).ok()
      await t.expect(GamePage.elements.HandIcon.visible).ok()
    }
  }

  static async verifyHistory() {
    await t.expect(GamePage.elements.HistoryIcon.exists).ok()
    await t.expect(GamePage.elements.HistoryIcon.visible).ok()
  }

  static async verifyCenter({
    selfSet,
    opponentSet,
    selfReady,
    opponentReady,
    redraws,
    turnOrder,
  }: {
    selfSet?: boolean
    opponentSet?: boolean
    selfReady?: boolean
    opponentReady?: boolean
    redraws?: {
      from: string
      to: string
    }[]
    turnOrder?: string[] | boolean
  }) {
    if (selfReady && opponentReady) {
      await t.expect(GamePage.elements.UnitBoard.exists).ok()
      await t.expect(GamePage.elements.UnitBoard.visible).ok()
      await t.expect(GamePage.elements.UnitBoard.count).eql(2)
    } else if (selfReady && !opponentReady) {
      await t.expect(GamePage.elements.CenterContainer.innerText).eql('Waiting for opponent to be ready...')
    } else if (redraws) {
      await t.expect(GamePage.elements.RedrawPair.count).eql(redraws.length)
      for (let i = 0; i < redraws.length; i++) {
        const pair = await GamePage.elements.RedrawPair.nth(i)
        const from = await pair.find(`.${HTML_CLASSES.UnitGameCardContainer}`).nth(0)
        await t.expect(from.getAttribute('title')).eql(redraws[i].from)
        const to = await pair.find(`.${HTML_CLASSES.UnitGameCardContainer}`).nth(1)
        await t.expect(to.getAttribute('title')).eql(redraws[i].to)
      }
      if (redraws.length < MAX_REDRAWS) {
        await t.expect(GamePage.elements.RedrawCard.exists).ok()
        await t.expect(GamePage.elements.RedrawCard.visible).ok()
        await t.expect(GamePage.elements.RedrawCard.count).eql(MAX_REDRAWS - redraws.length)
      }
      await t
        .expect(GamePage.elements.RedrawInstructions.innerText)
        .eql(
          redraws.length === MAX_REDRAWS
            ? 'All allowed redraws made. To begin the game:'
            : `Optionally select up to ${MAX_REDRAWS - redraws.length} card${
                MAX_REDRAWS - redraws.length === 1 ? '' : 's'
              } from your hand to redraw. When satisfied with deck:`
        )
    } else if (turnOrder !== undefined) {
      await GamePage.verifyOrder({
        turnOrder,
      })
    } else if (selfSet && !opponentSet) {
      await t.expect(GamePage.elements.CenterContainer.innerText).eql('Waiting for opponent to choose deck...')
    } else {
      await t.expect(GamePage.elements.SetDeck.exists).ok()
      await t.expect(GamePage.elements.SetDeck.visible).ok()
    }
  }

  static async verifyOrder({ turnOrder }: { turnOrder: string[] | boolean }) {
    const canSelectOrder = Array.isArray(turnOrder) && turnOrder.length > 0
    const waitingOnOpponent = Array.isArray(turnOrder) && turnOrder.length === 0
    const canSet = typeof turnOrder === 'boolean' && turnOrder
    await t.expect(GamePage.elements.OrderContainer.exists).ok()
    await t.expect(GamePage.elements.OrderContainer.visible).ok()
    await t.expect(GamePage.elements.OrderTable.exists).eql(canSelectOrder)
    await t.expect(GamePage.elements.OrderWaiting.exists).eql(waitingOnOpponent)
    await t.expect(GamePage.elements.OrderSet.exists).eql(canSelectOrder || canSet)
    if (canSelectOrder) {
      await t.expect(GamePage.elements.OrderTable.visible).ok()
      const actualUsernames = []
      const usernamesCount = await GamePage.elements.OrderTable.find(`.${HTML_CLASSES.GameOrderRowUsername}`).count
      for (let i = 0; i < usernamesCount; i++) {
        actualUsernames.push(
          await GamePage.elements.OrderTable.find(`.${HTML_CLASSES.GameOrderRowUsername}`).nth(i).innerText
        )
      }
      await t.expect(actualUsernames).eql(turnOrder)
    } else if (waitingOnOpponent) {
      await t.expect(GamePage.elements.OrderWaiting.visible).ok()
    }
    if (canSelectOrder || canSet) {
      await t.expect(GamePage.elements.OrderSet.visible).ok()
    }
  }

  static async verifyCoinToss({ won, wait = false }: { won: boolean; wait?: boolean }) {
    await t.expect(GamePage.elements.CoinTossContainer.exists).ok()
    await t.expect(GamePage.elements.CoinTossContainer.visible).ok()
    const coinTossResult = GamePage.elements.CoinTossContainer.find(`.${HTML_CLASSES.COIN_FLIP_RESULT_TEXT}`)
    await t.expect(coinTossResult.exists).ok()
    await t.expect(coinTossResult.visible).ok()
    await t.expect(coinTossResult.innerText).eql(won ? 'You will go first' : 'Your opponent will go first')
    if (wait) {
      await t.wait(GAME_ORDER_COIN_FLIP_DURATION_SECONDS * 1000)
    } else {
      await t.click(GamePage.elements.CoinTossContainer)
    }
    await t.expect(GamePage.elements.CoinTossContainer.exists).notOk()
  }

  static async verify({
    self,
    opponent,
    hand,
    redraws,
    turnOrder,
  }: {
    self: GamePlayerExpected
    opponent: GamePlayerExpected
    hand?: string[] | DeckUnit[]
    redraws?: Redraws[]
    turnOrder?: string[] | boolean
  }) {
    let handUnitNames: string[] | undefined = undefined
    if (hand && typeof hand[0] === 'string') {
      handUnitNames = hand as string[]
    } else if (hand) {
      handUnitNames = sortObjectArray({
        sortProperties: ['unit.strength', 'unit.id'],
        array: hand,
      }).map((deckUnit) => (deckUnit as DeckUnit).unit.name) as string[]
    }
    await GamePage.verifySelf({
      name: self.name,
      faction: self.faction,
      leader: self.leader,
      discards: self.discard,
      hand: self.hand,
      undrawn: self.undrawn,
      score: self.score,
      losses: self.losses,
      from: self.from,
      turn: self.turn,
    })
    await GamePage.verifyOpponent({
      name: opponent.name,
      faction: opponent.faction,
      leader: opponent.leader,
      discards: opponent.discard,
      hand: opponent.hand,
      undrawn: opponent.undrawn,
      score: opponent.score,
      losses: opponent.losses,
      turn: opponent.turn,
    })
    await GamePage.verifyHand({
      names: handUnitNames,
    })
    await GamePage.verifyHistory()
    await GamePage.verifyCenter({
      redraws,
      turnOrder,
      opponentReady: opponent.ready,
      selfReady: self.ready,
      selfSet: !!self.from,
      opponentSet: !!opponent.from,
    })
  }

  static async clickSetDeck() {
    await t.click(GamePage.elements.SetDeck)
  }

  static async setNewDeck({
    name,
    faction,
    leader,
    units,
    existingDecks = [],
    verify = true,
  }: {
    name: string
    faction: Faction
    leader: Leader
    units: string[]
    existingDecks?: DeckInfo[]
    verify?: boolean
  }) {
    await t.click(GamePage.elements.SetDeck)
    if (verify) {
      await DeckList.verify({
        decks: existingDecks,
      })
    }
    await DeckList.clickCreate()
    await DeckEditor.createDeck({
      faction,
      leader,
      name,
      units,
      verify,
      verifyRedirect: false,
    })
  }

  static async setDeck({
    created,
    faction,
    leader,
    name,
    stats,
    verifyCloses = false,
    additionalExistingDecks = [],
  }: {
    created: Date | string
    name: string
    faction: Faction
    leader: Leader
    stats: UnitStats
    verifyCloses?: boolean
    additionalExistingDecks?: DeckInfo[]
  }) {
    await t.click(GamePage.elements.SetDeck)
    await DeckList.verify({
      decks: [
        {
          created: new Date(created),
          faction,
          leader,
          name,
          stats,
        },
        ...additionalExistingDecks,
      ],
    })
    await DeckList.selectDeckForGame(name)
    if (verifyCloses) {
      await DeckList.verifyNotShown()
    }
  }

  static async ready() {
    await t.click(GamePage.elements.Ready)
  }

  static async redraw(name: string) {
    const card = await GamePage.elements.Hand.find(`.${HTML_CLASSES.UnitGameCardContainer}`).withAttribute(
      'title',
      name
    )
    await t.expect(card.exists).ok()
    await t.expect(card.visible).ok()
    await t.expect(card.hasClass(HTML_CLASSES.UnitGameCardSelected)).notOk()
    await t.click(card)
    await t.expect(card.hasClass(HTML_CLASSES.UnitGameCardSelected)).ok()
    await t.expect(GamePage.elements.RedrawCard.exists).ok()
    await t.expect(GamePage.elements.RedrawCard.visible).ok()
    await t.expect(GamePage.elements.RedrawCard.hasClass(HTML_CLASSES.GameDeckRedrawAvailable)).ok()
    await t.click(GamePage.elements.RedrawCard)
  }

  static async openFullCard(name: string) {
    const card = await GamePage.getCard(name)
    await t.hover(card.find(`.${HTML_CLASSES.UnitGameCardStrength}`))
    await t.click(card.find(`.${HTML_CLASSES.UnitGameCardFullScreen}`))
  }

  static async verifyDeckError(error: string) {
    await t.expect(GamePage.elements.DeckError.innerText).eql(error)
  }

  static async verifyRedrawError(error: string) {
    await t.expect(GamePage.elements.RedrawError.innerText).eql(error)
  }

  static async verifyReadyError(error: string) {
    await t.expect(GamePage.elements.ReadyError.innerText).eql(error)
  }

  static async verifyAuthError() {
    await t.expect(GamePage.elements.AuthErrorContainer.exists).ok()
    await t.expect(GamePage.elements.AuthErrorContainer.visible).ok()
    await t.expect(GamePage.elements.AuthErrorViewGames.exists).ok()
    await t.expect(GamePage.elements.AuthErrorViewGames.visible).ok()
  }

  static async viewGames() {
    await t.click(GamePage.elements.AuthErrorViewGames)
  }

  static async getIdFromUrl() {
    const url = await E2eUtil.getCurrentUrl()
    const id = url.substring(url.lastIndexOf('/') + 1)
    await t.expect(ObjectId.isValid(id)).ok()
    return id
  }

  static async refresh() {
    await t.click(GamePage.elements.Refresh)
  }

  static async moveTurnOrderEarlier(username: string) {
    const usernameCell = GamePage.elements.OrderTable.find(`.${HTML_CLASSES.GameOrderRowUsername}`).withText(username)
    await t.expect(usernameCell.exists).ok()
    await t.expect(usernameCell.visible).ok()
    await t.click(usernameCell.parent('tr').find(`.${HTML_CLASSES.GameOrderRowEarlier}`))
  }

  static async moveTurnOrderLater(username: string) {
    const usernameCell = GamePage.elements.OrderTable.find(`.${HTML_CLASSES.GameOrderRowUsername}`).withText(username)
    await t.expect(usernameCell.exists).ok()
    await t.expect(usernameCell.visible).ok()
    await t.click(usernameCell.parent('tr').find(`.${HTML_CLASSES.GameOrderRowLater}`))
  }

  static async setOrder() {
    await t.click(GamePage.elements.OrderSet)
  }
}

export interface GamePlayerExpected {
  name: string
  faction?: Faction
  leader?: Leader
  hand?: number
  undrawn?: number
  discard?: number
  score?: number
  losses?: number
  ready?: boolean
  from?: Deck | null
  turn?: PlayerTurn
}

interface Redraws {
  from: string
  to: string
}
