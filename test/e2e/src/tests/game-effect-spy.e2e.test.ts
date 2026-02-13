import { Combat, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Spy')

test('Spy close combat unit', async (t) => {
  const unitName1 = 'Prince Stennis'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    spying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      opponent: gameManager.opponent.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 5,
    },
  })
})
