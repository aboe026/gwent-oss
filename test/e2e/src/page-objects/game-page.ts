import { ObjectId } from 'mongodb'
import { Selector, t } from 'testcafe'

import { Deck, Faction, UnitStats } from '@gwent/graphql-schema/resolver-typings'
import DeckList from '../components/deck-list'
import E2eUtil from '../util/e2e-util'
import GamePlayerInfo from '../components/game-player-info'
import { HTML_CLASSES, HTML_IDS, MAX_REDRAWS, ROUTES } from '@gwent/constants'
import { Leader } from '@gwent/graphql-schema/resolver-typings'

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
  }: {
    name: string
    losses?: number
    score?: number
    faction?: Faction
    leader?: Leader
    undrawn?: number
    hand?: number
    discards?: number
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
    selfReady,
    opponentReady,
    redraws,
  }: {
    selfReady?: boolean
    opponentReady?: boolean
    redraws?: {
      from: string
      to: string
    }[]
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
    } else {
      await t.expect(GamePage.elements.SetDeck.exists).ok()
      await t.expect(GamePage.elements.SetDeck.visible).ok()
    }
  }

  static async verify({
    self,
    opponent,
    hand,
    redraws,
  }: {
    self: GamePlayerExpected
    opponent: GamePlayerExpected
    hand?: string[]
    redraws?: Redraws[]
  }) {
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
    })
    await GamePage.verifyHand({
      names: hand,
    })
    await GamePage.verifyHistory()
    await GamePage.verifyCenter({
      redraws: !redraws && hand ? [] : redraws,
      opponentReady: opponent.ready,
      selfReady: self.ready,
    })
  }

  static async clickSetDeck() {
    await t.click(GamePage.elements.SetDeck)
  }

  static async setDeck({
    created,
    faction,
    leader,
    name,
    stats,
  }: {
    created: Date | string
    name: string
    faction: Faction
    leader: Leader
    stats: UnitStats
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
      ],
    })
    await DeckList.selectDeckForGame(name)
    await DeckList.verifyNotShown()
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
}

interface GamePlayerExpected {
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
}

interface Redraws {
  from: string
  to: string
}
