import { ObjectId } from 'mongodb'

import ApiClient from '../util/api-client'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import GamePage from '../page-objects/game-page'
import GamesPage from '../page-objects/games-page'
import LoginPage from '../page-objects/login-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Create').page(GamePage.getUrl())

test('Errors if opponent does not exist', async (t) => {
  const username = `game-create-opponent-dne-${t.ctx.start}`
  const opponent = 'does-not-exist'
  await new ApiClient({}).addUser({
    name: username,
  })
  await LoginPage.login({
    username,
  })

  await GamePage.createGame({
    creator: username,
    opponents: [opponent],
    error: `Error adding game: User with name "${opponent}" does not exist.`,
  })
})

test('Create game with valid opponent', async (t) => {
  const username = `game-create-1-${t.ctx.start}`
  const opponent = `game-create-2-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await new ApiClient({}).addUser({
    name: opponent,
  })
  await LoginPage.login({
    username,
  })

  await GamePage.createGame({
    creator: username,
    opponents: [opponent],
  })
  const client = new ApiClient({
    username,
  })
  const games = await client.getGames()
  await t.expect(games.length).eql(1)
  await t.expect(ObjectId.isValid(games[0].id)).ok()
  await E2eUtil.verifyCurrentUrl(GamePage.getUrl(games[0].id))
  await GamePage.verify({
    self: {
      name: username,
    },
    opponent: {
      name: opponent,
    },
  })
})

test('Cancel brings user to games list', async (t) => {
  const username = `game-create-cancel-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await LoginPage.login({
    username,
  })

  await GamePage.verifyNew({
    creator: username,
    opponents: [],
  })

  await GamePage.clickNewCancel()

  await E2eUtil.verifyCurrentUrl(GamesPage.getUrl())
})
