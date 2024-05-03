import { CgChevronLeft, CgChevronRight, CgMaximizeAlt } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'

import { DeckUnit } from '@gwent/graphql-schema/resolver-typings'
import { HTML_CLASSES } from '@gwent/constants'
import './UnitCard.css'

/**
 * A Unit of a deck
 *
 * @returns The Unit in the deck
 */
export default function UnitCard({ deckUnit, setSelectedUnits, setUnits, setFullUnit, disabled }: UnitCardProps) {
  function selectUnit(event: React.MouseEvent<HTMLImageElement>) {
    event.preventDefault()

    if (!disabled) {
      setSelectedUnits((previous: DeckUnit[]) => {
        const alreadySelected = previous.some((selectedCard) => selectedCard.unit.id === deckUnit.unit.id)
        if (alreadySelected) {
          return previous.filter((selectedCard) => selectedCard.unit.id !== deckUnit.unit.id)
        }
        return [...previous, deckUnit]
      })
    }
  }
  function changeArtStyle(change: number) {
    setUnits((previous: DeckUnit[]) =>
      previous.map((newCard) => {
        if (newCard.unit.id === deckUnit.unit.id && newCard.artStyle !== undefined && newCard.artStyle !== null) {
          newCard.artStyle = newCard.artStyle + change
        }
        return newCard
      })
    )
  }
  function incrementArtStyle(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (!disabled && deckUnit.artStyle && deckUnit.artStyle < deckUnit.unit.images.length) {
      changeArtStyle(1)
    }
  }
  function decrementArtStyle(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (!disabled && deckUnit.artStyle && deckUnit.artStyle > 1) {
      changeArtStyle(-1)
    }
  }
  function openFullscreen(event: React.MouseEvent<SVGElement>) {
    event.preventDefault()
    event.stopPropagation()
    setFullUnit(deckUnit)
  }
  function nameSelect(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div
      className={`${HTML_CLASSES.DeckUnitCard} ${!disabled ? 'pointable' : ''}`}
      title={deckUnit.unit.name}
      onClick={selectUnit}
    >
      <div className="unit-card-actions-upper">
        <CgMaximizeAlt
          className="unit-card-maximize icon-container pointable"
          style={{ marginTop: deckUnit.unit.hero ? '6px' : '1px' }}
          onClick={openFullscreen}
        />
      </div>
      <img
        src={deckUnit.unit.images[(deckUnit.artStyle || 1) - 1]}
        className={`unit-card-image ${deckUnit.unit.hero ? 'unit-card-image-hero' : ''}`}
      />
      {((deckUnit.artStyle && deckUnit.unit.images.length > 1) || deckUnit.unit.dlc) && (
        <div className="unit-card-actions-lower">
          {deckUnit.artStyle && (
            <div
              className={`unit-card-art-switcher ${deckUnit.unit.images.length > 1 ? 'icon-container' : ''}  ${
                deckUnit.artStyle < deckUnit.unit.images.length ? 'pointable' : ''
              }`}
              style={{ marginLeft: deckUnit.unit.hero ? '8px' : '0' }}
              onClick={decrementArtStyle}
            >
              {deckUnit.artStyle > 1 && <CgChevronLeft className="unit-card-art-switcher-arrow" size="1.5em" />}
            </div>
          )}
          {deckUnit.unit.dlc && (
            <div
              className="unit-card-dlc"
              title={deckUnit.unit.dlc.name}
              style={{
                backgroundImage: `url(${deckUnit.unit.dlc.image})`,
                marginBottom: deckUnit.unit.images.length > 1 ? '-1px' : '-3px',
              }}
            ></div>
          )}
          {deckUnit.artStyle && (
            <div
              className={`unit-card-art-switcher ${deckUnit.unit.images.length > 1 ? 'icon-container' : ''}  ${
                deckUnit.artStyle < deckUnit.unit.images.length ? 'pointable' : ''
              }`}
              onClick={incrementArtStyle}
            >
              {deckUnit.artStyle < deckUnit.unit.images.length && (
                <CgChevronRight className="unit-card-art-switcher-arrow" size="1.5em" />
              )}
            </div>
          )}
        </div>
      )}
      <span className={HTML_CLASSES.DeckUnitName} onClick={nameSelect}>
        {deckUnit.unit.name}
      </span>
    </div>
  )
}

interface UnitCardProps {
  deckUnit: DeckUnit
  key: string
  setSelectedUnits: Dispatch<SetStateAction<DeckUnit[]>>
  setUnits: Dispatch<SetStateAction<DeckUnit[]>>
  setFullUnit: Dispatch<SetStateAction<DeckUnit | undefined>>
  disabled: boolean
}
