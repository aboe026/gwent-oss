import ApiClient from '../util/api-client'
import { Combat, Faction, FactionKey, GameStatus, Leader, SettingKey } from '@gwent/graphql-schema/resolver-typings'
import DeckEditor from '../components/deck-editor'
import DeckList from '../components/deck-list'
import DeckPage from '../page-objects/deck-page'
import DecksPage from '../page-objects/decks-page'
import { E2eHelper } from '../util/e2e-helper'
import { E2eCtx, E2ETestController, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import GamePage, { HistoryMove, HistoryPass } from '../page-objects/game-page'
import GamesPage from '../page-objects/games-page'
import HomePage from '../page-objects/home-page'
import LoginForm from '../components/login-form'
import LoginPage from '../page-objects/login-page'
import { NOT_AUTHENTICATED_MESSAGE, STARTING_HAND_SIZE } from '@gwent/constants'
import { PlayerTurn } from '../components/game-player-info'
import { sortObjectArray } from '@gwent/utils'

interface SessionExpiryFixtureCtx extends E2eCtx {
  sessionTimeoutSeconds: number
  faction: Faction
  leader: Leader
  units: string[]
}

const fixture = getFixtureCtx<SessionExpiryFixtureCtx, E2eCtx>()
const test = getTestCtx<SessionExpiryFixtureCtx, E2eCtx>()

fixture('Session Expiry').before(async (ctx) => {
  const username = `session-expiry-${ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  ctx.sessionTimeoutSeconds = await new ApiClient({ username }).getSetting<number>(SettingKey.SessionTimeoutSeconds)
  const requiredTimeoutSeconds = 60
  if (ctx.sessionTimeoutSeconds !== requiredTimeoutSeconds) {
    throw Error(
      `Sessions timeout of "${ctx.sessionTimeoutSeconds}" seconds does not equal required value of "${requiredTimeoutSeconds}" for E2E tests.`
    )
  }
  const client = new ApiClient({ username })
  ctx.faction = await client.getFaction({
    key: FactionKey.ScoiaTael,
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

test('View decks after session expires', async (t) => {
  const name = 'session-expiry-decks'
  const username = `${name}-${t.ctx.start}`
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
  await reAuthenticate(username, t)
  await DecksPage.verify({
    decks: [
      {
        created: deck.created,
        faction: t.fixtureCtx.faction,
        leader: t.fixtureCtx.leader,
        name,
        stats: deck.stats,
        neutralFaction: await client.getFaction({ key: FactionKey.Neutral }),
      },
    ],
  })
})

test('View new deck after session expires', async (t) => {
  const name = 'session-expiry-deck-new'
  const username = `${name}-${t.ctx.start}`
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
  await reAuthenticate(username, t)
  await DeckPage.verify({})
  await DeckPage.createDeck({
    faction: t.fixtureCtx.faction,
    leader: t.fixtureCtx.leader,
    name,
    units: t.fixtureCtx.units,
  })
  const client = new ApiClient({ username })
  const deck = await client.getDeck(name)
  await DecksPage.verify({
    decks: [
      {
        created: deck.created,
        faction: t.fixtureCtx.faction,
        leader: t.fixtureCtx.leader,
        name,
        stats: deck.stats,
        neutralFaction: await client.getFaction({ key: FactionKey.Neutral }),
      },
    ],
  })
})

test('Select faction for new deck after session expires', async (t) => {
  const name = 'session-expiry-deck-set-faction'
  const username = `${name}-${t.ctx.start}`
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
  await reAuthenticate(username, t)
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
  const client = new ApiClient({ username })
  const deck = await client.getDeck(name)
  await DecksPage.verify({
    decks: [
      {
        created: deck.created,
        faction: t.fixtureCtx.faction,
        leader: t.fixtureCtx.leader,
        name,
        stats: deck.stats,
        neutralFaction: await client.getFaction({ key: FactionKey.Neutral }),
      },
    ],
  })
})

test('Change faction for new deck after session expires', async (t) => {
  const name = 'session-expiry-deck-change-faction'
  const username = `${name}-${t.ctx.start}`
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
  await reAuthenticate(username, t)
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
  const client = new ApiClient({ username })
  const deck = await client.getDeck(name)
  await DecksPage.verify({
    decks: [
      {
        created: deck.created,
        faction: t.fixtureCtx.faction,
        leader: t.fixtureCtx.leader,
        name,
        stats: deck.stats,
        neutralFaction: await client.getFaction({ key: FactionKey.Neutral }),
      },
    ],
  })
})

test('Create new deck after session expires', async (t) => {
  const scenario = 'session-expiry-deck-create'
  const username = `${scenario}-user-${t.ctx.start}`
  const deckName = `${scenario}-deck-${t.ctx.start}`
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
  await reAuthenticate(username, t)
  await E2eUtil.verifyCurrentUrl(DecksPage.getUrl())
  const client = new ApiClient({ username })
  const deck = await client.getDeck(deckName)
  await DecksPage.verify({
    decks: [
      {
        created: deck.created,
        faction: t.fixtureCtx.faction,
        leader: t.fixtureCtx.leader,
        name: deckName,
        stats: deck.stats,
        neutralFaction: await client.getFaction({ key: FactionKey.Neutral }),
      },
    ],
  })
})

test('Create new game after session expires', async (t) => {
  const scenario = 'session-expiry-game-create'
  const username = `${scenario}-user-${t.ctx.start}`
  const opponent = `${scenario}-opponent-${t.ctx.start}`
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
  await reAuthenticate(username, t)
  await GamePage.verify({
    self: {
      name: username,
    },
    opponent: {
      name: opponent,
    },
  })
})

test('View games after session expires', async (t) => {
  const scenario = 'session-expiry-games'
  const username = `${scenario}-user-${t.ctx.start}`
  const opponent = `${scenario}-opponent-${t.ctx.start}`
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
  await reAuthenticate(username, t)
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

test('List decks for game after session expires', async (t) => {
  const scenario = 'session-expiry-listing-decks-for-game'
  const username = `${scenario}-user-${t.ctx.start}`
  const opponent = `${scenario}-opponent-${t.ctx.start}`
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
    name: `${scenario}-deck-${t.ctx.start}`,
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
  await reAuthenticate(username, t)
  await DeckList.verify({
    decks: [
      {
        created: deck.created,
        faction: deck.faction,
        leader: deck.leader,
        name: deck.name,
        stats: deck.stats,
        neutralFaction: await client.getFaction({ key: FactionKey.Neutral }),
      },
    ],
  })
})

test('Set deck for game after session expires', async (t) => {
  const scenario = 'session-expiry-games-choosing-deck-for-game'
  const username = `${scenario}-user-${t.ctx.start}`
  const opponent = `${scenario}-opponent-${t.ctx.start}`
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
    name: `${scenario}-deck-${t.ctx.start}`,
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
        neutralFaction: await client.getFaction({ key: FactionKey.Neutral }),
      },
    ],
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await DeckList.selectDeckForGame(deck.name)
  await E2eUtil.verifyCurrentUrl(GamePage.getUrl(game.id))
  await GamePage.verifyDeckError(`Error choosing deck: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(username, t)
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
    hand: gameDeck.hand,
  })
})

