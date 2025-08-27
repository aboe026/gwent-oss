import { Combat, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { EFFECT_OPERATOR } from '@gwent/constants'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game History')

test('Selecting self unit when not turn in history highlights it and card on battlefield', async (t) => {
  const unitName = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.deploy({ unitName })
  await gameManager.initialize({})

  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    unitName,
    row: Combat.Close,
    round: gameManager.round,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: 1,
      unitName,
      row: Combat.Close,
    },
    highlightedBattlefieldCard: {
      unitName,
      row: Combat.Close,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    unitName,
    row: Combat.Close,
    round: gameManager.round,
  })
  await gameManager.verify({})
})

test('Selecting self unit when not turn on combat row highlights it and move in history', async (t) => {
  const unitName = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.deploy({ unitName })
  await gameManager.initialize({})

  await GamePage.selectBattlefieldCard({
    unitName,
    row: Combat.Close,
    self: true,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: 1,
      unitName,
      row: Combat.Close,
    },
    highlightedBattlefieldCard: {
      unitName,
      row: Combat.Close,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await GamePage.selectBattlefieldCard({
    unitName,
    row: Combat.Close,
    self: true,
  })
  await gameManager.verify({})
})

test('Selecting self unit when turn in history highlights it and card on battlefield', async (t) => {
  const unitName1 = 'Vreemde'
  const unitName2 = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    unitName: unitName2,
    row: Combat.Close,
    round: gameManager.round,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: 1,
      unitName: unitName2,
      row: Combat.Close,
    },
    highlightedBattlefieldCard: {
      unitName: unitName2,
      row: Combat.Close,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    unitName: unitName2,
    row: Combat.Close,
    round: gameManager.round,
  })
  await gameManager.verify({})
})

test('Selecting self unit when turn on combat row highlights it and move in history', async (t) => {
  const unitName1 = 'Vreemde'
  const unitName2 = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  await GamePage.selectBattlefieldCard({
    unitName: unitName2,
    row: Combat.Close,
    self: true,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: 1,
      unitName: unitName2,
      row: Combat.Close,
    },
    highlightedBattlefieldCard: {
      unitName: unitName2,
      row: Combat.Close,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await GamePage.selectBattlefieldCard({
    unitName: unitName2,
    row: Combat.Close,
    self: true,
  })
  await gameManager.verify({})
})

test('Selecting opponent unit when turn in history highlights it and card on battlefield', async (t) => {
  const unitName = 'Vreemde'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName })
  await gameManager.initialize({})

  await GamePage.selectHistoryUnit({
    playerName: gameManager.opponent.gamePlayer.name,
    unitName: unitName,
    row: Combat.Close,
    round: gameManager.round,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.opponent.gamePlayer.name,
      round: 1,
      unitName: unitName,
      row: Combat.Close,
    },
    highlightedBattlefieldCard: {
      unitName: unitName,
      row: Combat.Close,
      userName: gameManager.opponent.gamePlayer.name,
    },
  })
  await GamePage.selectHistoryUnit({
    playerName: gameManager.opponent.gamePlayer.name,
    unitName: unitName,
    row: Combat.Close,
    round: gameManager.round,
  })
  await gameManager.verify({})
})

test('Selecting opponent unit when turn on combat row highlights it and move in history', async (t) => {
  const unitName = 'Vreemde'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName })
  await gameManager.initialize({})

  await GamePage.selectBattlefieldCard({
    unitName: unitName,
    row: Combat.Close,
    self: false,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.opponent.gamePlayer.name,
      round: 1,
      unitName: unitName,
      row: Combat.Close,
    },
    highlightedBattlefieldCard: {
      unitName: unitName,
      row: Combat.Close,
      userName: gameManager.opponent.gamePlayer.name,
    },
  })
  await GamePage.selectBattlefieldCard({
    unitName: unitName,
    row: Combat.Close,
    self: false,
  })
  await gameManager.verify({})
})

test('Selecting opponent unit when not turn in history highlights it and card on battlefield', async (t) => {
  const unitName1 = 'Vreemde'
  const unitName2 = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  await GamePage.selectHistoryUnit({
    playerName: gameManager.opponent.gamePlayer.name,
    unitName: unitName1,
    row: Combat.Close,
    round: gameManager.round,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.opponent.gamePlayer.name,
      round: 1,
      unitName: unitName1,
      row: Combat.Close,
    },
    highlightedBattlefieldCard: {
      unitName: unitName1,
      row: Combat.Close,
      userName: gameManager.opponent.gamePlayer.name,
    },
  })
  await GamePage.selectHistoryUnit({
    playerName: gameManager.opponent.gamePlayer.name,
    unitName: unitName1,
    row: Combat.Close,
    round: gameManager.round,
  })
  await gameManager.verify({})
})

test('Selecting opponent unit when not turn on combat row highlights it and move in history', async (t) => {
  const unitName1 = 'Vreemde'
  const unitName2 = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  await GamePage.selectBattlefieldCard({
    unitName: unitName1,
    row: Combat.Close,
    self: false,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.opponent.gamePlayer.name,
      round: 1,
      unitName: unitName1,
      row: Combat.Close,
    },
    highlightedBattlefieldCard: {
      unitName: unitName1,
      row: Combat.Close,
      userName: gameManager.opponent.gamePlayer.name,
    },
  })
  await GamePage.selectBattlefieldCard({
    unitName: unitName1,
    row: Combat.Close,
    self: false,
  })
  await gameManager.verify({})
})

