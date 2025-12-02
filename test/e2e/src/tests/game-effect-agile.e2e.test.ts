import createGameManager from '../util/game-manager'
import { Combat, FactionKey } from '@gwent/node-client'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Agile')

test('Agile unit can be deployed as Close combat', async (t) => {
  const unitName = 'Barclay Els'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName,
    combat: Combat.Close,
  })
})

test('Agile unit can be deployed as Ranged combat', async (t) => {
  const unitName = 'Barclay Els'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName,
    combat: Combat.Ranged,
  })
})

test('Agile unit cannot be deployed as Siege combat', async (t) => {
  const unitName = 'Barclay Els'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  await GamePage.selectHandUnit({ unitName })
  await GamePage.selectCombatRow({ combat: Combat.Siege })
  await gameManager.verify({
    highlightedHandCard: {
      unitName,
      rows: [Combat.Close, Combat.Ranged],
    },
  })
})
