import { CgChevronLeft, CgChevronRight } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'

import { DeckCard } from '@gwent/graphql-schema/resolver-typings'
import { Key, useKeyDown } from '../util/keyboard-listener'
import WholeScreenDialog from '../components/WholeScreenDialog'
import './FullCard.css'

/**
 * A full page view of a Gwent Deck Card
 *
 * @returns The full page gwent card
 */
export default function FullCard({
  fullCard,
  setFullCard,
  filteredAvailableCards,
  filteredSelectedCards,
  selectedIds,
  setSelectedCards,
  setCards,
  disabled,
}: FullCardProps) {
  let fullCardPosition = -1
  let fullCardNext: DeckCard | undefined
  let fullCardPrevious: DeckCard | undefined
  if (fullCard) {
    if (selectedIds.includes(fullCard.unit.id)) {
      fullCardPosition = filteredSelectedCards.findIndex((card) => card.unit.id === fullCard.unit.id)
      fullCardNext = filteredSelectedCards[fullCardPosition + 1]
      fullCardPrevious = filteredSelectedCards[fullCardPosition - 1]
    } else {
      fullCardPosition = filteredAvailableCards.findIndex((card) => card.unit.id === fullCard.unit.id)
      fullCardNext = filteredAvailableCards[fullCardPosition + 1]
      fullCardPrevious = filteredAvailableCards[fullCardPosition - 1]
    }
  }
  const selectFullCard = () => {
    if (fullCard) {
      setSelectedCards((previous) =>
        previous.map((card) => card.unit.id).includes(fullCard.unit.id)
          ? previous.filter((card) => card.unit.id !== fullCard.unit.id)
          : [...previous, fullCard]
      )
    }
    if (fullCardNext) {
      setFullCard(fullCardNext)
    } else if (fullCardPrevious) {
      setFullCard(fullCardPrevious)
    } else {
      setFullCard(undefined)
    }
  }
  function changeArtStyle(change: number) {
    setCards((previous: DeckCard[]) =>
      previous.map((newCard) => {
        if (
          fullCard &&
          newCard.unit.id === fullCard.unit.id &&
          newCard.artStyle !== undefined &&
          newCard.artStyle !== null
        ) {
          newCard.artStyle = newCard.artStyle + change
        }
        return newCard
      })
    )
  }
  function incrementArtStyle() {
    if (!disabled && fullCard && fullCard.artStyle && fullCard.artStyle < fullCard.unit.images.length) {
      changeArtStyle(1)
    }
  }
  function decrementArtStyle() {
    if (!disabled && fullCard && fullCard.artStyle && fullCard.artStyle > 1) {
      changeArtStyle(-1)
    }
  }
  useKeyDown([
    {
      key: Key.Left,
      condition: () => fullCard !== undefined && fullCardPrevious !== undefined,
      onCondition: () => setFullCard(fullCardPrevious),
    },
    {
      key: Key.Left,
      ctrl: true,
      condition: () => fullCard !== undefined && fullCard.unit.images.length > 0,
      onCondition: decrementArtStyle,
    },
    {
      key: Key.Right,
      condition: () => fullCard !== undefined && fullCardNext !== undefined,
      onCondition: () => setFullCard(fullCardNext),
    },
    {
      key: Key.Right,
      ctrl: true,
      condition: () => fullCard !== undefined && fullCard.unit.images.length > 0,
      onCondition: incrementArtStyle,
    },
    {
      key: Key.Escape,
      condition: () => fullCard !== undefined,
      onCondition: () => setFullCard(undefined),
    },
    {
      key: Key.Enter,
      condition: () => fullCard !== undefined,
      onCondition: selectFullCard,
    },
  ])

  if (fullCard) {
    return (
      <WholeScreenDialog onClose={() => setFullCard(undefined)}>
        <div id="fullCardWrapper">
          <div
            className={`full-card-arrow-container ${fullCardPrevious ? 'full-card-arrow-container-selectable' : ''}`}
            onClick={() => fullCardPrevious && setFullCard(fullCardPrevious)}
          >
            {fullCardPrevious && <CgChevronLeft color="black" size="2em" />}
          </div>
          <div id="fullCardBackground">
            <div id="fullCardContainer">
              <div id="fullCardUpper">
                <img
                  id="fullCardImage"
                  src={fullCard.unit.images[(fullCard.artStyle || 1) - 1]}
                  style={{
                    marginTop: fullCard.unit.hero ? '-210px' : '-190px',
                    marginLeft: fullCard.unit.hero ? '-20px' : '0',
                    width: fullCard.unit.hero ? '390px' : '370px',
                  }}
                  onClick={selectFullCard}
                />
              </div>
              <div id="fullCardLower">
                <div id="fullCardInfo">
                  <div id="fullCardInfoUpper">
                    {fullCard.artStyle && fullCard.unit.images.length > 1 && (
                      <div
                        className={`icon-container full-card-art-switcher ${fullCard.artStyle > 1 ? 'pointable' : ''}`}
                        style={{
                          width: fullCard.unit.dlc ? '36px' : '32px',
                        }}
                        onClick={decrementArtStyle}
                      >
                        {fullCard.artStyle > 1 && (
                          <CgChevronLeft
                            className="full-card-art-switcher-arrow"
                            style={{
                              marginLeft: fullCard.unit.dlc ? '0' : '2px',
                              marginRight: fullCard.unit.dlc ? '2px' : '0',
                            }}
                            size="1.5em"
                          />
                        )}
                      </div>
                    )}
                    <div id="fullCardInfoDlcName">
                      {fullCard.unit.dlc && (
                        <div
                          className="full-card-dlc"
                          title={fullCard.unit.dlc.name}
                          style={{ backgroundImage: `url(${fullCard.unit.dlc.image})` }}
                        ></div>
                      )}
                      <span id="fullCardName" style={{ marginTop: fullCard.unit.dlc ? '0' : '10px' }}>
                        {fullCard.unit.name}
                      </span>
                    </div>
                    {fullCard.artStyle && fullCard.unit.images.length > 1 && (
                      <div
                        className={`icon-container full-card-art-switcher ${
                          fullCard.artStyle < fullCard.unit.images.length ? 'pointable' : ''
                        }`}
                        style={{
                          width: fullCard.unit.dlc ? '36px' : '32px',
                        }}
                        onClick={incrementArtStyle}
                      >
                        {fullCard.artStyle < fullCard.unit.images.length && (
                          <CgChevronRight
                            className="full-card-art-switcher-arrow"
                            style={{
                              marginLeft: fullCard.unit.dlc ? '0' : '2px',
                              marginRight: fullCard.unit.dlc ? '2px' : '0',
                            }}
                            size="1.5em"
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <span id="fullCardQuote">{fullCard.unit.quote}</span>
                  <div id="fullCardEffects">
                    {fullCard.unit.effects && (
                      <table>
                        <tbody>
                          {fullCard.unit.effects.map((effect) => (
                            <tr key={effect.key}>
                              <td className="full-card-effect-name">{effect.name}</td>
                              <td className="full-card-effect-ability">{effect.ability}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`full-card-arrow-container ${fullCardNext ? 'full-card-arrow-container-selectable' : ''}`}
            onClick={() => fullCardNext && setFullCard(fullCardNext)}
          >
            {fullCardNext && <CgChevronRight color="black" size="2em" />}
          </div>
        </div>
      </WholeScreenDialog>
    )
  }
}

interface FullCardProps {
  setFullCard: Dispatch<SetStateAction<DeckCard | undefined>>
  fullCard: DeckCard | undefined
  selectedIds: string[]
  filteredSelectedCards: DeckCard[]
  filteredAvailableCards: DeckCard[]
  setSelectedCards: Dispatch<SetStateAction<DeckCard[]>>
  setCards: Dispatch<SetStateAction<DeckCard[]>>
  disabled: boolean
}
