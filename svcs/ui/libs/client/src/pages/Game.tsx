import {
  ApolloCache,
  ApolloError,
  ApolloQueryResult,
  DefaultContext,
  FetchResult,
  MutationFunctionOptions,
} from '@apollo/client'
import { CgArrowLongRight, CgChevronUp, CgChevronDown, CgPlayButton, CgSync, CgTime } from 'react-icons/cg'
import { createRef, RefObject } from 'react'
import { Link, NavigateFunction, useLocation, useNavigate } from 'react-router'

import {
  AddGameMutation,
  Deck,
  DeckUnit,
  Exact,
  GameDocument,
  GamePlayer,
  GamesDocument,
  GamesQuery,
  SetDeckMutation,
  User,
  useAddGameMutation,
  useGameQuery,
  useSetDeckMutation,
  useRedrawMutation,
  RedrawMutation,
  useGameDeckQuery,
  GameDeckDocument,
  Game,
  GameDeck,
  GameDeckQuery,
  GameStatus,
  useReadyMutation,
  ReadyMutation,
  Faction,
  Leader,
  Scalars,
  GameQuery,
  FactionKey,
  useSetOrderMutation,
  SetOrderMutation,
  InputMaybe,
  Combat,
  usePlayUnitMutation,
  PlayUnitMutation,
  usePlayPassMutation,
  PlayPassMutation,
  RoundResult,
  PlayerRound,
  GameUnit,
  Move,
} from '@gwent/graphql-schema/apollo-typings'
import addToCacheList from '../util/add-to-cache-list'
import Centered from '../components/Centered'
import { CheckAuth, getApolloError, retryCheckingAuth } from '../util/error-util'
import CoinToss from '../components/CoinToss'
import Confirm from '../components/Confirm'
import DeckEditor from '../components/DeckEditor'
import DeckList from '../components/DeckList'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import Form from '../components/Form'
import {
  GAME_ORDER_COIN_FLIP_DURATION_SECONDS,
  HTML_CLASSES,
  HTML_IDS,
  MAX_REDRAWS,
  NOT_AUTHORIZED_MESSAGE,
  PLAYER_COUNTS,
  ROUTES,
} from '@gwent/constants'
import { humanizeDay, humanizeTime, sortObjectArray, toTitleCase } from '@gwent/utils'
import LoadingBar from '../components/LoadingBar'
import LoadingSpinner from '../components/LoadingSpinner'
import UnitFullCard from '../components/UnitFullCard'
import UnitGameCard from '../components/UnitGameCard'
import updateGameDeckCacheOnRedraw from '../util/update-game-deck-cache-on-redraw'
import { usePrevious } from '../util/usePrevious'
import { useTitle } from '../components/TabTitle'
import { useUserContext } from '../App'
import WholeScreenDialog from '../components/WholeScreenDialog'
import './Game.css'

/**
 * A user created Game.
 *
 * @returns A users game.
 */
