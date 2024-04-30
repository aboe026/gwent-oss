import { FactionKey } from '../generated/resolver-typings'

export enum SORT_FIELD {
  Agile = 'stats.agile',
  Close = 'stats.close',
  Created = 'created',
  Heroes = 'stats.heroes',
  Name = 'name',
  Ranged = 'stats.ranged',
  Siege = 'stats.siege',
  Specials = 'stats.specials',
  StrengthTotal = 'stats.strengthTotal',
  StrengthAverage = 'stats.strengthAverage',
  Units = 'stats.units',
}

export enum SORT_ORDER {
  Asc = 'ascending',
  Desc = 'descending',
}

export enum FILTER_FIELD {
  Monsters = FactionKey.Monsters,
  NilfgaardianEmpire = FactionKey.NilfgaardianEmpire,
  NorthernRealms = FactionKey.NorthernRealms,
  ScoiaTael = FactionKey.ScoiaTael,
  Skellige = FactionKey.Skellige,
}
