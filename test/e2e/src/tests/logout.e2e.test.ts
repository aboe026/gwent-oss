import Banner from '../components/banner'
import E2eUtil from '../util/e2e-util'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import LogoutPage from '../page-objects/logout-page'
import ProfilePage from '../page-objects/profile-page'
import SignupPage from '../page-objects/signup-page'

fixture('Logout')

test('Redirects to login page on profile logout', async () => {
  const username = `logout-profile-${Date.now()}`
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

test('Direct profile URL after logout from profile goes to login page', async () => {
  const username = `direct-profile-after-logout-${Date.now()}`
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

test('Login after direct logout URL redirects to home', async () => {
  const username = `login-after-direct-logout-${Date.now()}`
  await E2eUtil.goTo(LogoutPage.getUrl())
  await SignupPage.signUp({
    username,
  })
  await HomePage.verify(username)
})
