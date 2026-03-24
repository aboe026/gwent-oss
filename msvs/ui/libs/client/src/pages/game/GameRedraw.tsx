import { CgArrowLongRight } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'

import Centered from '../../components/Centered'
import CoinToss from '../../components/CoinToss'
import {
  DeckUnitFragment,
  DeckUnitFragmentDoc,
  GameDeckFragment,
  GameFragment,
  GamePlayerFragment,
  UnitFragment,
  UnitFragmentDoc,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import { FullUnitCards, ReadyProps, RedrawProps, UnitForPlayer } from './GameProps'
import { GAME_ORDER_COIN_FLIP_DURATION_SECONDS, HTML_CLASSES, HTML_IDS, MAX_REDRAWS } from '@gwent/constants'
import { getErrorMessages, retryCheckingAuth } from '../../util/error-util'
import isGameUnit from '../../util/is-game-unit'
import LoadingBar from '../../components/LoadingBar'
import LoadingSpinner from '../../components/LoadingSpinner'
import UnitGameCard from '../../components/UnitGameCard'
import { useUserContext } from '../../UserContext'

/**
 * Allows user to Redraw units for a Game.
 */
export default function GameRedraw({
  cardSelected,
  coinTossVisible,
  game,
  gameDeck,
  readyProps,
  redrawProps,
  selectedCardInHand,
  self,
  setCardSelected,
  setFullUnits,
  setCoinTossVisible,
}: {
  cardSelected: UnitForPlayer | undefined
  coinTossVisible: boolean
  game: GameFragment
  gameDeck: GameDeckFragment | null | undefined
  readyProps: ReadyProps
  redrawProps: RedrawProps
  selectedCardInHand: boolean
  self: GamePlayerFragment
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setCoinTossVisible: Dispatch<SetStateAction<boolean>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
}) {
  const { checkAuth } = useUserContext()
  const redrawsLeft = MAX_REDRAWS - (gameDeck?.redraws || []).length
  const instructions =
    redrawsLeft > 0
      ? `Optionally select up to ${redrawsLeft} card${
          redrawsLeft > 1 ? 's' : ''
        } from your hand to redraw. When satisfied with deck:`
      : 'All allowed redraws made. To begin the game:'
  const redrawErrorMessages = getErrorMessages(redrawProps.error)
  const readyErrorMessages = getErrorMessages(readyProps.error)
  const handUnitIds: string[] = []
  if (gameDeck?.hand) {
    for (const handUnitFragment of gameDeck.hand) {
      const handUnit = useFragment(DeckUnitFragmentDoc, handUnitFragment)
      const unit = useFragment(UnitFragmentDoc, handUnit.unit)
      if (!handUnitIds.includes(unit.id)) {
        handUnitIds.push(unit.id)
      }
    }
  }

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
            {[...Array(MAX_REDRAWS)].map((_, index) => (
              <RedrawCard
                cardSelected={cardSelected}
                game={game}
                gameDeck={gameDeck}
                index={index}
                key={index}
                redrawProps={redrawProps}
                selectedCardInHand={selectedCardInHand}
                self={self}
                setCardSelected={setCardSelected}
                setFullUnits={setFullUnits}
              />
            ))}
          </div>
          {redrawErrorMessages && (
            <div
              id={HTML_IDS.GameRedrawError}
              className={HTML_CLASSES.ErrorText}
            >{`Error redrawing card: ${redrawErrorMessages}`}</div>
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
                    if (cardSelected && !selectedCardInHand) {
                      setCardSelected(undefined)
                    }
                  },
                })
              }}
            >
              Ready to Play
            </button>
            {readyErrorMessages && (
              <div
                id={HTML_IDS.GameReadyError}
                className={HTML_CLASSES.ErrorText}
              >{`Error marking self ready: ${readyErrorMessages}`}</div>
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

/**
 * The coint toss animation to inform the user which player will go first in a Game.
 */
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

/**
 * A possible redraw for a game.
 */
function RedrawCard({
  cardSelected,
  index,
  gameDeck,
  game,
  self,
  redrawProps,
  selectedCardInHand,
  setCardSelected,
  setFullUnits,
}: {
  cardSelected: UnitForPlayer | undefined
  index: number
  gameDeck: GameDeckFragment
  game: GameFragment
  self: GamePlayerFragment
  redrawProps: RedrawProps
  selectedCardInHand: boolean
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
}) {
  const { checkAuth } = useUserContext()
  const handUnitIds: string[] = []
  if (gameDeck?.hand) {
    for (const handUnitFragment of gameDeck.hand) {
      const handUnit = useFragment(DeckUnitFragmentDoc, handUnitFragment)
      const unit = useFragment(UnitFragmentDoc, handUnit.unit)
      if (!handUnitIds.includes(unit.id)) {
        handUnitIds.push(unit.id)
      }
    }
  }
  let fromCard: DeckUnitFragment | undefined =
    cardSelected && !isGameUnit(cardSelected.unitFragment) ? cardSelected.unitFragment : undefined
  if (index < gameDeck.redraws.length && gameDeck.redraws[index].from) {
    fromCard = useFragment(DeckUnitFragmentDoc, gameDeck.redraws[index].from)
  }
  const fromCardUnit = useFragment(UnitFragmentDoc, fromCard?.unit)
  let toCard: DeckUnitFragment | undefined = undefined
  if (gameDeck.redraws.length >= index + 1 && gameDeck.redraws[index].to) {
    toCard = useFragment(DeckUnitFragmentDoc, gameDeck.redraws[index].to)
  }
  const toCardUnit: UnitFragment | undefined = useFragment(UnitFragmentDoc, toCard?.unit)
  const units: UnitForPlayer[] = [fromCard, toCard]
    .filter((deckUnit) => !!deckUnit)
    .map((deckUnit) => {
      return {
        playerName: self.user.name,
        unitFragment: deckUnit,
      }
    })
  const cardSelectedUnit = useFragment(UnitFragmentDoc, cardSelected?.unitFragment.unit)
  const toCardSelected = toCardUnit && toCardUnit.id === cardSelectedUnit?.id
  const toCardDotted = toCardSelected && !handUnitIds.includes(toCardUnit.id)
  const fromCardSelected = fromCardUnit && fromCardUnit.id === cardSelectedUnit?.id
  const fromCardDotted = fromCardSelected && !handUnitIds.includes(fromCardUnit.id)
  const isPair = index < gameDeck.redraws.length || (index === gameDeck.redraws.length && redrawProps.loading)
  const redrawAvailable = cardSelected && index === gameDeck.redraws.length && selectedCardInHand
  let redrawTitle: string
  if (redrawAvailable) {
    redrawTitle = 'Place here to redraw for a random unit from your Draw pile'
  } else if (cardSelected) {
    if (index >= gameDeck.redraws.length) {
      redrawTitle = 'Not available to redraw until other redraws made above'
    } else {
      redrawTitle = 'Can only redraw cards that are in your hand'
    }
  } else {
    redrawTitle = 'Select card from hand to redraw'
  }

  return (
    <div className="game-deck-redraw-card-container" key={index}>
      {isPair ? (
        <div className={HTML_CLASSES.GameDeckRedrawPair}>
          {fromCard && (
            <UnitGameCard
              deckUnit={fromCard}
              selected={fromCardSelected}
              dotted={fromCardDotted}
              dottedTitle={fromCardDotted ? 'This unit is no longer in your hand' : ''}
              onClick={() => {
                setCardSelected(
                  fromCardSelected
                    ? undefined
                    : {
                        unitFragment: fromCard,
                        playerName: self.user.name,
                      }
                )
              }}
              onFullscreen={() => {
                setFullUnits({
                  currentIndex: 0,
                  units,
                })
                setCardSelected(
                  fromCardSelected
                    ? undefined
                    : {
                        unitFragment: fromCard,
                        playerName: self.user.name,
                      }
                )
              }}
            />
          )}
          <CgArrowLongRight color="black" title="Redrawn to" />
          {index < gameDeck.redraws.length && toCard ? (
            <UnitGameCard
              deckUnit={toCard}
              selected={toCardSelected}
              dotted={toCardDotted}
              dottedTitle={toCardDotted ? 'This unit is no longer in your hand' : ''}
              onClick={() => {
                setCardSelected(
                  toCardSelected
                    ? undefined
                    : {
                        unitFragment: toCard,
                        playerName: self.user.name,
                      }
                )
              }}
              onFullscreen={() => {
                setFullUnits({
                  currentIndex: 1,
                  units,
                })
                setCardSelected(
                  toCardSelected
                    ? undefined
                    : {
                        unitFragment: toCard,
                        playerName: self.user.name,
                      }
                )
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
            redrawAvailable
              ? `${HTML_CLASSES.ItemHighlighted} game-deck-redraw-available`
              : 'game-deck-redraw-unavailable'
          }`}
          title={redrawTitle}
          onClick={async () => {
            if (cardSelectedUnit && index === gameDeck.redraws.length) {
              await retryCheckingAuth({
                checkAuth,
                method: async () => {
                  await redrawProps.redraw({
                    variables: {
                      unit: cardSelectedUnit.id,
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
    </div>
  )
}
