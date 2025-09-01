import { Dispatch, SetStateAction } from 'react'

import { DeckUnit, GamePlayer, Game, Combat } from '@gwent/graphql-schema/apollo-typings'
import { FullUnitCards, PlayUnitProps, UnitForPlayer } from './GameProps'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import { retryCheckingAuth } from '../../util/error-util'
import { sortObjectArray, toTitleCase } from '@gwent/utils'
import UnitGameCard from '../../components/UnitGameCard'
import { useUserContext } from '../../UserContext'

/**
 * A row of combat for a Game player and the units that make up that row.
 */
export default function GameCombatRow({
  combat,
  fullUnits,
  game,
  handCardSelected,
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
  game: Game
  handCardSelected: DeckUnit | undefined
  historyCardSelected: UnitForPlayer | undefined
  isSelf?: boolean
  isTurn?: boolean
  player: GamePlayer
  playUnitProps: PlayUnitProps
  scrollHistoryIntoView: (args: UnitForPlayer) => void
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
}) {
  const { checkAuth } = useUserContext()
  const titledCombat = toTitleCase(combat)
  const scorchSelected = handCardSelected && handCardSelected.unit.name === 'Scorch'
  const validRow =
    isSelf &&
    handCardSelected &&
    handCardSelected.unit.combats &&
    handCardSelected.unit.combats.includes(combat) &&
    !scorchSelected
  const invalidRow =
    handCardSelected &&
    handCardSelected.unit.combats &&
    !handCardSelected.unit.combats.includes(combat) &&
    !scorchSelected
  let description = scorchSelected ? '' : `${titledCombat} combat row`
  if (handCardSelected && !scorchSelected) {
    if (isSelf) {
      if (validRow) {
        if (isTurn) {
          description = `Place here for ${handCardSelected.unit.name} to fight as a ${titledCombat} unit`
        } else {
          description = 'It is not your turn to play'
        }
      } else if (invalidRow) {
        description = `${handCardSelected.unit.name} is not eligible to fight as a ${titledCombat} unit`
      }
    } else {
      description = `${handCardSelected.unit.name} cannot fight for your opponent`
    }
  }
  const playerRound = player.rounds[game.round - 1]
  const playerRow =
    combat === Combat.Close ? playerRound.close : combat === Combat.Ranged ? playerRound.ranged : playerRound.siege
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
  const fullUnit = fullUnits && fullUnits.units[fullUnits.currentIndex]

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
          cursor: (validRow || scorchSelected) && isTurn ? 'pointer' : handCardSelected ? 'not-allowed' : 'default',
          borderStyle: validRow ? (isTurn ? 'solid' : 'dotted') : 'none',
        }}
        title={description}
        onClick={async () => {
          if (isSelf && isTurn && handCardSelected?.unit && validRow) {
            await retryCheckingAuth({
              checkAuth,
              method: async () => {
                await playUnitProps.playUnit({
                  variables: {
                    game: game.id,
                    combat: combat,
                    unit: handCardSelected?.unit.id,
                  },
                })
                setHandCardSelected(undefined)
              },
            })
          }
        }}
      >
        {sortedUnits.map((gameUnit, index) => {
          const selectedAsFullCard =
            fullUnit && fullUnit.unit.unit.id === gameUnit.unit.id && fullUnit.playerId === player.user.id
          const selectedInHistory =
            historyCardSelected &&
            historyCardSelected.unit.unit.id === gameUnit.unit.id &&
            historyCardSelected.playerId === player.user.id
          const unitForPlayer: UnitForPlayer = {
            playerId: player.user.id,
            unit: gameUnit,
          }

          return (
            <div
              className="game-combat-card-wrapper"
              key={gameUnit.unit.id}
              onClick={() => {
                const cardBeingPlayed =
                  isTurn &&
                  handCardSelected &&
                  (!handCardSelected.unit.combats || handCardSelected.unit.combats.includes(combat))
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
                        unit: deckUnit,
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
        })}
      </div>
    </div>
  )
}
