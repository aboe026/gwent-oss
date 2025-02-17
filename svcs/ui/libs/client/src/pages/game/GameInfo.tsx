import { CgSync } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'

import Centered from '../../components/Centered'
import {
  DeckUnit,
  GamePlayer,
  Game,
  GameStatus,
  Faction,
  Leader,
  RoundResult,
  PlayerRound,
} from '@gwent/graphql-schema/apollo-typings'
import { GameDeckProps, GameProps } from './GameProps'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import { humanizeDay, humanizeTime } from '@gwent/utils'

export default function GameInfo({
  coinTossVisible,
  gameProps,
  gameDeckProps,
  handCardSelected,
  opponent,
  playPassLoading,
  playUnitLoading,
  self,
  setPassConfirmationOpen,
}: {
  coinTossVisible: boolean
  gameDeckProps: GameDeckProps
  gameProps: GameProps
  handCardSelected: DeckUnit | undefined
  opponent: GamePlayer
  playPassLoading: boolean
  playUnitLoading: boolean
  self: GamePlayer
  setPassConfirmationOpen: Dispatch<SetStateAction<boolean>>
}) {
  const sharedProps = {
    handCardSelected,
    game: gameProps.game as Game,
    coinTossVisible,
    setPassConfirmationOpen,
    playUnitLoading,
    playPassLoading,
  }
  return (
    <div id="gameInfoContainer" className="game-edge-container">
      {renderPlayerInfo({
        ...sharedProps,
        id: HTML_IDS.GameInfoOpponentContainer,
        player: opponent,
        isSelf: false,
        faction: opponent.faction,
        discard: opponent.counts?.discard,
        hand: opponent.counts?.hand,
        undrawn: opponent.counts?.undrawn,
        leader: opponent.leader,
      })}
      {renderSharedInfo({
        gameProps,
        gameDeckProps: gameDeckProps,
      })}
      {renderPlayerInfo({
        ...sharedProps,
        id: HTML_IDS.GameInfoSelfContainer,
        player: self,
        isSelf: true,
        faction: gameDeckProps.deck?.from?.faction,
        leader: gameDeckProps.deck?.from?.leader,
        discard: gameDeckProps.deck?.discard.length,
        hand: gameDeckProps.deck?.hand.length,
        undrawn: gameDeckProps.deck?.undrawn.length,
        deckName: gameDeckProps.deck?.from?.name,
        deckUpdated: gameDeckProps.deck?.from?.created,
      })}
    </div>
  )
}

function renderSharedInfo({ gameDeckProps, gameProps }: { gameDeckProps: GameDeckProps; gameProps: GameProps }) {
  const game = gameProps.game
  if (game)
    return (
      <div id="gameInfoSharedContainer">
        <div id="gameInfoSharedDetails" className="game-section">
          {game.status === GameStatus.Playing && (
            <div>
              <span id={HTML_IDS.GameRound}>Round: {game.round}</span>
            </div>
          )}
          <div
            id={HTML_IDS.GameRefresh}
            className={game.status === GameStatus.Playing ? 'playing' : 'decking'}
            style={{ cursor: gameProps.loading || gameDeckProps.loading ? 'not-allowed' : 'pointer' }}
            title="Refresh"
            onClick={async () =>
              !gameProps.loading &&
              !gameDeckProps.loading &&
              (await Promise.all([gameProps.refetch(), gameDeckProps.refetch()]))
            }
          >
            <CgSync color={false ? 'gray' : 'black'} />
          </div>
        </div>
        {game.status === GameStatus.Playing && (
          <div id="gameWeatherContainer" className="game-section">
            <img id="gameWeatherIcon" src="images/effects/weather.png" title="Weather" />
            <div id="gameWeatherCardSpot" className="game-sub-section"></div>
          </div>
        )}
      </div>
    )
}

