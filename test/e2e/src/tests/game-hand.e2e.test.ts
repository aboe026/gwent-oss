import createGameManager from '../util/game-manager'
import { Combat, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Hand')

test('Selecting hand unit while turn highlights appropriate single combat row', async (t) => {
  const unitName = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
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
      rows: [Combat.Close],
    },
  })
  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({})
})

test('Selecting hand unit while turn highlights appropriate multi combat row', async (t) => {
  const unitName = 'Filavandrel aen Fidhail'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
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
      rows: [Combat.Close, Combat.Ranged],
    },
  })
  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({})
})

test('Selecting hand unit while not turn dotted highlights appropriate single combat row', async (t) => {
  const unitName = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
    opponentFirst: true,
  })
  await gameManager.initialize({})

  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName,
      rows: [Combat.Close],
      dotted: true,
    },
  })
  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({})
})

test('Selecting hand unit while not turn dotted highlights appropriate multi combat rows', async (t) => {
  const unitName = 'Filavandrel aen Fidhail'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
    opponentFirst: true,
  })
  await gameManager.initialize({})

  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName,
      rows: [Combat.Close, Combat.Ranged],
      dotted: true,
    },
  })
  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({})
})

test('Selecting another hand unit while turn highlights appropriate card', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Zoltan Chivay'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
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
      rows: [Combat.Close],
    },
  })
})

test('Selecting another hand unit while not turn dotted highlights appropriate card', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Zoltan Chivay'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
    opponentFirst: true,
  })
  await gameManager.initialize({})

  await GamePage.selectHandUnit({
    unitName: unitName1,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName1,
      rows: [Combat.Close],
      dotted: true,
    },
  })
  await GamePage.selectHandUnit({
    unitName: unitName2,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName2,
      rows: [Combat.Close],
      dotted: true,
    },
  })
})

test('Playing all units in hand shows message to user to pass or activate leader ability', async (t) => {
  const unitName1 = 'Ciaran aep Easnillien'
  const unitName2 = 'Dennis Cranmer'
  const unitName3 = 'Dol Blathanna Archer'
  const unitName4 = 'Dol Blathanna Scout'
  const unitName5 = 'Filavandrel aen Fidhail'
  const unitName6 = 'Ida Emean aep Sivney'
  const unitName7 = 'Riordain'
  const unitName8 = 'Toruviel'
  const unitName9 = 'Vrihedd Brigade Recruit'
  const unitName10 = 'Yaevinn'

  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [
        unitName1,
        unitName2,
        unitName3,
        unitName4,
        unitName5,
        unitName6,
        unitName7,
        unitName8,
        unitName9,
        unitName10,
      ],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName3, combat: Combat.Ranged })
  await gameManager.deploy({ unitName: unitName4 })
  await gameManager.deploy({ unitName: unitName5 })
  await gameManager.deploy({ unitName: unitName6, combat: Combat.Ranged })
  await gameManager.deploy({ unitName: unitName7, combat: Combat.Ranged })
  await gameManager.deploy({ unitName: unitName8, combat: Combat.Ranged })
  await gameManager.deploy({ unitName: unitName9, combat: Combat.Ranged })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName10 })
})
