import { Combat, EffectKey, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effects Mixed Medic')

test('Agile unit can be revived to same combat row', async (t) => {
  const unitName1 = 'Yaevinn'
  const unitName2 = 'Havekar Healer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
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
    eligibleCombats: [Combat.Close, Combat.Ranged],
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

test('Agile unit can be revived to different combat row', async (t) => {
  const unitName1 = 'Yaevinn'
  const unitName2 = 'Havekar Healer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
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
    combat: Combat.Ranged,
    eligibleCombats: [Combat.Close, Combat.Ranged],
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

// TODO: medicing BDF or Hemdall

test('Bonded units can rebond after revival', async (t) => {
  const unitName1 = 'Blue Stripes Commando'
  const unitName2 = 'Dun Banner Medic'
  const unitName3 = 'Yennefer of Vengerberg'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName1, unitName2, unitName3],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    bonding: [],
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 8,
    bonding: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 8,
      },
    ],
  })
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
    bonding: [],
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

  await gameManager.pass({})

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
    unitName: unitName1,
    effectiveStrength: 8,
    bonding: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 8,
      },
    ],
    revivedBy: unitName3,
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
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
})

test('Horned units can rehorn after revival', async (t) => {
  const unitName1 = 'Blueboy Lugos'
  const unitName2 = 'Dandelion'
  const unitName3 = 'Yennefer of Vengerberg'
  const unitName4 = 'Birna Bran'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2, unitName3, unitName4],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    horning: [
      {
        name: unitName1,
        effectiveStrength: 12,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Ranged,
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
    unitName: unitName1,
    revivedBy: unitName3,
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
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })

  await gameManager.pass({})

  await gameManager.deploy({
    unitName: unitName4,
    medicing: true,
  })
  await GamePage.toggleImpacts({
    unitName: unitName4,
    round: gameManager.round,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        unitName: unitName4,
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
    revivedBy: unitName4,
    horning: [
      {
        name: unitName1,
        effectiveStrength: 12,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        name: unitName4,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        unitName: unitName4,
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
    ],
  })
})

// TODO: decoyed medic can revive another unit
