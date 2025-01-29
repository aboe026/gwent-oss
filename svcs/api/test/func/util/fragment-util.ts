export function getUserFragment(): string {
  return `
    created
    id
    name
  `
}

export function getSettingFragment(): string {
  return `
    key
    label
    type
    value
  `
}

export function getDlcFragment(): string {
  return `
    created
    id
    image
    key
    name
  `
}

export function getEffectFragment(): string {
  return `
    ability
    created
    id
    image
    key
    name
  `
}

export function getStatsFragment(): string {
  return `
    agile
    avenger
    berserker
    bond
    close
    decoy
    heroes
    horn
    mardroeme
    medic
    morale
    muster
    ranged
    strengths
    scorch
    siege
    specials
    spy
    strengthAverage
    strengthTotal
    units
    weather
  `
}

export function getFactionFragment(): string {
  return `
    ability
    created
    dlc {
      ${getDlcFragment()}
    }
    id
    image
    key
    name
    stats {
      ${getStatsFragment()}
    }
  `
}

export function getLeaderFragment(): string {
  return `
    ability
    created
    dlc {
      ${getDlcFragment()}
    }
    faction {
      ${getFactionFragment()}
    }
    id
    image
    name
    quote
  `
}

export function getUnitFragment(): string {
  return `
    combats
    created
    deckable
    dlc {
      ${getDlcFragment()}
    }
    effectPrefix
    effects {
      ${getEffectFragment()}
    }
    faction {
      ${getFactionFragment()}
    }
    hero
    id
    images
    name
    quote
    scorchMin
    scorchScope
    special
    strength
  `
}

export function getDeckFragment(): string {
  return `
    created
    faction {
      ${getFactionFragment()}
    }
    id
    leader {
      ${getLeaderFragment()}
    }
    name
    stats {
      ${getStatsFragment()}
    }
    units {
      artStyle
      unit {
        ${getUnitFragment()}
      }
    }
    user {
      ${getUserFragment()}
    }
  `
}

export function getDeckUnitFragment(): string {
  return `
    artStyle
    unit {
      ${getUnitFragment()}
    }
  `
}

export function getMoveFragment() {
  return `
    ... on MoveLeader {
      created
      leader {
        ${getLeaderFragment()}
      }
    }
    ... on MovePass {
      created
    }
    ... on MoveUnit {
      created
      row
      unit {
        ${getDeckUnitFragment()}
      }
    }
  `
}

export function getGamePlayerFragment(): string {
  return `
    counts {
      discard
      hand
      undrawn
    }
    faction {
      ${getFactionFragment()}
    }
    leader {
      ${getLeaderFragment()}
    }
    order
    ready
    rounds {
      close {
        ${getPlayerCombatRowFragment()}
      }
      moves {
        ${getMoveFragment()}
      }
      passed
      ranged {
        ${getPlayerCombatRowFragment()}
      }
      result
      score
      siege {
        ${getPlayerCombatRowFragment()}
      }

    }
    user {
      ${getUserFragment()}
    }
  `
}

export function getGameFragment(): string {
  return `
    config {
      lives
    }
    created
    creator {
      ${getUserFragment()}
    }
    id
    players {
      ${getGamePlayerFragment()}
    }
    round
    status
    turn {
      ${getGamePlayerFragment()}
    }
    updated
    victors {
      ${getUserFragment()}
    }
  `
}

export function getGameDeckFragment(): string {
  return `
    discard {
      ${getDeckUnitFragment()}
    }
    from {
      ${getDeckFragment()}
    }
    hand {
      ${getDeckUnitFragment()}
    }
    redraws {
      from {
        ${getDeckUnitFragment()}
      }
      to {
        ${getDeckUnitFragment()}
      }
    }
    undrawn {
      ${getDeckUnitFragment()}
    }
  `
}

export function getGameUnitFragment() {
  return `
    artStyle
    effectiveStrength
    unit {
      ${getUnitFragment()}
    }
  `
}

export function getPlayerCombatRowFragment() {
  return `
    score
    units {
      ${getGameUnitFragment()}
    }
  `
}
