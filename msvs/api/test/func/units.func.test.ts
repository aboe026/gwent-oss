import { graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { expectizeUnits, verifyMongoIds } from './util/expect-util'
import { FactionKey, Unit } from '@gwent-oss/graphql-schema/resolver-typings'
import { getUnitFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'

describe('units', () => {
  describe('deckable', () => {
    it('returns all units if deckable not provided', async () => {
      const response = await graphql({
        schema,
        source: `{
          units {
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
      expect(response).toEqual({
        data: {
          units: expectizeUnits(),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns only deckable units if deckable true', async () => {
      const response = await graphql({
        schema,
        source: `{
          units(deckable: true) {
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
      expect(response).toEqual({
        data: {
          units: expectizeUnits().filter((unit) => unit.deckable === true),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns only non-deckable units if deckable false', async () => {
      const response = await graphql({
        schema,
        source: `{
          units(deckable: false) {
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
      expect(response).toEqual({
        data: {
          units: expectizeUnits().filter((unit) => unit.deckable === false),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
  })
  describe('factions', () => {
    it('returns no units if factions empty', async () => {
      const response = await graphql({
        schema,
        source: `{
          units(factions: []) {
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
      expect(response).toEqual({
        data: {
          units: [],
        },
      })
    })
    it('returns scoped units if monsters faction specified', async () => {
      const faction = FactionKey.Monsters
      const response = await graphql({
        schema,
        source: `{
          units(factions: [${faction}]) {
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
      expect(response).toEqual({
        data: {
          units: expectizeUnits().filter((unit) => unit.faction.key === faction),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns scoped units if neutral faction specified', async () => {
      const faction = FactionKey.Neutral
      const response = await graphql({
        schema,
        source: `{
          units(factions: [${faction}]) {
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
      expect(response).toEqual({
        data: {
          units: expectizeUnits().filter((unit) => unit.faction.key === faction),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns scoped units if nilfgaardian empire faction specified', async () => {
      const faction = FactionKey.NilfgaardianEmpire
      const response = await graphql({
        schema,
        source: `{
          units(factions: [${faction}]) {
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
      expect(response).toEqual({
        data: {
          units: expectizeUnits().filter((unit) => unit.faction.key === faction),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns scoped units if northern realms faction specified', async () => {
      const faction = FactionKey.NorthernRealms
      const response = await graphql({
        schema,
        source: `{
          units(factions: [${faction}]) {
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
      expect(response).toEqual({
        data: {
          units: expectizeUnits().filter((unit) => unit.faction.key === faction),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns scoped units if scoiatael faction specified', async () => {
      const faction = FactionKey.ScoiaTael
      const response = await graphql({
        schema,
        source: `{
          units(factions: [${faction}]) {
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
      expect(response).toEqual({
        data: {
          units: expectizeUnits().filter((unit) => unit.faction.key === faction),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns scoped units if skellige faction specified', async () => {
      const faction = FactionKey.Skellige
      const response = await graphql({
        schema,
        source: `{
          units(factions: [${faction}]) {
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
      expect(response).toEqual({
        data: {
          units: expectizeUnits().filter((unit) => unit.faction.key === faction),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns scoped units if monster and neutral factions specified', async () => {
      const factions = `[${FactionKey.Monsters}, ${FactionKey.Neutral}]`
      const response = await graphql({
        schema,
        source: `{
          units(factions: ${factions}) {
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
      expect(response).toEqual({
        data: {
          units: expectizeUnits().filter(
            (unit) => unit.faction.key === FactionKey.Monsters || unit.faction.key === FactionKey.Neutral
          ),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns all units if all factions specified', async () => {
      const factions = `[${FactionKey.Monsters}, ${FactionKey.Neutral}, ${FactionKey.NilfgaardianEmpire}, ${FactionKey.NorthernRealms}, ${FactionKey.ScoiaTael}, ${FactionKey.Skellige}]`
      const response = await graphql({
        schema,
        source: `{
          units(factions: ${factions}) {
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
      expect(response).toEqual({
        data: {
          units: expectizeUnits(),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
  })
  describe('effects', () => {
    describe('weather', () => {
      it('clear weather has correct ability text', async () => {
        const response = await graphql({
          schema,
          source: `{
            units {
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
        expect(
          (response.data?.units as Unit[])
            .filter((unit) => unit.name === 'Clear Weather')
            .flatMap((unit) => (unit.effects || []).map((effect) => effect.ability))
        ).toEqual(Array(3).fill('Remove all Weather effects which are active on the battlefield (including your own).'))
      })
      it('biting frost has correct ability text', async () => {
        const response = await graphql({
          schema,
          source: `{
            units {
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
        expect(
          (response.data?.units as Unit[])
            .filter((unit) => unit.name === 'Biting Frost')
            .flatMap((unit) => (unit.effects || []).map((effect) => effect.ability))
        ).toEqual(
          Array(3).fill(
            'Reduce the strength of any Unit(s) in a Close combat Row on the battlefield to 1 (including your own).'
          )
        )
      })
      it('impenetrable fog has correct ability text', async () => {
        const response = await graphql({
          schema,
          source: `{
            units {
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
        expect(
          (response.data?.units as Unit[])
            .filter((unit) => unit.name === 'Impenetrable Fog')
            .flatMap((unit) => (unit.effects || []).map((effect) => effect.ability))
        ).toEqual(
          Array(3).fill(
            'Reduce the strength of any Unit(s) in a Ranged combat Row on the battlefield to 1 (including your own).'
          )
        )
      })
      it('torrential rain has correct ability text', async () => {
        const response = await graphql({
          schema,
          source: `{
            units {
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
        expect(
          (response.data?.units as Unit[])
            .filter((unit) => unit.name === 'Torrential Rain')
            .flatMap((unit) => (unit.effects || []).map((effect) => effect.ability))
        ).toEqual(
          Array(3).fill(
            'Reduce the strength of any Unit(s) in a Siege combat Row on the battlefield to 1 (including your own).'
          )
        )
      })
      it('skellige storm has correct ability text', async () => {
        const response = await graphql({
          schema,
          source: `{
            units {
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
        expect(
          (response.data?.units as Unit[])
            .filter((unit) => unit.name === 'Skellige Storm')
            .flatMap((unit) => (unit.effects || []).map((effect) => effect.ability))
        ).toEqual(
          Array(3).fill(
            'Reduce the strength of any Unit(s) in a Ranged or Siege combat Row on the battlefield to 1 (including your own).'
          )
        )
      })
    })
    describe('muster', () => {
      it('no effect prefix does not modify ability text', async () => {
        const response = await graphql({
          schema,
          source: `{
            units {
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
        expect(
          (response.data?.units as Unit[])
            .filter((unit) => unit.name === 'Arachas')
            .flatMap((unit) => (unit.effects || []).map((effect) => effect.ability))
        ).toEqual(Array(3).fill('Summon any Units with the same name from your Hand or Draw pile to the battlefield.'))
      })
      it('effect prefix modifies ability text', async () => {
        const response = await graphql({
          schema,
          source: `{
            units {
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
        expect(
          (response.data?.units as Unit[])
            .filter((unit) => unit.name === 'Arachas Behemoth')
            .flatMap((unit) => (unit.effects || []).map((effect) => effect.ability))
        ).toEqual(
          Array(1).fill('Summon any Units with the "Arachas" prefix from your Hand or Draw pile to the battlefield.')
        )
      })
    })
    describe('scorch', () => {
      it('does not modify text if no scorch scope and special', async () => {
        const response = await graphql({
          schema,
          source: `{
            units {
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
        expect(
          (response.data?.units as Unit[])
            .filter((unit) => unit.name === 'Scorch')
            .flatMap((unit) => (unit.effects || []).map((effect) => effect.ability))
        ).toEqual(Array(3).fill('Send the strongest Unit(s) on the battlefield to their respective players Lost pile.'))
      })
      it('does not modify text if no scorch scope and not special', async () => {
        const response = await graphql({
          schema,
          source: `{
            units {
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
        expect(
          (response.data?.units as Unit[])
            .filter((unit) => unit.name === 'Clan Dimun Pirate')
            .flatMap((unit) => (unit.effects || []).map((effect) => effect.ability))
        ).toEqual(Array(1).fill('Send the strongest Unit(s) on the battlefield to their respective players Lost pile.'))
      })
      it('modifies the ability text if scorch scope and scorch minimum for close combat row', async () => {
        const response = await graphql({
          schema,
          source: `{
            units {
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
        expect(
          (response.data?.units as Unit[])
            .filter((unit) => unit.name === 'Villentretenmerth')
            .flatMap((unit) => (unit.effects || []).map((effect) => effect.ability))
        ).toEqual(
          Array(1).fill(
            'Send opponents strongest Unit(s) on their Close combat Row to their Lost pile if their Close combat Row score is 10 or more.'
          )
        )
      })
      it('modifies the ability text if scorch scope and scorch minimum for ranged combat row', async () => {
        const response = await graphql({
          schema,
          source: `{
            units {
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
        expect(
          (response.data?.units as Unit[])
            .filter((unit) => unit.name === 'Toad')
            .flatMap((unit) => (unit.effects || []).map((effect) => effect.ability))
        ).toEqual(
          Array(1).fill(
            'Send opponents strongest Unit(s) on their Ranged combat Row to their Lost pile if their Ranged combat Row score is 10 or more.'
          )
        )
      })
      it('modifies the ability text if scorch scope and scorch minimum for siege combat row', async () => {
        const response = await graphql({
          schema,
          source: `{
            units {
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
        expect(
          (response.data?.units as Unit[])
            .filter((unit) => unit.name === 'Schirru')
            .flatMap((unit) => (unit.effects || []).map((effect) => effect.ability))
        ).toEqual(
          Array(1).fill(
            'Send opponents strongest Unit(s) on their Siege combat Row to their Lost pile if their Siege combat Row score is 10 or more.'
          )
        )
      })
    })
  })
})
