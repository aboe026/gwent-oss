import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { Combat, EffectKey, FactionKey } from '@gwent-oss/node-client'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Faction Northern Realms Ability')

test('Moves random unit from undrawn into hand if round won and undrawns available', async (t) => {
  const unitName = 'Ves'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName],
    },
    opponentFirst: true,
  })
  await gameManager.pass({})
  await gameManager.deploy({ unitName })
  const previousHandIds = gameManager.self.deck.hand.map((handUnit) => handUnit.unit.id)
  await gameManager.initialize({})

  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
    factionAbility: {
      gamePlayer: gameManager.self.gamePlayer,
      key: FactionKey.NorthernRealms,
      impacts: 1,
    },
  })
  const handed = gameManager.self.deck.hand.find((handUnit) => !previousHandIds.includes(handUnit.unit.id))
  if (!handed) {
    throw Error('Could not get newly handed unit')
  }

  await GamePage.toggleImpacts({
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    unitName: 'Northern Realms',
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        unitName: 'Northern Realms',
        factionKey: FactionKey.NorthernRealms,
        impacts: [
          {
            unitName: handed?.unit.name,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
})

test('Does nothing if round won and no undrawn available', async (t) => {
  const unitName1 = 'Cirilla Fiona Elen Riannon'
  const unitName2 = "Gaunter O'Dimm"
  const unitName3 = 'Mysterious Elf'
  const unitName4 = 'Prince Stennis'
  const unitName5 = 'Sigismund Dijkstra'
  const unitName6 = 'Thaler'
  const unitName7 = 'Siegfried of Denesle'
  const unitName8 = 'Sile de Tansarville'
  const unitName9 = 'Ves'
  const unitName10 = 'Yarpen Zigrin'
  const unitName11 = 'Roach'
  const unitName12 = "Gaunter O'Dimm Darkness"

  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [
        unitName1,
        unitName2,
        unitName3,
        unitName4,
        unitName5,
        unitName6,
        unitName7,
        unitName8,
        unitName9,
        unitName10,
      ],
      deckUnitNames: [
        unitName1,
        unitName2,
        unitName3,
        unitName4,
        unitName5,
        unitName6,
        unitName7,
        unitName8,
        unitName9,
        unitName10,

        unitName11,
        unitName12,
        unitName12,
        unitName12,
        'Ballista',
        'Dethmold',
        'Keira Metz',
        'Sabrina Glevissig',
        'Sheldon Skaggs',
        'Siege Tower',
        'Trebuchet',
        'Vesemir',
      ],
    },
    opponentFirst: true,
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName1,
    mustering: [
      {
        name: unitName11,
        effectiveStrength: 3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName2,
    mustering: [
      {
        name: unitName12,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
          instances: 0,
        },
      },
      {
        name: unitName12,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
          instances: 0,
        },
      },
      {
        name: unitName12,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
          instances: 0,
        },
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName3,
    spying: {
      name: unitName3,
      effectiveStrength: 0,
      opponent: gameManager.opponent.gamePlayer,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
    },
  })
  await gameManager.deploy({
    unitName: unitName4,
    spying: {
      name: unitName4,
      effectiveStrength: 5,
      opponent: gameManager.opponent.gamePlayer,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
    },
  })
  await gameManager.deploy({
    unitName: unitName5,
    spying: {
      name: unitName5,
      effectiveStrength: 4,
      opponent: gameManager.opponent.gamePlayer,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
    },
  })
  await gameManager.deploy({
    unitName: unitName6,
    spying: {
      name: unitName6,
      effectiveStrength: 1,
      opponent: gameManager.opponent.gamePlayer,
      player: gameManager.self.gamePlayer,
      row: Combat.Siege,
    },
  })
  await gameManager.initialize({})

  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
    factionAbility: {
      gamePlayer: gameManager.self.gamePlayer,
      key: FactionKey.NorthernRealms,
      impacts: 0,
    },
  })

  await GamePage.toggleImpacts({
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    unitName: 'Northern Realms',
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        unitName: 'Northern Realms',
        factionKey: FactionKey.NorthernRealms,
        impacts: [],
      },
    ],
  })
})
