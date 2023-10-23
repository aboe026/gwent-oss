import env from '../util/env'
import HomePage from '../page-objects/home-page'

fixture('Home').page(env.BASE_URL)

test('Home page renders', async (t) => {
  await t.expect(HomePage.elements.Welcome.innerText).eql('Hello World!')
})
