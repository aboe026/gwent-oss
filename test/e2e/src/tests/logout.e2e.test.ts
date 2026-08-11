import ApiClient from '../util/api-client'
import Banner from '../components/banner'
import DeckPage from '../page-objects/deck-page'
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

test('Direct login URL after logout from page goes to login page', async (t) => {
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
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.verifyNotLoggedIn({})
})

test('Direct login URL after logout from URL goes to login page', async (t) => {
  const username = `direct-profile-after-logout-${t.ctx.start}`
  await E2eUtil.goTo(HomePage.getUrl())
  await SignupPage.signUp({
    username,
  })
  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username,
  })
  await E2eUtil.goTo(LogoutPage.getUrl())
  await LoginPage.verifyNotLoggedIn({})
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.verifyNotLoggedIn({})
})

test('Direct home URL after logout goes to signup page', async (t) => {
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
  await E2eUtil.goTo(HomePage.getUrl())
  await t.expect(E2eUtil.getCurrentUrl()).eql(SignupPage.getUrl())
})

test('Signup after direct logout URL redirects to home', async (t) => {
  const username = `login-after-direct-logout-${t.ctx.start}`
  await E2eUtil.goTo(LogoutPage.getUrl())
  await SignupPage.signUp({
    username,
  })
  await HomePage.verify(username)
})

test('Redirect to Home page on login after user directly navigates and logs into non-home page', async (t) => {
  const username1 = `logout-1-${t.ctx.start}`
  const username2 = `logout-2-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await E2eUtil.goTo(DeckPage.getUrl())
  await SignupPage.switchToLogin()
  await LoginPage.login({
    username: username1,
  })
  await DeckPage.verify({})
  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username: username1,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})
  await LoginPage.login({
    username: username2,
  })
  await HomePage.verify(username2)
})