test('Select card from history and deselect from battlefield', async (t) => {
  const unitName = 'Toruviel'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.deploy({ unitName })
  await gameManager.initialize({})

  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    unitName,
    row: Combat.Ranged,
    round: gameManager.round,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: 1,
      unitName,
      row: Combat.Ranged,
    },
    highlightedBattlefieldCard: {
      unitName,
      row: Combat.Ranged,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await GamePage.selectBattlefieldCard({
    unitName: unitName,
    row: Combat.Ranged,
    self: true,
  })
  await gameManager.verify({})
})

test('Select card from battlefield and deselect from history', async (t) => {
  const unitName = 'Rotten Mangonel'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName],
    },
  })
  await gameManager.deploy({ unitName })
  await gameManager.initialize({})

  await GamePage.selectBattlefieldCard({
    unitName: unitName,
    row: Combat.Siege,
    self: true,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: 1,
      unitName,
      row: Combat.Siege,
    },
    highlightedBattlefieldCard: {
      unitName,
      row: Combat.Siege,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    unitName,
    row: Combat.Siege,
    round: gameManager.round,
  })
  await gameManager.verify({})
})

test('Select card from history deselects card selected in hand', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Ciaran aep Easnillien'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  await GamePage.selectHandUnit({
    unitName: unitName2,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName2,
      rows: [Combat.Close, Combat.Ranged],
      dotted: true,
    },
  })
  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    unitName: unitName1,
    row: Combat.Close,
    round: gameManager.round,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: 1,
      unitName: unitName1,
      row: Combat.Close,
    },
    highlightedBattlefieldCard: {
      unitName: unitName1,
      row: Combat.Close,
      userName: gameManager.self.gamePlayer.name,
    },
  })
})

test('Select card from battlefield deselects card selected in hand', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Ciaran aep Easnillien'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  await GamePage.selectHandUnit({
    unitName: unitName2,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName2,
      rows: [Combat.Close, Combat.Ranged],
      dotted: true,
    },
  })
  await GamePage.selectBattlefieldCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: 1,
      unitName: unitName1,
      row: Combat.Close,
    },
    highlightedBattlefieldCard: {
      unitName: unitName1,
      row: Combat.Close,
      userName: gameManager.self.gamePlayer.name,
    },
  })
})

test('Selecting history unit that is no longer on battlefield is dotted', async (t) => {
  const unitName = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.deploy({ unitName })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  await gameManager.initialize({})

  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    unitName,
    row: Combat.Close,
    round: 1,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: 1,
      unitName,
      row: Combat.Close,
      dotted: true,
    },
  })
  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    unitName,
    row: Combat.Close,
    round: 1,
  })
  await gameManager.verify({})
})

test('FullUnit for move preserves effects in time', async (t) => {
  const unitName1 = 'Olgierd Von Everec'
  const unitName2 = 'Toruviel'
  const unitName3 = 'Milva'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged, moraling: [] })
  await gameManager.pass({})
  const deckUnit1 = await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 3,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
    impacts: -1,
  })
  await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Ranged,
    moraling: [
      {
        effectiveStrength: 7,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
      {
        effectiveStrength: 11,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
    impacts: 2,
  })
  await gameManager.initialize({})

  await GamePage.selectHistoryMoveImage({
    unitName: unitName2,
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 3,
    effects: [
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 3,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
})

test('Selecting combat card whose history entry is offscreen scrolls it into view', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Albrich'
  const unitName3 = 'Dol Blathanna Archer'
  const unitName4 = 'Assire var Anahid'
  const unitName5 = 'Ida Emean aep Sivney'
  const unitName6 = 'Cahir Mawr Dyffryn aep Ceallach'
  const unitName7 = 'Riordain'
  const unitName8 = 'Cynthia'
  const unitName9 = 'Toruviel'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3, unitName5, unitName7, unitName9],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName2, unitName4, unitName6, unitName8],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2, combat: Combat.Ranged })
  await gameManager.deploy({ unitName: unitName3, combat: Combat.Ranged })
  await gameManager.deploy({ unitName: unitName4, combat: Combat.Ranged })
  await gameManager.deploy({ unitName: unitName5, combat: Combat.Ranged })
  await gameManager.deploy({ unitName: unitName6 })
  await gameManager.deploy({ unitName: unitName7, combat: Combat.Ranged })
  await gameManager.deploy({ unitName: unitName8, combat: Combat.Ranged })
  await gameManager.deploy({ unitName: unitName9, combat: Combat.Ranged })
  await gameManager.initialize({})
  await GamePage.verifyHistoryUnitInViewport({
    historyItem: {
      playerName: gameManager.self.gamePlayer.name,
      round: 1,
      unitName: unitName1,
      row: Combat.Close,
    },
    inViewport: false,
  })

  await GamePage.selectBattlefieldCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: 1,
      unitName: unitName1,
      row: Combat.Close,
    },
    highlightedBattlefieldCard: {
      unitName: unitName1,
      row: Combat.Close,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await GamePage.verifyHistoryUnitInViewport({
    historyItem: {
      playerName: gameManager.self.gamePlayer.name,
      round: 1,
      unitName: unitName1,
      row: Combat.Close,
    },
    inViewport: true,
  })
})
