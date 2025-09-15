import { Dispatch, SetStateAction } from 'react'

import Centered from '../../components/Centered'
import { GameFragment } from '@gwent/graphql-schema/apollo-typings'
import { getErrorMessages } from '../../util/error-util'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import LoadingBar from '../../components/LoadingBar'
import LoadingSpinner from '../../components/LoadingSpinner'
import { SetDeckProps } from './GameProps'

/**
 * A dialog where a User can set the Deck they want to play with in a Game.
 */
export default function GameSetDeck({
  alreadySet,
  game,
  setDeckListOpen,
  setDeckProps,
}: {
  alreadySet: boolean
  game: GameFragment
  setDeckListOpen: Dispatch<SetStateAction<boolean>>
  setDeckProps: SetDeckProps
}) {
  const setDeckErrorMessages = getErrorMessages(setDeckProps.error)
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
            {setDeckErrorMessages && (
              <span
                id={HTML_IDS.GameDeckError}
                className={HTML_CLASSES.ErrorText}
              >{`Error choosing deck: ${setDeckErrorMessages}`}</span>
            )}
          </div>
        )}
      </Centered>
    </div>
  )
}
