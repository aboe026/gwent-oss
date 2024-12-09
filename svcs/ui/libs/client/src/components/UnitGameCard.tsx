import { CgMaximizeAlt } from 'react-icons/cg'
import { DeckUnit, EffectKey } from '@gwent/graphql-schema/resolver-typings'
import { Dispatch, SetStateAction } from 'react'
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
  deckUnit,
  iconSize = '34px',
  selected,
  cursor = 'pointer',
  setFullUnit,
}: UnitGameCardProps) {
  const combatSymbol = getCombatImage(deckUnit)
  const combatTitle = deckUnit.unit.combats
    ? deckUnit.unit.combats.map((combat) => toTitleCase(combat)).join(' or ')
    : ''
  return (
    <div
      className={`${HTML_CLASSES.UnitGameCardContainer} ${selected ? HTML_CLASSES.UnitGameCardSelected : ''}`}
      title={deckUnit.unit.name}
      style={{ cursor }}
    >
      <img
        className="unit-game-card-image"
        title={deckUnit.unit.name}
        src={deckUnit.unit.images[deckUnit.artStyle - 1]}
      />
      <div className={HTML_CLASSES.UnitGameCardStrength} style={{ height: iconSize, width: iconSize }}>
        <StrengthCircle size={iconSize} unit={deckUnit.unit} />
      </div>
      <div
        className={`${HTML_CLASSES.UnitGameCardFullScreen} icon-container pointable`}
        title="Fullscreen"
        onClick={() => setFullUnit(deckUnit)}
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
  deckUnit: DeckUnit
  iconSize?: string
  selected?: boolean
  cursor?: string
  setFullUnit: Dispatch<SetStateAction<DeckUnit | undefined>>
}
