import { CgMaximizeAlt } from 'react-icons/cg'
import { MouseEvent } from 'react'

import {
  DeckUnitFragment,
  EffectKey,
  FieldUnitFragment,
  UnitEffectFragmentDoc,
  UnitFragmentDoc,
  useFragment,
  WeatherUnitFragment,
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
  gameUnit,
  dotted,
  dottedTitle,
  effectiveStrength,
  iconSize = '34px',
  onClick,
  onFullscreen,
  selected,
  title,
}: UnitGameCardProps) {
  const unit = useFragment(UnitFragmentDoc, gameUnit.unit)
  const combatSymbol = getCombatImage(gameUnit)
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
      onClick={(event) => {
        if (onClick) {
          onClick({
            gameUnit,
            event,
          })
        }
      }}
    >
      <img className="unit-game-card-image" title={unitTitle} src={unit.images[gameUnit.artStyle - 1]} />
      <div className={HTML_CLASSES.UnitGameCardStrength} style={{ maxWidth: iconSize }}>
        <StrengthCircle size="100%" unit={unit} effectiveStrength={effectiveStrength} effectHighlight={true} />
      </div>
      {onFullscreen && (
        <div
          className={`${HTML_CLASSES.UnitGameCardFullScreen} icon-container pointable`}
          title="Fullscreen"
          onClick={(event) => {
            event.stopPropagation()
            event.preventDefault()
            onFullscreen(gameUnit)
          }}
        >
          <CgMaximizeAlt className="unit-game-card-fullscreen-icon" />
        </div>
      )}
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
  gameUnit: DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment
  effectiveStrength?: number | null
  dotted?: boolean
  dottedTitle?: string
  iconSize?: string
  // TODO: revert this and allow for fullscreen from revive units
  onFullscreen?: (gameUnit: DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment) => void
  onClick?: (args: {
    gameUnit: DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment
    event: MouseEvent<HTMLDivElement>
  }) => void
  selected?: boolean
  title?: string
}
