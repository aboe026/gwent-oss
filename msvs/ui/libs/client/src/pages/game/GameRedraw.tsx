import { CgArrowLongRight } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'

import {
  CardUnitFragmentFragment,
  CardUnitFragmentFragmentDoc,
  DeckUnitFragmentFragmentDoc,
  DeckUnitFragmentFragment,
  GameDeckFragmentFragment,
  useFragment,
  GamePlayerFragmentFragment,
  GameFragmentFragment,
} from '@gwent/graphql-schema/apollo-typings'
import Centered from '../../components/Centered'
import CoinToss from '../../components/CoinToss'
import { FullUnitCards, ReadyProps, RedrawProps, UnitForPlayer } from './GameProps'
import { GAME_ORDER_COIN_FLIP_DURATION_SECONDS, HTML_CLASSES, HTML_IDS, MAX_REDRAWS } from '@gwent/constants'
import { getErrorMessages, retryCheckingAuth } from '../../util/error-util'
import LoadingBar from '../../components/LoadingBar'
import LoadingSpinner from '../../components/LoadingSpinner'
import UnitGameCard from '../../components/UnitGameCard'
import { useUserContext } from '../../UserContext'

/**
 * Allows user to Redraw units for a Game.
 */
export default function GameRedraw({
  coinTossVisible,
  game,
  gameDeck,
  handCardSelected,
  readyProps,
  redrawCardSelected,
  redrawProps,
  self,
  setFullUnits,
  setCoinTossVisible,
  setHandCardSelected,
  setRedrawCardSelected,
}: {
  coinTossVisible: boolean
  game: GameFragmentFragment
  gameDeck: GameDeckFragmentFragment | null | undefined
  handCardSelected: DeckUnitFragmentFragment | undefined
  readyProps: ReadyProps
  redrawCardSelected: DeckUnitFragmentFragment | undefined
  redrawProps: RedrawProps
  self: GamePlayerFragmentFragment
  setCoinTossVisible: Dispatch<SetStateAction<boolean>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnitFragmentFragment | undefined>>
  setRedrawCardSelected: Dispatch<SetStateAction<DeckUnitFragmentFragment | undefined>>
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
      const handUnit = useFragment(DeckUnitFragmentFragmentDoc, handUnitFragment)
      const unit = useFragment(CardUnitFragmentFragmentDoc, handUnit.unit)
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
                game={game}
                gameDeck={gameDeck}
                handCardSelected={handCardSelected}
                index={index}
                key={index}
                redrawCardSelected={redrawCardSelected}
                redrawProps={redrawProps}
                self={self}
                setFullUnits={setFullUnits}
                setHandCardSelected={setHandCardSelected}
                setRedrawCardSelected={setRedrawCardSelected}
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
              >{`Error marking self as ready: ${readyErrorMessages}`}</div>
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

function RedrawCard({
  index,
  gameDeck,
  game,
  handCardSelected,
  self,
  redrawCardSelected,
  redrawProps,
  setFullUnits,
  setHandCardSelected,
  setRedrawCardSelected,
}: {
  index: number
  gameDeck: GameDeckFragmentFragment
  game: GameFragmentFragment
  handCardSelected: DeckUnitFragmentFragment | undefined
  self: GamePlayerFragmentFragment
  redrawCardSelected: DeckUnitFragmentFragment | undefined
  redrawProps: RedrawProps
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnitFragmentFragment | undefined>>
  setRedrawCardSelected: Dispatch<SetStateAction<DeckUnitFragmentFragment | undefined>>
}) {
  const { checkAuth } = useUserContext()
  const handUnitIds: string[] = []
  if (gameDeck?.hand) {
    for (const handUnitFragment of gameDeck.hand) {
      const handUnit = useFragment(DeckUnitFragmentFragmentDoc, handUnitFragment)
      const unit = useFragment(CardUnitFragmentFragmentDoc, handUnit.unit)
      if (!handUnitIds.includes(unit.id)) {
        handUnitIds.push(unit.id)
      }
    }
  }
  let fromCard: DeckUnitFragmentFragment | undefined = handCardSelected
  if (index < gameDeck.redraws.length && gameDeck.redraws[index].from) {
    fromCard = useFragment(DeckUnitFragmentFragmentDoc, gameDeck.redraws[index].from)
  }
  const fromCardUnit = useFragment(CardUnitFragmentFragmentDoc, fromCard?.unit)
  let toCard: DeckUnitFragmentFragment | undefined = undefined
  if (gameDeck.redraws.length >= index + 1 && gameDeck.redraws[index].to) {
    toCard = useFragment(DeckUnitFragmentFragmentDoc, gameDeck.redraws[index].to)
  }
  const toCardUnit: CardUnitFragmentFragment | undefined = useFragment(CardUnitFragmentFragmentDoc, toCard?.unit)
  const units: UnitForPlayer[] = [fromCard, toCard]
    .filter((deckUnit) => !!deckUnit)
    .map((deckUnit) => {
      return {
        playerId: self.user.id,
        unitFragment: deckUnit,
      }
    })
  const redrawCardSelectedUnit = useFragment(CardUnitFragmentFragmentDoc, redrawCardSelected?.unit)
  const handCardSelectedUnit = useFragment(CardUnitFragmentFragmentDoc, handCardSelected?.unit)
  const toCardSelected = toCardUnit && [redrawCardSelectedUnit?.id, handCardSelectedUnit?.id].includes(toCardUnit.id)
  const toCardDotted = toCardSelected && !handUnitIds.includes(toCardUnit.id)
  const fromCardSelected =
    fromCardUnit && [redrawCardSelectedUnit?.id, handCardSelectedUnit?.id].includes(fromCardUnit.id)
  const fromCardDotted = fromCardSelected && !handUnitIds.includes(fromCardUnit.id)

  return (
    <div className="game-deck-redraw-card-container" key={index}>
      {index < gameDeck.redraws.length || (index === gameDeck.redraws.length && redrawProps.loading) ? (
        <div className={HTML_CLASSES.GameDeckRedrawPair}>
          {fromCard && (
            <UnitGameCard
              deckUnit={fromCard}
              selected={fromCardSelected}
              dotted={fromCardDotted}
              dottedTitle={fromCardDotted ? 'This unit is no longer in your hand' : ''}
              onClick={() => {
                setRedrawCardSelected(fromCardSelected ? undefined : fromCard)
                if (fromCardUnit && handUnitIds.includes(fromCardUnit.id)) {
                  setHandCardSelected(fromCardSelected ? undefined : fromCard)
                } else {
                  setHandCardSelected(undefined)
                }
              }}
              onFullscreen={() => {
                setFullUnits({
                  currentIndex: 0,
                  units,
                })
                setRedrawCardSelected(fromCard)
                if (fromCardUnit && handUnitIds.includes(fromCardUnit.id)) {
                  setHandCardSelected(fromCard)
                } else {
                  setHandCardSelected(undefined)
                }
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
                setRedrawCardSelected(toCardSelected ? undefined : toCard)
                if (toCardUnit && handUnitIds.includes(toCardUnit.id)) {
                  setHandCardSelected(toCardSelected ? undefined : toCard)
                } else {
                  setHandCardSelected(undefined)
                }
              }}
              onFullscreen={() => {
                setFullUnits({
                  currentIndex: 1,
                  units,
                })
                setRedrawCardSelected(toCard)
                if (toCardUnit && handUnitIds.includes(toCardUnit.id)) {
                  setHandCardSelected(toCard)
                } else {
                  setHandCardSelected(undefined)
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
            if (handCardSelectedUnit && index === gameDeck.redraws.length) {
              await retryCheckingAuth({
                checkAuth,
                method: async () => {
                  await redrawProps.redraw({
                    variables: {
                      unit: handCardSelectedUnit.id,
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
}
