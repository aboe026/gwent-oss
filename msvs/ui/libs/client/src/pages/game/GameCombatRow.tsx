import { Dispatch, SetStateAction } from 'react'

import {
  CardUnitFragmentDoc,
  CardUnitFragment,
  Combat,
  DeckUnitFragment,
  useFragment,
  GamePlayerFragment,
  PlayerRoundFragmentDoc,
  PlayerCombatRowFragmentDoc,
  GameUnitFragment,
  GameUnitFragmentDoc,
  GameFragment,
} from '@gwent/graphql-schema/apollo-typings'
import { FullUnitCards, PlayUnitProps, UnitForPlayer } from './GameProps'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import { retryCheckingAuth } from '../../util/error-util'
import { sortObjectArray, toTitleCase } from '@gwent/utils'
import UnitGameCard from '../../components/UnitGameCard'
import { useUserContext } from '../../UserContext'
import { FragmentType } from '@apollo/client'

/**
 * A row of combat for a Game player and the units that make up that row.
 */
export default function GameCombatRow({
  combat,
  fullUnits,
  game,
  handCardSelectedUnit,
  historyCardSelected,
  isSelf,
  isTurn,
  player,
  playUnitProps,
  scrollHistoryIntoView,
  setFullUnits,
  setHandCardSelected,
  setHistoryCardSelected,
}: {
  combat: Combat
  fullUnits: FullUnitCards | undefined
  game: GameFragment
  handCardSelectedUnit: CardUnitFragment | undefined
  historyCardSelected: UnitForPlayer | undefined
  isSelf?: boolean
  isTurn?: boolean
  player: GamePlayerFragment
  playUnitProps: PlayUnitProps
  scrollHistoryIntoView: (args: UnitForPlayer) => void
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnitFragment | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
}) {
  const { checkAuth } = useUserContext()
  const titledCombat = toTitleCase(combat)
  const scorchSelected = handCardSelectedUnit && handCardSelectedUnit.name === 'Scorch'
  const validRow =
    isSelf &&
    handCardSelectedUnit &&
    handCardSelectedUnit.combats &&
    handCardSelectedUnit.combats.includes(combat) &&
    !scorchSelected
  const invalidRow =
    handCardSelectedUnit &&
    handCardSelectedUnit.combats &&
    !handCardSelectedUnit.combats.includes(combat) &&
    !scorchSelected
  let description = scorchSelected ? '' : `${titledCombat} combat row`
  if (handCardSelectedUnit && !scorchSelected) {
    if (isSelf) {
      if (validRow) {
        if (isTurn) {
          description = `Place here for ${handCardSelectedUnit.name} to fight in ${titledCombat} combat`
        } else {
          description = 'It is not your turn to play'
        }
      } else if (invalidRow) {
        description = `${handCardSelectedUnit.name} is not eligible to fight in ${titledCombat} combat`
      }
    } else {
      description = `${handCardSelectedUnit.name} cannot fight for your opponent`
    }
  }
  const playerRound = useFragment(PlayerRoundFragmentDoc, player.rounds[game.round - 1])
  const playerRow = useFragment(
    PlayerCombatRowFragmentDoc,
    combat === Combat.Close ? playerRound.close : combat === Combat.Ranged ? playerRound.ranged : playerRound.siege
  )
  const sortedUnits = sortObjectArray({
    array: playerRow.units,
    sortProperties: [['effectiveStrength', 'unit.strength'], 'unit.name', 'unit.id'],
  })
  let id = ''
  if (combat === Combat.Close) {
    id = isSelf ? HTML_IDS.GameCombatRowCloseSelf : HTML_IDS.GameCombatRowCloseOpponent
  } else if (combat === Combat.Ranged) {
    id = isSelf ? HTML_IDS.GameCombatRowRangedSelf : HTML_IDS.GameCombatRowRangedOpponent
  } else {
    id = isSelf ? HTML_IDS.GameCombatRowSiegeSelf : HTML_IDS.GameCombatRowSiegeOpponent
  }
  const fullUnitFragment = fullUnits && fullUnits.units[fullUnits.currentIndex]
  const fullUnit = useFragment(CardUnitFragmentDoc, fullUnitFragment?.unitFragment.unit)

  return (
    <div id={id} className="game-unit-board-combat-row">
      <div className="game-unit-board-combat-icon-score">
        <img
          className="game-unit-combat-row-icon"
          src={`images/combats/${combat.toLocaleLowerCase()}.png`}
          title={titledCombat}
        />
        <div className={HTML_CLASSES.GameUnitBoardCombatScore}>{playerRow.score}</div>
      </div>
      <div
        className={`game-sub-section ${HTML_CLASSES.GameCombatRowCards} ${
          validRow ? `${HTML_CLASSES.ItemHighlighted} game-unit-combat-row-valid` : ''
        } ${!isTurn || invalidRow ? 'game-unit-combat-row-invalid' : ''}`}
        style={{
          cursor: (validRow || scorchSelected) && isTurn ? 'pointer' : handCardSelectedUnit ? 'not-allowed' : 'default',
          borderStyle: validRow ? (isTurn ? 'solid' : 'dotted') : 'none',
        }}
        title={description}
        onClick={async () => {
          if (isSelf && isTurn && handCardSelectedUnit && validRow) {
            await retryCheckingAuth({
              checkAuth,
              method: async () => {
                await playUnitProps.playUnit({
                  variables: {
                    game: game.id,
                    combat: combat,
                    unit: handCardSelectedUnit.id,
                  },
                })
                setHandCardSelected(undefined)
              },
            })
          }
        }}
      >
        {sortedUnits.map((gameUnitFragment, index) => (
          <GameRowUnit
            combat={combat}
            fullUnit={fullUnit}
            fullUnitFragment={fullUnitFragment}
            gameUnitFragment={gameUnitFragment}
            handCardSelectedUnit={handCardSelectedUnit}
            historyCardSelected={historyCardSelected}
            index={index}
            player={player}
            scrollHistoryIntoView={scrollHistoryIntoView}
            setFullUnits={setFullUnits}
            setHandCardSelected={setHandCardSelected}
            setHistoryCardSelected={setHistoryCardSelected}
            sortedUnits={sortedUnits}
            isTurn={isTurn}
            key={index}
          />
        ))}
      </div>
    </div>
  )
}

