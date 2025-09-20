import { Combat, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Mardroeme')

test.only('Mardroeme effects old berserker unit if played after', async (t) => {
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
      },
    ],
  })
  await t.debug()
})
