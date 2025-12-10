import { Combat, EffectKey, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Mardroeme')

test('Mardroeme does not effect berserker in different row', async (t) => {
  const unitName1 = 'Berserker'
  const unitName2 = 'Mardroeme'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    eligibleCombats: [Combat.Close, Combat.Ranged, Combat.Siege],
    modifier: true,
    mardroeming: [],
  })
})

test('Mardroeme does not effect opponents berserker', async (t) => {
  const unitName1 = 'Berserker'
  const unitName2 = 'Mardroeme'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    eligibleCombats: [Combat.Close, Combat.Ranged, Combat.Siege],
    modifier: true,
    mardroeming: [],
  })
})

test('Mardroeme effects berserker if played before', async (t) => {
  const unitName1 = 'Mardroeme'
  const unitName2 = 'Berserker'
  const unitName3 = 'Transformed Vildkaarl'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, modifier: true, mardroeming: [] })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    impacts: -1,
    mardroeming: [
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 14,
        reason: unitName1,
        impact: {
          type: EffectKey.Morale,
          instances: 0,
        },
      },
    ],
  })
})

test('Mardroeme effects young berserker if played before', async (t) => {
  const unitName1 = 'Mardroeme'
  const unitName2 = 'Young Berserker'
  const unitName3 = 'Transformed Young Vildkaarl'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged, mardroeming: [] })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    impacts: -1,
    mardroeming: [
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        effectiveStrength: 8,
        reason: unitName1,
        impact: {
          type: EffectKey.Bond,
          instances: 0,
        },
      },
    ],
  })
})

test('Mardroeme effects berserker if played after', async (t) => {
  const unitName1 = 'Berserker'
  const unitName2 = 'Mardroeme'
  const unitName3 = 'Transformed Vildkaarl'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    eligibleCombats: [Combat.Close, Combat.Ranged, Combat.Siege],
    modifier: true,
    mardroeming: [
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 14,
        reason: unitName2,
        impact: {
          type: EffectKey.Morale,
          instances: 0,
        },
      },
    ],
  })
})

test('Mardroeme effects young berserker if played after', async (t) => {
  const unitName1 = 'Young Berserker'
  const unitName2 = 'Mardroeme'
  const unitName3 = 'Transformed Young Vildkaarl'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    eligibleCombats: [Combat.Close, Combat.Ranged, Combat.Siege],
    modifier: true,
    mardroeming: [
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        effectiveStrength: 8,
        reason: unitName2,
        impact: {
          type: EffectKey.Bond,
          instances: 0,
        },
      },
    ],
  })
})

test('Ermion effects young berserker if played before', async (t) => {
  const unitName1 = 'Ermion'
  const unitName2 = 'Young Berserker'
  const unitName3 = 'Transformed Young Vildkaarl'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged, mardroeming: [] })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    impacts: -1,
    mardroeming: [
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        effectiveStrength: 8,
        reason: unitName1,
        impact: {
          type: EffectKey.Bond,
          instances: 0,
        },
      },
    ],
  })
})

test('Ermion effects single young berserker if played after', async (t) => {
  const unitName1 = 'Young Berserker'
  const unitName2 = 'Ermion'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    mardroeming: [
      {
        name: 'Transformed Young Vildkaarl',
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        effectiveStrength: 8,
        impact: {
          type: EffectKey.Bond,
          instances: 0,
        },
      },
    ],
  })
})

test('Ermion effects multiple young berserkers if played after', async (t) => {
  const unitName1 = 'Young Berserker'
  const unitName2 = 'Ermion'
  const unitName3 = 'Transformed Young Vildkaarl'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    mardroeming: [
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        effectiveStrength: 16,
        impact: {
          type: EffectKey.Bond,
          instances: 1,
        },
      },
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        effectiveStrength: 16,
        impact: {
          type: EffectKey.Bond,
          instances: 1,
        },
      },
    ],
  })
})

test('Mardroeme has no effect if Ermion already played', async (t) => {
  const unitName1 = 'Young Berserker'
  const unitName2 = 'Ermion'
  const unitName3 = 'Transformed Young Vildkaarl'
  const unitName4 = 'Mardroeme'
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
        impact: {
          type: EffectKey.Bond,
          instances: 0,
        },
      },
    ],
  })

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName4,
    combat: Combat.Ranged,
    eligibleCombats: [Combat.Close, Combat.Ranged, Combat.Siege],
    modifier: true,
    mardroeming: [],
  })
})

test('Ermion has no effect if Mardroeme already played', async (t) => {
  const unitName1 = 'Young Berserker'
  const unitName2 = 'Mardroeme'
  const unitName3 = 'Transformed Young Vildkaarl'
  const unitName4 = 'Ermion'
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
    modifier: true,
    mardroeming: [
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        effectiveStrength: 8,
        impact: {
          type: EffectKey.Bond,
          instances: 0,
        },
      },
    ],
  })

  await gameManager.initialize({})
  await gameManager.deploy({ unitName: unitName4, combat: Combat.Ranged, mardroeming: [] })
})
