import { Dispatch, SetStateAction } from 'react'

import {
  Combat,
  GameFragment,
  GamePlayerFragment,
  GamePlayerFragmentDoc,
  PlayerRoundFragmentDoc,
  UnitFragmentDoc,
  useFragment,
  WeatherUnitFragmentDoc,
} from '@gwent/graphql-schema/apollo-typings'
import { FullUnitCards, GameDeckCardType, PlayUnitProps, UnitForPlayer } from './GameProps'
import GameCombatRow from './GameCombatRow'
import { HTML_CLASSES } from '@gwent/constants'
import { useUserContext } from '../../UserContext'

/**
 * The active battlefield of a Game.
 */
export default function GameBattlefield({
  cardSelected,
  deckCardsViewing,
  fullUnits,
  game,
  opponent,
  playUnitProps,
  selectedCardInHand,
  selectedCardInDiscard,
  selectedCardInUndrawn,
  scrollHistoryIntoView,
  self,
  setCardSelected,
  setFullUnits,
  setDeckCardsViewing,
}: {
  cardSelected: UnitForPlayer | undefined
  deckCardsViewing: GameDeckCardType
  fullUnits: FullUnitCards | undefined
  game: GameFragment
  opponent: GamePlayerFragment
  playUnitProps: PlayUnitProps
  selectedCardInHand: boolean
  selectedCardInUndrawn: boolean
  selectedCardInDiscard: boolean
  scrollHistoryIntoView: (selected: UnitForPlayer) => void
  self: GamePlayerFragment
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setDeckCardsViewing: Dispatch<SetStateAction<GameDeckCardType>>
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
  const weatherClose = useFragment(GamePlayerFragmentDoc, game.players).some((player) =>
    useFragment(PlayerRoundFragmentDoc, player.rounds[game.round - 1]).weathers.some((weather) =>
      useFragment(UnitFragmentDoc, useFragment(WeatherUnitFragmentDoc, weather).unit).combats?.includes(Combat.Close)
    )
  )
  const weatherRanged = useFragment(GamePlayerFragmentDoc, game.players).some((player) =>
    useFragment(PlayerRoundFragmentDoc, player.rounds[game.round - 1]).weathers.some((weather) =>
      useFragment(UnitFragmentDoc, useFragment(WeatherUnitFragmentDoc, weather).unit).combats?.includes(Combat.Ranged)
    )
  )
  const weatherSiege = useFragment(GamePlayerFragmentDoc, game.players).some((player) =>
    useFragment(PlayerRoundFragmentDoc, player.rounds[game.round - 1]).weathers.some((weather) =>
      useFragment(UnitFragmentDoc, useFragment(WeatherUnitFragmentDoc, weather).unit).combats?.includes(Combat.Siege)
    )
  )
  const sharedProps = {
    cardSelected,
    deckCardsViewing,
    playUnitProps,
    fullUnits,
    checkAuth,
    game,
    isTurn,
    selectedCardInHand,
    selectedCardInDiscard,
    selectedCardInUndrawn,
    setCardSelected,
    setFullUnits,
    scrollHistoryIntoView,
    setDeckCardsViewing,
  }

  return (
    <>
      <div
        className={`${HTML_CLASSES.GameUnitBoardSide} ${
          opponentPassed ? HTML_CLASSES.GameUnitBoardSidePassed : ''
        } game-section`}
        title={opponentPassed ? 'Your oppponent has passed the rest of this round' : undefined}
      >
        <GameCombatRow {...sharedProps} player={opponent} combat={Combat.Siege} weather={weatherSiege} />
        <GameCombatRow {...sharedProps} player={opponent} combat={Combat.Ranged} weather={weatherRanged} />
        <GameCombatRow {...sharedProps} player={opponent} combat={Combat.Close} weather={weatherClose} />
      </div>
      <div
        className={`${HTML_CLASSES.GameUnitBoardSide} ${
          selfPassed ? HTML_CLASSES.GameUnitBoardSidePassed : ''
        } game-section`}
        title={selfPassed ? 'You have passed the rest of this round' : undefined}
      >
        <GameCombatRow {...sharedProps} player={self} isSelf={true} combat={Combat.Close} weather={weatherClose} />
        <GameCombatRow {...sharedProps} player={self} isSelf={true} combat={Combat.Ranged} weather={weatherRanged} />
        <GameCombatRow {...sharedProps} player={self} isSelf={true} combat={Combat.Siege} weather={weatherSiege} />
      </div>
    </>
  )
}
