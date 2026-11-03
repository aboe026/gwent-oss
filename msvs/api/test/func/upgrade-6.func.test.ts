import allUpgrades from '../../src/database/upgrades/all-upgrades'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import {
  EffectDbObject,
  EffectKey,
  FactionDbObject,
  FactionKey,
  LeaderDbObject,
} from '@gwent-oss/graphql-schema/database-typings'
import FactionStore from '../../src/database/stores/faction-store'
import EffectStore from '../../src/database/stores/effect-store'
import LeaderStore from '../../src/database/stores/leader-store'
import { ObjectId } from 'mongodb'

describe('upgrade-6', () => {
  const upgradeNumber = 6
  beforeEach(async () => {
    await DbUtil.deleteDatabase()
  })
  it('updates ability text if had previous resources text', async () => {
    const upgrader = new DbUpgrader({})
    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber - 1),
    })

    // change factions pre upgrade
    await FactionStore.edit({
      id: (
        await FactionStore.getByKey({
          key: FactionKey.Monsters,
        })
      )._id,
      ability: 'Keeps random Unit Card out after each round.',
    })
    await FactionStore.edit({
      id: (
        await FactionStore.getByKey({
          key: FactionKey.NilfgaardianEmpire,
        })
      )._id,
      ability: 'Wins any round that ends in a draw.',
    })
    await FactionStore.edit({
      id: (
        await FactionStore.getByKey({
          key: FactionKey.NorthernRealms,
        })
      )._id,
      ability: 'Grants an extra card upon winning a round.',
    })
    await FactionStore.edit({
      id: (
        await FactionStore.getByKey({
          key: FactionKey.ScoiaTael,
        })
      )._id,
      ability: 'Decides who takes first turn.',
    })
    await FactionStore.edit({
      id: (
        await FactionStore.getByKey({
          key: FactionKey.Skellige,
        })
      )._id,
      ability: '2 random cards from the graveyard are placed on the battlefield at the start of the third round.',
    })

    // change effects pre upgrade
    await EffectStore.edit({
      id: (
        await EffectStore.getByKey({
          key: EffectKey.Agile,
        })
      )._id,
      ability: 'Can be placed in either the Close or Ranged rows. Cannot be moved once placed.',
    })
    await EffectStore.edit({
      id: (
        await EffectStore.getByKey({
          key: EffectKey.Avenger,
        })
      )._id,
      ability: 'When removed from the battlefield, a powerful new Unit Card is summoned to take its place.',
    })
    await EffectStore.edit({
      id: (
        await EffectStore.getByKey({
          key: EffectKey.Berserker,
        })
      )._id,
      ability: 'Transforms into a bear when a Mardroeme card is on its row.',
    })
    await EffectStore.edit({
      id: (
        await EffectStore.getByKey({
          key: EffectKey.Bond,
        })
      )._id,
      ability: 'Place next to a card with the same name to double the strength of both cards.',
    })
    await EffectStore.edit({
      id: (
        await EffectStore.getByKey({
          key: EffectKey.Decoy,
        })
      )._id,
      ability: 'Swap with a card on the battlefield to return it to your hand.',
    })
    await EffectStore.edit({
      id: (
        await EffectStore.getByKey({
          key: EffectKey.Horn,
        })
      )._id,
      ability: 'Doubles the strength of all unit cards in that row. Limited to 1 per row.',
    })
    await EffectStore.edit({
      id: (
        await EffectStore.getByKey({
          key: EffectKey.Mardroeme,
        })
      )._id,
      ability: 'Triggers transformation of all Berserker cards on the same row.',
    })
    await EffectStore.edit({
      id: (
        await EffectStore.getByKey({
          key: EffectKey.Medic,
        })
      )._id,
      ability: 'Choose one card from your discard pile and play it instantly (no Heroes or Special Cards).',
    })
    await EffectStore.edit({
      id: (
        await EffectStore.getByKey({
          key: EffectKey.Morale,
        })
      )._id,
      ability: 'Adds +1 to all units in the row (excluding itself).',
    })
    await EffectStore.edit({
      id: (
        await EffectStore.getByKey({
          key: EffectKey.Muster,
        })
      )._id,
      ability: 'Find any cards with the same name in your deck and play them instantly.',
    })
    await EffectStore.edit({
      id: (
        await EffectStore.getByKey({
          key: EffectKey.Scorch,
        })
      )._id,
      ability: 'Kills the strongest card(s) on the battlefield.',
    })
    await EffectStore.edit({
      id: (
        await EffectStore.getByKey({
          key: EffectKey.Spy,
        })
      )._id,
      ability:
        "Place on your opponent's battlefield (counts towards opponent's total) and hand up to 2 random cards from your undrawn pile.",
    })
    await EffectStore.edit({
      id: (
        await EffectStore.getByKey({
          key: EffectKey.Weather,
        })
      )._id,
      ability: 'Reduce the strength of all cards in the given row(s) on the battlefield to 1, including your own.',
    })

    // change leaders pre upgrade
    const leaders = await LeaderStore.get({})
    const crachAnCraiteId = getLeaderId(leaders, 'Crach an Craite')
    const eveEmperorOfNilfgaardId = getLeaderId(leaders, 'Emhyr var Emreis Emperor of Nilfgaard')
    const eveHisImperialMajestyId = getLeaderId(leaders, 'Emhyr var Emreis His Imperial Majesty')
    const eveInvaderOfTheNorthId = getLeaderId(leaders, 'Emhyr var Emreis Invader of the North')
    const eveTheRelentlessId = getLeaderId(leaders, 'Emhyr var Emreis the Relentless')
    const eveTheWhiteFlame = getLeaderId(leaders, 'Emhyr var Emreis the White Flame')
    await LeaderStore.edit({
      id: crachAnCraiteId,
      ability: "Shuffle all cards from each player's graveyard back into their decks.",
    })
    await LeaderStore.edit({
      id: eveEmperorOfNilfgaardId,
      ability: "Look at 3 random cards from your opponent's hand.",
    })
    await LeaderStore.edit({
      id: eveHisImperialMajestyId,
      ability: 'Pick a Torrential Rain card from your deck and play it instantly.',
    })
    await LeaderStore.edit({
      id: eveInvaderOfTheNorthId,
      ability: 'Abilities that restore a unit to the battlefield restore a randomly-chosen unit. Affects both players.',
    })
    await LeaderStore.edit({
      id: eveTheRelentlessId,
      ability: "Draw a card from your opponent's discard pile.",
    })
    await LeaderStore.edit({
      id: eveTheWhiteFlame,
      ability: "Cancel your opponent's Leader Ability.",
    })

    // verify factions pre upgrade
    await expect(
      FactionStore.getByKey({
        key: FactionKey.Monsters,
      })
    ).resolves.toHaveProperty('ability', 'Keeps random Unit Card out after each round.')
    await expect(
      FactionStore.getByKey({
        key: FactionKey.NilfgaardianEmpire,
      })
    ).resolves.toHaveProperty('ability', 'Wins any round that ends in a draw.')
    await expect(
      FactionStore.getByKey({
        key: FactionKey.NorthernRealms,
      })
    ).resolves.toHaveProperty('ability', 'Grants an extra card upon winning a round.')
    await expect(
      FactionStore.getByKey({
        key: FactionKey.ScoiaTael,
      })
    ).resolves.toHaveProperty('ability', 'Decides who takes first turn.')
    await expect(
      FactionStore.getByKey({
        key: FactionKey.Skellige,
      })
    ).resolves.toHaveProperty(
      'ability',
      '2 random cards from the graveyard are placed on the battlefield at the start of the third round.'
    )

    // verify effects pre upgrade
    await expect(
      EffectStore.getByKey({
        key: EffectKey.Agile,
      })
    ).resolves.toHaveProperty(
      'ability',
      'Can be placed in either the Close or Ranged rows. Cannot be moved once placed.'
    )
    await expect(
      EffectStore.getByKey({
        key: EffectKey.Avenger,
      })
    ).resolves.toHaveProperty(
      'ability',
      'When removed from the battlefield, a powerful new Unit Card is summoned to take its place.'
    )
    await expect(
      EffectStore.getByKey({
        key: EffectKey.Berserker,
      })
    ).resolves.toHaveProperty('ability', 'Transforms into a bear when a Mardroeme card is on its row.')
    await expect(
      EffectStore.getByKey({
        key: EffectKey.Bond,
      })
    ).resolves.toHaveProperty(
      'ability',
      'Place next to a card with the same name to double the strength of both cards.'
    )
    await expect(
      EffectStore.getByKey({
        key: EffectKey.Decoy,
      })
    ).resolves.toHaveProperty('ability', 'Swap with a card on the battlefield to return it to your hand.')
    await expect(
      EffectStore.getByKey({
        key: EffectKey.Horn,
      })
    ).resolves.toHaveProperty('ability', 'Doubles the strength of all unit cards in that row. Limited to 1 per row.')
    await expect(
      EffectStore.getByKey({
        key: EffectKey.Mardroeme,
      })
    ).resolves.toHaveProperty('ability', 'Triggers transformation of all Berserker cards on the same row.')
    await expect(
      EffectStore.getByKey({
        key: EffectKey.Medic,
      })
    ).resolves.toHaveProperty(
      'ability',
      'Choose one card from your discard pile and play it instantly (no Heroes or Special Cards).'
    )
    await expect(
      EffectStore.getByKey({
        key: EffectKey.Morale,
      })
    ).resolves.toHaveProperty('ability', 'Adds +1 to all units in the row (excluding itself).')
    await expect(
      EffectStore.getByKey({
        key: EffectKey.Muster,
      })
    ).resolves.toHaveProperty('ability', 'Find any cards with the same name in your deck and play them instantly.')
    await expect(
      EffectStore.getByKey({
        key: EffectKey.Scorch,
      })
    ).resolves.toHaveProperty('ability', 'Kills the strongest card(s) on the battlefield.')
    await expect(
      EffectStore.getByKey({
        key: EffectKey.Spy,
      })
    ).resolves.toHaveProperty(
      'ability',
      "Place on your opponent's battlefield (counts towards opponent's total) and hand up to 2 random cards from your undrawn pile."
    )
    await expect(
      EffectStore.getByKey({
        key: EffectKey.Weather,
      })
    ).resolves.toHaveProperty(
      'ability',
      'Reduce the strength of all cards in the given row(s) on the battlefield to 1, including your own.'
    )

    // verify leaders pre upgrade
    await expect(
      LeaderStore.getById({
        id: crachAnCraiteId,
      })
    ).resolves.toHaveProperty('ability', "Shuffle all cards from each player's graveyard back into their decks.")
    await expect(
      LeaderStore.getById({
        id: eveEmperorOfNilfgaardId,
      })
    ).resolves.toHaveProperty('ability', "Look at 3 random cards from your opponent's hand.")
    await expect(
      LeaderStore.getById({
        id: eveHisImperialMajestyId,
      })
    ).resolves.toHaveProperty('ability', 'Pick a Torrential Rain card from your deck and play it instantly.')
    await expect(
      LeaderStore.getById({
        id: eveInvaderOfTheNorthId,
      })
    ).resolves.toHaveProperty(
      'ability',
      'Abilities that restore a unit to the battlefield restore a randomly-chosen unit. Affects both players.'
    )
    await expect(
      LeaderStore.getById({
        id: eveTheRelentlessId,
      })
    ).resolves.toHaveProperty('ability', "Draw a card from your opponent's discard pile.")
    await expect(
      LeaderStore.getById({
        id: eveTheWhiteFlame,
      })
    ).resolves.toHaveProperty('ability', "Cancel your opponent's Leader Ability.")

    // run upgrade
    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber),
    })

    await verifyUpdatedResources()
  })
  it('does not update ability text if never had previous resources text', async () => {
    const upgrader = new DbUpgrader({})
    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber - 1),
    })

    await verifyUpdatedResources()

    // run upgrade
    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber),
    })

    await verifyUpdatedResources()
  })
})