test('Create deck for game after session expires', async (t) => {
  const scenario = 'session-expiry-games-create-deck-for-game'
  const username = `${scenario}-user-${t.ctx.start}`
  const opponent = `${scenario}-opponent-${t.ctx.start}`
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
  const deckName = `${scenario}-deck-${t.ctx.start}`
  await DeckEditor.createDeck({
    faction: t.fixtureCtx.faction,
    leader: t.fixtureCtx.leader,
    name: deckName,
    units: t.fixtureCtx.units,
    save: false,
    verifyRedirect: false,
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
  await reAuthenticate(username, t)
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
    hand: gameDeck.hand,
  })
})

test('Set game order after session expires', async (t) => {
  const scenario = 'session-expiry-game-ready'
  const username = `${scenario}-user-${t.ctx.start}`
  const opponentName = `${scenario}-opponent-${t.ctx.start}`
  const self = await new ApiClient({}).addUser({
    name: username,
  })
  const opponent = await new ApiClient({}).addUser({
    name: opponentName,
  })
  const clientSelf = new ApiClient({ username })
  const clientOpponent = new ApiClient({ username: opponentName })
  const game = await clientSelf.addGame([opponentName])
  const deckSelf = await clientSelf.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name: `${scenario}-deck-self-${t.ctx.start}`,
    unitNames: t.fixtureCtx.units,
  })
  const deckOpponent = await clientOpponent.addDeck({
    faction: FactionKey.NorthernRealms,
    leaderName: 'Foltest Son of Medell',
    name: `${scenario}-deck-opponent-${t.ctx.start}`,
    unitNames: [
      'Ballista',
      'Blue Stripes Commando',
      'Blue Stripes Commando',
      'Blue Stripes Commando',
      'Catapult',
      'Catapult',
      'Cirilla Fiona Elen Riannon',
      "Commander's Horn",
      'Crinfrid Reavers Dragon Hunter',
      'Crinfrid Reavers Dragon Hunter',
      'Crinfrid Reavers Dragon Hunter',
      'Esterad Thyssen',
      'John Natalis',
      'Poor Fucking Infantry',
      'Poor Fucking Infantry',
      'Poor Fucking Infantry',
      'Prince Stennis',
      'Redanian Foot Soldier',
      'Redanian Foot Soldier',
      'Siegfried of Denesle',
      'Thaler',
      'Yarpen Zigrin',
    ],
  })
  const gameDeckSelf = await clientSelf.setDeck({
    deckId: deckSelf.id,
    gameId: game.id,
  })
  const gameDeckOpponent = await clientOpponent.setDeck({
    deckId: deckOpponent.id,
    gameId: game.id,
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: clientSelf,
      deck: deckSelf,
      gameDeck: gameDeckSelf,
      user: self,
    },
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: clientOpponent,
      deck: deckOpponent,
      gameDeck: gameDeckOpponent,
      user: opponent,
    },
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await E2eUtil.goTo(GamePage.getUrl(game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    turnOrder: game.players.map((player) => player.user.name),
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await GamePage.setOrder()
  await E2eUtil.verifyCurrentUrl(GamePage.getUrl(game.id))
  await GamePage.verifyOrderError(`Error setting order: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(username, t)
  const updatedGame = await clientSelf.getGame(game.id)
  selfPlayer.turn = updatedGame.turn?.user.id === self.id ? PlayerTurn.Future : undefined
  opponentPlayer.turn = updatedGame.turn?.user.id === opponent.id ? PlayerTurn.Future : undefined
  await GamePage.verifyCoinToss({
    won: updatedGame.turn?.user.id === self.id,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    redraws: [],
  })
})

test('Redraw unit for game after session expires', async (t) => {
  const scenario = 'session-expiry-game-redraw'
  const username = `${scenario}-user-${t.ctx.start}`
  const opponentName = `${scenario}-opponent-${t.ctx.start}`
  const self = await new ApiClient({}).addUser({
    name: username,
  })
  const opponent = await new ApiClient({}).addUser({
    name: opponentName,
  })
  const clientSelf = new ApiClient({ username })
  const clientOpponent = new ApiClient({ username: opponentName })
  const game = await clientSelf.addGame([opponentName])
  const deckSelf = await clientSelf.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name: `${scenario}-deck-self-${t.ctx.start}`,
    unitNames: t.fixtureCtx.units,
  })
  const deckOpponent = await clientOpponent.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name: `${scenario}-deck-opponent-${t.ctx.start}`,
    unitNames: t.fixtureCtx.units,
  })
  const gameDeckSelf = await clientSelf.setDeck({
    deckId: deckSelf.id,
    gameId: game.id,
  })
  const gameDeckOpponent = await clientOpponent.setDeck({
    deckId: deckOpponent.id,
    gameId: game.id,
  })
  const updatedGame = await clientSelf.getGame(game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: clientSelf,
      deck: deckSelf,
      gameDeck: gameDeckSelf,
      user: self,
    },
    turn: updatedGame.turn?.user.id === self.id ? PlayerTurn.Future : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: clientOpponent,
      deck: deckOpponent,
      gameDeck: gameDeckOpponent,
      user: opponent,
    },
    turn: updatedGame.turn?.user.id === opponent.id ? PlayerTurn.Future : undefined,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await E2eUtil.goTo(GamePage.getUrl(game.id))
  await GamePage.verifyCoinToss({
    won: updatedGame.turn?.user.id === self.id,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    redraws: [],
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  const unitToRedraw = gameDeckSelf.hand[0].unit.name
  await GamePage.redraw(unitToRedraw)
  await E2eUtil.verifyCurrentUrl(GamePage.getUrl(game.id))
  await GamePage.verifyRedrawError(`Error redrawing card: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(username, t)
  const updatedGameDeck = await clientSelf.getGameDeck(game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck.hand,
    redraws: [
      {
        from: unitToRedraw,
        to: updatedGameDeck.redraws[0].to.unit.name,
      },
    ],
  })
})

