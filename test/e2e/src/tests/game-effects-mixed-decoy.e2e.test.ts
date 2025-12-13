import { Combat, EffectKey, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effects Mixed Decoy')

test('Decoy bonded unit removes bond effect on other bonded unit', async (t) => {
  const unitName1 = 'Young Emissary'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 10,
    bonding: [
      {
        effectiveStrength: 10,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: -10,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 5,
    },
  })
})

test('Decoy horning unit removes horn effect on other unit', async (t) => {
  const unitName1 = 'Morteisen'
  const unitName2 = 'Dandelion'
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
  await gameManager.deploy({
    unitName: unitName2,
    horning: [
      {
        effectiveStrength: 6,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    effectiveStrength: -3,
    decoying: {
      name: unitName2,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 2,
    },
  })
})

test('Decoy berserker unit prevents transformation of until played later', async (t) => {
  const unitName1 = 'Young Berserker'
  const unitName2 = 'Decoy'
  const unitName3 = 'Ermion'
  const unitName4 = 'Transformed Young Vildkaarl'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Ranged,
      effectiveStrength: 2,
    },
  })
  await gameManager.deploy({ unitName: unitName3, combat: Combat.Ranged, mardroeming: [] })

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
    impacts: -1,
    mardroeming: [
      {
        name: unitName4,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        effectiveStrength: 8,
        reason: unitName3,
        impact: {
          type: EffectKey.Bond,
        },
      },
    ],
  })
})

test('Decoy vildkaarl allows it to be played again', async (t) => {
  const unitName1 = 'Young Berserker'
  const unitName2 = 'Ermion'
  const unitName3 = 'Transformed Young Vildkaarl'
  const unitName4 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2, unitName4],
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    mardroeming: [
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        effectiveStrength: 8,
        reason: unitName2,
        impact: {
          type: EffectKey.Bond,
        },
      },
    ],
  })

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName4,
    combat: Combat.Ranged,
    decoying: {
      name: unitName3,
      player: gameManager.self.gamePlayer,
      row: Combat.Ranged,
      effectiveStrength: 8,
    },
  })
  await gameManager.deploy({ unitName: unitName3, combat: Combat.Ranged, bonding: [] })
})

test('Decoy moraling unit removes morale effect on other unit', async (t) => {
  const unitName1 = 'Morteisen'
  const unitName2 = 'Olgierd Von Everec'
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
  await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 4,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    effectiveStrength: -1,
    decoying: {
      name: unitName2,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 6,
    },
  })
})

test('Decoy mustered unit allows it to be played again', async (t) => {
  const unitName1 = 'Arachas Behemoth'
  const unitName2 = 'Arachas'
  const unitName3 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1, unitName2, unitName3],
      excludeHandUnitNames: [unitName2, unitName2],
      ignoreUnitNames: [unitName2, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Siege,
    mustering: [
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        hand: true,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Siege,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Siege,
      effectiveStrength: 6,
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Siege, mustering: [] })
})

test('Decoy not effected by scorch', async (t) => {
  const unitName1 = 'Morteisen'
  const unitName2 = 'Decoy'
  const unitName3 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2, unitName3],
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
      effectiveStrength: 3,
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName3, scorching: [] })
})
