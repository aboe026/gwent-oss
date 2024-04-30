import { CgChevronLeft, CgChevronRight, CgMaximizeAlt } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'

import { DeckCard } from '@gwent/graphql-schema/resolver-typings'
import { HTML_CLASSES } from '@gwent/constants'
import './UnitCard.css'

/**
 * A unit card of a deck
 *
 * @returns The unit card in the deck
 */
export default function UnitCard({ card, setSelectedCards, setCards, setFullCard, disabled }: UnitCardProps) {
  function selectUnit(event: React.MouseEvent<HTMLImageElement>) {
    event.preventDefault()

    if (!disabled) {
      setSelectedCards((previous: DeckCard[]) => {
        const alreadySelected = previous.some((selectedCard) => selectedCard.unit.id === card.unit.id)
        if (alreadySelected) {
          return previous.filter((selectedCard) => selectedCard.unit.id !== card.unit.id)
        }
        return [...previous, card]
      })
    }
  }
  function changeArtStyle(change: number) {
    setCards((previous: DeckCard[]) =>
      previous.map((newCard) => {
        if (newCard.unit.id === card.unit.id && newCard.artStyle !== undefined && newCard.artStyle !== null) {
          newCard.artStyle = newCard.artStyle + change
        }
        return newCard
      })
    )
  }
  function incrementArtStyle(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (!disabled && card.artStyle && card.artStyle < card.unit.images.length) {
      changeArtStyle(1)
    }
  }
  function decrementArtStyle(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (!disabled && card.artStyle && card.artStyle > 1) {
      changeArtStyle(-1)
    }
  }
  function openFullscreen(event: React.MouseEvent<SVGElement>) {
    event.preventDefault()
    event.stopPropagation()
    setFullCard(card)
  }
  function nameSelect(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div
      className={`${HTML_CLASSES.UnitCardContainer} ${!disabled ? 'pointable' : ''}`}
      title={card.unit.name}
      onClick={selectUnit}
    >
      <div className="unit-card-actions-upper">
        <CgMaximizeAlt
          className="unit-card-maximize icon-container pointable"
          style={{ marginTop: card.unit.hero ? '6px' : '1px' }}
          onClick={openFullscreen}
        />
      </div>
      <img
        src={card.unit.images[(card.artStyle || 1) - 1]}
        className={`unit-card-image ${card.unit.hero ? 'unit-card-image-hero' : ''}`}
      />
      {((card.artStyle && card.unit.images.length > 1) || card.unit.dlc) && (
        <div className="unit-card-actions-lower">
          {card.artStyle && (
            <div
              className={`unit-card-art-switcher ${card.unit.images.length > 1 ? 'icon-container' : ''}  ${
                card.artStyle < card.unit.images.length ? 'pointable' : ''
              }`}
              style={{ marginLeft: card.unit.hero ? '8px' : '0' }}
              onClick={decrementArtStyle}
            >
              {card.artStyle > 1 && <CgChevronLeft className="unit-card-art-switcher-arrow" size="1.5em" />}
            </div>
          )}
          {card.unit.dlc && (
            <div
              className="unit-card-dlc"
              title={card.unit.dlc.name}
              style={{
                backgroundImage: `url(${card.unit.dlc.image})`,
                marginBottom: card.unit.images.length > 1 ? '-1px' : '-3px',
              }}
            ></div>
          )}
          {card.artStyle && (
            <div
              className={`unit-card-art-switcher ${card.unit.images.length > 1 ? 'icon-container' : ''}  ${
                card.artStyle < card.unit.images.length ? 'pointable' : ''
              }`}
              onClick={incrementArtStyle}
            >
              {card.artStyle < card.unit.images.length && (
                <CgChevronRight className="unit-card-art-switcher-arrow" size="1.5em" />
              )}
            </div>
          )}
        </div>
      )}
      <span className={HTML_CLASSES.UnitCardName} onClick={nameSelect}>
        {card.unit.name}
      </span>
    </div>
  )
}

interface UnitCardProps {
  card: DeckCard
  key: string
  setSelectedCards: Dispatch<SetStateAction<DeckCard[]>>
  setCards: Dispatch<SetStateAction<DeckCard[]>>
  setFullCard: Dispatch<SetStateAction<DeckCard | undefined>>
  disabled: boolean
}
