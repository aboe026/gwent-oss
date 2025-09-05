import { Dispatch, SetStateAction } from 'react'

import {
  CardUnitFragmentFragmentDoc,
  Combat,
  DeckUnitFragmentFragment,
  Game,
  GamePlayer,
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
  fullUnits,
  game,
  handCardSelected,
  historyCardSelected,
  opponent,
  playUnitProps,
  scrollHistoryIntoView,
  self,
  setFullUnits,
  setHandCardSelected,
  setHistoryCardSelected,
}: {
  fullUnits: FullUnitCards | undefined
  game: Game
  handCardSelected: DeckUnitFragmentFragment | undefined
  historyCardSelected: UnitForPlayer | undefined
  opponent: GamePlayer
  playUnitProps: PlayUnitProps
  scrollHistoryIntoView: (args: UnitForPlayer) => void
  self: GamePlayer
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnitFragmentFragment | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
}) {
  const { checkAuth } = useUserContext()
  const handCardSelectedUnit = useFragment(CardUnitFragmentFragmentDoc, handCardSelected?.unit)
  const rowsToHighlight = (handCardSelectedUnit && handCardSelectedUnit.combats) || []
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
  const selfPassed = self.rounds[game.round - 1].passed
  const opponentPassed = opponent.rounds[game.round - 1].passed
  const sharedProps = {
    handCardSelectedUnit,
    playUnitProps,
    fullUnits,
    checkAuth,
    game,
    isTurn,
    setFullUnits,
    setHandCardSelected,
    historyCardSelected,
    setHistoryCardSelected,
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
