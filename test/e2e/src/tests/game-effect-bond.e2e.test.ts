import createGameManager from '../util/game-manager'
import { Combat, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Bond')

test('Bond multiplies base strengths by 2 when single other bonded unit present', async (t) => {
  const unitName = 'Blue Stripes Commando'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName, unitName],
    },
  })
  await gameManager.deploy({ unitName, bonding: [] })
  await gameManager.pass({})

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName,
    effectiveStrength: 8,
    bonding: [
      {
        effectiveStrength: 8,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Bond multiplies base strengths by 4 when two other bonded units present', async (t) => {
  const unitName = 'Blue Stripes Commando'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName, unitName, unitName],
    },
  })
  await gameManager.deploy({ unitName, bonding: [] })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName,
    effectiveStrength: 8,
    bonding: [
      {
        effectiveStrength: 8,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName,
    effectiveStrength: 16,
    bonding: [
      {
        effectiveStrength: 16,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 16,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Bond multiplies base strengths by 8 when three other bonded units present', async (t) => {
  const unitName = 'Impera Brigade Guard'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName, unitName, unitName, unitName],
    },
  })
  await gameManager.deploy({ unitName, bonding: [] })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName,
    effectiveStrength: 6,
    bonding: [
      {
        effectiveStrength: 6,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.deploy({
    unitName,
    effectiveStrength: 12,
    bonding: [
      {
        effectiveStrength: 12,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 12,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName,
    effectiveStrength: 24,
    bonding: [
      {
        effectiveStrength: 24,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 24,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 24,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})
