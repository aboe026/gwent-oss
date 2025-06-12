import { CgPlayButton } from 'react-icons/cg'
import { createRef, RefObject } from 'react'
import { Link, useLocation } from 'react-router'

import addToCacheList from '../../util/add-to-cache-list'
import Centered from '../../components/Centered'
import { CheckAuth, getApolloError, retryCheckingAuth } from '../../util/error-util'
import Confirm from '../../components/Confirm'
import {
  Deck,
  DeckUnit,
  GameDocument,
  GamePlayer,
  GamesDocument,
  GamesQuery,
  User,
  useAddGameMutation,
  useGameQuery,
  useSetDeckMutation,
  useRedrawMutation,
  useGameDeckQuery,
  GameDeckDocument,
  Game,
  GameDeck,
  GameDeckQuery,
  GameStatus,
  useReadyMutation,
  GameQuery,
  useSetOrderMutation,
  usePlayUnitMutation,
  usePlayPassMutation,
  GameUnit,
  Move,
} from '@gwent/graphql-schema/apollo-typings'
import DeckEditor from '../../components/DeckEditor'
import DeckList from '../../components/DeckList'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import GameBattlefield from './GameBattlefield'
import {
  GameDeckProps,
  GameProps,
  MoveForRound,
  PlayerMove,
  PlayPassProps,
  PlayUnitProps,
  ReadyProps,
  RedrawProps,
  SetDeckProps,
  SetOrderProps,
  UnitForPlayer,
} from './GameProps'
import GameHand from './GameHand'
import GameHistory from './GameHistory'
import GameInfo from './GameInfo'
import GameRedraw from './GameRedraw'
import GameSetDeck from './GameSetDeck'
import GameSetOrder from './GameSetOrder'
import GameSummary from './GameSummary'
import {
  GAME_ORDER_COIN_FLIP_DURATION_SECONDS,
  HTML_CLASSES,
  HTML_IDS,
  NOT_AUTHORIZED_MESSAGE,
  ROUTES,
} from '@gwent/constants'
import LoadingSpinner from '../../components/LoadingSpinner'
import NewGame from './NewGame'
import { sortObjectArray } from '@gwent/utils'
import UnitFullCard from '../../components/UnitFullCard'
import updateGameDeckCacheOnRedraw from '../../util/update-game-deck-cache-on-redraw'
import { usePrevious } from '../../util/usePrevious'
import { useTitle } from '../../components/TabTitle'
import { useUserContext } from '../../App'
import WholeScreenDialog from '../../components/WholeScreenDialog'
import './Game.css'

/**
 * A user created Game.
 *
 * @returns A users game.
 */
export default function GamePage() {
  useTitle('Game | Gwent')
  const [handCardSelected, setHandCardSelected] = useState<DeckUnit | undefined>()
  const [playerOrder, setPlayerOrder] = useState<GamePlayer[]>([])
  const { checkAuth, user } = useUserContext()
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

  return isNew ? (
    <NewGame
      addGameProps={{
        addGame,
        error: addGameError,
        loading: addGameLoading,
      }}
    />
  ) : (
    <ExistingGame
      checkAuth={checkAuth}
      gameDeckProps={{
        deck: gameDeckData?.gameDeck as GameDeck | undefined,
        error: gameDeckError,
        loading: gameDeckLoading,
        refetch: gameDeckRefetch,
      }}
      gameProps={{
        game: gameData?.game as Game | undefined,
        error: gameError,
        loading: gameLoading,
        refetch: gameRefetch,
      }}
      handCardSelected={handCardSelected}
      playerOrder={playerOrder}
      playPassProps={{
        playPass,
        error: playPassError,
        loading: playPassLoading,
      }}
      playUnitProps={{
        playUnit,
        error: playUnitError,
        loading: playUnitLoading,
      }}
      readyProps={{
        ready,
        error: readyError,
        loading: readyLoading,
      }}
      redrawProps={{
        redraw,
        error: redrawError,
        loading: redrawLoading,
      }}
      setDeckProps={{
        setDeck,
        error: setDeckError,
        loading: setDeckLoading,
      }}
      setHandCardSelected={setHandCardSelected}
      setOrderProps={{
        setOrder,
        loading: setOrderLoading,
        error: setOrderError,
      }}
      setPlayerOrder={setPlayerOrder}
      user={user}
    />
  )
}

