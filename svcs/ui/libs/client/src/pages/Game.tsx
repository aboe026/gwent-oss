import { ApolloCache, ApolloError, DefaultContext, FetchResult, MutationFunctionOptions } from '@apollo/client'
import { CgArrowLongRight, CgPlayButton, CgTime } from 'react-icons/cg'
import { Link } from 'react-router-dom'
import { NavigateFunction, useLocation, useNavigate } from 'react-router-dom'

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
  Redraw,
  GameStatus,
  useReadyMutation,
  ReadyMutation,
  Faction,
  Leader,
} from '@gwent/graphql-schema/apollo-typings'
import Centered from '../components/Centered'
import DeckEditor from '../components/DeckEditor'
import DeckList from '../components/DeckList'
import { Dispatch, SetStateAction, useState } from 'react'
import Form from '../components/Form'
import { formatDay, formatTime, sortObjectArray } from '@gwent/utils'
import { getApolloError, retryCheckingAuth } from '../util/error-util'
import { HTML_CLASSES, HTML_IDS, MAX_REDRAWS, NOT_AUTHORIZED_MESSAGE, PLAYER_COUNTS, ROUTES } from '@gwent/constants'
import LoadingBar from '../components/LoadingBar'
import LoadingSpinner from '../components/LoadingSpinner'
import UnitFullCard from '../components/UnitFullCard'
import UnitGameCard from '../components/UnitGameCard'
import addToCacheList from '../util/add-to-cache-list'
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
  const [cardSelected, setCardSelected] = useState<DeckUnit | undefined>()
  const [fullUnit, setFullUnit] = useState<DeckUnit | undefined>()
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
        const previousGames = cache.readQuery<GamesQuery>({ query: GamesDocument })
        // only update cache if the query has already been run (there is something in the cache)
        // otherwise when navigating to games, it will not fire the query, so would only show the
        // new created game, and not all games for the user
        if (previousGames?.games) {
          cache.writeQuery({
            query: GamesDocument,
            data: {
              games: addToCacheList({
                previous: previousGames.games,
                add: data.addGame,
              }),
            },
          })
        }
        cache.writeQuery({
          query: GameDocument,
          data: {
            game: {
              ...data.addGame,
            },
          },
          variables: gameQueryVariables,
        })
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
    variables: gameQueryVariables,
    skip: isNew,
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
  })
  const [setDeck, { loading: setDeckLoading, error: setDeckError }] = useSetDeckMutation({
    update(cache, { data }) {
      if (data?.setDeck && user) {
        cache.writeQuery({
          query: GameDeckDocument,
          data: {
            gameDeck: {
              ...data.setDeck,
            },
          },
          variables: gameDeckQueryVariables,
        })
      }
    },
  })
  const [redraw, { loading: redrawLoading, error: redrawError }] = useRedrawMutation({
    update(cache, { data }) {
      if (data?.redraw && user) {
        const previousGameDeck = cache.readQuery<GameDeckQuery>({
          query: GameDeckDocument,
          variables: gameDeckQueryVariables,
        })
        if (previousGameDeck?.gameDeck) {
          const newRedraws: Redraw[] = [
            ...(previousGameDeck.gameDeck.redraws as Redraw[]),
            {
              from: cardSelected as DeckUnit,
              to: data.redraw as DeckUnit,
            },
          ]
          cache.writeQuery({
            query: GameDeckDocument,
            variables: gameDeckQueryVariables,
            data: {
              gameDeck: {
                ...previousGameDeck.gameDeck,
                hand: [
                  ...previousGameDeck.gameDeck?.hand.filter((deckUnit) => deckUnit.unit.id !== cardSelected?.unit.id),
                  data.redraw,
                ],
                undrawn: [
                  ...previousGameDeck.gameDeck.undrawn.filter((deckUnit) => deckUnit.unit.id !== data.redraw.unit.id),
                  cardSelected,
                ],
                redraws: newRedraws,
              },
            },
          })
          setCardSelected(undefined)
          if (newRedraws.length >= MAX_REDRAWS) {
            gameRefetch(gameQueryVariables)
          }
        }
      }
    },
  })
  const [ready, { loading: readyLoading, error: readyError }] = useReadyMutation()

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
        game: gameData?.game as Game | undefined,
        gameLoading,
        setDeck: {
          setDeck,
          error: setDeckError,
          loading: setDeckLoading,
        },
        user,
        cardSelected,
        setCardSelected,
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
      })
}

