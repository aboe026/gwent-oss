import { t } from 'testcafe'

import ApiClient from '../util/api-client'
import LoginPage from '../page-objects/login-page'
import E2eUtil from '../util/e2e-util'
import HomePage from '../page-objects/home-page'
import LoginForm from '../components/login-form'
import DecksPage from '../page-objects/decks-page'
import { NOT_AUTHENTICATED_MESSAGE, STARTING_HAND_SIZE } from '@gwent/constants'
import { FactionKey, GameStatus, Leader, SettingKey } from '@gwent/graphql-schema/resolver-typings'
import DeckPage from '../page-objects/deck-page'
import DeckEditor from '../components/deck-editor'
import GamePage from '../page-objects/game-page'
import GamesPage from '../page-objects/games-page'
import DeckList from '../components/deck-list'
import { sortObjectArray } from '@gwent/utils'

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

test('Viewing decks after session expires shows login dialog', async () => {
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
  await E2eUtil.verifyCurrentUrl(DecksPage.getUrl())
  await DeckList.verifyError(`Error getting decks: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(username)
  await DecksPage.verify({
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

test('Viewing new deck after session expires shows login dialog', async () => {
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
  await E2eUtil.verifyCurrentUrl(DeckPage.getUrl())
  await DeckEditor.verifyFactionError(`Error getting factions: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(username)
  await DeckPage.verify({})
  await DeckPage.createDeck({
    faction: t.fixtureCtx.faction,
    leader: t.fixtureCtx.leader,
    name,
    units: t.fixtureCtx.units,
  })
  const deck = await new ApiClient({ username }).getDeck(name)
  await DecksPage.verify({
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

test('Selecting faction for new deck after session expires shows login dialog', async () => {
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

  await DeckEditor.setName(name)
  await DeckPage.verify({
    name,
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await DeckEditor.setFaction({
    faction: t.fixtureCtx.faction,
    verify: false,
  })
  await E2eUtil.verifyCurrentUrl(DeckPage.getUrl())
  await DeckEditor.verifyLeaderError(`Error getting leaders: ${NOT_AUTHENTICATED_MESSAGE}`)
  await DeckEditor.verifyUnitsError({
    factionsError: `Error getting faction units: ${NOT_AUTHENTICATED_MESSAGE}`,
    neutralError: `Error getting neutral units: ${NOT_AUTHENTICATED_MESSAGE}`,
  })
  await reAuthenticate(username)
  await DeckPage.verify({
    name,
    faction: t.fixtureCtx.faction,
    leader: {
      id: '', // leader dropdown exists but no selection made
    } as unknown as Leader,
  })
  await DeckEditor.setLeader({
    leader: t.fixtureCtx.leader,
  })
  await DeckEditor.setUnits(t.fixtureCtx.units)
  await DeckPage.verify({
    faction: t.fixtureCtx.faction,
    leader: t.fixtureCtx.leader,
    name,
    selectedUnits: t.fixtureCtx.units,
  })
  await DeckEditor.verifyValid(true)
  await DeckEditor.save()
  await E2eUtil.verifyCurrentUrl(DecksPage.getUrl())
  const deck = await new ApiClient({ username }).getDeck(name)
  await DecksPage.verify({
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

test('Changing faction for new deck after session expires shows login dialog', async () => {
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

  await DeckEditor.setName(name)
  const faction = await new ApiClient({ username }).getFaction({
    key: FactionKey.NorthernRealms,
  })
  await DeckEditor.setFaction({
    faction,
    verify: false,
  })
  await DeckPage.verify({
    name,
    faction,
    leader: {
      id: '', // leader dropdown exists but no selection made
    } as unknown as Leader,
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await DeckEditor.setFaction({
    faction: t.fixtureCtx.faction,
    verify: false,
  })
  await E2eUtil.verifyCurrentUrl(DeckPage.getUrl())
  await DeckEditor.verifyLeaderError(`Error getting leaders: ${NOT_AUTHENTICATED_MESSAGE}`)
  await DeckEditor.verifyUnitsError({
    factionsError: `Error getting faction units: ${NOT_AUTHENTICATED_MESSAGE}`,
  })
  await reAuthenticate(username)
  await LoginForm.verifyAbscence()
  await DeckPage.verify({
    name,
    faction: t.fixtureCtx.faction,
    leader: {
      id: '', // leader dropdown exists but no selection made
    } as unknown as Leader,
  })
  await DeckEditor.setLeader({
    leader: t.fixtureCtx.leader,
  })
  await DeckEditor.setUnits(t.fixtureCtx.units)
  await DeckPage.verify({
    faction: t.fixtureCtx.faction,
    leader: t.fixtureCtx.leader,
    name,
    selectedUnits: t.fixtureCtx.units,
  })
  await DeckEditor.verifyValid(true)
  await DeckEditor.save()
  await E2eUtil.verifyCurrentUrl(DecksPage.getUrl())
  const deck = await new ApiClient({ username }).getDeck(name)
  await DecksPage.verify({
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

test('Creating new deck after session expires shows login dialog', async () => {
  const scenario = 'session-expiry-deck-create'
  const username = `${scenario}-user-${Date.now()}`
  const deckName = `${scenario}-deck-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await HomePage.goTo(HomePage.elements.CreateDeck)

  await DeckEditor.setName(deckName)
  await DeckPage.verify({
    name: deckName,
  })
  await DeckEditor.setFaction({
    faction: t.fixtureCtx.faction,
    verify: false,
  })
  await DeckEditor.setLeader({
    leader: t.fixtureCtx.leader,
  })
  await DeckEditor.setUnits(t.fixtureCtx.units)
  await DeckPage.verify({
    faction: t.fixtureCtx.faction,
    leader: t.fixtureCtx.leader,
    selectedUnits: t.fixtureCtx.units,
    name: deckName,
  })
  await DeckEditor.verifyValid(true)
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await DeckEditor.save()
  await E2eUtil.verifyCurrentUrl(DeckPage.getUrl())
  await DeckEditor.verifyCreateError(`Error creating deck: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(username)
  await E2eUtil.verifyCurrentUrl(DecksPage.getUrl())
  const deck = await new ApiClient({ username }).getDeck(deckName)
  await DecksPage.verify({
    decks: [
      {
        created: new Date(),
        faction: t.fixtureCtx.faction,
        leader: t.fixtureCtx.leader,
        name: deckName,
        stats: deck.stats,
      },
    ],
  })
})

test('Creating new game after session expires shows login dialog', async () => {
  const scenario = 'session-expiry-game-create'
  const username = `${scenario}-user-${Date.now()}`
  const opponent = `${scenario}-opponent-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await new ApiClient({}).addUser({
    name: opponent,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await HomePage.goTo(HomePage.elements.CreateGame)

  await GamePage.setOpponents([opponent])
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await GamePage.clickCreate()
  await E2eUtil.verifyCurrentUrl(GamePage.getUrl())
  await t.expect(GamePage.elements.NewGameError.innerText).eql(`Error adding game: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(username)
  await GamePage.verify({
    self: {
      name: username,
    },
    opponent: {
      name: opponent,
    },
  })
})

test('Viewing games after session expires shows login dialog', async () => {
  const scenario = 'session-expiry-games'
  const username = `${scenario}-user-${Date.now()}`
  const opponent = `${scenario}-opponent-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await new ApiClient({}).addUser({
    name: opponent,
  })
  const client = new ApiClient({ username })
  const game = await client.addGame([opponent])
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await HomePage.goTo(HomePage.elements.ViewGames)
  await E2eUtil.verifyCurrentUrl(GamesPage.getUrl())
  await GamesPage.verifyError(`Error getting games: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(username)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username,
        players: [username, opponent],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Listing decks for game after session expires shows login dialog', async () => {
  const scenario = 'session-expiry-listing-decks-for-game'
  const username = `${scenario}-user-${Date.now()}`
  const opponent = `${scenario}-opponent-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await new ApiClient({}).addUser({
    name: opponent,
  })
  const client = new ApiClient({ username })
  const game = await client.addGame([opponent])
  const deck = await client.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name: `${scenario}-deck-${Date.now()}`,
    unitNames: t.fixtureCtx.units,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await E2eUtil.goTo(GamePage.getUrl(game.id))
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await GamePage.clickSetDeck()
  await E2eUtil.verifyCurrentUrl(GamePage.getUrl(game.id))
  await DeckList.verifyError(`Error getting decks: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(username)
  await DeckList.verify({
    decks: [
      {
        created: deck.created,
        faction: deck.faction,
        leader: deck.leader,
        name: deck.name,
        stats: deck.stats,
      },
    ],
  })
})

test('Setting deck for game after session expires shows login dialog', async () => {
  const scenario = 'session-expiry-games-choosing-deck-for-game'
  const username = `${scenario}-user-${Date.now()}`
  const opponent = `${scenario}-opponent-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await new ApiClient({}).addUser({
    name: opponent,
  })
  const client = new ApiClient({ username })
  const game = await client.addGame([opponent])
  const deck = await client.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name: `${scenario}-deck-${Date.now()}`,
    unitNames: t.fixtureCtx.units,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await E2eUtil.goTo(GamePage.getUrl(game.id))
  await GamePage.verify({
    opponent: {
      name: opponent,
    },
    self: {
      name: username,
    },
  })
  await GamePage.clickSetDeck()
  await DeckList.verify({
    decks: [
      {
        created: deck.created,
        faction: deck.faction,
        leader: deck.leader,
        name: deck.name,
        stats: deck.stats,
      },
    ],
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await DeckList.selectDeckForGame(deck.name)
  await E2eUtil.verifyCurrentUrl(GamePage.getUrl(game.id))
  await GamePage.verifyDeckError(`Error choosing deck: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(username)
  const gameDeck = await client.getGameDeck(game.id)
  await GamePage.verify({
    opponent: {
      name: opponent,
    },
    self: {
      name: username,
      discard: 0,
      faction: deck.faction,
      hand: STARTING_HAND_SIZE,
      leader: deck.leader,
      undrawn: deck.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
})

test('Creating deck for game after session expires shows login dialog', async () => {
  const scenario = 'session-expiry-games-create-deck-for-game'
  const username = `${scenario}-user-${Date.now()}`
  const opponent = `${scenario}-opponent-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await new ApiClient({}).addUser({
    name: opponent,
  })
  const client = new ApiClient({ username })
  const game = await client.addGame([opponent])
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await E2eUtil.goTo(GamePage.getUrl(game.id))
  await GamePage.verify({
    opponent: {
      name: opponent,
    },
    self: {
      name: username,
    },
  })
  await GamePage.clickSetDeck()
  await DeckList.verify({
    decks: [],
  })
  await DeckList.clickCreateNone()
  const deckName = `${scenario}-deck-${Date.now()}`
  await DeckEditor.createDeck({
    faction: t.fixtureCtx.faction,
    leader: t.fixtureCtx.leader,
    name: deckName,
    units: t.fixtureCtx.units,
    save: false,
    verify: false,
  })
  await DeckEditor.verify({
    faction: t.fixtureCtx.faction,
    leader: t.fixtureCtx.leader,
    name: deckName,
    selectedUnits: t.fixtureCtx.units,
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await DeckEditor.save()
  await E2eUtil.verifyCurrentUrl(GamePage.getUrl(game.id))
  await DeckEditor.verifyCreateError(`Error creating deck: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(username)
  const gameDeck = await client.getGameDeck(game.id)
  if (!gameDeck.from) {
    throw Error('Could not get game deck')
  }
  await GamePage.verify({
    opponent: {
      name: opponent,
    },
    self: {
      name: username,
      discard: 0,
      faction: gameDeck.from.faction,
      hand: STARTING_HAND_SIZE,
      leader: gameDeck.from.leader,
      undrawn: gameDeck.from.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
})

test('Redrawing unit for game after session expires shows login dialog', async () => {
  const scenario = 'session-expiry-game-redraw'
  const username = `${scenario}-user-${Date.now()}`
  const opponent = `${scenario}-opponent-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await new ApiClient({}).addUser({
    name: opponent,
  })
  const client = new ApiClient({ username })
  const game = await client.addGame([opponent])
  const deck = await client.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name: `${scenario}-deck-${Date.now()}`,
    unitNames: t.fixtureCtx.units,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await E2eUtil.goTo(GamePage.getUrl(game.id))
  await GamePage.verify({
    opponent: {
      name: opponent,
    },
    self: {
      name: username,
    },
  })
  await GamePage.setDeck({
    created: deck.created,
    faction: deck.faction,
    leader: deck.leader,
    name: deck.name,
    stats: deck.stats,
  })
  const gameDeck = await client.getGameDeck(game.id)
  await GamePage.verify({
    opponent: {
      name: opponent,
    },
    self: {
      name: username,
      discard: 0,
      faction: deck.faction,
      hand: STARTING_HAND_SIZE,
      leader: deck.leader,
      undrawn: deck.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  const unitToRedraw = gameDeck.hand[0].unit.name
  await GamePage.redraw(unitToRedraw)
  await E2eUtil.verifyCurrentUrl(GamePage.getUrl(game.id))
  await GamePage.verifyRedrawError(`Error redrawing card: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(username)
  const updatedGameDeck = await client.getGameDeck(game.id)
  await GamePage.verify({
    opponent: {
      name: opponent,
    },
    self: {
      name: username,
      discard: 0,
      faction: deck.faction,
      hand: STARTING_HAND_SIZE,
      leader: deck.leader,
      undrawn: deck.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: updatedGameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
    redraws: [
      {
        from: unitToRedraw,
        to: updatedGameDeck.redraws[0].to.unit.name,
      },
    ],
  })
})

test('Readying game after session expires shows login dialog', async () => {
  const scenario = 'session-expiry-game-ready'
  const username = `${scenario}-user-${Date.now()}`
  const opponent = `${scenario}-opponent-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await new ApiClient({}).addUser({
    name: opponent,
  })
  const client = new ApiClient({ username })
  const game = await client.addGame([opponent])
  const deck = await client.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name: `${scenario}-deck-${Date.now()}`,
    unitNames: t.fixtureCtx.units,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await E2eUtil.goTo(GamePage.getUrl(game.id))
  await GamePage.verify({
    opponent: {
      name: opponent,
    },
    self: {
      name: username,
    },
  })
  await GamePage.setDeck({
    created: deck.created,
    faction: deck.faction,
    leader: deck.leader,
    name: deck.name,
    stats: deck.stats,
  })
  const gameDeck = await client.getGameDeck(game.id)
  await GamePage.verify({
    opponent: {
      name: opponent,
    },
    self: {
      name: username,
      discard: 0,
      faction: deck.faction,
      hand: STARTING_HAND_SIZE,
      leader: deck.leader,
      undrawn: deck.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await GamePage.ready()
  await E2eUtil.verifyCurrentUrl(GamePage.getUrl(game.id))
  await GamePage.verifyReadyError(`Error marking self as ready: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(username)
  await GamePage.verify({
    opponent: {
      name: opponent,
    },
    self: {
      name: username,
      discard: 0,
      faction: deck.faction,
      hand: STARTING_HAND_SIZE,
      leader: deck.leader,
      undrawn: deck.units.length - STARTING_HAND_SIZE,
      ready: true,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
})

test('Change user after session expires shows new users data', async () => {
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
  await E2eUtil.verifyCurrentUrl(DecksPage.getUrl())
  await DeckList.verifyError(`Error getting decks: ${NOT_AUTHENTICATED_MESSAGE}`)
  await LoginForm.verifyPresence({
    title: 'Session Timed Out',
    username: username1,
    usernameDisabled: true,
  })
  await t.click(LoginForm.elements.Mode)
  await LoginPage.login({
    username: username2,
  })
  await HomePage.goTo(HomePage.elements.ViewDecks)
  await DecksPage.verify({
    decks: [],
  })
})

async function reAuthenticate(username: string) {
  await LoginForm.verifyPresence({
    title: 'Session Timed Out',
    username,
    usernameDisabled: true,
  })
  for (const char of 'password') {
    await t.pressKey(char)
  }
  await t.pressKey('enter')
  await LoginForm.verifyAbscence()
}
