import createGameManager from '../util/game-manager'
import Confirm from '../components/confirm'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { FactionKey } from '@gwent/node-client'
import GamePage from '../page-objects/game-page'
import { HTML_IDS } from '@gwent/constants'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Pass')

test('Pass as first move', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
  })
  await gameManager.initialize({})

  await gameManager.pass({})
})

test('Pass after opponent passes', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    opponentFirst: true,
  })
  await gameManager.initialize({})

  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
})

test('Pass after opponent plays unit', async (t) => {
  const unitName = 'Siegfried of Denesle'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName],
    },
    opponentFirst: true,
  })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName })
  await gameManager.pass({})
})

test('Cancelling pass confirmation does not trigger pass', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
  })
  await gameManager.initialize({})

  await GamePage.pass({
    cancel: true,
  })

  await gameManager.verify({})
})

test('Cannot pass when not turn', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    opponentFirst: true,
  })
  await gameManager.initialize({})

  await t.click(GamePage.elements.Pass)
  const confirmDialog = new Confirm(HTML_IDS.GamePassConfirmContainer)
  await t.expect(confirmDialog.elements.Container.exists).notOk()

  await gameManager.verify({})
})
