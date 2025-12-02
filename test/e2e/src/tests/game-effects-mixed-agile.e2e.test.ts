import createGameManager from '../util/game-manager'
import { Combat, FactionKey } from '@gwent/node-client'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effects Mixed Agile')

test('Agile unit can be decoyed and played again as same combat', async (t) => {
  const unitName1 = 'Barclay Els'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    decoying: {
      effectiveStrength: 6,
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName1 })
})

test('Agile unit can be decoyed and played again as different combat', async (t) => {
  const unitName1 = 'Barclay Els'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    decoying: {
      effectiveStrength: 6,
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
})
