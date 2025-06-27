import ApiClient from '../util/api-client'
import { FactionKey, Game } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import GamePage from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { ContextGamePlayer, E2eHelper } from '../util/e2e-helper'
import { PlayerTurn } from '../components/game-player-info'
import { ensureUnitsInHand, redrawExactUnit } from '@gwent/test-utils'
import env from '../util/e2e-env'
import RedrawUnits from '../components/redraw-units'
import FullCard from '../components/full-card'

interface GameRedrawHighlightTestCtx extends E2eCtx {
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
const fixture = getFixtureCtx<E2eCtx, GameRedrawHighlightTestCtx>()
const test = getTestCtx<E2eCtx, GameRedrawHighlightTestCtx>()

fixture('Game Redraw Highlight')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'game-redrawing'
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
      leader: 'Francesca Findabair Pureblood Elf',
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

    t.ctx.game = await selfClient.getGame(t.ctx.game.id)

    await LoginPage.login({
      username: t.ctx.self.user.name,
    })
  })

test('Selecting hand card without redraws toggles highlight of first available redraw', async (t) => {
  const unitName = 'Dennis Cranmer'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    unitNames: [unitName],
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Future,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [],
  })
  await GamePage.selectHandUnit({
    unitName,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          highlighted: true,
        },
      },
      {
        from: {},
      },
    ],
    highlightedHandCard: {
      unitName,
    },
  })
  await GamePage.selectHandUnit({
    unitName,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [],
  })
})

test('Selecting first from card highlights it dotted', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Yaevinn'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    unitNames: [unitName1],
    excludeNames: [unitName2],
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: t.ctx.self.gameDeck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: t.ctx.self.gameDeck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Future,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await RedrawUnits.selectRedrawnCard({
    pair: 1,
    from: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          highlighted: true,
          dotted: true,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
  await RedrawUnits.selectRedrawnCard({
    pair: 1,
    from: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('Fullscreening first from card highlights it dotted', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Yaevinn'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    unitNames: [unitName1],
    excludeNames: [unitName2],
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: t.ctx.self.gameDeck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: t.ctx.self.gameDeck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Future,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await RedrawUnits.fullscreenRedrawnCard({
    pair: 1,
    from: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          highlighted: true,
          dotted: true,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
  await FullCard.close()
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          highlighted: true,
          dotted: true,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
  await RedrawUnits.selectRedrawnCard({
    pair: 1,
    from: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('Selecting first to card highlights it and hand card', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Yaevinn'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    unitNames: [unitName1],
    excludeNames: [unitName2],
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: t.ctx.self.gameDeck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: t.ctx.self.gameDeck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Future,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await RedrawUnits.selectRedrawnCard({
    pair: 1,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await RedrawUnits.selectRedrawnCard({
    pair: 1,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('Fullscreening first to card highlights it and hand card', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Yaevinn'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    unitNames: [unitName1],
    excludeNames: [unitName2],
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: t.ctx.self.gameDeck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: t.ctx.self.gameDeck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Future,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await RedrawUnits.fullscreenRedrawnCard({
    pair: 1,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await FullCard.close()
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await RedrawUnits.selectRedrawnCard({
    pair: 1,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('Selecting first redrawn hand card highlights it and redraw card', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Yaevinn'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    unitNames: [unitName1],
    excludeNames: [unitName2],
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: t.ctx.self.gameDeck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: t.ctx.self.gameDeck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Future,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await GamePage.selectHandUnit({
    unitName: toUnit.unit.name,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await GamePage.selectHandUnit({
    unitName: toUnit.unit.name,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('Fullscreening first redrawn hand card highlights it and redraw card', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Yaevinn'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    unitNames: [unitName1],
    excludeNames: [unitName2],
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: t.ctx.self.gameDeck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: t.ctx.self.gameDeck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Future,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await GamePage.fullscreenHandCard(toUnit.unit.name)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await FullCard.close()
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await GamePage.selectHandUnit({
    unitName: toUnit.unit.name,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('First to card highlight toggled by both hand and redraw card', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Yaevinn'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    unitNames: [unitName1],
    excludeNames: [unitName2],
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: t.ctx.self.gameDeck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: t.ctx.self.gameDeck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Future,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await GamePage.selectHandUnit({
    unitName: toUnit.unit.name,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await RedrawUnits.selectRedrawnCard({
    pair: 1,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await RedrawUnits.selectRedrawnCard({
    pair: 1,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await GamePage.selectHandUnit({
    unitName: toUnit.unit.name,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('Selecting hand card with redraw toggles highlight of last available redraw', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Yaevinn'
  const unitName3 = 'Barclay Els'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    unitNames: [unitName1, unitName3],
    excludeNames: [unitName2],
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: t.ctx.self.gameDeck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: t.ctx.self.gameDeck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Future,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
  await GamePage.selectHandUnit({
    unitName: unitName3,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: unitName3,
    },
  })
  await GamePage.selectHandUnit({
    unitName: unitName3,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('Redrawing first to card highlight toggled by to or from', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Yaevinn'
  const unitName3 = 'Barclay Els'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    unitNames: [unitName1],
    excludeNames: [unitName2, unitName3],
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const toUnit1 = await E2eHelper.getUndrawnUnit({
    deck: t.ctx.self.gameDeck,
    name: unitName2,
  })
  const toUnit2 = await E2eHelper.getUndrawnUnit({
    deck: t.ctx.self.gameDeck,
    name: unitName3,
  })
  await redrawExactUnit({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: t.ctx.self.gameDeck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit1.unit.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await redrawExactUnit({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: t.ctx.self.user.id,
    fromId: toUnit1.unit.id,
    toId: toUnit2.unit.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Future,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit1.unit.name,
        },
      },
      {
        from: {
          unitName: toUnit1.unit.name,
        },
        to: {
          unitName: toUnit2.unit.name,
        },
      },
    ],
  })

  await RedrawUnits.selectRedrawnCard({
    pair: 1,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          highlighted: true,
          dotted: true,
        },
      },
      {
        from: {
          highlighted: true,
          dotted: true,
        },
        to: {
          unitName: toUnit2.unit.name,
        },
      },
    ],
  })
  await RedrawUnits.selectRedrawnCard({
    pair: 2,
    from: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit1.unit.name,
        },
      },
      {
        from: {
          unitName: toUnit1.unit.name,
        },
        to: {
          unitName: toUnit2.unit.name,
        },
      },
    ],
  })
})