export default function GamePage() {
  useTitle('Game | Gwent')
  const [deckListOpen, setDeckListOpen] = useState(false)
  const [deckEditorOpen, setDeckEditorOpen] = useState(false)
  const [handCardSelected, setHandCardSelected] = useState<DeckUnit | undefined>()
  const [historyCardSelected, setHistoryCardSelected] = useState<UnitForPlayer | undefined>()
  const [fullUnit, setFullUnit] = useState<UnitForPlayer | undefined>()
  const [playerOrder, setPlayerOrder] = useState<GamePlayer[]>([])
  const [coinTossVisible, setCoinTossVisible] = useState(false)
  const [passConfirmationOpen, setPassConfirmationOpen] = useState(false)
  const { checkAuth, user } = useUserContext()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isNew = pathname.endsWith('/new')
  const gameId = pathname.substring(pathname.lastIndexOf('/') + 1)
  const gameQueryVariables = {
    id: gameId,
  }
  const gameDeckQueryVariables = {
    game: gameId,
  }
  const [addGame, { loading: addGameLoading, error: addGameError }] = useAddGameMutation({
    update(cache, { data }) {
      if (data?.addGame) {
        // need to manually update caches because Apollo does not automatically pick up additions
        cache.updateQuery<GamesQuery>(
          {
            query: GamesDocument,
          },
          (previous) => {
            if (previous?.games) {
              return {
                games: addToCacheList({
                  add: data.addGame,
                  previous: previous?.games,
                }),
              }
            }
          }
        )
        cache.updateQuery<GameQuery>(
          {
            query: GameDocument,
            variables: {
              id: data.addGame.id,
            },
          },
          (previous) => {
            if (!previous?.game) {
              return {
                game: data.addGame,
              }
            }
          }
        )
      }
    },
  })
  const {
    loading: gameLoading,
    error: gameError,
    data: gameData,
    refetch: gameRefetch,
  } = useGameQuery({
    onError: (error) => {
      checkAuth(error, gameRefetch)
    },
    onCompleted: (data) => {
      if (data.game) {
        if (data.game.players) {
          setPlayerOrder(data.game.players as GamePlayer[])
        }
      }
    },
    variables: gameQueryVariables,
    skip: isNew,
    notifyOnNetworkStatusChange: true, // fixes "loading" to work properly on refetch
  })
  const {
    loading: gameDeckLoading,
    error: gameDeckError,
    data: gameDeckData,
    refetch: gameDeckRefetch,
  } = useGameDeckQuery({
    onError: (error) => {
      checkAuth(error, gameDeckRefetch)
    },
    variables: gameDeckQueryVariables,
    nextFetchPolicy: 'cache-only', // prevents re-fetch after setDeck called
    skip: isNew,
    notifyOnNetworkStatusChange: true, // fixes "loading" to work properly on refetch
  })
  const [setDeck, { loading: setDeckLoading, error: setDeckError }] = useSetDeckMutation({
    update(cache, { data }) {
      if (data?.setDeck && user) {
        cache.updateQuery<GameDeckQuery>(
          {
            query: GameDeckDocument,
            variables: gameDeckQueryVariables,
          },
          (previous) => {
            if (!previous) {
              return {
                gameDeck: data.setDeck,
              }
            }
          }
        )
      }
    },
  })
  const [setOrder, { loading: setOrderLoading, error: setOrderError }] = useSetOrderMutation() // Apollo automatically handles cache changes on update
  const [redraw, { loading: redrawLoading, error: redrawError }] = useRedrawMutation({
    // need to manually update cache because the return type of "redraw" mutation (DeckUnit)
    // does not update underlying "game" query type (GameDeck) since they do not match
    update(cache, { data }) {
      if (data?.redraw && user && handCardSelected) {
        cache.updateQuery<GameDeckQuery>(
          {
            query: GameDeckDocument,
            variables: gameDeckQueryVariables,
          },
          (previous) =>
            updateGameDeckCacheOnRedraw({
              from: handCardSelected,
              previous,
              to: data.redraw as DeckUnit,
            })
        )
      }
    },
  })
  const [ready, { loading: readyLoading, error: readyError }] = useReadyMutation() // Apollo automatically handles cache changes on update
  const [playPass, { loading: playPassLoading, error: playPassError }] = usePlayPassMutation()
  const [playUnit, { loading: playUnitLoading, error: playUnitError }] = usePlayUnitMutation({
    update(cache, { data }) {
      if (data?.playUnit && user && handCardSelected) {
        cache.updateQuery<GameDeckQuery>(
          {
            query: GameDeckDocument,
            variables: gameDeckQueryVariables,
          },
          (previous) => {
            if (previous?.gameDeck) {
              return {
                gameDeck: {
                  ...previous.gameDeck,
                  hand: previous.gameDeck.hand.filter((deckUnit) => deckUnit.unit.id !== handCardSelected.unit.id),
                },
              }
            }
          }
        )
      }
    },
  })
  const currentGame = gameData?.game as Game | undefined
  const previousGame = usePrevious(currentGame)
  useEffect(() => {
    const self = currentGame?.players.find((player) => player.user.name === user?.name)
    if (currentGame?.status === GameStatus.Redrawing && previousGame?.status !== GameStatus.Redrawing && !self?.ready) {
      setCoinTossVisible(true)
      setTimeout(() => setCoinTossVisible(false), GAME_ORDER_COIN_FLIP_DURATION_SECONDS * 1000)
    }
  }, [currentGame])

  const historyRefs: {
    [key: string]: RefObject<HTMLDivElement | null>
  } = {}
  const movesByRounds: MoveForRound[] = []
  if (gameData?.game) {
    const game = gameData?.game
    for (let i = game.round - 1; i >= 0; i--) {
      const allPlayerMoves: PlayerMove[] = []
      for (let j = 0; j < game.players.length; j++) {
        for (let k = 0; k < game.players[j].rounds[i].moves.length; k++) {
          const refId = `${i}.${j}.${k}`
          const ref = createRef<HTMLDivElement>()
          historyRefs[refId] = ref
          allPlayerMoves.push({
            move: game.players[j].rounds[i].moves[k] as Move,
            playerIndex: j,
            ref,
          })
        }
      }
      movesByRounds.push({
        round: i + 1,
        playerMoves: sortObjectArray({
          array: allPlayerMoves,
          sortProperties: ['move.created'],
        }),
      })
    }
  }

  function scrollHistoryIntoView({ playerId, unit }: UnitForPlayer) {
    if (gameData?.game && playerId) {
      const game = gameData.game
      const roundIndex = game.round - 1
      const playerIndex = game.players.map((player) => player.user.id).indexOf(playerId)
      let moveIndex: number | undefined = undefined
      for (
        let i = game.players[playerIndex].rounds[roundIndex].moves.length - 1;
        i >= 0 && moveIndex === undefined;
        i--
      ) {
        const move = game.players[playerIndex].rounds[roundIndex].moves[i]
        if (move.__typename === 'MoveUnit' && move.unit.unit.id === unit.unit.id) {
          moveIndex = i
        }
      }
      if (moveIndex !== undefined) {
        const stringRefId = `${roundIndex}.${playerIndex}.${moveIndex}`
        historyRefs[stringRefId].current?.scrollIntoView()
      }
    }
  }

  return isNew
    ? renderNewGame({
        addGameProps: {
          addGame,
          error: addGameError,
          loading: addGameLoading,
        },
        checkAuth,
        navigate,
        user,
      })
    : renderExistingGame({
        checkAuth,
        coinTossVisible,
        deckEditorOpen,
        deckListOpen,
        fullUnit,
        gameDeckProps: {
          deck: gameDeckData?.gameDeck as GameDeck | undefined,
          error: gameDeckError,
          loading: gameDeckLoading,
          refetch: gameDeckRefetch,
        },
        gameProps: {
          game: currentGame,
          error: gameError,
          loading: gameLoading,
          refetch: gameRefetch,
        },
        handCardSelected,
        historyCardSelected,
        movesByRounds,
        navigate,
        passConfirmationOpen,
        playerOrder,
        playPassProps: {
          playPass,
          error: playPassError,
          loading: playPassLoading,
        },
        playUnitProps: {
          playUnit,
          error: playUnitError,
          loading: playUnitLoading,
        },
        readyProps: {
          ready,
          error: readyError,
          loading: readyLoading,
        },
        redrawProps: {
          redraw,
          error: redrawError,
          loading: redrawLoading,
        },
        scrollHistoryIntoView,
        setCoinTossVisible,
        setDeckEditorOpen,
        setDeckListOpen,
        setDeckProps: {
          setDeck,
          error: setDeckError,
          loading: setDeckLoading,
        },
        setFullUnit,
        setHandCardSelected,
        setHistoryCardSelected,
        setOrderProps: {
          setOrder,
          loading: setOrderLoading,
          error: setOrderError,
        },
        setPassConfirmationOpen,
        setPlayerOrder,
        user,
      })
}

function renderNewGame({
  addGameProps,
  checkAuth,
  navigate,
  user,
}: {
  addGameProps: AddGameProps
  checkAuth: CheckAuth
  navigate: NavigateFunction
  user: User | null | undefined
}) {
  return (
    <Centered>
      <Form
        id={HTML_IDS.GameNewContainer}
        title="New Game"
        autoFocusIndex={1}
        fields={[
          {
            key: 'player1',
            type: 'text',
            label: 'Player 1',
            required: true,
            default: user?.name,
            disabled: true,
          },
          ...[...Array(PLAYER_COUNTS.Max - 1)].map((_, index) => {
            const playerNumber = index + 2
            return {
              key: `player${playerNumber}`,
              type: 'text',
              label: `Player ${playerNumber}`,
              required: playerNumber <= PLAYER_COUNTS.Min,
              placeholder: 'Enter username',
              description: 'The username of another user to play against',
            }
          }),
        ]}
        errorPrefix="Error adding game"
        error={addGameProps.error}
        errorId={HTML_IDS.GameNewError}
        loading={addGameProps.loading}
        onSubmit={async ({ variables }) => {
          await retryCheckingAuth({
            checkAuth,
            method: async () => {
              const game = await addGameProps.addGame({
                variables: {
                  opponentNames: [...Array(PLAYER_COUNTS.Max - 1)].map((_, index) => {
                    return variables[`player${index + 2}`]
                  }),
                },
              })
              if (game.data?.addGame?.id) {
                navigate(ROUTES.Game.path.replace(':gameId', game.data.addGame.id))
              }
            },
          })
        }}
        submitLabel="Create"
        submitId={HTML_IDS.GameNewCreate}
        onClose={() => navigate(ROUTES.Games.path)}
        cancelId={HTML_IDS.GameNewCancel}
      />
    </Centered>
  )
}

