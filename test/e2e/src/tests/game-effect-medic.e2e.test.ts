import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import { EffectKey, FactionKey } from '@gwent/node-client'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Medic')

test('Medic has no effect if no units in discard', async (t) => {})

// TODO: Medic has no effect if only hero in discard
// TODO: Medic has no effect if only special in discard

test('Medic revives only unit in discard', async (t) => {
  const unitName1 = 'Rainfarn'
  const unitName2 = 'Etolian Auxiliary Archers'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    medicing: true,
  })

  await GamePage.toggleImpacts({
    unitName: unitName2,
    round: gameManager.round,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        unitName: unitName2,
        round: gameManager.round,
        userName: gameManager.self.gamePlayer.name,
        effectKey: EffectKey.Medic,
        impacts: [
          {
            unitName: 'Choosing...',
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })

  await gameManager.deploy({
    unitName: unitName1,
    revivedBy: unitName2,
  })

  await GamePage.verifyImpacts({
    moves: [
      {
        unitName: unitName2,
        round: gameManager.round,
        userName: gameManager.self.gamePlayer.name,
        effectKey: EffectKey.Medic,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
})
