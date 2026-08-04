import { Combat, EffectKey, FactionKey } from '@gwent-oss/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Decoy')

test('Cannot decoy if no units on battlefield', async (t) => {
  const unitName = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName,
    },
  })
  await GamePage.selectCombatRow({
    combat: Combat.Close,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName,
    },
  })
})

test('Cannot decoy hero', async (t) => {
  const unitName1 = 'Letho of Gulet'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, hero: true })
  await gameManager.pass({})
  await gameManager.initialize({})

  await GamePage.selectHandUnit({
    unitName: unitName2,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName2,
    },
  })
  await GamePage.selectBattlefieldCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName2,
    },
  })
})

test('Cannot decoy another decoy', async (t) => {
  const unitName1 = 'Cahir Mawr Dyffryn aep Ceallach'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 6,
    },
  })
  await gameManager.initialize({})

  await GamePage.selectHandUnit({
    unitName: unitName2,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName2,
    },
  })
  await GamePage.selectBattlefieldCard({
    unitName: unitName2,
    row: Combat.Close,
    self: true,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName2,
    },
  })
})

test('Decoy close combat unit', async (t) => {
  const unitName1 = 'Cahir Mawr Dyffryn aep Ceallach'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit = await gameManager.deploy({
    unitName: unitName2,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 6,
    },
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Decoy ranged combat unit', async (t) => {
  const unitName1 = 'Assire var Anahid'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit = await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Ranged,
      effectiveStrength: 6,
    },
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Decoy siege combat unit', async (t) => {
  const unitName1 = 'Heavy Zerrikanian Fire Scorpion'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Siege })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit = await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Siege,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Siege,
      effectiveStrength: 10,
    },
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Siege,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Decoy one of many', async (t) => {
  const unitName1 = 'Cahir Mawr Dyffryn aep Ceallach'
  const unitName2 = 'Rainfarn'
  const unitName3 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  const deckUnit = await gameManager.deploy({
    unitName: unitName3,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 6,
    },
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName3,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Decoy one of same name', async (t) => {
  const unitName1 = 'Black Infantry Archer'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.pass({})
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Ranged,
      effectiveStrength: 10,
    },
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Decoy unit when opponent has same deployed', async (t) => {
  const unitName1 = 'Cahir Mawr Dyffryn aep Ceallach'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  const deckUnit = await gameManager.deploy({
    unitName: unitName2,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 6,
    },
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Can redeploy decoyed unit', async (t) => {
  const unitName1 = 'Cahir Mawr Dyffryn aep Ceallach'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 6,
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName1 })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Game and hand updated if decoy performed via API', async (t) => {
  const unitName1 = 'Cahir Mawr Dyffryn aep Ceallach'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({
    apiDriven: true,
  })

  const deckUnit = await gameManager.deploy({
    unitName: unitName2,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 6,
    },
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Selecting hand unit after Decoy highlights history, impact and hand unit', async (t) => {
  const unitName1 = 'Cahir Mawr Dyffryn aep Ceallach'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 6,
    },
  })
  await gameManager.initialize({})

  await GamePage.toggleImpacts({
    unitName: unitName2,
    userName: gameManager.self.gamePlayer.name,
    round: 1,
  })
  await GamePage.selectHandUnit({
    unitName: unitName1,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName1,
      rows: [Combat.Close],
    },
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: 1,
      row: Combat.Close,
      unitName: unitName1,
      dotted: true,
    },
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        unitName: unitName2,
        round: 1,
        userName: gameManager.self.gamePlayer.name,
        effectKey: EffectKey.Decoy,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
            highlighted: true,
            dotted: true,
          },
        ],
      },
    ],
  })
})

test('Selecting history after Decoy highlights history, impact and hand unit', async (t) => {
  const unitName1 = 'Cahir Mawr Dyffryn aep Ceallach'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 6,
    },
  })
  await gameManager.initialize({})

  await GamePage.toggleImpacts({
    unitName: unitName2,
    userName: gameManager.self.gamePlayer.name,
    round: 1,
  })
  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    round: 1,
    row: Combat.Close,
    unitName: unitName1,
    dotted: true,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName1,
      rows: [Combat.Close],
    },
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: 1,
      row: Combat.Close,
      unitName: unitName1,
      dotted: true,
    },
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        unitName: unitName2,
        round: 1,
        userName: gameManager.self.gamePlayer.name,
        effectKey: EffectKey.Decoy,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
            highlighted: true,
            dotted: true,
          },
        ],
      },
    ],
  })
})

test('Selecting impact after Decoy highlights history, impact and hand unit', async (t) => {
  const unitName1 = 'Cahir Mawr Dyffryn aep Ceallach'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 6,
    },
  })
  await gameManager.initialize({})

  await GamePage.toggleImpacts({
    unitName: unitName2,
    userName: gameManager.self.gamePlayer.name,
    round: 1,
  })
  await GamePage.selectImpactCard({
    move: {
      round: gameManager.round,
      unitName: unitName2,
      userName: gameManager.self.gamePlayer.name,
    },
    impact: {
      unitName: unitName1,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName1,
      rows: [Combat.Close],
    },
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: 1,
      row: Combat.Close,
      unitName: unitName1,
      dotted: true,
    },
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        unitName: unitName2,
        round: 1,
        userName: gameManager.self.gamePlayer.name,
        effectKey: EffectKey.Decoy,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
            highlighted: true,
            dotted: true,
          },
        ],
      },
    ],
  })
})
