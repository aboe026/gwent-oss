import { Combat, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Horn')

test('Horn effects regular unit if played after', async (t) => {
  const unitName1 = 'Blueboy Lugos'
  const unitName2 = "Commander's Horn"
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
    modifier: true,
    horning: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 12,
      },
    ],
  })
})

// TODO: does not effect hero
// TODO: dandelion gets doubled from commander's horn, but both don't 4x a regular card
// TODO: gets applied before morale
// TODO: gets applied to mardroemes
// TODO: gets applied to musters
// TODO: gets taken into account for scorch
