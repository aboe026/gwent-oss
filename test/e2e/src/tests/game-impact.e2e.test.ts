import { Combat, EffectKey, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Impact')

test('Shows no eligibles text if Morale but no impacts', async (t) => {
  const unitName = 'Milva'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.deploy({ unitName, moraling: [] })
  await gameManager.initialize({})

  await GamePage.toggleImpacts({
    unitName,
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Morale,
        unitName,
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        impacts: [],
      },
    ],
  })
})

test('Shows no eligibles text if Scorch but no impacts', async (t) => {
  const unitName = 'Schirru'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.deploy({ unitName, scorching: [] })
  await gameManager.initialize({})

  await GamePage.toggleImpacts({
    unitName,
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Scorch,
        unitName,
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        impacts: [],
      },
    ],
  })
})

test('Shows single entry if Morale impacts single unit', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Milva'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 3,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })

  await GamePage.toggleImpacts({
    unitName: unitName2,
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Morale,
        unitName: unitName2,
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        impacts: [
          {
            username: gameManager.self.gamePlayer.name,
            unitName: unitName1,
          },
        ],
      },
    ],
  })
})

test('Shows single entry if Scorch impacts single unit self', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        strength: 2,
      },
    ],
  })

  await GamePage.toggleImpacts({
    unitName: unitName2,
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Scorch,
        unitName: unitName2,
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        impacts: [
          {
            username: gameManager.self.gamePlayer.name,
            unitName: unitName1,
          },
        ],
      },
    ],
  })
})

test('Shows single entry if Scorch impacts single unit opponent', async (t) => {
  const unitName1 = 'Siegfried of Denesle'
  const unitName2 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Close,
        strength: 5,
      },
    ],
  })

  await GamePage.toggleImpacts({
    unitName: unitName2,
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Scorch,
        unitName: unitName2,
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        impacts: [
          {
            username: gameManager.opponent.gamePlayer.name,
            unitName: unitName1,
          },
        ],
      },
    ],
  })
})

test('Shows multiple entries if Morale impacts multiple units', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Ida Emean aep Sivney'
  const unitName3 = 'Milva'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName3,
    moraling: [
      {
        effectiveStrength: 3,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
      {
        effectiveStrength: 7,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })

  await GamePage.toggleImpacts({
    unitName: unitName3,
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Morale,
        unitName: unitName3,
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        impacts: [
          {
            username: gameManager.self.gamePlayer.name,
            unitName: unitName2,
          },
          {
            username: gameManager.self.gamePlayer.name,
            unitName: unitName1,
          },
        ],
      },
    ],
  })
})

test('Shows multiple entries if Scorch impacts multiple units', async (t) => {
  const unitName1 = 'Emiel Regis Rohellec Terzieff'
  const unitName2 = 'Renuald aep Matsen'
  const unitName3 = 'Zoltan Chivay'
  const unitName4 = 'Zerrikanian Fire Scorpion'
  const unitName5 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3, unitName5],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName2, unitName4],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2, combat: Combat.Ranged })
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.deploy({ unitName: unitName4, combat: Combat.Siege })
  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName5,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        strength: 5,
      },
      {
        name: unitName2,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Ranged,
        strength: 5,
      },
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        strength: 5,
      },
      {
        name: unitName4,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Siege,
        strength: 5,
      },
    ],
  })

  await GamePage.toggleImpacts({
    unitName: unitName5,
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Scorch,
        unitName: unitName5,
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        impacts: [
          {
            username: gameManager.opponent.gamePlayer.name,
            unitName: unitName2,
          },
          {
            username: gameManager.opponent.gamePlayer.name,
            unitName: unitName4,
          },
          {
            username: gameManager.self.gamePlayer.name,
            unitName: unitName1,
          },
          {
            username: gameManager.self.gamePlayer.name,
            unitName: unitName3,
          },
        ],
      },
    ],
  })
})