// TODO: sort method params
function renderExistingGame({
  checkAuth,
  deckListOpen,
  setDeckListOpen,
  deckEditorOpen,
  setDeckEditorOpen,
  gameProps,
  setDeckProps,
  user,
  handCardSelected,
  setHandCardSelected,
  setOrderProps,
  redrawProps,
  gameDeckProps,
  readyProps,
  fullUnit,
  setFullUnit,
  playerOrder,
  setPlayerOrder,
  coinTossVisible,
  setCoinTossVisible,
  setPassConfirmationOpen,
  playUnitProps,
  playPassProps,
  passConfirmationOpen,
  navigate,
  historyCardSelected,
  setHistoryCardSelected,
  movesByRounds,
  scrollHistoryIntoView,
}: {
  checkAuth: CheckAuth
  deckListOpen: boolean
  setDeckListOpen: Dispatch<SetStateAction<boolean>>
  deckEditorOpen: boolean
  setDeckEditorOpen: Dispatch<SetStateAction<boolean>>
  setPassConfirmationOpen: Dispatch<SetStateAction<boolean>>
  gameProps: GameProps
  setDeckProps: SetDeckProps
  user: User | null | undefined
  handCardSelected: DeckUnit | undefined
  setHandCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  setOrderProps: SetOrderProps
  redrawProps: RedrawProps
  gameDeckProps: GameDeckProps
  readyProps: ReadyProps
  fullUnit: UnitForPlayer | undefined
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  playerOrder: GamePlayer[]
  setPlayerOrder: Dispatch<SetStateAction<GamePlayer[]>>
  coinTossVisible: boolean
  setCoinTossVisible: Dispatch<SetStateAction<boolean>>
  playUnitProps: PlayUnitProps
  playPassProps: PlayPassProps
  passConfirmationOpen: boolean
  navigate: NavigateFunction
  historyCardSelected: UnitForPlayer | undefined
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  movesByRounds: MoveForRound[]
  scrollHistoryIntoView: (args: UnitForPlayer) => void
}) {
  const { game } = gameProps
  const resolvedGameError = getApolloError(gameProps.error)
  const resolvedGameDeckError = getApolloError(gameDeckProps.error)
  let opponent: GamePlayer | undefined = undefined
  let self: GamePlayer | undefined = undefined
  if (game?.players && user?.name) {
    opponent = game.players.find((player) => player.user.id !== user.id)
    // need to user "user.name" instead of "user.id" to get self
    // because "user.id" is set to "AUTH_TIMEOUT_ID" when session times out
    // and would cause self not to be found here when user presented with opportunity to re-authorize
    self = game.players.find((player) => player.user.name === user.name)
  }

  const potentialUnitArrays: (DeckUnit[] | GameUnit[] | undefined)[] = [gameDeckProps.deck?.hand]
  if (game?.players && game.round > 0) {
    for (const gamePlayer of game.players) {
      if (!fullUnit?.playerId || fullUnit.playerId === gamePlayer.user.id) {
        const playerRound = gamePlayer.rounds[game.round - 1]
        potentialUnitArrays.push(playerRound.close.units)
        potentialUnitArrays.push(playerRound.ranged.units)
        potentialUnitArrays.push(playerRound.siege.units)
      }
    }
  }
  const { next: nextUnit, previous: previousUnit } = getNeighboringUnits({
    deckUnit: fullUnit?.unit,
    arrays: potentialUnitArrays,
  })

  return gameProps.loading || gameDeckProps.loading ? (
    <Centered>
      <LoadingSpinner size="50px" />
    </Centered>
  ) : resolvedGameError === NOT_AUTHORIZED_MESSAGE ? (
    <Centered>
      <div id={HTML_IDS.GameAuthErrorContainer}>
        <h2>Not Authorized</h2>
        <div id="gameAuthErrorMessage">You do not have access to this game, or it does not exist.</div>
        <Link to={ROUTES.Games.path} id={HTML_IDS.GameAuthErrorViewGames}>
          View Games
        </Link>
      </div>
    </Centered>
  ) : resolvedGameError || !game ? (
    <Centered>
      <div className={HTML_CLASSES.ErrorText}>{`Error getting game: ${resolvedGameError}`}</div>
    </Centered>
  ) : !opponent ? (
    <Centered>
      <div className={HTML_CLASSES.ErrorText}>{`Error opponent from game: ${JSON.stringify(game)}`}</div>
    </Centered>
  ) : !self ? (
    <Centered>
      <div className={HTML_CLASSES.ErrorText}>{`Error getting self from game: ${JSON.stringify(game)}`}</div>
    </Centered>
  ) : resolvedGameDeckError ? (
    <Centered>
      <div className={HTML_CLASSES.ErrorText}>{`Error getting game deck: ${resolvedGameDeckError}`}</div>
    </Centered>
  ) : (
    <div id={HTML_IDS.GameContainer}>
      <UnitFullCard
        fullUnit={fullUnit?.unit as DeckUnit}
        hasNext={nextUnit !== undefined}
        hasPrevious={previousUnit !== undefined}
        onSelect={() => {}}
        onPrevious={() => {
          if (previousUnit) {
            setFullUnit({
              unit: previousUnit,
              playerId: fullUnit?.playerId,
            })
            setHandCardSelected(previousUnit)
            setHistoryCardSelected(undefined)
          }
        }}
        onNext={() => {
          if (nextUnit) {
            setFullUnit({
              unit: nextUnit,
              playerId: fullUnit?.playerId,
            })
            setHandCardSelected(nextUnit)
            setHistoryCardSelected(undefined)
          }
        }}
        onClose={() => {
          setFullUnit(undefined)
          setHandCardSelected(undefined)
          setHistoryCardSelected(undefined)
        }}
      />
      <Confirm
        title="Pass Round"
        id={HTML_IDS.GamePassConfirmContainer}
        message="Are you sure you wish to pass? You will not be able to play any more units the rest of this round."
        error={playPassProps.error}
        loading={playPassProps.loading}
        onClose={() => setPassConfirmationOpen(false)}
        open={passConfirmationOpen}
        onSubmit={async () => {
          await retryCheckingAuth({
            checkAuth,
            method: async () => {
              await playPassProps.playPass({
                variables: {
                  game: game.id,
                },
              })
              setPassConfirmationOpen(false)
            },
          })
        }}
        submitVariables={{
          game: game.id,
        }}
      />
      <div id="gameContainerUpper">
        {renderGameInfo({
          handCardSelected,
          gameProps,
          opponent,
          self,
          gameDeckProps: gameDeckProps,
          coinTossVisible,
          setPassConfirmationOpen,
          playUnitLoading: playUnitProps.loading,
          playPassLoading: playPassProps.loading,
        })}
        {renderCenter({
          handCardSelected,
          checkAuth,
          game,
          gameDeck: gameDeckProps.deck,
          self,
          opponent,
          readyProps: readyProps,
          redrawProps: redrawProps,
          setDeckListOpen,
          setDeckProps,
          setFullUnit,
          setHandCardSelected,
          setOrderProps: setOrderProps,
          playerOrder,
          setPlayerOrder,
          coinTossVisible,
          setCoinTossVisible,
          playUnitProps,
          navigate,
          historyCardSelected,
          setHistoryCardSelected,
          scrollHistoryIntoView,
        })}
        {renderHistory({
          handCardSelected,
          playPassProps,
          playUnitProps,
          game,
          self,
          setHandCardSelected,
          historyCardSelected,
          setHistoryCardSelected,
          movesByRounds,
        })}
      </div>
      <div id="gameContainerLower">
        {renderHand({
          hand: gameDeckProps.deck?.hand,
          handCardSelected,
          setHandCardSelected,
          setFullUnit,
          isTurn: game.turn?.user.name === self.user.name,
          playUnitLoading: playUnitProps.loading,
          gameStatus: game.status,
          setHistoryCardSelected,
        })}
      </div>
      {(deckListOpen || deckEditorOpen) && (
        <WholeScreenDialog
          onClose={() => {
            if (deckEditorOpen) {
              setDeckEditorOpen(false)
            } else {
              setDeckListOpen(false)
            }
          }}
        >
          <div id="gameDeckOverlay">
            {deckListOpen ? (
              <DeckList
                actionsDisabled={setDeckProps.loading}
                onCreate={() => {
                  setDeckListOpen(false)
                  setDeckEditorOpen(true)
                }}
                onClose={() => setDeckListOpen(false)}
                actions={[
                  {
                    icon: CgPlayButton,
                    onClick: async (deck: Deck) => {
                      setDeckListOpen(false)
                      await retryCheckingAuth({
                        checkAuth,
                        method: async () => {
                          await setDeckProps.setDeck({
                            variables: {
                              deck: deck.id,
                              game: game.id,
                            },
                          })
                        },
                      })
                    },
                    className: 'deck-list-action-set-for-game',
                    title: 'Select For Game',
                  },
                ]}
              />
            ) : (
              <DeckEditor
                onCancel={() => setDeckEditorOpen(false)}
                onSave={async (deck) => {
                  await retryCheckingAuth({
                    checkAuth,
                    method: async () => {
                      setDeckEditorOpen(false)
                      await setDeckProps.setDeck({
                        variables: {
                          deck: deck.id,
                          game: game.id,
                        },
                      })
                    },
                  })
                }}
              />
            )}
          </div>
        </WholeScreenDialog>
      )}
    </div>
  )
}

