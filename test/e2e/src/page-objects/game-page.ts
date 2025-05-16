import { ObjectId } from 'mongodb'
import { Selector, t } from 'testcafe'

import { Combat, Deck, DeckUnit, Faction, UnitStats } from '@gwent/graphql-schema/resolver-typings'
import Confirm from '../components/confirm'
import DeckEditor from '../components/deck-editor'
import DeckList, { DeckInfo } from '../components/deck-list'
import E2eUtil from '../util/e2e-util'
import GamePlayerInfo, { PlayerTurn } from '../components/game-player-info'
import { GAME_ORDER_COIN_FLIP_DURATION_SECONDS, HTML_CLASSES, HTML_IDS, MAX_REDRAWS, ROUTES } from '@gwent/constants'
import { Leader } from '@gwent/graphql-schema/resolver-typings'
import { sortObjectArray, toTitleCase } from '@gwent/utils'

const newGameContainer = Selector(`#${HTML_IDS.GameNewContainer}`)
const existingGameContainer = Selector(`#${HTML_IDS.GameContainer}`)
const authErrorContainer = Selector(`#${HTML_IDS.GameAuthErrorContainer}`)
const centerContainer = existingGameContainer.find(`#${HTML_IDS.GameCenterContainer}`)
const historyContainer = existingGameContainer.find(`#${HTML_IDS.GameHistoryContainer}`)

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
    HandNoUnitsLeft: existingGameContainer.find(`#${HTML_IDS.gameHandNoUnitsLeft}`),
    HistoryContainer: historyContainer,
    HistoryIcon: historyContainer.find(`.${HTML_CLASSES.GameHistoryIcon}`),
    HistoryLoading: historyContainer.find(`.${HTML_CLASSES.GameHistoryLoadingContainer}`),
    CenterContainer: centerContainer,
    SetDeck: existingGameContainer.find(`#${HTML_IDS.GameSetDeck}`),
    Ready: existingGameContainer.find(`#${HTML_IDS.GameReady}`),
    Round: existingGameContainer.find(`#${HTML_IDS.GameRound}`),
    UnitBoard: existingGameContainer.find(`.${HTML_CLASSES.GameUnitBoardSide}`),
    RedrawCard: existingGameContainer.find(`.${HTML_CLASSES.GameDeckRedrawCard}`),
    RedrawAvailable: existingGameContainer.find(`.${HTML_CLASSES.ItemHighlighted}`),
    RedrawPair: existingGameContainer.find(`.${HTML_CLASSES.GameDeckRedrawPair}`),
    RedrawInstructions: existingGameContainer.find(`#${HTML_IDS.GameDeckRedrawInstructions}`),
    DeckError: existingGameContainer.find(`#${HTML_IDS.GameDeckError}`),
    OrderError: existingGameContainer.find(`#${HTML_IDS.GameOrderError}`),
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
    Error: Selector(`.${HTML_CLASSES.ErrorText}`),
    Pass: existingGameContainer.find(`#${HTML_IDS.GamePass}`),
    SummaryContainer: existingGameContainer.find(`#${HTML_IDS.GameSummaryContainer}`),
    SummaryVictors: existingGameContainer.find(`#${HTML_IDS.GameSummaryVictorsList}`),
    SummaryRoundBreakdown: existingGameContainer.find(`#${HTML_IDS.GameSummaryRoundBreakdown}`),
    SummaryGames: existingGameContainer.find(`#${HTML_IDS.GameSummaryGames}`),
    BattlefieldOpponent: centerContainer.find(`.${HTML_CLASSES.GameUnitBoardSide}`).nth(0),
    BattlefieldSelf: centerContainer.find(`.${HTML_CLASSES.GameUnitBoardSide}`).nth(1),
    CombatRowCloseSelf: centerContainer.find(`#${HTML_IDS.GameCombatRowCloseSelf}`),
    CombatRowRangedSelf: centerContainer.find(`#${HTML_IDS.GameCombatRowRangedSelf}`),
    CombatRowSiegeSelf: centerContainer.find(`#${HTML_IDS.GameCombatRowSiegeSelf}`),
    CombatRowCloseOpponent: centerContainer.find(`#${HTML_IDS.GameCombatRowCloseOpponent}`),
    CombatRowRangedOpponent: centerContainer.find(`#${HTML_IDS.GameCombatRowRangedOpponent}`),
    CombatRowSiegeOpponent: centerContainer.find(`#${HTML_IDS.GameCombatRowSiegeOpponent}`),
    HistoryError: historyContainer.find(`.${HTML_CLASSES.GameHistoryError}`),
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

  static async verifyMiddle({ round }: { round?: number }) {
    await t.expect(GamePage.elements.Round.exists).eql(!!round)
    if (round) {
      await t.expect(GamePage.elements.Round.visible).ok()
      await t.expect(GamePage.elements.Round.innerText).eql(`Round: ${round}`)
    }
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
    passed,
    allReady,
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
    passed?: boolean
    allReady?: boolean
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
      passed,
      allReady,
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
    passed,
    allReady,
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
    passed?: boolean
    allReady?: boolean
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
      passed,
      allReady,
    })
  }

  static async getHandCard(name: string) {
    return GamePage.elements.Hand.find(`.${HTML_CLASSES.UnitGameCardContainer}`).withAttribute('title', name)
  }

  static async verifyHand({ names, highlightedUnit }: { names?: string[]; highlightedUnit?: HighlightedHandCard }) {
    if (names) {
      await t.expect(GamePage.elements.HandIcon.exists).notOk()
      const actualNames: (string | null)[] = []
      for (let i = 0; i < names.length; i++) {
        const card = await GamePage.elements.Hand.child(i).find(`.${HTML_CLASSES.UnitGameCardContainer}`)
        const cardName = await card.getAttribute('title')
        const isSelected = await card.hasClass(HTML_CLASSES.ItemHighlighted)
        const styles = await card.style
        const isDotted =
          styles['border-bottom-style'] === 'dotted' ||
          styles['border-top-style'] === 'dotted' ||
          styles['border-left-style'] === 'dotted' ||
          styles['border-right-style'] === 'dotted'
        actualNames.push(`${cardName}${isSelected ? ' selected' : ''}${isDotted ? ' dotted' : ''}`)
      }
      const expectedNames = names.map((name) => {
        let expectedName = name
        if (highlightedUnit) {
          if (expectedName === highlightedUnit.unitName) {
            expectedName += ' selected'
            if (highlightedUnit.dotted) {
              expectedName += ' dotted'
            }
          }
        }
        return expectedName
      })
      await t.expect(actualNames).eql(expectedNames)
      if (names.length === 0) {
        await t.expect(GamePage.elements.HandNoUnitsLeft.exists).ok()
        await t.expect(GamePage.elements.HandNoUnitsLeft.visible).ok()
      }
    } else {
      await t.expect(GamePage.elements.HandIcon.exists).ok()
      await t.expect(GamePage.elements.HandIcon.visible).ok()
    }
  }

  static async verifyHistoryUnitInViewport({
    historyItem,
    inViewport,
  }: {
    historyItem: HighlightedHistory
    inViewport: boolean
  }) {
    await t
      .expect(await E2eUtil.isElementInViewport(await (await GamePage.getHistoryUnit(historyItem)).boundingClientRect))
      .eql(inViewport)
  }

  static async verifyHistory({
    moves,
    waiting,
    highlightedMove,
  }: {
    moves?: (HistoryMove | HistoryPass)[][]
    waiting?: boolean
    highlightedMove?: HighlightedHistory
  }) {
    if (moves) {
      const expected: string[] = []
      for (let i = 0; i < moves.length; i++) {
        expected.push(`Round ${i + 1}`)
        for (let j = 0; j < moves[i].length; j++) {
          const move = moves[i][j]
          if ('combatRow' in move) {
            const row = move.unitName === 'Scorch' ? 'to battlefield' : `as ${toTitleCase(move.combatRow)}`
            const description = `${move.userName}: ${move.unitName} deployed ${row}`
            const selected =
              highlightedMove &&
              highlightedMove.playerName === move.userName &&
              highlightedMove.row === move.combatRow &&
              highlightedMove.unitName === move.unitName &&
              highlightedMove.round === i + 1
            const dotted = selected && highlightedMove.dotted
            expected.push(`${description}${selected ? ' selected' : ''}${dotted ? ' dotted' : ''}`)
          } else {
            expected.push(`${move.userName}: Passed the rest of round ${move.round}`)
          }
        }
      }
      const actual: string[] = []
      const rounds = GamePage.elements.HistoryContainer.find(`.${HTML_CLASSES.GameHistoryRoundContainer}`)
      const roundCount = await rounds.count
      for (let i = roundCount - 1; i >= 0; i--) {
        const roundContainer = rounds.nth(i)
        const movesCount = await roundContainer.child().count
        for (let j = 0; j < movesCount; j++) {
          const move = roundContainer.child().nth(j)
          if (j === 0) {
            actual.push(await move.innerText)
          } else {
            const movePlayerName = await move.find(`.${HTML_CLASSES.GameHistoryMoveUsername}`).innerText
            const moveDescription = await move.find(`.${HTML_CLASSES.GameHistoryMoveDescription}`).innerText
            const highlighted = await move.hasClass(HTML_CLASSES.ItemHighlighted)
            const styles = await move.style
            const isDotted =
              styles['border-bottom-style'] === 'dotted' ||
              styles['border-top-style'] === 'dotted' ||
              styles['border-left-style'] === 'dotted' ||
              styles['border-right-style'] === 'dotted'
            actual.push(
              `${movePlayerName}: ${moveDescription}${highlighted ? ' selected' : ''}${isDotted ? ' dotted' : ''}`
            )
          }
        }
      }
      await t.expect(actual).eql(expected)
      await t.expect(GamePage.elements.HistoryLoading.exists).eql(!!waiting)
      if (waiting) {
        await t.expect(GamePage.elements.HistoryLoading.visible).ok()
      }
    } else {
      await t.expect(GamePage.elements.HistoryIcon.exists).ok()
      await t.expect(GamePage.elements.HistoryIcon.visible).ok()
    }
  }

  static async verifyCombatRow({
    rowSelector,
    isSelf,
    rowName,
    score,
    units,
    highlightedBattlefieldCard,
    highlightedHandCard,
  }: {
    rowSelector: Selector
    isSelf: boolean
    rowName: Combat
    score: number
    units: CombatUnit[]
    highlightedBattlefieldCard?: HighlightedBattlefieldCard
    highlightedHandCard?: HighlightedHandCard
  }) {
    await t.expect(rowSelector.exists).ok()
    await t.expect(rowSelector.visible).ok()
    const actualUnitNames: string[] = []
    const rowCards = rowSelector.find(`.${HTML_CLASSES.GameCombatRowCards}`).child()
    const rowCardsCount = await rowCards.count
    for (let i = 0; i < rowCardsCount; i++) {
      const rowCard = rowCards.nth(i).find(`.${HTML_CLASSES.UnitGameCardContainer}`)
      const unitName = (await rowCard.getAttribute('title')) || ''
      const highlighted = await rowCard.hasClass(HTML_CLASSES.ItemHighlighted)
      actualUnitNames.push(`${unitName}${highlighted ? ' selected' : ''}`)
    }
    const expectedUnitNames = sortObjectArray({
      array: units,
      sortProperties: [['effectiveStrength', 'strength'], 'name'],
    }).map((unit) => {
      let expectedUnitName = unit.name
      if (
        highlightedBattlefieldCard &&
        highlightedBattlefieldCard.unitName === unit.name &&
        highlightedBattlefieldCard.row === rowName
      ) {
        expectedUnitName += ' selected'
      }
      return expectedUnitName
    })
    const message = `${rowName} row for ${isSelf ? 'self' : 'opponent'}`
    await t.expect(actualUnitNames).eql(expectedUnitNames, message)
    await t
      .expect(rowSelector.find(`.${HTML_CLASSES.GameUnitBoardCombatScore}`).innerText)
      .eql(score.toString(), message)
    const cardsContainer = rowSelector.find(`.${HTML_CLASSES.GameCombatRowCards}`)
    const expectedHighlighted =
      isSelf && highlightedHandCard && highlightedHandCard.rows && highlightedHandCard.rows.includes(rowName)
    await t.expect(cardsContainer.hasClass(HTML_CLASSES.ItemHighlighted)).eql(expectedHighlighted || false, message)
    const styles = await cardsContainer.style
    const actualDotted =
      styles['border-bottom-style'] === 'dotted' ||
      styles['border-top-style'] === 'dotted' ||
      styles['border-left-style'] === 'dotted' ||
      styles['border-right-style'] === 'dotted'
    const expectedDotted = expectedHighlighted && highlightedHandCard.dotted
    await t.expect(actualDotted).eql(expectedDotted || false, message)
  }

  static async verifyCenter({
    self,
    opponent,
    redraws,
    turnOrder,
    victors,
    rounds = [],
    highlightedBattlefieldCard,
    highlightedHandCard,
  }: {
    self: CenterPlayer
    opponent: CenterPlayer
    redraws?: {
      from: string
      to: string
    }[]
    turnOrder?: string[] | boolean
    victors?: string[]
    rounds?: RoundScores[]
    highlightedBattlefieldCard?: HighlightedBattlefieldCard
    highlightedHandCard?: HighlightedHandCard
  }) {
    if (victors) {
      await t.expect(GamePage.elements.SummaryContainer.exists).ok()
      await t.expect(GamePage.elements.SummaryContainer.visible).ok()
      await t.expect(GamePage.elements.SummaryVictors.exists).ok()
      await t.expect(GamePage.elements.SummaryVictors.visible).ok()
      await t.expect(GamePage.elements.SummaryVictors.innerText).eql(victors.join('\n'))
      const expectedRounds: string[] = []
      for (let i = 0; i < rounds.length; i++) {
        expectedRounds.push(`Round "${i + 1}" self "${rounds[i].creator}" opponent "${rounds[i].opponent}"`)
      }
      const actualRounds: string[] = []
      const selfRow = GamePage.elements.SummaryRoundBreakdown.find(`.${HTML_CLASSES.GameSummaryVictorRow}`).nth(0)
      const selfRounds = selfRow.find(`.${HTML_CLASSES.GameSummaryVictorRound}`)
      const selfRoundsCount = await selfRounds.count
      const opponentRow = GamePage.elements.SummaryRoundBreakdown.find(`.${HTML_CLASSES.GameSummaryVictorRow}`).nth(1)
      const opponentRounds = opponentRow.find(`.${HTML_CLASSES.GameSummaryVictorRound}`)
      const opponentRoundsCount = await opponentRounds.count
      const greaterRowsCount = selfRoundsCount > opponentRoundsCount ? selfRoundsCount : opponentRoundsCount
      for (let i = 0; i < greaterRowsCount; i++) {
        let selfRoundScore = ''
        let opponentRoundScore = ''
        if (i < selfRoundsCount) {
          selfRoundScore = await selfRounds.nth(i).innerText
        }
        if (i < opponentRoundsCount) {
          opponentRoundScore = await opponentRounds.nth(i).innerText
        }
        actualRounds.push(`Round "${i + 1}" self "${selfRoundScore}" opponent "${opponentRoundScore}"`)
      }
      await t.expect(actualRounds).eql(expectedRounds)
      for (let i = 0; i < rounds.length; i++) {
        const round = rounds[i]
        await t.expect(selfRounds.nth(i).hasClass(HTML_CLASSES.GameSummaryRoundWon)).eql(round.creator > round.opponent)
        await t
          .expect(selfRounds.nth(i).hasClass(HTML_CLASSES.GameSummaryRoundLost))
          .eql(round.creator <= round.opponent)
        await t
          .expect(opponentRounds.nth(i).hasClass(HTML_CLASSES.GameSummaryRoundWon))
          .eql(round.opponent > round.creator)
        await t
          .expect(opponentRounds.nth(i).hasClass(HTML_CLASSES.GameSummaryRoundLost))
          .eql(round.opponent <= round.creator)
      }
    } else if (self.ready && opponent.ready) {
      await t.expect(GamePage.elements.BattlefieldSelf.exists).ok()
      await t.expect(GamePage.elements.BattlefieldSelf.visible).ok()
      await t.expect(GamePage.elements.BattlefieldOpponent.exists).ok()
      await t.expect(GamePage.elements.BattlefieldOpponent.visible).ok()
      await t
        .expect(GamePage.elements.BattlefieldSelf.hasClass(HTML_CLASSES.GameUnitBoardSidePassed))
        .eql(!!self.passed)
      await t
        .expect(GamePage.elements.BattlefieldOpponent.hasClass(HTML_CLASSES.GameUnitBoardSidePassed))
        .eql(!!opponent.passed)
      await GamePage.verifyCombatRow({
        rowName: Combat.Close,
        rowSelector: GamePage.elements.CombatRowCloseSelf,
        score: self.close?.score || 0,
        units: self.close?.units || [],
        isSelf: true,
        highlightedBattlefieldCard,
        highlightedHandCard,
      })
      await GamePage.verifyCombatRow({
        rowName: Combat.Ranged,
        rowSelector: GamePage.elements.CombatRowRangedSelf,
        score: self.ranged?.score || 0,
        units: self.ranged?.units || [],
        isSelf: true,
        highlightedBattlefieldCard,
        highlightedHandCard,
      })
      await GamePage.verifyCombatRow({
        rowName: Combat.Siege,
        rowSelector: GamePage.elements.CombatRowSiegeSelf,
        score: self.siege?.score || 0,
        units: self.siege?.units || [],
        isSelf: true,
        highlightedBattlefieldCard,
        highlightedHandCard,
      })
      await GamePage.verifyCombatRow({
        rowName: Combat.Close,
        rowSelector: GamePage.elements.CombatRowCloseOpponent,
        score: opponent.close?.score || 0,
        units: opponent.close?.units || [],
        isSelf: false,
        highlightedBattlefieldCard,
        highlightedHandCard,
      })
      await GamePage.verifyCombatRow({
        rowName: Combat.Ranged,
        rowSelector: GamePage.elements.CombatRowRangedOpponent,
        score: opponent.ranged?.score || 0,
        units: opponent.ranged?.units || [],
        isSelf: false,
        highlightedBattlefieldCard,
        highlightedHandCard,
      })
      await GamePage.verifyCombatRow({
        rowName: Combat.Siege,
        rowSelector: GamePage.elements.CombatRowSiegeOpponent,
        score: opponent.siege?.score || 0,
        units: opponent.siege?.units || [],
        isSelf: false,
        highlightedBattlefieldCard,
        highlightedHandCard,
      })
    } else if (self.ready && !opponent.ready) {
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
    } else if (self.set && !opponent.set) {
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
    moves,
    round = 1,
    victors,
    rounds,
    highlightedHandCard,
    highlightedBattlefieldCard,
    highlightedHistory,
  }: {
    self: GamePlayerExpected
    opponent: GamePlayerExpected
    hand?: string[] | DeckUnit[]
    redraws?: Redraws[]
    turnOrder?: string[] | boolean
    moves?: (HistoryMove | HistoryPass)[][]
    round?: number
    victors?: string[]
    rounds?: RoundScores[]
    highlightedHandCard?: HighlightedHandCard
    highlightedBattlefieldCard?: HighlightedBattlefieldCard
    highlightedHistory?: HighlightedHistory
  }) {
    let handUnitNames: string[] | undefined = undefined
    if (hand && typeof hand[0] === 'string') {
      handUnitNames = hand as string[]
    } else if (hand) {
      handUnitNames = sortObjectArray({
        sortProperties: [['effectiveStrength', 'unit.strength'], 'unit.name', 'unit.id'],
        array: hand,
      }).map((deckUnit) => (deckUnit as DeckUnit).unit.name) as string[]
    }
    await GamePage.verifyMiddle({
      round: !self.ready || !opponent.ready || victors ? undefined : round,
    })
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
      passed: self.passed,
      allReady: self.ready && opponent.ready,
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
      passed: opponent.passed,
      allReady: self.ready && opponent.ready,
    })
    await GamePage.verifyHand({
      names: handUnitNames,
      highlightedUnit: highlightedHandCard,
    })
    await GamePage.verifyHistory({
      moves,
      waiting: opponent.turn === PlayerTurn.Current,
      highlightedMove: highlightedHistory,
    })
    await GamePage.verifyCenter({
      self: {
        ready: self.ready,
        set: !!self.from,
        passed: self.passed,
        close: self.close,
        ranged: self.ranged,
        siege: self.siege,
      },
      opponent: {
        ready: opponent.ready,
        set: !!opponent.from,
        passed: opponent.passed,
        close: opponent.close,
        ranged: opponent.ranged,
        siege: opponent.siege,
      },
      redraws,
      turnOrder,
      victors,
      rounds,
      highlightedBattlefieldCard,
      highlightedHandCard,
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
    neutralFaction,
    verifyCloses = false,
    additionalExistingDecks = [],
  }: {
    created: Date | string
    name: string
    faction: Faction
    leader: Leader
    stats: UnitStats
    neutralFaction: Faction
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
          neutralFaction,
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
    await t.expect(card.hasClass(HTML_CLASSES.ItemHighlighted)).notOk()
    await t.click(card)
    await t.expect(card.hasClass(HTML_CLASSES.ItemHighlighted)).ok()
    await t.expect(GamePage.elements.RedrawCard.exists).ok()
    await t.expect(GamePage.elements.RedrawCard.visible).ok()
    await t.expect(GamePage.elements.RedrawCard.hasClass(HTML_CLASSES.ItemHighlighted)).ok()
    await t.click(GamePage.elements.RedrawCard)
  }

  static async fullscreenHandCard(name: string) {
    const card = await GamePage.getHandCard(name)
    await t.hover(card.find(`.${HTML_CLASSES.UnitGameCardStrength}`))
    await t.click(card.find(`.${HTML_CLASSES.UnitGameCardFullScreen}`))
  }

  static async fullscreenCombatCard({ unitName, row, self }: { unitName: string; row: Combat; self: boolean }) {
    const card = await GamePage.getBattlefieldCard({
      unitName,
      row,
      self,
    })
    await t.hover(card.find(`.${HTML_CLASSES.UnitGameCardStrength}`))
    await t.click(card.find(`.${HTML_CLASSES.UnitGameCardFullScreen}`))
  }

  static async verifyError(error: string) {
    await t.expect(GamePage.elements.Error.innerText).eql(error)
  }

  static async verifyDeckError(error: string) {
    await t.expect(GamePage.elements.DeckError.innerText).eql(error)
  }

  static async verifyOrderError(error: string) {
    await t.expect(GamePage.elements.OrderError.innerText).eql(error)
  }

  static async verifyRedrawError(error: string) {
    await t.expect(GamePage.elements.RedrawError.innerText).eql(error)
  }

  static async verifyReadyError(error: string) {
    await t.expect(GamePage.elements.ReadyError.innerText).eql(error)
  }

  static async verifyHistoryError(error: string) {
    await t.expect(GamePage.elements.HistoryError.innerText).eql(error)
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

  static async pass({ cancel = false }: { cancel?: boolean }) {
    await t.click(GamePage.elements.Pass)
    const confirmDialog = new Confirm(HTML_IDS.GamePassConfirmContainer)
    await t.expect(confirmDialog.elements.Container.exists).ok()
    await t.expect(confirmDialog.elements.Container.visible).ok()
    if (cancel) {
      await confirmDialog.cancel()
    } else {
      await confirmDialog.confirm()
    }
  }

  static async selectHandUnit({ unitName }: { unitName: string }) {
    await t.click(
      GamePage.elements.Hand.find(`.${HTML_CLASSES.UnitGameCardContainer}`)
        .withAttribute('title', unitName)
        .parent(`.${HTML_CLASSES.GameHandCardWrapper}`)
    )
  }

  static async moveUnit({ unitName, row, verify = true }: { unitName: string; row: Combat; verify?: boolean }) {
    const card = GamePage.elements.Hand.find(`.${HTML_CLASSES.UnitGameCardContainer}`).withAttribute('title', unitName)
    const combatRow = GamePage.elements.CenterContainer.find(
      `#${
        row === Combat.Close
          ? HTML_IDS.GameCombatRowCloseSelf
          : row === Combat.Ranged
          ? HTML_IDS.GameCombatRowRangedSelf
          : HTML_IDS.GameCombatRowSiegeSelf
      }`
    ).find(`.${HTML_CLASSES.GameCombatRowCards}`)
    await t.expect(card.hasClass(HTML_CLASSES.ItemHighlighted)).notOk()
    await t.expect(combatRow.hasClass(HTML_CLASSES.ItemHighlighted)).notOk()
    await t.click(card)
    if (verify) {
      await t.expect(card.hasClass(HTML_CLASSES.ItemHighlighted)).ok()
      if (unitName === 'Scorch') {
        await t.expect(GamePage.elements.CenterContainer.hasClass(HTML_CLASSES.ItemHighlighted)).ok()
      } else {
        await t.expect(combatRow.hasClass(HTML_CLASSES.ItemHighlighted)).ok()
      }
    }
    await t.click(combatRow)
  }

  static async summaryGoToGames() {
    await t.click(GamePage.elements.SummaryGames)
  }

  static async getHistoryUnit({ playerName, unitName, row, round }: HighlightedHistory): Promise<Selector> {
    const totalRounds = await GamePage.elements.HistoryContainer.find(`.${HTML_CLASSES.GameHistoryRoundContainer}`)
      .count
    const roundContainer = GamePage.elements.HistoryContainer.find(`.${HTML_CLASSES.GameHistoryRoundContainer}`).nth(
      totalRounds - round
    )
    const movesCount = await roundContainer.child().count
    const expectedMoveText = `${playerName}: ${unitName} deployed as ${toTitleCase(row)}`
    let historyMove: Selector | undefined = undefined
    for (let j = 1; j < movesCount && !historyMove; j++) {
      const move = roundContainer.child().nth(j)
      const movePlayerName = await move.find(`.${HTML_CLASSES.GameHistoryMoveUsername}`).innerText
      const moveDescription = await move.find(`.${HTML_CLASSES.GameHistoryMoveDescription}`).innerText
      const moveText = `${movePlayerName}: ${moveDescription}`
      if (moveText === expectedMoveText) {
        historyMove = move
      }
    }
    if (!historyMove) {
      throw Error(
        `Could not find move of unit "${unitName}" for player "${playerName}" in round "${round}" in history to select`
      )
    }
    return historyMove
  }

  static async selectHistoryUnit({ playerName, unitName, row, round }: HighlightedHistory) {
    const historyUnit = await GamePage.getHistoryUnit({
      playerName,
      unitName,
      round,
      row,
    })
    await t.click(historyUnit)
  }

  static async getBattlefieldCard({ unitName, row, self }: { unitName: string; row: Combat; self: boolean }) {
    let rowSelector: Selector | undefined = undefined
    if (self) {
      if (row === Combat.Close) {
        rowSelector = GamePage.elements.CombatRowCloseSelf
      } else if (row === Combat.Ranged) {
        rowSelector = GamePage.elements.CombatRowRangedSelf
      } else {
        rowSelector = GamePage.elements.CombatRowSiegeSelf
      }
    } else {
      if (row === Combat.Close) {
        rowSelector = GamePage.elements.CombatRowCloseOpponent
      } else if (row === Combat.Ranged) {
        rowSelector = GamePage.elements.CombatRowRangedOpponent
      } else {
        rowSelector = GamePage.elements.CombatRowSiegeOpponent
      }
    }
    const rowCards = rowSelector.find(`.${HTML_CLASSES.GameCombatRowCards}`).child()
    const rowCardsCount = await rowCards.count
    let matchingCard: Selector | undefined
    for (let i = 0; i < rowCardsCount; i++) {
      const rowCard = rowCards.nth(i).find(`.${HTML_CLASSES.UnitGameCardContainer}`)
      const cardName = (await rowCard.getAttribute('title')) || ''
      if (cardName === unitName) {
        matchingCard = rowCard
      }
    }
    if (!matchingCard) {
      throw Error(`Could not find unit "${unitName}" in row "${row}" for "${self ? 'self' : 'opponent'}" to select`)
    }
    return matchingCard
  }

  static async selectBattlefieldCard({ unitName, row, self }: { unitName: string; row: Combat; self: boolean }) {
    const card = await this.getBattlefieldCard({
      unitName,
      row,
      self,
    })
    await t.click(card)
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
  passed?: boolean
  close?: CombatRow
  ranged?: CombatRow
  siege?: CombatRow
}

interface Redraws {
  from: string
  to: string
}

export interface HistoryMove {
  userName: string
  unitName: string
  combatRow: Combat
}

export interface HistoryPass {
  userName: string
  round: number
}

export interface RoundScores {
  creator: number
  opponent: number
}

export interface HighlightedHandCard {
  unitName: string
  dotted?: boolean
  rows?: Combat[] | null
}

export interface HighlightedBattlefieldCard {
  unitName: string
  row: Combat
}

export interface HighlightedHistory {
  playerName: string
  unitName: string
  row: Combat
  round: number
  dotted?: boolean
}

export interface CombatUnit {
  name: string
  strength?: number
  effectiveStrength?: number
}

interface CombatRow {
  score: number
  units: CombatUnit[]
}

interface CenterPlayer {
  set?: boolean
  ready?: boolean
  passed?: boolean
  close?: CombatRow
  ranged?: CombatRow
  siege?: CombatRow
}
