import { Dispatch, SetStateAction } from 'react'

import Centered from '../../components/Centered'
import {
  DeckUnitFragment,
  DeckUnitFragmentDoc,
  GameDeckFragmentDoc,
  GamePlayerFragment,
  GameStatus,
  FragmentType,
  UnitFragmentDoc,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import { FullUnitCards, UnitForPlayer } from './GameProps'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import { sortObjectArray } from '@gwent/utils'
import UnitGameCard from '../../components/UnitGameCard'

/**
 * The Users hand of unit cards for the Game.
 */
export default function GameHand({
  cardSelected,
  gameStatus,
  gameDeckFragment,
  isTurn,
  playUnitLoading,
  redrawsLeft,
  selectedCardInHand,
  self,
  setCardSelected,
  setFullUnits,
}: {
  cardSelected: UnitForPlayer | undefined
  gameStatus: GameStatus
  gameDeckFragment: FragmentType<typeof GameDeckFragmentDoc> | null | undefined
  isTurn: boolean
  playUnitLoading: boolean
  redrawsLeft: number
  selectedCardInHand: boolean
  self: GamePlayerFragment
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
}) {
  const gameDeck = useFragment(GameDeckFragmentDoc, gameDeckFragment)
  const hand = useFragment(DeckUnitFragmentDoc, gameDeck?.hand)
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
          sortedUnits.map((deckUnit, index) => (
            <GameHandUnit
              cardSelected={cardSelected}
              deckUnit={deckUnit}
              gameStatus={gameStatus}
              playUnitLoading={playUnitLoading}
              redrawsLeft={redrawsLeft}
              isTurn={isTurn}
              key={index}
              index={index}
              selectedCardInHand={selectedCardInHand}
              self={self}
              setCardSelected={setCardSelected}
              setFullUnits={setFullUnits}
              sortedUnits={sortedUnits}
            />
          ))
        )}
      </div>
    </div>
  )
}

/**
 * A unit in a players game hand.
 */
function GameHandUnit({
  cardSelected,
  deckUnit,
  gameStatus,
  isTurn,
  index,
  playUnitLoading,
  redrawsLeft,
  selectedCardInHand,
  self,
  setCardSelected,
  setFullUnits,
  sortedUnits,
}: {
  cardSelected: UnitForPlayer | undefined
  deckUnit: DeckUnitFragment
  gameStatus: GameStatus
  isTurn: boolean
  index: number
  playUnitLoading: boolean
  redrawsLeft: number
  selectedCardInHand: boolean
  self: GamePlayerFragment
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  sortedUnits: DeckUnitFragment[]
}) {
  const unit = useFragment(UnitFragmentDoc, deckUnit.unit)
  const cardSelectedUnit = useFragment(UnitFragmentDoc, cardSelected?.unitFragment.unit)
  const selected = cardSelectedUnit?.id === unit.id && cardSelected?.playerName === self.user.name
  const notSelected = cardSelectedUnit?.id && !selected && selectedCardInHand
  const title = unit.name
  let dottedTitle = ''
  let cursor = 'pointer'
  const noMoreRedraws = gameStatus === GameStatus.Redrawing && redrawsLeft === 0
  if (playUnitLoading && cardSelectedUnit) {
    if (cardSelectedUnit?.id === unit.id) {
      dottedTitle = `Waiting for ${cardSelectedUnit.name} to be deployed to the battlefield`
    } else {
      dottedTitle = `Cannot select other units while waiting for ${cardSelectedUnit.name} to be deployed`
      cursor = 'not-allowed'
    }
  } else if (selected && noMoreRedraws) {
    dottedTitle = 'No more redraws left'
  }
  const dotted = (gameStatus === GameStatus.Playing && !isTurn) || noMoreRedraws

  return (
    <div
      className={`${HTML_CLASSES.GameHandCardWrapper} ${selected ? 'game-hand-card-wrapper-selected' : ''}`}
      key={unit.id}
      onClick={() => {
        if (!playUnitLoading) {
          setCardSelected(
            selected
              ? undefined
              : {
                  unitFragment: deckUnit,
                  playerName: self.user.name,
                }
          )
        }
      }}
    >
      <UnitGameCard
        cursor={cursor}
        gameUnit={deckUnit}
        selected={selected}
        dotted={dotted}
        dottedTitle={dottedTitle}
        title={title}
        onFullscreen={() => {
          setFullUnits({
            currentIndex: index,
            units: sortedUnits.map((deckUnit) => {
              return {
                playerName: self.user.name,
                unitFragment: deckUnit,
              }
            }),
          })
          setCardSelected({
            unitFragment: deckUnit,
            playerName: self.user.name,
          })
        }}
      />
      {notSelected && <div title={title} className={HTML_CLASSES.GameHandCardWrapperNotSelected}></div>}
    </div>
  )
}
