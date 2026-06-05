import { Combat, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effects Mixed Medic')

test('Agile unit can be revived to same combat row', async (t) => {
  const unitName1 = 'Yaevinn'
  const unitName2 = 'Havekar Healer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    eligibleCombats: [Combat.Close, Combat.Ranged],
    revivedBy: unitName2,
  })
})

test('Agile unit can be revived to different combat row', async (t) => {
  const unitName1 = 'Yaevinn'
  const unitName2 = 'Havekar Healer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
    eligibleCombats: [Combat.Close, Combat.Ranged],
    revivedBy: unitName2,
  })
})

test('Avenging units can be revived', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Bovine Defense Force'
  const unitName3 = 'Scorch'
  const unitName4 = 'Dun Banner Medic'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName3, unitName4],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
    avenging: [
      {
        name: unitName2,
        effectiveStrength: 8,
        newUnitPlayer: gameManager.self.gamePlayer,
        turn: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        strength: 8,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName4,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName2,
    revivedBy: unitName4,
  })
})

test('Bonded units can rebond after revival', async (t) => {
  const unitName1 = 'Blue Stripes Commando'
  const unitName2 = 'Dun Banner Medic'
  const unitName3 = 'Yennefer of Vengerberg'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName1, unitName2, unitName3],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    bonding: [],
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 8,
    bonding: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 8,
      },
    ],
  })
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })

  await gameManager.deploy({
    unitName: unitName2,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    bonding: [],
    revivedBy: unitName2,
  })

  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 8,
    bonding: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 8,
      },
    ],
    revivedBy: unitName3,
  })
})

test('Revived unit can be decoyed', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Dun Banner Medic'
  const unitName3 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  await gameManager.deploy({
    unitName: unitName2,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    revivedBy: unitName2,
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    decoying: {
      name: unitName1,
      effectiveStrength: 5,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
    },
  })
})

test('Decoyed medic can revive another unit', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Vesemir'
  const unitName3 = 'Dun Banner Medic'
  const unitName4 = 'Decoy'

  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2, unitName3, unitName4],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
  })
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Siege,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    revivedBy: unitName3,
  })
  await gameManager.pass({})

  await gameManager.deploy({
    unitName: unitName4,
    combat: Combat.Siege,
    decoying: {
      name: unitName3,
      effectiveStrength: 5,
      player: gameManager.self.gamePlayer,
      row: Combat.Siege,
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Siege,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName2,
    revivedBy: unitName3,
  })
})

test('Horned units can rehorn after revival', async (t) => {
  const unitName1 = 'Blueboy Lugos'
  const unitName2 = 'Dandelion'
  const unitName3 = 'Yennefer of Vengerberg'
  const unitName4 = 'Birna Bran'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2, unitName3, unitName4],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    horning: [
      {
        name: unitName1,
        effectiveStrength: 12,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })

  await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Ranged,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    revivedBy: unitName3,
  })

  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName4,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName2,
    revivedBy: unitName4,
    horning: [
      {
        name: unitName1,
        effectiveStrength: 12,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        name: unitName4,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})
