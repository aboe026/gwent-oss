import { Combat, FactionKey } from '@gwent/node-client'
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

// TODO: decoy ranged
// TODO: decoy siege
// TODO: decoy via API
// TODO: can re-play decoyed unit
// TODO: selecting hand unit after decoy highlights it, history and impact entry
// TODO: selecting history unit highlights history, impact and hand unit
// TODO: selecting history impact highlights impact, unit and hand unit
