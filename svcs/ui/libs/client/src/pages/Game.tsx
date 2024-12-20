import {
  ApolloCache,
  ApolloError,
  ApolloQueryResult,
  DefaultContext,
  FetchResult,
  MutationFunctionOptions,
} from '@apollo/client'
import { CgArrowLongRight, CgChevronUp, CgChevronDown, CgPlayButton, CgSync, CgTime } from 'react-icons/cg'
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
import CoinToss from '../components/CoinToss'
import Confirm from '../components/Confirm'
import DeckEditor from '../components/DeckEditor'
import DeckList from '../components/DeckList'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import Form from '../components/Form'
import { formatDay, formatTime, sortObjectArray, toTitleCase } from '@gwent/utils'
import { getApolloError, retryCheckingAuth } from '../util/error-util'
import {
  GAME_ORDER_COIN_FLIP_DURATION_SECONDS,
  HTML_CLASSES,
  HTML_IDS,
  MAX_REDRAWS,
  NOT_AUTHORIZED_MESSAGE,
  PLAYER_COUNTS,
  ROUTES,
} from '@gwent/constants'
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

interface UnitForPlayer {
  unit: DeckUnit | GameUnit
  playerId: string | undefined
}

/**
 * A user created Game.
 *
 * @returns A users game.
 */
