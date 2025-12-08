import { CgPlayButton } from 'react-icons/cg'
import { createRef, RefObject } from 'react'
import { Link, useLocation } from 'react-router'
import { useMutation, useQuery } from '@apollo/client/react'

import {
  AddGameDocument,
  DeckFragment,
  DeckUnitFragment,
  DeckUnitFragmentDoc,
  EffectKey,
  GameDeckDocument,
  GameDeckFragmentDoc,
  GameDeckQuery,
  GameDocument,
  GameFragmentDoc,
  GamePlayerFragment,
  GamePlayerFragmentDoc,
  GameQuery,
  GamesDocument,
  GamesQuery,
  GameStatus,
  GameUnitFragment,
  GameUnitFragmentDoc,
  MoveFragmentDoc,
  MoveUnitFragmentDoc,
  PlayerCombatRowFragmentDoc,
  PlayerRoundFragmentDoc,
  PlayPassDocument,
  PlayUnitDocument,
  ReadyDocument,
  RedrawDocument,
  SetDeckDocument,
  SetOrderDocument,
  UnitFragmentDoc,
  useFragment,
  User,
} from '@gwent/graphql-schema/apollo-typings'
import addToCacheList from '../../util/add-to-cache-list'
import Centered from '../../components/Centered'
import { CheckAuth, getErrorMessages, retryCheckingAuth } from '../../util/error-util'
import Confirm from '../../components/Confirm'
import DeckEditor from '../../components/DeckEditor'
import DeckList from '../../components/DeckList'
import { DeckUnit as DeckUnitRaw } from '@gwent/graphql-schema/apollo-raw-typings'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import {
  FullUnitCards,
  GameDeckProps,
  GameProps,
  MoveForRound,
  PlayerMove,
  PlayPassProps,
  PlayUnitProps,
  ReadyProps,
  RedrawProps,
  UnitForPlayer,
  SetDeckProps,
  SetOrderProps,
} from './GameProps'
import GameBattlefield from './GameBattlefield'
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
  MAX_REDRAWS,
  NOT_AUTHORIZED_MESSAGE,
  ROUTES,
} from '@gwent/constants'
import isGameUnit from '../../util/is-game-unit'
import LoadingSpinner from '../../components/LoadingSpinner'
import NewGame from './NewGame'
import { sortObjectArray } from '@gwent/utils'
import UnitFullCard from '../../components/UnitFullCard'
import updateGameDeckCacheOnRedraw from '../../util/update-game-deck-cache-on-redraw'
import { useAuthRetry } from '../../AuthRetry'
import { usePrevious } from '../../util/usePrevious'
import { useTitle } from '../../components/TabTitle'
import { useUserContext } from '../../UserContext'
import WholeScreenDialog from '../../components/WholeScreenDialog'
import './Game.css'

/**
 * A user created Game.
 *
 * @returns A users game.
 */