test('Impact highlighted when unit selected on battlefield', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Milva'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 3,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })
  await gameManager.initialize({})

  await GamePage.selectBattlefieldCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: true,
  })
  await gameManager.verify({
    highlightedBattlefieldCard: {
      row: Combat.Ranged,
      unitName: unitName1,
    },
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
      row: Combat.Ranged,
      unitName: unitName1,
    },
  })
  await GamePage.toggleImpacts({
    unitName: unitName2,
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Morale,
        round: gameManager.round,
        unitName: unitName2,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
            highlighted: true,
          },
        ],
      },
    ],
  })
})

test('Battlefield and history unit highlighted when selected in impact', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Milva'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 3,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })
  await gameManager.initialize({})

  await GamePage.toggleImpacts({
    unitName: unitName2,
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await GamePage.selectImpactCard({
    move: {
      round: gameManager.round,
      unitName: unitName2,
      userName: gameManager.self.gamePlayer.name,
    },
    impact: {
      unitName: unitName1,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await gameManager.verify({
    highlightedBattlefieldCard: {
      row: Combat.Ranged,
      unitName: unitName1,
    },
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
      row: Combat.Ranged,
      unitName: unitName1,
    },
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Morale,
        round: gameManager.round,
        unitName: unitName2,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
            highlighted: true,
          },
        ],
      },
    ],
  })
})

test('History unit highlighted when scorched unit selected in impact', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        strength: 2,
      },
    ],
  })
  await gameManager.initialize({})

  await GamePage.toggleImpacts({
    unitName: unitName2,
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await GamePage.selectImpactCard({
    move: {
      round: gameManager.round,
      unitName: unitName2,
      userName: gameManager.self.gamePlayer.name,
    },
    impact: {
      unitName: unitName1,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
      row: Combat.Ranged,
      unitName: unitName1,
      dotted: true,
    },
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Scorch,
        round: gameManager.round,
        unitName: unitName2,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
            highlighted: true,
            dotted: true,
          },
        ],
      },
    ],
  })
})

test('FullUnit for impact preserves effects in time', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Olgierd Von Everec'
  const unitName3 = 'Milva'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    moraling: [
      {
        effectiveStrength: 3,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName3,
    impacts: 2,
    moraling: [
      {
        effectiveStrength: 4,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
      {
        effectiveStrength: 7,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
      {
        effectiveStrength: 11,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })
  await gameManager.initialize({})

  await GamePage.toggleImpacts({
    unitName: unitName2,
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await GamePage.toggleImpacts({
    unitName: unitName3,
    userName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Morale,
        unitName: unitName2,
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        impacts: [
          {
            username: gameManager.self.gamePlayer.name,
            unitName: unitName1,
          },
        ],
      },
      {
        effectKey: EffectKey.Morale,
        unitName: unitName3,
        userName: gameManager.self.gamePlayer.name,
        round: gameManager.round,
        impacts: [
          {
            username: gameManager.self.gamePlayer.name,
            unitName: unitName2,
          },
          {
            username: gameManager.self.gamePlayer.name,
            unitName: unitName1,
          },
        ],
      },
    ],
  })

  await GamePage.selectImpactImage({
    move: {
      round: gameManager.round,
      unitName: unitName2,
      userName: gameManager.self.gamePlayer.name,
    },
    impact: {
      unitName: unitName1,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await FullCard.verify({
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName2}`,
      },
    ],
    unit: deckUnit1.unit,
  })
  await FullCard.close()

  await GamePage.selectImpactImage({
    move: {
      round: gameManager.round,
      unitName: unitName3,
      userName: gameManager.self.gamePlayer.name,
    },
    impact: {
      unitName: unitName1,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await FullCard.verify({
    effectiveStrength: 4,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName2}`,
      },
      {
        operator: '+1',
        strength: 4,
        reason: `Morale from ${unitName3}`,
      },
    ],
    unit: deckUnit1.unit,
  })
})

// TODO: test round 2/3?
// TODO: test highlight works properly with multiple units with same name
// TODO: test that impact that happens twice (moraled then scorched) shows up twice and each highlights the other
// TODO: test that selecting battlefield unit still scrolls to first one (maybe edit existing text in the other fixture)
