import Banner from '../components/banner'
import E2eUtil from '../util/e2e-util'
import env from '../util/env'
import LoginPage from '../page-objects/login-page'
import ProfilePage from '../page-objects/profile-page'
import { verifyLoggedIn, verifyNotLoggedIn } from './login.e2e.test'

fixture('Logout').page(env.BASE_URL)

test('Redirects to login after logout', async () => {
  const username = `lifecycle-${Date.now()}`
  await verifyNotLoggedIn()
  await LoginPage.signUp(username, 'password')
  await verifyLoggedIn(username)
  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verifyUsername(username)
  await ProfilePage.logout()
  await verifyNotLoggedIn()
})

test('Session destroyed after logout', async () => {
  const username = `lifecycle-${Date.now()}`
  await verifyNotLoggedIn()
  await LoginPage.signUp(username, 'password')
  await verifyLoggedIn(username)
  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verifyUsername(username)
  await ProfilePage.logout()
  await verifyNotLoggedIn()
  await E2eUtil.reload()
  await verifyNotLoggedIn()
})
