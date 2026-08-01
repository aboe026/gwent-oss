import { CgChevronUp, CgChevronDown, CgTime } from 'react-icons/cg'
import { Dispatch, SetStateAction, useState } from 'react'

import Centered from '../../components/Centered'
import ContainerFixedAspectRatio from '../../components/ContainerFixedAspectRation'
import { convertGameUnit, getUnitFromGameUnit } from '../../util/game-unit-util'
import {
  DeckUnitFragment,
  EffectKey,
  FieldUnitFragment,
  FieldUnitFragmentDoc,
  GameFragment,
  GamePlayerFragment,
  GamePlayerFragmentDoc,
  GameStatus,
  GameUnitOrigin,
  ImpactFragment,
  ImpactFragmentDoc,
  MoveFragmentDoc,
  MoveLeaderFragmentDoc,
  MoveReasonType,
  MoveUnitFragmentDoc,
  MoveUnitReasonUnitFragmentDoc,
  PlayerCombatRowFragmentDoc,
  PlayerRoundFragmentDoc,
  GameUnitFragmentDoc,
  UnitEffectFragment,
  UnitEffectFragmentDoc,
  UnitFragmentDoc,
  useFragment,
  WeatherUnitFragment,
  WeatherUnitFragmentDoc,
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
  cardSelected,
  game,
  movesByRounds,
  playPassProps,
  playUnitProps,
  self,
  setCardSelected,
  setFullUnits,
}: {
  cardSelected: UnitForPlayer | undefined
  game: GameFragment
  movesByRounds: MoveForRound[]
  playPassProps: PlayPassProps
  playUnitProps: PlayUnitProps
  self: GamePlayerFragment
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
}) {
  const cardSelectedUnit = cardSelected?.unitFragment
    ? useFragment(UnitFragmentDoc, cardSelected.unitFragment.unit)
    : undefined
  const showLoading =
    (game.status === GameStatus.Playing && game.turn?.user.name !== self.user.name) ||
    playUnitProps.loading ||
    playPassProps.loading
  const loadingTitle = playUnitProps.loading
    ? `Waiting for ${cardSelectedUnit?.name || 'unit'} to be deployed to the battlefield`
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
              <div className="error-text">{`Error playing unit "${cardSelectedUnit?.name}": ${playUnitErrorMessages}`}</div>
            </div>
          )}
          {movesByRounds.map((movesByRound) => {
            const unitMoves = movesByRound.playerMoves.filter((playerMove) => playerMove.move.__typename === 'MoveUnit')
            return (
              <div className={HTML_CLASSES.GameHistoryRoundContainer} key={movesByRound.round}>
                <div className={HTML_CLASSES.GameHistoryRoundName}>Round {movesByRound.round}</div>
                {movesByRound.playerMoves.map((playerMove, index) => (
                  <PlayerHistoryMove
                    cardSelected={cardSelected}
                    game={game}
                    index={index}
                    movesByRound={movesByRound}
                    playerMove={playerMove}
                    self={self}
                    setCardSelected={setCardSelected}
                    setFullUnits={setFullUnits}
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

/**
 * The historical movement a player made.
 */
function PlayerHistoryMove({
  cardSelected,
  playerMove,
  game,
  movesByRound,
  self,
  setCardSelected,
  setFullUnits,
  unitMoves,
  index,
}: {
  cardSelected: UnitForPlayer | undefined
  playerMove: PlayerMove
  game: GameFragment
  movesByRound: MoveForRound
  self: GamePlayerFragment
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  unitMoves: PlayerMove[]
  index: number
}) {
  const gamePlayer = game.players[playerMove.playerIndex]
  const player = useFragment(GamePlayerFragmentDoc, gamePlayer)
  const isSelf = player.user.name === self.user.name
  const cardSelectedUnit = cardSelected?.unitFragment
    ? useFragment(UnitFragmentDoc, cardSelected.unitFragment.unit)
    : undefined
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
  let gameUnit: DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment | undefined
  let cardPlayer = player
  let hasImpacts = false
  let moveReasonType: MoveReasonType | undefined = undefined

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
    moveReasonType = unitMove.reason.type
    if (unitMove.impacts) {
      hasImpacts = true
    }
    const gameUnitFragment = useFragment(GameUnitFragmentDoc, unitMove.unit)
    gameUnit = convertGameUnit(gameUnitFragment)
    const unit = getUnitFromGameUnit(gameUnitFragment)
    if (unit) {
      impacts = useFragment(ImpactFragmentDoc, unitMove.impacts)
      unitMoveIndex = unitMoves.findIndex((unitMove) => {
        if (unitMove.move.__typename === 'MoveUnit') {
          const potentialUnitMove = useFragment(MoveUnitFragmentDoc, unitMove.move)
          const potentialUnit = getUnitFromGameUnit(useFragment(GameUnitFragmentDoc, potentialUnitMove.unit))
          if (potentialUnit && potentialUnit.id === unit.id) {
            return unitMove.playerIndex === playerMove.playerIndex
          }
        }
      })
      pointable = true
      primaryText = unit.name
      let placement = ''
      if (unitMove.target) {
        if (unitMove.reason.type === MoveReasonType.Summon) {
          placement += `for ${unitMove.target.name} `
        } else {
          placement += `to spy on ${unitMove.target.name} `
        }
      }
      placement += gameUnit?.__typename === 'FieldUnit' ? `as ${toTitleCase(gameUnit.row)}` : 'to battlefield'
      const reasonUnit = useFragment(MoveUnitReasonUnitFragmentDoc, unitMove.reason.unit)
      if (reasonUnit?.unit.name) {
        if (unitMove.reason.type === MoveReasonType.Transform) {
          placement += ` from ${unit.name === 'Transformed Young Vildkaarl' ? 'Young Berserker' : 'Berserker'} `
        }
        if (unitMove.reason.type !== MoveReasonType.Summon) {
          placement += ` by ${reasonUnit?.unit.name}`
        }
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
      } else if (unitMove.reason.type === MoveReasonType.Transform) {
        reason = 'transformed'
      } else if (unitMove.reason.type === MoveReasonType.Summon) {
        reason = 'summoned'
      } else if (unitMove.reason.type === MoveReasonType.Revive) {
        reason = 'revived'
      }
      secondaryText = `${reason} ${placement}${source}`
      image = unit.images[(gameUnit?.artStyle || 1) - 1]
      imageTitle = unit.name

      if (unitMove.target?.name) {
        const potentialCardPlayer = useFragment(GamePlayerFragmentDoc, game.players).find(
          (player) => player.user.name === unitMove.target?.name
        )
        if (!potentialCardPlayer) {
          throw Error(`Could not find player for History move "${JSON.stringify(unitMove)}"`)
        }
        cardPlayer = potentialCardPlayer
      }
      isSelected = cardSelectedUnit?.id === unit.id && cardSelected?.playerName === cardPlayer.user.name
      if (isSelected) {
        const playerRound = useFragment(PlayerRoundFragmentDoc, cardPlayer.rounds[game.round - 1])
        const closeRow = useFragment(PlayerCombatRowFragmentDoc, playerRound.close)
        const rangedRow = useFragment(PlayerCombatRowFragmentDoc, playerRound.ranged)
        const siegeRow = useFragment(PlayerCombatRowFragmentDoc, playerRound.siege)
        const unitFragments: (DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment)[] = []
        for (const roundUnits of [closeRow.units, rangedRow.units, siegeRow.units]) {
          if (roundUnits) {
            unitFragments.push(...useFragment(FieldUnitFragmentDoc, roundUnits))
          }
        }
        for (const modifier of [closeRow.modifier, rangedRow.modifier, siegeRow.modifier]) {
          if (modifier) {
            unitFragments.push(useFragment(FieldUnitFragmentDoc, modifier))
          }
        }
        for (const weather of playerRound.weathers) {
          unitFragments.push(useFragment(WeatherUnitFragmentDoc, weather))
        }
        for (let i = 0; i < unitFragments.length && !isOnBattlefield; i++) {
          if (useFragment(UnitFragmentDoc, unitFragments[i].unit).id === unit.id) {
            isOnBattlefield = true
          }
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
            const unit = getUnitFromGameUnit(gameUnit)
            setCardSelected(
              unit && cardSelectedUnit?.id === unit.id && cardSelected?.playerName === cardPlayer.user.name
                ? undefined
                : {
                    unitFragment: convertGameUnit(gameUnit),
                    playerName: cardPlayer.user.name,
                  }
            )
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
                    const units: UnitForPlayer[] = []
                    for (const unitMove of unitMoves) {
                      if (unitMove.move.__typename === 'MoveUnit') {
                        const player = useFragment(GamePlayerFragmentDoc, game.players[unitMove.playerIndex])
                        const move = useFragment(MoveUnitFragmentDoc, unitMove.move)
                        units.push({
                          playerName: player.user.name,
                          unitFragment: convertGameUnit(useFragment(GameUnitFragmentDoc, move.unit)),
                        })
                      }
                    }
                    setFullUnits({
                      currentIndex: unitMoveIndex,
                      units,
                    })
                    setCardSelected({
                      unitFragment: gameUnit,
                      playerName: cardPlayer.user.name,
                    })
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
      {gameUnit && hasImpacts && (
        <MoveUnitImpact
          cardSelected={cardSelected}
          gameUnit={gameUnit}
          game={game}
          impacts={impacts}
          moveReasonType={moveReasonType}
          self={self}
          setCardSelected={setCardSelected}
          setFullUnits={setFullUnits}
        />
      )}
    </div>
  )
}

/**
 * The units impacted by a specific unit.
 */
function MoveUnitImpact({
  cardSelected,
  gameUnit,
  game,
  impacts,
  moveReasonType,
  self,
  setCardSelected,
  setFullUnits,
}: {
  cardSelected: UnitForPlayer | undefined
  gameUnit: DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment
  game: GameFragment
  impacts: ImpactFragment[] | null | undefined
  moveReasonType: MoveReasonType | undefined
  self: GamePlayerFragment
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
}) {
  const [expanded, setExpanded] = useState(false)
  const unitsImpacted = impacts ? impacts.length : 0
  const { effect, error } =
    moveReasonType === MoveReasonType.Summon
      ? findEffectForMoveByPrefix({
          gameUnit,
          self,
        })
      : getEffectForImpact({
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
                cardSelected,
                effectKey: effect.key,
                game,
                impacts,
                self,
                setCardSelected,
                setFullUnits,
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
  cardSelected,
  effectKey,
  game,
  impacts,
  self,
  setCardSelected,
  setFullUnits,
}: {
  cardSelected: UnitForPlayer | undefined
  effectKey: EffectKey
  game: GameFragment
  impacts: ImpactFragment[]
  self: GamePlayerFragment
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
}) {
  const cardSelectedUnit = useFragment(UnitFragmentDoc, cardSelected?.unitFragment?.unit)
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
      const gameUnit = useFragment(GameUnitFragmentDoc, impact.unit)
      if (gameUnit) {
        units.push({
          playerName: impact.user.name,
          unitFragment: convertGameUnit(gameUnit),
        })
      }
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
            const gameUnitForImpact = useFragment(GameUnitFragmentDoc, impactedUnit.unit)
            const unitForImpact = getUnitFromGameUnit(gameUnitForImpact)
            const description = getImpactDescription({
              effectKey,
              origin: impactedUnit.source?.origin,
              name: unitForImpact?.name,
            })
            const isSelected =
              cardSelectedUnit?.id === unitForImpact?.id && cardSelected?.playerName === impactedUnit.user.name
            let isOnBattlefield = false
            if (isSelected) {
              const gamePlayer = useFragment(GamePlayerFragmentDoc, game.players).find(
                (player) => player.user.name === impactedUnit.user.name
              )
              const round = useFragment(PlayerRoundFragmentDoc, gamePlayer?.rounds[game.round - 1])
              const units = [
                ...(useFragment(PlayerCombatRowFragmentDoc, round?.close)?.units || []),
                ...(useFragment(PlayerCombatRowFragmentDoc, round?.ranged)?.units || []),
                ...(useFragment(PlayerCombatRowFragmentDoc, round?.siege)?.units || []),
              ]
              for (let i = 0; i < units.length && !isOnBattlefield; i++) {
                const battlefieldUnit = useFragment(UnitFragmentDoc, useFragment(FieldUnitFragmentDoc, units[i]).unit)
                if (battlefieldUnit.id === unitForImpact?.id) {
                  isOnBattlefield = true
                }
              }
            }
            const title = unitForImpact?.name || (effectKey === EffectKey.Medic ? 'Choosing...' : 'Secret')
            const knownUnit = unitForImpact && gameUnitForImpact

            return (
              <div
                key={index}
                className={`${HTML_CLASSES.GameHistoryMoveImpactUnitContainer} ${knownUnit ? 'pointable' : ''} ${playerClass} ${
                  isSelected ? 'item-highlighted' : ''
                }`}
                style={{ borderStyle: isSelected ? (isOnBattlefield ? 'solid' : 'dotted') : 'inherit' }}
                title={isSelected && !isOnBattlefield ? 'This unit is no longer on the battlefield' : ''}
                onClick={() => {
                  if (gameUnitForImpact) {
                    setCardSelected(
                      isSelected
                        ? undefined
                        : {
                            unitFragment: convertGameUnit(gameUnitForImpact),
                            playerName: impactedUnit.user.name,
                          }
                    )
                  }
                }}
              >
                <ContainerFixedAspectRatio aspectRatio="309 / 444" width="25%">
                  {knownUnit ? (
                    <img
                      src={unitForImpact.images[convertGameUnit(gameUnitForImpact).artStyle - 1]}
                      className="move-impact-unit-image"
                      title={title}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        setFullUnits({
                          currentIndex: units.findIndex(
                            (unit) =>
                              unit.playerName === impactedUnit.user.name &&
                              useFragment(UnitFragmentDoc, unit.unitFragment.unit).id === unitForImpact.id
                          ),
                          units,
                        })
                        setCardSelected({
                          unitFragment: convertGameUnit(gameUnitForImpact),
                          playerName: impactedUnit.user.name,
                        })
                      }}
                    />
                  ) : (
                    <div className="move-impact-unit-image move-impact-unit-unknown" title={title}>
                      ?
                    </div>
                  )}
                </ContainerFixedAspectRatio>
                <div className={infoClass}>
                  <div className={`${textClass} ${HTML_CLASSES.MoveImpactUserName}`} title={impactedUnit.user.name}>
                    {impactedUnit.user.name}
                  </div>
                  <div>
                    <div className={`${textClass} ${HTML_CLASSES.MoveImpactUnitName}`} title={title}>
                      {title}
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
function getEffectForImpact({
  gameUnit,
}: {
  gameUnit: DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment
}): EffectForImpact {
  let error = ''
  const unit = useFragment(UnitFragmentDoc, gameUnit.unit)
  const unitEffects = useFragment(UnitEffectFragmentDoc, unit.effects)
  const effects =
    unitEffects &&
    unitEffects.filter((effect) => ![EffectKey.Agile, EffectKey.Avenger, EffectKey.Berserker].includes(effect.key))
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
 * Finds the Effect for a move by its effectPrefix. Used to find the Avenger Effect for GameUnits that have been summoned to the battlefield.
 */
function findEffectForMoveByPrefix({
  gameUnit,
  self,
}: {
  gameUnit: DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment
  self: GamePlayerFragment
}): EffectForImpact {
  let error = ''
  let effect: UnitEffectFragment | undefined | null = undefined

  const unit = useFragment(UnitFragmentDoc, gameUnit.unit)

  const selfMoveFragments = self.rounds
    .map((round) => {
      return useFragment(PlayerRoundFragmentDoc, round).moves
    })
    .flat()
  for (let i = 0; i < selfMoveFragments.length && !effect; i++) {
    const moveFragment = selfMoveFragments[i]
    const move = useFragment(MoveFragmentDoc, moveFragment)
    if (move.__typename === 'MoveUnit') {
      const unitMove = useFragment(MoveUnitFragmentDoc, move)
      const gameUnitForMove = useFragment(GameUnitFragmentDoc, unitMove.unit)
      const unitForMove = getUnitFromGameUnit(gameUnitForMove)
      if (unitForMove?.effectPrefix === unit.name) {
        const unitEffects = useFragment(UnitEffectFragmentDoc, unitForMove?.effects)
        effect = unitEffects && unitEffects[0]
      }
    }
  }

  if (!effect) {
    error = 'Could not find Effect for Impact'
  }

  return {
    effect,
    error,
  }
}
