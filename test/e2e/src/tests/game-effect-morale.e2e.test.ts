import ApiClient from '../util/api-client'
import { Combat, FactionKey, Game } from '@gwent/graphql-schema/resolver-typings'
import { ContextGamePlayer, E2eHelper } from '../util/e2e-helper'
import { E2eCtx, E2ETestController, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import { ensureUnitsInHand } from '@gwent/test-utils'
import env from '../util/env'
import FullCard from '../components/full-card'
import GameManager from '../util/game-manager'
import GamePage from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import { PlayerTurn } from '../components/game-player-info'

interface GameEffectMoraleTestCtx extends E2eCtx {
  scenario: string
  self: ContextGamePlayer
  opponent: ContextGamePlayer
  scoiatael: {
    faction: FactionKey
    leader: string
    units: string[]
  }
  nilfgaard: {
    faction: FactionKey
    leader: string
    units: string[]
  }
  game: Game
}
const fixture = getFixtureCtx<E2eCtx, GameEffectMoraleTestCtx>()
const test = getTestCtx<E2eCtx, GameEffectMoraleTestCtx>()

fixture('Game Effect Morale')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'game-effect-morale'
    const self = await new ApiClient({}).addUser({
      name: `${t.ctx.scenario}-self-${t.ctx.start}`,
    })
    const opponent = await new ApiClient({}).addUser({
      name: `${t.ctx.scenario}-opponent-${t.ctx.start}`,
    })
    const selfClient = new ApiClient({
      username: self.name,
    })
    const opponentClient = new ApiClient({
      username: opponent.name,
    })

    t.ctx.scoiatael = {
      faction: FactionKey.ScoiaTael,
      leader: 'Francesca Findabair the Beautiful',
      units: await E2eHelper.getUnitsForDeck({
        client: selfClient,
        faction: FactionKey.ScoiaTael,
      }),
    }
    t.ctx.nilfgaard = {
      faction: FactionKey.NilfgaardianEmpire,
      leader: 'Emhyr var Emreis the Relentless',
      units: await E2eHelper.getUnitsForDeck({
        client: selfClient,
        faction: FactionKey.NilfgaardianEmpire,
        specials: ['Scorch'],
      }),
    }

    t.ctx.game = await selfClient.addGame([opponent.name])

    const selfDeck = await selfClient.addDeck({
      faction: t.ctx.scoiatael.faction,
      leaderName: t.ctx.scoiatael.leader,
      name: `${t.ctx.scenario}-self-deck-${Date.now()}`,
      unitNames: t.ctx.scoiatael.units,
    })
    const opponentDeck = await opponentClient.addDeck({
      faction: t.ctx.nilfgaard.faction,
      leaderName: t.ctx.nilfgaard.leader,
      name: `${t.ctx.scenario}-opponent-deck-${Date.now()}`,
      unitNames: t.ctx.nilfgaard.units,
    })

    t.ctx.self = {
      user: self,
      client: selfClient,
      deck: selfDeck,
      gameDeck: await selfClient.setDeck({
        deckId: selfDeck.id,
        gameId: t.ctx.game.id,
      }),
    }
    t.ctx.opponent = {
      user: opponent,
      client: opponentClient,
      deck: opponentDeck,
      gameDeck: await opponentClient.setDeck({
        deckId: opponentDeck.id,
        gameId: t.ctx.game.id,
      }),
    }
    await selfClient.setOrder({
      gameId: t.ctx.game.id,
      userIds: [self.id, opponent.id],
    })
    await t.ctx.self.client.ready(t.ctx.game.id)
    await t.ctx.opponent.client.ready(t.ctx.game.id)

    t.ctx.game = await selfClient.getGame(t.ctx.game.id)
  })

test('Morale unit does not effect itself', async (t) => {
  const unitName = 'Milva'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName],
  })
  await gameManager.initialize({})

  const deckUnit = await gameManager.deploy({ unitName })
  await GamePage.fullscreenCombatCard({
    unitName,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
  })
})

test('Morale unit does not effect hero', async (t) => {
  const unitName1 = 'Eithne'
  const unitName2 = 'Milva'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2],
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({ unitName: unitName2 })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
  })
})

test('Morale hero unit not effected by other morale', async (t) => {
  const unitName1 = 'Isengrim Faoiltiarna'
  const unitName2 = 'Olgierd Von Everec'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2],
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 7,
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
    effectiveStrength: 7,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit1.unit,
  })
})

test('Morale unit does not effect unit not in row', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Milva'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2],
  })
  const deckUnit = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName2 })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
  })
})

test('Morale unit does not effect opponent unit', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Albrich'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1],
    opponentHandUnitNames: [unitName2],
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  const deckUnit = await gameManager.deploy({ unitName: unitName2 })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Ranged,
    self: false,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
  })
})

test('Morale effects normal unit if morale played before', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Toruviel'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2],
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 3,
        row: Combat.Ranged,
        name: unitName2,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit1.unit,
  })
})

test('Morale effects normal unit if morale played after', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Milva'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2],
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 3,
        row: Combat.Ranged,
        name: unitName1,
        player: gameManager.self.gamePlayer,
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
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName2}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
  })
})

test('Morale effects multiple normal units', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Ida Emean aep Sivney'
  const unitName3 = 'Milva'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2, unitName3],
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  const deckUnit3 = await gameManager.deploy({
    unitName: unitName3,
    moraling: [
      {
        effectiveStrength: 3,
        row: Combat.Ranged,
        name: unitName1,
        player: gameManager.self.gamePlayer,
      },
      {
        effectiveStrength: 7,
        row: Combat.Ranged,
        name: unitName2,
        player: gameManager.self.gamePlayer,
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
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName3}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
    effectiveStrength: 7,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName3}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit3.unit,
  })
})

