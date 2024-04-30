import { Combat, EffectKey } from '@gwent/graphql-schema/apollo-typings'

export enum DECK_SORT_FIELD {
  Name = 'name',
  Strength = 'strength',
}

export enum SORT_ORDER {
  Asc = 'ascending',
  Desc = 'descending',
}

export enum DECK_FILTER_FIELD {
  Hero = 'hero',
  Special = 'special',
  Close = Combat.Close,
  Ranged = Combat.Ranged,
  Siege = Combat.Siege,
  Agile = EffectKey.Agile,
  Strength = 'strength',
}