export default function GamePage() {
  useTitle('Game | Gwent')
  const [cardSelected, setCardSelected] = useState<UnitForPlayer | undefined>()
  const [playerOrder, setPlayerOrder] = useState<GamePlayerFragment[]>([])
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
  const [addGame, { loading: addGameLoading, error: addGameError }] = useMutation(AddGameDocument, {
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
  } = useQuery(GameDocument, {
    variables: gameQueryVariables,
    skip: isNew,
  })
  useAuthRetry(gameError, gameRefetch)
  const game = useFragment(GameFragmentDoc, gameData?.game)
  useEffect(() => {
    if (game?.players) {
      const players = useFragment(GamePlayerFragmentDoc, game.players)
      setPlayerOrder(players)
    }
  }, [gameData, setPlayerOrder])

  const {
    loading: gameDeckLoading,
    error: gameDeckError,
    data: gameDeckData,
    refetch: gameDeckRefetch,
  } = useQuery(GameDeckDocument, {
    variables: gameDeckQueryVariables,
    nextFetchPolicy: 'cache-only', // prevents re-fetch after setDeck called
    skip: isNew,
  })
  useAuthRetry(gameDeckError, gameDeckRefetch)
  const [setDeck, { loading: setDeckLoading, error: setDeckError }] = useMutation(SetDeckDocument, {
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
  const [setOrder, { loading: setOrderLoading, error: setOrderError }] = useMutation(SetOrderDocument) // Apollo automatically handles cache changes on update
  const [redraw, { loading: redrawLoading, error: redrawError }] = useMutation(RedrawDocument, {
    // need to manually update cache because the return type of "redraw" mutation (DeckUnit)
    // does not update underlying "game" query type (GameDeck) since they do not match
    update(cache, { data }) {
      const from = cardSelected?.unitFragment
      if (data?.redraw && user && from && !isGameUnit(from)) {
        cache.updateQuery<GameDeckQuery>(
          {
            query: GameDeckDocument,
            variables: gameDeckQueryVariables,
          },
          (previous) => {
            if (previous?.gameDeck) {
              return updateGameDeckCacheOnRedraw({
                from,
                previous,
                to: data.redraw,
              })
            }
          }
        )
      }
    },
  })
  const [ready, { loading: readyLoading, error: readyError }] = useMutation(ReadyDocument) // Apollo automatically handles cache changes on update
  const [playPass, { loading: playPassLoading, error: playPassError }] = useMutation(PlayPassDocument)
  const [playUnit, { loading: playUnitLoading, error: playUnitError }] = useMutation(PlayUnitDocument, {
    update(cache, { data }, { variables }) {
      if (data?.playUnit && user && cardSelected) {
        cache.updateQuery<GameDeckQuery>(
          {
            query: GameDeckDocument,
            variables: gameDeckQueryVariables,
          },
          (previous) => {
            if (previous?.gameDeck && game) {
              const cardSelectedUnit = useFragment(UnitFragmentDoc, cardSelected.unitFragment.unit)
              const battlefieldUnitIds: string[] = []
              const player = data.playUnit.players.find((player) => player.user.name === user.name)
              if (!player) {
                throw Error(
                  `Could not find player "${user.name}" among game players "${JSON.stringify(data.playUnit.players)}`
                )
              }
              const playerRound = player.rounds[game.round - 1]
              for (const unit of [
                ...playerRound.close.units,
                ...playerRound.ranged.units,
                ...playerRound.siege.units,
              ]) {
                battlefieldUnitIds.push(unit.unit.id)
              }
              for (const row of [playerRound.close, playerRound.ranged, playerRound.siege]) {
                if (row.modifier) {
                  battlefieldUnitIds.push(row.modifier.unit.id)
                }
              }
              const unitsAddedToHand: DeckUnitFragment[] = []
              const unitPlayed = previous.gameDeck.hand.find((deckUnit) => {
                return deckUnit.unit.id === variables?.unit
              })
              if (
                unitPlayed?.unit.effects &&
                unitPlayed.unit.effects.some((effect) => effect.key === EffectKey.Decoy)
              ) {
                const previousGame = useFragment(GameFragmentDoc, gameData?.game)
                if (previousGame) {
                  const previousPlayer = useFragment(GamePlayerFragmentDoc, previousGame.players).find(
                    (player) => player.user.name === user.name
                  )
                  if (!previousPlayer) {
                    throw Error(
                      `Could not find previous player "${user.name}" among game players "${JSON.stringify(data.playUnit.players)}`
                    )
                  }
                  const previousPlayerRound = useFragment(
                    PlayerRoundFragmentDoc,
                    previousPlayer.rounds[previousGame.round - 1]
                  )
                  const previousBattlefieldUnits: GameUnitFragment[] = [
                    ...useFragment(
                      GameUnitFragmentDoc,
                      useFragment(PlayerCombatRowFragmentDoc, previousPlayerRound.close).units
                    ),
                    ...useFragment(
                      GameUnitFragmentDoc,
                      useFragment(PlayerCombatRowFragmentDoc, previousPlayerRound.ranged).units
                    ),
                    ...useFragment(
                      GameUnitFragmentDoc,
                      useFragment(PlayerCombatRowFragmentDoc, previousPlayerRound.siege).units
                    ),
                  ]
                  let targetUnit: DeckUnitFragment | undefined = undefined
                  for (let i = 0; i < previousBattlefieldUnits.length && !targetUnit; i++) {
                    const previousBattlefieldGameUnit = previousBattlefieldUnits[i]
                    const previousBattlefieldUnit = useFragment(UnitFragmentDoc, previousBattlefieldGameUnit.unit)
                    if (previousBattlefieldUnit.id === variables?.target) {
                      targetUnit = {
                        __typename: 'DeckUnit',
                        artStyle: previousBattlefieldGameUnit.artStyle,
                        unit: previousBattlefieldUnit,
                      }
                    }
                  }
                  if (!targetUnit) {
                    throw Error(`Could not find target unit "${variables?.target}" in previous game`)
                  }
                  unitsAddedToHand.push(targetUnit)
                }
              }
              return {
                gameDeck: {
                  ...previous.gameDeck,
                  hand: [
                    ...previous.gameDeck.hand.filter(
                      (deckUnit) =>
                        deckUnit.unit.id !== cardSelectedUnit.id && !battlefieldUnitIds.includes(deckUnit.unit.id)
                    ),
                    ...(unitsAddedToHand as DeckUnitRaw[]),
                  ],
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
      cardSelected={cardSelected}
      checkAuth={checkAuth}
      gameDeckProps={{
        deck: gameDeckData?.gameDeck,
        error: gameDeckError,
        loading: gameDeckLoading,
        refetch: gameDeckRefetch,
      }}
      gameProps={{
        game: useFragment(GameFragmentDoc, gameData?.game),
        error: gameError,
        loading: gameLoading,
        refetch: gameRefetch,
      }}
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
      setCardSelected={setCardSelected}
      setDeckProps={{
        setDeck,
        error: setDeckError,
        loading: setDeckLoading,
      }}
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

/**
 * A Game which has been previously created.
 */
function ExistingGame({
  cardSelected,
  checkAuth,
  gameDeckProps,
  gameProps,
  playerOrder,
  playPassProps,
  playUnitProps,
  redrawProps,
  readyProps,
  setCardSelected,
  setDeckProps,
  setOrderProps,
  setPlayerOrder,
  user,
}: {
  cardSelected: UnitForPlayer | undefined
  checkAuth: CheckAuth
  gameDeckProps: GameDeckProps
  gameProps: GameProps
  playerOrder: GamePlayerFragment[]
  playPassProps: PlayPassProps
  playUnitProps: PlayUnitProps
  readyProps: ReadyProps
  redrawProps: RedrawProps
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setDeckProps: SetDeckProps
  setOrderProps: SetOrderProps
  setPlayerOrder: Dispatch<SetStateAction<GamePlayerFragment[]>>
  user: User | null | undefined
}) {
  const [deckListOpen, setDeckListOpen] = useState(false)
  const [deckEditorOpen, setDeckEditorOpen] = useState(false)
  const [coinTossVisible, setCoinTossVisible] = useState(false)
  const [fullUnits, setFullUnits] = useState<FullUnitCards | undefined>()
  const [passConfirmationOpen, setPassConfirmationOpen] = useState(false)
  const { game } = gameProps
  const gameErrorMessages = getErrorMessages(gameProps.error)
  const gameDeckErrorMessages = getErrorMessages(gameDeckProps.error)
  let opponent: GamePlayerFragment | undefined = undefined
  let self: GamePlayerFragment | undefined = undefined
  if (game?.players && user?.name) {
    opponent = useFragment(GamePlayerFragmentDoc, game.players).find((player) => player.user.id !== user.id)
    // need to user "user.name" instead of "user.id" to get self
    // because "user.id" is set to "AUTH_TIMEOUT_ID" when session times out
    // and would cause self not to be found here when user presented with opportunity to re-authorize
    self = useFragment(GamePlayerFragmentDoc, game.players).find((player) => player.user.name === user.name)
  }
  const cardSelectedUnit = useFragment(UnitFragmentDoc, cardSelected?.unitFragment.unit)
  const handUnitIds =
    useFragment(GameDeckFragmentDoc, gameDeckProps.deck)?.hand.map(
      (handUnit) => useFragment(UnitFragmentDoc, useFragment(DeckUnitFragmentDoc, handUnit).unit).id
    ) || []
  const selectedCardInHand = !!(
    self &&
    self.user.name === cardSelected?.playerName &&
    cardSelectedUnit &&
    handUnitIds?.includes(cardSelectedUnit?.id)
  )

  const battlefieldHighlighted =
    game?.status === GameStatus.Playing && cardSelectedUnit && cardSelectedUnit?.name === 'Scorch' && selectedCardInHand
  const isTurn = game?.turn?.user.name === self?.user.name

  const previousGame = usePrevious(game)
  useEffect(() => {
    const self = useFragment(GamePlayerFragmentDoc, game?.players)?.find((player) => player.user.name === user?.name)
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
        const player = useFragment(GamePlayerFragmentDoc, game.players[j])
        const round = useFragment(PlayerRoundFragmentDoc, player.rounds[i])
        for (let k = 0; k < round.moves.length; k++) {
          const move = useFragment(MoveFragmentDoc, round.moves[k])
          const refId = `${i}.${j}.${k}`
          const ref = createRef<HTMLDivElement>()
          historyRefs[refId] = ref
          allPlayerMoves.push({
            move,
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

  /**
   * Force the browser to scroll a specific Units entrance to the battlefield in the History panel.
   *
   * @param config The configuration used to scroll the History entry into view.
   * @param config.playerId The ID of the player the Unit belongs to.
   * @param config.unitFragment The Unit whose entrance to the battlefield should be scrolled to in the History panel.
   */
  function scrollHistoryIntoView(selected: UnitForPlayer) {
    if (game && selected && selected.playerName) {
      const unitSelected = useFragment(UnitFragmentDoc, selected.unitFragment.unit)
      const roundIndex = game.round - 1
      const playerIndex = useFragment(GamePlayerFragmentDoc, game.players)
        .map((player) => player.user.name)
        .indexOf(selected.playerName)
      let moveIndex: number | undefined = undefined
      const player = useFragment(GamePlayerFragmentDoc, game.players[playerIndex])
      const round = useFragment(PlayerRoundFragmentDoc, player.rounds[roundIndex])
      for (let i = round.moves.length - 1; i >= 0 && moveIndex === undefined; i--) {
        const move = useFragment(MoveFragmentDoc, round.moves[i])
        if (move.__typename === 'MoveUnit') {
          const moveUnit = useFragment(MoveUnitFragmentDoc, move)
          const gameUnit = useFragment(GameUnitFragmentDoc, moveUnit.unit)
          const unit = useFragment(UnitFragmentDoc, gameUnit.unit)
          if (unit.id === unitSelected.id) {
            moveIndex = i
          }
        }
      }
      if (moveIndex !== undefined) {
        const stringRefId = `${roundIndex}.${playerIndex}.${moveIndex}`
        historyRefs[stringRefId].current?.scrollIntoView()
      }
    }
  }
  const fullUnit = fullUnits && fullUnits.units[fullUnits.currentIndex]
  const fullGameUnit = fullUnit?.unitFragment
  let fullUnitUserName: string | undefined = undefined
  if (fullUnit) {
    const fullUnitGamePlayerFragment = useFragment(GamePlayerFragmentDoc, game?.players)?.find(
      (player) => player.user.name === fullUnit.playerName
    )
    fullUnitUserName = fullUnitGamePlayerFragment?.user.name
  }
  const gameDeck = useFragment(GameDeckFragmentDoc, gameDeckProps.deck)

  return gameProps.loading || gameDeckProps.loading ? (
    <Centered>
      <LoadingSpinner size="50px" />
    </Centered>
  ) : gameErrorMessages === NOT_AUTHORIZED_MESSAGE ? (
    <Centered>
      <div id={HTML_IDS.GameAuthErrorContainer}>
        <h2>Not Authorized</h2>
        <div id="gameAuthErrorMessage">You do not have access to this game, or it does not exist.</div>
        <Link to={ROUTES.Games.path} id={HTML_IDS.GameAuthErrorViewGames}>
          View Games
        </Link>
      </div>
    </Centered>
  ) : gameErrorMessages || !game || !gameProps.game ? (
    <Centered>
      <div className={HTML_CLASSES.ErrorText}>{`Error getting game: ${gameErrorMessages}`}</div>
    </Centered>
  ) : !opponent ? (
    <Centered>
      <div className={HTML_CLASSES.ErrorText}>{`Error opponent from game: ${JSON.stringify(game)}`}</div>
    </Centered>
  ) : !self ? (
    <Centered>
      <div className={HTML_CLASSES.ErrorText}>{`Error getting self from game: ${JSON.stringify(game)}`}</div>
    </Centered>
  ) : gameDeckErrorMessages ? (
    <Centered>
      <div className={HTML_CLASSES.ErrorText}>{`Error getting game deck: ${gameDeckErrorMessages}`}</div>
    </Centered>
  ) : (
    <div id={HTML_IDS.GameContainer}>
      <UnitFullCard
        fullUnit={fullGameUnit}
        effectiveStrength={
          fullGameUnit && 'effectiveStrength' in fullGameUnit ? fullGameUnit?.effectiveStrength : undefined
        }
        effects={fullGameUnit && 'effectiveStrength' in fullGameUnit ? fullGameUnit.effects : undefined}
        userName={game.status === GameStatus.Playing ? fullUnitUserName : undefined}
        hasNext={!!fullUnits && fullUnits.currentIndex < fullUnits.units.length - 1}
        hasPrevious={!!fullUnits && fullUnits.currentIndex > 0}
        onSelect={() => {}}
        onPrevious={() => {
          if (fullUnits && fullUnits.currentIndex > 0) {
            setFullUnits({
              units: fullUnits.units,
              currentIndex: fullUnits.currentIndex - 1,
            })
            const fullPlayerUnit = fullUnits.units[fullUnits.currentIndex - 1]
            const fullUnitFragment = fullPlayerUnit.unitFragment
            setCardSelected({
              unitFragment: fullUnitFragment,
              playerName: fullPlayerUnit.playerName,
            })
          }
        }}
        onNext={() => {
          if (fullUnits && fullUnits.currentIndex <= fullUnits.units.length) {
            setFullUnits({
              units: fullUnits.units,
              currentIndex: fullUnits.currentIndex + 1,
            })
            const fullPlayerUnit = fullUnits.units[fullUnits.currentIndex + 1]
            const fullUnitFragment = fullPlayerUnit.unitFragment
            setCardSelected({
              unitFragment: fullUnitFragment,
              playerName: fullPlayerUnit.playerName,
            })
          }
        }}
        onClose={() => {
          setFullUnits(undefined)
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
          cardSelected={cardSelected}
          coinTossVisible={coinTossVisible}
          gameDeckProps={gameDeckProps}
          gameProps={gameProps}
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
              cardSelectedUnit &&
              cardSelectedUnit.name === 'Scorch' &&
              game.turn?.user.name === self.user.name
            ) {
              await retryCheckingAuth({
                checkAuth,
                method: async () => {
                  await playUnitProps.playUnit({
                    variables: {
                      game: game.id,
                      unit: cardSelectedUnit.id,
                    },
                  })
                  setCardSelected(undefined)
                },
              })
            }
          }}
        >
          {game.status === GameStatus.Decking ? (
            <GameSetDeck
              alreadySet={!!gameDeck?.from}
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
              cardSelected={cardSelected}
              coinTossVisible={coinTossVisible}
              game={game}
              gameDeck={gameDeck}
              readyProps={readyProps}
              redrawProps={redrawProps}
              selectedCardInHand={selectedCardInHand}
              self={self}
              setCardSelected={setCardSelected}
              setCoinTossVisible={setCoinTossVisible}
              setFullUnits={setFullUnits}
            />
          ) : game.status === GameStatus.Playing ? (
            <GameBattlefield
              cardSelected={cardSelected}
              fullUnits={fullUnits}
              game={game}
              opponent={opponent}
              playUnitProps={playUnitProps}
              selectedCardInHand={selectedCardInHand}
              scrollHistoryIntoView={scrollHistoryIntoView}
              self={self}
              setCardSelected={setCardSelected}
              setFullUnits={setFullUnits}
            />
          ) : (
            <GameSummary game={game} />
          )}
        </div>
        <GameHistory
          cardSelected={cardSelected}
          game={game}
          movesByRounds={movesByRounds}
          playPassProps={playPassProps}
          playUnitProps={playUnitProps}
          self={self}
          setCardSelected={setCardSelected}
          setFullUnits={setFullUnits}
        />
      </div>
      <div id="gameContainerLower">
        <GameHand
          cardSelected={cardSelected}
          gameStatus={game.status}
          gameDeckFragment={gameDeckProps.deck}
          isTurn={game.turn?.user.name === self.user.name}
          playUnitLoading={playUnitProps.loading}
          redrawsLeft={MAX_REDRAWS - (gameDeck?.redraws || []).length}
          selectedCardInHand={selectedCardInHand}
          self={self}
          setCardSelected={setCardSelected}
          setFullUnits={setFullUnits}
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
                    onClick: async (deck: DeckFragment) => {
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
