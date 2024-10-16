import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import env from '../util/env'
import LoginPage from '../page-objects/login-page'
import ProfilePage from '../page-objects/profile-page'
import SignupPage from '../page-objects/signup-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Profile').page(env.BASE_URL)

test('Redirects to profile page after login', async (t) => {
  const username = `profile-redirect-${t.ctx.start}`
  await E2eUtil.goTo(ProfilePage.getUrl())
  await SignupPage.signUp({
    username,
  })
  await ProfilePage.verify({
    username,
  })
})

test('Page refresh stays on profile page', async (t) => {
  const username = `profile-refresh-${t.ctx.start}`
  await SignupPage.signUp({
    username,
  })
  await E2eUtil.goTo(ProfilePage.getUrl())
  await ProfilePage.verify({
    username,
  })
  await E2eUtil.reload()
  await ProfilePage.verify({
    username,
  })
})

test('Logout button redirects to logout page', async (t) => {
  const username = `profile-logout-${t.ctx.start}`
  await SignupPage.signUp({
    username,
  })
  await E2eUtil.goTo(ProfilePage.getUrl())
  await ProfilePage.verify({
    username,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})
})
