import { CgChevronUp, CgChevronDown, CgTime } from 'react-icons/cg'
import { Dispatch, SetStateAction, useState } from 'react'

import Centered from '../../components/Centered'
import ContainerFixedAspectRatio from '../../components/ContainerFixedAspectRation'
import {
  DeckUnit,
  GamePlayer,
  Game,
  GameStatus,
  EffectKey,
  Effect,
  Impact,
  GameUnit,
} from '@gwent/graphql-schema/apollo-typings'
import { getApolloError } from '../../util/error-util'
import { getImpactDescription, getNoImpactMessage, groupBy, sortObjectArray, toTitleCase } from '@gwent/utils'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import LoadingSpinner from '../../components/LoadingSpinner'
import { MoveForRound, PlayPassProps, PlayUnitProps, UnitForPlayer } from './GameProps'
import './GameHistory.css'

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
  setFullUnit,
}: {
  game: Game
  handCardSelected: DeckUnit | undefined
  historyCardSelected: UnitForPlayer | undefined
  movesByRounds: MoveForRound[]
  playPassProps: PlayPassProps
  playUnitProps: PlayUnitProps
  self: GamePlayer
  setHandCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
}) {
  const showLoading =
    (game.status === GameStatus.Playing && game.turn?.user.name !== self.user.name) ||
    playUnitProps.loading ||
    playPassProps.loading
  const loadingTitle = playUnitProps.loading
    ? `Waiting for ${handCardSelected?.unit.name || 'unit'} to be deployed to the battlefield`
    : playPassProps.loading
    ? 'Waiting for Pass to be recognized on the battlefield'
    : 'Waiting for opponent to make their move'
  const resolvedPlayPassError = getApolloError(playPassProps.error)
  const resolvedPlayUnitError = getApolloError(playUnitProps.error)
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
          {resolvedPlayPassError && (
            <div className={HTML_CLASSES.GameHistoryError}>
              <div className="error-text">{`Error attempting to pass: ${resolvedPlayPassError}`}</div>
            </div>
          )}
          {resolvedPlayUnitError && (
            <div className={HTML_CLASSES.GameHistoryError}>
              <div className="error-text">{`Error playing unit "${handCardSelected?.unit.name}": ${resolvedPlayUnitError}`}</div>
            </div>
          )}
          {movesByRounds.map((movesByRound) => (
            <div className={HTML_CLASSES.GameHistoryRoundContainer} key={movesByRound.round}>
              <div className={HTML_CLASSES.GameHistoryRoundName}>Round {movesByRound.round}</div>
              {movesByRound.playerMoves.map((playerMove, index) => {
                const gamePlayer = game.players[playerMove.playerIndex]
                const isSelf = gamePlayer.user.name === self.user.name
                let isSelected = false
                let isOnBattlefield = false
                let textClass = `game-history-move-text ${
                  isSelf ? 'game-history-move-text-self' : 'game-history-move-text-opponent'
                }`
                const descriptionClass = `game-history-move-user-description ${
                  isSelf ? 'game-history-move-user-description-self' : 'game-history-move-user-description-opponent'
                }`
                let primaryText = ''
                let secondaryText = ''
                let image = ''
                let imageTitle = ''
                let error = false
                let pointable = false
                let impacts: Impact[] | undefined | null
                let gameUnit: GameUnit | undefined
                if (playerMove.move.__typename === 'MoveLeader') {
                  primaryText = `Activated leader ${playerMove.move.leader.name} ability`
                  image = playerMove.move.leader.image
                } else if (playerMove.move.__typename === 'MovePass') {
                  primaryText = `Passed the rest of round ${movesByRound.round}`
                  image = 'images/actions/pass.png'
                  imageTitle = 'Passed'
                  textClass += ' game-history-move-text-wrappable'
                } else if (playerMove.move.__typename === 'MoveUnit') {
                  impacts = playerMove.move.impacts
                  gameUnit = playerMove.move.unit
                  pointable = true
                  primaryText = playerMove.move.unit.unit.name
                  const placement = playerMove.move.unit.row
                    ? `as ${toTitleCase(playerMove.move.unit.row)}`
                    : 'to battlefield'
                  secondaryText = `deployed ${placement}`
                  image = playerMove.move.unit.unit.images[playerMove.move.unit.artStyle - 1]
                  imageTitle = playerMove.move.unit.unit.name
                  if (
                    historyCardSelected &&
                    historyCardSelected.unit.unit.id === playerMove.move.unit.unit.id &&
                    gamePlayer.user.id === historyCardSelected.playerId
                  ) {
                    isSelected = true
                    const playerRound = gamePlayer.rounds[game.round - 1]
                    const units = [...playerRound.close.units, ...playerRound.ranged.units, ...playerRound.siege.units]
                    for (let i = 0; i < units.length && !isOnBattlefield; i++) {
                      if (units[i].unit.id === playerMove.move.unit.unit.id) {
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
                      className={`game-history-move-unit ${isSelected ? 'item-highlighted' : ''} ${
                        pointable ? 'pointable' : ''
                      }`}
                      style={{ borderStyle: isSelected ? (isOnBattlefield ? 'solid' : 'dotted') : 'inherit' }}
                      title={isSelected && !isOnBattlefield ? 'This unit is no longer on the battlefield' : ''}
                      onClick={() => {
                        if (playerMove.move.__typename === 'MoveUnit') {
                          if (
                            historyCardSelected &&
                            historyCardSelected.unit.unit.id === playerMove.move.unit.unit.id &&
                            historyCardSelected.playerId === gamePlayer.user.id
                          ) {
                            setHistoryCardSelected(undefined)
                          } else {
                            setHistoryCardSelected({
                              playerId: gamePlayer.user.id,
                              unit: playerMove.move.unit,
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
                              className="game-history-move-image"
                              src={image}
                              title={imageTitle}
                              onClick={(event) => {
                                if (gameUnit) {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  setFullUnit({
                                    playerId: gamePlayer.user.id,
                                    unit: gameUnit,
                                  })
                                }
                              }}
                            />
                          )}
                        </ContainerFixedAspectRatio>
                        <div className={descriptionClass}>
                          <div
                            className={`${textClass} ${HTML_CLASSES.GameHistoryMoveUsername}`}
                            title={gamePlayer.user.name}
                          >
                            {gamePlayer.user.name}
                          </div>
                          <div className="game-history-move-texts">
                            <div
                              className={`${textClass} ${error ? 'error-text' : ''} ${
                                HTML_CLASSES.GameHistoryMovePrimaryText
                              }`}
                              title={primaryText}
                              style={{ fontWeight: secondaryText ? 'bold' : 'normal' }}
                            >
                              {primaryText}
                            </div>
                            {secondaryText && (
                              <div
                                className={`${textClass} ${HTML_CLASSES.GameHistoryMoveSecondaryText}`}
                                title={secondaryText}
                              >
                                {secondaryText}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {gameUnit &&
                      hasImpactableEffect({
                        gameUnit: gameUnit,
                      }) && (
                        <MoveUnitImpact
                          gameUnit={gameUnit}
                          game={game}
                          historyCardSelected={historyCardSelected}
                          impacts={impacts}
                          self={self}
                          setFullUnit={setFullUnit}
                          setHistoryCardSelected={setHistoryCardSelected}
                        />
                      )}
                  </div>
                )
              })}
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function MoveUnitImpact({
  gameUnit,
  game,
  historyCardSelected,
  impacts,
  self,
  setFullUnit,
  setHistoryCardSelected,
}: {
  gameUnit: GameUnit
  game: Game
  historyCardSelected: UnitForPlayer | undefined
  impacts: Impact[] | null | undefined
  self: GamePlayer
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
}) {
  const [expanded, setExpanded] = useState(false)
  const unitsImpacted = impacts ? impacts.length : 0
  const { effect, error } = getEffectForImpact({
    gameUnit: gameUnit,
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
        <img src={effect.image} title={effect.name} className="move-impact-effect-member move-impact-effect-icon" />
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
                setFullUnit,
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

function renderImpacts({
  effectKey,
  game,
  historyCardSelected,
  impacts,
  self,
  setFullUnit,
  setHistoryCardSelected,
}: {
  effectKey: EffectKey
  game: Game
  historyCardSelected: UnitForPlayer | undefined
  impacts: Impact[]
  self: GamePlayer
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
}) {
  const groups = groupBy({
    array: impacts,
    property: 'user.name',
  })

  return groups.map((group, groupIndex) => {
    const sortedUnits = sortObjectArray({
      array: group,
      sortProperties: ['unit.unit.name', 'unit.unit.id'],
    })

    return (
      <div key={groupIndex} className="move-impact-groups-container">
        <div className="move-impact-group-container">
          {sortedUnits.map((impactedUnit, index) => {
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
            })
            const isSelected =
              historyCardSelected &&
              historyCardSelected.playerId === impactedUnit.user.id &&
              historyCardSelected.unit.unit.id === impactedUnit.unit.unit.id
            let isOnBattlefield = false
            if (isSelected) {
              const gamePlayer = game.players.find((player) => player.user.id === impactedUnit.user.id)
              const round = gamePlayer?.rounds[game.round - 1]
              const units = [
                ...(round?.close.units || []),
                ...(round?.ranged.units || []),
                ...(round?.siege.units || []),
              ]
              for (let i = 0; i < units.length && !isOnBattlefield; i++) {
                if (units[i].unit.id === impactedUnit.unit.unit.id) {
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
                  if (historyCardSelected && historyCardSelected.unit.unit.id === impactedUnit.unit.unit.id) {
                    setHistoryCardSelected(undefined)
                  } else {
                    setHistoryCardSelected({
                      playerId: impactedUnit.user.id,
                      unit: impactedUnit.unit,
                    })
                  }
                }}
              >
                <ContainerFixedAspectRatio aspectRatio="309 / 444" width="25%">
                  <img
                    src={impactedUnit.unit.unit.images[impactedUnit.unit.artStyle - 1]}
                    className="move-impact-unit-image"
                    title={impactedUnit.unit.unit.name}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setFullUnit({
                        playerId: impactedUnit.user.id,
                        unit: impactedUnit.unit,
                      })
                    }}
                  />
                </ContainerFixedAspectRatio>
                <div className={infoClass}>
                  <div className={`${textClass} ${HTML_CLASSES.MoveImpactUserName}`} title={impactedUnit.user.name}>
                    {impactedUnit.user.name}
                  </div>
                  <div>
                    <div
                      className={`${textClass} ${HTML_CLASSES.MoveImpactUnitName}`}
                      title={impactedUnit.unit.unit.name}
                    >
                      {impactedUnit.unit.unit.name}
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
  effect: Effect | null | undefined
  error: string
}

function getEffectForImpact({ gameUnit }: { gameUnit: GameUnit }): EffectForImpact {
  let error = ''
  const effects =
    gameUnit.unit.effects &&
    gameUnit.unit.effects.filter(
      (effect) => ![EffectKey.Agile, EffectKey.Avenger, EffectKey.Berserker].includes(effect.key)
    )
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

function hasImpactableEffect({ gameUnit }: { gameUnit: GameUnit }): boolean {
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
  return (
    !!gameUnit.unit.effects &&
    gameUnit.unit.effects.filter((effect) => effectsWithImpact.includes(effect.key)).length > 0
  )
}
