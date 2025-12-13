import createGameManager from '../util/game-manager'
import { Combat, FactionKey } from '@gwent/node-client'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Play')

test('Play a close unit as first move', async (t) => {
  const unitName = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName })
})

test('Play a ranged unit as first move', async (t) => {
  const unitName = 'Toruviel'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName, combat: Combat.Ranged })
})

test('Play a siege unit as first move', async (t) => {
  const unitName = 'Ballista'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName, combat: Combat.Siege })
})

test('Play a unit after opponent plays unit', async (t) => {
  const unitName1 = 'Ballista'
  const unitName2 = 'Yaevinn'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Siege })

  await gameManager.initialize({})
  await gameManager.deploy({ unitName: unitName2, eligibleCombats: [Combat.Close, Combat.Ranged] })
})

test('Play unit after opponent plays pass', async (t) => {
  const unitName = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
    opponentFirst: true,
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({ unitName })
})

test('Cannot play unit on invalid row', async (t) => {
  const unitName = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  await GamePage.moveUnit({
    unitName,
    row: Combat.Ranged,
    verify: false,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName,
      rows: [Combat.Close],
    },
  })
})

test('Cannot play unit when not turn', async (t) => {
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

  await GamePage.moveUnit({
    unitName,
    row: Combat.Close,
    verify: false,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName,
      rows: [Combat.Close],
      dotted: true,
    },
  })
})
