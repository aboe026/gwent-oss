import { CgMaximizeAlt } from 'react-icons/cg'

import {
  UnitFragmentDoc,
  DeckUnitFragment,
  EffectKey,
  GameUnitFragment,
  UnitEffectFragmentDoc,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import getCombatImage from '../util/get-combat-image'
import { HTML_CLASSES } from '@gwent/constants'
import StrengthCircle from './StrengthCircle'
import { toTitleCase } from '@gwent/utils'
import './UnitGameCard.css'

/**
 * A card displayed during a Game.
 *
 * @returns The card for a Game.
 */
export default function UnitGameCard({
  cursor = 'pointer',
  deckUnit,
  dotted,
  dottedTitle,
  effectiveStrength,
  iconSize = '34px',
  onClick,
  onFullscreen,
  selected,
  title,
}: UnitGameCardProps) {
  const unit = useFragment(UnitFragmentDoc, deckUnit.unit)
  const combatSymbol = getCombatImage(deckUnit)
  const combatTitle = unit.combats ? unit.combats.map((combat) => toTitleCase(combat)).join(' or ') : ''
  const unitTitle = title || unit.name
  const effects = useFragment(UnitEffectFragmentDoc, unit.effects)

  return (
    <div
      className={`${HTML_CLASSES.UnitGameCardContainer} ${selected ? HTML_CLASSES.ItemHighlighted : ''}`}
      title={dottedTitle || unitTitle}
      style={{
        cursor,
        borderStyle: selected ? (dotted ? 'dotted' : 'solid') : 'none',
      }}
      onClick={() => (onClick ? onClick(deckUnit) : {})}
    >
      <img className="unit-game-card-image" title={unitTitle} src={unit.images[deckUnit.artStyle - 1]} />
      <div className={HTML_CLASSES.UnitGameCardStrength} style={{ maxWidth: iconSize }}>
        <StrengthCircle size="100%" unit={unit} effectiveStrength={effectiveStrength} effectHighlight={true} />
      </div>
      <div
        className={`${HTML_CLASSES.UnitGameCardFullScreen} icon-container pointable`}
        title="Fullscreen"
        onClick={(event) => {
          event.stopPropagation()
          event.preventDefault()
          onFullscreen(deckUnit)
        }}
      >
        <CgMaximizeAlt className="unit-game-card-fullscreen-icon" />
      </div>
      <div className="unit-game-card-bottom">
        {combatSymbol && (
          <img
            src={combatSymbol}
            className="unit-game-card-bottom-icon"
            style={{ maxWidth: iconSize }}
            title={combatTitle}
          />
        )}
        {effects &&
          effects
            .filter((effect) => effect.key !== EffectKey.Weather)
            .map((effect, index) => (
              <img
                src={effect.image}
                className="unit-game-card-bottom-icon"
                title={effect.name}
                key={index}
                style={{ maxWidth: iconSize }}
              />
            ))}
      </div>
    </div>
  )
}

interface UnitGameCardProps {
  cursor?: string
  deckUnit: DeckUnitFragment | GameUnitFragment
  effectiveStrength?: number | null
  dotted?: boolean
  dottedTitle?: string
  iconSize?: string
  onFullscreen: (deckUnit: DeckUnitFragment | GameUnitFragment) => void
  onClick?: (deckUnit: DeckUnitFragment | GameUnitFragment) => void
  selected?: boolean
  title?: string
}
