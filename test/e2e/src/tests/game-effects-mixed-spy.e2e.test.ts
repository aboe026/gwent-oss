import createGameManager from '../util/game-manager'
import { Combat, FactionKey } from '@gwent/node-client'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effects Mixed Spy')

test('Decoyed spy can be played again', async (t) => {
  const unitName1 = 'Prince Stennis'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    spying: {
      name: unitName1,
      player: gameManager.opponent.gamePlayer,
      opponent: gameManager.self.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 5,
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      effectiveStrength: 5,
      row: Combat.Close,
    },
  })
  await gameManager.pass({})
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
