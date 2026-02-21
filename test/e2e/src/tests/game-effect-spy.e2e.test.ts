import { Combat, EffectKey, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import GamePage from '../page-objects/game-page'
import { sortObjectArray } from '@gwent/utils'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Spy')

test('Spy close combat unit', async (t) => {
  const unitName1 = 'Prince Stennis'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
    },
  })
  await gameManager.initialize({})
  const handUnitIds = gameManager.self.deck.hand.map((handUnit) => handUnit.unit.id)

  await gameManager.deploy({
    unitName: unitName1,
    spying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      opponent: gameManager.opponent.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 5,
    },
  })
  const newHandUnits = sortObjectArray({
    array: gameManager.self.deck.hand.filter((handUnit) => !handUnitIds.includes(handUnit.unit.id)),
    sortProperties: ['unit.name', 'unit.id'],
  })
  await GamePage.toggleImpacts({
    round: gameManager.round,
    unitName: unitName1,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Spy,
        round: gameManager.round,
        unitName: unitName1,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: newHandUnits[0].unit.name,
            username: gameManager.self.gamePlayer.name,
          },
          {
            unitName: newHandUnits[1].unit.name,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
})

test('Spy siege combat unit', async (t) => {
  const unitName1 = 'Thaler'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
    },
  })
  await gameManager.initialize({})
  const handUnitIds = gameManager.self.deck.hand.map((handUnit) => handUnit.unit.id)

  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Siege,
    spying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      opponent: gameManager.opponent.gamePlayer,
      row: Combat.Siege,
      effectiveStrength: 1,
    },
  })
  const newHandUnits = sortObjectArray({
    array: gameManager.self.deck.hand.filter((handUnit) => !handUnitIds.includes(handUnit.unit.id)),
    sortProperties: ['unit.name', 'unit.id'],
  })
  await GamePage.toggleImpacts({
    round: gameManager.round,
    unitName: unitName1,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Spy,
        round: gameManager.round,
        unitName: unitName1,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: newHandUnits[0].unit.name,
            username: gameManager.self.gamePlayer.name,
          },
          {
            unitName: newHandUnits[1].unit.name,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
})

test('Spy does not show opponents handed units in impacts', async (t) => {
  const unitName = 'Prince Stennis'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({
    unitName,
    spying: {
      name: unitName,
      player: gameManager.opponent.gamePlayer,
      opponent: gameManager.self.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 5,
    },
  })

  await gameManager.initialize({})
  await GamePage.toggleImpacts({
    round: gameManager.round,
    unitName,
    userName: gameManager.opponent.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Spy,
        round: gameManager.round,
        unitName,
        userName: gameManager.opponent.gamePlayer.name,
        impacts: [
          {
            unitName: 'Unknown',
            username: gameManager.opponent.gamePlayer.name,
          },
          {
            unitName: 'Unknown',
            username: gameManager.opponent.gamePlayer.name,
          },
        ],
      },
    ],
  })
})

