import ApiClient from '../util/api-client'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import env from '../util/e2e-env'
import HomePage from '../page-objects/home-page'
import SignupPage from '../page-objects/signup-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Signup').page(env.BASE_URL)

test('Logs in user after they sign up', async (t) => {
  const username = `new-user-${t.ctx.start}`
  await SignupPage.signUp({
    username,
  })
  await HomePage.verify(username)
})

test('Shows error if signing up for user that already exists', async (t) => {
  const username = `duplicate-user-${t.ctx.start}`
  const password = 'password'
  await new ApiClient({}).addUser({
    name: username,
    password,
  })

  await SignupPage.signUp({
    username,
    password,
    verify: false,
  })

  await SignupPage.verifyNotLoggedIn({
    username,
    password,
    error: `User with name "${username}" already exists.`,
  })
})

test('User session persists across refresh after sign up', async (t) => {
  const username = `sign-up-persistence-${t.ctx.start}`
  await SignupPage.signUp({
    username,
  })

  await E2eUtil.reload()

  await HomePage.verify(username)
})
