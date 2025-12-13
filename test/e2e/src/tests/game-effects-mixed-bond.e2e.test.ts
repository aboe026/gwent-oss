import { Combat, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import { EFFECT_OPERATOR } from '@gwent/constants'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effects Mixed Bond')

test('Bond applied before morale', async (t) => {
  const unitName1 = 'Olgierd Von Everec'
  const unitName2 = 'Blue Stripes Commando'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, moraling: [] })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 5,
    bonding: [],
  })

  await gameManager.initialize({})
  const deckUnit3 = await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 9,
    bonding: [
      {
        effectiveStrength: 9,
        name: unitName2,
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
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 9,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 8,
        reason: `Bond from ${unitName2}`,
      },
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 9,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 9,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 8,
        reason: `Bond from ${unitName2}`,
      },
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 9,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
})

test('Bond does not take into account scorched units', async (t) => {
  const unitName1 = 'Blue Stripes Commando'
  const unitName2 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName1, unitName1],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        strength: 4,
      },
    ],
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.pass({})

  await gameManager.initialize({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 8,
    bonding: [
      {
        effectiveStrength: 8,
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
    effectiveStrength: 8,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 8,
        reason: `Bond from ${unitName1}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 8,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 8,
        reason: `Bond from ${unitName1}`,
      },
    ],
  })
})
