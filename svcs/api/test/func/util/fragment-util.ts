export function getUserFragment(): string {
  return `
    created
    id
    name
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

export function getFactionFragment({ statsModifier = '' }: { statsModifier?: string }): string {
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
    stats${statsModifier ? ` ${statsModifier}` : ''} {
      ${getStatsFragment()}
    }
  `
}

export function getLeaderFragment({ statsModifier = '' }: { statsModifier?: string }): string {
  return `
    ability
    created
    dlc {
      ${getDlcFragment()}
    }
    faction {
      ${getFactionFragment({ statsModifier })}
    }
    id
    image
    name
    quote
  `
}

export function getUnitFragment({ statsModifier = '' }: { statsModifier?: string }): string {
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
      ${getFactionFragment({ statsModifier })}
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

export function getDeckFragment({ statsModifier = '' }: { statsModifier?: string }): string {
  return `
    created
    faction {
      ${getFactionFragment({ statsModifier })}
    }
    id
    leader {
      ${getLeaderFragment({ statsModifier })}
    }
    name
    stats {
      ${getStatsFragment()}
    }
    units {
      artStyle
      unit {
        ${getUnitFragment({ statsModifier })}
      }
    }
    user {
      ${getUserFragment()}
    }
  `
}

export function getDeckUnitFragment({ statsModifier = '' }: { statsModifier?: string }): string {
  return `
    artStyle
    unit {
      ${getUnitFragment({ statsModifier })}
    }
  `
}

export function getGameFragment({ statsModifier = '' }: { statsModifier?: string }): string {
  return `
    created
    creator {
      ${getUserFragment()}
    }
    id
    players {
      counts {
        discard
        hand
        undrawn
      }
      faction {
        ${getFactionFragment({ statsModifier })}
      }
      leader {
        ${getLeaderFragment({ statsModifier })}
      }
      ready
      rounds {
        score
        won
      }
      user {
        ${getUserFragment()}
      }
    }
    round {
      current
      maximum
    }
    status
    updated
    victors {
      ${getUserFragment()}
    }
  `
}

export function getGameDeckFragment({ statsModifier = '' }: { statsModifier?: string }): string {
  return `
    discard {
      ${getDeckUnitFragment({ statsModifier })}
    }
    from {
      ${getDeckFragment({ statsModifier })}
    }
    hand {
      ${getDeckUnitFragment({ statsModifier })}
    }
    redraws {
      from {
        ${getDeckUnitFragment({ statsModifier })}
      }
      to {
        ${getDeckUnitFragment({ statsModifier })}
      }
    }
    undrawn {
      ${getDeckUnitFragment({ statsModifier })}
    }
  `
}
