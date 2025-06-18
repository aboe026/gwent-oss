import { CgArrowLongRight } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'

import Centered from '../../components/Centered'
import CoinToss from '../../components/CoinToss'
import { DeckUnit, GamePlayer, Game, GameDeck } from '@gwent/graphql-schema/apollo-typings'
import { FullUnitCards, ReadyProps, RedrawProps } from './GameProps'
import { GAME_ORDER_COIN_FLIP_DURATION_SECONDS, HTML_CLASSES, HTML_IDS, MAX_REDRAWS } from '@gwent/constants'
import { getApolloError, retryCheckingAuth } from '../../util/error-util'
import LoadingBar from '../../components/LoadingBar'
import LoadingSpinner from '../../components/LoadingSpinner'
import UnitGameCard from '../../components/UnitGameCard'
import { useUserContext } from '../../App'

export default function GameRedraw({
  coinTossVisible,
  game,
  gameDeck,
  handCardSelected,
  readyProps,
  redrawProps,
  self,
  setFullUnits,
  setCoinTossVisible,
  setHandCardSelected,
}: {
  coinTossVisible: boolean
  game: Game
  gameDeck: GameDeck | undefined
  handCardSelected: DeckUnit | undefined
  readyProps: ReadyProps
  redrawProps: RedrawProps
  self: GamePlayer
  setCoinTossVisible: Dispatch<SetStateAction<boolean>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  setHandCardSelected: Dispatch<SetStateAction<DeckUnit | undefined>>
}) {
  const { checkAuth } = useUserContext()
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
              const units = [fromCard, toCard]
                .filter((deckUnit) => !!deckUnit)
                .map((deckUnit) => {
                  return {
                    playerId: self.user.id,
                    unit: deckUnit,
                  }
                })
              return (
                <div className="game-deck-redraw-card-container" key={index}>
                  {index < gameDeck.redraws.length || (index === gameDeck.redraws.length && redrawProps.loading) ? (
                    <div className={HTML_CLASSES.GameDeckRedrawPair}>
                      <UnitGameCard
                        deckUnit={fromCard}
                        cursor={'unset'}
                        onFullscreen={() => {
                          setFullUnits({
                            currentIndex: 0,
                            units,
                          })
                        }}
                      />
                      <CgArrowLongRight color="black" title="Redrawn to" />
                      {index < gameDeck.redraws.length ? (
                        <UnitGameCard
                          deckUnit={toCard}
                          cursor={'unset'}
                          onFullscreen={() => {
                            setFullUnits({
                              currentIndex: 1,
                              units,
                            })
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
