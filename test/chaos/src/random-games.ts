import fs from 'fs/promises'

import { createClient, Deck, FactionKey, GwentClient, User } from '@gwent/node-client'
import env from './env'
import { getRandomItem, RandomizeDeckUnits, randomizeOrder } from '@gwent/utils'

const PASSWORD = 'password'

//
;(async () => {
  await fs.rm(env.LOG_FILE, {
    force: true,
  })
  const client = createClient({
    graphqlUrl: env.API_URL,
  })
  const self = await client.addUser({
    name: `rando-self-${Date.now()}`,
    password: PASSWORD,
  })
  const opponent = await client.addUser({
    name: `rando-opponent-${Date.now()}`,
    password: PASSWORD,
  })
  await log(`Self username: "${self.name}"`)
  await log(`Opponent username: "${opponent.name}"`)
  for (let i = 0; i < env.GAMES_TO_PLAY; i++) {
    await createAndPlayGame({
      self,
      opponent,
      index: i,
    })
  }
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

async function log(text: string) {
  console.log(text)
  await fs.appendFile(env.LOG_FILE, `${text}\n`, {
    encoding: 'utf-8',
  })
}

async function createAndPlayGame({ self, opponent, index }: { self: User; opponent: User; index: number }) {
  await log(`Creating Game ${index + 1}/${env.GAMES_TO_PLAY}`)
  const selfClient = await createClient({
    graphqlUrl: env.API_URL,
    username: self.name,
    password: PASSWORD,
  })
  const opponentClient = await createClient({
    graphqlUrl: env.API_URL,
    username: opponent.name,
    password: PASSWORD,
  })

  const game = await selfClient.addGame({
    opponentNames: [opponent.name],
  })

  const selfDeck = await createRandomDeck({
    client: selfClient,
    index,
  })
  const opponentDeck = await createRandomDeck({
    client: opponentClient,
    index,
  })

  await log(`Self Deck ID: "${selfDeck.id}"`)
  await log(`Opponent Deck ID: "${opponentDeck.id}"`)

  await log(`Game ${index + 1}/${env.GAMES_TO_PLAY} ID: "${game.id}"`)

  await selfClient.setDeck({
    deck: selfDeck.id,
    game: game.id,
  })
  await opponentClient.setDeck({
    deck: opponentDeck.id,
    game: game.id,
  })

  const selfScoiatael = selfDeck.faction.key === FactionKey.ScoiaTael
  const opponentScoiatael = opponentDeck.faction.key === FactionKey.ScoiaTael
  if ((selfScoiatael || opponentScoiatael) && !(selfScoiatael && opponentScoiatael)) {
    await log(`User "${selfScoiatael ? opponent.name : self.name}" has Scoia'Tael deck, setting order`)
    const client = selfScoiatael ? selfClient : opponentClient
    await client.setOrder({
      game: game.id,
      users: randomizeOrder([self.id, opponent.id]),
    })
  }

  //
}

async function createRandomDeck({ client, index }: { client: GwentClient; index: number }): Promise<Deck> {
  const faction = getRandomItem({
    items: [
      FactionKey.Monsters,
      FactionKey.NilfgaardianEmpire,
      FactionKey.NorthernRealms,
      FactionKey.ScoiaTael,
      FactionKey.Skellige,
    ],
  })
  const leaders = await client.leaders({
    factions: [faction],
  })
  const units = await client.units({
    deckable: true,
    factions: [faction, FactionKey.Neutral],
  })

  return client.addDeck({
    faction,
    leader: getRandomItem({
      items: leaders,
    }).id,
    name: `deck-${index + 1}`,
    units: RandomizeDeckUnits.fromUnits({
      units,
    }).map((unitId) => {
      return {
        id: unitId,
        artStyle: 1,
      }
    }),
  })
}