function GameRowUnit({
  fullUnit,
  fullUnitFragment,
  gameUnitFragment,
  combat,
  handCardSelectedUnit,
  historyCardSelected,
  player,
  scrollHistoryIntoView,
  setFullUnits,
  setHandCardSelected,
  setHistoryCardSelected,
  isTurn,
  index,
  sortedUnits,
}: {
  fullUnit: CardUnitFragment | undefined
  fullUnitFragment: UnitForPlayer | undefined
  combat: Combat
  handCardSelectedUnit: CardUnitFragment | undefined
  historyCardSelected: UnitForPlayer | undefined
  isTurn?: boolean
  player: GamePlayerFragment
  scrollHistoryIntoView: (args: UnitForPlayer) => void
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnitFragment | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  gameUnitFragment: FragmentType<GameUnitFragment>
  index: number
  sortedUnits: FragmentType<GameUnitFragment>[]
}) {
  const gameUnit = useFragment(GameUnitFragmentDoc, gameUnitFragment)
  const unit = useFragment(CardUnitFragmentDoc, gameUnit.unit)
  const historyCardSelectedUnit = useFragment(CardUnitFragmentDoc, historyCardSelected?.unitFragment.unit)
  const selectedAsFullCard =
    fullUnitFragment && fullUnit && fullUnit.id === unit.id && fullUnitFragment.playerId === player.user.id
  const selectedInHistory =
    historyCardSelected &&
    historyCardSelectedUnit &&
    historyCardSelectedUnit.id === unit.id &&
    historyCardSelected.playerId === player.user.id
  const unitForPlayer: UnitForPlayer = {
    playerId: player.user.id,
    unitFragment: gameUnit,
  }

  return (
    <div
      className="game-combat-card-wrapper"
      key={unit.id}
      onClick={() => {
        const cardBeingPlayed =
          isTurn &&
          handCardSelectedUnit &&
          (!handCardSelectedUnit.combats || handCardSelectedUnit.combats.includes(combat))
        if (!cardBeingPlayed) {
          if (selectedInHistory) {
            setHistoryCardSelected(undefined)
          } else {
            setHistoryCardSelected(unitForPlayer)
            scrollHistoryIntoView(unitForPlayer)
          }
          setHandCardSelected(undefined)
        }
      }}
    >
      <UnitGameCard
        deckUnit={{
          artStyle: gameUnit.artStyle,
          unit: gameUnit.unit,
        }}
        effectiveStrength={gameUnit.effectiveStrength}
        selected={selectedAsFullCard || selectedInHistory}
        dotted={!isTurn && !selectedInHistory}
        onFullscreen={() => {
          setFullUnits({
            currentIndex: index,
            units: sortedUnits.map((deckUnit) => {
              return {
                playerId: player.user.id,
                unitFragment: useFragment(GameUnitFragmentDoc, deckUnit),
              }
            }),
          })
          setHistoryCardSelected(unitForPlayer)
          scrollHistoryIntoView(unitForPlayer)
          setHandCardSelected(undefined)
        }}
      />
    </div>
  )
}
