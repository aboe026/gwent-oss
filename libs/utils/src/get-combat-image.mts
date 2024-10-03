import { Combat, DeckUnit } from '@gwent/graphql-schema/resolver-typings'

/**
 * Get the path to the combat image for a DeckUnit.
 *
 * @param deckUnit The DeckUnit to get the combat image for.
 * @returns The path to the image representing the combat for the DeckUnit.
 */
export default function getCombatImage(deckUnit: DeckUnit): string | undefined {
  if (!deckUnit.unit.special) {
    if (deckUnit.unit.combats?.length === 1) {
      return `images/combats/${deckUnit.unit.combats[0].toLowerCase()}.png`
    } else if (
      deckUnit.unit.combats?.length === 2 &&
      deckUnit.unit.combats?.includes(Combat.Close) &&
      deckUnit.unit.combats?.includes(Combat.Ranged)
    ) {
      return 'images/combats/agile.png'
    }
  }
}
