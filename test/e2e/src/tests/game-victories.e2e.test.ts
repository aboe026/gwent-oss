import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Victories')

test('Opponent passes ends in victory after 2 rounds', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Ciaran aep Easnillien'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  // round 1
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  // round 2
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.pass({
    victors: [gameManager.self.gamePlayer.name],
  })
})

test('Self passes ends in loss after 2 rounds', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Ciaran aep Easnillien'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  // round 1
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
  })
  // round 2
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.pass({
    victors: [gameManager.opponent.gamePlayer.name],
  })
})

test('All passes ends in tie after 2 rounds', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
    },
  })
  // round 1
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
  })
  // round 2
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.pass({
    victors: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
  })
})

test('Win loss win ends in victory', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Vreemde'
  const unitName3 = 'Ciaran aep Easnillien'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName2],
    },
  })
  // round 1
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  // round 2
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
  })
  // round 3
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.initialize({})

  await gameManager.pass({
    victors: [gameManager.self.gamePlayer.name],
  })
})

test('Win loss loss ends in defeat', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Vreemde'
  const unitName3 = 'Morteisen'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName2, unitName3],
    },
  })
  // round 1
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  // round 2
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
  })
  // round 3
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.pass({
    victors: [gameManager.opponent.gamePlayer.name],
  })
})

test('Win loss tie ends in tie', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Vreemde'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName2],
    },
  })
  // round 1
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  // round 2
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
  })
  // round 3
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.pass({
    victors: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
  })
})

test('Loss win win ends in victory', async (t) => {
  const unitName1 = 'Vreemde'
  const unitName2 = 'Dennis Cranmer'
  const unitName3 = 'Ciaran aep Easnillien'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2, unitName3],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1],
    },
  })
  // round 1
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
  })
  // round 2
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  // round 3
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.pass({
    victors: [gameManager.self.gamePlayer.name],
  })
})

test('Loss win loss ends in defeat', async (t) => {
  const unitName1 = 'Vreemde'
  const unitName2 = 'Dennis Cranmer'
  const unitName3 = 'Morteisen'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName3],
    },
  })
  // round 1
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
  })
  // round 2
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  // round 3
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.initialize({})

  await gameManager.pass({
    victors: [gameManager.opponent.gamePlayer.name],
  })
})

test('Loss win tie ends in tie', async (t) => {
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
  })
  // round 1
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
  })
  // round 2
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  // round 3
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.pass({
    victors: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
  })
})
