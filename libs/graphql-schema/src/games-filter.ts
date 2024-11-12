import { FactionKey, GameStatus } from '../generated/resolver-typings'

export enum SORT_FIELD {
  Created = 'created',
  Creator = 'creator',
  Status = 'status',
  Updated = 'updated',
}

export enum SORT_ORDER {
  Asc = 'ascending',
  Desc = 'descending',
}

export enum FILTER_GROUP {
  Faction = 'Faction',
  Status = 'Status',
}

export interface FilterField {
  label: string
  value: FILTER_FIELD
  group: FILTER_GROUP
  title?: string
}

export enum FILTER_FIELD {
  Monsters = FactionKey.Monsters,
  NilfgaardianEmpire = FactionKey.NilfgaardianEmpire,
  NorthernRealms = FactionKey.NorthernRealms,
  ScoiaTael = FactionKey.ScoiaTael,
  Skellige = FactionKey.Skellige,
  Decking = GameStatus.Decking,
  Ordering = GameStatus.Ordering,
  Redrawing = GameStatus.Redrawing,
  Playing = GameStatus.Playing,
  Done = GameStatus.Done,
}

export const FILTERS: {
  [x in FILTER_FIELD]: FilterField
} = {
  MONSTERS: {
    group: FILTER_GROUP.Faction,
    label: 'Monsters',
    value: FILTER_FIELD.Monsters,
  },
  NILFGAARDIAN_EMPIRE: {
    group: FILTER_GROUP.Faction,
    label: 'Nilfgaardian Empire',
    value: FILTER_FIELD.NilfgaardianEmpire,
  },
  NORTHERN_REALMS: {
    group: FILTER_GROUP.Faction,
    label: 'Northern Realms',
    value: FILTER_FIELD.NorthernRealms,
  },
  SCOIA_TAEL: {
    group: FILTER_GROUP.Faction,
    label: "Scoia'tael",
    value: FILTER_FIELD.ScoiaTael,
  },
  SKELLIGE: {
    group: FILTER_GROUP.Faction,
    label: 'Skellige',
    value: FILTER_FIELD.Skellige,
  },
  DECKING: {
    group: FILTER_GROUP.Status,
    label: 'Decking',
    value: FILTER_FIELD.Decking,
  },
  ORDERING: {
    group: FILTER_GROUP.Status,
    label: 'Ordering',
    value: FILTER_FIELD.Ordering,
  },
  REDRAWING: {
    group: FILTER_GROUP.Status,
    label: 'Redrawing',
    value: FILTER_FIELD.Redrawing,
  },
  PLAYING: {
    group: FILTER_GROUP.Status,
    label: 'Playing',
    value: FILTER_FIELD.Playing,
  },
  DONE: {
    group: FILTER_GROUP.Status,
    label: 'Done',
    value: FILTER_FIELD.Done,
  },
}
