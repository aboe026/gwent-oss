import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { FactionKey } from '@gwent-oss/node-client'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Faction Monsters Ability')

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

// Preserves random unit on battlefield if self with monsters and multiple elibigle unit
// Preserves random unit on battlefield if opponent with monsters and multiple elibigle unit
// Preserves random units on battlefield if both self and opponent with monsters
// Adds history entry with no impacts if self with monsters and no eligible units
// Adds history entry with no impacts if opponent with monsters and no eligible units
// Adds history entries with no impacts if both self and opponent with monsters and no eligible units
// does nothing if neither self not opponent monsters with eligible units

// if unit scorched does not get preserved
// can preserve with avenger
// if preserve bonded unit, bond disappears
// if preserve mustered unit, musters do not follow
// if preserve horned unit, horned effect disappears
// if preserve moraled unit, moraled effect disappears
