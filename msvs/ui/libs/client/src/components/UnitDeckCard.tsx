import { CgChevronLeft, CgChevronRight, CgMaximizeAlt } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'

import {
  CardUnitFragmentFragmentDoc,
  DeckUnitFragmentFragment,
  EffectKey,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import getCombatImage from '../util/get-combat-image'
import { HTML_CLASSES } from '@gwent/constants'
import StrengthCircle from './StrengthCircle'
import { toTitleCase } from '@gwent/utils'
import './UnitDeckCard.css'

/**
 * A card for a Unit in a deck.
 *
 * @returns The Unit card for the deck.
 */
export default function UnitDeckCard({
  deckUnit,
  disabled,
  setFullUnit,
  setSelectedUnits,
  setUnits,
}: UnitDeckCardProps) {
  /**
   * When a User selects a Unit, toggles between available and selected.
   */
  function selectUnit(event: React.MouseEvent<HTMLImageElement>) {
    event.preventDefault()

    if (!disabled) {
      setSelectedUnits((previous: DeckUnitFragmentFragment[]) => {
        const alreadySelected = previous.some(
          (selectedCard) =>
            useFragment(CardUnitFragmentFragmentDoc, selectedCard.unit).id ===
            useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit).id
        )
        if (alreadySelected) {
          return previous.filter(
            (selectedCard) =>
              useFragment(CardUnitFragmentFragmentDoc, selectedCard.unit).id !==
              useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit).id
          )
        }
        return [...previous, deckUnit]
      })
    }
  }
  /**
   * Changes alternative artwork. 1-based indexing
   */
  function changeArtStyle(change: number) {
    setUnits((previous: DeckUnitFragmentFragment[]) =>
      previous.map((newCard) => {
        if (
          useFragment(CardUnitFragmentFragmentDoc, newCard.unit).id ===
            useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit).id &&
          newCard.artStyle !== undefined &&
          newCard.artStyle !== null
        ) {
          newCard.artStyle = newCard.artStyle + change
        }
        return newCard
      })
    )
  }
  /**
   * Changes alternative artwork to next one if available.
   */
  function incrementArtStyle(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (
      !disabled &&
      deckUnit.artStyle &&
      deckUnit.artStyle < useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit).images.length
    ) {
      changeArtStyle(1)
    }
  }
  /**
   * Changes alternative artwork to previous one if available.
   */
  function decrementArtStyle(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (!disabled && deckUnit.artStyle && deckUnit.artStyle > 1) {
      changeArtStyle(-1)
    }
  }
  /**
   * Opens a Units FullCard dialog with detailed information about the Unit.
   */
  function openFullscreen(event: React.MouseEvent<SVGElement>) {
    event.preventDefault()
    event.stopPropagation()
    setFullUnit(deckUnit)
  }
  /**
   * When a unit name is selected, stop propogation so card isn't selected. Allows for user to highlight and copy name.
   */
  function nameSelect(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
  }
  const combatSymbol = getCombatImage(deckUnit)
  const unit = useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit)
  const combatTitle = unit.combats ? unit.combats.map((combat) => toTitleCase(combat)).join(' or ') : ''

  return (
    <div
      className={`${HTML_CLASSES.UnitDeckCardContainer} ${!disabled ? 'pointable' : ''}`}
      title={unit.name}
      onClick={selectUnit}
    >
      <div className="unit-deck-card-actions-upper">
        <div className="unit-deck-card-icons">
          <StrengthCircle unit={unit} size="50px" style={{ marginBottom: '20px' }} />
          {combatSymbol && <img className="unit-deck-card-icon" src={combatSymbol} title={combatTitle} />}
          {unit.effects &&
            unit.effects
              .filter((effect) => effect.key !== EffectKey.Weather)
              .map((effect, index) => (
                <img className="unit-deck-card-icon" src={effect.image} key={index} title={effect.name} />
              ))}
        </div>
        <CgMaximizeAlt
          className={`${HTML_CLASSES.UnitDeckCardMaximize} icon-container pointable`}
          onClick={openFullscreen}
          title="Fullscreen"
        />
      </div>
      <img src={unit.images[(deckUnit.artStyle || 1) - 1]} className="unit-deck-card-image" />
      {((deckUnit.artStyle && unit.images.length > 1) || unit.dlc) && (
        <div className="unit-deck-card-actions-lower">
          {deckUnit.artStyle && (
            <div
              className={`unit-deck-card-art-switcher ${unit.images.length > 1 ? 'icon-container' : ''}  ${
                deckUnit.artStyle < unit.images.length ? 'pointable' : ''
              }`}
              onClick={decrementArtStyle}
              title="Previous Art Style"
            >
              {deckUnit.artStyle > 1 && <CgChevronLeft className="unit-deck-card-art-switcher-arrow" size="1.5em" />}
            </div>
          )}
          {unit.dlc && (
            <div
              className="unit-deck-card-dlc"
              title={unit.dlc.name}
              style={{
                backgroundImage: `url(${unit.dlc.image})`,
                marginBottom: unit.images.length > 1 ? '-1px' : '-3px',
              }}
            ></div>
          )}
          {deckUnit.artStyle && (
            <div
              className={`unit-deck-card-art-switcher ${unit.images.length > 1 ? 'icon-container' : ''}  ${
                deckUnit.artStyle < unit.images.length ? 'pointable' : ''
              }`}
              onClick={incrementArtStyle}
              title="Next Art Style"
            >
              {deckUnit.artStyle < unit.images.length && (
                <CgChevronRight className="unit-deck-card-art-switcher-arrow" size="1.5em" />
              )}
            </div>
          )}
        </div>
      )}
      <span className={HTML_CLASSES.UnitDeckCardName} onClick={nameSelect}>
        {unit.name}
      </span>
    </div>
  )
}

interface UnitDeckCardProps {
  deckUnit: DeckUnitFragmentFragment
  disabled: boolean
  setFullUnit: Dispatch<SetStateAction<DeckUnitFragmentFragment | undefined>>
  setSelectedUnits: Dispatch<SetStateAction<DeckUnitFragmentFragment[]>>
  setUnits: Dispatch<SetStateAction<DeckUnitFragmentFragment[]>>
}
