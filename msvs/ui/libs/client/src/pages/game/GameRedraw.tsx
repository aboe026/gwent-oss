import { CgArrowLongRight } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'

import Centered from '../../components/Centered'
import CoinToss from '../../components/CoinToss'
import {
  DeckUnit,
  GamePlayer,
  Game,
  GameDeckFragmentFragment,
  DeckUnitFragmentFragmentDoc,
  useFragment,
  CardUnitFragmentFragmentDoc,
} from '@gwent/graphql-schema/apollo-typings'
import { FullUnitCards, ReadyProps, RedrawProps } from './GameProps'
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
  game: Game
  gameDeck: GameDeckFragmentFragment | null | undefined
  handCardSelected: DeckUnit | undefined
  readyProps: ReadyProps
  redrawCardSelected: DeckUnit | undefined
  redrawProps: RedrawProps
  self: GamePlayer
  setCoinTossVisible: Dispatch<SetStateAction<boolean>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
  setRedrawCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
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
            {[...Array(MAX_REDRAWS)].map((_, index) => {
              const fromCard = (
                index < gameDeck.redraws.length && gameDeck.redraws[index].from
                  ? gameDeck.redraws[index].from
                  : handCardSelected
              ) as DeckUnit
              const toCard = (gameDeck.redraws.length >= index + 1 && gameDeck.redraws[index].to) as DeckUnit
              const units = [fromCard, toCard]
                .filter((deckUnit) => !!deckUnit)
                .map((deckUnit) => {
                  return {
                    playerId: self.user.id,
                    unit: deckUnit,
                  }
                })
              const toCardSelected =
                toCard && [redrawCardSelected?.unit.id, handCardSelected?.unit.id].includes(toCard.unit.id)
              const toCardDotted = toCardSelected && !handUnitIds.includes(toCard.unit.id)
              const fromCardSelected =
                fromCard && [redrawCardSelected?.unit.id, handCardSelected?.unit.id].includes(fromCard.unit.id)
              const fromCardDotted = fromCardSelected && !handUnitIds.includes(fromCard.unit.id)

              return (
                <div className="game-deck-redraw-card-container" key={index}>
                  {index < gameDeck.redraws.length || (index === gameDeck.redraws.length && redrawProps.loading) ? (
                    <div className={HTML_CLASSES.GameDeckRedrawPair}>
                      <UnitGameCard
                        deckUnit={fromCard}
                        selected={fromCardSelected}
                        dotted={fromCardDotted}
                        dottedTitle={fromCardDotted ? 'This unit is no longer in your hand' : ''}
                        onClick={() => {
                          setRedrawCardSelected(fromCardSelected ? undefined : fromCard)
                          if (handUnitIds.includes(fromCard.unit.id)) {
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
                          if (handUnitIds.includes(fromCard.unit.id)) {
                            setHandCardSelected(fromCard)
                          } else {
                            setHandCardSelected(undefined)
                          }
                        }}
                      />
                      <CgArrowLongRight color="black" title="Redrawn to" />
                      {index < gameDeck.redraws.length ? (
                        <UnitGameCard
                          deckUnit={toCard}
                          selected={toCardSelected}
                          dotted={toCardDotted}
                          dottedTitle={toCardDotted ? 'This unit is no longer in your hand' : ''}
                          onClick={() => {
                            setRedrawCardSelected(toCardSelected ? undefined : toCard)
                            if (handUnitIds.includes(toCard.unit.id)) {
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
                            if (handUnitIds.includes(toCard.unit.id)) {
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