function ExistingGame({
  checkAuth,
  gameDeckProps,
  gameProps,
  handCardSelected,
  playerOrder,
  playPassProps,
  playUnitProps,
  redrawProps,
  readyProps,
  setDeckProps,
  setHandCardSelected,
  setOrderProps,
  setPlayerOrder,
  user,
}: {
  checkAuth: CheckAuth
  gameDeckProps: GameDeckProps
  gameProps: GameProps
  handCardSelected: DeckUnit | undefined
  playerOrder: GamePlayer[]
  playPassProps: PlayPassProps
  playUnitProps: PlayUnitProps
  readyProps: ReadyProps
  redrawProps: RedrawProps
  setDeckProps: SetDeckProps
  setHandCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  setOrderProps: SetOrderProps
  setPlayerOrder: Dispatch<SetStateAction<GamePlayer[]>>
  user: User | null | undefined
}) {
  const [deckListOpen, setDeckListOpen] = useState(false)
  const [deckEditorOpen, setDeckEditorOpen] = useState(false)
  const [historyCardSelected, setHistoryCardSelected] = useState<UnitForPlayer | undefined>()
  const [coinTossVisible, setCoinTossVisible] = useState(false)
  const [fullUnit, setFullUnit] = useState<UnitForPlayer | undefined>()
  const [passConfirmationOpen, setPassConfirmationOpen] = useState(false)
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
    unitArrays: potentialUnitArrays,
  })
  const battlefieldHighlighted = handCardSelected && handCardSelected.unit.name === 'Scorch'
  const isTurn = game?.turn?.user.id === self?.user.id

  const previousGame = usePrevious(game)
  useEffect(() => {
    const self = game?.players.find((player) => player.user.name === user?.name)
    if (game?.status === GameStatus.Redrawing && previousGame?.status !== GameStatus.Redrawing && !self?.ready) {
      setCoinTossVisible(true)
      setTimeout(() => setCoinTossVisible(false), GAME_ORDER_COIN_FLIP_DURATION_SECONDS * 1000)
    }
  }, [game])

  const historyRefs: {
    [key: string]: RefObject<HTMLDivElement | null>
  } = {}
  const movesByRounds: MoveForRound[] = []
  if (game) {
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
    if (game && playerId) {
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
        effectiveStrength={(fullUnit?.unit as GameUnit)?.effectiveStrength}
        effects={(fullUnit?.unit as GameUnit)?.effects}
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
        <GameInfo
          coinTossVisible={coinTossVisible}
          gameDeckProps={gameDeckProps}
          gameProps={gameProps}
          handCardSelected={handCardSelected}
          opponent={opponent}
          playPassLoading={playPassProps.loading}
          playUnitLoading={playUnitProps.loading}
          self={self}
          setPassConfirmationOpen={setPassConfirmationOpen}
        />
        <div
          id={HTML_IDS.GameCenterContainer}
          className={battlefieldHighlighted ? HTML_CLASSES.ItemHighlighted : ''}
          style={{
            borderStyle: battlefieldHighlighted ? (isTurn ? 'solid' : 'dotted') : 'none',
            cursor:
              battlefieldHighlighted && isTurn
                ? 'pointer'
                : battlefieldHighlighted && !isTurn
                ? 'not-allowed'
                : 'default',
          }}
          title={
            battlefieldHighlighted && isTurn
              ? 'Place here to destroy the strongest unit(s) on the battlefield (including your own)'
              : battlefieldHighlighted && !isTurn
              ? 'It is not your turn to play'
              : ''
          }
          onClick={async () => {
            if (
              game.status === GameStatus.Playing &&
              handCardSelected &&
              handCardSelected.unit.name === 'Scorch' &&
              game.turn?.user.id === self.user.id
            ) {
              await retryCheckingAuth({
                checkAuth,
                method: async () => {
                  await playUnitProps.playUnit({
                    variables: {
                      game: game.id,
                      unit: handCardSelected?.unit.id,
                    },
                  })
                  setHandCardSelected(undefined)
                },
              })
            }
          }}
        >
          {game.status === GameStatus.Decking ? (
            <GameSetDeck
              alreadySet={!!gameDeckProps.deck?.from}
              game={game}
              setDeckListOpen={setDeckListOpen}
              setDeckProps={setDeckProps}
            />
          ) : game.status === GameStatus.Ordering ? (
            <GameSetOrder
              game={game}
              playerOrder={playerOrder}
              self={self}
              setOrderProps={setOrderProps}
              setPlayerOrder={setPlayerOrder}
            />
          ) : game.status === GameStatus.Redrawing ? (
            <GameRedraw
              coinTossVisible={coinTossVisible}
              game={game}
              gameDeck={gameDeckProps.deck}
              handCardSelected={handCardSelected}
              readyProps={readyProps}
              redrawProps={redrawProps}
              self={self}
              setCoinTossVisible={setCoinTossVisible}
              setFullUnit={setFullUnit}
              setHandCardSelected={setHandCardSelected}
            />
          ) : game.status === GameStatus.Playing ? (
            <GameBattlefield
              game={game}
              handCardSelected={handCardSelected}
              historyCardSelected={historyCardSelected}
              opponent={opponent}
              playUnitProps={playUnitProps}
              scrollHistoryIntoView={scrollHistoryIntoView}
              self={self}
              setFullUnit={setFullUnit}
              setHandCardSelected={setHandCardSelected}
              setHistoryCardSelected={setHistoryCardSelected}
            />
          ) : (
            <GameSummary game={game} />
          )}
        </div>
        <GameHistory
          game={game}
          handCardSelected={handCardSelected}
          historyCardSelected={historyCardSelected}
          movesByRounds={movesByRounds}
          playPassProps={playPassProps}
          playUnitProps={playUnitProps}
          self={self}
          setFullUnit={setFullUnit}
          setHandCardSelected={setHandCardSelected}
          setHistoryCardSelected={setHistoryCardSelected}
        />
      </div>
      <div id="gameContainerLower">
        <GameHand
          gameStatus={game.status}
          hand={gameDeckProps.deck?.hand}
          handCardSelected={handCardSelected}
          isTurn={game.turn?.user.name === self.user.name}
          playUnitLoading={playUnitProps.loading}
          setFullUnit={setFullUnit}
          setHandCardSelected={setHandCardSelected}
          setHistoryCardSelected={setHistoryCardSelected}
        />
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
  unitArrays,
  deckUnit,
}: {
  unitArrays: (DeckUnit[] | GameUnit[] | undefined)[]
  deckUnit: DeckUnit | GameUnit | undefined
}): NeighborUnits {
  let previous: DeckUnit | undefined = undefined
  let next: DeckUnit | undefined = undefined
  if (deckUnit !== undefined) {
    let found = false
    for (let i = 0; i < unitArrays.length && !found; i++) {
      const unitArray = unitArrays[i]
      if (unitArray) {
        const sortedArray = sortObjectArray({
          sortProperties: [['effectiveStrength', 'unit.strength'], 'unit.name', 'unit.id'],
          array: unitArray,
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