function renderPlayerInfo({
  coinTossVisible,
  deckName,
  deckUpdated,
  discard,
  faction,
  game,
  hand,
  handCardSelected,
  id,
  isSelf,
  leader,
  player,
  playPassLoading,
  playUnitLoading,
  setPassConfirmationOpen,
  undrawn,
}: {
  coinTossVisible: boolean
  deckName?: string
  deckUpdated?: Date
  discard?: number
  faction?: Faction | null
  game: Game
  hand?: number
  handCardSelected: DeckUnit | undefined
  id: string
  isSelf: boolean
  leader?: Leader | null
  player: GamePlayer
  playPassLoading: boolean
  playUnitLoading: boolean
  setPassConfirmationOpen: Dispatch<SetStateAction<boolean>>
  undrawn?: number
}) {
  const isTurn = game.turn && game.turn.user.name === player.user.name
  let title = ''
  let borderClass = ''
  if (!coinTossVisible) {
    if (game.status === GameStatus.Playing) {
      if (isTurn) {
        title = isSelf ? 'It is your turn' : 'Your opponent is taking their turn'
      } else {
        title = isSelf ? 'It is your opponents turn' : 'Your opponent is waiting for you to take your turn'
      }
    } else {
      if (isTurn) {
        title = isSelf ? 'You will have the first turn' : 'Your opponent will have the first turn'
      } else {
        title = isSelf ? 'Your opponent will have the first turn' : 'Your opponent will go after you this round'
      }
    }
    if (isTurn && game.status !== GameStatus.Done) {
      borderClass = HTML_CLASSES.GamePlayerTurn
      if (game.status === GameStatus.Redrawing) {
        borderClass += ` ${HTML_CLASSES.GamePlayerFutureTurn}`
      }
    }
  }

  return (
    <div
      id={id}
      className={`game-section game-info-player-container ${isTurn ? borderClass : ''}`}
      style={{
        flexDirection: isSelf ? 'column' : 'column-reverse',
      }}
      title={title}
    >
      <div className="game-sub-section game-info-section game-player-section">
        {renderScore({
          handCardSelected,
          game,
          player,
          isSelf,
          isTurn,
          setPassConfirmationOpen,
          playUnitLoading,
          playPassLoading,
        })}
      </div>
      {!faction ? (
        <Centered classname="game-deck-container">
          <img src="images/stats/deck.png" className={HTML_CLASSES.GameDeckIcon} title="Deck" />
        </Centered>
      ) : (
        <>
          <div className="game-deck-section">
            {renderDeckInfo({
              discard,
              hand,
              undrawn,
            })}
          </div>
          <div className="game-sub-section game-info-section">
            {renderFaction({
              faction,
            })}
          </div>
          <div className="game-sub-section game-info-section">
            {renderLeader({
              leader,
            })}
          </div>
          {isSelf && deckName && deckUpdated && (
            <div className="game-sub-section game-info-section">
              {renderDeckFrom({
                name: deckName,
                updated: deckUpdated,
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function renderScore({
  game,
  handCardSelected,
  isSelf,
  isTurn,
  player,
  playPassLoading,
  playUnitLoading,
  setPassConfirmationOpen,
}: {
  game: Game
  handCardSelected: DeckUnit | undefined
  isSelf: boolean
  isTurn?: boolean | null | undefined
  player: GamePlayer
  playPassLoading: boolean
  playUnitLoading: boolean
  setPassConfirmationOpen: Dispatch<SetStateAction<boolean>>
}) {
  let playerRound: PlayerRound | undefined = undefined
  let winning = false
  let passTitle = ''
  if (game.round > 0) {
    playerRound = player.rounds[game.round - 1]
    const playerScore = playerRound.score
    const opponent = game.players.find((gamePlayer) => gamePlayer.user.name !== player.user.name)
    if (opponent) {
      const opponentScore = opponent.rounds[game.round - 1].score
      winning = playerScore > opponentScore
    }
    if (playPassLoading) {
      passTitle = 'Waiting for Pass to be recognized on the battlefield'
    } else {
      if (playUnitLoading) {
        passTitle = `Cannot pass while waiting for ${
          handCardSelected?.unit.name || 'unit'
        } to be deployed to the battlefield`
      } else {
        if (playerRound.passed) {
          if (isSelf) {
            passTitle = 'You have already passed the rest of the round'
          } else {
            passTitle = 'Your opponent has chosen to pass the rest of the round'
          }
        } else {
          if (isSelf) {
            if (isTurn) {
              passTitle = 'Select to pass, after which you cannot play any more units the rest of this round'
            } else {
              passTitle = 'Cannot pass while it is not your turn'
            }
          }
        }
      }
    }
  }
  const sortedRounds: {
    round: PlayerRound
    number: number
  }[] = []
  const livesRemaining =
    game.config.lives -
    player.rounds.filter((round) => round.result === RoundResult.Lost || round.result === RoundResult.Drew).length
  for (let i = 0; i < livesRemaining; i++) {
    sortedRounds.push({
      number: game.round + i + 1,
      round: {} as any as PlayerRound, // eslint-disable-line @typescript-eslint/no-explicit-any
    })
  }
  const roundToNumberMap = player.rounds.map((round, index) => {
    return {
      round,
      number: index + 1,
    }
  })
  const roundsPlayed = roundToNumberMap.filter((round) => round.round.result)
  for (const roundPlayed of roundsPlayed) {
    if (roundPlayed.round.result !== RoundResult.Won) {
      sortedRounds.push(roundPlayed)
    }
  }
  const canPass = isTurn && !playPassLoading && !playUnitLoading

  return (
    <div className="game-player-container">
      <div
        className="game-player-name-lives"
        style={{
          flexDirection: isSelf ? 'column' : 'column-reverse',
        }}
      >
        <div className={`game-player-sub-section ${HTML_CLASSES.GamePlayerName}`} title={player.user.name}>
          {player.user.name}
        </div>
        {(game.status === GameStatus.Playing || game.status === GameStatus.Done) && (
          <div className="game-player-rounds-container">
            <div className="game-player-rounds-score">
              <div className="game-player-rounds">
                {sortedRounds.map((round, index) => {
                  let title = 'Life remaining'
                  if (round.round.result === RoundResult.Drew) {
                    title = `Life lost due to tie on round ${round.number}`
                  } else if (round.round.result === RoundResult.Lost) {
                    title = `Life lost due to loss on round ${round.number}`
                  }
                  return (
                    <div
                      key={index}
                      className={`game-round-token ${
                        round.round.result === RoundResult.Lost || round.round.result === RoundResult.Drew
                          ? HTML_CLASSES.GamePlayerRoundTokenLost
                          : HTML_CLASSES.GamePlayerRoundTokenWon
                      }`}
                      title={title}
                    ></div>
                  )
                })}
              </div>
            </div>
            {playerRound &&
              game.status === GameStatus.Playing &&
              (playerRound.passed ? (
                <span className={HTML_CLASSES.GamePlayerPassed} title={passTitle}>
                  Passed
                </span>
              ) : (
                isSelf && (
                  <button
                    id={HTML_IDS.GamePass}
                    type="button"
                    disabled={!canPass}
                    onClick={() => setPassConfirmationOpen(true)}
                    title={passTitle}
                    style={{ cursor: canPass ? 'pointer' : 'not-allowed' }}
                  >
                    Pass
                  </button>
                )
              ))}
          </div>
        )}
      </div>
      {game.status === GameStatus.Playing && (
        <div className={`game-score-container ${winning ? 'game-score-container-winning' : ''}`}>
          {playerRound && (
            <span className={HTML_CLASSES.GamePlayerScore} title="Score for the current round">
              {playerRound.score}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function renderFaction({ faction }: { faction?: Faction | null }) {
  return (
    <div className="game-player-faction">
      {faction && (
        <>
          <img src={faction.image} title={faction.name} className={HTML_CLASSES.GamePlayerFactionImage} />
          <div title="Faction Ability" className={HTML_CLASSES.GamePlayerFactionAbility}>
            {faction.ability}
          </div>
        </>
      )}
    </div>
  )
}

function renderLeader({ leader }: { leader?: Leader | null }) {
  return (
    <div className="game-player-leader">
      {leader && (
        <>
          <img src={leader.image} title={leader.name} className={HTML_CLASSES.GamePlayerLeaderImage} />
          <div title="Leader Ability" className={HTML_CLASSES.GamePlayerLeaderAbility}>
            {leader.ability}
          </div>
        </>
      )}
    </div>
  )
}

function renderDeckInfo({ discard, hand, undrawn }: { discard?: number; hand?: number; undrawn?: number }) {
  return (
    <>
      <div className="game-player-deck-section" title="Cards remaining in deck to draw">
        <span className={HTML_CLASSES.GamePlayerUndrawnCount}>{undrawn}</span>
        <span>Draw</span>
      </div>
      <div className="game-player-deck-section" title="Cards currently in hand">
        <span className={HTML_CLASSES.GamePlayerHandCount}>{hand}</span>
        <span>Hand</span>
      </div>
      <div className="game-player-deck-section" title="Cards discarded or lost">
        <span className={HTML_CLASSES.GamePlayerDiscardCount}>{discard}</span>
        <span>Lost</span>
      </div>
    </>
  )
}

function renderDeckFrom({ name, updated }: { name: string; updated: Date }) {
  const isoString = new Date(updated).toISOString()
  return (
    <div className="game-player-deck-from">
      <div className={HTML_CLASSES.GamePlayerDeckName} title="Name of deck chosen">
        {name}
      </div>
      <div
        className={HTML_CLASSES.GamePlayerDeckDate}
        title="When deck was last updated before choosing"
      >{`${humanizeDay(isoString)} @ ${humanizeTime(isoString)}`}</div>
    </div>
  )
}
