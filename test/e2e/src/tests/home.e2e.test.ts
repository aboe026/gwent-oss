import env from '../util/env'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'

fixture('Home').page(env.BASE_URL)

test('Home page displays correctly', async () => {
  await LoginPage.signUp({
    username: `homepage-disaplys-${Date.now()}`,
  })
  await HomePage.verifyContent()
})
