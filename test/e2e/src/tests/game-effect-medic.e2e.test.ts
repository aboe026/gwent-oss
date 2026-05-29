import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import { EffectKey, FactionKey } from '@gwent/node-client'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Medic')

test.only('Medic revives only unit in discard', async (t) => {
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

  // TODO: change impact unit to To Be Determined? Deciding? for medics (and Secret for spies)
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
            unitName: '',
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
})
