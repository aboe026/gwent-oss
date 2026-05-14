import fs from 'fs/promises'

import createGwentClient, {
  Combat,
  Deck,
  DeckUnit,
  EffectKey,
  FactionKey,
  FieldUnit,
  GameDeck,
  GamePlayer,
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
  const start = Date.now()
  await fs.rm(env.LOG_FILE, {
    force: true,
  })
  const client = createGwentClient({
    graphqlUrl: env.API_URL,
  })
  const selfName = `rando-self-${Date.now()}`
  const oppName = `rando-opponent-${Date.now()}`
  await log(`Self username: "${selfName}"`)
  await log(`Opponent username: "${oppName}"`)

  const self: Player = {
    client: createGwentClient({
      graphqlUrl: env.API_URL,
      username: selfName,
      password: PASSWORD,
    }),
    user: await client.addUser({
      name: selfName,
      password: PASSWORD,
    }),
  }
  const opponent: Player = {
    client: createGwentClient({
      graphqlUrl: env.API_URL,
      username: oppName,
      password: PASSWORD,
    }),
    user: await client.addUser({
      name: oppName,
      password: PASSWORD,
    }),
  }

  for (let i = 0; i < env.GAMES_TO_PLAY; i++) {
    await createAndPlayGame({
      self,
      opponent,
      index: i,
    })
  }
  await log(`Completed in "${((Date.now() - start) / (1000 * 60)).toFixed(2)}" minute(s)`)
})().catch(async (err) => {
  await log(`❌ Error: "${JSON.stringify(err)}"`)
  process.exitCode = 1
})

async function log(text: string) {
  console.log(text)
  await fs.appendFile(env.LOG_FILE, `${text}\n`, {
    encoding: 'utf-8',
  })
}

