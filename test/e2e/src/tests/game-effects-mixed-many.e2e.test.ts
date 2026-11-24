import { Combat, FactionKey } from '@gwent-oss/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import { EFFECT_OPERATOR } from '@gwent-oss/constants'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effects Mixed Many')

test('All strength effects applied correctly when performed in order of precedence', async (t) => {
  const unitName1 = 'Biting Frost'
  const unitName2 = 'Blue Stripes Commando'
  const unitName3 = 'Olgierd Von Everec'
  const unitName4 = "Commander's Horn"
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2, unitName2, unitName3, unitName4],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    weather: true,
    weathering: [],
  })
  await gameManager.pass({})
  const deckUnit3 = await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 1,
    bonding: [],
  })
  const deckUnit4 = await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 2,
    bonding: [
      {
        name: unitName2,
        effectiveStrength: 2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Close,
    eligibleCombats: [Combat.Close, Combat.Ranged],
    effectiveStrength: 1,
    moraling: [
      {
        name: unitName2,
        effectiveStrength: 3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        instance: 1,
      },
      {
        name: unitName2,
        effectiveStrength: 3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        instance: 2,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName4,
    modifier: true,
    horning: [
      {
        name: unitName3,
        effectiveStrength: 2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        name: unitName2,
        effectiveStrength: 6,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        instance: 1,
      },
      {
        name: unitName2,
        effectiveStrength: 6,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        instance: 2,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Close,
    self: true,
    instance: 2,
  })
  await FullCard.verify({
    unit: deckUnit4.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 6,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName1}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 2,
        reason: `Bond from ${unitName2}`,
      },
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 3,
        reason: `Morale from ${unitName3}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 6,
        reason: `Horn from ${unitName4}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 6,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName1}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 2,
        reason: `Bond from ${unitName2}`,
      },
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 3,
        reason: `Morale from ${unitName3}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 6,
        reason: `Horn from ${unitName4}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 2,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName1}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 2,
        reason: `Horn from ${unitName4}`,
      },
    ],
  })
})

test('All strength effects applied correctly when performed in reverse order of precedence', async (t) => {
  const unitName1 = "Commander's Horn"
  const unitName2 = 'Olgierd Von Everec'
  const unitName3 = 'Blue Stripes Commando'
  const unitName4 = 'Biting Frost'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2, unitName3, unitName3, unitName4],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    modifier: true,
    horning: [],
  })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Close,
    eligibleCombats: [Combat.Close, Combat.Ranged],
    effectiveStrength: 12,
    moraling: [],
  })
  const deckUnit3 = await gameManager.deploy({
    unitName: unitName3,
    effectiveStrength: 10,
    bonding: [],
  })
  const deckUnit4 = await gameManager.deploy({
    unitName: unitName3,
    effectiveStrength: 18,
    bonding: [
      {
        name: unitName3,
        effectiveStrength: 18,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName4,
    weather: true,
    weathering: [
      {
        name: unitName2,
        player: gameManager.self.gamePlayer,
        effectiveStrength: 2,
        row: Combat.Close,
      },
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        effectiveStrength: 6,
        instance: 1,
        row: Combat.Close,
      },
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        effectiveStrength: 6,
        instance: 2,
        row: Combat.Close,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName3,
    row: Combat.Close,
    self: true,
    instance: 2,
  })
  await FullCard.verify({
    unit: deckUnit4.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 6,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName4}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 2,
        reason: `Bond from ${unitName3}`,
      },
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 3,
        reason: `Morale from ${unitName2}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 6,
        reason: `Horn from ${unitName1}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 6,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName4}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 2,
        reason: `Bond from ${unitName3}`,
      },
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 3,
        reason: `Morale from ${unitName2}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 6,
        reason: `Horn from ${unitName1}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 2,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName4}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 2,
        reason: `Horn from ${unitName1}`,
      },
    ],
  })
})
