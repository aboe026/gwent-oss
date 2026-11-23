import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { FactionKey } from '@gwent-oss/node-client'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Factions Mixed Abilities')

test('Monster and Northern Realms abilities can be triggered at the same time', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Foglet'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
    },
    opponent: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
    factionAbilities: [
      {
        gamePlayer: gameManager.opponent.gamePlayer,
        key: FactionKey.Monsters,
        impacts: 1,
      },
      {
        gamePlayer: gameManager.self.gamePlayer,
        key: FactionKey.NorthernRealms,
        impacts: 1,
      },
    ],
  })
})
