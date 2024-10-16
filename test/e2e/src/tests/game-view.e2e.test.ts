import { ObjectId } from 'mongodb'

import ApiClient from '../util/api-client'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import GamePage from '../page-objects/game-page'
import GamesPage from '../page-objects/games-page'
import LoginPage from '../page-objects/login-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game View').page(GamePage.getUrl())

test('Show not authorized if invalid ID', async (t) => {
  const username = `game-view-invalid-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await LoginPage.login({
    username,
  })

  await E2eUtil.goTo(GamePage.getUrl('invalid'))

  await GamePage.verifyAuthError()
  await GamePage.viewGames()
  await GamesPage.verify({
    games: [],
  })
})

test('Show not authorized if game does not exist', async (t) => {
  const username = `game-view-dne-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await LoginPage.login({
    username,
  })

  await E2eUtil.goTo(GamePage.getUrl(new ObjectId().toString()))

  await GamePage.verifyAuthError()
  await GamePage.viewGames()
  await GamesPage.verify({
    games: [],
  })
})

test('Show not authorized if not participant of game', async (t) => {
  const username1 = `game-view-not-participant-${t.ctx.start}`
  const username2 = `game-view-participant-1-${t.ctx.start}`
  const username3 = `game-view-participant-2-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await new ApiClient({}).addUser({
    name: username3,
  })
  const client = new ApiClient({
    username: username2,
  })
  const game = await client.addGame([username3])
  await LoginPage.login({
    username: username1,
  })

  await E2eUtil.goTo(GamePage.getUrl(game.id))

  await GamePage.verifyAuthError()
  await GamePage.viewGames()
  await GamesPage.verify({
    games: [],
  })
})