async function verifyUpdatedResources() {
  // factions
  await expect(
    FactionStore.getByKey({
      key: FactionKey.Monsters,
    })
  ).resolves.toHaveProperty('ability', 'A random Unit (excluding opponents) remains on the battlefield between rounds.')
  await expect(
    FactionStore.getByKey({
      key: FactionKey.NilfgaardianEmpire,
    })
  ).resolves.toHaveProperty('ability', 'Win any round that ends in a draw (if only player with this faction).')
  await expect(
    FactionStore.getByKey({
      key: FactionKey.NorthernRealms,
    })
  ).resolves.toHaveProperty('ability', 'Hand a Unit from your Undrawn pile when you win a round.')
  await expect(
    FactionStore.getByKey({
      key: FactionKey.ScoiaTael,
    })
  ).resolves.toHaveProperty(
    'ability',
    'Decide order turns are taken to start the game (if only player with this faction).'
  )
  await expect(
    FactionStore.getByKey({
      key: FactionKey.Skellige,
    })
  ).resolves.toHaveProperty(
    'ability',
    'Up to 2 random Units are revived from your Lost pile at the start of the third round.'
  )

  // effects
  await expect(
    EffectStore.getByKey({
      key: EffectKey.Agile,
    })
  ).resolves.toHaveProperty('ability', 'Place in either the Close or Ranged combat Rows.')
  await expect(
    EffectStore.getByKey({
      key: EffectKey.Avenger,
    })
  ).resolves.toHaveProperty(
    'ability',
    'When sent to the Lost pile, a powerful new Unit is summoned to the battlefield.'
  )
  await expect(
    EffectStore.getByKey({
      key: EffectKey.Berserker,
    })
  ).resolves.toHaveProperty('ability', 'Transform into a bear when a Mardroeme is on its row.')
  await expect(
    EffectStore.getByKey({
      key: EffectKey.Bond,
    })
  ).resolves.toHaveProperty('ability', 'Double the strength (compounding) of Unit(s) with the same name.')
  await expect(
    EffectStore.getByKey({
      key: EffectKey.Decoy,
    })
  ).resolves.toHaveProperty('ability', 'Swap with a Unit on the battlefield, returning it to your Hand.')
  await expect(
    EffectStore.getByKey({
      key: EffectKey.Horn,
    })
  ).resolves.toHaveProperty('ability', 'Double the strength of all Units in that row (limited to 1 per row).')
  await expect(
    EffectStore.getByKey({
      key: EffectKey.Mardroeme,
    })
  ).resolves.toHaveProperty('ability', 'Trigger transformation of all (including future) Berserkers on the same row.')
  await expect(
    EffectStore.getByKey({
      key: EffectKey.Medic,
    })
  ).resolves.toHaveProperty('ability', 'Revive one Unit from your Lost pile to the battlefield.')
  await expect(
    EffectStore.getByKey({
      key: EffectKey.Morale,
    })
  ).resolves.toHaveProperty('ability', 'Add +1 to all Units in the row (excluding itself).')
  await expect(
    EffectStore.getByKey({
      key: EffectKey.Muster,
    })
  ).resolves.toHaveProperty(
    'ability',
    'Summon any Units with the same name from your Hand or Undrawn pile to the battlefield.'
  )
  await expect(
    EffectStore.getByKey({
      key: EffectKey.Scorch,
    })
  ).resolves.toHaveProperty(
    'ability',
    'Send the highest strength Unit(s) on the battlefield to their respective players Lost pile.'
  )
  await expect(
    EffectStore.getByKey({
      key: EffectKey.Spy,
    })
  ).resolves.toHaveProperty(
    'ability',
    "Place on an opponent's battlefield (counts towards their total) and Hand up to 2 random Units from your Undrawn pile."
  )
  await expect(
    EffectStore.getByKey({
      key: EffectKey.Weather,
    })
  ).resolves.toHaveProperty(
    'ability',
    'Reduce the strength of all Units in the given Row(s) on the battlefield to 1, including your own.'
  )

  const leaders = await LeaderStore.get({})
  expect(leaders.find((leader) => leader.name === 'Crach an Craite')).toHaveProperty(
    'ability',
    "Shuffle all Units from each player's Lost pile back into their Undrawn pile."
  )
  expect(leaders.find((leader) => leader.name === 'Emhyr var Emreis Emperor of Nilfgaard')).toHaveProperty(
    'ability',
    "Look at 3 random Units (including Heroes) from your opponent's Hand."
  )
  expect(leaders.find((leader) => leader.name === 'Emhyr var Emreis His Imperial Majesty')).toHaveProperty(
    'ability',
    'Move a Torrential Rain from your Undrawn pile to the battlefield.'
  )
  expect(leaders.find((leader) => leader.name === 'Emhyr var Emreis Invader of the North')).toHaveProperty(
    'ability',
    'All restorations become random (affects all players).'
  )
  expect(leaders.find((leader) => leader.name === 'Emhyr var Emreis the Relentless')).toHaveProperty(
    'ability',
    "Move a random Unit from your opponent's Lost pile to your Hand."
  )
  expect(leaders.find((leader) => leader.name === 'Emhyr var Emreis the White Flame')).toHaveProperty(
    'ability',
    'Cancel the Leader ability of your opponent(s).'
  )
}

function getLeaderId(leaders: (EffectDbObject | FactionDbObject | LeaderDbObject)[], name: string): ObjectId {
  const leader = leaders.filter((leader) => leader.name === name)
  if (leader.length === 0) {
    throw Error(`Found no leaders with name "${name}" when getting ID`)
  } else if (leader.length > 1) {
    throw Error(`Found more than 1 leader with name "${name}" when getting ID`)
  } else {
    return leader[0]._id
  }
}