function getNeighboringUnits({
  deckUnit,
  arrays,
}: {
  deckUnit: DeckUnit | GameUnit | undefined
  arrays: (DeckUnit[] | GameUnit[] | undefined)[]
}): NeighborUnits {
  let previous: DeckUnit | undefined = undefined
  let next: DeckUnit | undefined = undefined
  if (deckUnit !== undefined) {
    let found = false
    for (let i = 0; i < arrays.length && !found; i++) {
      const array = arrays[i]
      if (array) {
        const sortedArray = sortObjectArray({
          sortProperties: ['unit.strength', 'unit.id'],
          array,
        })
        const unitIds = sortedArray.map((arrayDeckUnit) => arrayDeckUnit.unit.id)
        if (unitIds?.includes(deckUnit.unit.id)) {
          found = true
          const deckUnitIndex = sortedArray.findIndex((arrayDeckUnit) => arrayDeckUnit.unit.id === deckUnit.unit.id)
          next = sortedArray[deckUnitIndex + 1] as DeckUnit
          previous = sortedArray[deckUnitIndex - 1] as DeckUnit
        }
      }
    }
  }

  return {
    previous,
    next,
  }
}

function renderGameInfo({
  handCardSelected,
  self,
  opponent,
  gameProps,
  gameDeckProps,
  coinTossVisible,
  setPassConfirmationOpen,
  playUnitLoading,
  playPassLoading,
}: {
  handCardSelected: DeckUnit | undefined
  self: GamePlayer
  opponent: GamePlayer
  gameProps: GameProps
  gameDeckProps: GameDeckProps
  coinTossVisible: boolean
  setPassConfirmationOpen: Dispatch<SetStateAction<boolean>>
  playUnitLoading: boolean
  playPassLoading: boolean
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

function renderSharedInfo({ gameProps, gameDeckProps }: { gameProps: GameProps; gameDeckProps: GameDeckProps }) {
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
  handCardSelected,
  id,
  player,
  game,
  faction,
  undrawn,
  hand,
  discard,
  leader,
  deckName,
  deckUpdated,
  isSelf,
  coinTossVisible,
  setPassConfirmationOpen,
  playUnitLoading,
  playPassLoading,
}: {
  handCardSelected: DeckUnit | undefined
  id: string
  player: GamePlayer
  game: Game
  faction?: Faction | null
  undrawn?: number
  hand?: number
  discard?: number
  leader?: Leader | null
  deckName?: string
  deckUpdated?: Date
  isSelf: boolean
  coinTossVisible: boolean
  setPassConfirmationOpen: Dispatch<SetStateAction<boolean>>
  playUnitLoading: boolean
  playPassLoading: boolean
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
  handCardSelected,
  player,
  game,
  isSelf,
  isTurn,
  setPassConfirmationOpen,
  playUnitLoading,
  playPassLoading,
}: {
  handCardSelected: DeckUnit | undefined
  player: GamePlayer
  game: Game
  isSelf: boolean
  isTurn?: boolean | null | undefined
  setPassConfirmationOpen: Dispatch<SetStateAction<boolean>>
  playUnitLoading: boolean
  playPassLoading: boolean
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

function renderDeckInfo({ undrawn, hand, discard }: { undrawn?: number; hand?: number; discard?: number }) {
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

function renderCenter({
  handCardSelected,
  checkAuth,
  game,
  gameDeck,
  self,
  opponent,
  readyProps,
  redrawProps,
  setDeckListOpen,
  setDeckProps,
  setFullUnit,
  setHandCardSelected,
  setOrderProps,
  playerOrder,
  setPlayerOrder,
  coinTossVisible,
  setCoinTossVisible,
  playUnitProps,
  navigate,
  historyCardSelected,
  setHistoryCardSelected,
  scrollHistoryIntoView,
}: {
  game: Game
  gameDeck: GameDeck | undefined
  self: GamePlayer
  opponent: GamePlayer
  handCardSelected: DeckUnit | undefined
  checkAuth: CheckAuth
  redrawProps: RedrawProps
  readyProps: ReadyProps
  setDeckListOpen: Dispatch<SetStateAction<boolean>>
  setDeckProps: SetDeckProps
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  setOrderProps: SetOrderProps
  playerOrder: GamePlayer[]
  setPlayerOrder: Dispatch<SetStateAction<GamePlayer[]>>
  coinTossVisible: boolean
  setCoinTossVisible: Dispatch<SetStateAction<boolean>>
  playUnitProps: PlayUnitProps
  navigate: NavigateFunction
  historyCardSelected: UnitForPlayer | undefined
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  scrollHistoryIntoView: (args: UnitForPlayer) => void
}) {
  return (
    <div id={HTML_IDS.GameCenterContainer}>
      {game.status === GameStatus.Decking
        ? renderSetDeck({
            alreadySet: !!gameDeck?.from,
            game,
            setDeckProps,
            setDeckListOpen,
          })
        : game.status === GameStatus.Ordering
        ? renderSetOrder({
            checkAuth,
            game,
            self,
            setOrderProps: setOrderProps,
            playerOrder,
            setPlayerOrder,
          })
        : game.status === GameStatus.Redrawing
        ? renderRedraw({
            handCardSelected,
            checkAuth,
            game,
            gameDeck,
            readyProps,
            redrawProps,
            setFullUnit,
            setHandCardSelected,
            self,
            coinTossVisible,
            setCoinTossVisible,
          })
        : game.status === GameStatus.Playing
        ? renderBattlefield({
            handCardSelected,
            playUnitProps: playUnitProps,
            checkAuth,
            game,
            self,
            opponent,
            setFullUnit,
            setHandCardSelected,
            historyCardSelected,
            setHistoryCardSelected,
            scrollHistoryIntoView,
          })
        : renderGameSummary({
            game,
            navigate,
          })}
    </div>
  )
}

function renderBattlefield({
  handCardSelected,
  playUnitProps,
  checkAuth,
  game,
  self,
  setFullUnit,
  opponent,
  setHandCardSelected,
  historyCardSelected,
  setHistoryCardSelected,
  scrollHistoryIntoView,
}: {
  game: Game
  handCardSelected: DeckUnit | undefined
  playUnitProps: PlayUnitProps
  checkAuth: CheckAuth
  self: GamePlayer
  opponent: GamePlayer
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  historyCardSelected: UnitForPlayer | undefined
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  scrollHistoryIntoView: (args: UnitForPlayer) => void
}) {
  const rowsToHighlight = (handCardSelected && handCardSelected.unit.combats) || []
  const rowsToBlock = []
  if (rowsToHighlight.length > 0) {
    if (!rowsToHighlight.includes(Combat.Close)) {
      rowsToBlock.push(Combat.Close)
    }
    if (!rowsToHighlight.includes(Combat.Ranged)) {
      rowsToBlock.push(Combat.Ranged)
    }
    if (!rowsToHighlight.includes(Combat.Siege)) {
      rowsToBlock.push(Combat.Siege)
    }
  }
  const isTurn = game.turn?.user.name === self.user.name
  const selfPassed = self.rounds[game.round - 1].passed
  const opponentPassed = opponent.rounds[game.round - 1].passed
  const sharedProps = {
    handCardSelected,
    playUnitProps,
    checkAuth,
    game,
    isTurn,
    setFullUnit,
    setHandCardSelected,
    historyCardSelected,
    setHistoryCardSelected,
    scrollHistoryIntoView,
  }
  return (
    <>
      <div
        className={`${HTML_CLASSES.GameUnitBoardSide} ${
          opponentPassed ? HTML_CLASSES.GameUnitBoardSidePassed : ''
        } game-section`}
        title={opponentPassed ? 'Your oppponent has passed the rest of this round' : ''}
      >
        {renderCombatRow({
          ...sharedProps,
          player: opponent,
          combat: Combat.Siege,
        })}
        {renderCombatRow({
          ...sharedProps,
          player: opponent,
          combat: Combat.Ranged,
        })}
        {renderCombatRow({
          ...sharedProps,
          player: opponent,
          combat: Combat.Close,
        })}
      </div>
      <div
        className={`${HTML_CLASSES.GameUnitBoardSide} ${
          selfPassed ? HTML_CLASSES.GameUnitBoardSidePassed : ''
        } game-section`}
        title={selfPassed ? 'You have passed the rest of this round' : ''}
      >
        {renderCombatRow({
          ...sharedProps,
          player: self,
          isSelf: true,
          combat: Combat.Close,
        })}
        {renderCombatRow({
          ...sharedProps,
          isSelf: true,
          player: self,
          combat: Combat.Ranged,
        })}
        {renderCombatRow({
          ...sharedProps,
          player: self,
          isSelf: true,
          combat: Combat.Siege,
        })}
      </div>
    </>
  )
}

function renderCombatRow({
  game,
  handCardSelected,
  combat,
  playUnitProps,
  checkAuth,
  player,
  isTurn,
  isSelf,
  setFullUnit,
  setHandCardSelected,
  historyCardSelected,
  setHistoryCardSelected,
  scrollHistoryIntoView,
}: {
  game: Game
  handCardSelected: DeckUnit | undefined
  combat: Combat
  playUnitProps: PlayUnitProps
  checkAuth: CheckAuth
  player: GamePlayer
  isTurn?: boolean
  isSelf?: boolean
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  historyCardSelected: UnitForPlayer | undefined
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  scrollHistoryIntoView: (args: UnitForPlayer) => void
}) {
  const titledCombat = toTitleCase(combat)
  const validRow =
    isSelf && handCardSelected && handCardSelected.unit.combats && handCardSelected.unit.combats.includes(combat)
  const invalidRow =
    handCardSelected && handCardSelected.unit.combats && !handCardSelected.unit.combats.includes(combat)
  let description = `${titledCombat} combat row`
  if (handCardSelected) {
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
    sortProperties: ['unit.strength', 'unit.name', 'unit.id'],
  })
  let id = ''
  if (combat === Combat.Close) {
    id = isSelf ? HTML_IDS.GameCombatRowCloseSelf : HTML_IDS.GameCombatRowCloseOpponent
  } else if (combat === Combat.Ranged) {
    id = isSelf ? HTML_IDS.GameCombatRowRangedSelf : HTML_IDS.GameCombatRowRangedOpponent
  } else {
    id = isSelf ? HTML_IDS.GameCombatRowSiegeSelf : HTML_IDS.GameCombatRowSiegeOpponent
  }

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
          cursor: validRow && isTurn ? 'pointer' : handCardSelected ? 'not-allowed' : 'default',
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
        {sortedUnits.map((gameUnit) => {
          const selectedInHistory =
            historyCardSelected &&
            historyCardSelected.unit.unit.id === gameUnit.unit.id &&
            historyCardSelected.playerId === player.user.id

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
                    const unitForPlayer: UnitForPlayer = {
                      playerId: player.user.id,
                      unit: gameUnit,
                    }
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
                selected={gameUnit.unit.id === handCardSelected?.unit.id || selectedInHistory}
                dotted={!isTurn && !selectedInHistory}
                onFullscreen={() =>
                  setFullUnit({
                    unit: gameUnit,
                    playerId: player.user.id,
                  })
                }
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function renderSetDeck({
  alreadySet,
  game,
  setDeckProps,
  setDeckListOpen,
}: {
  alreadySet: boolean
  game: Game
  setDeckProps: SetDeckProps
  setDeckListOpen: Dispatch<SetStateAction<boolean>>
}) {
  const resolvedSetDeckError = getApolloError(setDeckProps.error)
  return (
    <div id="gameSetDeckContainer" className="game-section">
      <Centered>
        {alreadySet ? (
          <div className="waiting-container">
            <div>{`Waiting for opponent${game.players.length > 2 ? 's' : ''} to choose deck...`}</div>
            <LoadingBar height="25px" />
          </div>
        ) : setDeckProps.loading ? (
          <LoadingSpinner size="100px" title="Choosing Deck..." />
        ) : (
          <div className="game-set-deck">
            <button id={HTML_IDS.GameSetDeck} type="button" onClick={() => setDeckListOpen(true)}>
              Choose Deck
            </button>
            {resolvedSetDeckError && (
              <span
                id={HTML_IDS.GameDeckError}
                className={HTML_CLASSES.ErrorText}
              >{`Error choosing deck: ${resolvedSetDeckError}`}</span>
            )}
          </div>
        )}
      </Centered>
    </div>
  )
}

function renderSetOrder({
  checkAuth,
  game,
  self,
  setOrderProps,
  playerOrder,
  setPlayerOrder,
}: {
  checkAuth: CheckAuth
  game: Game
  self: GamePlayer
  setOrderProps: SetOrderProps
  playerOrder: GamePlayer[]
  setPlayerOrder: Dispatch<SetStateAction<GamePlayer[]>>
}) {
  const resolvedSetOrderError = getApolloError(setOrderProps.error)
  const scoiaTaelDecks = game.players.filter((player) => player.faction?.key === FactionKey.ScoiaTael).length
  const canSetOrder = scoiaTaelDecks !== 1 || self.faction?.key === FactionKey.ScoiaTael
  const canChooseOrder =
    game.players.filter((player) => player.faction?.key === FactionKey.ScoiaTael).length === 1 &&
    self.faction?.key === FactionKey.ScoiaTael

  return (
    <div id={HTML_IDS.GameOrderContainer} className="game-section">
      <Centered>
        {setOrderProps.loading ? (
          <LoadingSpinner size="50px" />
        ) : canSetOrder ? (
          <div id="gameSetOrderContainer">
            {canChooseOrder && (
              <table id={HTML_IDS.GameOrderTable}>
                <caption id="gameSetOrderTitle">Set player turn order:</caption>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Username</th>
                  </tr>
                </thead>
                <tbody>
                  {playerOrder.map((player, index) => (
                    <tr key={player.user.id}>
                      <td className={HTML_CLASSES.GameOrderRowIndex}>
                        <div className="game-set-order-ordering">
                          {index > 0 && (
                            <div
                              className={`pointable ${HTML_CLASSES.GameOrderRowEarlier}`}
                              title="Move Earlier"
                              onClick={() => {
                                const newOrder = [...playerOrder]
                                newOrder[index] = playerOrder[index - 1]
                                newOrder[index - 1] = playerOrder[index]
                                setPlayerOrder(newOrder)
                              }}
                            >
                              <CgChevronUp color="black" />
                            </div>
                          )}
                          {index < playerOrder.length - 1 && (
                            <div
                              className={`pointable ${HTML_CLASSES.GameOrderRowLater}`}
                              title="Move Later"
                              onClick={() => {
                                const newOrder = [...playerOrder]
                                newOrder[index] = playerOrder[index + 1]
                                newOrder[index + 1] = playerOrder[index]
                                setPlayerOrder(newOrder)
                              }}
                            >
                              <CgChevronDown color="black" />
                            </div>
                          )}
                          {index + 1}
                        </div>
                      </td>
                      <td className={HTML_CLASSES.GameOrderRowUsername}>{player.user.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              id={HTML_IDS.GameOrderSet}
              type="button"
              className="pointable"
              onClick={async () => {
                await retryCheckingAuth({
                  checkAuth,
                  method: async () => {
                    await setOrderProps.setOrder({
                      variables: {
                        game: game.id,
                        users: canChooseOrder ? playerOrder.map((player) => player.user.id) : [],
                      },
                    })
                  },
                })
              }}
            >
              Set Order
            </button>
            {resolvedSetOrderError && (
              <span
                id={HTML_IDS.GameOrderError}
                className={HTML_CLASSES.ErrorText}
              >{`Error setting order: ${resolvedSetOrderError}`}</span>
            )}
          </div>
        ) : (
          <div className="waiting-container">
            <div id={HTML_IDS.GameOrderWaiting}>{`Waiting for opponent${
              game.players.length > 2 ? 's' : ''
            } to set turn order...`}</div>
            <LoadingBar height="25px" />
          </div>
        )}
      </Centered>
    </div>
  )
}

function renderCoinToss({
  setCoinTossVisible,
  winFlip,
}: {
  setCoinTossVisible: Dispatch<SetStateAction<boolean>>
  winFlip: boolean
}) {
  const resultText = winFlip ? 'You will go first' : 'Your opponent will go first'
  return (
    <div id={HTML_IDS.GameOrderCoinToss} className="game-section pointable" onClick={() => setCoinTossVisible(false)}>
      <Centered>
        <CoinToss
          duration={`${GAME_ORDER_COIN_FLIP_DURATION_SECONDS - 1}s`}
          heads={winFlip}
          size="100px"
          bounce={true}
          resultText={resultText}
        />
      </Centered>
    </div>
  )
}

function renderRedraw({
  handCardSelected,
  checkAuth,
  redrawProps,
  game,
  gameDeck,
  readyProps,
  setFullUnit,
  setHandCardSelected,
  self,
  coinTossVisible,
  setCoinTossVisible,
}: {
  game: Game
  gameDeck: GameDeck | undefined
  handCardSelected: DeckUnit | undefined
  checkAuth: CheckAuth
  redrawProps: RedrawProps
  readyProps: ReadyProps
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  self: GamePlayer
  coinTossVisible: boolean
  setCoinTossVisible: Dispatch<SetStateAction<boolean>>
}) {
  const redrawsLeft = MAX_REDRAWS - (gameDeck?.redraws || []).length
  const instructions =
    redrawsLeft > 0
      ? `Optionally select up to ${redrawsLeft} card${
          redrawsLeft > 1 ? 's' : ''
        } from your hand to redraw. When satisfied with deck:`
      : 'All allowed redraws made. To begin the game:'
  const resolvedRedrawError = getApolloError(redrawProps.error)
  const resolvedReadyError = getApolloError(readyProps.error)
  return coinTossVisible ? (
    renderCoinToss({
      setCoinTossVisible,
      winFlip: game.turn?.user.name === self.user.name, // go off of name instead of id, because id gets set to AUTH_TIMEOUT_ID when auth times out
    })
  ) : (
    <div id={HTML_IDS.GameRedrawContainer} className="game-section">
      {self.ready ? (
        <div className="waiting-container">
          <div>{`Waiting for opponent${game.players.length > 2 ? 's' : ''} to be ready...`}</div>
          <LoadingBar height="25px" />
        </div>
      ) : gameDeck ? (
        <>
          <div className="game-deck-redraw-cards">
            {[...Array(MAX_REDRAWS)].map((_, index) => {
              const fromCard = (
                index < gameDeck.redraws.length && gameDeck.redraws[index].from
                  ? gameDeck.redraws[index].from
                  : handCardSelected
              ) as DeckUnit
              const toCard = (gameDeck.redraws.length >= index + 1 && gameDeck.redraws[index].to) as DeckUnit
              const handIds = gameDeck.hand.map((deckUnit) => deckUnit.unit.id)
              return (
                <div className="game-deck-redraw-card-container" key={index}>
                  {index < gameDeck.redraws.length || (index === gameDeck.redraws.length && redrawProps.loading) ? (
                    <div className={HTML_CLASSES.GameDeckRedrawPair}>
                      <UnitGameCard
                        deckUnit={fromCard}
                        cursor={'unset'}
                        onFullscreen={() => {
                          setFullUnit({
                            unit: fromCard,
                            playerId: self.user.id,
                          })
                          if (handIds.includes(fromCard.unit.id)) {
                            setHandCardSelected(fromCard)
                          }
                        }}
                      />
                      <CgArrowLongRight color="black" title="Redrawn to" />
                      {index < gameDeck.redraws.length ? (
                        <UnitGameCard
                          deckUnit={toCard}
                          cursor={'unset'}
                          onFullscreen={() => {
                            setFullUnit({
                              unit: toCard,
                              playerId: self.user.id,
                            })
                            if (handIds.includes(toCard.unit.id)) {
                              setHandCardSelected(toCard)
                            }
                          }}
                        />
                      ) : (
                        <div className="game-deck-redraw-card" title="Redrawing card...">
                          <Centered>
                            <LoadingSpinner size="50px" />
                          </Centered>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`${HTML_CLASSES.GameDeckRedrawCard} ${
                        handCardSelected && index === gameDeck.redraws.length
                          ? `${HTML_CLASSES.ItemHighlighted} game-deck-redraw-available`
                          : 'game-deck-redraw-unavailable'
                      }`}
                      title={
                        handCardSelected && index === gameDeck.redraws.length
                          ? 'Place here to redraw'
                          : !handCardSelected
                          ? 'Select card from hand to redraw'
                          : ''
                      }
                      onClick={async () => {
                        if (handCardSelected && index === gameDeck.redraws.length) {
                          await retryCheckingAuth({
                            checkAuth,
                            method: async () => {
                              await redrawProps.redraw({
                                variables: {
                                  unit: handCardSelected.unit.id,
                                  game: game.id,
                                },
                              })
                              setHandCardSelected(undefined)
                            },
                          })
                        }
                      }}
                    ></div>
                  )}
                </div>
              )
            })}
          </div>
          {resolvedRedrawError && (
            <div
              id={HTML_IDS.GameRedrawError}
              className={HTML_CLASSES.ErrorText}
            >{`Error redrawing card: ${resolvedRedrawError}`}</div>
          )}
          <div className="game-deck-redraw-lower">
            {readyProps.loading ? (
              <LoadingBar height="25px" />
            ) : (
              <span id={HTML_IDS.GameDeckRedrawInstructions}>{instructions}</span>
            )}
            <button
              id={HTML_IDS.GameReady}
              type="button"
              disabled={readyProps.loading}
              onClick={async () => {
                await retryCheckingAuth({
                  checkAuth,
                  method: async () => {
                    await readyProps.ready({
                      variables: {
                        game: game.id,
                      },
                    })
                  },
                })
              }}
            >
              Ready to Play
            </button>
            {resolvedReadyError && (
              <div
                id={HTML_IDS.GameReadyError}
                className={HTML_CLASSES.ErrorText}
              >{`Error marking self as ready: ${resolvedReadyError}`}</div>
            )}
          </div>
        </>
      ) : (
        <Centered>
          <img src="images/stats/strength.png" title="Battlefield" className="game-battlefield-icon" />
        </Centered>
      )}
    </div>
  )
}

function renderHand({
  hand,
  handCardSelected,
  setHandCardSelected,
  setFullUnit,
  isTurn,
  playUnitLoading,
  gameStatus,
  setHistoryCardSelected,
}: {
  hand: DeckUnit[] | undefined
  handCardSelected: DeckUnit | undefined
  setHandCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  isTurn: boolean
  playUnitLoading: boolean
  gameStatus: GameStatus
  setHistoryCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
}) {
  const sortedUnits = !hand
    ? []
    : sortObjectArray({
        sortProperties: ['unit.strength', 'unit.id'],
        array: hand,
      })
  return (
    <div id="gameHandContainer">
      <div id={HTML_IDS.GameHand} className="game-section">
        {!hand && !isTurn ? (
          <Centered>
            <img src="images/stats/units.png" title="Hand" className={HTML_CLASSES.GameHandIcon} />
          </Centered>
        ) : (!hand || hand.length === 0) && isTurn ? (
          <Centered>
            <span id={HTML_IDS.gameHandNoUnitsLeft}>
              You have no units left in your hand. Either activate your Leader ability or Pass.
            </span>
          </Centered>
        ) : (
          sortedUnits.map((deckUnit) => {
            const selected = deckUnit.unit.id === handCardSelected?.unit.id
            const notSelected = handCardSelected?.unit.id && !selected
            let title = deckUnit.unit.name
            let cursor = 'pointer'
            if (playUnitLoading && handCardSelected) {
              if (handCardSelected.unit.id === deckUnit.unit.id) {
                title = `Waiting for ${handCardSelected.unit.name} to be deployed to the battlefield`
              } else {
                title = `Cannot select other units while waiting for ${handCardSelected.unit.name} to be deployed`
                cursor = 'not-allowed'
              }
            }

            return (
              <div
                className={`${HTML_CLASSES.GameHandCardWrapper} ${selected ? 'game-hand-card-wrapper-selected' : ''}`}
                key={deckUnit.unit.id}
                onClick={() => {
                  if (!playUnitLoading) {
                    setHandCardSelected(selected ? undefined : deckUnit)
                    setHistoryCardSelected(undefined)
                  }
                }}
              >
                <UnitGameCard
                  cursor={cursor}
                  deckUnit={deckUnit}
                  selected={deckUnit.unit.id === handCardSelected?.unit.id}
                  dotted={gameStatus === GameStatus.Playing && !isTurn}
                  title={title}
                  onFullscreen={() =>
                    setFullUnit({
                      unit: deckUnit,
                      playerId: undefined,
                    })
                  }
                />
                {notSelected && <div title={title} className={HTML_CLASSES.GameHandCardWrapperNotSelected}></div>}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function renderGameSummary({ game, navigate }: { game: Game; navigate: NavigateFunction }) {
  const victorNames = game.victors.map((victor) => victor.name)
  const victoryText = `Congratulations to the victor${victorNames.length > 1 ? 's' : ''}:`
  return (
    <div id={HTML_IDS.GameSummaryContainer} className="game-section">
      <div id={HTML_IDS.GameSummaryVictorsContainer}>
        <span id={HTML_IDS.GameSummaryCongratulations}>{victoryText}</span>
        <div id={HTML_IDS.GameSummaryVictorsList}>
          {victorNames.map((victorName, index) => (
            <span key={index}>{victorName}</span>
          ))}
        </div>
      </div>
      <table id={HTML_IDS.GameSummaryRoundBreakdown}>
        <caption>Breakdown of round by score:</caption>
        <thead>
          <tr>
            <th>User</th>
            {Array.from(Array(game.round), (_, i) => i + 1).map((index) => (
              <th key={index}>Round {index}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {game.players.map((player, playerIndex) => (
            <tr key={playerIndex} className={HTML_CLASSES.GameSummaryVictorRow}>
              <td className="game-victor-username">{player.user.name}</td>
              {player.rounds.map((round, roundIndex) => (
                <td
                  className={`${HTML_CLASSES.GameSummaryVictorRound} ${
                    round.result === RoundResult.Won
                      ? HTML_CLASSES.GameSummaryRoundWon
                      : HTML_CLASSES.GameSummaryRoundLost
                  }`}
                  key={roundIndex}
                >
                  {round.score}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button id={HTML_IDS.GameSummaryGames} type="button" onClick={() => navigate(ROUTES.Games.path)}>
        Back to Games
      </button>
    </div>
  )
}

function renderHistory({
  movesByRounds,
  handCardSelected,
  game,
  playPassProps,
  playUnitProps,
  self,
  setHandCardSelected,
  historyCardSelected,
  setHistoryCardSelected,
}: {
  movesByRounds: MoveForRound[]
  handCardSelected: DeckUnit | undefined
  game: Game
  playPassProps: PlayPassProps
  playUnitProps: PlayUnitProps
  self: GamePlayer
  setHandCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  historyCardSelected: UnitForPlayer | undefined
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
                  description = `${playerMove.move.unit.unit.name} deployed as ${toTitleCase(playerMove.move.row)}`
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

interface NeighborUnits {
  previous: DeckUnit | undefined
  next: DeckUnit | undefined
}

interface AddGameProps {
  addGame: (
    options?:
      | MutationFunctionOptions<
          AddGameMutation,
          Exact<{
            opponentNames: string | string[]
          }>,
          DefaultContext,
          ApolloCache<any> // eslint-disable-line @typescript-eslint/no-explicit-any
        >
      | undefined
  ) => Promise<FetchResult<AddGameMutation>>
  loading: boolean
  error: ApolloError | undefined
}

interface GameProps {
  game: Game | undefined
  error: ApolloError | undefined
  loading: boolean
  refetch: (
    variables?:
      | Partial<
          Exact<{
            id: Scalars['ID']['input']
          }>
        >
      | undefined
  ) => Promise<ApolloQueryResult<GameQuery>>
}

interface GameDeckProps {
  deck: GameDeck | undefined
  error: ApolloError | undefined
  loading: boolean
  refetch: (
    variables?:
      | Partial<
          Exact<{
            game: Scalars['ID']['input']
          }>
        >
      | undefined
  ) => Promise<ApolloQueryResult<GameDeckQuery>>
}

interface SetDeckProps {
  setDeck: (
    options?:
      | MutationFunctionOptions<
          SetDeckMutation,
          Exact<{
            game: string
            deck: string
          }>,
          DefaultContext,
          ApolloCache<any> // eslint-disable-line @typescript-eslint/no-explicit-any
        >
      | undefined
  ) => Promise<FetchResult<SetDeckMutation>>
  loading: boolean
  error: ApolloError | undefined
}

interface SetOrderProps {
  setOrder: (
    options?:
      | MutationFunctionOptions<
          SetOrderMutation,
          Exact<{
            game: Scalars['ID']['input']
            users?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>
          }>,
          DefaultContext,
          ApolloCache<any> // eslint-disable-line @typescript-eslint/no-explicit-any
        >
      | undefined
  ) => Promise<FetchResult<SetOrderMutation>>
  loading: boolean
  error: ApolloError | undefined
}

interface RedrawProps {
  redraw: (
    options?:
      | MutationFunctionOptions<
          RedrawMutation,
          Exact<{
            game: string
            unit: string
          }>,
          DefaultContext,
          ApolloCache<any> // eslint-disable-line @typescript-eslint/no-explicit-any
        >
      | undefined
  ) => Promise<FetchResult<RedrawMutation>>
  error: ApolloError | undefined
  loading: boolean
}

interface ReadyProps {
  ready: (
    options?:
      | MutationFunctionOptions<
          ReadyMutation,
          Exact<{
            game: string
          }>,
          DefaultContext,
          ApolloCache<any> // eslint-disable-line @typescript-eslint/no-explicit-any
        >
      | undefined
  ) => Promise<FetchResult<ReadyMutation>>
  error: ApolloError | undefined
  loading: boolean
}

interface PlayUnitProps {
  playUnit: (
    options?:
      | MutationFunctionOptions<
          PlayUnitMutation,
          Exact<{
            game: Scalars['ID']['input']
            unit: Scalars['ID']['input']
            combat: Combat
          }>,
          DefaultContext,
          ApolloCache<any> // eslint-disable-line @typescript-eslint/no-explicit-any
        >
      | undefined
  ) => Promise<FetchResult<PlayUnitMutation>>
  error: ApolloError | undefined
  loading: boolean
}

interface PlayPassProps {
  playPass: (
    options?:
      | MutationFunctionOptions<
          PlayPassMutation,
          Exact<{
            game: Scalars['ID']['input']
          }>,
          DefaultContext,
          ApolloCache<any> // eslint-disable-line @typescript-eslint/no-explicit-any
        >
      | undefined
  ) => Promise<FetchResult<PlayPassMutation>>
  error: ApolloError | undefined
  loading: boolean
}

interface UnitForPlayer {
  unit: DeckUnit | GameUnit
  playerId: string | undefined
}

interface PlayerMove {
  move: Move
  playerIndex: number
  ref: RefObject<HTMLDivElement | null>
}

interface MoveForRound {
  round: number
  playerMoves: PlayerMove[]
}
