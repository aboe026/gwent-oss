import Banner from '../components/banner'
import E2eUtil from '../util/e2e-util'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import LogoutPage from '../page-objects/logout-page'
import ProfilePage from '../page-objects/profile-page'
import { ROUTES } from '@gwent/constants'

fixture('Logout')

test('Redirects to logout page on profile logout', async () => {
  const username = `lifecycle-${Date.now()}`
  await E2eUtil.goToPath(ROUTES.Home.path)
  await LoginPage.signUp({
    username,
  })
  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verifyContent({
    username,
  })
  await ProfilePage.logout()
  await LogoutPage.verifyContent()
})

test('Login button redirects to login page', async () => {
  const username = `lifecycle-${Date.now()}`
  await E2eUtil.goToPath(ROUTES.Home.path)
  await LoginPage.signUp({
    username,
  })
  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verifyContent({
    username,
  })
  await ProfilePage.logout()
  await LogoutPage.verifyContent()
  await LogoutPage.clickLogin()
  await LoginPage.verifyNotLoggedIn({})
})

test('Direct profile URL after logout from profile goes to login page', async () => {
  const username = `lifecycle-${Date.now()}`
  await E2eUtil.goToPath(ROUTES.Home.path)
  await LoginPage.signUp({
    username,
  })
  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verifyContent({
    username,
  })
  await ProfilePage.logout()
  await LogoutPage.verifyContent()
  await E2eUtil.goToPath(ROUTES.Profile.path)
  await LoginPage.verifyNotLoggedIn({})
})

test('Login after direct logout URL redirects to home', async () => {
  const username = `lifecycle-${Date.now()}`
  await E2eUtil.goToPath(ROUTES.Logout.path)
  await LogoutPage.verifyContent()
  await LogoutPage.clickLogin()
  await LoginPage.signUp({
    username,
  })
  await HomePage.verifyContent()
})
