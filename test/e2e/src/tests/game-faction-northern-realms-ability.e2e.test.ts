import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { FactionKey } from '@gwent-oss/node-client'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Faction Northern Realms Ability')

test.only('Moves random unit from undrawn into hand if round won and undrawns available', async (t) => {
  const unitName = 'Ves'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName],
    },
    opponentFirst: true,
  })
  await gameManager.pass({})
  await gameManager.deploy({ unitName })
  await gameManager.initialize({})

  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  await t.debug()
})
