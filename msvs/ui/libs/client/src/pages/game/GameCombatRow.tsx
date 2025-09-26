import { CSSProperties, Dispatch, SetStateAction } from 'react'

import {
  Combat,
  DeckUnitFragment,
  FragmentType,
  GameFragment,
  GamePlayerFragment,
  GameUnitFragmentDoc,
  PlayerCombatRowFragmentDoc,
  PlayerRoundFragmentDoc,
  UnitFragment,
  UnitFragmentDoc,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import ContainerFixedAspectRatio from '../../components/ContainerFixedAspectRation'
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
  handCardSelectedUnit: UnitFragment | undefined
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
    !handCardSelectedUnit.modifier &&
    !scorchSelected
  const invalidRow =
    handCardSelectedUnit &&
    handCardSelectedUnit.combats &&
    !handCardSelectedUnit.combats.includes(combat) &&
    !scorchSelected
  let description = scorchSelected ? '' : `${titledCombat} combat units`
  if (handCardSelectedUnit && !scorchSelected) {
    if (isSelf) {
      if (handCardSelectedUnit.modifier) {
        description = 'Cannot be deployed as row unit, only as row modifier to the left.'
      } else {
        if (validRow) {
          if (isTurn) {
            description = `Place here for ${handCardSelectedUnit.name} to fight in ${titledCombat} combat`
          } else {
            description = 'It is not your turn to play'
          }
        } else if (invalidRow) {
          description = `${handCardSelectedUnit.name} is not eligible to fight in ${titledCombat} combat`
        }
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

  const modifier = useFragment(GameUnitFragmentDoc, playerRow.modifier)
  let modifierTitle = `${titledCombat} combat modifier`
  let modifierClass = ''
  const modifierStyle: CSSProperties = {}
  const validModifier = isSelf && !modifier && handCardSelectedUnit?.modifier
  const invalidModifier =
    (handCardSelectedUnit?.modifier && modifier) || (handCardSelectedUnit && !handCardSelectedUnit.modifier)
  if (isSelf) {
    if (handCardSelectedUnit) {
      if (modifier) {
        modifierTitle = `Modifier already set to ${handCardSelectedUnit.name} for ${titledCombat} combat row`
        modifierStyle.cursor = 'not-allowed'
      } else {
        if (handCardSelectedUnit.modifier) {
          modifierClass = HTML_CLASSES.ItemHighlighted
          if (isTurn) {
            modifierTitle = `Place here for ${handCardSelectedUnit.name} to modify the ${titledCombat} combat row`
            modifierStyle.cursor = 'pointer'
          } else {
            modifierTitle = 'It is not your turn to play'
            modifierStyle.borderStyle = 'dotted'
            modifierStyle.cursor = 'not-allowed'
          }
        } else {
          modifierTitle = `${handCardSelectedUnit.name} is not a combat row modifier`
          modifierStyle.cursor = 'not-allowed'
        }
      }
    }
  } else if (handCardSelectedUnit) {
    modifierTitle = `${handCardSelectedUnit.name} cannot fight for your opponent`
    modifierStyle.cursor = 'not-allowed'
  }
  let id = ''
  if (combat === Combat.Close) {
    id = isSelf ? HTML_IDS.GameCombatRowCloseSelf : HTML_IDS.GameCombatRowCloseOpponent
  } else if (combat === Combat.Ranged) {
    id = isSelf ? HTML_IDS.GameCombatRowRangedSelf : HTML_IDS.GameCombatRowRangedOpponent
  } else {
    id = isSelf ? HTML_IDS.GameCombatRowSiegeSelf : HTML_IDS.GameCombatRowSiegeOpponent
  }
  const fullUnitFragment = fullUnits && fullUnits.units[fullUnits.currentIndex]
  const fullUnit = useFragment(UnitFragmentDoc, fullUnitFragment?.unitFragment.unit)

  return (
    <div id={id} className="game-unit-board-combat-row">
      <div className="game-unit-board-combat-icon-score">
        <img
          className="game-unit-combat-row-icon"
          src={`images/combats/${combat.toLocaleLowerCase()}.png`}
          title={titledCombat}
        />
        <div className={HTML_CLASSES.GameUnitBoardCombatScore} title={`${titledCombat} combat score`}>
          {playerRow.score}
        </div>
        <ContainerFixedAspectRatio
          aspectRatio="309 / 444"
          width="100%"
          className={HTML_CLASSES.GameCombatRowModifierContainer}
          title={modifierTitle}
        >
          {modifier && playerRow.modifier ? (
            <GameRowUnit
              combat={combat}
              title={modifier ? modifierTitle : undefined}
              cursor={invalidModifier ? 'not-allowed' : undefined}
              fullUnit={fullUnit}
              fullUnitFragment={fullUnitFragment}
              gameUnitFragment={playerRow.modifier}
              handCardSelectedUnit={handCardSelectedUnit}
              historyCardSelected={historyCardSelected}
              index={0}
              player={player}
              scrollHistoryIntoView={scrollHistoryIntoView}
              setFullUnits={setFullUnits}
              setHandCardSelected={setHandCardSelected}
              setHistoryCardSelected={setHistoryCardSelected}
              sortedUnits={[playerRow.modifier]}
              style={{ minWidth: 0 }}
              isTurn={isTurn}
              key={1}
            />
          ) : (
            <div
              className={`${HTML_CLASSES.GameCombatRowModifierAvailable} ${modifierClass}`}
              style={modifierStyle}
              onClick={async () => {
                if (validModifier && !playUnitProps.loading) {
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
            />
          )}
        </ContainerFixedAspectRatio>
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
          if (isSelf && isTurn && handCardSelectedUnit && validRow && !playUnitProps.loading) {
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

/**
 * A game unit on the battlefield.
 */
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
  style,
  title,
  cursor,
}: {
  fullUnit: UnitFragment | undefined
  fullUnitFragment: UnitForPlayer | undefined
  combat: Combat
  handCardSelectedUnit: UnitFragment | undefined
  historyCardSelected: UnitForPlayer | undefined
  isTurn?: boolean
  player: GamePlayerFragment
  scrollHistoryIntoView: (args: UnitForPlayer) => void
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnitFragment | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  gameUnitFragment: FragmentType<typeof GameUnitFragmentDoc>
  index: number
  sortedUnits: FragmentType<typeof GameUnitFragmentDoc>[]
  style?: CSSProperties
  title?: string
  cursor?: string
}) {
  const gameUnit = useFragment(GameUnitFragmentDoc, gameUnitFragment)
  const unit = useFragment(UnitFragmentDoc, gameUnit.unit)
  const historyCardSelectedUnit = useFragment(UnitFragmentDoc, historyCardSelected?.unitFragment.unit)
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
      style={style}
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
        title={title}
        cursor={cursor}
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