test('Ready game after session expires', async (t) => {
  const scenario = 'session-expiry-game-ready'
  const username = `${scenario}-user-${t.ctx.start}`
  const opponentName = `${scenario}-opponent-${t.ctx.start}`
  const self = await new ApiClient({}).addUser({
    name: username,
  })
  const opponent = await new ApiClient({}).addUser({
    name: opponentName,
  })
  const clientSelf = new ApiClient({ username })
  const clientOpponent = new ApiClient({ username: opponentName })
  const game = await clientSelf.addGame([opponentName])
  const deckSelf = await clientSelf.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name: `${scenario}-deck-self-${t.ctx.start}`,
    unitNames: t.fixtureCtx.units,
  })
  const deckOpponent = await clientOpponent.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name: `${scenario}-deck-opponent-${t.ctx.start}`,
    unitNames: t.fixtureCtx.units,
  })
  const gameDeckSelf = await clientSelf.setDeck({
    deckId: deckSelf.id,
    gameId: game.id,
  })
  const gameDeckOpponent = await clientOpponent.setDeck({
    deckId: deckOpponent.id,
    gameId: game.id,
  })
  const updatedGame = await clientSelf.getGame(game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: clientSelf,
      deck: deckSelf,
      gameDeck: gameDeckSelf,
      user: self,
    },
    turn: updatedGame.turn?.user.id === self.id ? PlayerTurn.Future : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: clientOpponent,
      deck: deckOpponent,
      gameDeck: gameDeckOpponent,
      user: opponent,
    },
    turn: updatedGame.turn?.user.id === opponent.id ? PlayerTurn.Future : undefined,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await E2eUtil.goTo(GamePage.getUrl(game.id))
  await GamePage.verifyCoinToss({
    won: updatedGame.turn?.user.name === username,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    redraws: [],
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await GamePage.ready()
  await E2eUtil.verifyCurrentUrl(GamePage.getUrl(game.id))
  await GamePage.verifyReadyError(`Error marking self as ready: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(username, t)
  selfPlayer.ready = true
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
  })
})

test('Change user after session expires shows new users data', async (t) => {
  const username1 = `session-expiry-change-user-1-${t.ctx.start}`
  const username2 = `session-expiry-change-user-2-${t.ctx.start}`
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

test('Play unit after session expires', async (t) => {
  const scenario = 'session-expiry-play-unit'
  const username = `${scenario}-user-${t.ctx.start}`
  const opponentName = `${scenario}-opponent-${t.ctx.start}`
  const self = await new ApiClient({}).addUser({
    name: username,
  })
  const opponent = await new ApiClient({}).addUser({
    name: opponentName,
  })
  const clientSelf = new ApiClient({ username })
  const clientOpponent = new ApiClient({ username: opponentName })
  const game = await clientSelf.addGame([opponentName])
  const deckSelf = await clientSelf.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name: `${scenario}-deck-self-${t.ctx.start}`,
    unitNames: t.fixtureCtx.units,
  })
  const deckOpponent = await clientOpponent.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name: `${scenario}-deck-opponent-${t.ctx.start}`,
    unitNames: t.fixtureCtx.units,
  })
  const gameDeckSelf = await clientSelf.setDeck({
    deckId: deckSelf.id,
    gameId: game.id,
  })
  const gameDeckOpponent = await clientOpponent.setDeck({
    deckId: deckOpponent.id,
    gameId: game.id,
  })
  await clientSelf.ready(game.id)
  await clientOpponent.ready(game.id)
  const updatedGame = await clientSelf.getGame(game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: clientSelf,
      deck: deckSelf,
      gameDeck: gameDeckSelf,
      user: self,
    },
    ready: true,
    turn: updatedGame.turn?.user.id === self.id ? PlayerTurn.Current : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: clientOpponent,
      deck: deckOpponent,
      gameDeck: gameDeckOpponent,
      user: opponent,
    },
    ready: true,
    turn: updatedGame.turn?.user.id === opponent.id ? PlayerTurn.Current : undefined,
  })
  const currentPlayer = updatedGame.turn?.user.id === self.id ? selfPlayer : opponentPlayer
  const currentGameDeck = updatedGame.turn?.user.id === self.id ? gameDeckSelf : gameDeckOpponent
  const otherPlayer = updatedGame.turn?.user.id === self.id ? opponentPlayer : selfPlayer
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username: currentPlayer.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(game.id))
  currentPlayer.passed = false
  await GamePage.verify({
    opponent: otherPlayer,
    self: currentPlayer,
    hand: currentGameDeck.hand,
    moves: [[]],
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  const sortedHand = sortObjectArray({
    array: currentGameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMove = sortedHand[0]
  const combat = unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMove.unit.name,
    row: combat,
  })
  await E2eUtil.verifyCurrentUrl(GamePage.getUrl(game.id))
  await GamePage.verifyHistoryError(`Error playing unit "${unitToMove.unit.name}": ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(currentPlayer.name, t)
  currentGameDeck.hand = currentGameDeck.hand.filter((card) => card.unit.id !== unitToMove.unit.id)
  currentPlayer.hand = 9
  currentPlayer.turn = undefined
  currentPlayer.score = unitToMove.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: currentPlayer,
    unitName: unitToMove.unit.name,
    row: combat,
    score: unitToMove.unit.strength || 0,
  })
  otherPlayer.turn = PlayerTurn.Current
  await GamePage.verify({
    opponent: otherPlayer,
    self: currentPlayer,
    hand: currentGameDeck.hand,
    moves: [
      [
        {
          userName: currentPlayer.name,
          unitName: unitToMove.unit.name,
          combatRow: combat,
        },
      ],
    ],
  })
})

