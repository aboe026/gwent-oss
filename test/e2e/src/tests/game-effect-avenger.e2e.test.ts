import { Combat, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Avenger')

test('Single avenger for self summoned after opponent scorch', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Scorch'
  const unitName3 = 'Bovine Defense Force'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        strength: 0,
      },
    ],
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        turn: gameManager.opponent.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  // TODO: verify impacts history
})

test('Avengers for self and opponent summoned after self scorch', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Scorch'
  const unitName3 = 'Bovine Defense Force'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        strength: 0,
      },
      {
        name: unitName1,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Ranged,
        strength: 0,
      },
    ],
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        turn: gameManager.self.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        name: unitName3,
        effectiveStrength: 8,
        turn: gameManager.self.gamePlayer,
        newUnitPlayer: gameManager.opponent.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  // TODO: verify impacts history
})

// avenger opponent from scorch
// avenger self from scorch
// avenger from round ending
// avenger doesn't work when game ends
// multiple different avengers
//
