import AboutPage from '../page-objects/about-page'
import ApiClient from '../util/api-client'
import Banner from '../components/banner'
import E2eUtil from '../util/e2e-util'
import LoginPage from '../page-objects/login-page'

fixture('About')

test('Shows about page without logging in', async () => {
  await E2eUtil.goTo(AboutPage.getUrl())
  await AboutPage.verify()
})

test('Shows about page when logged in', async () => {
  const username = `about-page-logged-in-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await Banner.goTo(Banner.elements.MenuAbout)
  await AboutPage.verify()
})
