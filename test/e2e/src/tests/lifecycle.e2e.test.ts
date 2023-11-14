import Banner from '../components/banner'
import env from '../util/env'
import LoginPage from '../page-objects/login-page'
import LogoutPage from '../page-objects/logout-page'
import ProfilePage from '../page-objects/profile-page'

fixture('Lifecycle').page(env.BASE_URL)

test('Create user and logout', async () => {
  const username = `lifecycle-single-user-${Date.now()}`
  await LoginPage.signUp({
    username,
  })
  await Banner.verifyContent(username)
  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verifyContent({
    username,
  })
  await ProfilePage.logout()
  await LogoutPage.verifyContent()
  await LogoutPage.clickLogin()
  await LoginPage.verifyNotLoggedIn({})
})

test('Logging in as different user shows different users data', async () => {
  const username1 = `lifecycle-different-user-1-${Date.now()}`
  const username2 = `lifecycle-different-user-2-${Date.now()}`
  await LoginPage.signUp({
    username: username1,
  })
  await Banner.verifyContent(username1)
  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verifyContent({
    username: username1,
  })
  await ProfilePage.logout()
  await LogoutPage.verifyContent()
  await LogoutPage.clickLogin()
  await LoginPage.verifyNotLoggedIn({})

  await LoginPage.signUp({
    username: username2,
  })
  await Banner.verifyContent(username2)
  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verifyContent({
    username: username2,
  })
  await ProfilePage.logout()
  await LogoutPage.verifyContent()
})
