import { Combat, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Medic')

test('Medic revives unit', async (t) => {
  const unitName1 = 'Rotten Mangonel'
  const unitName2 = 'Siege Technician'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Siege,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Siege,
    medicing: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Siege,
        effectiveStrength: 3,
      },
    ],
  })
})

// cannot revive hero
// cannot revive special
// medic without no units left
// medic with no eligible units left
// medic with single unit left
// medic with multiple units left
// 2 medics
// 3 medics
