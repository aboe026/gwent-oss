import { Combat, FactionKey } from '@gwent-oss/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effects Mixed Spy')

test.only('Decoyed spy can be played again', async (t) => {
  const unitName1 = 'Prince Stennis'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    spying: {
      name: unitName1,
      player: gameManager.opponent.gamePlayer,
      opponent: gameManager.self.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 5,
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      effectiveStrength: 5,
      row: Combat.Close,
    },
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName1,
    spying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      opponent: gameManager.opponent.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 5,
    },
  })
})

test('Spy picks up horn effect of opponent', async (t) => {
  const unitName1 = "Commander's Horn"
  const unitName2 = 'Prince Stennis'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    horning: [],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    spying: {
      name: unitName2,
      player: gameManager.self.gamePlayer,
      opponent: gameManager.opponent.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 10,
    },
  })
})

test('Spy picks up morale effect of opponent', async (t) => {
  const unitName1 = 'Olgierd Von Everec'
  const unitName2 = 'Prince Stennis'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    moraling: [],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    spying: {
      name: unitName2,
      player: gameManager.self.gamePlayer,
      opponent: gameManager.opponent.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 6,
    },
  })
})

test('Spy can be scorched', async (t) => {
  const unitName1 = 'Prince Stennis'
  const unitName2 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    spying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      opponent: gameManager.opponent.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 5,
    },
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Close,
        strength: 5,
      },
    ],
  })
})

test('Spy can be weathered', async (t) => {
  const unitName1 = 'Biting Frost'
  const unitName2 = 'Prince Stennis'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    weather: true,
    weathering: [],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    spying: {
      name: unitName2,
      player: gameManager.self.gamePlayer,
      opponent: gameManager.opponent.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 1,
    },
  })
})
