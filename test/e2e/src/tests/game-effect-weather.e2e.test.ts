import { Combat, EffectKey, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import { EFFECT_OPERATOR } from '@gwent/constants'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Weather')

test('Weather does not effect hero', async (t) => {
  const unitName1 = 'John Natalis'
  const unitName2 = 'Biting Frost'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    weather: true,
    weathering: [],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.close()
  await GamePage.fullscreenWeatherCard({
    unitName: unitName2,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Weather does not effect unit in another row', async (t) => {
  const unitName1 = 'Sheldon Skaggs'
  const unitName2 = 'Biting Frost'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    weather: true,
    weathering: [],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.close()
  await GamePage.fullscreenWeatherCard({
    unitName: unitName2,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Biting Frost reduces effective strength of close combat unit', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Biting Frost'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    weather: true,
    weathering: [
      {
        effectiveStrength: 1,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName2}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenWeatherCard({
    unitName: unitName2,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Impenetrable Fog reduces effective strength of ranged combat unit', async (t) => {
  const unitName1 = 'Sheldon Skaggs'
  const unitName2 = 'Impenetrable Fog'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    weather: true,
    weathering: [
      {
        effectiveStrength: 1,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName2}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenWeatherCard({
    unitName: unitName2,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Torrential Rain reduces effective strength of ranged combat unit', async (t) => {
  const unitName1 = 'Ballista'
  const unitName2 = 'Torrential Rain'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, combat: Combat.Siege })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    weather: true,
    weathering: [
      {
        effectiveStrength: 1,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Siege,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Siege,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName2}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenWeatherCard({
    unitName: unitName2,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Skellige Storm reduces effective strength of ranged and siege combat units', async (t) => {
  const unitName1 = 'Sheldon Skaggs'
  const unitName2 = 'Ballista'
  const unitName3 = 'Skellige Storm'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({ unitName: unitName2, combat: Combat.Siege })
  await gameManager.initialize({})

  const deckUnit3 = await gameManager.deploy({
    unitName: unitName3,
    weather: true,
    weathering: [
      {
        effectiveStrength: 1,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
      {
        effectiveStrength: 1,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Siege,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName3}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Siege,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName3}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenWeatherCard({
    unitName: unitName3,
  })
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Weather applied if played before unit', async (t) => {
  const unitName1 = 'Biting Frost'
  const unitName2 = 'Ves'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, weather: true, weathering: [] })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 1,
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName1}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenWeatherCard({
    unitName: unitName1,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Weather applies to all players units for that combat', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Yarpen Zigrin'
  const unitName3 = 'Biting Frost'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName3],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  const deckUnit2 = await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  const deckUnit3 = await gameManager.deploy({
    unitName: unitName3,
    weather: true,
    weathering: [
      {
        effectiveStrength: 1,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 1,
        name: unitName2,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName3}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Close,
    self: false,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.opponent.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName3}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenWeatherCard({
    unitName: unitName3,
  })
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Weathers reduce effective strength of all combat units of opponent', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Biting Frost'
  const unitName3 = 'Sheldon Skaggs'
  const unitName4 = 'Impenetrable Fog'
  const unitName5 = 'Ballista'
  const unitName6 = 'Torrential Rain'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName2, unitName4, unitName6],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName3, unitName5],
    },
    opponentFirst: true,
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, combat: Combat.Close })
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    weather: true,
    weathering: [
      {
        effectiveStrength: 1,
        name: unitName1,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  const deckUnit3 = await gameManager.deploy({ unitName: unitName3, combat: Combat.Ranged })
  const deckUnit4 = await gameManager.deploy({
    unitName: unitName4,
    weather: true,
    weathering: [
      {
        effectiveStrength: 1,
        name: unitName3,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })
  const deckUnit5 = await gameManager.deploy({ unitName: unitName5, combat: Combat.Siege })
  await gameManager.initialize({})

  const deckUnit6 = await gameManager.deploy({
    unitName: unitName6,
    weather: true,
    weathering: [
      {
        effectiveStrength: 1,
        name: unitName5,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Siege,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: false,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.opponent.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName2}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenCombatCard({
    unitName: unitName3,
    row: Combat.Ranged,
    self: false,
  })
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.opponent.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName4}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenCombatCard({
    unitName: unitName5,
    row: Combat.Siege,
    self: false,
  })
  await FullCard.verify({
    unit: deckUnit5.unit,
    username: gameManager.opponent.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName6}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenWeatherCard({
    unitName: unitName2,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit4.unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit6.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Successive weathers do not stack', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Biting Frost'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    weather: true,
    weathering: [
      {
        effectiveStrength: 1,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.initialize({})

  const deckUnit3 = await gameManager.deploy({
    unitName: unitName2,
    weather: true,
    weathering: [],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName2}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenWeatherCard({
    unitName: unitName2,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.opponent.gamePlayer.name,
  })
})

test('Clear weather removes all weather effects', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Biting Frost'
  const unitName3 = 'Impenetrable Fog'
  const unitName4 = 'Sheldon Skaggs'
  const unitName5 = 'Ballista'
  const unitName6 = 'Torrential Rain'
  const unitName7 = 'Clear Weather'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName3, unitName5, unitName7],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName2, unitName4, unitName6],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({
    unitName: unitName2,
    weather: true,
    weathering: [
      {
        effectiveStrength: 1,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName3,
    weather: true,
    weathering: [],
  })
  const deckUnit4 = await gameManager.deploy({
    unitName: unitName4,
    effectiveStrength: 1,
  })
  const deckUnit5 = await gameManager.deploy({
    unitName: unitName5,
    combat: Combat.Siege,
  })
  await gameManager.deploy({
    unitName: unitName6,
    combat: Combat.Siege,
    weather: true,
    weathering: [
      {
        effectiveStrength: 1,
        name: unitName5,
        player: gameManager.self.gamePlayer,
        row: Combat.Siege,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName7,
    weather: true,
    impacts: 3,
    weathering: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        effectiveStrength: 5,
        row: Combat.Close,
      },
      {
        name: unitName2,
        player: gameManager.opponent.gamePlayer,
      },
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName4,
        player: gameManager.opponent.gamePlayer,
        effectiveStrength: 4,
        row: Combat.Ranged,
      },
      {
        name: unitName5,
        player: gameManager.self.gamePlayer,
        effectiveStrength: 6,
        row: Combat.Siege,
      },
      {
        name: unitName6,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.close()
  await GamePage.fullscreenCombatCard({
    unitName: unitName4,
    row: Combat.Ranged,
    self: false,
  })
  await FullCard.verify({
    unit: deckUnit4.unit,
    username: gameManager.opponent.gamePlayer.name,
  })
  await FullCard.close()
  await GamePage.fullscreenCombatCard({
    unitName: unitName5,
    row: Combat.Siege,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit5.unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.close()
  await GamePage.toggleImpacts({
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    unitName: unitName7,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Weather,
        round: gameManager.round,
        unitName: unitName7,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: unitName2,
            username: gameManager.opponent.gamePlayer.name,
          },
          {
            unitName: unitName6,
            username: gameManager.opponent.gamePlayer.name,
          },
          {
            unitName: unitName3,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
})

test('Can play weather after Clear Weather', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Clear Weather'
  const unitName3 = 'Biting Frost'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    weather: true,
    weathering: [],
  })
  await gameManager.initialize({})

  const deckUnit3 = await gameManager.deploy({
    unitName: unitName3,
    weather: true,
    weathering: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        effectiveStrength: 1,
        row: Combat.Close,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName3}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenWeatherCard({
    unitName: unitName3,
  })
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
  })
})
