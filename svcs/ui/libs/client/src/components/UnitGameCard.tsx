import { CgMaximizeAlt } from 'react-icons/cg'
import { DeckUnit, EffectKey } from '@gwent/graphql-schema/resolver-typings'
import { getCombatImage, toTitleCase } from '@gwent/utils'
import { HTML_CLASSES } from '@gwent/constants'
import StrengthCircle from './StrengthCircle'
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
  effectiveStrength,
  iconSize = '34px',
  onFullscreen,
  selected,
  title,
}: UnitGameCardProps) {
  const combatSymbol = getCombatImage(deckUnit)
  const combatTitle = deckUnit.unit.combats
    ? deckUnit.unit.combats.map((combat) => toTitleCase(combat)).join(' or ')
    : ''
  const unitTitle = title || deckUnit.unit.name
  return (
    <div
      className={`${HTML_CLASSES.UnitGameCardContainer} ${selected ? HTML_CLASSES.ItemHighlighted : ''}`}
      title={unitTitle}
      style={{
        cursor,
        borderStyle: selected ? (dotted ? 'dotted' : 'solid') : 'none',
      }}
    >
      <img className="unit-game-card-image" title={unitTitle} src={deckUnit.unit.images[deckUnit.artStyle - 1]} />
      <div className={HTML_CLASSES.UnitGameCardStrength} style={{ maxWidth: iconSize }}>
        <StrengthCircle
          size={'100%'}
          unit={deckUnit.unit}
          effectiveStrength={effectiveStrength}
          effectHighlight={true}
        />
      </div>
      <div
        className={`${HTML_CLASSES.UnitGameCardFullScreen} icon-container pointable`}
        title="Fullscreen"
        onClick={() => onFullscreen(deckUnit)}
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
        {deckUnit.unit.effects &&
          deckUnit.unit.effects
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
  deckUnit: DeckUnit
  effectiveStrength?: number | null
  dotted?: boolean
  iconSize?: string
  onFullscreen: (deckUnit: DeckUnit) => any // eslint-disable-line @typescript-eslint/no-explicit-any
  selected?: boolean
  title?: string
}
