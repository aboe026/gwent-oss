import { Combat, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Card Highlights')

test('Selecting successive hand cards highlights each in turn', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Dol Blathanna Archer'
  const unitName3 = 'Ida Emean aep Sivney'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  await gameManager.initialize({})

  await GamePage.selectHandUnit({
    unitName: unitName1,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName1,
      rows: [Combat.Close],
    },
  })
  await GamePage.selectHandUnit({
    unitName: unitName2,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName2,
      rows: [Combat.Ranged],
    },
  })
  await GamePage.selectHandUnit({
    unitName: unitName3,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName3,
      rows: [Combat.Ranged],
    },
  })
  await GamePage.selectHandUnit({
    unitName: unitName3,
  })
  await gameManager.verify({})
})

test('Selecting successive battlefield cards highlights them and history each in turn', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Dol Blathanna Archer'
  const unitName3 = 'Ida Emean aep Sivney'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName2, combat: Combat.Ranged })
  await gameManager.deploy({ unitName: unitName3, combat: Combat.Ranged })
  await gameManager.initialize({})

  await GamePage.selectBattlefieldCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await gameManager.verify({
    highlightedBattlefieldCard: {
      unitName: unitName1,
      row: Combat.Close,
      userName: gameManager.self.gamePlayer.name,
    },
    highlightedHistory: {
      unitName: unitName1,
      row: Combat.Close,
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
    },
  })
  await GamePage.selectBattlefieldCard({
    unitName: unitName2,
    row: Combat.Ranged,
    self: true,
  })
  await gameManager.verify({
    highlightedBattlefieldCard: {
      unitName: unitName2,
      row: Combat.Ranged,
      userName: gameManager.self.gamePlayer.name,
    },
    highlightedHistory: {
      unitName: unitName2,
      row: Combat.Ranged,
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
    },
  })
  await GamePage.selectBattlefieldCard({
    unitName: unitName3,
    row: Combat.Ranged,
    self: true,
  })
  await gameManager.verify({
    highlightedBattlefieldCard: {
      unitName: unitName3,
      row: Combat.Ranged,
      userName: gameManager.self.gamePlayer.name,
    },
    highlightedHistory: {
      unitName: unitName3,
      row: Combat.Ranged,
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
    },
  })
  await GamePage.selectBattlefieldCard({
    unitName: unitName3,
    row: Combat.Ranged,
    self: true,
  })
  await gameManager.verify({})
})

test('Selecting between battlefield cards history entries highlights each in turn', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Dol Blathanna Archer'
  const unitName3 = 'Ida Emean aep Sivney'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName2, combat: Combat.Ranged })
  await gameManager.deploy({ unitName: unitName3, combat: Combat.Ranged })
  await gameManager.initialize({})

  await GamePage.selectBattlefieldCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await gameManager.verify({
    highlightedBattlefieldCard: {
      unitName: unitName1,
      row: Combat.Close,
      userName: gameManager.self.gamePlayer.name,
    },
    highlightedHistory: {
      unitName: unitName1,
      row: Combat.Close,
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
    },
  })
  await GamePage.selectHistoryUnit({
    unitName: unitName2,
    row: Combat.Ranged,
    playerName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await gameManager.verify({
    highlightedBattlefieldCard: {
      unitName: unitName2,
      row: Combat.Ranged,
      userName: gameManager.self.gamePlayer.name,
    },
    highlightedHistory: {
      unitName: unitName2,
      row: Combat.Ranged,
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
    },
  })
  await GamePage.selectBattlefieldCard({
    unitName: unitName3,
    row: Combat.Ranged,
    self: true,
  })
  await gameManager.verify({
    highlightedBattlefieldCard: {
      unitName: unitName3,
      row: Combat.Ranged,
      userName: gameManager.self.gamePlayer.name,
    },
    highlightedHistory: {
      unitName: unitName3,
      row: Combat.Ranged,
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
    },
  })
  await GamePage.selectBattlefieldCard({
    unitName: unitName3,
    row: Combat.Ranged,
    self: true,
  })
  await gameManager.verify({})
})

test('Fullscreening different unit types highlights them', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Dol Blathanna Archer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await gameManager.verify({
    highlightedBattlefieldCard: {
      unitName: unitName1,
      row: Combat.Close,
      userName: gameManager.self.gamePlayer.name,
    },
    highlightedHistory: {
      unitName: unitName1,
      row: Combat.Close,
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
    },
  })
  await FullCard.close()
  await gameManager.verify({
    highlightedBattlefieldCard: {
      unitName: unitName1,
      row: Combat.Close,
      userName: gameManager.self.gamePlayer.name,
    },
    highlightedHistory: {
      unitName: unitName1,
      row: Combat.Close,
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
    },
  })

  await GamePage.fullscreenHandCard(unitName2)
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName2,
      rows: [Combat.Ranged],
      dotted: true,
    },
  })
  await FullCard.close()
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName2,
      rows: [Combat.Ranged],
      dotted: true,
    },
  })

  await GamePage.selectHistoryMoveImage({
    unitName: unitName1,
    round: gameManager.round,
    userName: gameManager.self.gamePlayer.name,
  })
  await gameManager.verify({
    highlightedBattlefieldCard: {
      unitName: unitName1,
      row: Combat.Close,
      userName: gameManager.self.gamePlayer.name,
    },
    highlightedHistory: {
      unitName: unitName1,
      row: Combat.Close,
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
    },
  })
  await FullCard.close()
  await gameManager.verify({
    highlightedBattlefieldCard: {
      unitName: unitName1,
      row: Combat.Close,
      userName: gameManager.self.gamePlayer.name,
    },
    highlightedHistory: {
      unitName: unitName1,
      row: Combat.Close,
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
    },
  })
})
