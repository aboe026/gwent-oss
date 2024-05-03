import { ObjectId } from 'mongodb'

import {
  DeckDbObject,
  FactionDbObject,
  LeaderDbObject,
  UnitDbObject,
  UserDbObject,
} from '@gwent/graphql-schema/database-typings'
import { DeckResolvers } from '@gwent/graphql-schema/resolver-typings'
import FactionStore from '../../database/stores/faction-store'
import LeaderStore from '../../database/stores/leader-store'
import UnitStore from '../../database/stores/unit-store'
import UserStore from '../../database/stores/user-store'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DeckResolver: DeckResolvers<any, DeckDbObject> = {
  faction: async (deck: DeckDbObject) => {
    if (ObjectId.isValid(deck.faction)) {
      const factions = await FactionStore.get({
        ids: [deck.faction],
      })
      return factions[0]
    }
    return deck.faction as any as FactionDbObject // eslint-disable-line @typescript-eslint/no-explicit-any
  },
  id: (deck: DeckDbObject) => deck._id.toString(),
  leader: async (deck: DeckDbObject) => {
    if (ObjectId.isValid(deck.leader)) {
      const leaders = await LeaderStore.get({
        ids: [deck.leader],
      })
      return leaders[0]
    }
    return deck.leader as any as LeaderDbObject // eslint-disable-line @typescript-eslint/no-explicit-any
  },
  units: async (deck: DeckDbObject) => {
    const deckUnits: {
      artStyle: number
      unit: UnitDbObject
    }[] = []

    const unitIdsToGet: ObjectId[] = []
    for (const deckUnit of deck.units) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(deckUnit as any).unit) {
        const id = (deckUnit as any).id.toString() // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!unitIdsToGet.includes(id)) {
          unitIdsToGet.push(id)
        }
      } else {
        deckUnits.push({
          artStyle: (deckUnit as any).artStyle, // eslint-disable-line @typescript-eslint/no-explicit-any
          unit: deckUnit.unit as any as UnitDbObject, // eslint-disable-line @typescript-eslint/no-explicit-any
        })
      }
    }

    if (unitIdsToGet.length > 0) {
      const units = await UnitStore.get({
        ids: unitIdsToGet,
      })
      for (const deckUnit of deck.units) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(deckUnit as any).unit) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const id = (deckUnit as any).id.toString()
          const dbUnit = units.find((unit) => unit._id.toString() === id)
          if (!dbUnit) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            throw Error(`Could not find unit with ID "${id}".`)
          }
          deckUnits.push({
            artStyle: deckUnit.artStyle as number,
            unit: dbUnit,
          })
        }
      }
    }

    return deckUnits
  },
  user: async (deck: DeckDbObject) => {
    if (ObjectId.isValid(deck.user)) {
      return UserStore.get(deck.user)
    }
    return deck.user as any as UserDbObject // eslint-disable-line @typescript-eslint/no-explicit-any
  },
}

export default DeckResolver
