import ApiClient, { AddDeckInput } from '../util/api-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { E2eHelper } from '../util/e2e-helper'
import GamesPage from '../page-objects/games-page'
import { FactionKey, Game, GameStatus, User } from '@gwent/graphql-schema/resolver-typings'
import LoginPage from '../page-objects/login-page'

interface GamesStatusTestCtx extends E2eCtx {
  self: {
    user: User
    client: ApiClient
  }
  opponent: {
    user: User
    client: ApiClient
  }
  scoiaTael: AddDeckInput
  nilfgaard: AddDeckInput
  game: Game
}
const fixture = getFixtureCtx<E2eCtx, GamesStatusTestCtx>()
const test = getTestCtx<E2eCtx, GamesStatusTestCtx>()

fixture('Games Status')
  .page(GamesPage.getUrl())
  .beforeEach(async (t) => {
    const selfUsername = `${getScenario(t)}-self-${t.ctx.start}`
    const opponentUsername = `${getScenario(t)}-opponent-${t.ctx.start}`

    t.ctx.self = {
      user: await new ApiClient({}).addUser({
        name: selfUsername,
      }),
      client: new ApiClient({
        username: selfUsername,
      }),
    }
    t.ctx.opponent = {
      user: await new ApiClient({}).addUser({
        name: opponentUsername,
      }),
      client: new ApiClient({
        username: opponentUsername,
      }),
    }

    t.ctx.scoiaTael = {
      name: `${getScenario(t)}-scoiatael-deck-${t.ctx.start}`,
      faction: FactionKey.ScoiaTael,
      leaderName: 'Francesca Findabair Queen of Dol Blathanna',
      unitNames: await E2eHelper.getUnitsForDeck({
        client: t.ctx.self.client,
        faction: FactionKey.ScoiaTael,
      }),
    }
    t.ctx.nilfgaard = {
      name: `${getScenario(t)}-nilfgaard-deck-${t.ctx.start}`,
      faction: FactionKey.NilfgaardianEmpire,
      leaderName: 'Emhyr var Emreis the Relentless',
      unitNames: await E2eHelper.getUnitsForDeck({
        client: t.ctx.self.client,
        faction: FactionKey.NilfgaardianEmpire,
      }),
    }

    t.ctx.game = await t.ctx.self.client.addGame([t.ctx.opponent.user.name])
  })

test('Automatically updated with ordering status if decks set through API and self is scoitael', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck(t.ctx.scoiaTael)
  const opponentDeck = await t.ctx.opponent.client.addDeck(t.ctx.nilfgaard)
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Decking,
      },
    ],
  })
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Ordering,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
})

test('Automatically updated with ordering status if decks set through API and opponent is scoitael', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck(t.ctx.nilfgaard)
  const opponentDeck = await t.ctx.opponent.client.addDeck(t.ctx.scoiaTael)
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Decking,
      },
    ],
  })
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Ordering,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.ScoiaTael],
      },
    ],
  })
})

test('Games page updated with redrawing status if order set by self through API', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck(t.ctx.scoiaTael)
  const opponentDeck = await t.ctx.opponent.client.addDeck(t.ctx.nilfgaard)
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Ordering,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
})

test('Games page updated with redrawing status if order set by opponent through API', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck(t.ctx.nilfgaard)
  const opponentDeck = await t.ctx.opponent.client.addDeck(t.ctx.scoiaTael)
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Ordering,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.ScoiaTael],
      },
    ],
  })
  await t.ctx.opponent.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.opponent.user.id, t.ctx.self.user.id],
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.ScoiaTael],
      },
    ],
  })
})

test('Games page updated with redrawing status if decks set through API by self last', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck(t.ctx.nilfgaard)
  const opponentDeck = await t.ctx.opponent.client.addDeck(t.ctx.nilfgaard)
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Decking,
      },
    ],
  })
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
})

test('Games page updated with redrawing status if decks set through API by opponent last', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck(t.ctx.nilfgaard)
  const opponentDeck = await t.ctx.opponent.client.addDeck(t.ctx.nilfgaard)
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Decking,
      },
    ],
  })
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
})

test('Games page updated with playing status if marked ready through API by self last', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck(t.ctx.nilfgaard)
  const opponentDeck = await t.ctx.opponent.client.addDeck(t.ctx.nilfgaard)
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await t.ctx.self.client.ready(t.ctx.game.id)
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Playing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
})

test('Games page updated with playing status if marked ready through API by opponent last', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck(t.ctx.nilfgaard)
  const opponentDeck = await t.ctx.opponent.client.addDeck(t.ctx.nilfgaard)
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.self.client.ready(t.ctx.game.id)
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Playing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
})

test('Games page updated with finished status if passed through API by self last', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
  })
  await gameManager.pass({})
  await LoginPage.login({
    username: gameManager.self.gamePlayer.name,
  })
  const game = await gameManager.self.client.getGame(gameManager.gameId)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: game.creator.name,
        players: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
        status: GameStatus.Playing,
        factions: [
          gameManager.self.deck.from?.faction.key as FactionKey,
          gameManager.opponent.deck.from?.faction.key as FactionKey,
        ],
      },
    ],
  })
  await gameManager.pass({})
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: game.creator.name,
        players: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
        status: GameStatus.Done,
        factions: [
          gameManager.self.deck.from?.faction.key as FactionKey,
          gameManager.opponent.deck.from?.faction.key as FactionKey,
        ],
        victors: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
      },
    ],
  })
})

test('Games page updated with finished status if passed through API by opponent last', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    opponentFirst: true,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  await gameManager.pass({})
  await LoginPage.login({
    username: gameManager.self.gamePlayer.name,
  })
  const game = await gameManager.self.client.getGame(gameManager.gameId)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: game.creator.name,
        players: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
        status: GameStatus.Playing,
        factions: [
          gameManager.self.deck.from?.faction.key as FactionKey,
          gameManager.opponent.deck.from?.faction.key as FactionKey,
        ],
      },
    ],
  })
  await gameManager.pass({})
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: game.creator.name,
        players: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
        status: GameStatus.Done,
        factions: [
          gameManager.self.deck.from?.faction.key as FactionKey,
          gameManager.opponent.deck.from?.faction.key as FactionKey,
        ],
        victors: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
      },
    ],
  })
})
