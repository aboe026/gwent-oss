import { Combat, EffectKey, FactionKey, MoveReasonType } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Avenger')

test('Avenger not summoned when game ends', async (t) => {
  const unitName1 = 'Cow'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1],
    },
  })
  console.log('TEST 0')
  await gameManager.pass({})
  console.log('TEST 1')
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
  })
  console.log('TEST 2')
  await gameManager.initialize({})

  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.pass({
    victors: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
  })
})

test('Single avenger for self summoned after opponent scorch', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Scorch'
  const unitName3 = 'Bovine Defense Force'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        strength: 0,
      },
    ],
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        turn: gameManager.opponent.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await GamePage.toggleImpacts({
    round: gameManager.round,
    unitName: unitName3,
    userName: gameManager.opponent.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Avenger,
        round: gameManager.round,
        unitName: unitName3,
        userName: gameManager.opponent.gamePlayer.name,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
  await GamePage.selectImpactCard({
    move: {
      round: gameManager.round,
      unitName: unitName3,
      userName: gameManager.opponent.gamePlayer.name,
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
    impacts: [
      {
        effectKey: EffectKey.Avenger,
        round: gameManager.round,
        unitName: unitName3,
        userName: gameManager.opponent.gamePlayer.name,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
            dotted: true,
          },
        ],
      },
    ],
  })
})

test('Avengers for self and opponent summoned after self scorch', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Scorch'
  const unitName3 = 'Bovine Defense Force'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        strength: 0,
      },
      {
        name: unitName1,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Ranged,
        strength: 0,
      },
    ],
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        turn: gameManager.self.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        name: unitName3,
        effectiveStrength: 8,
        turn: gameManager.self.gamePlayer,
        newUnitPlayer: gameManager.opponent.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await GamePage.toggleImpacts({
    round: gameManager.round,
    unitName: unitName3,
    userName: gameManager.self.gamePlayer.name,
    instance: 1,
  })
  await GamePage.toggleImpacts({
    round: gameManager.round,
    unitName: unitName3,
    userName: gameManager.self.gamePlayer.name,
    instance: 2,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Avenger,
        round: gameManager.round,
        unitName: unitName3,
        userName: gameManager.self.gamePlayer.name,
        instance: 1,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
      {
        effectKey: EffectKey.Avenger,
        round: gameManager.round,
        unitName: unitName3,
        userName: gameManager.self.gamePlayer.name,
        instance: 2,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.opponent.gamePlayer.name,
          },
        ],
      },
    ],
  })
  await GamePage.selectImpactCard({
    move: {
      round: gameManager.round,
      unitName: unitName3,
      userName: gameManager.self.gamePlayer.name,
      instance: 1,
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
    impacts: [
      {
        effectKey: EffectKey.Avenger,
        round: gameManager.round,
        unitName: unitName3,
        userName: gameManager.self.gamePlayer.name,
        instance: 1,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
            dotted: true,
          },
        ],
      },
    ],
  })
  await GamePage.selectImpactCard({
    move: {
      round: gameManager.round,
      unitName: unitName3,
      userName: gameManager.self.gamePlayer.name,
      instance: 2,
    },
    impact: {
      unitName: unitName1,
      userName: gameManager.opponent.gamePlayer.name,
    },
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.opponent.gamePlayer.name,
      round: gameManager.round,
      row: Combat.Ranged,
      unitName: unitName1,
      dotted: true,
    },
    impacts: [
      {
        effectKey: EffectKey.Avenger,
        round: gameManager.round,
        unitName: unitName3,
        userName: gameManager.self.gamePlayer.name,
        instance: 2,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.opponent.gamePlayer.name,
            dotted: true,
          },
        ],
      },
    ],
  })
  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    row: Combat.Close,
    unitName: unitName3,
    targetUser: gameManager.opponent.gamePlayer.name,
    reason: MoveReasonType.Summon,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
      row: Combat.Close,
      unitName: unitName3,
      targetUser: gameManager.opponent.gamePlayer.name,
      reason: MoveReasonType.Summon,
    },
    highlightedBattlefieldCard: {
      row: Combat.Close,
      unitName: unitName3,
      userName: gameManager.opponent.gamePlayer.name,
    },
  })
  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    row: Combat.Close,
    unitName: unitName3,
    targetUser: gameManager.self.gamePlayer.name,
    reason: MoveReasonType.Summon,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
      row: Combat.Close,
      unitName: unitName3,
      targetUser: gameManager.self.gamePlayer.name,
      reason: MoveReasonType.Summon,
    },
    highlightedBattlefieldCard: {
      row: Combat.Close,
      unitName: unitName3,
      userName: gameManager.self.gamePlayer.name,
    },
  })
})

test('Single avenger for self summoned after round ends', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Bovine Defense Force'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.pass({})
  await gameManager.pass({
    avenging: [
      {
        effectiveStrength: 8,
        name: unitName2,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
        turn: gameManager.self.gamePlayer,
      },
    ],
  })
  await GamePage.toggleImpacts({
    round: gameManager.round,
    unitName: unitName2,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Avenger,
        round: gameManager.round,
        unitName: unitName2,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
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
      round: gameManager.round - 1,
      row: Combat.Ranged,
      unitName: unitName1,
      dotted: true,
    },
    impacts: [
      {
        effectKey: EffectKey.Avenger,
        round: gameManager.round,
        unitName: unitName2,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
            dotted: true,
          },
        ],
      },
    ],
  })
})

