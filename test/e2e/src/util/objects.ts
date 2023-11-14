export interface Leader {
  name: string
  faction: Faction
  dlc: Dlc
}

export interface Unit {
  name: string
  occurrences: number
  faction: Faction
  dlc: Dlc
  hero?: boolean
  combats: Combat[]
  strength: number
  effects: Effect[]
  scorchScope?: Combat
  scorchMin?: number
  musterPrefix?: string
}

export enum Combat {
  Close = 'CLOSE',
  Ranged = 'RANGED',
  Siege = 'SIEGE',
}

export enum Dlc {
  BloodAndWine = 'BLOOD_AND_WINE',
  GwentTheWitcherCardGame = 'GWENT_THE_WITCHER_CARD_GAME',
  HeartsOfStone = 'HEARTS_OF_STONE',
}

export enum Effect {
  Agile = 'AGILE',
  Avenger = 'AVENGER',
  Berserker = 'BERSERKER',
  Bond = 'BOND',
  Decoy = 'DECOY',
  Horn = 'HORN',
  Mardroeme = 'MARDROEME',
  Medic = 'MEDIC',
  Morale = 'MORALE',
  Muster = 'MUSTER',
  Scorch = 'SCORCH',
  Spy = 'SPY',
  Weather = 'WEATHER',
}

export enum Faction {
  Monsters = 'MONSTERS',
  Neutral = 'NEUTRAL',
  NilfgaardianEmpire = 'NILFGAARDIAN_EMPIRE',
  NorthernRealms = 'NORTHERN_REALMS',
  ScoiaTael = 'SCOIA_TAEL',
  Skellige = 'SKELLIGE',
}
