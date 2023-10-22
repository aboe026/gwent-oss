import log4js from 'log4js'

import cards from './cards.json'
import CardStore, { AddLeaderInput, AddUnitInput } from '../card-store'
import { Combat, Dlc, Effect, Faction } from '../generated-typings'

export default async function upgrade2() {
  const logger = log4js.getLogger('upgrade-2')
  if (logger.isTraceEnabled()) {
    logger.trace(`cards: "${JSON.stringify(cards)}"`)
  }
  for (const card of cards) {
    if (card.Type === 'Leader') {
      logger.debug(`Adding leader card "${card.Name}"`)
      await CardStore.addLeader(normalizeLeader(card))
    } else {
      logger.debug(`Adding unit card "${card.Name}"`)
      await CardStore.addUnit(normalizeUnit(card))
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeLeader(card: any): AddLeaderInput {
  return {
    name: card.Name,
    faction: normalizeFaction(card),
    dlc: normalizeDlc(card),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeUnit(card: any): AddUnitInput {
  if (card.Occurrences === undefined) {
    throw Error(`Card "${card.Name}" has "occurrences" set to "undefined": Must be a positive integer.`)
  }
  return {
    name: card.Name,
    faction: normalizeFaction(card),
    occurrences: card.Occurrences,
    dlc: normalizeDlc(card),
    combats: normalizeCombats(card),
    hero: card.Type === 'Hero',
    strength: card.Strength || null,
    effects: normalizeEffects(card),
    scorchScope: normalizeScorchScope(card),
    scorchMin: card['Scorch Minimum Strength'] || null,
    musterPrefix: card['Muster Prefix'] || null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeFaction(card: any): Faction {
  if (card.Faction === 'Monsters') {
    return Faction.Monsters
  } else if (card.Faction === 'Neutral') {
    return Faction.Neutral
  } else if (card.Faction === 'Nilfgaardian Empire') {
    return Faction.NilfgaardianEmpire
  } else if (card.Faction === 'Northern Realms') {
    return Faction.NorthernRealms
  } else if (card.Faction === "Scoia'tael") {
    return Faction.ScoiaTael
  } else if (card.Faction === 'Skellige') {
    return Faction.Skellige
  }
  throw Error(`Invalid Faction "${card.Faction}"`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeDlc(card: any): Dlc | null {
  if (card.DLC === undefined) {
    return null
  } else if (card.DLC === 'Hearts of Stone') {
    return Dlc.HeartsOfStone
  } else if (card.DLC === 'Blood and Wine') {
    return Dlc.BloodAndWine
  } else if (card.DLC === 'Gwent: The Witcher Card Game') {
    return Dlc.GwentTheWitcherCardGame
  }
  throw Error(`Invalid DLC "${card.DLC}"`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeCombats(card: any): Combat[] {
  const combat: Combat[] = []
  if (card['Combat 1']) {
    combat.push(normalizeCombat(card['Combat 1']))
  }
  if (card['Combat 2']) {
    combat.push(normalizeCombat(card['Combat 2']))
  }
  return combat
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeCombat(combat: any): Combat {
  if (combat === 'Close') {
    return Combat.Close
  } else if (combat === 'Ranged') {
    return Combat.Ranged
  } else if (combat === 'Siege') {
    return Combat.Siege
  }
  throw Error(`Invalid Combat "${combat}"`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeEffects(card: any): Effect[] {
  const effects: Effect[] = []
  if (card['Effect 1']) {
    effects.push(normalizeEffect(card['Effect 1']))
  }
  if (card['Effect 2']) {
    effects.push(normalizeEffect(card['Effect 2']))
  }
  return effects
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeEffect(effect: any): Effect {
  if (effect === 'Agile') {
    return Effect.Agile
  } else if (effect === 'Avenger') {
    return Effect.Avenger
  } else if (effect === 'Berserker') {
    return Effect.Berserker
  } else if (effect === 'Bond') {
    return Effect.Bond
  } else if (effect === 'Decoy') {
    return Effect.Decoy
  } else if (effect === 'Horn') {
    return Effect.Horn
  } else if (effect === 'Mardroeme') {
    return Effect.Mardroeme
  } else if (effect === 'Medic') {
    return Effect.Medic
  } else if (effect === 'Morale') {
    return Effect.Morale
  } else if (effect === 'Muster') {
    return Effect.Muster
  } else if (effect === 'Scorch') {
    return Effect.Scorch
  } else if (effect === 'Spy') {
    return Effect.Spy
  } else if (effect === 'Weather') {
    return Effect.Weather
  }
  throw Error(`Invalid Effect "${effect}"`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeScorchScope(card: any): Combat | null {
  if (card['Scorch Scope']) {
    return normalizeCombat(card['Scorch Scope'])
  }
  return null
}
