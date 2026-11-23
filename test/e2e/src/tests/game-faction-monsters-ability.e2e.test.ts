import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { FactionKey } from '@gwent-oss/node-client'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Faction Monsters Ability')

test('Cannot preserve hero', async (t) => {
  const unitName = 'Draug'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName],
    },
  })
  await gameManager.deploy({
    unitName,
  })
  await gameManager.pass({})
  await gameManager.initialize({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
    factionAbilities: [
      {
        gamePlayer: gameManager.self.gamePlayer,
        key: FactionKey.Monsters,
        impacts: 0,
      },
    ],
  })

  await GamePage.toggleImpacts({
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    unitName: 'Monsters',
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        unitName: 'Monsters',
        factionKey: FactionKey.Monsters,
        impacts: [],
      },
    ],
  })
})

test('Cannot preserve special', async (t) => {
  const unitName = "Commander's Horn"
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName],
    },
  })
  await gameManager.deploy({
    unitName,
    horning: [],
  })
  await gameManager.pass({})
  await gameManager.initialize({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
    factionAbilities: [
      {
        gamePlayer: gameManager.self.gamePlayer,
        key: FactionKey.Monsters,
        impacts: 0,
      },
    ],
  })

  await GamePage.toggleImpacts({
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    unitName: 'Monsters',
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        unitName: 'Monsters',
        factionKey: FactionKey.Monsters,
        impacts: [],
      },
    ],
  })
})

test('Adds history entry with no impacts if self with monsters and no eligible units', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
    },
    opponent: {
      faction: FactionKey.Skellige,
    },
  })
  await gameManager.pass({})
  await gameManager.initialize({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
    factionAbilities: [
      {
        gamePlayer: gameManager.self.gamePlayer,
        key: FactionKey.Monsters,
        impacts: 0,
      },
    ],
  })

  await GamePage.toggleImpacts({
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    unitName: 'Monsters',
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        unitName: 'Monsters',
        factionKey: FactionKey.Monsters,
        impacts: [],
      },
    ],
  })
})

test('Adds history entry with no impacts if opponent with monsters and no eligible units', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
    },
    opponent: {
      faction: FactionKey.Monsters,
    },
  })
  await gameManager.pass({})
  await gameManager.initialize({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
    factionAbilities: [
      {
        gamePlayer: gameManager.opponent.gamePlayer,
        key: FactionKey.Monsters,
        impacts: 0,
      },
    ],
  })

  await GamePage.toggleImpacts({
    userName: gameManager.opponent.gamePlayer.name,
    round: gameManager.round,
    unitName: 'Monsters',
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.opponent.gamePlayer.name,
        round: gameManager.round,
        unitName: 'Monsters',
        factionKey: FactionKey.Monsters,
        impacts: [],
      },
    ],
  })
})

test('Adds history entry with no impacts if self and opponent with monsters and no eligible units', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
    },
    opponent: {
      faction: FactionKey.Monsters,
    },
  })
  await gameManager.pass({})
  await gameManager.initialize({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
    factionAbilities: [
      {
        gamePlayer: gameManager.self.gamePlayer,
        key: FactionKey.Monsters,
        impacts: 0,
      },
      {
        gamePlayer: gameManager.opponent.gamePlayer,
        key: FactionKey.Monsters,
        impacts: 0,
      },
    ],
  })

  await GamePage.toggleImpacts({
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    unitName: 'Monsters',
  })
  await GamePage.toggleImpacts({
    userName: gameManager.opponent.gamePlayer.name,
    round: gameManager.round,
    unitName: 'Monsters',
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        unitName: 'Monsters',
        factionKey: FactionKey.Monsters,
        impacts: [],
      },
      {
        userName: gameManager.opponent.gamePlayer.name,
        round: gameManager.round,
        unitName: 'Monsters',
        factionKey: FactionKey.Monsters,
        impacts: [],
      },
    ],
  })
})

test('Preserves random unit on battlefield if self with monsters faction and single elibigle unit', async (t) => {
  const unitName = 'Botchling'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName],
    },
  })
  await gameManager.deploy({
    unitName,
  })
  await gameManager.pass({})
  await gameManager.initialize({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
    factionAbilities: [
      {
        gamePlayer: gameManager.self.gamePlayer,
        key: FactionKey.Monsters,
        impacts: 1,
      },
    ],
  })

  await GamePage.toggleImpacts({
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    unitName: 'Monsters',
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        unitName: 'Monsters',
        factionKey: FactionKey.Monsters,
        impacts: [
          {
            unitName,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
})

test('Preserves random unit on battlefield if self with monsters faction and single elibigle unit', async (t) => {
  const unitName1 = 'Botchling'
  const unitName2 = 'Forktail'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
  })
  await gameManager.initialize({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
    factionAbilities: [
      {
        gamePlayer: gameManager.self.gamePlayer,
        key: FactionKey.Monsters,
        impacts: 1,
      },
    ],
  })

  await GamePage.toggleImpacts({
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    unitName: 'Monsters',
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        unitName: 'Monsters',
        factionKey: FactionKey.Monsters,
        impacts: [
          {
            unitName: (
              await gameManager.self.client.getGameUnits({
                gameId: gameManager.gameId,
                playerId: (await gameManager.self.client.currentUser()).id,
              })
            )[0].unit.name,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
})

test('Preserves random unit on battlefield if opponent with monsters faction and single elibigle unit', async (t) => {
  const unitName = 'Botchling'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
    },
    opponent: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({
    unitName,
  })
  await gameManager.pass({})
  await gameManager.initialize({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
    factionAbilities: [
      {
        gamePlayer: gameManager.opponent.gamePlayer,
        key: FactionKey.Monsters,
        impacts: 1,
      },
    ],
  })

  await GamePage.toggleImpacts({
    userName: gameManager.opponent.gamePlayer.name,
    round: gameManager.round,
    unitName: 'Monsters',
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.opponent.gamePlayer.name,
        round: gameManager.round,
        unitName: 'Monsters',
        factionKey: FactionKey.Monsters,
        impacts: [
          {
            unitName,
            username: gameManager.opponent.gamePlayer.name,
          },
        ],
      },
    ],
  })
})

test('Preserves random units on battlefield if both self and opponent with monsters', async (t) => {
  const unitName1 = 'Botchling'
  const unitName2 = 'Fiend'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1],
    },
    opponent: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
  })
  await gameManager.deploy({
    unitName: unitName2,
  })
  await gameManager.pass({})
  await gameManager.initialize({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
    factionAbilities: [
      {
        gamePlayer: gameManager.self.gamePlayer,
        key: FactionKey.Monsters,
        impacts: 1,
      },
      {
        gamePlayer: gameManager.opponent.gamePlayer,
        key: FactionKey.Monsters,
        impacts: 1,
      },
    ],
  })

  await GamePage.toggleImpacts({
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    unitName: 'Monsters',
  })
  await GamePage.toggleImpacts({
    userName: gameManager.opponent.gamePlayer.name,
    round: gameManager.round,
    unitName: 'Monsters',
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        unitName: 'Monsters',
        factionKey: FactionKey.Monsters,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
      {
        userName: gameManager.opponent.gamePlayer.name,
        round: gameManager.round,
        unitName: 'Monsters',
        factionKey: FactionKey.Monsters,
        impacts: [
          {
            unitName: unitName2,
            username: gameManager.opponent.gamePlayer.name,
          },
        ],
      },
    ],
  })
})
