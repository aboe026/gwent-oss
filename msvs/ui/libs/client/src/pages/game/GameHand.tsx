import { Dispatch, SetStateAction } from 'react'

import {
  UnitFragmentDoc,
  DeckUnitFragment,
  DeckUnitFragmentDoc,
  GameDeckFragment,
  GameDeckFragmentDoc,
  GamePlayerFragment,
  GameStatus,
  FragmentType,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import Centered from '../../components/Centered'
import { FullUnitCards, UnitForPlayer } from './GameProps'
import getRedrawUnitIds from '../../util/get-redraw-ids'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import { sortObjectArray } from '@gwent/utils'
import UnitGameCard from '../../components/UnitGameCard'

/**
 * The Users hand of unit cards for the Game.
 */
export default function GameHand({
  gameStatus,
  gameDeckFragment,
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
  gameDeckFragment: FragmentType<typeof GameDeckFragmentDoc> | null | undefined
  handCardSelected: DeckUnitFragment | undefined
  isTurn: boolean
  playUnitLoading: boolean
  redrawCardSelected: DeckUnitFragment | undefined
  redrawsLeft: number
  self: GamePlayerFragment
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnitFragment | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setRedrawCardSelected: Dispatch<SetStateAction<DeckUnitFragment | undefined>>
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
              gameDeck={gameDeck}
              deckUnit={deckUnit}
              handCardSelected={handCardSelected}
              redrawCardSelected={redrawCardSelected}
              gameStatus={gameStatus}
              playUnitLoading={playUnitLoading}
              redrawsLeft={redrawsLeft}
              isTurn={isTurn}
              key={index}
              index={index}
              self={self}
              setFullUnits={setFullUnits}
              setHandCardSelected={setHandCardSelected}
              setHistoryCardSelected={setHistoryCardSelected}
              setRedrawCardSelected={setRedrawCardSelected}
              sortedUnits={sortedUnits}
            />
          ))
        )}
      </div>
    </div>
  )
}

function GameHandUnit({
  deckUnit,
  gameDeck,
  gameStatus,
  handCardSelected,
  isTurn,
  index,
  playUnitLoading,
  redrawCardSelected,
  redrawsLeft,
  self,
  setFullUnits,
  setHandCardSelected,
  setHistoryCardSelected,
  setRedrawCardSelected,
  sortedUnits,
}: {
  deckUnit: DeckUnitFragment
  gameDeck: GameDeckFragment | null | undefined
  gameStatus: GameStatus
  handCardSelected: DeckUnitFragment | undefined
  isTurn: boolean
  index: number
  playUnitLoading: boolean
  redrawCardSelected: DeckUnitFragment | undefined
  redrawsLeft: number
  self: GamePlayerFragment
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnitFragment | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setRedrawCardSelected: Dispatch<SetStateAction<DeckUnitFragment | undefined>>
  sortedUnits: DeckUnitFragment[]
}) {
  const unit = useFragment(UnitFragmentDoc, deckUnit.unit)
  const handCardSelectedUnit = useFragment(UnitFragmentDoc, handCardSelected?.unit)
  const redrawCardSelectedUnit = useFragment(UnitFragmentDoc, redrawCardSelected?.unit)
  const selected = [handCardSelectedUnit?.id, redrawCardSelectedUnit?.id].includes(unit.id)
  const notSelected = handCardSelectedUnit?.id && !selected
  const title = unit.name
  let dottedTitle = ''
  let cursor = 'pointer'
  const noMoreRedraws = gameStatus === GameStatus.Redrawing && redrawsLeft === 0 && !redrawCardSelectedUnit?.id
  if (playUnitLoading && handCardSelectedUnit) {
    if (handCardSelectedUnit?.id === unit.id) {
      dottedTitle = `Waiting for ${handCardSelectedUnit.name} to be deployed to the battlefield`
    } else {
      dottedTitle = `Cannot select other units while waiting for ${handCardSelectedUnit.name} to be deployed`
      cursor = 'not-allowed'
    }
  } else if (selected && noMoreRedraws) {
    dottedTitle = 'No more redraws left'
  }
  const dotted = (gameStatus === GameStatus.Playing && !isTurn) || noMoreRedraws
  const redrawUnitIds = getRedrawUnitIds({
    gameDeck,
  })

  return (
    <div
      className={`${HTML_CLASSES.GameHandCardWrapper} ${selected ? 'game-hand-card-wrapper-selected' : ''}`}
      key={unit.id}
      onClick={() => {
        if (!playUnitLoading) {
          setHandCardSelected(selected ? undefined : deckUnit)
          if (redrawUnitIds.includes(unit.id)) {
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
                unitFragment: deckUnit,
              }
            }),
          })
          setHandCardSelected(deckUnit)
          if (redrawUnitIds.includes(unit.id)) {
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
}
