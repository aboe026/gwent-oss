import { CSSProperties, Dispatch, SetStateAction } from 'react'

import { CheckAuth, retryCheckingAuth } from '../../util/error-util'
import {
  Combat,
  EffectKey,
  FragmentType,
  GameFragment,
  GamePlayerFragment,
  GameUnitFragmentDoc,
  PlayerCombatRowFragmentDoc,
  PlayerRoundFragmentDoc,
  UnitEffectFragmentDoc,
  UnitFragment,
  UnitFragmentDoc,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import ContainerFixedAspectRatio from '../../components/ContainerFixedAspectRation'
import { FullUnitCards, PlayUnitProps, UnitForPlayer } from './GameProps'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import { sortObjectArray, toTitleCase } from '@gwent/utils'
import UnitGameCard from '../../components/UnitGameCard'
import { useUserContext } from '../../UserContext'

/**
 * A row of combat for a Game player and the units that make up that row.
 */
export default function GameCombatRow({
  cardSelected,
  combat,
  fullUnits,
  game,
  isSelf,
  isTurn,
  player,
  playUnitProps,
  selectedCardInHand,
  scrollHistoryIntoView,
  setCardSelected,
  setFullUnits,
  weather,
}: {
  cardSelected: UnitForPlayer | undefined
  combat: Combat
  fullUnits: FullUnitCards | undefined
  game: GameFragment
  isSelf?: boolean
  isTurn?: boolean
  player: GamePlayerFragment
  playUnitProps: PlayUnitProps
  selectedCardInHand: boolean
  scrollHistoryIntoView: (selected: UnitForPlayer) => void
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  weather?: boolean
}) {
  const { checkAuth } = useUserContext()
  const titledCombat = toTitleCase(combat)
  const cardSelectedUnit = useFragment(UnitFragmentDoc, cardSelected?.unitFragment.unit)
  const scorchSelected = cardSelectedUnit?.name === 'Scorch'
  const decoySelected =
    cardSelectedUnit?.effects &&
    cardSelectedUnit.effects.some((effect) => useFragment(UnitEffectFragmentDoc, effect).key === EffectKey.Decoy)
  const weatherSelected =
    cardSelectedUnit?.effects &&
    cardSelectedUnit.effects.some((effect) => useFragment(UnitEffectFragmentDoc, effect).key === EffectKey.Weather)
  const validRow =
    isSelf &&
    selectedCardInHand &&
    cardSelectedUnit?.combats &&
    cardSelectedUnit.combats.includes(combat) &&
    !cardSelectedUnit.modifier &&
    !scorchSelected &&
    !decoySelected &&
    !weatherSelected
  const invalidRow = cardSelectedUnit?.combats && !cardSelectedUnit.combats.includes(combat) && !scorchSelected
  let description = scorchSelected || weatherSelected ? '' : `${titledCombat} combat units`
  if (cardSelectedUnit && !scorchSelected && !weatherSelected) {
    if (isSelf) {
      if (cardSelectedUnit.modifier) {
        description = 'Cannot be deployed as row unit, only as row modifier to the left.'
      } else {
        if (validRow) {
          if (isTurn) {
            description = `Place here for ${cardSelectedUnit.name} to fight in ${titledCombat} combat`
          } else {
            description = 'It is not your turn to play'
          }
        } else if (invalidRow) {
          description = `${cardSelectedUnit.name} is not eligible to fight in ${titledCombat} combat`
        }
      }
    } else {
      description = `${cardSelectedUnit.name} cannot fight for your opponent`
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
  let modifierTitle = modifier ? useFragment(UnitFragmentDoc, modifier.unit).name : `${titledCombat} combat modifier`
  let modifierClass = ''
  const modifierStyle: CSSProperties = {}
  const validModifier = isSelf && !modifier && cardSelectedUnit?.modifier
  const invalidModifier = (cardSelectedUnit?.modifier && modifier) || (cardSelectedUnit && !cardSelectedUnit.modifier)
  if (!weatherSelected) {
    if (isSelf) {
      if (cardSelectedUnit) {
        if (modifier) {
          modifierTitle = `Modifier already set to ${cardSelectedUnit.name} for ${titledCombat} combat row`
          modifierStyle.cursor = 'not-allowed'
        } else {
          if (cardSelectedUnit.modifier) {
            modifierClass = HTML_CLASSES.ItemHighlighted
            if (isTurn) {
              modifierTitle = `Place here for ${cardSelectedUnit.name} to modify the ${titledCombat} combat row`
              modifierStyle.cursor = 'pointer'
            } else {
              modifierTitle = 'It is not your turn to play'
              modifierStyle.borderStyle = 'dotted'
              modifierStyle.cursor = 'not-allowed'
            }
          } else {
            modifierTitle = `${cardSelectedUnit.name} is not a combat row modifier`
            modifierStyle.cursor = 'not-allowed'
          }
        }
      }
    } else if (cardSelectedUnit) {
      modifierTitle = `${cardSelectedUnit.name} cannot fight for your opponent`
      modifierStyle.cursor = 'not-allowed'
    }
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
        <div className={HTML_CLASSES.GameUnitBoardCombatScore} title={`${titledCombat} combat score`}>
          {playerRow.score}
        </div>
        <ContainerFixedAspectRatio
          aspectRatio="309 / 444"
          height="75%"
          className={HTML_CLASSES.GameCombatRowModifierContainer}
          title={modifierTitle}
        >
          {modifier && playerRow.modifier ? (
            <GameRowUnit
              cardSelected={cardSelected}
              combat={combat}
              title={modifier ? modifierTitle : undefined}
              cursor={invalidModifier ? 'not-allowed' : undefined}
              fullUnit={fullUnit}
              fullUnitFragment={fullUnitFragment}
              gameUnitFragment={playerRow.modifier}
              index={0}
              player={player}
              scrollHistoryIntoView={scrollHistoryIntoView}
              selectedCardInHand={selectedCardInHand}
              setCardSelected={setCardSelected}
              setFullUnits={setFullUnits}
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
                          unit: cardSelectedUnit.id,
                        },
                      })
                      setCardSelected(undefined)
                    },
                  })
                }
              }}
            />
          )}
        </ContainerFixedAspectRatio>
      </div>
      <div className="game-sub-section game-combat-row-units">
        {weather && <div className={HTML_CLASSES.GameCombatRowWeather}></div>}
        <img
          className="game-unit-combat-row-icon game-unit-combat-row-icon-start"
          src={`images/combats/${combat.toLocaleLowerCase()}-icon.png`}
          title={`${titledCombat} combat units`}
        />
        <div
          className={`${HTML_CLASSES.GameCombatRowCards} ${
            validRow ? `${HTML_CLASSES.ItemHighlighted} game-unit-combat-row-valid` : ''
          } ${!isTurn || invalidRow ? 'game-unit-combat-row-invalid' : ''}`}
          style={{
            cursor: (validRow || scorchSelected) && isTurn ? 'pointer' : cardSelectedUnit ? 'not-allowed' : 'default',
            borderStyle: validRow ? (isTurn ? 'solid' : 'dotted') : 'none',
          }}
          title={description ? description : undefined}
          onClick={async () => {
            if (isSelf && isTurn && cardSelectedUnit && validRow && !playUnitProps.loading) {
              await retryCheckingAuth({
                checkAuth,
                method: async () => {
                  await playUnitProps.playUnit({
                    variables: {
                      game: game.id,
                      combat: combat,
                      unit: cardSelectedUnit.id,
                    },
                  })
                  setCardSelected(undefined)
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
              cardSelected={cardSelected}
              index={index}
              player={player}
              selectedCardInHand={selectedCardInHand}
              scrollHistoryIntoView={scrollHistoryIntoView}
              setCardSelected={setCardSelected}
              setFullUnits={setFullUnits}
              sortedUnits={sortedUnits}
              isTurn={isTurn}
              key={index}
              isSelf={player.user.name === game.turn?.user.name}
              playUnitProps={playUnitProps}
              gameId={game.id}
              checkAuth={checkAuth}
            />
          ))}
        </div>
        <img
          className="game-unit-combat-row-icon game-unit-combat-row-icon-end"
          src={`images/combats/${combat.toLocaleLowerCase()}-icon.png`}
          title={`${titledCombat} combat units`}
        />
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
  cardSelected,
  player,
  selectedCardInHand,
  scrollHistoryIntoView,
  setCardSelected,
  setFullUnits,
  isTurn,
  index,
  sortedUnits,
  style,
  title,
  cursor,
  isSelf,
  playUnitProps,
  checkAuth,
  gameId,
}: {
  cardSelected: UnitForPlayer | undefined
  fullUnit: UnitFragment | undefined
  fullUnitFragment: UnitForPlayer | undefined
  combat: Combat
  isTurn?: boolean
  player: GamePlayerFragment
  selectedCardInHand: boolean
  scrollHistoryIntoView: (selected: UnitForPlayer) => void
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  gameUnitFragment: FragmentType<typeof GameUnitFragmentDoc>
  index: number
  sortedUnits: FragmentType<typeof GameUnitFragmentDoc>[]
  style?: CSSProperties
  title?: string
  cursor?: string
  isSelf?: boolean
  playUnitProps?: PlayUnitProps
  checkAuth?: CheckAuth
  gameId?: string
}) {
  const gameUnit = useFragment(GameUnitFragmentDoc, gameUnitFragment)
  const unit = useFragment(UnitFragmentDoc, gameUnit.unit)
  const cardSelectedUnit = useFragment(UnitFragmentDoc, cardSelected?.unitFragment.unit)
  const selectedAsFullCard =
    fullUnitFragment && fullUnit && fullUnit.id === unit.id && fullUnitFragment.playerName === player.user.name
  const selected = cardSelectedUnit?.id === unit.id && cardSelected?.playerName === player.user.name
  const decoySelected =
    cardSelectedUnit &&
    cardSelectedUnit.effects &&
    cardSelectedUnit.effects.some((effect) => useFragment(UnitEffectFragmentDoc, effect).key === EffectKey.Decoy)
  const highlightedForDecoy = !!decoySelected && isSelf && !unit.hero && !unit.special

  return (
    <div
      className="game-combat-card-wrapper"
      style={style}
      key={unit.id}
      onClick={() => {
        const cardBeingPlayed =
          isTurn &&
          selectedCardInHand &&
          cardSelectedUnit &&
          (!cardSelectedUnit.combats || cardSelectedUnit.combats.includes(combat)) &&
          !highlightedForDecoy
        if (!cardBeingPlayed) {
          const newCardSelected: UnitForPlayer | undefined = selected
            ? undefined
            : {
                unitFragment: gameUnit,
                playerName: player.user.name,
              }
          setCardSelected(newCardSelected)
          if (newCardSelected) {
            scrollHistoryIntoView(newCardSelected)
          }
        }
      }}
    >
      <UnitGameCard
        deckUnit={{
          artStyle: gameUnit.artStyle,
          unit: gameUnit.unit,
        }}
        title={highlightedForDecoy ? `Select to decoy ${unit.name} back into hand` : title}
        cursor={cursor}
        effectiveStrength={gameUnit.effectiveStrength}
        selected={selectedAsFullCard || selected || highlightedForDecoy}
        dotted={!isTurn && !selected}
        onFullscreen={() => {
          setFullUnits({
            currentIndex: index,
            units: sortedUnits.map((deckUnit) => {
              return {
                playerName: player.user.name,
                unitFragment: useFragment(GameUnitFragmentDoc, deckUnit),
              }
            }),
          })
          setCardSelected(
            selected
              ? undefined
              : {
                  unitFragment: gameUnit,
                  playerName: player.user.name,
                }
          )
        }}
        onClick={async ({ event }) => {
          if (highlightedForDecoy && playUnitProps && !playUnitProps.loading && gameId && checkAuth) {
            event.preventDefault()
            event.stopPropagation()
            await retryCheckingAuth({
              checkAuth,
              method: async () => {
                await playUnitProps.playUnit({
                  variables: {
                    game: gameId,
                    combat: combat,
                    unit: cardSelectedUnit.id,
                    target: unit.id,
                  },
                })
                setCardSelected(undefined)
              },
            })
          }
        }}
      />
    </div>
  )
}