test('Play pass to start round after session expires', async (t) => {
  const scenario = 'session-expiry-play-pass'
  const username = `${scenario}-user-${t.ctx.start}`
  const opponentName = `${scenario}-opponent-${t.ctx.start}`
  const self = await new ApiClient({}).addUser({
    name: username,
  })
  const opponent = await new ApiClient({}).addUser({
    name: opponentName,
  })
  const clientSelf = new ApiClient({ username })
  const clientOpponent = new ApiClient({ username: opponentName })
  const game = await clientSelf.addGame([opponentName])
  const deckSelf = await clientSelf.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name: `${scenario}-deck-self-${t.ctx.start}`,
    unitNames: t.fixtureCtx.units,
  })
  const deckOpponent = await clientOpponent.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name: `${scenario}-deck-opponent-${t.ctx.start}`,
    unitNames: t.fixtureCtx.units,
  })
  const gameDeckSelf = await clientSelf.setDeck({
    deckId: deckSelf.id,
    gameId: game.id,
  })
  const gameDeckOpponent = await clientOpponent.setDeck({
    deckId: deckOpponent.id,
    gameId: game.id,
  })
  await clientSelf.ready(game.id)
  await clientOpponent.ready(game.id)
  const updatedGame = await clientSelf.getGame(game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: clientSelf,
      deck: deckSelf,
      gameDeck: gameDeckSelf,
      user: self,
    },
    ready: true,
    turn: updatedGame.turn?.user.id === self.id ? PlayerTurn.Current : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: clientOpponent,
      deck: deckOpponent,
      gameDeck: gameDeckOpponent,
      user: opponent,
    },
    ready: true,
    turn: updatedGame.turn?.user.id === opponent.id ? PlayerTurn.Current : undefined,
  })
  const currentPlayer = updatedGame.turn?.user.id === self.id ? selfPlayer : opponentPlayer
  const currentGameDeck = updatedGame.turn?.user.id === self.id ? gameDeckSelf : gameDeckOpponent
  const otherPlayer = updatedGame.turn?.user.id === self.id ? opponentPlayer : selfPlayer
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username: currentPlayer.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(game.id))
  currentPlayer.passed = false
  await GamePage.verify({
    opponent: otherPlayer,
    self: currentPlayer,
    hand: currentGameDeck.hand,
    moves: [[]],
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await GamePage.pass({})
  await E2eUtil.verifyCurrentUrl(GamePage.getUrl(game.id))
  await GamePage.verifyHistoryError(`Error attempting to pass: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(currentPlayer.name, t)
  currentPlayer.passed = true
  currentPlayer.turn = undefined
  otherPlayer.turn = PlayerTurn.Current
  await GamePage.verify({
    opponent: otherPlayer,
    self: currentPlayer,
    hand: currentGameDeck.hand,
    moves: [
      [
        {
          userName: currentPlayer.name,
          round: 1,
        },
      ],
    ],
  })
})

test('Play pass at end of round after session expires', async (t) => {
  const scenario = 'session-expiry-play-pass'
  const username = `${scenario}-user-${t.ctx.start}`
  const opponentName = `${scenario}-opponent-${t.ctx.start}`
  const self = await new ApiClient({}).addUser({
    name: username,
  })
  const opponent = await new ApiClient({}).addUser({
    name: opponentName,
  })
  const clientSelf = new ApiClient({ username })
  const clientOpponent = new ApiClient({ username: opponentName })
  const game = await clientSelf.addGame([opponentName])
  const deckSelf = await clientSelf.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name: `${scenario}-deck-self-${t.ctx.start}`,
    unitNames: t.fixtureCtx.units,
  })
  const deckOpponent = await clientOpponent.addDeck({
    faction: t.fixtureCtx.faction.key,
    leaderName: t.fixtureCtx.leader.name,
    name: `${scenario}-deck-opponent-${t.ctx.start}`,
    unitNames: t.fixtureCtx.units,
  })
  const gameDeckSelf = await clientSelf.setDeck({
    deckId: deckSelf.id,
    gameId: game.id,
  })
  const gameDeckOpponent = await clientOpponent.setDeck({
    deckId: deckOpponent.id,
    gameId: game.id,
  })
  await clientSelf.ready(game.id)
  await clientOpponent.ready(game.id)
  const updatedGame = await clientSelf.getGame(game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: clientSelf,
      deck: deckSelf,
      gameDeck: gameDeckSelf,
      user: self,
    },
    ready: true,
    passed: false,
    turn: updatedGame.turn?.user.id === self.id ? PlayerTurn.Current : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: clientOpponent,
      deck: deckOpponent,
      gameDeck: gameDeckOpponent,
      user: opponent,
    },
    ready: true,
    passed: false,
    turn: updatedGame.turn?.user.id === opponent.id ? PlayerTurn.Current : undefined,
  })
  const currentPlayer = updatedGame.turn?.user.id === self.id ? selfPlayer : opponentPlayer
  const currentGameDeck = updatedGame.turn?.user.id === self.id ? gameDeckSelf : gameDeckOpponent
  const otherPlayer = updatedGame.turn?.user.id === self.id ? opponentPlayer : selfPlayer
  const round1Moves: (HistoryMove | HistoryPass)[] = []

  // current play unit
  const sortedHand = sortObjectArray({
    array: currentGameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMove = sortedHand[0]
  const combat = unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close
  const currentClient = updatedGame.turn?.user.id === self.id ? clientSelf : clientOpponent
  currentGameDeck.hand = currentGameDeck.hand.filter((card) => card.unit.id !== unitToMove.unit.id)
  currentPlayer.hand = 9
  currentPlayer.score = unitToMove.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: currentPlayer,
    unitName: unitToMove.unit.name,
    row: combat,
    score: unitToMove.unit.strength || 0,
  })
  round1Moves.push({
    userName: currentPlayer.name,
    unitName: unitToMove.unit.name,
    combatRow: combat,
  })
  await currentClient.playUnit({
    gameId: game.id,
    unitId: unitToMove.unit.id,
    combat,
  })

  // other pass
  otherPlayer.passed = true
  round1Moves.push({
    userName: otherPlayer.name,
    round: 1,
  })
  const otherClient = updatedGame.turn?.user.id === opponent.id ? clientSelf : clientOpponent
  await otherClient.playPass({
    gameId: game.id,
  })

  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username: currentPlayer.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(game.id))
  await GamePage.verify({
    opponent: otherPlayer,
    self: currentPlayer,
    hand: currentGameDeck.hand,
    moves: [round1Moves],
  })
  await t.wait(t.fixtureCtx.sessionTimeoutSeconds * 1000)
  await GamePage.pass({})
  await E2eUtil.verifyCurrentUrl(GamePage.getUrl(game.id))
  await GamePage.verifyHistoryError(`Error attempting to pass: ${NOT_AUTHENTICATED_MESSAGE}`)
  await reAuthenticate(currentPlayer.name, t)
  currentPlayer.passed = false
  currentPlayer.score = 0
  currentPlayer.discard = 1
  otherPlayer.passed = undefined
  otherPlayer.losses = 1
  E2eHelper.resetPlayerCombatRow({
    player: currentPlayer,
    row: combat,
  })
  round1Moves.push({
    userName: currentPlayer.name,
    round: 1,
  })
  await GamePage.verify({
    opponent: otherPlayer,
    self: currentPlayer,
    hand: currentGameDeck.hand,
    round: 2,
    moves: [round1Moves, []],
  })
})

async function reAuthenticate(username: string, t: E2ETestController<SessionExpiryFixtureCtx, E2eCtx>) {
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