export default function GamePage() {
  useTitle('Game | Gwent')
  const [deckListOpen, setDeckListOpen] = useState(false)
  const [deckEditorOpen, setDeckEditorOpen] = useState(false)
  const [cardSelected, setCardSelected] = useState<DeckUnit | undefined>()
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
      if (data?.redraw && user && cardSelected) {
        cache.updateQuery<GameDeckQuery>(
          {
            query: GameDeckDocument,
            variables: gameDeckQueryVariables,
          },
          (previous) =>
            updateGameDeckCacheOnRedraw({
              from: cardSelected,
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
      if (data?.playUnit && user && cardSelected) {
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
                  hand: previous.gameDeck.hand.filter((deckUnit) => deckUnit.unit.id !== cardSelected.unit.id),
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

  return isNew
    ? renderNewGame({
        addGame: {
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
        deckListOpen,
        setDeckListOpen,
        deckEditorOpen,
        setDeckEditorOpen,
        gameError,
        game: currentGame,
        gameLoading,
        setDeck: {
          setDeck,
          error: setDeckError,
          loading: setDeckLoading,
        },
        user,
        cardSelected,
        setCardSelected,
        setOrder: {
          setOrder,
          loading: setOrderLoading,
          error: setOrderError,
        },
        redraw: {
          redraw,
          redrawError,
          redrawLoading,
        },
        gameDeck: gameDeckData?.gameDeck as GameDeck | undefined,
        gameDeckError,
        gameDeckLoading,
        ready: {
          ready,
          readyError,
          readyLoading,
        },
        fullUnit,
        setFullUnit,
        gameRefetch,
        gameDeckRefetch,
        playerOrder,
        setPlayerOrder,
        coinTossVisible,
        setCoinTossVisible,
        playUnit: {
          playUnit,
          playUnitError,
          playUnitLoading,
        },
        playPass: {
          playPass,
          playPassError,
          playPassLoading,
        },
        setPassConfirmationOpen,
        passConfirmationOpen,
        navigate,
      })
}

function renderNewGame({
  addGame: { addGame, error: addGameError, loading: addGameLoading },
  checkAuth,
  navigate,
  user,
}: {
  addGame: AddGameProps
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  checkAuth: (error: ApolloError | undefined, callbackAfterReauth: Function) => void
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
        error={addGameError}
        errorId={HTML_IDS.GameNewError}
        loading={addGameLoading}
        onSubmit={async ({ variables }) => {
          await retryCheckingAuth({
            checkAuth,
            method: async () => {
              const game = await addGame({
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

function renderExistingGame({
  checkAuth,
  deckListOpen,
  setDeckListOpen,
  deckEditorOpen,
  setDeckEditorOpen,
  gameError,
  game,
  gameLoading,
  setDeck: { setDeck, error: setDeckError, loading: setDeckLoading },
  user,
  cardSelected,
  setCardSelected,
  setOrder,
  redraw,
  gameDeck,
  gameDeckError,
  gameDeckLoading,
  ready,
  fullUnit,
  setFullUnit,
  gameRefetch,
  gameDeckRefetch,
  playerOrder,
  setPlayerOrder,
  coinTossVisible,
  setCoinTossVisible,
  setPassConfirmationOpen,
  playUnit,
  playPass: { playPass, playPassError, playPassLoading },
  passConfirmationOpen,
  navigate,
}: {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  checkAuth: (error: ApolloError | undefined, callbackAfterReauth: Function) => void
  deckListOpen: boolean
  setDeckListOpen: Dispatch<SetStateAction<boolean>>
  deckEditorOpen: boolean
  setDeckEditorOpen: Dispatch<SetStateAction<boolean>>
  setPassConfirmationOpen: Dispatch<SetStateAction<boolean>>
  game: Game | undefined
  gameError: ApolloError | undefined
  gameLoading: boolean
  setDeck: SetDeckProps
  user: User | null | undefined
  cardSelected: DeckUnit | undefined
  setCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  setOrder: SetOrderProps
  redraw: RedrawProps
  gameDeck: GameDeck | undefined
  gameDeckError: ApolloError | undefined
  gameDeckLoading: boolean
  ready: ReadyProps
  fullUnit: UnitForPlayer | undefined
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  gameRefetch: (
    variables?:
      | Partial<
          Exact<{
            id: Scalars['ID']['input']
          }>
        >
      | undefined
  ) => Promise<ApolloQueryResult<GameQuery>>
  gameDeckRefetch: (
    variables?:
      | Partial<
          Exact<{
            game: Scalars['ID']['input']
          }>
        >
      | undefined
  ) => Promise<ApolloQueryResult<GameDeckQuery>>
  playerOrder: GamePlayer[]
  setPlayerOrder: Dispatch<SetStateAction<GamePlayer[]>>
  coinTossVisible: boolean
  setCoinTossVisible: Dispatch<SetStateAction<boolean>>
  playUnit: PlayUnitProps
  playPass: PlayPassProps
  passConfirmationOpen: boolean
  navigate: NavigateFunction
}) {
  const resolvedGameError = getApolloError(gameError)
  const resolvedGameDeckError = getApolloError(gameDeckError)
  let opponent: GamePlayer | undefined = undefined
  let self: GamePlayer | undefined = undefined
  if (game?.players && user?.name) {
    opponent = game.players.find((player) => player.user.id !== user.id)
    // need to user "user.name" instead of "user.id" to get self
    // because "user.id" is set to "AUTH_TIMEOUT_ID" when session times out
    // and would cause self not to be found here when user presented with opportunity to re-authorize
    self = game.players.find((player) => player.user.name === user.name)
  }

  const potentialUnitArrays: (DeckUnit[] | GameUnit[] | undefined)[] = [gameDeck?.hand]
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

  return gameLoading || gameDeckLoading ? (
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
            setCardSelected(previousUnit)
          }
        }}
        onNext={() => {
          if (nextUnit) {
            setFullUnit({
              unit: nextUnit,
              playerId: fullUnit?.playerId,
            })
            setCardSelected(nextUnit)
          }
        }}
        onClose={() => {
          setFullUnit(undefined)
          setCardSelected(undefined)
        }}
      />
      <Confirm
        title="Pass Round"
        id="gamePass"
        message="Are you sure you wish to pass? You will not be able to play any more units the rest of this round."
        error={playPassError}
        loading={playPassLoading}
        onClose={() => setPassConfirmationOpen(false)}
        open={passConfirmationOpen}
        onSubmit={async () => {
          await retryCheckingAuth({
            checkAuth,
            method: async () => {
              await playPass({
                variables: {
                  game: game.id,
                },
              })
            },
          })
        }}
        submitVariables={{
          game: game.id,
        }}
      />
      <div id="gameContainerUpper">
        {renderGameInfo({
          cardSelected,
          game,
          opponent,
          self,
          gameDeck,
          gameLoading,
          gameDeckLoading,
          gameRefetch,
          gameDeckRefetch,
          coinTossVisible,
          setPassConfirmationOpen,
          playUnitLoading: playUnit.playUnitLoading,
          playPassLoading,
        })}
        {renderCenter({
          cardSelected,
          checkAuth,
          game,
          gameDeck,
          self,
          opponent,
          ready,
          redraw,
          setDeckListOpen,
          setDeck: {
            setDeck,
            error: setDeckError,
            loading: setDeckLoading,
          },
          setFullUnit,
          setCardSelected,
          setOrder,
          playerOrder,
          setPlayerOrder,
          coinTossVisible,
          setCoinTossVisible,
          playUnit,
          navigate,
        })}
        {renderHistory({
          cardSelected,
          playPassLoading,
          playUnitLoading: playUnit.playUnitLoading,
          game,
          self,
        })}
      </div>
      <div id="gameContainerLower">
        {renderHand({
          hand: gameDeck?.hand,
          cardSelected,
          setCardSelected,
          setFullUnit,
          isTurn: game.turn?.user.name === self.user.name,
          playUnitLoading: playUnit.playUnitLoading,
          gameStatus: game.status,
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
                actionsDisabled={setDeckLoading}
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
                          await setDeck({
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
                      await setDeck({
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

interface NeighborUnits {
  previous: DeckUnit | undefined
  next: DeckUnit | undefined
}

function renderGameInfo({
  cardSelected,
  self,
  opponent,
  game,
  gameDeck,
  gameLoading,
  gameDeckLoading,
  gameRefetch,
  gameDeckRefetch,
  coinTossVisible,
  setPassConfirmationOpen,
  playUnitLoading,
  playPassLoading,
}: {
  cardSelected: DeckUnit | undefined
  self: GamePlayer
  opponent: GamePlayer
  game: Game
  gameDeck: GameDeck | undefined
  gameLoading: boolean
  gameDeckLoading: boolean
  gameRefetch: (
    variables?:
      | Partial<
          Exact<{
            id: Scalars['ID']['input']
          }>
        >
      | undefined
  ) => Promise<ApolloQueryResult<GameQuery>>
  gameDeckRefetch: (
    variables?:
      | Partial<
          Exact<{
            game: Scalars['ID']['input']
          }>
        >
      | undefined
  ) => Promise<ApolloQueryResult<GameDeckQuery>>
  coinTossVisible: boolean
  setPassConfirmationOpen: Dispatch<SetStateAction<boolean>>
  playUnitLoading: boolean
  playPassLoading: boolean
}) {
  return (
    <div id="gameInfoContainer" className="game-edge-container">
      {renderPlayerInfo({
        cardSelected,
        game,
        id: HTML_IDS.GameInfoOpponentContainer,
        player: opponent,
        isSelf: false,
        faction: opponent.faction,
        discard: opponent.counts?.discard,
        hand: opponent.counts?.hand,
        undrawn: opponent.counts?.undrawn,
        leader: opponent.leader,
        coinTossVisible,
        setPassConfirmationOpen,
        playUnitLoading,
        playPassLoading,
      })}
      {renderSharedInfo({
        game,
        gameLoading,
        gameDeckLoading,
        gameRefetch,
        gameDeckRefetch,
      })}
      {renderPlayerInfo({
        cardSelected,
        game,
        id: HTML_IDS.GameInfoSelfContainer,
        player: self,
        isSelf: true,
        faction: gameDeck?.from?.faction,
        leader: gameDeck?.from?.leader,
        discard: gameDeck?.discard.length,
        hand: gameDeck?.hand.length,
        undrawn: gameDeck?.undrawn.length,
        deckName: gameDeck?.from?.name,
        deckUpdated: gameDeck?.from?.created,
        coinTossVisible,
        setPassConfirmationOpen,
        playUnitLoading,
        playPassLoading,
      })}
    </div>
  )
}

function renderSharedInfo({
  game,
  gameDeckLoading,
  gameLoading,
  gameRefetch,
  gameDeckRefetch,
}: {
  game: Game
  gameLoading: boolean
  gameDeckLoading: boolean
  gameRefetch: (
    variables?:
      | Partial<
          Exact<{
            id: Scalars['ID']['input']
          }>
        >
      | undefined
  ) => Promise<ApolloQueryResult<GameQuery>>
  gameDeckRefetch: (
    variables?:
      | Partial<
          Exact<{
            game: Scalars['ID']['input']
          }>
        >
      | undefined
  ) => Promise<ApolloQueryResult<GameDeckQuery>>
}) {
  return (
    <div id="gameInfoSharedContainer">
      <div id="gameInfoSharedDetails" className="game-section">
        {game.status === GameStatus.Playing && (
          <div>
            <span>Round:</span>
            <span>{game.round}</span>
          </div>
        )}
        <div
          id={HTML_IDS.GameRefresh}
          className={game.status === GameStatus.Playing ? 'playing' : 'decking'}
          style={{ cursor: gameLoading || gameDeckLoading ? 'not-allowed' : 'pointer' }}
          title="Refresh"
          onClick={async () =>
            !gameLoading && !gameDeckLoading && (await Promise.all([gameRefetch(), gameDeckRefetch()]))
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
  cardSelected,
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
  cardSelected: DeckUnit | undefined
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
        title = isSelf ? 'You will have the first turn' : 'Your opponent will go first this round'
      } else {
        title = isSelf ? 'Your opponent will have the first turn' : 'Your opponent will go after you this round'
      }
    }
    if (isTurn) {
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
          cardSelected,
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
  cardSelected,
  player,
  game,
  isSelf,
  isTurn,
  setPassConfirmationOpen,
  playUnitLoading,
  playPassLoading,
}: {
  cardSelected: DeckUnit | undefined
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
          cardSelected?.unit.name || 'unit'
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
                        ? 'game-round-token-lost'
                        : HTML_CLASSES.GamePlayerRoundTokenWon
                    }`}
                    title={title}
                  ></div>
                )
              })}
            </div>
          </div>
          {playerRound &&
            (playerRound.passed ? (
              <span className="game-player-passed " title={passTitle}>
                Passed
              </span>
            ) : (
              isSelf &&
              game.status === GameStatus.Playing && (
                <button
                  id={HTML_IDS.DeckEditorCancel}
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
      </div>
      <div className="game-score-container" style={{ borderColor: winning ? '#267402' : 'darkgray' }}>
        {playerRound && (
          <span className={HTML_CLASSES.GamePlayerScore} title="Score for the current round">
            {playerRound.score}
          </span>
        )}
      </div>
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
        <span>Deck</span>
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
      <div className={HTML_CLASSES.GamePlayerDeckDate} title="When deck was last updated before choosing">{`${formatDay(
        isoString
      )} @ ${formatTime(isoString)}`}</div>
    </div>
  )
}

function renderCenter({
  cardSelected,
  checkAuth,
  game,
  gameDeck,
  self,
  opponent,
  ready,
  redraw,
  setDeckListOpen,
  setDeck,
  setFullUnit,
  setCardSelected,
  setOrder,
  playerOrder,
  setPlayerOrder,
  coinTossVisible,
  setCoinTossVisible,
  playUnit,
  navigate,
}: {
  game: Game
  gameDeck: GameDeck | undefined
  self: GamePlayer
  opponent: GamePlayer
  cardSelected: DeckUnit | undefined
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  checkAuth: (error: ApolloError | undefined, callbackAfterReauth: Function) => void
  redraw: RedrawProps
  ready: ReadyProps
  setDeckListOpen: Dispatch<SetStateAction<boolean>>
  setDeck: SetDeckProps
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  setOrder: SetOrderProps
  playerOrder: GamePlayer[]
  setPlayerOrder: Dispatch<SetStateAction<GamePlayer[]>>
  coinTossVisible: boolean
  setCoinTossVisible: Dispatch<SetStateAction<boolean>>
  playUnit: PlayUnitProps
  navigate: NavigateFunction
}) {
  return (
    <div id={HTML_IDS.GameCenterContainer}>
      {game.status === GameStatus.Decking
        ? renderSetDeck({
            alreadySet: !!gameDeck?.from,
            game,
            setDeck,
            setDeckListOpen,
          })
        : game.status === GameStatus.Ordering
        ? renderSetOrder({
            checkAuth,
            game,
            self,
            setOrder,
            playerOrder,
            setPlayerOrder,
          })
        : game.status === GameStatus.Redrawing
        ? renderRedraw({
            cardSelected,
            checkAuth,
            game,
            gameDeck,
            ready,
            redraw,
            setFullUnit,
            setCardSelected,
            self,
            coinTossVisible,
            setCoinTossVisible,
          })
        : game.status === GameStatus.Playing
        ? renderBattlefield({
            cardSelected,
            playUnit,
            checkAuth,
            game,
            self,
            opponent,
            setFullUnit,
            setCardSelected,
          })
        : renderGameSummary({
            game,
            navigate,
          })}
    </div>
  )
}

function renderBattlefield({
  cardSelected,
  playUnit,
  checkAuth,
  game,
  self,
  setFullUnit,
  opponent,
  setCardSelected,
}: {
  game: Game
  cardSelected: DeckUnit | undefined
  playUnit: PlayUnitProps
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  checkAuth: (error: ApolloError | undefined, callbackAfterReauth: Function) => void
  self: GamePlayer
  opponent: GamePlayer
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
}) {
  const rowsToHighlight = (cardSelected && cardSelected.unit.combats) || []
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
  const props = {
    cardSelected,
    playUnit,
    checkAuth,
    game,
    isTurn,
    setFullUnit,
    setCardSelected,
  }
  return (
    <>
      <div className={`${HTML_CLASSES.GameUnitBoardSide} game-section`}>
        {renderCombatRow({
          ...props,
          player: opponent,
          combat: Combat.Siege,
        })}
        {renderCombatRow({
          ...props,
          player: opponent,
          combat: Combat.Ranged,
        })}
        {renderCombatRow({
          ...props,
          player: opponent,
          combat: Combat.Close,
        })}
      </div>
      <div className={`${HTML_CLASSES.GameUnitBoardSide} game-section`}>
        {renderCombatRow({
          ...props,
          player: self,
          isSelf: true,
          combat: Combat.Close,
        })}
        {renderCombatRow({
          ...props,
          isSelf: true,
          player: self,
          combat: Combat.Ranged,
        })}
        {renderCombatRow({
          ...props,
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
  cardSelected,
  combat,
  playUnit: { playUnit },
  checkAuth,
  player,
  isTurn,
  isSelf,
  setFullUnit,
  setCardSelected,
}: {
  game: Game
  cardSelected: DeckUnit | undefined
  combat: Combat
  playUnit: PlayUnitProps
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  checkAuth: (error: ApolloError | undefined, callbackAfterReauth: Function) => void
  player: GamePlayer
  isTurn?: boolean
  isSelf?: boolean
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
}) {
  const titledCombat = toTitleCase(combat)
  const validRow = isSelf && cardSelected && cardSelected.unit.combats && cardSelected.unit.combats.includes(combat)
  const invalidRow = cardSelected && cardSelected.unit.combats && !cardSelected.unit.combats.includes(combat)
  let description = `${titledCombat} combat row`
  if (cardSelected) {
    if (isSelf) {
      if (validRow) {
        if (isTurn) {
          description = `Place here for ${cardSelected.unit.name} to fight as a ${titledCombat} unit`
        } else {
          description = 'It is not your turn to play'
        }
      } else if (invalidRow) {
        description = `${cardSelected.unit.name} is not eligible to fight as a ${titledCombat} unit`
      }
    } else {
      description = `${cardSelected.unit.name} cannot fight for your opponent`
    }
  }
  const playerRound = player.rounds[game.round - 1]
  const playerRow =
    combat === Combat.Close ? playerRound.close : combat === Combat.Ranged ? playerRound.ranged : playerRound.siege
  const sortedUnits = sortObjectArray({
    array: playerRow.units,
    sortProperties: ['unit.strength', 'unit.id'],
  })

  return (
    <div className="game-unit-board-combat-row">
      <div className="game-unit-board-combat-icon-score">
        <img
          className="game-unit-combat-row-icon"
          src={`images/combats/${combat.toLocaleLowerCase()}.png`}
          title={titledCombat}
        />
        <div>{playerRow.score}</div>
      </div>
      <div
        className={`game-sub-section game-unit-combat-row-cards ${
          validRow ? `${HTML_CLASSES.ItemHighlighted} game-unit-combat-row-valid` : ''
        } ${!isTurn || invalidRow ? 'game-unit-combat-row-invalid' : ''}`}
        style={{
          cursor: validRow && isTurn ? 'pointer' : cardSelected ? 'not-allowed' : 'default',
          borderStyle: validRow ? (isTurn ? 'solid' : 'dotted') : 'none',
        }}
        title={description}
        onClick={async () => {
          if (isSelf && isTurn && cardSelected?.unit && validRow) {
            await retryCheckingAuth({
              checkAuth,
              method: async () => {
                await playUnit({
                  variables: {
                    game: game.id,
                    combat: combat,
                    unit: cardSelected?.unit.id,
                  },
                })
                setCardSelected(undefined)
              },
            })
          }
        }}
      >
        {sortedUnits.map((gameUnit) => {
          return (
            <UnitGameCard
              key={gameUnit.unit.id}
              deckUnit={{
                artStyle: gameUnit.artStyle,
                unit: gameUnit.unit,
              }}
              selected={gameUnit.unit.id === cardSelected?.unit.id}
              dotted={!isTurn}
              onFullscreen={() =>
                setFullUnit({
                  unit: gameUnit,
                  playerId: player.user.id,
                })
              }
              cursor="default"
            />
          )
        })}
      </div>
    </div>
  )
}

function renderSetDeck({
  alreadySet,
  game,
  setDeck: { error: setDeckError, loading: setDeckLoading },
  setDeckListOpen,
}: {
  alreadySet: boolean
  game: Game
  setDeck: SetDeckProps
  setDeckListOpen: Dispatch<SetStateAction<boolean>>
}) {
  const resolvedSetDeckError = getApolloError(setDeckError)
  return (
    <div id="gameSetDeckContainer" className="game-section">
      <Centered>
        {alreadySet ? (
          <div className="waiting-container">
            <div>{`Waiting for opponent${game.players.length > 2 ? 's' : ''} to choose deck...`}</div>
            <LoadingBar height="25px" />
          </div>
        ) : setDeckLoading ? (
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
  setOrder: { setOrder, error: setOrderError, loading: setOrderLoading },
  playerOrder,
  setPlayerOrder,
}: {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  checkAuth: (error: ApolloError | undefined, callbackAfterReauth: Function) => void
  game: Game
  self: GamePlayer
  setOrder: SetOrderProps
  playerOrder: GamePlayer[]
  setPlayerOrder: Dispatch<SetStateAction<GamePlayer[]>>
}) {
  const resolvedSetOrderError = getApolloError(setOrderError)
  const scoiaTaelDecks = game.players.filter((player) => player.faction?.key === FactionKey.ScoiaTael).length
  const canSetOrder = scoiaTaelDecks !== 1 || self.faction?.key === FactionKey.ScoiaTael
  const canChooseOrder =
    game.players.filter((player) => player.faction?.key === FactionKey.ScoiaTael).length === 1 &&
    self.faction?.key === FactionKey.ScoiaTael

  return (
    <div id={HTML_IDS.GameOrderContainer} className="game-section">
      <Centered>
        {setOrderLoading ? (
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
                    await setOrder({
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
  cardSelected,
  checkAuth,
  redraw: { redraw, redrawError, redrawLoading },
  game,
  gameDeck,
  ready: { ready, readyError, readyLoading },
  setFullUnit,
  setCardSelected,
  self,
  coinTossVisible,
  setCoinTossVisible,
}: {
  game: Game
  gameDeck: GameDeck | undefined
  cardSelected: DeckUnit | undefined
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  checkAuth: (error: ApolloError | undefined, callbackAfterReauth: Function) => void
  redraw: RedrawProps
  ready: ReadyProps
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
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
  const resolvedRedrawError = getApolloError(redrawError)
  const resolvedReadyError = getApolloError(readyError)
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
                  : cardSelected
              ) as DeckUnit
              const toCard = (gameDeck.redraws.length >= index + 1 && gameDeck.redraws[index].to) as DeckUnit
              const handIds = gameDeck.hand.map((deckUnit) => deckUnit.unit.id)
              return (
                <div className="game-deck-redraw-card-container" key={index}>
                  {index < gameDeck.redraws.length || (index === gameDeck.redraws.length && redrawLoading) ? (
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
                            setCardSelected(fromCard)
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
                              setCardSelected(toCard)
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
                        cardSelected && index === gameDeck.redraws.length
                          ? `${HTML_CLASSES.ItemHighlighted} game-deck-redraw-available`
                          : 'game-deck-redraw-unavailable'
                      }`}
                      title={
                        cardSelected && index === gameDeck.redraws.length
                          ? 'Place here to redraw'
                          : !cardSelected
                          ? 'Select card from hand to redraw'
                          : ''
                      }
                      onClick={async () => {
                        if (cardSelected && index === gameDeck.redraws.length) {
                          await retryCheckingAuth({
                            checkAuth,
                            method: async () => {
                              await redraw({
                                variables: {
                                  unit: cardSelected.unit.id,
                                  game: game.id,
                                },
                              })
                              setCardSelected(undefined)
                            },
                          })
                        }
                      }}
                    ></div>
                  )}
                  {index < MAX_REDRAWS - 1 && <div></div>}
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
            {readyLoading ? (
              <LoadingBar height="25px" />
            ) : (
              <span id={HTML_IDS.GameDeckRedrawInstructions}>{instructions}</span>
            )}
            <button
              id={HTML_IDS.GameReady}
              type="button"
              disabled={readyLoading}
              onClick={async () => {
                await retryCheckingAuth({
                  checkAuth,
                  method: async () => {
                    await ready({
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
  cardSelected,
  setCardSelected,
  setFullUnit,
  isTurn,
  playUnitLoading,
  gameStatus,
}: {
  hand: DeckUnit[] | undefined
  cardSelected: DeckUnit | undefined
  setCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  setFullUnit: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  isTurn: boolean
  playUnitLoading: boolean
  gameStatus: GameStatus
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
            <span>You have no units left in your hand. Either use your Leader ability or Pass.</span>
          </Centered>
        ) : (
          sortedUnits.map((deckUnit, index) => {
            const selected = deckUnit.unit.id === cardSelected?.unit.id
            const notSelected = cardSelected?.unit.id && !selected
            let title = deckUnit.unit.name
            let cursor = 'pointer'
            if (playUnitLoading && cardSelected) {
              if (cardSelected.unit.id === deckUnit.unit.id) {
                title = `Waiting for ${cardSelected.unit.name} to be deployed to the battlefield`
              } else {
                title = `Cannot select other units while waiting for ${cardSelected.unit.name} to be deployed`
                cursor = 'not-allowed'
              }
            }

            return (
              <div
                className={`game-card-wrapper ${selected ? 'game-card-wrapper-selected' : ''}`}
                key={deckUnit.unit.id}
                onClick={() => {
                  if (!playUnitLoading) {
                    setCardSelected(selected ? undefined : deckUnit)
                  }
                }}
                style={index === sortedUnits.length - 1 ? { marginRight: '-18px' } : {}}
              >
                <UnitGameCard
                  cursor={cursor}
                  deckUnit={deckUnit}
                  selected={deckUnit.unit.id === cardSelected?.unit.id}
                  dotted={gameStatus === GameStatus.Playing && !isTurn}
                  title={title}
                  onFullscreen={() =>
                    setFullUnit({
                      unit: deckUnit,
                      playerId: undefined,
                    })
                  }
                />
                {notSelected && <div title={title} className="game-card-wrapper-not-selected"></div>}
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
    <div id="gameSummaryContainer" className="game-section">
      <div>
        <span>{victoryText}</span>
        <div id="gameVictors">
          {victorNames.map((victorName, index) => (
            <span key={index}>{victorName}</span>
          ))}
        </div>
      </div>
      <table id="gameVictorBreakdown">
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
            <tr key={playerIndex}>
              <td className="game-victor-username">{player.user.name}</td>
              {player.rounds.map((round, roundIndex) => (
                <td
                  className="game-victor-round-score"
                  key={roundIndex}
                  style={{ borderColor: round.result === RoundResult.Won ? '#267402' : '#970014' }}
                >
                  {round.score}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button id="gamesSummaryGames" type="button" onClick={() => navigate(ROUTES.Games.path)}>
        Back to Games
      </button>
    </div>
  )
}

interface PlayerMove {
  move: Move
  playerIndex: number
}

function renderHistory({
  cardSelected,
  game,
  playPassLoading,
  playUnitLoading,
  self,
}: {
  cardSelected: DeckUnit | undefined
  game: Game
  playPassLoading: boolean
  playUnitLoading: boolean
  self: GamePlayer
}) {
  const movesByRounds: {
    round: number
    playerMove: PlayerMove[]
  }[] = []
  for (let i = game.round - 1; i >= 0; i--) {
    const allPlayerMoves: PlayerMove[] = []
    for (let j = 0; j < game.players.length; j++) {
      allPlayerMoves.push(
        ...game.players[j].rounds[i].moves.map((move) => {
          return {
            move,
            playerIndex: j,
          }
        })
      )
    }
    movesByRounds.push({
      round: i + 1,
      playerMove: sortObjectArray({
        array: allPlayerMoves,
        sortProperties: ['move.created'],
      }),
    })
  }
  const showLoading = game.turn?.user.name !== self.user.name || playUnitLoading || playPassLoading
  const loadingTitle = playUnitLoading
    ? `Waiting for ${cardSelected?.unit.name || 'unit'} to be deployed to the battlefield`
    : playPassLoading
    ? 'Waiting for Pass to be recognized on the battlefield'
    : 'Waiting for opponent to make their move'
  return (
    <div className="game-edge-container game-section">
      {game.round === 0 ? (
        <Centered classname="game-history-placeholder">
          <CgTime color="black" className={HTML_CLASSES.GameHistoryIcon} title="History" />
        </Centered>
      ) : (
        <div id="gameHistoryContainer">
          {movesByRounds.map((movesByRound) => (
            <div className="game-history-round-container" key={movesByRound.round}>
              <div className="game-history-round-name">Round {movesByRound.round}</div>
              {movesByRound.playerMove.map((playerMove, index) => {
                const gamePlayer = game.players[playerMove.playerIndex]
                const isSelf = gamePlayer.user.name === self.user.name
                const textClass = `game-history-move-text ${
                  isSelf ? 'game-history-move-text-self' : 'game-history-move-text-opponent'
                }`
                let description = ''
                let image = ''
                let imageTitle = ''
                let error = false
                if (playerMove.move.__typename === 'MoveLeader') {
                  description = `Activated leader ${playerMove.move.leader.name} ability`
                  image = playerMove.move.leader.image
                } else if (playerMove.move.__typename === 'MovePass') {
                  description = `Passed the rest of round ${movesByRound.round}`
                } else if (playerMove.move.__typename === 'MoveUnit') {
                  description = `${playerMove.move.unit.unit.name} deployed as ${toTitleCase(playerMove.move.row)}`
                  image = playerMove.move.unit.unit.images[playerMove.move.unit.artStyle - 1]
                  imageTitle = playerMove.move.unit.unit.name
                } else {
                  description = `Invalid move type: "${playerMove.move.__typename}"`
                  error = true
                }
                return (
                  <div
                    key={`r${movesByRound.round}-i${index}`}
                    className={`game-history-move ${isSelf ? 'game-history-move-self' : 'game-history-move-opponent'}`}
                  >
                    <div className="game-history-move-image-container-outer">
                      <div className="game-history-move-image-container-inner">
                        {image && <img className="game-history-move-image" src={image} title={imageTitle} />}
                      </div>
                    </div>
                    <div className="game-history-move-user-description">
                      <div className={`${textClass} game-history-move-username`}>{gamePlayer.user.name}</div>
                      <div className={`${textClass} ${error ? 'error-text' : ''}`}>{description}</div>
                    </div>
                  </div>
                )
              })}
              {showLoading && (
                <div className="game-history-loading-container">
                  <LoadingSpinner size="100px" title={loadingTitle} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
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
  redrawError: ApolloError | undefined
  redrawLoading: boolean
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
  readyError: ApolloError | undefined
  readyLoading: boolean
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
  playUnitError: ApolloError | undefined
  playUnitLoading: boolean
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
  playPassError: ApolloError | undefined
  playPassLoading: boolean
}
