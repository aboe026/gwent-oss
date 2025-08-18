import createGameManager from '../util/game-manager'
import { Combat, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Bond')

test('Bond multiplies base strengths by 2 when single other bonded unit present', async (t) => {
  const unitName = 'Blue Stripes Commando'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName, unitName],
    },
  })
  await gameManager.deploy({ unitName, bonding: [] })
  await gameManager.pass({})

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName,
    effectiveStrength: 8,
    bonding: [
      {
        effectiveStrength: 8,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Bond multiplies base strengths by 4 when two other bonded units present', async (t) => {
  const unitName = 'Blue Stripes Commando'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName, unitName, unitName],
    },
  })
  await gameManager.deploy({ unitName, bonding: [] })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName,
    effectiveStrength: 8,
    bonding: [
      {
        effectiveStrength: 8,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName,
    effectiveStrength: 16,
    bonding: [
      {
        effectiveStrength: 16,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 16,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Bond multiplies base strengths by 8 when three other bonded units present', async (t) => {
  const unitName = 'Impera Brigade Guard'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName, unitName, unitName, unitName],
    },
  })
  await gameManager.deploy({ unitName, bonding: [] })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName,
    effectiveStrength: 6,
    bonding: [
      {
        effectiveStrength: 6,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.deploy({
    unitName,
    effectiveStrength: 12,
    bonding: [
      {
        effectiveStrength: 12,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 12,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName,
    effectiveStrength: 24,
    bonding: [
      {
        effectiveStrength: 24,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 24,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 24,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Bond is separate for units with different names', async (t) => {
  const unitName1 = 'Blue Stripes Commando'
  const unitName2 = 'Poor Fucking Infantry'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName1, unitName1, unitName2, unitName2, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 8,
    bonding: [
      {
        effectiveStrength: 8,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.deploy({ unitName: unitName2, bonding: [] })
  await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 2,
    bonding: [
      {
        effectiveStrength: 2,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 16,
    bonding: [
      {
        effectiveStrength: 16,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 16,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 4,
    bonding: [
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Bond is separate for units on different combat rows', async (t) => {
  const unitName1 = 'Blue Stripes Commando'
  const unitName2 = 'Crinfrid Reavers Dragon Hunter'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName1, unitName2, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 8,
    bonding: [
      {
        effectiveStrength: 8,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.deploy({ unitName: unitName2, combat: Combat.Ranged, bonding: [] })

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    effectiveStrength: 10,
    bonding: [
      {
        effectiveStrength: 10,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })
})

test('Bond is separate for same unit as opponent', async (t) => {
  const unitName1 = 'Blue Stripes Commando'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName1],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 8,
    bonding: [
      {
        effectiveStrength: 8,
        name: unitName1,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 8,
    bonding: [
      {
        effectiveStrength: 8,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Bond does not take into account scorched units', async (t) => {
  const unitName1 = 'Blue Stripes Commando'
  const unitName2 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName1, unitName1],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        strength: 4,
      },
    ],
  })
  await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.pass({})

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 8,
    bonding: [
      {
        effectiveStrength: 8,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Can bond moraled unit', async (t) => {
  const unitName1 = 'Olgierd Von Everec'
  const unitName2 = 'Blue Stripes Commando'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, moraling: [] })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 5,
    bonding: [],
  })

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 9,
    bonding: [
      {
        effectiveStrength: 9,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})
