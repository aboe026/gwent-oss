import ApiClient from '../util/api-client'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import { FactionKey, Game, GamePlayer } from '@gwent/graphql-schema/resolver-typings'
import GamesPage, { GameInList } from '../page-objects/games-page'
import LoginPage from '../page-objects/login-page'
import { SORT_FIELD } from '@gwent/graphql-schema/games-filter'

interface GamesSortTestCtx extends E2eCtx {
  username: string
  opponent: string
  game1: Game
  game2: Game
}
const fixture = getFixtureCtx<E2eCtx, GamesSortTestCtx>()
const test = getTestCtx<E2eCtx, GamesSortTestCtx>()

fixture('Games Sort')
  .page(GamesPage.getUrl())
  .beforeEach(async (t) => {
    const scenario = 'games-sort'
    t.ctx.username = `${scenario}-user-${t.ctx.start}`
    t.ctx.opponent = `${scenario}-opponent-${t.ctx.start}`
    await new ApiClient({}).addUser({
      name: t.ctx.username,
    })
    await new ApiClient({}).addUser({
      name: t.ctx.opponent,
    })
    const client1 = new ApiClient({
      username: t.ctx.username,
    })
    const client2 = new ApiClient({
      username: t.ctx.opponent,
    })
    t.ctx.game1 = await client1.addGame([t.ctx.opponent])
    t.ctx.game2 = await client2.addGame([t.ctx.username])
    const deck1 = await client1.addDeck({
      faction: FactionKey.Monsters,
      leaderName: 'Eredin Bringer of Death',
      name: `${scenario}-deck-1-${t.ctx.start}`,
      unitNames: [
        'Arachas',
        'Biting Frost',
        'Botchling',
        'Cirilla Fiona Elen Riannon',
        'Cockatrice',
        "Commander's Horn",
        'Crone Whispess',
        'Draug',
        'Fiend',
        'Frightener',
        "Gaunter O'Dimm",
        'Ghoul',
        'Grave Hag',
        'Imlerith',
        'Kayran',
        'Nekker',
        'Olgierd Von Everec',
        'Scorch',
        'Toad',
        'Triss Merigold',
        'Vampire: Fleder',
        'Villentretenmerth',
      ],
    })
    const deck2 = await client2.addDeck({
      faction: FactionKey.Skellige,
      leaderName: 'King Bran',
      name: `${scenario}-deck-2-${t.ctx.start}`,
      unitNames: [
        'Berserker',
        'Birna Bran',
        'Cerys',
        'Clan Dimun Pirate',
        'Draig Bon-Dhu',
        'Ermion',
        'Hjalmar',
        'Holger Blackhand',
        'Kambi',
        'Light Longship',
        'Light Longship',
        'Light Longship',
        'Mardroeme',
        'Mardroeme',
        'Mardroeme',
        'Olaf',
        'War Longship',
        'War Longship',
        'War Longship',
        'Young Berserker',
        'Young Berserker',
        'Young Berserker',
      ],
    })
    await client1.setDeck({
      deckId: deck1.id,
      gameId: t.ctx.game2.id,
    })
    await client1.ready(t.ctx.game2.id)
    await client2.setDeck({
      deckId: deck2.id,
      gameId: t.ctx.game2.id,
    })
    await client2.ready(t.ctx.game2.id)
    t.ctx.game1 = await client1.getGame(t.ctx.game1.id)
    t.ctx.game2 = await client2.getGame(t.ctx.game2.id)
    await LoginPage.login({
      username: t.ctx.username,
    })
  })

test('Sorts by updated ascending by default', async (t) => {
  await verifySortOrder({
    ctx: t.ctx,
    first: false,
  })
})

test('Sorts by updated descending', async (t) => {
  await GamesPage.changeSortOrder()
  await verifySortOrder({
    ctx: t.ctx,
    first: true,
  })
})

test('Sorts by created ascending', async (t) => {
  await GamesPage.setSortField(SORT_FIELD.Created)
  await verifySortOrder({
    ctx: t.ctx,
    first: false,
  })
})

test('Sorts by created descending', async (t) => {
  await GamesPage.setSortField(SORT_FIELD.Created)
  await GamesPage.changeSortOrder()
  await verifySortOrder({
    ctx: t.ctx,
    first: true,
  })
})

test('Sorts by owner ascending', async (t) => {
  await GamesPage.setSortField(SORT_FIELD.Creator)
  await verifySortOrder({
    ctx: t.ctx,
    first: false,
  })
})

test('Sorts by owner descending', async (t) => {
  await GamesPage.setSortField(SORT_FIELD.Creator)
  await GamesPage.changeSortOrder()
  await verifySortOrder({
    ctx: t.ctx,
    first: true,
  })
})

test('Sorts by status ascending', async (t) => {
  await GamesPage.setSortField(SORT_FIELD.Status)
  await verifySortOrder({
    ctx: t.ctx,
    first: false,
  })
})

test('Sorts by status descending', async (t) => {
  await GamesPage.setSortField(SORT_FIELD.Status)
  await GamesPage.changeSortOrder()
  await verifySortOrder({
    ctx: t.ctx,
    first: true,
  })
})

async function verifySortOrder({ ctx, first }: { first: boolean; ctx: GamesSortTestCtx }) {
  const game1: GameInList = {
    created: ctx.game1.created,
    owner: ctx.game1.creator.name,
    players: ctx.game1.players.map((player: GamePlayer) => player.user.name),
    status: ctx.game1.status,
  }
  const game2: GameInList = {
    created: ctx.game2.created,
    owner: ctx.game2.creator.name,
    players: ctx.game2.players.map((player: GamePlayer) => player.user.name),
    status: ctx.game2.status,
    factions: ctx.game2.players.map((player: GamePlayer) => player.faction?.key as FactionKey),
  }
  await GamesPage.verify({
    games: [first ? game1 : game2, first ? game2 : game1],
  })
}
