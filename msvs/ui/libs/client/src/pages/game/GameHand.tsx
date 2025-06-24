import { Dispatch, SetStateAction } from 'react'

import Centered from '../../components/Centered'
import { DeckUnit, GameDeck, GamePlayer, GameStatus } from '@gwent/graphql-schema/apollo-typings'
import { FullUnitCards, UnitForPlayer } from './GameProps'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import { sortObjectArray } from '@gwent/utils'
import UnitGameCard from '../../components/UnitGameCard'

export default function GameHand({
  gameStatus,
  gameDeck,
  handCardSelected,
  isTurn,
  playUnitLoading,
  redrawCardSelected,
  redrawsLeft,
  self,
  setFullUnits,
  setHandCardSelected,
  setHistoryCardSelected,
  setRedrawCardSelected,
}: {
  gameStatus: GameStatus
  gameDeck: GameDeck | undefined
  handCardSelected: DeckUnit | undefined
  isTurn: boolean
  playUnitLoading: boolean
  redrawCardSelected: DeckUnit | undefined
  redrawsLeft: number
  self: GamePlayer
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setRedrawCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
}) {
  const sortedUnits = !gameDeck?.hand
    ? []
    : sortObjectArray({
        sortProperties: ['unit.strength', 'unit.name', 'unit.id'],
        array: gameDeck?.hand,
      })
  return (
    <div id="gameHandContainer">
      <div id={HTML_IDS.GameHand} className="game-section">
        {!gameDeck?.hand && !isTurn ? (
          <Centered>
            <img src="images/stats/units.png" title="Hand" className={HTML_CLASSES.GameHandIcon} />
          </Centered>
        ) : (!gameDeck?.hand || gameDeck?.hand.length === 0) && isTurn ? (
          <Centered>
            <span id={HTML_IDS.gameHandNoUnitsLeft}>
              You have no units left in your hand. Either activate your Leader ability or Pass.
            </span>
          </Centered>
        ) : (
          sortedUnits.map((deckUnit, index) => {
            const selected = [handCardSelected?.unit.id, redrawCardSelected?.unit.id].includes(deckUnit.unit.id)
            const notSelected = handCardSelected?.unit.id && !selected
            const title = deckUnit.unit.name
            let dottedTitle = ''
            let cursor = 'pointer'
            const noMoreRedraws =
              gameStatus === GameStatus.Redrawing && redrawsLeft === 0 && !redrawCardSelected?.unit.id
            if (playUnitLoading && handCardSelected) {
              if (handCardSelected.unit.id === deckUnit.unit.id) {
                dottedTitle = `Waiting for ${handCardSelected.unit.name} to be deployed to the battlefield`
              } else {
                dottedTitle = `Cannot select other units while waiting for ${handCardSelected.unit.name} to be deployed`
                cursor = 'not-allowed'
              }
            } else if (selected && noMoreRedraws) {
              dottedTitle = 'No more redraws left'
            }
            const dotted = (gameStatus === GameStatus.Playing && !isTurn) || noMoreRedraws

            return (
              <div
                className={`${HTML_CLASSES.GameHandCardWrapper} ${selected ? 'game-hand-card-wrapper-selected' : ''}`}
                key={deckUnit.unit.id}
                onClick={() => {
                  if (!playUnitLoading) {
                    setHandCardSelected(selected ? undefined : deckUnit)
                    if (
                      gameDeck?.redraws.some(
                        (redraw) => redraw.from.unit.id === deckUnit.unit.id || redraw.to.unit.id === deckUnit.unit.id
                      )
                    ) {
                      setRedrawCardSelected(selected ? undefined : deckUnit)
                    } else {
                      setRedrawCardSelected(undefined)
                    }
                    setHistoryCardSelected(undefined)
                  }
                }}
              >
                <UnitGameCard
                  cursor={cursor}
                  deckUnit={deckUnit}
                  selected={selected}
                  dotted={dotted}
                  dottedTitle={dottedTitle}
                  title={title}
                  onFullscreen={() => {
                    setFullUnits({
                      currentIndex: index,
                      units: sortedUnits.map((deckUnit) => {
                        return {
                          playerId: self.user.id,
                          unit: deckUnit,
                        }
                      }),
                    })
                    setHandCardSelected(deckUnit)
                    if (
                      gameDeck?.redraws.some(
                        (redraw) => redraw.from.unit.id === deckUnit.unit.id || redraw.to.unit.id === deckUnit.unit.id
                      )
                    ) {
                      setRedrawCardSelected(selected ? undefined : deckUnit)
                    } else {
                      setRedrawCardSelected(undefined)
                    }
                    setHistoryCardSelected(undefined)
                  }}
                />
                {notSelected && <div title={title} className={HTML_CLASSES.GameHandCardWrapperNotSelected}></div>}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
