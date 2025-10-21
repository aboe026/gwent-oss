import fs from 'fs/promises'

import {
  Combat,
  createClient,
  Deck,
  DeckUnit,
  FactionKey,
  GameDeck,
  GameStatus,
  GwentClient,
  User,
} from '@gwent/node-client'
import env from './env'
import { getRandomItem, getRandomNumber, RandomizeDeckUnits, randomizeOrder, toTitleCase } from '@gwent/utils'
import { MAX_REDRAWS } from '@gwent/constants'

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
  await log(`********** Game ${index + 1}/${env.GAMES_TO_PLAY} **********`)
  const selfClient = await createClient({
    graphqlUrl: env.API_URL,
    username: self.name,
    password: PASSWORD,
  })
  const oppClient = await createClient({
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
  const oppDeck = await createRandomDeck({
    client: oppClient,
    index,
  })

  await log(`Self Deck ID: "${selfDeck.id}"`)
  await log(`Opponent Deck ID: "${oppDeck.id}"`)

  await log(`Game ${index + 1}/${env.GAMES_TO_PLAY} ID: "${game.id}"`)

  const selfGameDeck = await selfClient.setDeck({
    deck: selfDeck.id,
    game: game.id,
  })
  const oppGameDeck = await oppClient.setDeck({
    deck: oppDeck.id,
    game: game.id,
  })

  const selfScoiatael = selfDeck.faction.key === FactionKey.ScoiaTael
  const oppScoiatael = oppDeck.faction.key === FactionKey.ScoiaTael
  if ((selfScoiatael || oppScoiatael) && !(selfScoiatael && oppScoiatael)) {
    const order = randomizeOrder([self.id, opponent.id])
    await log(
      `User "${selfScoiatael ? opponent.name : self.name}" has Scoia'Tael deck, setting order to "${JSON.stringify(order)}"`
    )
    const client = selfScoiatael ? selfClient : oppClient
    await client.setOrder({
      game: game.id,
      users: order,
    })
  }

  await redrawRandomly({
    gameId: game.id,
    client: selfClient,
    gameDeck: selfGameDeck,
    username: self.name,
  })
  await redrawRandomly({
    gameId: game.id,
    client: oppClient,
    gameDeck: oppGameDeck,
    username: opponent.name,
  })

  await selfClient.ready({
    game: game.id,
  })
  await oppClient.ready({
    game: game.id,
  })

  await playGame({
    gameId: game.id,
    self: {
      client: selfClient,
      user: self,
    },
    opponent: {
      client: oppClient,
      user: opponent,
    },
  })

  await log('\n')
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

async function redrawRandomly({
  client,
  gameId,
  gameDeck,
  username,
}: {
  client: GwentClient
  gameId: string
  gameDeck: GameDeck
  username: string
}): Promise<DeckUnit[]> {
  const redraws: DeckUnit[] = []
  const redrawTotal = getRandomNumber({
    min: 0,
    max: MAX_REDRAWS,
  })
  await log(`Redrawing "${redrawTotal}" times for user "${username}"`)
  for (let i = 0; i < redrawTotal; i++) {
    const index = getRandomNumber({
      min: 0,
      max: gameDeck.hand.length - 1,
    })
    const from = gameDeck.hand.splice(index, 1)[0]
    await log(`Redrawing user "${username}" hand unit from "${from.unit.name}" (${from.unit.id})...`)
    const to = await client.redraw({
      game: gameId,
      unit: from.unit.id,
    })
    redraws.push(to)
    gameDeck.hand.push(to)
    await log(`...to "${to.unit.name}" (${to.unit.id})`)
  }
  return redraws
}

async function playGame({ gameId, self, opponent }: { gameId: string; self: Player; opponent: Player }) {
  await log('--------- Round 1 ----------')
  await playRound({
    gameId,
    opponent,
    self,
    index: 1,
  })
  await log('--------- Round 2 ----------')
  await playRound({
    gameId,
    opponent,
    self,
    index: 2,
  })
  let game = await self.client.game({
    id: gameId,
  })
  if (game.status === GameStatus.Playing) {
    await log('--------- Round 3 ----------')
    await playRound({
      gameId,
      opponent,
      self,
      index: 3,
    })
  }
  game = await self.client.game({
    id: gameId,
  })
  for (const player of game.players) {
    await log(`Player "${player.user.name}" ended game with "${player.counts?.hand}" units in hand`)
  }
  await log('---------- Game Summary ----------')
  for (const victor of game.victors) {
    const player = game.players.find((player) => player.user.id === victor.id)
    await log(
      `Player "${victor.name} ${game.victors.length === 1 ? 'Won' : 'Tied'} game "${gameId}" with rounds "${JSON.stringify(player?.rounds.map((round) => round.result))}"`
    )
  }
}

async function playRound({
  gameId,
  self,
  opponent,
  index,
}: {
  gameId: string
  self: Player
  opponent: Player
  index: number
}) {
  await log(`Playing round "${index}" for game "${gameId}"`)
  let selfPassed = false
  let oppPassed = false

  while (!selfPassed || !oppPassed) {
    const game = await self.client.game({
      id: gameId,
    })
    const isSelf = game.turn?.user.id === self.user.id
    const name = isSelf ? self.user.name : opponent.user.name
    const client = isSelf ? self.client : opponent.client

    const pass = getRandomNumber({
      min: 0,
      max: 4,
    })

    const gameDeck = await client.gameDeck({
      game: gameId,
    })
    if (pass === 0 || gameDeck?.hand.length === 0) {
      await log(`Playing pass for user "${name}"`)
      await client.playPass({
        game: gameId,
      })
      if (isSelf) {
        selfPassed = true
      } else {
        oppPassed = true
      }
    } else {
      if (gameDeck?.hand) {
        const unit = getRandomItem({
          items: gameDeck?.hand,
        })
        let combat: Combat | undefined = undefined
        if (unit.unit.combats && unit.unit.combats.length > 0) {
          combat = getRandomItem({
            items: unit.unit.combats,
          })
        }
        await log(`Playing unit "${unit.unit.name}" (${unit.unit.id}) for user "${name}"`)
        await client.playUnit({
          game: gameId,
          unit: unit.unit.id,
          combat,
        })
      } else {
        throw Error(`Could not get game hande for "${name}"`)
      }
    }
  }
  const game = await self.client.game({
    id: gameId,
  })
  for (const player of game.players) {
    const round = player.rounds[index - 1]
    await log(
      `Player "${player.user.name}" "${toTitleCase(round.result || '')}" round "${index}" with score of "${round.score}"`
    )
  }
}

interface Player {
  user: User
  client: GwentClient
}
