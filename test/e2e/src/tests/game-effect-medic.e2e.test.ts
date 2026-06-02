import { Combat, EffectKey, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Medic')

test('Medic has no effect if no units in discard', async (t) => {
  const unitName = 'Dun Banner Medic'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName,
    medicing: false,
  })

  await GamePage.toggleImpacts({
    unitName,
    round: gameManager.round,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        unitName,
        round: gameManager.round,
        userName: gameManager.self.gamePlayer.name,
        effectKey: EffectKey.Medic,
        impacts: [],
      },
    ],
  })
})

test('Medic has no effect if only hero in discard', async (t) => {
  const unitName1 = 'Vernon Roche'
  const unitName2 = 'Dun Banner Medic'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
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
    combat: Combat.Siege,
    medicing: false,
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
        impacts: [],
      },
    ],
  })
})

test('Medic has no effect if only special in discard', async (t) => {
  const unitName1 = 'Biting Frost'
  const unitName2 = 'Dun Banner Medic'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    weather: true,
    weathering: [],
  })
  await gameManager.pass({})
  await gameManager.pass({})
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Siege,
    medicing: false,
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
        impacts: [],
      },
    ],
  })
})

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

test('Medic revives medic in discard', async (t) => {
  const unitName1 = 'Etolian Auxiliary Archers'
  const unitName2 = 'Menno Coehoorn'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
    medicing: false,
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
    combat: Combat.Ranged,
    medicing: false,
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
  await GamePage.toggleImpacts({
    unitName: unitName1,
    round: gameManager.round,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        unitName: unitName1,
        round: gameManager.round,
        userName: gameManager.self.gamePlayer.name,
        effectKey: EffectKey.Medic,
        impacts: [],
      },
    ],
  })
})

test('Medic revives medic and unit in discard', async (t) => {
  const unitName1 = 'Rainfarn'
  const unitName2 = 'Etolian Auxiliary Archers'
  const unitName3 = 'Menno Coehoorn'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    medicing: false,
  })
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    medicing: true,
  })
  await GamePage.toggleImpacts({
    unitName: unitName3,
    round: gameManager.round,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        unitName: unitName3,
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
    unitName: unitName2,
    combat: Combat.Ranged,
    medicing: true,
    revivedBy: unitName3,
  })

  await GamePage.toggleImpacts({
    unitName: unitName2,
    round: gameManager.round,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        unitName: unitName3,
        round: gameManager.round,
        userName: gameManager.self.gamePlayer.name,
        effectKey: EffectKey.Medic,
        impacts: [
          {
            unitName: unitName2,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
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
        unitName: unitName3,
        round: gameManager.round,
        userName: gameManager.self.gamePlayer.name,
        effectKey: EffectKey.Medic,
        impacts: [
          {
            unitName: unitName2,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
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
