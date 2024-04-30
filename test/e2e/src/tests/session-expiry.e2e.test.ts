import ApiClient from '../util/api-client'
import LoginPage from '../page-objects/login-page'
import E2eUtil from '../util/e2e-util'
import HomePage from '../page-objects/home-page'
import LoginForm from '../components/login-form'
import DecksPage from '../page-objects/decks-page'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import { FactionKey, Leader, SettingKey } from '@gwent/graphql-schema/resolver-typings'
import DeckPage from '../page-objects/deck-page'

fixture('Session Expiry').before(async (ctx) => {
  const username = `session-expiry-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  ctx.sessionTimeoutSeconds = await new ApiClient({ username }).getSetting<number>(SettingKey.SessionTimeoutSeconds)
  const requiredTimeoutSeconds = 20
  if (ctx.sessionTimeoutSeconds !== requiredTimeoutSeconds) {
    throw Error(
      `Sessions timeout of "${ctx.sessionTimeoutSeconds}" seconds does not equal required value of "${requiredTimeoutSeconds}" for E2E tests.`
    )
  }
  const client = new ApiClient({ username })
  ctx.faction = await client.getFaction({
    key: FactionKey.ScoiaTael,
    neutrals: true,
  })
  ctx.leader = await client.getLeader({
    faction: ctx.faction.key,
    name: 'Francesca Findabair Hope of the Aen Seidhe',
  })
  ctx.units = [
    'Cirilla Fiona Elen Riannon',
    "Commander's Horn",
    'Cow',
    'Decoy',
    'Emiel Regis Rohellec Terzieff',
    "Gaunter O'Dimm",
    "Gaunter O'Dimm Darkness",
    "Gaunter O'Dimm Darkness",
    "Gaunter O'Dimm Darkness",
    'Geralt of Rivia',
    'Impenetrable Fog',
    'Mysterious Elf',
    'Olgierd Von Everec',
    'Roach',
    'Scorch',
    'Skellige Storm',
    'Torrential Rain',
    'Triss Merigold',
    'Vesemir',
    'Villentretenmerth',
    'Yennefer of Vengerberg',
    'Zoltan Chivay',
  ]
})

test('Login dialog shown navigating to decks after session expires', async (t) => {
  const name = 'session-expiry-decks'
  const username = `${name}-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const deck = await client.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name,
    unitNames: t.fixtureCtx.units,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await HomePage.goTo(HomePage.elements.ViewDecks)
  await LoginForm.verifyPresence({
    title: 'Session Timed Out',
    username,
    usernameDisabled: true,
  })
  await E2eUtil.verifyCurrentUrl(DecksPage.getUrl())
  await DecksPage.verifyError(`Error getting decks: ${NOT_AUTHENTICATED_MESSAGE}`)
  for (const char of 'password') {
    await t.pressKey(char)
  }
  await t.pressKey('enter')
  await LoginForm.verifyAbscence()
  await DecksPage.verifyContent({
    decks: [
      {
        created: new Date(),
        faction: t.fixtureCtx.faction,
        leader: t.fixtureCtx.leader,
        name,
        stats: deck.stats,
      },
    ],
  })
})