async function createAndPlayGame({ self, opponent, index }: { self: Player; opponent: Player; index: number }) {
  await log(`🚀 ********** Game ${index + 1}/${env.GAMES_TO_PLAY} **********`)

  const game = await self.client.addGame({
    opponentNames: [opponent.user.name],
  })

  const selfDeck = await createRandomDeck({
    client: self.client,
    index,
  })
  const oppDeck = await createRandomDeck({
    client: opponent.client,
    index,
  })

  await log(`Self Deck ID: "${selfDeck.id}"`)
  await log(`Opponent Deck ID: "${oppDeck.id}"`)

  await log(`Game ${index + 1}/${env.GAMES_TO_PLAY} ID: "${game.id}"`)

  const selfGameDeck = await self.client.setDeck({
    deck: selfDeck.id,
    game: game.id,
  })
  const oppGameDeck = await opponent.client.setDeck({
    deck: oppDeck.id,
    game: game.id,
  })

  const selfScoiatael = selfDeck.faction.key === FactionKey.ScoiaTael
  const oppScoiatael = oppDeck.faction.key === FactionKey.ScoiaTael
  if ((selfScoiatael || oppScoiatael) && !(selfScoiatael && oppScoiatael)) {
    const order = randomizeOrder([self.user.id, opponent.user.id])
    await log(
      `User "${selfScoiatael ? opponent.user : self.user.name}" has Scoia'Tael deck, setting order to "${JSON.stringify(order)}"`
    )
    const client = selfScoiatael ? self.client : opponent.client
    await client.setOrder({
      game: game.id,
      users: order,
    })
  }

  await redrawRandomly({
    gameId: game.id,
    client: self.client,
    gameDeck: selfGameDeck,
    username: self.user.name,
  })
  await redrawRandomly({
    gameId: game.id,
    client: opponent.client,
    gameDeck: oppGameDeck,
    username: opponent.user.name,
  })

  await self.client.ready({
    game: game.id,
  })
  await opponent.client.ready({
    game: game.id,
  })

  await playGame({
    gameId: game.id,
    self,
    opponent,
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
  const start = Date.now()
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
  await log('********** Game Summary **********')
  await log(`Game "${game.id}" took "${((Date.now() - start) / 1000).toFixed(2)}" seconds to play`)
  for (const player of game.players) {
    await log(`Player "${player.user.name}" ended game with "${player.counts?.hand}" units in hand`)
  }
  for (const victor of game.victors) {
    const player = game.players.find((player) => player.user.id === victor.id)
    await log(
      `🏆 Player "${victor.name} ${game.victors.length === 1 ? 'Won' : 'Tied'} game "${gameId}" with rounds "${JSON.stringify(player?.rounds.map((round) => round.result))}"`
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
    if (gameDeck?.hand) {
      const player = game.players.find((player) => player.user.id === game.turn?.user.id)
      const round = player?.rounds[game.round - 1]
      const rowsAvailableToModify: Combat[] = []
      if (!round?.close.modifier) {
        rowsAvailableToModify.push(Combat.Close)
      }
      if (!round?.ranged.modifier) {
        rowsAvailableToModify.push(Combat.Ranged)
      }
      if (!round?.siege.modifier) {
        rowsAvailableToModify.push(Combat.Siege)
      }
      let modifiersInHand = 0
      const playableHand: DeckUnit[] = []

      const playerBattlefieldUnits: FieldUnit[] = []
      for (const row of [round?.close, round?.ranged, round?.siege]) {
        if (row?.units) {
          playerBattlefieldUnits.push(...row.units)
        }
      }
      const decoyableFieldUnits: FieldUnit[] = playerBattlefieldUnits.filter(
        (battlefieldUnit) => !battlefieldUnit.unit.hero && !battlefieldUnit.unit.special
      )

      for (const deckUnit of gameDeck.hand) {
        let playable = true

        // modifiers
        if (deckUnit.unit.modifier) {
          if (modifiersInHand < rowsAvailableToModify.length) {
            modifiersInHand++
          } else {
            playable = false
          }
        }

        // decoys
        if (
          deckUnit.unit.effects?.some((effect) => effect.key === EffectKey.Decoy) &&
          decoyableFieldUnits.length <= 0
        ) {
          playable = false
        }

        if (playable) {
          playableHand.push(deckUnit)
        }
      }
      if (pass === 0 || playableHand.length === 0) {
        await log(`🏳️ Playing pass for user "${name}"`)
        await client.playPass({
          game: gameId,
        })
        if (isSelf) {
          selfPassed = true
        } else {
          oppPassed = true
        }
      } else {
        const unit = getRandomItem({
          items: playableHand,
        })
        let combat: Combat | undefined = undefined
        let targetFieldUnit: FieldUnit | undefined = undefined
        let targetSpyUser: GamePlayer | undefined = undefined
        if (unit.unit.modifier) {
          const combatIndex = getRandomNumber({
            min: 0,
            max: rowsAvailableToModify.length - 1,
          })
          combat = rowsAvailableToModify.splice(combatIndex, 1)[0]
        } else if (unit.unit.combats && unit.unit.combats.length > 0) {
          combat = getRandomItem({
            items: unit.unit.combats,
          })
        }
        if (unit.unit.effects?.some((effect) => effect.key === EffectKey.Decoy)) {
          targetFieldUnit = getRandomItem({
            items: decoyableFieldUnits,
          })
        } else if (unit.unit.effects?.some((effect) => effect.key === EffectKey.Spy)) {
          targetSpyUser = getRandomItem({
            items: game.players.filter((player) => player.user.id !== game.turn?.user.id),
          })
        }
        const targetFieldUnitText = targetFieldUnit
          ? ` on target "${targetFieldUnit.unit.name}" (${targetFieldUnit.unit.id})`
          : ''
        const targetSpyUserText = targetSpyUser
          ? ` to spy on user "${targetSpyUser.user.name}" (${targetSpyUser.user.id})`
          : ''
        await log(
          `🪖 Playing unit "${unit.unit.name}" (${unit.unit.id}) as "${combat}" for user "${name}"${targetFieldUnitText || targetSpyUserText}`
        )
        const targetId = targetSpyUser?.user.id || targetFieldUnit?.unit.id
        await client.playUnit({
          game: gameId,
          unit: unit.unit.id,
          combat: targetFieldUnit ? targetFieldUnit.row : combat,
          targets: targetId ? [targetId] : undefined,
        })
      }
    } else {
      throw Error(`Could not get game hand for "${name}"`)
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
