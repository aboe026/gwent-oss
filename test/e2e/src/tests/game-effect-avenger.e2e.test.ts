import { Combat, EffectKey, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Avenger')

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
    spyOpponent: gameManager.opponent.gamePlayer.name,
    instance: 1,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
      row: Combat.Close,
      unitName: unitName3,
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
    unitName: unitName3,
    instance: 2,
  })
  await gameManager.verify({
    highlightedHistory: {
      playerName: gameManager.self.gamePlayer.name,
      round: gameManager.round,
      row: Combat.Close,
      unitName: unitName3,
    },
    highlightedBattlefieldCard: {
      row: Combat.Close,
      unitName: unitName3,
      userName: gameManager.opponent.gamePlayer.name,
    },
  })
})

// avenger opponent from scorch
// avenger self from scorch
// avenger from round ending
// avenger doesn't work when game ends
// multiple different avengers
//
