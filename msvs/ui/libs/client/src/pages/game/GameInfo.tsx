import { CgSync } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'
import { FragmentType } from '@apollo/client'

import Centered from '../../components/Centered'
import {
  GameStatus,
  RoundResult,
  DeckUnitFragmentFragment,
  useFragment,
  CardUnitFragmentFragmentDoc,
  GameDeckFragmentFragmentDoc,
  GameFactionFragmentFragmentDoc,
  GameFactionFragmentFragment,
  GameFragmentFragment,
  GameLeaderFragmentFragmentDoc,
  GameLeaderFragmentFragment,
  GamePlayerFragmentFragment,
  GamePlayerFragmentFragmentDoc,
  PlayerRoundFragment,
  PlayerRoundFragmentDoc,
} from '@gwent/graphql-schema/apollo-typings'
import { GameDeckProps, GameProps } from './GameProps'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import { humanizeDay, humanizeTime } from '@gwent/utils'

/**
 * Information about the Game and players in it.
 */
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
  handCardSelected: DeckUnitFragmentFragment | undefined
  opponent: GamePlayerFragmentFragment
  playPassLoading: boolean
  playUnitLoading: boolean
  self: GamePlayerFragmentFragment
  setPassConfirmationOpen: Dispatch<SetStateAction<boolean>>
}) {
  const sharedProps = {
    handCardSelected,
    coinTossVisible,
    setPassConfirmationOpen,
    playUnitLoading,
    playPassLoading,
  }
  const gameDeck = useFragment(GameDeckFragmentFragmentDoc, gameDeckProps.deck)
  const faction = useFragment(GameFactionFragmentFragmentDoc, gameDeck?.from?.faction)
  const leader = useFragment(GameLeaderFragmentFragmentDoc, gameDeck?.from?.leader)

  if (gameProps.game) {
    return (
      <div id="gameInfoContainer" className="game-edge-container">
        {renderPlayerInfo({
          ...sharedProps,
          game: gameProps.game,
          id: HTML_IDS.GameInfoOpponentContainer,
          player: opponent,
          isSelf: false,
          faction: useFragment(GameFactionFragmentFragmentDoc, opponent.faction),
          discard: opponent.counts?.discard,
          hand: opponent.counts?.hand,
          undrawn: opponent.counts?.undrawn,
          leader: useFragment(GameLeaderFragmentFragmentDoc, opponent.leader),
        })}
        {renderSharedInfo({
          gameProps,
          gameDeckProps: gameDeckProps,
        })}
        {renderPlayerInfo({
          ...sharedProps,
          game: gameProps.game,
          id: HTML_IDS.GameInfoSelfContainer,
          player: self,
          isSelf: true,
          faction,
          leader,
          discard: self.counts?.discard !== undefined ? self.counts?.discard : gameDeck?.discard.length,
          hand: self.counts?.hand !== undefined ? self.counts?.hand : gameDeck?.hand.length,
          undrawn: self.counts?.undrawn !== undefined ? self.counts?.undrawn : gameDeck?.undrawn.length,
          deckName: gameDeck?.from?.name,
          deckUpdated: gameDeck?.from?.created,
        })}
      </div>
    )
  }
}

/**
 * Information about the Game that is not specific to a certain player.
 */
function renderSharedInfo({ gameDeckProps, gameProps }: { gameDeckProps: GameDeckProps; gameProps: GameProps }) {
  const game = gameProps.game
  if (game) {
    const loading = gameProps.loading || gameDeckProps.loading
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
            style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
            title="Refresh"
            onClick={async () => !loading && (await Promise.all([gameProps.refetch(), gameDeckProps.refetch()]))}
          >
            <CgSync color={loading ? 'gray' : 'black'} />
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
}

/**
 * Information about the player in the Game.
 */
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
  faction?: GameFactionFragmentFragment | null
  game: GameFragmentFragment
  hand?: number
  handCardSelected: DeckUnitFragmentFragment | undefined
  id: string
  isSelf: boolean
  leader?: GameLeaderFragmentFragment | null
  player: GamePlayerFragmentFragment
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

/**
 * Information about the score of the current round and losses for the Game.
 */
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
  game: GameFragmentFragment
  handCardSelected: DeckUnitFragmentFragment | undefined
  isSelf: boolean
  isTurn?: boolean | null | undefined
  player: GamePlayerFragmentFragment
  playPassLoading: boolean
  playUnitLoading: boolean
  setPassConfirmationOpen: Dispatch<SetStateAction<boolean>>
}) {
  const handCardSelectedUnit = useFragment(CardUnitFragmentFragmentDoc, handCardSelected?.unit)
  let playerRound: PlayerRoundFragment | undefined = undefined
  let winning = false
  let passTitle = ''
  if (game.round > 0) {
    playerRound = useFragment(PlayerRoundFragmentDoc, player.rounds[game.round - 1])
    const playerScore = playerRound.score
    const opponent = useFragment(GamePlayerFragmentFragmentDoc, game.players).find(
      (gamePlayer) => gamePlayer.user.name !== player.user.name
    )
    if (opponent) {
      const opponentScore = useFragment(PlayerRoundFragmentDoc, opponent.rounds[game.round - 1]).score
      winning = playerScore > opponentScore
    }
    if (playPassLoading) {
      passTitle = 'Waiting for Pass to be recognized on the battlefield'
    } else {
      if (playUnitLoading) {
        passTitle = `Cannot pass while waiting for ${
          handCardSelectedUnit?.name || 'unit'
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
    round: FragmentType<PlayerRoundFragment>
    number: number
  }[] = []
  const livesRemaining =
    game.config.lives -
    player.rounds.filter((roundFragment) => {
      const round = useFragment(PlayerRoundFragmentDoc, roundFragment)
      return round.result === RoundResult.Lost || round.result === RoundResult.Drew
    }).length
  for (let i = 0; i < livesRemaining; i++) {
    sortedRounds.push({
      number: game.round + i + 1,
      round: {},
    })
  }
  const roundToNumberMap = player.rounds.map((round, index) => {
    return {
      round,
      number: index + 1,
    }
  })
  const roundsPlayed = roundToNumberMap.filter(
    (roundAndNumber) => useFragment(PlayerRoundFragmentDoc, roundAndNumber.round).result
  )
  for (const roundPlayed of roundsPlayed) {
    const round = useFragment(PlayerRoundFragmentDoc, roundPlayed.round)
    if (round.result !== RoundResult.Won) {
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
                {sortedRounds.map((roundAndNumber, index) => {
                  const round = useFragment(PlayerRoundFragmentDoc, roundAndNumber.round)
                  let title = 'Life remaining'
                  if (round.result === RoundResult.Drew) {
                    title = `Life lost due to tie on round ${roundAndNumber.number}`
                  } else if (round.result === RoundResult.Lost) {
                    title = `Life lost due to loss on round ${roundAndNumber.number}`
                  }
                  return (
                    <div
                      key={index}
                      className={`game-round-token ${
                        round.result === RoundResult.Lost || round.result === RoundResult.Drew
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

/**
 * Information about the Faction the Deck belongs to for the Game player.
 */
function renderFaction({ faction }: { faction?: GameFactionFragmentFragment | null }) {
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

/**
 * Information about the Leader on the Deck for the Game player.
 */
function renderLeader({ leader }: { leader?: GameLeaderFragmentFragment | null }) {
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

/**
 * Information about the units in the Game for a player, and whether they have been drawn, are in hand, or have been lost.
 */
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

/**
 * Information about the Deck that was chosen to play for the Game.
 */
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
