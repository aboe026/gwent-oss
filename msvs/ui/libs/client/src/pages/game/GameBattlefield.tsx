import { Dispatch, SetStateAction } from 'react'

import { DeckUnit, GamePlayer, Game, Combat } from '@gwent/graphql-schema/apollo-typings'
import GameCombatRow from './GameCombatRow'
import { HTML_CLASSES } from '@gwent/constants'
import { PlayUnitProps, UnitForPlayer } from './GameProps'
import { useUserContext } from '../../App'

export default function GameBattlefield({
  game,
  handCardSelected,
  historyCardSelected,
  opponent,
  playUnitProps,
  scrollHistoryIntoView,
  self,
  setFullUnit,
  setHandCardSelected,
  setHistoryCardSelected,
}: {
  game: Game
  handCardSelected: DeckUnit | undefined
  historyCardSelected: UnitForPlayer | undefined
  opponent: GamePlayer
  playUnitProps: PlayUnitProps
  scrollHistoryIntoView: (args: UnitForPlayer) => void
  self: GamePlayer
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
}) {
  const { checkAuth } = useUserContext()
  const rowsToHighlight = (handCardSelected && handCardSelected.unit.combats) || []
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
    handCardSelected,
    playUnitProps,
    checkAuth,
    game,
    isTurn,
    setFullUnit,
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
