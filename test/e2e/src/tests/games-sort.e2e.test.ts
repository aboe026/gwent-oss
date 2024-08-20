import { t } from 'testcafe'

import GamesPage, { GameInList } from '../page-objects/games-page'
import ApiClient from '../util/api-client'
import { FactionKey, GamePlayer } from '@gwent/graphql-schema/resolver-typings'
import LoginPage from '../page-objects/login-page'
import { SORT_FIELD } from '@gwent/graphql-schema/games-filter'

fixture('Games Sort')
  .page(GamesPage.getUrl())
  .beforeEach(async () => {
    const scenario = 'games-sort'
    t.ctx.username = `${scenario}-user-${Date.now()}`
    t.ctx.opponent = `${scenario}-opponent-${Date.now()}`
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
      name: `${scenario}-deck-1-${Date.now()}`,
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
      name: `${scenario}-deck-2-${Date.now()}`,
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

test('Sorts by updated ascending by default', async () => {
  await verifySortOrder(false)
})

test('Sorts by updated descending', async () => {
  await GamesPage.changeSortOrder()
  await verifySortOrder(true)
})

test('Sorts by created ascending', async () => {
  await GamesPage.setSortField(SORT_FIELD.Created)
  await verifySortOrder(false)
})

test('Sorts by created descending', async () => {
  await GamesPage.setSortField(SORT_FIELD.Created)
  await GamesPage.changeSortOrder()
  await verifySortOrder(true)
})

test('Sorts by owner ascending', async () => {
  await GamesPage.setSortField(SORT_FIELD.Creator)
  await verifySortOrder(false)
})

test('Sorts by owner descending', async () => {
  await GamesPage.setSortField(SORT_FIELD.Creator)
  await GamesPage.changeSortOrder()
  await verifySortOrder(true)
})

test('Sorts by status ascending', async () => {
  await GamesPage.setSortField(SORT_FIELD.Status)
  await verifySortOrder(false)
})

test('Sorts by status descending', async () => {
  await GamesPage.setSortField(SORT_FIELD.Status)
  await GamesPage.changeSortOrder()
  await verifySortOrder(true)
})

async function verifySortOrder(first: boolean) {
  const game1: GameInList = {
    created: t.ctx.game1.created,
    owner: t.ctx.game1.creator.name,
    players: t.ctx.game1.players.map((player: GamePlayer) => player.user.name),
    status: t.ctx.game1.status,
  }
  const game2: GameInList = {
    created: t.ctx.game2.created,
    owner: t.ctx.game2.creator.name,
    players: t.ctx.game2.players.map((player: GamePlayer) => player.user.name),
    status: t.ctx.game2.status,
    factions: t.ctx.game2.players.map((player: GamePlayer) => player.faction?.name),
  }
  await GamesPage.verify({
    games: [first ? game1 : game2, first ? game2 : game1],
  })
}