test('Spy with 1 unit drawn to hand', async (t) => {
  const unitName1 = 'Mysterious Elf'
  const unitName2 = 'Arachas'
  const unitName3 = 'Arachas Behemoth'
  const unitName4 = 'Crone Brewess'
  const unitName5 = 'Crone Weavess'
  const unitName6 = 'Crone Whispess'
  const unitName7 = "Gaunter O'Dimm"
  const unitName8 = "Gaunter O'Dimm Darkness"
  const unitName9 = 'Ghoul'
  const unitName10 = 'Nekker'
  const unitName11 = 'Vampire: Bruxa'
  const unitName12 = 'Vampire: Ekimmara'
  const unitName13 = 'Vampire: Fleder'
  const unitName14 = 'Botchling'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [
        unitName1,
        unitName2,
        unitName2,
        unitName2,
        unitName3,
        unitName4,
        unitName7,
        unitName9,
        unitName10,
        unitName11,
      ],
      excludeHandUnitNames: [unitName14],
      deckUnitNames: [
        unitName1,
        unitName2,
        unitName2,
        unitName2,
        unitName3,
        unitName4,
        unitName5,
        unitName6,
        unitName7,
        unitName8,
        unitName8,
        unitName8,
        unitName9,
        unitName9,
        unitName9,
        unitName10,
        unitName10,
        unitName10,
        unitName11,
        unitName12,
        unitName13,
        unitName14,
      ],
    },
  })
  await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Siege,
    mustering: [
      {
        name: unitName2,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        hand: true,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName2,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        hand: true,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName2,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        hand: true,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName4,
    mustering: [
      {
        name: unitName5,
        effectiveStrength: 6,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName6,
        effectiveStrength: 6,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName7,
    combat: Combat.Siege,
    mustering: [
      {
        name: unitName8,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName8,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName8,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName9,
    mustering: [
      {
        name: unitName9,
        effectiveStrength: 1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName9,
        effectiveStrength: 1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName10,
    mustering: [
      {
        name: unitName10,
        effectiveStrength: 2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName10,
        effectiveStrength: 2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName11,
    mustering: [
      {
        name: unitName12,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName13,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    spying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      opponent: gameManager.opponent.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 0,
    },
  })
  await GamePage.toggleImpacts({
    round: gameManager.round,
    unitName: unitName1,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Spy,
        round: gameManager.round,
        unitName: unitName1,
        userName: gameManager.self.gamePlayer.name,
        impacts: [
          {
            unitName: unitName14,
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
})

test('Spy with 0 units drawn to hand', async (t) => {
  const unitName1 = 'Mysterious Elf'
  const unitName2 = 'Arachas'
  const unitName3 = 'Arachas Behemoth'
  const unitName4 = 'Crone Brewess'
  const unitName5 = 'Crone Weavess'
  const unitName6 = 'Crone Whispess'
  const unitName7 = "Gaunter O'Dimm"
  const unitName8 = "Gaunter O'Dimm Darkness"
  const unitName9 = 'Ghoul'
  const unitName10 = 'Nekker'
  const unitName11 = 'Vampire: Bruxa'
  const unitName12 = 'Vampire: Ekimmara'
  const unitName13 = 'Vampire: Fleder'
  const unitName14 = 'Botchling'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [
        unitName1,
        unitName3,
        unitName4,
        unitName7,
        unitName9,
        unitName9,
        unitName9,
        unitName10,
        unitName11,
        unitName14,
      ],
      deckUnitNames: [
        unitName1,
        unitName2,
        unitName2,
        unitName2,
        unitName3,
        unitName4,
        unitName5,
        unitName6,
        unitName7,
        unitName8,
        unitName8,
        unitName8,
        unitName9,
        unitName9,
        unitName9,
        unitName10,
        unitName10,
        unitName10,
        unitName11,
        unitName12,
        unitName13,
        unitName14,
      ],
    },
  })
  await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Siege,
    mustering: [
      {
        name: unitName2,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName2,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName2,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName4,
    mustering: [
      {
        name: unitName5,
        effectiveStrength: 6,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName6,
        effectiveStrength: 6,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName7,
    combat: Combat.Siege,
    mustering: [
      {
        name: unitName8,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName8,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName8,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName9,
    mustering: [
      {
        name: unitName9,
        effectiveStrength: 1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        hand: true,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName9,
        effectiveStrength: 1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        hand: true,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName10,
    mustering: [
      {
        name: unitName10,
        effectiveStrength: 2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName10,
        effectiveStrength: 2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName11,
    mustering: [
      {
        name: unitName12,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        name: unitName13,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName14,
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    spying: {
      opponent: gameManager.opponent.gamePlayer,
      player: gameManager.self.gamePlayer,
      name: unitName1,
      row: Combat.Close,
      effectiveStrength: 0,
    },
  })
  await GamePage.toggleImpacts({
    round: gameManager.round,
    unitName: unitName1,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        effectKey: EffectKey.Spy,
        round: gameManager.round,
        unitName: unitName1,
        userName: gameManager.self.gamePlayer.name,
        impacts: [],
      },
    ],
  })
})
