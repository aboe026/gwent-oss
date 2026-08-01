import { Combat, EffectKey } from '../generated/resolver-typings'

export enum SORT_FIELD {
  Name = 'name',
  Strength = 'strength',
  Id = 'id',
}

export enum SORT_ORDER {
  Asc = 'ascending',
  Desc = 'descending',
}

export enum FILTER_FIELD {
  Agile = EffectKey.Agile,
  Avenger = EffectKey.Avenger,
  Berserker = EffectKey.Berserker,
  Bond = EffectKey.Bond,
  Close = Combat.Close,
  Decoy = EffectKey.Decoy,
  Hero = 'hero',
  Horn = EffectKey.Horn,
  Mardroeme = EffectKey.Mardroeme,
  Medic = EffectKey.Medic,
  Morale = EffectKey.Morale,
  Muster = EffectKey.Muster,
  Ranged = Combat.Ranged,
  Scorch = EffectKey.Scorch,
  Siege = Combat.Siege,
  Special = 'special',
  Spy = EffectKey.Spy,
  Weather = EffectKey.Weather,
}

export enum FILTER_GROUP {
  Effect = 'Effect',
  Combat = 'Combat',
  Other = 'Other',
}

export interface FilterField {
  label: string
  value: FILTER_FIELD
  group: FILTER_GROUP
  title?: string
}

export const FILTERS: {
  [x in FILTER_FIELD]: FilterField
} = {
  AGILE: {
    label: 'Agile',
    value: FILTER_FIELD.Agile,
    group: FILTER_GROUP.Effect,
  },
  AVENGER: {
    label: 'Avenger',
    value: FILTER_FIELD.Avenger,
    group: FILTER_GROUP.Effect,
  },
  BERSERKER: {
    label: 'Berserker',
    value: FILTER_FIELD.Berserker,
    group: FILTER_GROUP.Effect,
  },
  BOND: {
    label: 'Bond',
    value: FILTER_FIELD.Bond,
    group: FILTER_GROUP.Effect,
  },
  CLOSE: {
    label: 'Close',
    value: FILTER_FIELD.Close,
    group: FILTER_GROUP.Combat,
  },
  DECOY: {
    label: 'Decoy',
    value: FILTER_FIELD.Decoy,
    group: FILTER_GROUP.Effect,
  },
  hero: {
    label: 'Hero',
    value: FILTER_FIELD.Hero,
    group: FILTER_GROUP.Other,
  },
  HORN: {
    label: 'Horn',
    value: FILTER_FIELD.Horn,
    group: FILTER_GROUP.Effect,
  },
  MARDROEME: {
    label: 'Mardroeme',
    value: FILTER_FIELD.Mardroeme,
    group: FILTER_GROUP.Effect,
  },
  MEDIC: {
    label: 'Medic',
    value: FILTER_FIELD.Medic,
    group: FILTER_GROUP.Effect,
  },
  MORALE: {
    label: 'Morale',
    value: FILTER_FIELD.Morale,
    group: FILTER_GROUP.Effect,
  },
  MUSTER: {
    label: 'Muster',
    value: FILTER_FIELD.Muster,
    group: FILTER_GROUP.Effect,
  },
  RANGED: {
    label: 'Ranged',
    value: FILTER_FIELD.Ranged,
    group: FILTER_GROUP.Combat,
  },
  SCORCH: {
    label: 'Scorch',
    value: FILTER_FIELD.Scorch,
    group: FILTER_GROUP.Effect,
  },
  SIEGE: {
    label: 'Siege',
    value: FILTER_FIELD.Siege,
    group: FILTER_GROUP.Combat,
  },
  special: {
    label: 'Special',
    value: FILTER_FIELD.Special,
    group: FILTER_GROUP.Other,
  },
  SPY: {
    label: 'Spy',
    value: FILTER_FIELD.Spy,
    group: FILTER_GROUP.Effect,
  },
  WEATHER: {
    label: 'Weather',
    value: FILTER_FIELD.Weather,
    group: FILTER_GROUP.Effect,
  },
}
