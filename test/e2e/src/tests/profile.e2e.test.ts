import env from '../util/env'
import E2eUtil from '../util/e2e-util'
import LoginPage from '../page-objects/login-page'
import ProfilePage from '../page-objects/profile-page'
import SignupPage from '../page-objects/signup-page'

fixture('Profile').page(env.BASE_URL)

test('Redirects to profile page after login', async () => {
  const username = `profile-redirect-${Date.now()}`
  await E2eUtil.goTo(ProfilePage.getUrl())
  await SignupPage.signUp({
    username,
  })
  await ProfilePage.verify({
    username,
  })
})

test('Page refresh stays on profile page', async () => {
  const username = `profile-refresh-${Date.now()}`
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

test('Logout button redirects to logout page', async () => {
  const username = `profile-logout-${Date.now()}`
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
