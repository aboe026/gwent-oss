import Banner from '../components/banner'
import E2eUtil from '../util/e2e-util'
import env from '../util/env'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import ProfilePage from '../page-objects/profile-page'
import { ROUTES } from '@gwent/constants'

fixture('Banner').page(env.BASE_URL)

test('Main title does not redirect to home page when not logged in', async () => {
  await LoginPage.verifyNotLoggedIn({})
  await Banner.clickMainTitle()
  await LoginPage.verifyNotLoggedIn({})
})

test('Main title redirects to home page when logged in', async () => {
  const username = `banner-main-title-redirect-${Date.now()}`
  await LoginPage.verifyNotLoggedIn({})
  await LoginPage.signUp({
    username,
  })
  await E2eUtil.goToPath(ROUTES.Profile.path)
  await ProfilePage.verifyContent({
    username: username,
  })
  await Banner.clickMainTitle()
  await HomePage.verifyContent()
})

test('Main page does not show menu or username when not logged in', async () => {
  await LoginPage.verifyNotLoggedIn({})
  await Banner.verifyContent('')
})

test('Main page shows menu and username when logged in', async () => {
  await LoginPage.verifyNotLoggedIn({})
  const username = `banner-menu-username-${Date.now()}`
  await LoginPage.signUp({
    username,
  })
  await Banner.verifyContent(username)
})

test('Username redirects to profile when logged in', async () => {
  const username = `banner-username-redirect-${Date.now()}`
  await LoginPage.verifyNotLoggedIn({})
  await LoginPage.signUp({
    username,
  })
  await HomePage.verifyContent()
  await Banner.verifyContent(username)
  await Banner.clickUsername()
  await ProfilePage.verifyContent({
    username,
  })
})

test('Menu navigates to correct pages', async () => {
  const username = `banner-menu-naviagation-${Date.now()}`
  await LoginPage.verifyNotLoggedIn({})
  await LoginPage.signUp({
    username,
  })
  await HomePage.verifyContent()
  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verifyContent({
    username,
  })
  await Banner.goTo(Banner.elements.MenuHome)
  await HomePage.verifyContent()
})
