import { graphql } from 'graphql'

import { addUser, addDeck } from './util/graphql-util'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { expectizeDeck, verifyMongoIds } from './util/expect-util'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { getDeckFragment } from './util/fragment-util'
import { getStrengthUnits } from './util/graphql-util'
import schema from '../../src/graphql/executable-schema'

describe('decks-query', () => {
  beforeAll(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('decks', () => {
    it('returns empty array if user has no decks', async () => {
      const user = await addUser(`decks-${Date.now()}`)
      const response = await graphql({
        schema,
        source: `{
          decks {
            ${getDeckFragment({})}
          }
        }`,
        contextValue: {
          session: {
            user: {
              _id: user.id,
            },
          },
        },
      })
      expect(response).toEqual({
        data: {
          decks: [],
        },
      })
      verifyMongoIds(response?.data?.decks)
    })
    it('returns single deck if user has only one', async () => {
      const faction = FactionKey.NorthernRealms
      const leader = 'Foltest the Siegemaster'
      const name = 'single-deck'
      const user = await addUser(`decks-${Date.now()}`)
      await addDeck({
        faction,
        name,
        leader,
        userId: user.id,
      })
      const response = await graphql({
        schema,
        source: `{
          decks {
            ${getDeckFragment({})}
          }
        }`,
        contextValue: {
          session: {
            user: {
              _id: user.id,
            },
          },
        },
      })
      expect(response).toEqual({
        data: {
          decks: [
            expectizeDeck({
              factionKey: faction,
              leaderName: leader,
              name,
              unitNames: (await getStrengthUnits(faction)).map((unit) => unit.unit.name),
              user,
            }),
          ],
        },
      })
      verifyMongoIds(response?.data?.decks)
    })
    it('returns multiple decks if user has many', async () => {
      const deck1 = {
        faction: FactionKey.ScoiaTael,
        leader: 'Francesca Findabair Hope of the Aen Seidhe',
        name: 'multi-deck-1',
      }
      const deck2 = {
        faction: FactionKey.Skellige,
        leader: 'King Bran',
        name: 'multi-deck-2',
      }
      const user = await addUser(`decks-${Date.now()}`)
      await addDeck({
        faction: deck1.faction,
        name: deck1.name,
        leader: deck1.leader,
        userId: user.id,
      })
      await addDeck({
        faction: deck2.faction,
        name: deck2.name,
        leader: deck2.leader,
        userId: user.id,
      })
      const response = await graphql({
        schema,
        source: `{
          decks {
            ${getDeckFragment({})}
          }
        }`,
        contextValue: {
          session: {
            user: {
              _id: user.id,
            },
          },
        },
      })
      expect(response).toEqual({
        data: {
          decks: [
            expectizeDeck({
              factionKey: deck1.faction,
              leaderName: deck1.leader,
              name: deck1.name,
              unitNames: (await getStrengthUnits(deck1.faction)).map((unit) => unit.unit.name),
              user,
            }),
            expectizeDeck({
              factionKey: deck2.faction,
              leaderName: deck2.leader,
              name: deck2.name,
              unitNames: (await getStrengthUnits(deck2.faction)).map((unit) => unit.unit.name),
              user,
            }),
          ],
        },
      })
      verifyMongoIds(response?.data?.decks)
    })
    describe('stats', () => {
      it('returns decks without neutral stats if no inputs provided', async () => {
        const faction = FactionKey.NorthernRealms
        const leader = 'Foltest the Siegemaster'
        const name = 'single-deck'
        const user = await addUser(`decks-${Date.now()}`)
        await addDeck({
          faction,
          name,
          leader,
          userId: user.id,
        })
        const response = await graphql({
          schema,
          source: `{
          decks {
            ${getDeckFragment({})}
          }
        }`,
          contextValue: {
            session: {
              user: {
                _id: user.id,
              },
            },
          },
        })
        expect(response).toEqual({
          data: {
            decks: [
              expectizeDeck({
                factionKey: faction,
                leaderName: leader,
                name,
                unitNames: (await getStrengthUnits(faction)).map((unit) => unit.unit.name),
                user,
              }),
            ],
          },
        })
        verifyMongoIds(response?.data?.decks)
      })
    })
  })
})
