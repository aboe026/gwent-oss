import ApiClient from '../util/api-client'
import Banner from '../components/banner'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import GamePage from '../page-objects/game-page'
import GamesPage from '../page-objects/games-page'
import { GameStatus } from '@gwent/graphql-schema/resolver-typings'
import LoginPage from '../page-objects/login-page'
import HomePage from '../page-objects/home-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Games Subscription')

test('Game added through API appears for creator on games page without any games', async (t) => {
  const username1 = `games-subscription-none-creator-1-${t.ctx.start}`
  const username2 = `games-subscription-none-creator-2-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await E2eUtil.goTo(GamesPage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await GamesPage.verify({
    games: [],
  })
  const game = await new ApiClient({
    username: username1,
  }).addGame([username2])

  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username1,
        players: [username1, username2],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Game added through API appears for participant on games page without any games', async (t) => {
  const username1 = `games-subscription-none-participant-1-${t.ctx.start}`
  const username2 = `games-subscription-none-participant-2-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await E2eUtil.goTo(GamesPage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await GamesPage.verify({
    games: [],
  })
  const game = await new ApiClient({
    username: username2,
  }).addGame([username1])

  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Game added through API appears for creator on games page with existing game', async (t) => {
  const username1 = `games-subscription-existing-creator-1-${t.ctx.start}`
  const username2 = `games-subscription-existing-creator-2-${t.ctx.start}`
  const username3 = `games-subscription-existing-creator-3-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await new ApiClient({}).addUser({
    name: username3,
  })
  await E2eUtil.goTo(GamesPage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  const game1 = await new ApiClient({
    username: username1,
  }).addGame([username2])
  await GamesPage.verify({
    games: [
      {
        created: game1.created,
        owner: username1,
        players: [username1, username2],
        status: GameStatus.Decking,
      },
    ],
  })
  const game2 = await new ApiClient({
    username: username1,
  }).addGame([username3])

  await GamesPage.verify({
    games: [
      {
        created: game2.created,
        owner: username1,
        players: [username1, username3],
        status: GameStatus.Decking,
      },
      {
        created: game1.created,
        owner: username1,
        players: [username1, username2],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Game added through API appears for participant on games page with existing game', async (t) => {
  const username1 = `games-subscription-existing-participant-1-${t.ctx.start}`
  const username2 = `games-subscription-existing-participant-2-${t.ctx.start}`
  const username3 = `games-subscription-existing-participant-3-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await new ApiClient({}).addUser({
    name: username3,
  })
  await E2eUtil.goTo(GamesPage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  const game1 = await new ApiClient({
    username: username2,
  }).addGame([username1])
  await GamesPage.verify({
    games: [
      {
        created: game1.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Decking,
      },
    ],
  })
  const game2 = await new ApiClient({
    username: username3,
  }).addGame([username1])

  await GamesPage.verify({
    games: [
      {
        created: game2.created,
        owner: username3,
        players: [username3, username1],
        status: GameStatus.Decking,
      },
      {
        created: game1.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Game added through API appears for creator without games navigating to games page from home page', async (t) => {
  const username1 = `games-subscription-home-page-none-creator-1-${t.ctx.start}`
  const username2 = `games-subscription-home-page-none-creator-2-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await E2eUtil.goTo(HomePage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await HomePage.verify(username1)
  const game = await new ApiClient({
    username: username1,
  }).addGame([username2])
  await Banner.goTo(Banner.elements.MenuGames)

  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username1,
        players: [username1, username2],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Game added through API appears for participant without games navigating to games page from home page', async (t) => {
  const username1 = `games-subscription-home-page-none-participant-1-${t.ctx.start}`
  const username2 = `games-subscription-home-page-none-participant-2-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await E2eUtil.goTo(HomePage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await HomePage.verify(username1)
  const game = await new ApiClient({
    username: username2,
  }).addGame([username1])
  await Banner.goTo(Banner.elements.MenuGames)

  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Game added through API appears for creator with existing game navigating to games page from home page', async (t) => {
  const username1 = `games-subscription-home-page-existing-creator-1-${t.ctx.start}`
  const username2 = `games-subscription-home-page-existing-creator-2-${t.ctx.start}`
  const username3 = `games-subscription-home-page-existing-creator-3-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await new ApiClient({}).addUser({
    name: username3,
  })
  const game1 = await new ApiClient({
    username: username1,
  }).addGame([username2])
  await E2eUtil.goTo(HomePage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await HomePage.verify(username1)
  const game2 = await new ApiClient({
    username: username1,
  }).addGame([username3])
  await Banner.goTo(Banner.elements.MenuGames)

  await GamesPage.verify({
    games: [
      {
        created: game2.created,
        owner: username1,
        players: [username1, username3],
        status: GameStatus.Decking,
      },
      {
        created: game1.created,
        owner: username1,
        players: [username1, username2],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Game added through API appears for participant with existing game navigating to games page from home page', async (t) => {
  const username1 = `games-subscription-home-page-existing-participant-1-${t.ctx.start}`
  const username2 = `games-subscription-home-page-existing-participant-2-${t.ctx.start}`
  const username3 = `games-subscription-home-page-existing-participant-3-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await new ApiClient({}).addUser({
    name: username3,
  })
  const game1 = await new ApiClient({
    username: username2,
  }).addGame([username1])
  await E2eUtil.goTo(HomePage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await HomePage.verify(username1)
  const game2 = await new ApiClient({
    username: username3,
  }).addGame([username1])
  await Banner.goTo(Banner.elements.MenuGames)

  await GamesPage.verify({
    games: [
      {
        created: game2.created,
        owner: username3,
        players: [username3, username1],
        status: GameStatus.Decking,
      },
      {
        created: game1.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Game added through API appears for creator without games navigating from games page to home page and back to games page', async (t) => {
  const username1 = `games-subscription-game-page-home-page-none-creator-1-${t.ctx.start}`
  const username2 = `games-subscription-game-page-home-page-none-creator-2-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await E2eUtil.goTo(GamesPage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await GamesPage.verify({
    games: [],
  })
  await Banner.goTo(Banner.elements.MenuHome)
  await HomePage.verify(username1)
  const game = await new ApiClient({
    username: username1,
  }).addGame([username2])
  await Banner.goTo(Banner.elements.MenuGames)

  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username1,
        players: [username1, username2],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Game added through API appears for participant without games navigating from games page to home page and back to games page', async (t) => {
  const username1 = `games-subscription-game-page-home-page-none-participant-1-${t.ctx.start}`
  const username2 = `games-subscription-game-page-home-page-none-participant-2-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await E2eUtil.goTo(GamesPage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await GamesPage.verify({
    games: [],
  })
  await Banner.goTo(Banner.elements.MenuHome)
  await HomePage.verify(username1)
  const game = await new ApiClient({
    username: username2,
  }).addGame([username1])
  await Banner.goTo(Banner.elements.MenuGames)

  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Game added through API appears for creator with existing game navigating from games page to home page and back to games page', async (t) => {
  const username1 = `games-subscription-game-page-home-page-existing-creator-1-${t.ctx.start}`
  const username2 = `games-subscription-game-page-home-page-existing-creator-2-${t.ctx.start}`
  const username3 = `games-subscription-game-page-home-page-existing-creator-3-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await new ApiClient({}).addUser({
    name: username3,
  })
  const game1 = await new ApiClient({
    username: username1,
  }).addGame([username2])
  await E2eUtil.goTo(GamesPage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await GamesPage.verify({
    games: [
      {
        created: game1.created,
        owner: username1,
        players: [username1, username2],
        status: GameStatus.Decking,
      },
    ],
  })
  await Banner.goTo(Banner.elements.MenuHome)
  await HomePage.verify(username1)
  const game2 = await new ApiClient({
    username: username1,
  }).addGame([username3])
  await Banner.goTo(Banner.elements.MenuGames)

  await GamesPage.verify({
    games: [
      {
        created: game2.created,
        owner: username1,
        players: [username1, username3],
        status: GameStatus.Decking,
      },
      {
        created: game1.created,
        owner: username1,
        players: [username1, username2],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Game added through API appears for participant with existing game navigating from games page to home page and back to games page', async (t) => {
  const username1 = `games-subscription-game-page-home-page-existing-participant-1-${t.ctx.start}`
  const username2 = `games-subscription-game-page-home-page-existing-participant-2-${t.ctx.start}`
  const username3 = `games-subscription-game-page-home-page-existing-participant-3-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await new ApiClient({}).addUser({
    name: username3,
  })
  const game1 = await new ApiClient({
    username: username2,
  }).addGame([username1])
  await E2eUtil.goTo(GamesPage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await GamesPage.verify({
    games: [
      {
        created: game1.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Decking,
      },
    ],
  })
  await Banner.goTo(Banner.elements.MenuHome)
  await HomePage.verify(username1)
  const game2 = await new ApiClient({
    username: username3,
  }).addGame([username1])
  await Banner.goTo(Banner.elements.MenuGames)

  await GamesPage.verify({
    games: [
      {
        created: game2.created,
        owner: username3,
        players: [username3, username1],
        status: GameStatus.Decking,
      },
      {
        created: game1.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Game added through API appears for creator without any games after they create a game from games page', async (t) => {
  const username1 = `games-subscription-create-game-none-games-creator-1-${t.ctx.start}`
  const username2 = `games-subscription-create-game-none-games-creator-2-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await E2eUtil.goTo(GamesPage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await GamesPage.verify({
    games: [],
  })
  await GamesPage.clickCreateNone()
  await GamePage.createGame({
    creator: username1,
    opponents: [username2],
  })
  await GamePage.verify({
    opponent: {
      name: username2,
    },
    self: {
      name: username1,
    },
  })
  const gameId = await GamePage.getIdFromUrl()
  const game = await new ApiClient({
    username: username1,
  }).getGame(gameId)
  await Banner.goTo(Banner.elements.MenuGames)

  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username1,
        players: [username1, username2],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Game added through API appears for creator without any games after they create a game from home page', async (t) => {
  const username1 = `games-subscription-create-game-none-home-creator-1-${t.ctx.start}`
  const username2 = `games-subscription-create-game-none-home-creator-2-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await E2eUtil.goTo(HomePage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await HomePage.verify(username1)
  await HomePage.goTo(HomePage.elements.CreateGame)
  await GamePage.createGame({
    creator: username1,
    opponents: [username2],
  })
  await GamePage.verify({
    opponent: {
      name: username2,
    },
    self: {
      name: username1,
    },
  })
  const gameId = await GamePage.getIdFromUrl()
  const game = await new ApiClient({
    username: username1,
  }).getGame(gameId)
  await Banner.goTo(Banner.elements.MenuGames)

  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username1,
        players: [username1, username2],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Game added through API appears for creator with existing game after they create a game from games page', async (t) => {
  const username1 = `games-subscription-create-game-existing-games-page-creator-1-${t.ctx.start}`
  const username2 = `games-subscription-create-game-existing-games-page-creator-2-${t.ctx.start}`
  const username3 = `games-subscription-create-game-existing-games-page-creator-3-${t.ctx.start}`
  const username4 = `games-subscription-create-game-existing-games-page-creator-4-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await new ApiClient({}).addUser({
    name: username3,
  })
  await new ApiClient({}).addUser({
    name: username4,
  })
  const game1 = await new ApiClient({
    username: username1,
  }).addGame([username2])
  await E2eUtil.goTo(GamesPage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await GamesPage.verify({
    games: [
      {
        created: game1.created,
        owner: username1,
        players: [username1, username2],
        status: GameStatus.Decking,
      },
    ],
  })
  await GamesPage.clickCreateNew()
  const game2 = await new ApiClient({
    username: username1,
  }).addGame([username3])
  await GamePage.createGame({
    creator: username1,
    opponents: [username4],
  })
  await GamePage.verify({
    opponent: {
      name: username4,
    },
    self: {
      name: username1,
    },
  })
  const gameId = await GamePage.getIdFromUrl()
  const game3 = await new ApiClient({
    username: username1,
  }).getGame(gameId)
  await Banner.goTo(Banner.elements.MenuGames)

  await GamesPage.verify({
    games: [
      {
        created: game3.created,
        owner: username1,
        players: [username1, username4],
        status: GameStatus.Decking,
      },
      {
        created: game2.created,
        owner: username1,
        players: [username1, username3],
        status: GameStatus.Decking,
      },
      {
        created: game1.created,
        owner: username1,
        players: [username1, username2],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Game added for other user through API does not appear on games page', async (t) => {
  const username1 = `games-subscription-games-page-different-user-1-${t.ctx.start}`
  const username2 = `games-subscription-games-page-different-user-2-${t.ctx.start}`
  const username3 = `games-subscription-games-page-different-user-3-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await new ApiClient({}).addUser({
    name: username3,
  })
  await E2eUtil.goTo(GamesPage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await GamesPage.verify({
    games: [],
  })
  await new ApiClient({
    username: username2,
  }).addGame([username3])

  await GamesPage.verify({
    games: [],
  })
})
