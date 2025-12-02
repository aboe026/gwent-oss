import { DeckUnitFragment, GameUnitFragment } from '@gwent/graphql-schema/apollo-typings'

export interface SelectedCard {
  card: DeckUnitFragment | GameUnitFragment
  playerId: string | undefined // TODO: Change to playerName instead? since ID changes on logout?
}

// TODO: move to GameProps.tsx?
