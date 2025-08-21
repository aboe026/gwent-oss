import createGameManager from '../util/game-manager'
import { Combat, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

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
  const deckUnit1 = await gameManager.deploy({ unitName, bonding: [] })
  await gameManager.pass({})

  await gameManager.initialize({})
  const deckUnit2 = await gameManager.deploy({
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
  await GamePage.fullscreenCombatCard({
    unitName: unitName,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 8,
    effects: [
      {
        operator: 'x2',
        strength: 8,
        reason: `Bond from ${unitName}`,
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
        operator: 'x2',
        strength: 8,
        reason: `Bond from ${unitName}`,
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
  const deckUnit1 = await gameManager.deploy({ unitName, bonding: [] })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({
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
  const deckUnit3 = await gameManager.deploy({
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
  await GamePage.fullscreenCombatCard({
    unitName: unitName,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 16,
    effects: [
      {
        operator: 'x2',
        strength: 8,
        reason: `Bond from ${unitName}`,
      },
      {
        operator: 'x2',
        strength: 16,
        reason: `Bond from ${unitName}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 16,
    effects: [
      {
        operator: 'x2',
        strength: 8,
        reason: `Bond from ${unitName}`,
      },
      {
        operator: 'x2',
        strength: 16,
        reason: `Bond from ${unitName}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 16,
    effects: [
      {
        operator: 'x2',
        strength: 8,
        reason: `Bond from ${unitName}`,
      },
      {
        operator: 'x2',
        strength: 16,
        reason: `Bond from ${unitName}`,
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
  const deckUnit1 = await gameManager.deploy({ unitName, bonding: [] })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({
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
  const deckUnit3 = await gameManager.deploy({
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
  const deckUnit4 = await gameManager.deploy({
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
  await GamePage.fullscreenCombatCard({
    unitName: unitName,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 24,
    effects: [
      {
        operator: 'x2',
        strength: 6,
        reason: `Bond from ${unitName}`,
      },
      {
        operator: 'x2',
        strength: 12,
        reason: `Bond from ${unitName}`,
      },
      {
        operator: 'x2',
        strength: 24,
        reason: `Bond from ${unitName}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 24,
    effects: [
      {
        operator: 'x2',
        strength: 6,
        reason: `Bond from ${unitName}`,
      },
      {
        operator: 'x2',
        strength: 12,
        reason: `Bond from ${unitName}`,
      },
      {
        operator: 'x2',
        strength: 24,
        reason: `Bond from ${unitName}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 24,
    effects: [
      {
        operator: 'x2',
        strength: 6,
        reason: `Bond from ${unitName}`,
      },
      {
        operator: 'x2',
        strength: 12,
        reason: `Bond from ${unitName}`,
      },
      {
        operator: 'x2',
        strength: 24,
        reason: `Bond from ${unitName}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit4.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 24,
    effects: [
      {
        operator: 'x2',
        strength: 6,
        reason: `Bond from ${unitName}`,
      },
      {
        operator: 'x2',
        strength: 12,
        reason: `Bond from ${unitName}`,
      },
      {
        operator: 'x2',
        strength: 24,
        reason: `Bond from ${unitName}`,
      },
    ],
  })
})

test('Bond is separate for units with different names', async (t) => {
  const unitName1 = 'Blue Stripes Commando'
  const unitName2 = 'Poor Fucking Infantry'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName1, unitName1, unitName2, unitName2, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({ unitName: unitName2, bonding: [] })
  const deckUnit3 = await gameManager.deploy({
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
  const deckUnit4 = await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 2,
    bonding: [
      {
        effectiveStrength: 2,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  const deckUnit5 = await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 16,
    bonding: [
      {
        effectiveStrength: 16,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 16,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  await gameManager.initialize({})
  const deckUnit6 = await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 4,
    bonding: [
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 4,
    effects: [
      {
        operator: 'x2',
        strength: 2,
        reason: `Bond from ${unitName2}`,
      },
      {
        operator: 'x2',
        strength: 4,
        reason: `Bond from ${unitName2}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit4.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 4,
    effects: [
      {
        operator: 'x2',
        strength: 2,
        reason: `Bond from ${unitName2}`,
      },
      {
        operator: 'x2',
        strength: 4,
        reason: `Bond from ${unitName2}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit6.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 4,
    effects: [
      {
        operator: 'x2',
        strength: 2,
        reason: `Bond from ${unitName2}`,
      },
      {
        operator: 'x2',
        strength: 4,
        reason: `Bond from ${unitName2}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 16,
    effects: [
      {
        operator: 'x2',
        strength: 8,
        reason: `Bond from ${unitName1}`,
      },
      {
        operator: 'x2',
        strength: 16,
        reason: `Bond from ${unitName1}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 16,
    effects: [
      {
        operator: 'x2',
        strength: 8,
        reason: `Bond from ${unitName1}`,
      },
      {
        operator: 'x2',
        strength: 16,
        reason: `Bond from ${unitName1}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit5.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 16,
    effects: [
      {
        operator: 'x2',
        strength: 8,
        reason: `Bond from ${unitName1}`,
      },
      {
        operator: 'x2',
        strength: 16,
        reason: `Bond from ${unitName1}`,
      },
    ],
  })
})

test('Bond is separate for units on different combat rows', async (t) => {
  const unitName1 = 'Blue Stripes Commando'
  const unitName2 = 'Crinfrid Reavers Dragon Hunter'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName1, unitName2, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.pass({})
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
  const deckUnit3 = await gameManager.deploy({ unitName: unitName2, combat: Combat.Ranged, bonding: [] })

  await gameManager.initialize({})
  const deckUnit4 = await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    effectiveStrength: 10,
    bonding: [
      {
        effectiveStrength: 10,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
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
        operator: 'x2',
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
        operator: 'x2',
        strength: 8,
        reason: `Bond from ${unitName1}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 10,
    effects: [
      {
        operator: 'x2',
        strength: 10,
        reason: `Bond from ${unitName2}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit4.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 10,
    effects: [
      {
        operator: 'x2',
        strength: 10,
        reason: `Bond from ${unitName2}`,
      },
    ],
  })
})

test('Bond is separate for same unit as opponent', async (t) => {
  const unitName = 'Blue Stripes Commando'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName, unitName],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName, unitName],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName, bonding: [] })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName, bonding: [] })
  await gameManager.deploy({
    unitName: unitName,
    effectiveStrength: 8,
    bonding: [
      {
        effectiveStrength: 8,
        name: unitName,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  await gameManager.initialize({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName,
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
  await GamePage.fullscreenCombatCard({
    unitName: unitName,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 8,
    effects: [
      {
        operator: 'x2',
        strength: 8,
        reason: `Bond from ${unitName}`,
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
        operator: 'x2',
        strength: 8,
        reason: `Bond from ${unitName}`,
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
        operator: 'x2',
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
        operator: 'x2',
        strength: 8,
        reason: `Bond from ${unitName1}`,
      },
    ],
  })
})

test('Can bond moraled unit', async (t) => {
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
        operator: 'x2',
        strength: 8,
        reason: `Bond from ${unitName2}`,
      },
      {
        operator: '+1',
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
        operator: 'x2',
        strength: 8,
        reason: `Bond from ${unitName2}`,
      },
      {
        operator: '+1',
        strength: 9,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
})
