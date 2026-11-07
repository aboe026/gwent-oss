import { ObjectId } from 'mongodb'

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
import EffectStore from '../../src/database/stores/effect-store'
import FactionStore from '../../src/database/stores/faction-store'
import LeaderStore from '../../src/database/stores/leader-store'

describe('upgrade-7', () => {
  const upgradeNumber = 7
  beforeEach(async () => {
    await DbUtil.deleteDatabase()
  })
  it('updates ability text if had previous resources text', async () => {
    const upgrader = new DbUpgrader({})
    await upgrader.run({
      upgrades: allUpgrades.slice(0, upgradeNumber - 1),
    })

    // change factions pre upgrade
    const originalFactions = await FactionStore.get({})
    await FactionStore.edit({
      id: getResourceId(originalFactions, FactionKey.Monsters),
      ability: 'Keeps random Unit Card out after each round.',
    })
    await FactionStore.edit({
      id: getResourceId(originalFactions, FactionKey.NilfgaardianEmpire),
      ability: 'Wins any round that ends in a draw.',
    })
    await FactionStore.edit({
      id: getResourceId(originalFactions, FactionKey.NorthernRealms),
      ability: 'Grants an extra card upon winning a round.',
    })
    await FactionStore.edit({
      id: getResourceId(originalFactions, FactionKey.ScoiaTael),
      ability: 'Decides who takes first turn.',
    })
    await FactionStore.edit({
      id: getResourceId(originalFactions, FactionKey.Skellige),
      ability: '2 random cards from the graveyard are placed on the battlefield at the start of the third round.',
    })

    // change effects pre upgrade
    const originalEffects = await EffectStore.get({})
    await EffectStore.edit({
      id: getResourceId(originalEffects, EffectKey.Agile),
      ability: 'Can be placed in either the Close or Ranged rows. Cannot be moved once placed.',
    })
    await EffectStore.edit({
      id: getResourceId(originalEffects, EffectKey.Avenger),
      ability: 'When removed from the battlefield, a powerful new Unit Card is summoned to take its place.',
    })
    await EffectStore.edit({
      id: getResourceId(originalEffects, EffectKey.Berserker),
      ability: 'Transforms into a bear when a Mardroeme card is on its row.',
    })
    await EffectStore.edit({
      id: getResourceId(originalEffects, EffectKey.Bond),
      ability: 'Place next to a card with the same name to double the strength of both cards.',
    })
    await EffectStore.edit({
      id: getResourceId(originalEffects, EffectKey.Decoy),
      ability: 'Swap with a card on the battlefield to return it to your hand.',
    })
    await EffectStore.edit({
      id: getResourceId(originalEffects, EffectKey.Horn),
      ability: 'Doubles the strength of all unit cards in that row. Limited to 1 per row.',
    })
    await EffectStore.edit({
      id: getResourceId(originalEffects, EffectKey.Mardroeme),
      ability: 'Triggers transformation of all Berserker cards on the same row.',
    })
    await EffectStore.edit({
      id: getResourceId(originalEffects, EffectKey.Medic),
      ability: 'Choose one card from your discard pile and play it instantly (no Heroes or Special Cards).',
    })
    await EffectStore.edit({
      id: getResourceId(originalEffects, EffectKey.Morale),
      ability: 'Adds +1 to all units in the row (excluding itself).',
    })
    await EffectStore.edit({
      id: getResourceId(originalEffects, EffectKey.Muster),
      ability: 'Find any cards with the same name in your deck and play them instantly.',
    })
    await EffectStore.edit({
      id: getResourceId(originalEffects, EffectKey.Scorch),
      ability: 'Kills the strongest card(s) on the battlefield.',
    })
    await EffectStore.edit({
      id: getResourceId(originalEffects, EffectKey.Spy),
      ability:
        "Place on your opponent's battlefield (counts towards opponent's total) and hand up to 2 random cards from your undrawn pile.",
    })
    await EffectStore.edit({
      id: getResourceId(originalEffects, EffectKey.Weather),
      ability: 'Reduce the strength of all cards in the given row(s) on the battlefield to 1, including your own.',
    })

    // change leaders pre upgrade
    const originalLeaders = await LeaderStore.get({})
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Crach an Craite'),
      ability: "Shuffle all cards from each player's graveyard back into their decks.",
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Emhyr var Emreis Emperor of Nilfgaard'),
      ability: "Look at 3 random cards from your opponent's hand.",
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Emhyr var Emreis His Imperial Majesty'),
      ability: 'Pick a Torrential Rain card from your deck and play it instantly.',
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Emhyr var Emreis Invader of the North'),
      ability: 'Abilities that restore a unit to the battlefield restore a randomly-chosen unit. Affects both players.',
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Emhyr var Emreis the Relentless'),
      ability: "Draw a card from your opponent's discard pile.",
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Emhyr var Emreis the White Flame'),
      ability: "Cancel your opponent's Leader Ability.",
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Eredin Breacc Glas the Treacherous'),
      ability: 'Doubles the strength of all spy cards (affects both players).',
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Eredin Bringer of Death'),
      ability: 'Restore a card from your discard pile to your hand.',
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Eredin Commander of the Red Riders'),
      ability:
        "Double the strength of all your Close Combat units (unless a Commander's horn is also present on that row).",
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Eredin Destroyer of Worlds'),
      ability: 'Discard 2 card and draw 1 card of your choice from your deck.',
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Eredin King of the Wild Hunt'),
      ability: 'Pick any weather card from your deck and play it instantly.',
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Foltest King of Temeria'),
      ability: 'Pick an Impenetrable Fog card from your deck and play it instantly.',
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Foltest Lord Commander of the North'),
      ability:
        'Clear any weather effects (resulting from Biting Frost, Torrential Rain or Impenetrable Fog cards) in play.',
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Foltest Son of Medell'),
      ability:
        "Destroy your enemy's strongest Ranged Combat unit(s) if the combined strength of all his or her Ranged Combat units is 10 or more.",
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Foltest the Siegemaster'),
      ability: "Doubles the strength of all your Siege units (unless a Commander's Horn is also present on that row).",
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Foltest the Steel-Forged'),
      ability:
        "Destroy your enemy's strongest Siege unit(s) if the combined strength of all his or her Siege units is 10 or more.",
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Francesca Findabair Daisy of the Valley'),
      ability: 'Draw an extra card at the beginning of the battle',
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Francesca Findabair Hope of the Aen Seidhe'),
      ability:
        "Move agile units to whichever valid row maximizes their strength (don't move units already in optimal row).",
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Francesca Findabair Pureblood Elf'),
      ability: 'Pick a Biting Frost card from your deck and play it instantly.',
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Francesca Findabair Queen of Dol Blathanna'),
      ability:
        "Destroy your enemy's strongest Close Combat unit(s) if the combined strength of all his or her Close Combat units is 10 or more.",
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'Francesca Findabair the Beautiful'),
      ability:
        "Doubles the strength of all your Ranged Combat units (unless a Commander's Horn is also present on that row).",
    })
    await LeaderStore.edit({
      id: getResourceId(originalLeaders, 'King Bran'),
      ability: 'Units only lose half their Strength in bad weather conditions.',
    })

    // verify factions pre upgrade
    const factions = await FactionStore.get({})
    expect(factions.find((faction) => faction.key === FactionKey.Monsters)).toHaveProperty(
      'ability',
      'Keeps random Unit Card out after each round.'
    )
    expect(factions.find((faction) => faction.key === FactionKey.NilfgaardianEmpire)).toHaveProperty(
      'ability',
      'Wins any round that ends in a draw.'
    )
    expect(factions.find((faction) => faction.key === FactionKey.NorthernRealms)).toHaveProperty(
      'ability',
      'Grants an extra card upon winning a round.'
    )
    expect(factions.find((faction) => faction.key === FactionKey.ScoiaTael)).toHaveProperty(
      'ability',
      'Decides who takes first turn.'
    )
    expect(factions.find((faction) => faction.key === FactionKey.Skellige)).toHaveProperty(
      'ability',
      '2 random cards from the graveyard are placed on the battlefield at the start of the third round.'
    )

    // verify effects pre upgrade
    const effects = await EffectStore.get({})
    expect(effects.find((effect) => effect.key === EffectKey.Agile)).toHaveProperty(
      'ability',
      'Can be placed in either the Close or Ranged rows. Cannot be moved once placed.'
    )
    expect(effects.find((effect) => effect.key === EffectKey.Avenger)).toHaveProperty(
      'ability',
      'When removed from the battlefield, a powerful new Unit Card is summoned to take its place.'
    )
    expect(effects.find((effect) => effect.key === EffectKey.Berserker)).toHaveProperty(
      'ability',
      'Transforms into a bear when a Mardroeme card is on its row.'
    )
    expect(effects.find((effect) => effect.key === EffectKey.Bond)).toHaveProperty(
      'ability',
      'Place next to a card with the same name to double the strength of both cards.'
    )
    expect(effects.find((effect) => effect.key === EffectKey.Decoy)).toHaveProperty(
      'ability',
      'Swap with a card on the battlefield to return it to your hand.'
    )
    expect(effects.find((effect) => effect.key === EffectKey.Horn)).toHaveProperty(
      'ability',
      'Doubles the strength of all unit cards in that row. Limited to 1 per row.'
    )
    expect(effects.find((effect) => effect.key === EffectKey.Mardroeme)).toHaveProperty(
      'ability',
      'Triggers transformation of all Berserker cards on the same row.'
    )
    expect(effects.find((effect) => effect.key === EffectKey.Medic)).toHaveProperty(
      'ability',
      'Choose one card from your discard pile and play it instantly (no Heroes or Special Cards).'
    )
    expect(effects.find((effect) => effect.key === EffectKey.Morale)).toHaveProperty(
      'ability',
      'Adds +1 to all units in the row (excluding itself).'
    )
    expect(effects.find((effect) => effect.key === EffectKey.Muster)).toHaveProperty(
      'ability',
      'Find any cards with the same name in your deck and play them instantly.'
    )
    expect(effects.find((effect) => effect.key === EffectKey.Scorch)).toHaveProperty(
      'ability',
      'Kills the strongest card(s) on the battlefield.'
    )
    expect(effects.find((effect) => effect.key === EffectKey.Spy)).toHaveProperty(
      'ability',
      "Place on your opponent's battlefield (counts towards opponent's total) and hand up to 2 random cards from your undrawn pile."
    )
    expect(effects.find((effect) => effect.key === EffectKey.Weather)).toHaveProperty(
      'ability',
      'Reduce the strength of all cards in the given row(s) on the battlefield to 1, including your own.'
    )

    // verify leaders pre upgrade
    const preUpgradeLeaders = await LeaderStore.get({})
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Crach an Craite')).toHaveProperty(
      'ability',
      "Shuffle all cards from each player's graveyard back into their decks."
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Emhyr var Emreis Emperor of Nilfgaard')).toHaveProperty(
      'ability',
      "Look at 3 random cards from your opponent's hand."
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Emhyr var Emreis His Imperial Majesty')).toHaveProperty(
      'ability',
      'Pick a Torrential Rain card from your deck and play it instantly.'
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Emhyr var Emreis Invader of the North')).toHaveProperty(
      'ability',
      'Abilities that restore a unit to the battlefield restore a randomly-chosen unit. Affects both players.'
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Emhyr var Emreis the Relentless')).toHaveProperty(
      'ability',
      "Draw a card from your opponent's discard pile."
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Emhyr var Emreis the White Flame')).toHaveProperty(
      'ability',
      "Cancel your opponent's Leader Ability."
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Eredin Breacc Glas the Treacherous')).toHaveProperty(
      'ability',
      'Doubles the strength of all spy cards (affects both players).'
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Eredin Bringer of Death')).toHaveProperty(
      'ability',
      'Restore a card from your discard pile to your hand.'
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Eredin Commander of the Red Riders')).toHaveProperty(
      'ability',
      "Double the strength of all your Close Combat units (unless a Commander's horn is also present on that row)."
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Eredin Destroyer of Worlds')).toHaveProperty(
      'ability',
      'Discard 2 card and draw 1 card of your choice from your deck.'
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Eredin King of the Wild Hunt')).toHaveProperty(
      'ability',
      'Pick any weather card from your deck and play it instantly.'
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Foltest King of Temeria')).toHaveProperty(
      'ability',
      'Pick an Impenetrable Fog card from your deck and play it instantly.'
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Foltest Lord Commander of the North')).toHaveProperty(
      'ability',
      'Clear any weather effects (resulting from Biting Frost, Torrential Rain or Impenetrable Fog cards) in play.'
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Foltest Son of Medell')).toHaveProperty(
      'ability',
      "Destroy your enemy's strongest Ranged Combat unit(s) if the combined strength of all his or her Ranged Combat units is 10 or more."
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Foltest the Siegemaster')).toHaveProperty(
      'ability',
      "Doubles the strength of all your Siege units (unless a Commander's Horn is also present on that row)."
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Foltest the Steel-Forged')).toHaveProperty(
      'ability',
      "Destroy your enemy's strongest Siege unit(s) if the combined strength of all his or her Siege units is 10 or more."
    )
    expect(
      preUpgradeLeaders.find((leader) => leader.name === 'Francesca Findabair Daisy of the Valley')
    ).toHaveProperty('ability', 'Draw an extra card at the beginning of the battle')
    expect(
      preUpgradeLeaders.find((leader) => leader.name === 'Francesca Findabair Hope of the Aen Seidhe')
    ).toHaveProperty(
      'ability',
      "Move agile units to whichever valid row maximizes their strength (don't move units already in optimal row)."
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Francesca Findabair Pureblood Elf')).toHaveProperty(
      'ability',
      'Pick a Biting Frost card from your deck and play it instantly.'
    )
    expect(
      preUpgradeLeaders.find((leader) => leader.name === 'Francesca Findabair Queen of Dol Blathanna')
    ).toHaveProperty(
      'ability',
      "Destroy your enemy's strongest Close Combat unit(s) if the combined strength of all his or her Close Combat units is 10 or more."
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'Francesca Findabair the Beautiful')).toHaveProperty(
      'ability',
      "Doubles the strength of all your Ranged Combat units (unless a Commander's Horn is also present on that row)."
    )
    expect(preUpgradeLeaders.find((leader) => leader.name === 'King Bran')).toHaveProperty(
      'ability',
      'Units only lose half their Strength in bad weather conditions.'
    )

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
  const factions = await FactionStore.get({})
  expect(factions.find((faction) => faction.key === FactionKey.Monsters)).toHaveProperty(
    'ability',
    'A random Unit (excluding opponents) remains on the battlefield between rounds.'
  )
  expect(factions.find((faction) => faction.key === FactionKey.NilfgaardianEmpire)).toHaveProperty(
    'ability',
    'Win any round that ends in a draw (if only player with this faction).'
  )
  expect(factions.find((faction) => faction.key === FactionKey.NorthernRealms)).toHaveProperty(
    'ability',
    'Hand a Unit from your Draw pile when you win a round.'
  )
  expect(factions.find((faction) => faction.key === FactionKey.ScoiaTael)).toHaveProperty(
    'ability',
    'Decide order turns are taken to start the game (if only player with this faction).'
  )
  expect(factions.find((faction) => faction.key === FactionKey.Skellige)).toHaveProperty(
    'ability',
    'Up to 2 random Units are revived from your Lost pile at the start of the third round.'
  )

  // effects
  const effects = await EffectStore.get({})
  expect(effects.find((effect) => effect.key === EffectKey.Agile)).toHaveProperty(
    'ability',
    'Place in either the Close or Ranged combat Row.'
  )
  expect(effects.find((effect) => effect.key === EffectKey.Avenger)).toHaveProperty(
    'ability',
    'When sent to the Lost pile, summon a powerful new Unit to the battlefield.'
  )
  expect(effects.find((effect) => effect.key === EffectKey.Berserker)).toHaveProperty(
    'ability',
    'Transform into a bear when a Mardroeme is on its Row.'
  )
  expect(effects.find((effect) => effect.key === EffectKey.Bond)).toHaveProperty(
    'ability',
    'Double the strength (compounding) of Unit(s) with the same name.'
  )
  expect(effects.find((effect) => effect.key === EffectKey.Decoy)).toHaveProperty(
    'ability',
    'Swap with a Unit on the battlefield, returning it to your Hand.'
  )
  expect(effects.find((effect) => effect.key === EffectKey.Horn)).toHaveProperty(
    'ability',
    'Double the strength of all Units in that Row (limited to 1 per Row).'
  )
  expect(effects.find((effect) => effect.key === EffectKey.Mardroeme)).toHaveProperty(
    'ability',
    'Trigger transformation of all (including future) Berserkers in the same Row.'
  )
  expect(effects.find((effect) => effect.key === EffectKey.Medic)).toHaveProperty(
    'ability',
    'Revive one Unit from your Lost pile to the battlefield.'
  )
  expect(effects.find((effect) => effect.key === EffectKey.Morale)).toHaveProperty(
    'ability',
    'Increase strength by 1 of all Units in the same Row (excluding itself).'
  )
  expect(effects.find((effect) => effect.key === EffectKey.Muster)).toHaveProperty(
    'ability',
    'Summon any Units with the same name from your Hand or Draw pile to the battlefield.'
  )
  expect(effects.find((effect) => effect.key === EffectKey.Scorch)).toHaveProperty(
    'ability',
    'Send the strongest Unit(s) on the battlefield to their respective players Lost pile.'
  )
  expect(effects.find((effect) => effect.key === EffectKey.Spy)).toHaveProperty(
    'ability',
    "Place on an opponent's battlefield (counts towards their total) and Hand up to 2 random Units from your Draw pile."
  )
  expect(effects.find((effect) => effect.key === EffectKey.Weather)).toHaveProperty(
    'ability',
    'Reduce the strength of all Units in a given Row(s) on the battlefield to 1 (including your own).'
  )

  const leaders = await LeaderStore.get({})
  expect(leaders.find((leader) => leader.name === 'Crach an Craite')).toHaveProperty(
    'ability',
    "Shuffle all Units from each player's Lost pile back into their Draw pile."
  )
  expect(leaders.find((leader) => leader.name === 'Emhyr var Emreis Emperor of Nilfgaard')).toHaveProperty(
    'ability',
    "Look at 3 random Units (including Heroes) from your opponent's Hand."
  )
  expect(leaders.find((leader) => leader.name === 'Emhyr var Emreis His Imperial Majesty')).toHaveProperty(
    'ability',
    'Move a Torrential Rain from your Draw pile to the battlefield.'
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
  expect(leaders.find((leader) => leader.name === 'Eredin Breacc Glas the Treacherous')).toHaveProperty(
    'ability',
    'Double the strength of all Spies (affects all players).'
  )
  expect(leaders.find((leader) => leader.name === 'Eredin Bringer of Death')).toHaveProperty(
    'ability',
    'Restore a Unit from your Lost pile to your Hand.'
  )
  expect(leaders.find((leader) => leader.name === 'Eredin Commander of the Red Riders')).toHaveProperty(
    'ability',
    "Place a Commander's Horn in your Close combat Row."
  )
  expect(leaders.find((leader) => leader.name === 'Eredin Destroyer of Worlds')).toHaveProperty(
    'ability',
    'Remove 2 Units from Hand to Lost pile and move 1 Unit from Draw pile to Hand.'
  )
  expect(leaders.find((leader) => leader.name === 'Eredin King of the Wild Hunt')).toHaveProperty(
    'ability',
    'Move a Weather Unit from your Draw pile to the battlefield.'
  )
  expect(leaders.find((leader) => leader.name === 'Foltest King of Temeria')).toHaveProperty(
    'ability',
    'Move an Impenetrable Fog from your Draw pile to the battlefield.'
  )
  expect(leaders.find((leader) => leader.name === 'Foltest Lord Commander of the North')).toHaveProperty(
    'ability',
    'Clear any Weather effects in play.'
  )
  expect(leaders.find((leader) => leader.name === 'Foltest Son of Medell')).toHaveProperty(
    'ability',
    'Send opponents strongest Ranged Combat Unit(s) to their Lost piles if their Ranged combat Row score is 10 or more.'
  )
  expect(leaders.find((leader) => leader.name === 'Foltest the Siegemaster')).toHaveProperty(
    'ability',
    "Place a Commander's Horn in your Siege combat Row."
  )
  expect(leaders.find((leader) => leader.name === 'Foltest the Steel-Forged')).toHaveProperty(
    'ability',
    'Send opponents strongest Siege Unit(s) to their Lost piles if their Siege combat Row score is 10 or more.'
  )
  expect(leaders.find((leader) => leader.name === 'Francesca Findabair Daisy of the Valley')).toHaveProperty(
    'ability',
    'Hand an extra Unit at the beginning of the game.'
  )
  expect(leaders.find((leader) => leader.name === 'Francesca Findabair Hope of the Aen Seidhe')).toHaveProperty(
    'ability',
    'Move Agile units to whichever valid Row maximizes their strength.'
  )
  expect(leaders.find((leader) => leader.name === 'Francesca Findabair Pureblood Elf')).toHaveProperty(
    'ability',
    'Move a Biting Frost from your Draw pile to the battlefield.'
  )
  expect(leaders.find((leader) => leader.name === 'Francesca Findabair Queen of Dol Blathanna')).toHaveProperty(
    'ability',
    'Send opponents strongest Close combat Unit(s) to their Lost piles if their Close combat Row score is 10 or more.'
  )
  expect(leaders.find((leader) => leader.name === 'Francesca Findabair the Beautiful')).toHaveProperty(
    'ability',
    "Place a Commander's Horn in your Ranged combat Row."
  )
  expect(leaders.find((leader) => leader.name === 'King Bran')).toHaveProperty(
    'ability',
    'Units only lose half their strength in bad weather conditions.'
  )
}

function getResourceId(resources: (EffectDbObject | FactionDbObject | LeaderDbObject)[], keyOrName: string): ObjectId {
  const matches = resources.filter((resource) => {
    const value = 'key' in resource ? resource.key : resource.name
    return value === keyOrName
  })
  if (matches.length === 0) {
    throw Error(`Found no resource with "${keyOrName}" when getting ID`)
  } else if (matches.length > 1) {
    throw Error(`Found more than 1 leader with "${keyOrName}" when getting ID`)
  } else {
    return matches[0]._id
  }
}
