import { graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import {
  Combat,
  Deck,
  DeckUnit,
  Faction,
  FactionKey,
  Game,
  GameDeck,
  Leader,
  Unit,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import {
  getDeckFragment,
  getDeckUnitFragment,
  getFactionFragment,
  getGameDeckFragment,
  getGameFragment,
  getLeaderFragment,
  getUnitFragment,
} from './fragment-util'
import schema from '../../../src/graphql/executable-schema'
import TestUtil from '../../util/test-util'

export async function addUser(name: string, password = 'password'): Promise<User> {
  const response = await graphql({
    schema,
    source: `mutation AddUser($name: String!, $password: String!) {
      addUser(name: $name, password: $password) {
        created
        id
        name
      }
    }`,
    variableValues: {
      name,
      password,
    },
  })
  if (response.errors) {
    throw Error(JSON.stringify(response.errors))
  }
  expect(response).toEqual({
    data: {
      addUser: {
        created: expect.any(Date),
        id: expect.any(String),
        name,
      },
    },
  })
  if (!response.data?.addUser) {
    throw Error(`Could not add user "${name}"`)
  }
  return response.data.addUser as User
}

export async function getFactionId({ key }: { key: FactionKey }): Promise<string> {
  const response = await graphql({
    schema,
    source: `{
      factions {
        ${getFactionFragment()}
      }
    }`,
    contextValue: {
      session: {
        user: {
          _id: new ObjectId(),
        },
      },
    },
  })
  if (response.errors) {
    throw Error(JSON.stringify(response.errors))
  }
  const faction = (response.data?.factions as Faction[]).find((faction: Faction) => faction.key === key)
  if (!faction) {
    throw Error(`Could not find faction with key "${key}" in response "${JSON.stringify(response)}"`)
  }
  return faction.id
}

export async function getLeaderId({ name, faction }: { name?: string; faction?: FactionKey }): Promise<string> {
  const response = await graphql({
    schema,
    source: `{
      leaders {
        ${getLeaderFragment()}
      }
    }`,
    contextValue: {
      session: {
        user: {
          _id: new ObjectId(),
        },
      },
    },
  })
  if (response.errors) {
    throw Error(JSON.stringify(response.errors))
  }
  let leader: Leader | undefined = undefined
  if (name) {
    leader = (response.data?.leaders as any).find((leader: any) => leader.name === name)
  } else if (faction) {
    leader = (response.data?.leaders as any).find((leader: any) => leader.faction.key === faction)
  } else {
    throw Error('No leader or faction specified to scope leader to')
  }
  if (!leader) {
    throw Error(
      `Could not find leader with ${name ? `name "${name}"` : `faction "${faction}"`} in response "${JSON.stringify(
        response
      )}"`
    )
  }
  return leader.id
}

export async function getUnits({ factions }: { factions: FactionKey[] }): Promise<Unit[]> {
  const response = await graphql({
    schema,
    source: `{
      units(factions: [${factions.join(',')}], deckable: true) {
        ${getUnitFragment()}
      }
    }`,
    contextValue: {
      session: {
        user: {
          _id: new ObjectId(),
        },
      },
    },
  })
  if (response.errors) {
    throw Error(JSON.stringify(response.errors))
  }
  let units: Unit[] | undefined = undefined
  if (response.data?.units && Array.isArray(response.data.units)) {
    units = response.data.units
  }
  if (!units || units.length < 1) {
    throw Error(`Could not get units from response: "${JSON.stringify(response)}"`)
  }
  return units
}

export async function getStrengthUnits({
  faction,
  allStrengthUnits = true,
  unitNames,
}: {
  faction: FactionKey
  allStrengthUnits?: boolean
  unitNames?: string[]
}): Promise<DeckUnit[]> {
  const units = await getUnits({
    factions: [faction, FactionKey.Neutral],
  })
  return units
    .filter((unit) => {
      const includedByStrength = allStrengthUnits && unit.strength !== null && unit.strength !== undefined
      const includedByName = unitNames && unitNames.includes(unit.name)
      return includedByStrength || includedByName
    })
    .map((unit) => {
      return {
        unit,
        artStyle: 1,
      }
    })
}

export function getUnitsInput(unitIds: string[]): string {
  return unitIds
    .map(
      (unitId) => `{
        id: "${unitId}"
      }`
    )
    .join(',')
}

export async function addDeck({
  faction,
  name,
  leader,
  userId,
  unitIds,
}: {
  name: string
  faction: FactionKey
  leader?: string
  userId?: string
  unitIds?: string[]
}): Promise<Deck> {
  if (!userId) {
    userId = (await addUser(`addDeck-${Date.now()}`)).id
  }
  const response = await graphql({
    schema,
    source: `mutation {
      addDeck(
        name: "${name}",
        faction: ${faction},
        leader: "${await getLeaderId({
          name: leader,
          faction,
        })}",
        units: [${await getUnitsInput(
          unitIds || (await getStrengthUnits({ faction })).map((deckUnit) => deckUnit.unit.id)
        )}]
      ) {
        ${getDeckFragment()}
      }
    }`,
    contextValue: {
      session: {
        user: {
          _id: userId,
        },
      },
    },
  })
  if (response.errors) {
    throw Error(JSON.stringify(response.errors))
  }
  return response.data?.addDeck as Deck
}

export async function addGame({ opponentNames, creator }: { opponentNames: string[]; creator?: User }): Promise<Game> {
  if (!creator) {
    creator = await addUser(`addGame-${Date.now()}`)
  }
  const response = await graphql({
    schema,
    source: `mutation {
      addGame(
        opponentNames: ["${opponentNames.join('","')}"]
      ) {
        ${getGameFragment()}
      }
    }`,
    contextValue: {
      session: {
        user: TestUtil.getDbUserFromUser(creator),
      },
    },
  })
  if (response.errors) {
    throw Error(JSON.stringify(response.errors))
  }
  return response.data?.addGame as Game
}

export async function getGame({
  gameId,
  userId,
}: {
  gameId: string | ObjectId
  userId: string | ObjectId
}): Promise<Game> {
  const response = await graphql({
    schema,
    source: `{
      game(id: "${gameId}") {
        ${getGameFragment()}
      }
    }`,
    contextValue: {
      session: {
        user: {
          _id: userId,
        },
      },
    },
  })
  if (response.errors) {
    throw Error(JSON.stringify(response.errors))
  }
  return response.data?.game as Game
}

export async function setDeck({
  deckId,
  gameId,
  userId,
}: {
  deckId: string | ObjectId
  gameId: string | ObjectId
  userId?: string
}): Promise<GameDeck> {
  if (!userId) {
    userId = (await addUser(`setDeck-${Date.now()}`)).id
  }
  const response = await graphql({
    schema,
    source: `mutation {
      setDeck(
        deck: "${deckId}"
        game: "${gameId}"
      ) {
        ${getGameDeckFragment()}
      }
    }`,
    contextValue: {
      session: {
        user: {
          _id: userId,
        },
      },
    },
  })
  if (response.errors) {
    throw Error(JSON.stringify(response.errors))
  }
  return response.data?.setDeck as GameDeck
}

export async function getGameDeck({
  gameId,
  userId,
}: {
  gameId: string | ObjectId
  userId: string | ObjectId
}): Promise<GameDeck> {
  const response = await graphql({
    schema,
    source: `{
      gameDeck(game: "${gameId}") {
        ${getGameDeckFragment()}
      }
    }`,
    contextValue: {
      session: {
        user: {
          _id: userId,
        },
      },
    },
  })
  if (response.errors) {
    throw Error(JSON.stringify(response.errors))
  }
  return response.data?.gameDeck as GameDeck
}

export async function setOrder({
  gameId,
  users,
  userId,
}: {
  gameId: string | ObjectId
  users: (string | ObjectId)[]
  userId: string | ObjectId
}): Promise<Game> {
  const response = await graphql({
    schema,
    source: `mutation {
      setOrder(
        game: "${gameId}"
        users: ${JSON.stringify(users.map((user) => user.toString()))}
      ) {
        ${getGameFragment()}
      }
    }`,
    contextValue: {
      session: {
        user: {
          _id: userId,
        },
      },
    },
  })
  if (response.errors) {
    throw Error(JSON.stringify(response.errors))
  }
  return response.data?.setOrder as Game
}

export async function redraw({
  gameId,
  unitId,
  userId,
}: {
  gameId: string | ObjectId
  unitId: string | object
  userId: string | ObjectId
}): Promise<DeckUnit> {
  const response = await graphql({
    schema,
    source: `mutation {
      redraw(
        game: "${gameId}"
        unit: "${unitId}"
      ) {
        ${getDeckUnitFragment()}
      }
    }`,
    contextValue: {
      session: {
        user: {
          _id: userId,
        },
      },
    },
  })
  if (response.errors) {
    throw Error(JSON.stringify(response.errors))
  }
  return response.data?.redraw as DeckUnit
}

export async function ready({
  gameId,
  userId,
}: {
  gameId: string | ObjectId
  userId: string | ObjectId
}): Promise<Game> {
  const response = await graphql({
    schema,
    source: `mutation {
      ready(
        game: "${gameId}"
      ) {
        ${getGameFragment()}
      }
    }`,
    contextValue: {
      session: {
        user: {
          _id: userId,
        },
      },
    },
  })
  if (response.errors) {
    throw Error(JSON.stringify(response.errors))
  }
  return response.data?.ready as Game
}

export async function playPass({
  gameId,
  userId,
}: {
  gameId: string | ObjectId
  userId: string | ObjectId
}): Promise<Game> {
  const response = await graphql({
    schema,
    source: `mutation {
      playPass(
        game: "${gameId}"
      ) {
        ${getGameFragment()}
      }
    }`,
    contextValue: {
      session: {
        user: {
          _id: userId,
        },
      },
    },
  })
  if (response.errors) {
    throw Error(JSON.stringify(response.errors))
  }
  return response.data?.playPass as Game
}

export async function playUnit({
  gameId,
  userId,
  unitId,
  combat,
}: {
  gameId: string | ObjectId
  userId: string | ObjectId
  unitId: string | ObjectId
  combat: Combat
}): Promise<Game> {
  const response = await graphql({
    schema,
    source: `mutation {
      playUnit(
        game: "${gameId}"
        unit: "${unitId}"
        combat: ${combat}
      ) {
        ${getGameFragment()}
      }
    }`,
    contextValue: {
      session: {
        user: {
          _id: userId,
        },
      },
    },
  })
  if (response.errors) {
    throw Error(JSON.stringify(response.errors))
  }
  return response.data?.playUnit as Game
}

export async function getHandUnit({
  gameId,
  userId,
  unitName,
}: {
  gameId: string | ObjectId
  userId: string | ObjectId
  unitName: string
}): Promise<DeckUnit> {
  const gameDeck = await getGameDeck({
    gameId,
    userId,
  })
  const unit = gameDeck.hand.find((handUnit) => handUnit.unit.name === unitName)
  if (!unit) {
    throw Error(`Could not find unit "${unitName}" in game "${gameId}" for user "${userId}"`)
  }
  return unit
}
