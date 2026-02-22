import { Combat, EffectKey, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'
import { sortObjectArray } from '@gwent/utils'

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

test('Selecting spied hand card highlights it and impact', async (t) => {
  const unitName = 'Prince Stennis'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName],
    },
  })
  const handUnitIds = gameManager.self.deck.hand.map((handUnit) => handUnit.unit.id)

  await gameManager.deploy({
    unitName,
    spying: {
      name: unitName,
      player: gameManager.self.gamePlayer,
      opponent: gameManager.opponent.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 5,
    },
  })
  const newHandUnits = sortObjectArray({
    array: gameManager.self.deck.hand.filter((handUnit) => !handUnitIds.includes(handUnit.unit.id)),
    sortProperties: ['unit.name', 'unit.id'],
  })
  await gameManager.initialize({})

  await GamePage.toggleImpacts({
    round: gameManager.round,
    unitName,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Spy,
        round: gameManager.round,
        unitName,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: newHandUnits[0].unit.name,
            username: gameManager.self.gamePlayer.name,
          },
          {
            unitName: newHandUnits[1].unit.name,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
  await GamePage.selectHandUnit({
    unitName: newHandUnits[0].unit.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Spy,
        round: gameManager.round,
        unitName,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: newHandUnits[0].unit.name,
            username: gameManager.self.gamePlayer.name,
            highlighted: true,
            dotted: true,
          },
          {
            unitName: newHandUnits[1].unit.name,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
})

test('Selecting spying battlefield card highlights it and history', async (t) => {
  const unitName = 'Prince Stennis'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName],
    },
  })

  await gameManager.deploy({
    unitName,
    spying: {
      name: unitName,
      player: gameManager.self.gamePlayer,
      opponent: gameManager.opponent.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 5,
    },
  })
  await gameManager.initialize({})

  await GamePage.selectBattlefieldCard({
    unitName,
    row: Combat.Close,
    self: false,
  })
  await gameManager.verify({
    highlightedBattlefieldCard: {
      unitName,
      row: Combat.Close,
      userName: gameManager.opponent.gamePlayer.name,
    },
    highlightedHistory: {
      unitName,
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
      row: Combat.Close,
    },
  })
})

test('Selecting spying history highlights it and battlefield card', async (t) => {
  const unitName = 'Prince Stennis'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName],
    },
  })

  await gameManager.deploy({
    unitName,
    spying: {
      name: unitName,
      player: gameManager.self.gamePlayer,
      opponent: gameManager.opponent.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 5,
    },
  })
  await gameManager.initialize({})

  await GamePage.selectHistoryUnit({
    unitName,
    row: Combat.Close,
    playerName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    spyOpponent: gameManager.opponent.gamePlayer.name,
  })
  await gameManager.verify({
    highlightedBattlefieldCard: {
      unitName,
      row: Combat.Close,
      userName: gameManager.opponent.gamePlayer.name,
    },
    highlightedHistory: {
      unitName,
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
      row: Combat.Close,
    },
  })
})

// TODO: test clicking move image highlights properly