test('Login dialog shown navigating to new deck after session expires', async (t) => {
  const name = 'session-expiry-deck-new'
  const username = `${name}-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await HomePage.goTo(HomePage.elements.CreateDeck)
  await LoginForm.verifyPresence({
    title: 'Session Timed Out',
    username,
    usernameDisabled: true,
  })
  await E2eUtil.verifyCurrentUrl(DeckPage.getUrl())
  await DeckPage.verifyFactionError(`Error getting factions: ${NOT_AUTHENTICATED_MESSAGE}`)
  for (const char of 'password') {
    await t.pressKey(char)
  }
  await t.pressKey('enter')
  await LoginForm.verifyAbscence()
  await DeckPage.verifyContent({})
  await DeckPage.createDeck({
    faction: t.fixtureCtx.faction,
    leader: t.fixtureCtx.leader,
    name,
    units: t.fixtureCtx.units,
  })
  const deck = await new ApiClient({ username }).getDeck(name)
  await DecksPage.verifyContent({
    decks: [
      {
        created: new Date(),
        faction: t.fixtureCtx.faction,
        leader: t.fixtureCtx.leader,
        name,
        stats: deck.stats,
      },
    ],
  })
})

test('Login dialog shown selecting new deck faction after session expires', async (t) => {
  const name = 'session-expiry-deck-set-faction'
  const username = `${name}-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await HomePage.goTo(HomePage.elements.CreateDeck)

  await DeckPage.setName(name)
  await DeckPage.verifyContent({
    name,
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await DeckPage.setFaction({
    faction: t.fixtureCtx.faction,
    verify: false,
  })
  await LoginForm.verifyPresence({
    title: 'Session Timed Out',
    username,
    usernameDisabled: true,
  })
  await E2eUtil.verifyCurrentUrl(DeckPage.getUrl())
  await DeckPage.verifyLeaderError(`Error getting leaders: ${NOT_AUTHENTICATED_MESSAGE}`)
  await DeckPage.verifyUnitsError({
    factionsError: `Error getting faction cards: ${NOT_AUTHENTICATED_MESSAGE}`,
    neutralError: `Error getting neutral cards: ${NOT_AUTHENTICATED_MESSAGE}`,
  })
  for (const char of 'password') {
    await t.pressKey(char)
  }
  await t.pressKey('enter')
  await LoginForm.verifyAbscence()
  await DeckPage.verifyContent({
    name,
    faction: t.fixtureCtx.faction,
    leader: {
      id: '', // leader dropdown exists but no selection made
    } as unknown as Leader,
  })
  await DeckPage.setLeader({
    leader: t.fixtureCtx.leader,
  })
  await DeckPage.setUnits(t.fixtureCtx.units)
  await DeckPage.verifyContent({
    faction: t.fixtureCtx.faction,
    leader: t.fixtureCtx.leader,
    name,
    selectedUnits: t.fixtureCtx.units,
  })
  await DeckPage.verifyValid(true)
  await DeckPage.save()
  await E2eUtil.verifyCurrentUrl(DecksPage.getUrl())
  const deck = await new ApiClient({ username }).getDeck(name)
  await DecksPage.verifyContent({
    decks: [
      {
        created: new Date(),
        faction: t.fixtureCtx.faction,
        leader: t.fixtureCtx.leader,
        name,
        stats: deck.stats,
      },
    ],
  })
})

test('Login dialog shown changing new deck faction after session expires', async (t) => {
  const name = 'session-expiry-deck-change-faction'
  const username = `${name}-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await HomePage.goTo(HomePage.elements.CreateDeck)

  await DeckPage.setName(name)
  const faction = await new ApiClient({ username }).getFaction({
    key: FactionKey.NorthernRealms,
  })
  await DeckPage.setFaction({
    faction,
    verify: false,
  })
  await DeckPage.verifyContent({
    name,
    faction,
    leader: {
      id: '', // leader dropdown exists but no selection made
    } as unknown as Leader,
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await DeckPage.setFaction({
    faction: t.fixtureCtx.faction,
    verify: false,
  })
  await LoginForm.verifyPresence({
    title: 'Session Timed Out',
    username,
    usernameDisabled: true,
  })
  await E2eUtil.verifyCurrentUrl(DeckPage.getUrl())
  await DeckPage.verifyLeaderError(`Error getting leaders: ${NOT_AUTHENTICATED_MESSAGE}`)
  await DeckPage.verifyUnitsError({
    factionsError: `Error getting faction cards: ${NOT_AUTHENTICATED_MESSAGE}`,
  })
  for (const char of 'password') {
    await t.pressKey(char)
  }
  await t.pressKey('enter')
  await LoginForm.verifyAbscence()
  await DeckPage.verifyContent({
    name,
    faction: t.fixtureCtx.faction,
    leader: {
      id: '', // leader dropdown exists but no selection made
    } as unknown as Leader,
  })
  await DeckPage.setLeader({
    leader: t.fixtureCtx.leader,
  })
  await DeckPage.setUnits(t.fixtureCtx.units)
  await DeckPage.verifyContent({
    faction: t.fixtureCtx.faction,
    leader: t.fixtureCtx.leader,
    name,
    selectedUnits: t.fixtureCtx.units,
  })
  await DeckPage.verifyValid(true)
  await DeckPage.save()
  await E2eUtil.verifyCurrentUrl(DecksPage.getUrl())
  const deck = await new ApiClient({ username }).getDeck(name)
  await DecksPage.verifyContent({
    decks: [
      {
        created: new Date(),
        faction: t.fixtureCtx.faction,
        leader: t.fixtureCtx.leader,
        name,
        stats: deck.stats,
      },
    ],
  })
})

test('Login dialog shown creating new deck after session expires', async (t) => {
  const name = 'session-expiry-deck-create'
  const username = `${name}-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await HomePage.goTo(HomePage.elements.CreateDeck)

  await DeckPage.setName(name)
  await DeckPage.verifyContent({
    name,
  })
  await DeckPage.setFaction({
    faction: t.fixtureCtx.faction,
    verify: false,
  })
  await DeckPage.setLeader({
    leader: t.fixtureCtx.leader,
  })
  await DeckPage.setUnits(t.fixtureCtx.units)
  await DeckPage.verifyContent({
    faction: t.fixtureCtx.faction,
    leader: t.fixtureCtx.leader,
    selectedUnits: t.fixtureCtx.units,
    name,
  })
  await DeckPage.verifyValid(true)
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await DeckPage.save()
  await LoginForm.verifyPresence({
    title: 'Session Timed Out',
    username,
    usernameDisabled: true,
  })
  await E2eUtil.verifyCurrentUrl(DeckPage.getUrl())
  await DeckPage.verifyCreateError(`Error creating deck: ${NOT_AUTHENTICATED_MESSAGE}`)
  for (const char of 'password') {
    await t.pressKey(char)
  }
  await t.pressKey('enter')
  await LoginForm.verifyAbscence()
  await E2eUtil.verifyCurrentUrl(DecksPage.getUrl())
  const deck = await new ApiClient({ username }).getDeck(name)
  await DecksPage.verifyContent({
    decks: [
      {
        created: new Date(),
        faction: t.fixtureCtx.faction,
        leader: t.fixtureCtx.leader,
        name,
        stats: deck.stats,
      },
    ],
  })
})

test('Change user after session expires shows new users data', async (t) => {
  const username1 = `session-expiry-change-user-1-${Date.now()}`
  const username2 = `session-expiry-change-user-2-${Date.now()}`
  const name = 'session-expiry-decks'
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  const client = new ApiClient({ username: username1 })
  await client.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name,
    unitNames: t.fixtureCtx.units,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await HomePage.goTo(HomePage.elements.ViewDecks)
  await LoginForm.verifyPresence({
    title: 'Session Timed Out',
    username: username1,
    usernameDisabled: true,
  })
  await E2eUtil.verifyCurrentUrl(DecksPage.getUrl())
  await DecksPage.verifyError(`Error getting decks: ${NOT_AUTHENTICATED_MESSAGE}`)
  await t.click(LoginForm.elements.Mode)
  await LoginPage.login({
    username: username2,
  })
  await HomePage.goTo(HomePage.elements.ViewDecks)
  await DecksPage.verifyContent({
    decks: [],
  })
})