test('Multiple morales effect each other', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Olgierd Von Everec'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2],
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    moraling: [
      {
        effectiveStrength: 11,
        row: Combat.Ranged,
        name: unitName1,
        player: gameManager.self.gamePlayer,
      },
      {
        effectiveStrength: 7,
        row: Combat.Ranged,
        name: unitName2,
        player: gameManager.self.gamePlayer,
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
    effectiveStrength: 11,
    effects: [
      {
        operator: '+1',
        strength: 11,
        reason: `Morale from ${unitName2}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit2.unit,
    effectiveStrength: 7,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
})

test('Multiple morales effect themselves and multiple standard units in same row', async (t) => {
  const unitName1 = 'Riordain'
  const unitName2 = 'Ida Emean aep Sivney'
  const unitName3 = 'Milva'
  const unitName4 = 'Olgierd Von Everec'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2, unitName3, unitName4],
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({ unitName: unitName2 })
  const deckUnit3 = await gameManager.deploy({
    unitName: unitName3,
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 2,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName2,
        effectiveStrength: 7,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  await gameManager.initialize({})

  const deckUnit4 = await gameManager.deploy({
    unitName: unitName4,
    combat: Combat.Ranged,
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 3,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName2,
        effectiveStrength: 8,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName3,
        effectiveStrength: 11,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName4,
        effectiveStrength: 7,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
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
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 2,
        reason: `Morale from ${unitName3}`,
      },
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName4}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit4.unit,
    effectiveStrength: 7,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName3}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
    effectiveStrength: 8,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName3}`,
      },
      {
        operator: '+1',
        strength: 8,
        reason: `Morale from ${unitName4}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit3.unit,
    effectiveStrength: 11,
    effects: [
      {
        operator: '+1',
        strength: 11,
        reason: `Morale from ${unitName4}`,
      },
    ],
  })
})

test('Multiple morales effect themselves and multiple standard units in different rows', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Toruviel'
  const unitName3 = 'Isengrim Faoiltiarna'
  const unitName4 = 'Dennis Cranmer'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2, unitName3, unitName4],
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        name: unitName2,
        effectiveStrength: 3,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  const deckUnit3 = await gameManager.deploy({ unitName: unitName3 })
  await gameManager.initialize({})

  const deckUnit4 = await gameManager.deploy({
    unitName: unitName4,
    moraling: [
      {
        name: unitName4,
        effectiveStrength: 7,
        row: Combat.Close,
        player: gameManager.self.gamePlayer,
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
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit2.unit,
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenCombatCard({
    unitName: unitName3,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit3.unit,
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit4.unit,
    effectiveStrength: 7,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName3}`,
      },
    ],
  })
})

test('Can see reason for morale in opponents fullcard details', async (t) => {
  const unitName1 = 'Albrich'
  const unitName2 = 'Olgierd Von Everec'
  const gameManager = await prepareGame({
    t,
    opponentHandUnitNames: [unitName1, unitName2],
  })
  await gameManager.pass({})
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 3,
        row: Combat.Ranged,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: false,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName2}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
  })
})

test('Morale scores persist to end of game', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Olgierd Von Everec'
  const unitName3 = 'Black Infantry Archer'
  const unitName4 = 'Triss Merigold'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2],
    opponentHandUnitNames: [unitName3, unitName4],
  })
  // round 1
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 11,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName2,
        effectiveStrength: 7,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  await gameManager.deploy({ unitName: unitName4 })
  await gameManager.pass({})
  await gameManager.pass({})
  // round 2
  await gameManager.pass({})
  await gameManager.initialize({})
  await gameManager.pass({
    victors: [gameManager.self.gamePlayer.name],
  })
})

test('Morale effect for other units goes away after it gets scorched', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Vreemde'
  const unitName3 = 'Milva'
  const unitName4 = 'Scorch'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName3],
    opponentHandUnitNames: [unitName2, unitName4],
  })
  const deckUnit = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({
    unitName: unitName3,
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 3,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName4,
    scorching: [
      {
        name: unitName3,
        strength: 10,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 2,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
  })
})

async function prepareGame({
  t,
  selfHandUnitNames,
  opponentHandUnitNames,
}: {
  t: E2ETestController<E2eCtx, GameEffectMoraleTestCtx>
  selfHandUnitNames?: string[]
  opponentHandUnitNames?: string[]
}): Promise<GameManager> {
  if (selfHandUnitNames) {
    await ensureUnitsInHand({
      gameId: t.ctx.game.id,
      mongoConnectionString: env.MONGO_URL,
      mongoDatabaseName: env.MONGO_DB,
      unitNames: selfHandUnitNames,
      userId: t.ctx.self.user.id,
    })
  }
  if (opponentHandUnitNames) {
    await ensureUnitsInHand({
      gameId: t.ctx.game.id,
      mongoConnectionString: env.MONGO_URL,
      mongoDatabaseName: env.MONGO_DB,
      unitNames: opponentHandUnitNames,
      userId: t.ctx.opponent.user.id,
    })
  }
  return new GameManager({
    gameId: t.ctx.game.id,
    self: {
      client: t.ctx.self.client,
      deck: await t.ctx.self.client.getGameDeck(t.ctx.game.id),
      gamePlayer: E2eHelper.getGamePlayer({
        player: t.ctx.self,
        turn: PlayerTurn.Current,
        ready: true,
        passed: false,
        score: 0,
      }),
    },
    opponent: {
      client: t.ctx.opponent.client,
      deck: await t.ctx.opponent.client.getGameDeck(t.ctx.game.id),
      gamePlayer: E2eHelper.getGamePlayer({
        player: t.ctx.opponent,
        ready: true,
        score: 0,
      }),
    },
  })
}
