import { Combat, EffectKey, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Impact')

test('Shows no eligibles text if impactable unit but no impacts', async (t) => {
  const unitName = 'Milva'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.deploy({ unitName, moraling: [] })
  await gameManager.initialize({})

  await GamePage.toggleImpacts({
    unitName,
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Morale,
        unitName,
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        impacts: [],
      },
    ],
  })
})

test('Shows single entry if impacts single unit self', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Milva'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 3,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })

  await GamePage.toggleImpacts({
    unitName: unitName2,
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Morale,
        unitName: unitName2,
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        impacts: [
          {
            username: gameManager.self.gamePlayer.name,
            unitName: unitName1,
          },
        ],
      },
    ],
  })
})

// TODO: test impacts with multiple units
// TODO: test impacts with multiple users (scorch)
// TODO: test that impact gets highlighted if game unit highlighted
// TODO: test that impact that happens twice (moraled then scorched) shows up twice and each highlights the other
// TODO: test that selecting battlefield unit still scrolls to first one (maybe edit existing text in the other fixture)
