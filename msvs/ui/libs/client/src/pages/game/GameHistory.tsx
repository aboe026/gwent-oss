import { CgChevronUp, CgChevronDown, CgTime } from 'react-icons/cg'
import { Dispatch, SetStateAction, useState } from 'react'

import Centered from '../../components/Centered'
import ContainerFixedAspectRatio from '../../components/ContainerFixedAspectRation'
import {
  UnitFragment,
  UnitFragmentDoc,
  DeckUnitFragment,
  EffectKey,
  GameFragment,
  GamePlayerFragment,
  GamePlayerFragmentDoc,
  GameStatus,
  GameUnitFragment,
  GameUnitFragmentDoc,
  GameUnitOrigin,
  ImpactFragment,
  ImpactFragmentDoc,
  MoveLeaderFragmentDoc,
  MoveReasonType,
  MoveUnitFragmentDoc,
  PlayerCombatRowFragmentDoc,
  PlayerRoundFragmentDoc,
  UnitEffectFragment,
  UnitEffectFragmentDoc,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import { FullUnitCards, MoveForRound, PlayerMove, PlayPassProps, PlayUnitProps, UnitForPlayer } from './GameProps'
import { getErrorMessages } from '../../util/error-util'
import { getImpactDescription, getNoImpactMessage, groupBy, sortObjectArray, toTitleCase } from '@gwent/utils'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import LoadingSpinner from '../../components/LoadingSpinner'
import './GameHistory.css'

/**
 * A list of historical moves made in a Game.
 */
export default function GameHistory({
  game,
  handCardSelected,
  historyCardSelected,
  movesByRounds,
  playPassProps,
  playUnitProps,
  self,
  setHandCardSelected,
  setHistoryCardSelected,
  setFullUnits,
}: {
  game: GameFragment
  handCardSelected: DeckUnitFragment | undefined
  historyCardSelected: UnitForPlayer | undefined
  movesByRounds: MoveForRound[]
  playPassProps: PlayPassProps
  playUnitProps: PlayUnitProps
  self: GamePlayerFragment
  setHandCardSelected: Dispatch<SetStateAction<DeckUnitFragment | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
}) {
  const handCardSelectedUnit = useFragment(UnitFragmentDoc, handCardSelected?.unit)
  const historyCardSelectedUnit = useFragment(UnitFragmentDoc, historyCardSelected?.unitFragment.unit)
  const showLoading =
    (game.status === GameStatus.Playing && game.turn?.user.name !== self.user.name) ||
    playUnitProps.loading ||
    playPassProps.loading
  const loadingTitle = playUnitProps.loading
    ? `Waiting for ${handCardSelectedUnit?.name || 'unit'} to be deployed to the battlefield`
    : playPassProps.loading
      ? 'Waiting for Pass to be recognized on the battlefield'
      : 'Waiting for opponent to make their move'
  const playPassErrorMessages = getErrorMessages(playPassProps.error)
  const playUnitErrorMessages = getErrorMessages(playUnitProps.error)

  return (
    <div id={HTML_IDS.GameHistoryContainer} className="game-edge-container game-section">
      {game.round === 0 ? (
        <Centered classname="game-history-placeholder">
          <CgTime color="black" className={HTML_CLASSES.GameHistoryIcon} title="History" />
        </Centered>
      ) : (
        <>
          {showLoading && (
            <div className={HTML_CLASSES.GameHistoryLoadingContainer}>
              <LoadingSpinner size="100px" title={loadingTitle} />
            </div>
          )}
          {playPassErrorMessages && (
            <div className={HTML_CLASSES.GameHistoryError}>
              <div className="error-text">{`Error attempting to pass: ${playPassErrorMessages}`}</div>
            </div>
          )}
          {playUnitErrorMessages && (
            <div className={HTML_CLASSES.GameHistoryError}>
              <div className="error-text">{`Error playing unit "${handCardSelectedUnit?.name}": ${playUnitErrorMessages}`}</div>
            </div>
          )}
          {movesByRounds.map((movesByRound) => {
            const unitMoves = movesByRound.playerMoves.filter((playerMove) => playerMove.move.__typename === 'MoveUnit')
            return (
              <div className={HTML_CLASSES.GameHistoryRoundContainer} key={movesByRound.round}>
                <div className={HTML_CLASSES.GameHistoryRoundName}>Round {movesByRound.round}</div>
                {movesByRound.playerMoves.map((playerMove, index) => (
                  <PlayerHistoryMove
                    game={game}
                    historyCardSelectedUnit={historyCardSelectedUnit}
                    historyCardSelected={historyCardSelected}
                    index={index}
                    movesByRound={movesByRound}
                    playerMove={playerMove}
                    self={self}
                    setFullUnits={setFullUnits}
                    setHandCardSelected={setHandCardSelected}
                    setHistoryCardSelected={setHistoryCardSelected}
                    unitMoves={unitMoves}
                    key={`r${movesByRound.round}-i${index}`}
                  />
                ))}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

function PlayerHistoryMove({
  playerMove,
  game,
  historyCardSelected,
  movesByRound,
  self,
  setHandCardSelected,
  setHistoryCardSelected,
  setFullUnits,
  unitMoves,
  historyCardSelectedUnit,
  index,
}: {
  playerMove: PlayerMove
  game: GameFragment
  historyCardSelected: UnitForPlayer | undefined
  movesByRound: MoveForRound
  self: GamePlayerFragment
  setHandCardSelected: Dispatch<SetStateAction<DeckUnitFragment | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  unitMoves: PlayerMove[]
  historyCardSelectedUnit: UnitFragment | undefined
  index: number
}) {
  const gamePlayer = game.players[playerMove.playerIndex]
  const player = useFragment(GamePlayerFragmentDoc, gamePlayer)
  const isSelf = useFragment(GamePlayerFragmentDoc, gamePlayer).user.name === self.user.name
  let isSelected = false
  let isOnBattlefield = false
  let textClass = `game-history-move-text ${isSelf ? 'game-history-move-text-self' : 'game-history-move-text-opponent'}`
  const descriptionClass = `game-history-move-user-description ${
    isSelf ? 'game-history-move-user-description-self' : 'game-history-move-user-description-opponent'
  }`
  let primaryText = ''
  let secondaryText = ''
  let image = ''
  let imageTitle = ''
  let unitMoveIndex = 0
  let error = false
  let pointable = false
  let impacts: ImpactFragment[] | undefined | null
  let gameUnit: GameUnitFragment | undefined
  if (playerMove.move.__typename === 'MoveLeader') {
    const leaderMove = useFragment(MoveLeaderFragmentDoc, playerMove.move)
    primaryText = `Activated leader ${leaderMove.leader.name} ability`
    image = leaderMove.leader.image
  } else if (playerMove.move.__typename === 'MovePass') {
    primaryText = `Passed the rest of round ${movesByRound.round}`
    image = 'images/actions/pass.png'
    imageTitle = 'Passed'
    textClass += ' game-history-move-text-wrappable'
  } else if (playerMove.move.__typename === 'MoveUnit') {
    const unitMove = useFragment(MoveUnitFragmentDoc, playerMove.move)
    gameUnit = useFragment(GameUnitFragmentDoc, unitMove.unit)
    const unit = useFragment(UnitFragmentDoc, gameUnit.unit)
    impacts = useFragment(ImpactFragmentDoc, unitMove.impacts)
    unitMoveIndex = unitMoves.findIndex((unitMove) => {
      if (unitMove.move.__typename === 'MoveUnit') {
        const potentialUnitMove = useFragment(MoveUnitFragmentDoc, unitMove.move)
        const potentialUnit = useFragment(
          UnitFragmentDoc,
          useFragment(GameUnitFragmentDoc, potentialUnitMove.unit).unit
        )
        if (potentialUnit.id === unit.id) {
          return unitMove.playerIndex === playerMove.playerIndex
        }
      }
    })
    pointable = true
    primaryText = unit.name
    let placement = gameUnit.row ? `as ${toTitleCase(gameUnit.row)}` : 'to battlefield'
    if (unitMove.reason.unit?.unit.name) {
      placement += ` by ${unitMove.reason.unit?.unit.name}`
    }
    let reason = 'deployed'
    let source = ''
    if (unitMove.reason.type === MoveReasonType.Muster) {
      reason = 'mustered'
      if (unitMove.source.origin === GameUnitOrigin.Hand) {
        source = ' from Hand'
      } else if (unitMove.source.origin === GameUnitOrigin.Undrawn) {
        source = ' from Draw pile'
      }
    }
    secondaryText = `${reason} ${placement}${source}`
    image = unit.images[gameUnit.artStyle - 1]
    imageTitle = unit.name

    if (
      historyCardSelected &&
      historyCardSelectedUnit &&
      historyCardSelectedUnit.id === unit.id &&
      historyCardSelected.playerId === player.user.id
    ) {
      isSelected = true
      const playerRound = useFragment(PlayerRoundFragmentDoc, player.rounds[game.round - 1])
      const units = [
        ...useFragment(PlayerCombatRowFragmentDoc, playerRound.close).units,
        ...useFragment(PlayerCombatRowFragmentDoc, playerRound.ranged).units,
        ...useFragment(PlayerCombatRowFragmentDoc, playerRound.siege).units,
      ]
      for (let i = 0; i < units.length && !isOnBattlefield; i++) {
        if (useFragment(UnitFragmentDoc, useFragment(GameUnitFragmentDoc, units[i]).unit).id === unit.id) {
          isOnBattlefield = true
        }
      }
    }
  } else {
    primaryText = `Invalid move type: "${playerMove.move.__typename}"`
    error = true
  }
  const playerClass = isSelf ? 'game-history-move-self' : 'game-history-move-opponent'

  return (
    <div key={`r${movesByRound.round}-i${index}`} className={HTML_CLASSES.GameHistoryMoveContainer}>
      <div
        ref={playerMove.ref}
        className={`game-history-move-unit ${isSelected ? 'item-highlighted' : ''} ${pointable ? 'pointable' : ''}`}
        style={{ borderStyle: isSelected ? (isOnBattlefield ? 'solid' : 'dotted') : 'inherit' }}
        title={isSelected && !isOnBattlefield ? 'This unit is no longer on the battlefield' : ''}
        onClick={() => {
          if (playerMove.move.__typename === 'MoveUnit') {
            const gameUnit = useFragment(GameUnitFragmentDoc, useFragment(MoveUnitFragmentDoc, playerMove.move).unit)
            const unit = useFragment(UnitFragmentDoc, gameUnit.unit)
            if (
              historyCardSelected &&
              historyCardSelectedUnit &&
              historyCardSelectedUnit.id === unit.id &&
              historyCardSelected.playerId === player.user.id
            ) {
              setHistoryCardSelected(undefined)
            } else {
              setHistoryCardSelected({
                playerId: player.user.id,
                unitFragment: gameUnit,
              })
            }
            setHandCardSelected(undefined)
          }
        }}
      >
        <div className={`game-history-move-overview ${playerClass}`}>
          <ContainerFixedAspectRatio aspectRatio="309 / 444" width="25%">
            {image && (
              <img
                className={HTML_CLASSES.GameHistoryMoveImage}
                src={image}
                title={imageTitle}
                onClick={(event) => {
                  if (gameUnit) {
                    event.preventDefault()
                    event.stopPropagation()
                    const units: {
                      playerId: string
                      unitFragment: GameUnitFragment
                    }[] = []
                    for (const unitMove of unitMoves) {
                      if (unitMove.move.__typename === 'MoveUnit') {
                        const player = useFragment(GamePlayerFragmentDoc, game.players[unitMove.playerIndex])
                        const move = useFragment(MoveUnitFragmentDoc, unitMove.move)
                        units.push({
                          playerId: player.user.id,
                          unitFragment: useFragment(GameUnitFragmentDoc, move.unit),
                        })
                      }
                    }
                    setFullUnits({
                      currentIndex: unitMoveIndex,
                      units,
                    })
                    setHistoryCardSelected({
                      playerId: player.user.id,
                      unitFragment: gameUnit,
                    })
                    setHandCardSelected(undefined)
                  }
                }}
              />
            )}
          </ContainerFixedAspectRatio>
          <div className={descriptionClass}>
            <div className={`${textClass} ${HTML_CLASSES.GameHistoryMoveUsername}`} title={player.user.name}>
              {player.user.name}
            </div>
            <div className="game-history-move-texts">
              <div
                className={`${textClass} ${error ? 'error-text' : ''} ${HTML_CLASSES.GameHistoryMovePrimaryText}`}
                title={primaryText}
                style={{ fontWeight: secondaryText ? 'bold' : 'normal' }}
              >
                {primaryText}
              </div>
              {secondaryText && (
                <div className={`${textClass} ${HTML_CLASSES.GameHistoryMoveSecondaryText}`} title={secondaryText}>
                  {secondaryText}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {gameUnit &&
        hasImpactableEffect({
          gameUnit,
        }) && (
          <MoveUnitImpact
            gameUnit={gameUnit}
            game={game}
            historyCardSelected={historyCardSelected}
            impacts={impacts}
            self={self}
            setFullUnits={setFullUnits}
            setHandCardSelected={setHandCardSelected}
            setHistoryCardSelected={setHistoryCardSelected}
          />
        )}
    </div>
  )
}

/**
 * The units impacted by a specific unit.
 */
function MoveUnitImpact({
  gameUnit,
  game,
  historyCardSelected,
  impacts,
  self,
  setFullUnits,
  setHandCardSelected,
  setHistoryCardSelected,
}: {
  gameUnit: GameUnitFragment
  game: GameFragment
  historyCardSelected: UnitForPlayer | undefined
  impacts: ImpactFragment[] | null | undefined
  self: GamePlayerFragment
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnitFragment | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
}) {
  const [expanded, setExpanded] = useState(false)
  const unitsImpacted = impacts ? impacts.length : 0
  const { effect, error } = getEffectForImpact({
    gameUnit,
  })

  if (!effect) {
    return <div className="error-text">{error}</div>
  }
  return (
    <div className={HTML_CLASSES.GameHistoryMoveImpactContainer}>
      <div
        className={`move-impact-effect-container pointable ${expanded ? '' : 'move-impact-effect-container-collapsed'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`move-impact-effect-member ${HTML_CLASSES.GameHistoryMoveImpactCount}`}>{unitsImpacted}</div>
        <img
          src={effect.image}
          title={effect.name}
          className={`move-impact-effect-member ${HTML_CLASSES.MoveImpactEffectIcon}`}
        />
        {expanded ? (
          <CgChevronUp className="move-impact-effect-member" color="black" title="Collapse" />
        ) : (
          <CgChevronDown className="move-impact-effect-member" color="black" title="Expand" />
        )}
      </div>
      {expanded && (
        <div className="move-impact-units-container">
          <div className="move-impact-units">
            {!impacts || impacts.length === 0 ? (
              <div className={HTML_CLASSES.MoveImpactNoUnits}>
                {getNoImpactMessage({
                  effectKey: effect.key,
                })}
              </div>
            ) : (
              renderImpacts({
                effectKey: effect.key,
                game,
                historyCardSelected,
                impacts,
                self,
                setFullUnits,
                setHandCardSelected,
                setHistoryCardSelected,
              })
            )}
          </div>
          <div className="move-impact-hide pointable" onClick={() => setExpanded(false)}>
            <CgChevronUp color="black" title="Collapse" />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * A list of the impacts made by a specific unit.
 */
function renderImpacts({
  effectKey,
  game,
  historyCardSelected,
  impacts,
  self,
  setFullUnits,
  setHandCardSelected,
  setHistoryCardSelected,
}: {
  effectKey: EffectKey
  game: GameFragment
  historyCardSelected: UnitForPlayer | undefined
  impacts: ImpactFragment[]
  self: GamePlayerFragment
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnitFragment | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
}) {
  const historyCardSelectedUnit = useFragment(UnitFragmentDoc, historyCardSelected?.unitFragment.unit)
  const groups = groupBy({
    array: impacts,
    property: 'user.name',
  })
  const units: UnitForPlayer[] = []
  for (const group of groups) {
    const sortedImpacts = sortObjectArray({
      array: group,
      sortProperties: ['unit.unit.name', 'source.origin', 'unit.unit.id'],
    })
    for (const impact of sortedImpacts) {
      units.push({
        playerId: impact.user.id,
        unitFragment: useFragment(GameUnitFragmentDoc, impact.unit),
      })
    }
  }

  return groups.map((group, groupIndex) => {
    const sortedImpacts = sortObjectArray({
      array: group,
      sortProperties: ['unit.unit.name', 'source.origin', 'unit.unit.id'],
    })

    return (
      <div key={groupIndex} className="move-impact-groups-container">
        <div className="move-impact-group-container">
          {sortedImpacts.map((impactedUnit, index) => {
            const isSelf = impactedUnit.user.name === self.user.name
            const textClass = `game-history-move-text ${
              isSelf ? 'game-history-move-text-self' : 'game-history-move-text-opponent'
            }`
            const playerClass = isSelf ? 'game-history-move-self' : 'game-history-move-opponent'
            const infoClass = `move-impact-unit-info ${
              isSelf ? 'move-impact-unit-info-self' : 'move-impact-unit-info-opponent'
            }`
            const description = getImpactDescription({
              effectKey,
              origin: impactedUnit.source?.origin,
            })
            const gameUnitForImpact = useFragment(GameUnitFragmentDoc, impactedUnit.unit)
            const unitForImpact = useFragment(UnitFragmentDoc, gameUnitForImpact.unit)
            const isSelected =
              historyCardSelected &&
              historyCardSelectedUnit &&
              historyCardSelected.playerId === impactedUnit.user.id &&
              historyCardSelectedUnit.id === unitForImpact.id
            let isOnBattlefield = false
            if (isSelected) {
              const gamePlayer = useFragment(
                GamePlayerFragmentDoc,
                game.players.find(
                  (player) => useFragment(GamePlayerFragmentDoc, player).user.id === impactedUnit.user.id
                )
              )
              const round = useFragment(PlayerRoundFragmentDoc, gamePlayer?.rounds[game.round - 1])
              const units = [
                ...(useFragment(PlayerCombatRowFragmentDoc, round?.close)?.units || []),
                ...(useFragment(PlayerCombatRowFragmentDoc, round?.ranged)?.units || []),
                ...(useFragment(PlayerCombatRowFragmentDoc, round?.siege)?.units || []),
              ]
              for (let i = 0; i < units.length && !isOnBattlefield; i++) {
                const battlefieldUnit = useFragment(UnitFragmentDoc, useFragment(GameUnitFragmentDoc, units[i]).unit)
                if (battlefieldUnit.id === unitForImpact.id) {
                  isOnBattlefield = true
                }
              }
            }

            return (
              <div
                key={index}
                className={`${HTML_CLASSES.GameHistoryMoveImpactUnitContainer} pointable ${playerClass} ${
                  isSelected ? 'item-highlighted' : ''
                }`}
                style={{ borderStyle: isSelected ? (isOnBattlefield ? 'solid' : 'dotted') : 'inherit' }}
                title={isSelected && !isOnBattlefield ? 'This unit is no longer on the battlefield' : ''}
                onClick={() => {
                  if (historyCardSelectedUnit && historyCardSelectedUnit.id === unitForImpact.id) {
                    setHistoryCardSelected(undefined)
                  } else {
                    setHistoryCardSelected({
                      playerId: impactedUnit.user.id,
                      unitFragment: useFragment(GameUnitFragmentDoc, impactedUnit.unit),
                    })
                    setHandCardSelected(undefined)
                  }
                }}
              >
                <ContainerFixedAspectRatio aspectRatio="309 / 444" width="25%">
                  <img
                    src={unitForImpact.images[gameUnitForImpact.artStyle - 1]}
                    className="move-impact-unit-image"
                    title={unitForImpact.name}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setFullUnits({
                        currentIndex: units.findIndex(
                          (unit) =>
                            unit.playerId === impactedUnit.user.id &&
                            useFragment(UnitFragmentDoc, unit.unitFragment.unit).id === unitForImpact.id
                        ),
                        units,
                      })
                      setHistoryCardSelected({
                        playerId: impactedUnit.user.id,
                        unitFragment: gameUnitForImpact,
                      })
                      setHandCardSelected(undefined)
                    }}
                  />
                </ContainerFixedAspectRatio>
                <div className={infoClass}>
                  <div className={`${textClass} ${HTML_CLASSES.MoveImpactUserName}`} title={impactedUnit.user.name}>
                    {impactedUnit.user.name}
                  </div>
                  <div>
                    <div className={`${textClass} ${HTML_CLASSES.MoveImpactUnitName}`} title={unitForImpact.name}>
                      {unitForImpact.name}
                    </div>
                    <div className={`${textClass} ${HTML_CLASSES.MoveImpactDescription}`} title={description}>
                      {description}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {groups.length > 1 && groupIndex < groups.length - 1 && <div className="move-impact-group-separator"></div>}
      </div>
    )
  })
}

interface EffectForImpact {
  effect: UnitEffectFragment | null | undefined
  error: string
}

/**
 * Gets the single Effect a GameUnit could potentially have on other units on the battlefield.
 */
function getEffectForImpact({ gameUnit }: { gameUnit: GameUnitFragment }): EffectForImpact {
  let error = ''
  const unit = useFragment(UnitFragmentDoc, gameUnit.unit)
  const effects =
    unit.effects &&
    unit.effects
      .map((effect) => useFragment(UnitEffectFragmentDoc, effect))
      .filter((effect) => ![EffectKey.Agile, EffectKey.Avenger, EffectKey.Berserker].includes(effect.key))
  if (!effects) {
    error = 'Could not determine Effect for Impact'
  } else if (effects.length > 1) {
    error = `Found multiple Effects for Impact: "${JSON.stringify(effects.map((effect) => effect.key))}`
  }

  return {
    effect: effects && effects[0],
    error,
  }
}

/**
 * Whether or not a specific GameUnit is able to have an Impact on other units in the battlefield.
 */
function hasImpactableEffect({ gameUnit }: { gameUnit: GameUnitFragment }): boolean {
  const effectsWithImpact = [
    EffectKey.Bond,
    EffectKey.Decoy,
    EffectKey.Horn,
    EffectKey.Mardroeme,
    EffectKey.Medic,
    EffectKey.Morale,
    EffectKey.Muster,
    EffectKey.Scorch,
    EffectKey.Spy,
    EffectKey.Weather,
  ]
  const unit = useFragment(UnitFragmentDoc, gameUnit.unit)
  return (
    !!unit.effects &&
    unit.effects
      .map((effect) => useFragment(UnitEffectFragmentDoc, effect))
      .filter((effect) => effectsWithImpact.includes(effect.key)).length > 0
  )
}
