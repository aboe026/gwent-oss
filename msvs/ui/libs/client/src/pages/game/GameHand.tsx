import { Dispatch, SetStateAction } from 'react'

import Centered from '../../components/Centered'
import { DeckUnit, GamePlayer, GameStatus } from '@gwent/graphql-schema/apollo-typings'
import { FullUnitCards, UnitForPlayer } from './GameProps'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import { sortObjectArray } from '@gwent/utils'
import UnitGameCard from '../../components/UnitGameCard'

export default function GameHand({
  gameStatus,
  hand,
  handCardSelected,
  isTurn,
  playUnitLoading,
  self,
  setFullUnits,
  setHandCardSelected,
  setHistoryCardSelected,
}: {
  gameStatus: GameStatus
  hand: DeckUnit[] | undefined
  handCardSelected: DeckUnit | undefined
  isTurn: boolean
  playUnitLoading: boolean
  self: GamePlayer
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
}) {
  const sortedUnits = !hand
    ? []
    : sortObjectArray({
        sortProperties: ['unit.strength', 'unit.name', 'unit.id'],
        array: hand,
      })
  return (
    <div id="gameHandContainer">
      <div id={HTML_IDS.GameHand} className="game-section">
        {!hand && !isTurn ? (
          <Centered>
            <img src="images/stats/units.png" title="Hand" className={HTML_CLASSES.GameHandIcon} />
          </Centered>
        ) : (!hand || hand.length === 0) && isTurn ? (
          <Centered>
            <span id={HTML_IDS.gameHandNoUnitsLeft}>
              You have no units left in your hand. Either activate your Leader ability or Pass.
            </span>
          </Centered>
        ) : (
          sortedUnits.map((deckUnit, index) => {
            const selected = deckUnit.unit.id === handCardSelected?.unit.id
            const notSelected = handCardSelected?.unit.id && !selected
            let title = deckUnit.unit.name
            let cursor = 'pointer'
            if (playUnitLoading && handCardSelected) {
              if (handCardSelected.unit.id === deckUnit.unit.id) {
                title = `Waiting for ${handCardSelected.unit.name} to be deployed to the battlefield`
              } else {
                title = `Cannot select other units while waiting for ${handCardSelected.unit.name} to be deployed`
                cursor = 'not-allowed'
              }
            }

            return (
              <div
                className={`${HTML_CLASSES.GameHandCardWrapper} ${selected ? 'game-hand-card-wrapper-selected' : ''}`}
                key={deckUnit.unit.id}
                onClick={() => {
                  if (!playUnitLoading) {
                    setHandCardSelected(selected ? undefined : deckUnit)
                    setHistoryCardSelected(undefined)
                  }
                }}
              >
                <UnitGameCard
                  cursor={cursor}
                  deckUnit={deckUnit}
                  selected={deckUnit.unit.id === handCardSelected?.unit.id}
                  dotted={gameStatus === GameStatus.Playing && !isTurn}
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
