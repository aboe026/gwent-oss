import Banner from '../components/banner'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import LogoutPage from '../page-objects/logout-page'
import ProfilePage from '../page-objects/profile-page'
import SignupPage from '../page-objects/signup-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Logout')

test('Redirects to login page on profile logout', async (t) => {
  const username = `logout-profile-${t.ctx.start}`
  await E2eUtil.goTo(HomePage.getUrl())
  await SignupPage.signUp({
    username,
  })
  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})
})

test('Direct profile URL after logout from profile goes to login page', async (t) => {
  const username = `direct-profile-after-logout-${t.ctx.start}`
  await E2eUtil.goTo(HomePage.getUrl())
  await SignupPage.signUp({
    username,
  })
  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})
  await E2eUtil.goTo(ProfilePage.getUrl())
  await LoginPage.verifyNotLoggedIn({})
})

test('Login after direct logout URL redirects to home', async (t) => {
  const username = `login-after-direct-logout-${t.ctx.start}`
  await E2eUtil.goTo(LogoutPage.getUrl())
  await SignupPage.signUp({
    username,
  })
  await HomePage.verify(username)
})
