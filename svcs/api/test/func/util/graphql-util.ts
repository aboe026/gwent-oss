import { graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { Deck, DeckUnit, FactionKey, Leader, Unit, User } from '@gwent/graphql-schema/resolver-typings'
import { getDeckFragment, getLeaderFragment, getUnitFragment } from './fragment-util'
import schema from '../../../src/graphql/executable-schema'

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

export async function getLeaderId({ name, faction }: { name?: string; faction?: FactionKey }): Promise<string> {
  const leadersResponse = await graphql({
    schema,
    source: `{
      leaders {
        ${getLeaderFragment({})}
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
  let leader: Leader | undefined = undefined
  if (name) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    leader = (leadersResponse.data?.leaders as any).find((leader: any) => leader.name === name)
  } else if (faction) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    leader = (leadersResponse.data?.leaders as any).find((leader: any) => leader.faction.key === faction)
  } else {
    throw Error('No leader or faction specified to scope leader to')
  }
  if (!leader) {
    throw Error(
      `Could not find leader with ${name ? `name "${name}"` : `faction "${faction}"`} in response "${JSON.stringify(
        leadersResponse
      )}"`
    )
  }
  return leader.id
}

export async function getUnits({ factions }: { factions: FactionKey[] }): Promise<Unit[]> {
  const unitsResponse = await graphql({
    schema,
    source: `{
      units(factions: [${factions.join(',')}], deckable: true) {
        ${getUnitFragment({})}
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
  let units: Unit[] | undefined = undefined
  if (unitsResponse.data?.units && Array.isArray(unitsResponse.data.units)) {
    units = unitsResponse.data.units
  }
  if (!units || units.length < 1) {
    throw Error(`Could not get units from response: "${JSON.stringify(unitsResponse)}"`)
  }
  return units
}

export async function getStrengthUnits(faction: FactionKey): Promise<DeckUnit[]> {
  const units = await getUnits({
    factions: [faction],
  })
  return units
    .filter((unit) => unit.strength !== null || unit.strength !== undefined)
    .map((unit) => {
      return {
        unit,
        artStyle: 1,
      }
    })
}

export async function getUnitsInput(faction: FactionKey): Promise<string> {
  const deckUnits = await getStrengthUnits(faction)

  return deckUnits
    .map(
      (deckUnit) => `{
        id: "${deckUnit.unit.id}"
      }`
    )
    .join(',')
}

export async function addDeck({
  faction,
  name,
  leader,
  userId,
}: {
  name: string
  faction: FactionKey
  leader?: string
  userId?: string
}): Promise<Deck> {
  if (!userId) {
    userId = (await addUser(`create-deck-${Date.now()}`)).id
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
        units: [${await getUnitsInput(faction)}]
      ) {
        ${getDeckFragment({})}
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
  return response.data?.addDeck as Deck
}
