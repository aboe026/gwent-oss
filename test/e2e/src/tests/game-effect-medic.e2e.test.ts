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

test.only('Medic revives medic which revives unit', async (t) => {
  const unitName1 = 'Rotten Mangonel'
  const unitName2 = 'Etolian Auxiliary Archers'
  const unitName3 = 'Siege Technician'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Siege,
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    medicing: [],
  })
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  await gameManager.initialize({})

  await t.debug()
  await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Siege,
    medicing: [
      {
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        effectiveStrength: 1,
      },
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
// medic without no units in discard
// medic with no eligible units in deiscard
// medic with single unit in discard
// medic with multiple units in discard
// 2 medics
// 3 medics