test('Multiple avengers for self summoned after round ends', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Kambi'
  const unitName3 = 'Bovine Defense Force'
  const unitName4 = 'Hemdall'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Close,
  })
  await gameManager.pass({
    avenging: [
      {
        effectiveStrength: 11,
        name: unitName4,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
        turn: gameManager.self.gamePlayer,
      },
      {
        effectiveStrength: 8,
        name: unitName3,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
        turn: gameManager.self.gamePlayer,
      },
    ],
  })
  await GamePage.toggleImpacts({
    round: gameManager.round,
    unitName: unitName3,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.toggleImpacts({
    round: gameManager.round,
    unitName: unitName4,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Avenger,
        round: gameManager.round,
        unitName: unitName3,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
      {
        effectKey: EffectKey.Avenger,
        round: gameManager.round,
        unitName: unitName4,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: unitName2,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
  await GamePage.selectImpactCard({
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
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round - 1,
      row: Combat.Ranged,
      unitName: unitName1,
      dotted: true,
    },
    impacts: [
      {
        effectKey: EffectKey.Avenger,
        round: gameManager.round,
        unitName: unitName3,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: unitName1,
            username: gameManager.self.gamePlayer.name,
            dotted: true,
          },
        ],
      },
    ],
  })
  await GamePage.selectImpactCard({
    move: {
      round: gameManager.round,
      unitName: unitName4,
      userName: gameManager.self.gamePlayer.name,
    },
    impact: {
      unitName: unitName2,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round - 1,
      row: Combat.Close,
      unitName: unitName2,
      dotted: true,
    },
    impacts: [
      {
        effectKey: EffectKey.Avenger,
        round: gameManager.round,
        unitName: unitName4,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: unitName2,
            username: gameManager.self.gamePlayer.name,
            dotted: true,
          },
        ],
      },
    ],
  })
  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    row: Combat.Close,
    unitName: unitName3,
    targetUser: gameManager.self.gamePlayer.name,
    reason: MoveReasonType.Summon,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
      row: Combat.Close,
      unitName: unitName3,
      targetUser: gameManager.self.gamePlayer.name,
      reason: MoveReasonType.Summon,
    },
    highlightedBattlefieldCard: {
      row: Combat.Close,
      unitName: unitName3,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    row: Combat.Close,
    unitName: unitName4,
    targetUser: gameManager.self.gamePlayer.name,
    reason: MoveReasonType.Summon,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
      row: Combat.Close,
      unitName: unitName4,
      targetUser: gameManager.self.gamePlayer.name,
      reason: MoveReasonType.Summon,
    },
    highlightedBattlefieldCard: {
      row: Combat.Close,
      unitName: unitName4,
      userName: gameManager.self.gamePlayer.name,
    },
  })
})

test('Multiple avengers for self and opponent summoned after round ends', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Kambi'
  const unitName3 = 'Bovine Defense Force'
  const unitName4 = 'Hemdall'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2],
    },
    opponent: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Close,
  })
  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Close,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
    avenging: [
      {
        effectiveStrength: 11,
        name: unitName4,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
        turn: gameManager.opponent.gamePlayer,
      },
      {
        effectiveStrength: 11,
        name: unitName4,
        newUnitPlayer: gameManager.opponent.gamePlayer,
        row: Combat.Close,
        turn: gameManager.opponent.gamePlayer,
      },
      {
        effectiveStrength: 8,
        name: unitName3,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
        turn: gameManager.opponent.gamePlayer,
      },
      {
        effectiveStrength: 8,
        name: unitName3,
        newUnitPlayer: gameManager.opponent.gamePlayer,
        row: Combat.Close,
        turn: gameManager.opponent.gamePlayer,
      },
    ],
  })
})

test('Scorched avenger not re-avenged after round ends', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Scorch'
  const unitName3 = 'Kambi'
  const unitName4 = 'Bovine Defense Force'
  const unitName5 = 'Hemdall'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName3],
    },
    opponent: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        strength: 0,
      },
    ],
    avenging: [
      {
        name: unitName4,
        effectiveStrength: 8,
        turn: gameManager.opponent.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Close,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
    avenging: [
      {
        effectiveStrength: 11,
        name: unitName5,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
        turn: gameManager.self.gamePlayer,
      },
    ],
  })
  await GamePage.toggleImpacts({
    round: gameManager.round,
    unitName: unitName5,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Avenger,
        round: gameManager.round,
        unitName: unitName5,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: unitName3,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
  await GamePage.selectImpactCard({
    move: {
      round: gameManager.round,
      unitName: unitName5,
      userName: gameManager.self.gamePlayer.name,
    },
    impact: {
      unitName: unitName3,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round - 1,
      row: Combat.Close,
      unitName: unitName3,
      dotted: true,
    },
    impacts: [
      {
        effectKey: EffectKey.Avenger,
        round: gameManager.round,
        unitName: unitName5,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: unitName3,
            username: gameManager.self.gamePlayer.name,
            dotted: true,
          },
        ],
      },
    ],
  })
  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    row: Combat.Close,
    unitName: unitName5,
    targetUser: gameManager.self.gamePlayer.name,
    reason: MoveReasonType.Summon,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
      row: Combat.Close,
      unitName: unitName5,
      targetUser: gameManager.self.gamePlayer.name,
      reason: MoveReasonType.Summon,
    },
    highlightedBattlefieldCard: {
      row: Combat.Close,
      unitName: unitName5,
      userName: gameManager.self.gamePlayer.name,
    },
  })
})