function renderNewGame({
  addGame,
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
        error={addGame.error}
        errorId={HTML_IDS.GameNewError}
        loading={addGame.loading}
        onSubmit={async ({ variables }) => {
          await retryCheckingAuth({
            checkAuth,
            method: async () => {
              const game = await addGame.addGame({
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
  redraw,
  gameDeck,
  gameDeckError,
  gameDeckLoading,
  ready,
  fullUnit,
  setFullUnit,
}: {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  checkAuth: (error: ApolloError | undefined, callbackAfterReauth: Function) => void
  deckListOpen: boolean
  setDeckListOpen: Dispatch<SetStateAction<boolean>>
  deckEditorOpen: boolean
  setDeckEditorOpen: Dispatch<SetStateAction<boolean>>
  game: Game | undefined
  gameError: ApolloError | undefined
  gameLoading: boolean
  setDeck: SetDeckProps
  user: User | null | undefined
  cardSelected: DeckUnit | undefined
  setCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  redraw: RedrawProps
  gameDeck: GameDeck | undefined
  gameDeckError: ApolloError | undefined
  gameDeckLoading: boolean
  ready: ReadyProps
  fullUnit: DeckUnit | undefined
  setFullUnit: Dispatch<SetStateAction<DeckUnit | undefined>>
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

  let nextUnit: DeckUnit | undefined
  let previousUnit: DeckUnit | undefined
  if (fullUnit && gameDeck?.hand) {
    const sortedHand = sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    })
    const handIds = sortedHand.map((deckUnit) => deckUnit.unit.id)
    if (handIds?.includes(fullUnit.unit.id)) {
      const fullUnitPosition = sortedHand.findIndex((deckUnit) => deckUnit.unit.id === fullUnit.unit.id)
      nextUnit = sortedHand[fullUnitPosition + 1]
      previousUnit = sortedHand[fullUnitPosition - 1]
    }
  }

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
    <div className={HTML_CLASSES.ErrorText}>{`Error getting game: ${resolvedGameError}`}</div>
  ) : !opponent ? (
    <div className={HTML_CLASSES.ErrorText}>{`Error opponent from game: ${JSON.stringify(game)}`}</div>
  ) : !self ? (
    <div className={HTML_CLASSES.ErrorText}>{`Error getting self from game: ${JSON.stringify(game)}`}</div>
  ) : resolvedGameDeckError ? (
    <div className={HTML_CLASSES.ErrorText}>{`Error getting game deck: ${resolvedGameDeckError}`}</div>
  ) : (
    <div id={HTML_IDS.GameContainer}>
      <UnitFullCard
        fullUnit={fullUnit}
        hasNext={nextUnit !== undefined}
        hasPrevious={previousUnit !== undefined}
        onSelect={() => {}}
        onPrevious={() => {
          if (previousUnit) {
            setFullUnit(previousUnit)
            setCardSelected(previousUnit)
          }
        }}
        onNext={() => {
          if (nextUnit) {
            setFullUnit(nextUnit)
            setCardSelected(nextUnit)
          }
        }}
        onClose={() => setFullUnit(undefined)}
      />
      <div id="gameContainerUpper">
        {renderGameInfo({
          game,
          opponent,
          self,
          gameDeck,
        })}
        {renderCenter({
          cardSelected,
          checkAuth,
          game,
          gameDeck,
          self,
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
        })}
        {renderHistory()}
      </div>
      <div id="gameContainerLower">
        {renderHand({
          hand: gameDeck?.hand,
          cardSelected,
          setCardSelected,
          setFullUnit,
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

function renderGameInfo({
  self,
  opponent,
  game,
  gameDeck,
}: {
  self: GamePlayer
  opponent: GamePlayer
  game: Game
  gameDeck: GameDeck | undefined
}) {
  return (
    <div id="gameInfoContainer" className="game-edge-container">
      {renderPlayerInfo({
        game,
        id: HTML_IDS.GameInfoOpponentContainer,
        player: opponent,
        reverse: true,
        faction: opponent.faction,
        discard: opponent.counts?.discard,
        hand: opponent.counts?.hand,
        undrawn: opponent.counts?.undrawn,
        leader: opponent.leader,
      })}
      <div id="gameInfoWeatherContainer" className="game-section">
        <img id="gameWeatherIcon" src="images/effects/weather.png" title="Weather" />
        <div className="game-sub-section"></div>
      </div>
      {renderPlayerInfo({
        game,
        id: HTML_IDS.GameInfoSelfContainer,
        player: self,
        faction: gameDeck?.from?.faction,
        leader: gameDeck?.from?.leader,
        discard: gameDeck?.discard.length,
        hand: gameDeck?.hand.length,
        undrawn: gameDeck?.undrawn.length,
        deckName: gameDeck?.from?.name,
        deckUpdated: gameDeck?.from?.created,
      })}
    </div>
  )
}

function renderPlayerInfo({
  id,
  player,
  game,
  reverse,
  faction,
  undrawn,
  hand,
  discard,
  leader,
  deckName,
  deckUpdated,
}: {
  id: string
  player: GamePlayer
  game: Game
  reverse?: boolean
  faction?: Faction | null
  undrawn?: number
  hand?: number
  discard?: number
  leader?: Leader | null
  deckName?: string
  deckUpdated?: Date
}) {
  return (
    <div
      id={id}
      className="game-section game-info-player-container"
      style={{ flexDirection: reverse ? 'column-reverse' : 'column' }}
    >
      <div className="game-sub-section game-info-section game-player-section">
        {renderScore({
          game,
          player,
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
          {deckName && deckUpdated && (
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

function renderScore({ player, game }: { player: GamePlayer; game: Game }) {
  const playerRound = player.rounds[game.round.current]
  const roundsCanLose = Math.ceil(game.round.maximum / 2)
  return (
    <div className="game-player-container">
      <div className={`game-player-sub-section ${HTML_CLASSES.GamePlayerName}`} title={player.user.name}>
        {player.user.name}
      </div>
      <div className="game-player-rounds-score">
        <div className="game-player-rounds">
          {Array.from(Array(roundsCanLose), (_, i) => i + 1).map((index) => {
            const roundLost = index > roundsCanLose
            return (
              <div
                key={index}
                className={`game-round-token ${
                  roundLost ? 'game-round-token-lost' : HTML_CLASSES.GamePlayerRoundTokenWon
                }`}
                title={roundLost ? 'Round Lost' : 'Round Left'}
              ></div>
            )
          })}
        </div>
        <span className={HTML_CLASSES.GamePlayerScore} title="Score">
          {playerRound?.score || 0}
        </span>
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
  ready,
  redraw,
  setDeckListOpen,
  setDeck: { error: setDeckError, loading: setDeckLoading },
  setFullUnit,
  setCardSelected,
}: {
  game: Game
  gameDeck: GameDeck | undefined
  self: GamePlayer
  cardSelected: DeckUnit | undefined
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  checkAuth: (error: ApolloError | undefined, callbackAfterReauth: Function) => void
  redraw: RedrawProps
  ready: ReadyProps
  setDeckListOpen: Dispatch<SetStateAction<boolean>>
  setDeck: SetDeckProps
  setFullUnit: Dispatch<SetStateAction<DeckUnit | undefined>>
  setCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
}) {
  const resolvedSetDeckError = getApolloError(setDeckError)
  return (
    <div id={HTML_IDS.GameCenterContainer}>
      {game.status === GameStatus.Playing ? (
        renderUnits()
      ) : gameDeck?.from && !self.ready ? (
        renderRedraw({
          cardSelected,
          checkAuth,
          game,
          gameDeck,
          ready,
          redraw,
          setFullUnit,
          setCardSelected,
        })
      ) : (
        <div className="game-section">
          <Centered>
            {self.ready ? (
              <div>
                <LoadingBar height="25px" />
                <div>{`Waiting for opponent${game.players.length > 2 ? 's' : ''} to be ready...`}</div>
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
      )}
    </div>
  )
}

function renderUnits() {
  return (
    <>
      <div className={`${HTML_CLASSES.GameUnitBoardSide} game-section`}>
        <div className="game-unit-board-combat-row">
          <img className="game-unit-combat-row-icon" src="images/combats/siege.png" title="Siege" />
          <div className="game-sub-section game-unit-combat-row-cards"></div>
        </div>
        <div className="game-unit-board-combat-row">
          <img className="game-unit-combat-row-icon" src="images/combats/ranged.png" title="Ranged" />
          <div className="game-sub-section game-unit-combat-row-cards"></div>
        </div>
        <div className="game-unit-board-combat-row">
          <img className="game-unit-combat-row-icon" src="images/combats/close.png" title="Close" />
          <div className="game-sub-section game-unit-combat-row-cards"></div>
        </div>
      </div>
      <div className={`${HTML_CLASSES.GameUnitBoardSide} game-section`}>
        <div className="game-unit-board-combat-row">
          <img className="game-unit-combat-row-icon" src="images/combats/close.png" title="Close" />
          <div className="game-sub-section game-unit-combat-row-cards"></div>
        </div>
        <div className="game-unit-board-combat-row">
          <img className="game-unit-combat-row-icon" src="images/combats/ranged.png" title="Ranged" />
          <div className="game-sub-section game-unit-combat-row-cards"></div>
        </div>
        <div className="game-unit-board-combat-row">
          <img className="game-unit-combat-row-icon" src="images/combats/siege.png" title="Siege" />
          <div className="game-sub-section game-unit-combat-row-cards"></div>
        </div>
      </div>
    </>
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
}: {
  game: Game
  gameDeck: GameDeck | undefined
  cardSelected: DeckUnit | undefined
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  checkAuth: (error: ApolloError | undefined, callbackAfterReauth: Function) => void
  redraw: RedrawProps
  ready: ReadyProps
  setFullUnit: Dispatch<SetStateAction<DeckUnit | undefined>>
  setCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
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
  return (
    <div id={HTML_IDS.GameRedrawContainer} className="game-section">
      {gameDeck ? (
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
                        setFullUnit={() => {
                          setFullUnit(fromCard)
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
                          setFullUnit={() => {
                            setFullUnit(toCard)
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
                          ? HTML_CLASSES.GameDeckRedrawAvailable
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
}: {
  hand: DeckUnit[] | undefined
  cardSelected: DeckUnit | undefined
  setCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  setFullUnit: Dispatch<SetStateAction<DeckUnit | undefined>>
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
        {!hand ? (
          <Centered>
            <img src="images/stats/units.png" title="Hand" className={HTML_CLASSES.GameHandIcon} />
          </Centered>
        ) : (
          sortedUnits.map((deckUnit, index) => {
            const selected = deckUnit.unit.id === cardSelected?.unit.id
            const notSelected = cardSelected?.unit.id && !selected
            return (
              <div
                className={`game-card-wrapper ${selected ? 'game-card-wrapper-selected' : ''}`}
                key={deckUnit.unit.id}
                onClick={() => {
                  setCardSelected(selected ? undefined : deckUnit)
                }}
                style={index === sortedUnits.length - 1 ? { marginRight: '-25px' } : {}}
              >
                <UnitGameCard
                  deckUnit={deckUnit}
                  selected={deckUnit.unit.id === cardSelected?.unit.id}
                  setFullUnit={setFullUnit}
                />
                {notSelected && <div title={deckUnit.unit.name} className="game-card-wrapper-not-selected"></div>}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function renderHistory() {
  return (
    <div className="game-edge-container game-section">
      <Centered classname="game-history-placeholder">
        <CgTime color="black" className={HTML_CLASSES.GameHistoryIcon} title="History" />
      </Centered>
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
