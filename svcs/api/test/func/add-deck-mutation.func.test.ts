import { GraphQLError, graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { addUser, addDeck, getUnits } from './util/graphql-util'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { expectizeDeck, verifyMongoIds } from './util/expect-util'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { getDeckFragment } from './util/fragment-util'
import { getLeaderId, getStrengthUnits, getUnitsInput } from './util/graphql-util'
import schema from '../../src/graphql/executable-schema'

describe('add-deck-mutation', () => {
  beforeAll(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('addDeck', () => {
    describe('invalid', () => {
      it('throws error if invalid leader ID', async () => {
        const faction = FactionKey.Monsters
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const leaderId = 'invalid'
        await expect(
          graphql({
            schema,
            source: `mutation {
              addDeck(
                name: "${name}",
                faction: ${faction},
                leader: "${leaderId}",
                units: [${await getUnitsInput(faction)}]
              ) {
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
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(`Leader ID "${leaderId}" is not a valid MongoDB ObjectId.`)],
        })
      })
      it('throws error if invalid unit ID', async () => {
        const faction = FactionKey.Monsters
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const leaderId = new ObjectId()
        const unitId = 'invalid'
        await expect(
          graphql({
            schema,
            source: `mutation {
              addDeck(
                name: "${name}",
                faction: ${faction},
                leader: "${leaderId}",
                units: [{id: "${unitId}"}]
              ) {
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
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(`Unit ID "${unitId}" is not a valid MongoDB ObjectId.`)],
        })
      })
      it('throws error if faction is neutral', async () => {
        const faction = FactionKey.Neutral
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        await expect(
          graphql({
            schema,
            source: `mutation {
              addDeck(
                name: "${name}",
                faction: ${faction},
                leader: "${new ObjectId().toString()}",
                units: [${await getUnitsInput(faction)}]
              ) {
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
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(`Cannot create Deck with "${FactionKey.Neutral}" faction.`)],
        })
      })
      it('throws error if leader does not exist', async () => {
        const faction = FactionKey.Monsters
        const leaderId = new ObjectId()
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        await expect(
          graphql({
            schema,
            source: `mutation {
              addDeck(
                name: "${name}",
                faction: ${faction},
                leader: "${leaderId}",
                units: [${await getUnitsInput(faction)}]
              ) {
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
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(`Leader with ID "${leaderId}" does not exist.`)],
        })
      })
      it('throws error if leader is of wrong faction', async () => {
        const faction = FactionKey.Monsters
        const leaderId = await getLeaderId({ name: 'Crach an Craite' })
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        await expect(
          graphql({
            schema,
            source: `mutation {
              addDeck(
                name: "${name}",
                faction: ${faction},
                leader: "${leaderId}",
                units: [${await getUnitsInput(faction)}]
              ) {
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
        ).resolves.toEqual({
          data: null,
          errors: [
            new GraphQLError(
              `Faction key "${FactionKey.Skellige}" for leader "${leaderId}" does not match deck faction key "${faction}".`
            ),
          ],
        })
      })
      it('throws error if unit id does not exist', async () => {
        const faction = FactionKey.Monsters
        const leader = 'Eredin Bringer of Death'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const dummyUnitId = new ObjectId()
        const unitsInput = await getUnitsInput(faction)
        await expect(
          graphql({
            schema,
            source: `mutation {
              addDeck(
                name: "${name}",
                faction: ${faction},
                leader: "${await getLeaderId({ name: leader })}",
                units: [
                  ${unitsInput},
                  {
                    artStyle: 1,
                    id: "${dummyUnitId}"
                  }
                ]
              ) {
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
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(`Unit with ID "${dummyUnitId}" does not exist.`)],
        })
      })
      it('throws error if units are of wrong faction', async () => {
        const faction = FactionKey.Monsters
        const wrongFaction = FactionKey.NorthernRealms
        const leader = 'Eredin Bringer of Death'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const deckUnits = await getStrengthUnits(wrongFaction)

        const unitsInput = deckUnits
          .map(
            (deckUnit) => `{
              id: "${deckUnit.unit.id}"
            }`
          )
          .join(',')
        await expect(
          graphql({
            schema,
            source: `mutation {
              addDeck(
                name: "${name}",
                faction: ${faction},
                leader: "${await getLeaderId({ name: leader })}",
                units: [${unitsInput}]
              ) {
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
        ).resolves.toEqual({
          data: null,
          errors: [
            new GraphQLError(
              deckUnits
                .map(
                  (deckUnit) =>
                    `Invalid faction "${wrongFaction}" for unit "${deckUnit.unit.id}", must be either "${faction}" or "${FactionKey.Neutral}".`
                )
                .join('\n')
            ),
          ],
        })
      })
      it('throws error if not enough units', async () => {
        const faction = FactionKey.Monsters
        const leader = 'Eredin Bringer of Death'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const deckUnits = await getStrengthUnits(faction)
        const length = 21
        const unitsInput = deckUnits
          .slice(0, length)
          .map(
            (deckUnit) => `{
              id: "${deckUnit.unit.id}"
            }`
          )
          .join(',')
        await expect(
          graphql({
            schema,
            source: `mutation {
              addDeck(
                name: "${name}",
                faction: ${faction},
                leader: "${await getLeaderId({ name: leader })}",
                units: [${unitsInput}]
              ) {
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
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(`Invalid number of units at "${length}", minimum is "22".`)],
        })
      })
      it('throws error if too many specials', async () => {
        const faction = FactionKey.Monsters
        const leader = 'Eredin Bringer of Death'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const units = await getUnits({
          factions: [faction, FactionKey.Neutral],
        })
        const specials = units.filter((unit) => unit.special).length
        const unitsInput = units
          .map(
            (unit) => `{
              id: "${unit.id}"
            }`
          )
          .join(',')
        await expect(
          graphql({
            schema,
            source: `mutation {
              addDeck(
                name: "${name}",
                faction: ${faction},
                leader: "${await getLeaderId({ name: leader })}",
                units: [${unitsInput}]
              ) {
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
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(`Invalid number of special units at "${specials}", maximum is "10".`)],
        })
      })
      it('throws error if art style is negative', async () => {
        const faction = FactionKey.Monsters
        const leader = 'Eredin Bringer of Death'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const units = await getStrengthUnits(faction)
        units[0].artStyle = -1
        const unitsInput = units
          .map(
            (unit) => `{
              ${unit.artStyle !== undefined ? `artStyle: ${unit.artStyle}` : ''}
              id: "${unit.unit.id}"
            }`
          )
          .join(',')
        await expect(
          graphql({
            schema,
            source: `mutation {
              addDeck(
                name: "${name}",
                faction: ${faction},
                leader: "${await getLeaderId({ name: leader })}",
                units: [${unitsInput}]
              ) {
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
        ).resolves.toEqual({
          data: null,
          errors: [
            new GraphQLError(
              `Invalid artStyle "${units[0].artStyle}" for unit "${units[0].unit.id}", must be positive integer greater than zero.`
            ),
          ],
        })
      })
      it('throws error if art style is zero', async () => {
        const faction = FactionKey.Monsters
        const leader = 'Eredin Bringer of Death'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const units = await getStrengthUnits(faction)
        units[0].artStyle = 0
        const unitsInput = units
          .map(
            (unit) => `{
              ${unit.artStyle !== undefined ? `artStyle: ${unit.artStyle}` : ''}
              id: "${unit.unit.id}"
            }`
          )
          .join(',')
        await expect(
          graphql({
            schema,
            source: `mutation {
              addDeck(
                name: "${name}",
                faction: ${faction},
                leader: "${await getLeaderId({ name: leader })}",
                units: [${unitsInput}]
              ) {
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
        ).resolves.toEqual({
          data: null,
          errors: [
            new GraphQLError(
              `Invalid artStyle "${units[0].artStyle}" for unit "${units[0].unit.id}", must be positive integer greater than zero.`
            ),
          ],
        })
      })
      it('throws error if art style is greater than images', async () => {
        const faction = FactionKey.Monsters
        const leader = 'Eredin Bringer of Death'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const units = await getStrengthUnits(faction)
        units[0].artStyle = units[0].unit.images.length + 1
        const unitsInput = units
          .map(
            (unit) => `{
              ${unit.artStyle !== undefined ? `artStyle: ${unit.artStyle}` : ''}
              id: "${unit.unit.id}"
            }`
          )
          .join(',')
        await expect(
          graphql({
            schema,
            source: `mutation {
              addDeck(
                name: "${name}",
                faction: ${faction},
                leader: "${await getLeaderId({ name: leader })}",
                units: [${unitsInput}]
              ) {
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
        ).resolves.toEqual({
          data: null,
          errors: [
            new GraphQLError(
              `Invalid artStyle "${units[0].artStyle}" for unit "${units[0].unit.id}", only "${units[0].unit.images.length}" art styles available for unit.`
            ),
          ],
        })
      })
      it('throws error if deck with name already exists', async () => {
        const faction = FactionKey.Monsters
        const leader = 'Eredin Bringer of Death'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        await addDeck({
          faction: faction,
          name,
          leader,
          userId: user.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              addDeck(
                name: "${name}",
                faction: ${faction},
                leader: "${await getLeaderId({ name: leader })}",
                units: [${await getUnitsInput(faction)}]
              ) {
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
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(`Deck with name "${name}" already exists.`)],
        })
      })
    })
    describe('valid', () => {
      it('can add deck for monsters faction', async () => {
        const faction = FactionKey.Monsters
        const leader = 'Eredin Bringer of Death'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const response = await graphql({
          schema,
          source: `mutation {
            addDeck(
              name: "${name}",
              faction: ${faction},
              leader: "${await getLeaderId({ name: leader })}",
              units: [${await getUnitsInput(faction)}]
            ) {
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
            addDeck: expectizeDeck({
              factionKey: faction,
              leaderName: leader,
              name,
              unitNames: (await getStrengthUnits(faction)).map((unit) => unit.unit.name),
              user,
            }),
          },
        })
        verifyMongoIds(response.data?.addDeck)
      })
      it('can add deck for nilfgaardian empire faction', async () => {
        const faction = FactionKey.NilfgaardianEmpire
        const leader = 'Emhyr var Emreis Invader of the North'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const response = await graphql({
          schema,
          source: `mutation {
            addDeck(
              name: "${name}",
              faction: ${faction},
              leader: "${await getLeaderId({ name: leader })}",
              units: [${await getUnitsInput(faction)}]
            ) {
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
            addDeck: expectizeDeck({
              factionKey: faction,
              leaderName: leader,
              name,
              unitNames: (await getStrengthUnits(faction)).map((unit) => unit.unit.name),
              user,
            }),
          },
        })
        verifyMongoIds(response.data?.addDeck)
      })
      it('can add deck for northern realms faction', async () => {
        const faction = FactionKey.NorthernRealms
        const leader = 'Foltest Son of Medell'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const response = await graphql({
          schema,
          source: `mutation {
            addDeck(
              name: "${name}",
              faction: ${faction},
              leader: "${await getLeaderId({ name: leader })}",
              units: [${await getUnitsInput(faction)}]
            ) {
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
            addDeck: expectizeDeck({
              factionKey: faction,
              leaderName: leader,
              name,
              unitNames: (await getStrengthUnits(faction)).map((unit) => unit.unit.name),
              user,
            }),
          },
        })
        verifyMongoIds(response.data?.addDeck)
      })
      it('can add deck for scoiatael faction', async () => {
        const faction = FactionKey.ScoiaTael
        const leader = 'Francesca Findabair Queen of Dol Blathanna'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const response = await graphql({
          schema,
          source: `mutation {
            addDeck(
              name: "${name}",
              faction: ${faction},
              leader: "${await getLeaderId({ name: leader })}",
              units: [${await getUnitsInput(faction)}]
            ) {
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
            addDeck: expectizeDeck({
              factionKey: faction,
              leaderName: leader,
              name,
              unitNames: (await getStrengthUnits(faction)).map((unit) => unit.unit.name),
              user,
            }),
          },
        })
        verifyMongoIds(response.data?.addDeck)
      })
      it('can add deck for skellige faction', async () => {
        const faction = FactionKey.Skellige
        const leader = 'King Bran'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const response = await graphql({
          schema,
          source: `mutation {
            addDeck(
              name: "${name}",
              faction: ${faction},
              leader: "${await getLeaderId({ name: leader })}",
              units: [${await getUnitsInput(faction)}]
            ) {
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
            addDeck: expectizeDeck({
              factionKey: faction,
              leaderName: leader,
              name,
              unitNames: (await getStrengthUnits(faction)).map((unit) => unit.unit.name),
              user,
            }),
          },
        })
        verifyMongoIds(response.data?.addDeck)
      })
      it('can add deck with explicit default artStyles', async () => {
        const faction = FactionKey.Skellige
        const leader = 'King Bran'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const deckUnits = await getStrengthUnits(faction)

        const unitsInput = deckUnits
          .map(
            (deckUnit) => `{
              artStyle: 1,
              id: "${deckUnit.unit.id}"
            }`
          )
          .join(',')
        const response = await graphql({
          schema,
          source: `mutation {
            addDeck(
              name: "${name}",
              faction: ${faction},
              leader: "${await getLeaderId({ name: leader })}",
              units: [${unitsInput}]
            ) {
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
            addDeck: expectizeDeck({
              factionKey: faction,
              leaderName: leader,
              name,
              unitNames: (await getStrengthUnits(faction)).map((unit) => unit.unit.name),
              user,
            }),
          },
        })
        verifyMongoIds(response.data?.addDeck)
      })
      it('can add deck with explicit custom artStyles', async () => {
        const faction = FactionKey.Skellige
        const leader = 'King Bran'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const deckUnits = await getStrengthUnits(faction)

        const unitsInput = deckUnits
          .map(
            (deckUnit) => `{
              artStyle: ${deckUnit.unit.images.length},
              id: "${deckUnit.unit.id}"
            }`
          )
          .join(',')
        const response = await graphql({
          schema,
          source: `mutation {
            addDeck(
              name: "${name}",
              faction: ${faction},
              leader: "${await getLeaderId({ name: leader })}",
              units: [${unitsInput}]
            ) {
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
            addDeck: expectizeDeck({
              factionKey: faction,
              leaderName: leader,
              name,
              unitNames: (await getStrengthUnits(faction)).map((unit) => unit.unit.name),
              user,
              maxArtStyle: true,
            }),
          },
        })
        verifyMongoIds(response.data?.addDeck)
      })
      it('can add deck with same name as the deck of another user', async () => {
        const faction = FactionKey.NorthernRealms
        const leader = 'Foltest Son of Medell'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)

        const otherUser = await addUser(`${name}-2`)
        await addDeck({
          faction,
          name,
          leader,
          userId: otherUser.id,
        })

        const response = await graphql({
          schema,
          source: `mutation {
            addDeck(
              name: "${name}",
              faction: ${faction},
              leader: "${await getLeaderId({ name: leader })}",
              units: [${await getUnitsInput(faction)}]
            ) {
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
            addDeck: expectizeDeck({
              factionKey: faction,
              leaderName: leader,
              name,
              unitNames: (await getStrengthUnits(faction)).map((unit) => unit.unit.name),
              user,
            }),
          },
        })
        verifyMongoIds(response.data?.addDeck)
      })
      it('adding deck with neutral argument false does not add neutral stats', async () => {
        const faction = FactionKey.Monsters
        const leader = 'Eredin Bringer of Death'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const response = await graphql({
          schema,
          source: `mutation {
            addDeck(
              name: "${name}",
              faction: ${faction},
              leader: "${await getLeaderId({ name: leader })}",
              units: [${await getUnitsInput(faction)}]
            ) {
              ${getDeckFragment({
                statsModifier: '(neutrals: false)',
              })}
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
            addDeck: expectizeDeck({
              factionKey: faction,
              leaderName: leader,
              name,
              unitNames: (await getStrengthUnits(faction)).map((unit) => unit.unit.name),
              user,
            }),
          },
        })
        verifyMongoIds(response.data?.addDeck)
      })
      it('adding deck with neutral argument true adds neutral stats', async () => {
        const faction = FactionKey.Monsters
        const leader = 'Eredin Bringer of Death'
        const name = `decks-${Date.now()}`
        const user = await addUser(name)
        const response = await graphql({
          schema,
          source: `mutation {
            addDeck(
              name: "${name}",
              faction: ${faction},
              leader: "${await getLeaderId({ name: leader })}",
              units: [${await getUnitsInput(faction)}]
            ) {
              ${getDeckFragment({
                statsModifier: '(neutrals: true)',
              })}
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
            addDeck: expectizeDeck({
              factionKey: faction,
              leaderName: leader,
              name,
              unitNames: (await getStrengthUnits(faction)).map((unit) => unit.unit.name),
              user,
              neutrals: true,
            }),
          },
        })
        verifyMongoIds(response.data?.addDeck)
      })
    })
  })
})
