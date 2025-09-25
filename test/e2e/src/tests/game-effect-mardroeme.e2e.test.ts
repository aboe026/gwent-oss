import { Combat, EffectKey, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Mardroeme')

test('Mardroeme effects young berserker unit if played after', async (t) => {
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

test('Mardroeme effects young berserker unit if played before', async (t) => {
  const unitName1 = 'Ermion'
  const unitName2 = 'Young Berserker'
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
        name: 'Transformed Young Vildkaarl',
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

test('Young berserker transforms into Vildkaarl and bonds with existing one', async (t) => {
  const unitName1 = 'Ermion'
  const unitName2 = 'Young Berserker'
  const unitName3 = 'Transformed Young Vildkaarl'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged, mardroeming: [] })
  await gameManager.pass({})
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
        effectiveStrength: 16,
        reason: unitName1,
        impact: {
          type: EffectKey.Bond,
          instances: 1,
        },
      },
    ],
    bonding: [
      {
        effectiveStrength: 16,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })
})

// TODO: test old berserker
// TODO: test old berserker with morale
// TODO: test young berserker with bond
// TODO: test with Mardroeme
// TODO: test with Mardroeme and Ermion
