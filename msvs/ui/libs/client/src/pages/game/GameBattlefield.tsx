import { Dispatch, SetStateAction } from 'react'

import {
  Combat,
  GameFragment,
  GamePlayerFragment,
  PlayerRoundFragmentDoc,
  UnitFragmentDoc,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import { FullUnitCards, PlayUnitProps, UnitForPlayer } from './GameProps'
import GameCombatRow from './GameCombatRow'
import { HTML_CLASSES } from '@gwent/constants'
import { useUserContext } from '../../UserContext'

/**
 * The active battlefield of a Game.
 */
export default function GameBattlefield({
  cardSelected,
  fullUnits,
  game,
  opponent,
  playUnitProps,
  selectedCardInHand,
  scrollHistoryIntoView,
  self,
  setCardSelected,
  setFullUnits,
}: {
  cardSelected: UnitForPlayer | undefined
  fullUnits: FullUnitCards | undefined
  game: GameFragment
  opponent: GamePlayerFragment
  playUnitProps: PlayUnitProps
  selectedCardInHand: boolean
  scrollHistoryIntoView: (selected: UnitForPlayer) => void
  self: GamePlayerFragment
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
}) {
  const { checkAuth } = useUserContext()
  const cardSelectedUnit = useFragment(UnitFragmentDoc, cardSelected?.unitFragment.unit)
  const rowsToHighlight = (cardSelectedUnit && cardSelectedUnit.combats) || []
  const rowsToBlock = []
  if (rowsToHighlight.length > 0) {
    if (!rowsToHighlight.includes(Combat.Close)) {
      rowsToBlock.push(Combat.Close)
    }
    if (!rowsToHighlight.includes(Combat.Ranged)) {
      rowsToBlock.push(Combat.Ranged)
    }
    if (!rowsToHighlight.includes(Combat.Siege)) {
      rowsToBlock.push(Combat.Siege)
    }
  }
  const isTurn = game.turn?.user.name === self.user.name
  const selfPassed = useFragment(PlayerRoundFragmentDoc, self.rounds[game.round - 1]).passed
  const opponentPassed = useFragment(PlayerRoundFragmentDoc, opponent.rounds[game.round - 1]).passed
  const sharedProps = {
    cardSelected,
    playUnitProps,
    fullUnits,
    checkAuth,
    game,
    isTurn,
    selectedCardInHand,
    setCardSelected,
    setFullUnits,
    scrollHistoryIntoView,
  }
  return (
    <>
      <div
        className={`${HTML_CLASSES.GameUnitBoardSide} ${
          opponentPassed ? HTML_CLASSES.GameUnitBoardSidePassed : ''
        } game-section`}
        title={opponentPassed ? 'Your oppponent has passed the rest of this round' : ''}
      >
        <GameCombatRow {...sharedProps} player={opponent} combat={Combat.Siege} />
        <GameCombatRow {...sharedProps} player={opponent} combat={Combat.Ranged} />
        <GameCombatRow {...sharedProps} player={opponent} combat={Combat.Close} />
      </div>
      <div
        className={`${HTML_CLASSES.GameUnitBoardSide} ${
          selfPassed ? HTML_CLASSES.GameUnitBoardSidePassed : ''
        } game-section`}
        title={selfPassed ? 'You have passed the rest of this round' : ''}
      >
        <GameCombatRow {...sharedProps} player={self} isSelf={true} combat={Combat.Close} />
        <GameCombatRow {...sharedProps} player={self} isSelf={true} combat={Combat.Ranged} />
        <GameCombatRow {...sharedProps} player={self} isSelf={true} combat={Combat.Siege} />
      </div>
    </>
  )
}
