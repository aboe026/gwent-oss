import { CgTime } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'

import Centered from '../../components/Centered'
import { DeckUnit, GamePlayer, Game, GameStatus } from '@gwent/graphql-schema/apollo-typings'
import { getApolloError } from '../../util/error-util'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import LoadingSpinner from '../../components/LoadingSpinner'
import { MoveForRound, PlayPassProps, PlayUnitProps, UnitForPlayer } from './GameProps'
import { toTitleCase } from '@gwent/utils'

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
                const textClass = `game-history-move-text ${
                  isSelf ? 'game-history-move-text-self' : 'game-history-move-text-opponent'
                }`
                let description = ''
                let image = ''
                let imageTitle = ''
                let error = false
                let pointable = false
                if (playerMove.move.__typename === 'MoveLeader') {
                  description = `Activated leader ${playerMove.move.leader.name} ability`
                  image = playerMove.move.leader.image
                } else if (playerMove.move.__typename === 'MovePass') {
                  description = `Passed the rest of round ${movesByRound.round}`
                  image = 'images/actions/pass.png'
                  imageTitle = 'Passed'
                } else if (playerMove.move.__typename === 'MoveUnit') {
                  pointable = true
                  const row = playerMove.move.row ? `as ${toTitleCase(playerMove.move.row)}` : 'to battlefield'
                  description = `${playerMove.move.unit.unit.name} deployed ${row}`
                  image = playerMove.move.unit.unit.images[playerMove.move.unit.artStyle - 1]
                  imageTitle = playerMove.move.unit.unit.name
                  if (
                    historyCardSelected &&
                    historyCardSelected.unit.unit.id === playerMove.move.unit.unit.id &&
                    gamePlayer.user.id === historyCardSelected.playerId
                  ) {
                    isSelected = true
                    const playerRound = gamePlayer.rounds[game.round - 1]
                    const userUnitsOnBattlefield: string[] = []
                    for (const closeUnit of playerRound.close.units) {
                      userUnitsOnBattlefield.push(closeUnit.unit.id)
                    }
                    for (const rangedUnit of playerRound.ranged.units) {
                      userUnitsOnBattlefield.push(rangedUnit.unit.id)
                    }
                    for (const siegeUnit of playerRound.siege.units) {
                      userUnitsOnBattlefield.push(siegeUnit.unit.id)
                    }
                    isOnBattlefield = userUnitsOnBattlefield.includes(playerMove.move.unit.unit.id)
                  }
                } else {
                  description = `Invalid move type: "${playerMove.move.__typename}"`
                  error = true
                }

                return (
                  <div
                    key={`r${movesByRound.round}-i${index}`}
                    ref={playerMove.ref}
                    className={`${HTML_CLASSES.GameHistoryMove} ${
                      isSelf ? 'game-history-move-self' : 'game-history-move-opponent'
                    } ${isSelected ? 'item-highlighted' : ''} ${pointable ? 'pointable' : ''}`}
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
                    <div className="game-history-move-image-container-outer">
                      <div className="game-history-move-image-container-inner">
                        {image && <img className="game-history-move-image" src={image} title={imageTitle} />}
                      </div>
                    </div>
                    <div className="game-history-move-user-description">
                      <div className={`${textClass} ${HTML_CLASSES.GameHistoryMoveUsername}`}>
                        {gamePlayer.user.name}
                      </div>
                      <div
                        className={`${textClass} ${error ? 'error-text' : ''} ${
                          HTML_CLASSES.GameHistoryMoveDescription
                        }`}
                      >
                        {description}
                      </div>
                    </div>
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
