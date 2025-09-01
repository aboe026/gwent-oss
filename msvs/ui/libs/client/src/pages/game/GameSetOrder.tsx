import { CgChevronUp, CgChevronDown } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'

import Centered from '../../components/Centered'
import { GamePlayer, Game, FactionKey } from '@gwent/graphql-schema/apollo-typings'
import { getErrorMessages, retryCheckingAuth } from '../../util/error-util'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import LoadingBar from '../../components/LoadingBar'
import LoadingSpinner from '../../components/LoadingSpinner'
import { SetOrderProps } from './GameProps'
import { useUserContext } from '../../UserContext'

/**
 * Allows user to set the turn order for a Game.
 */
export default function GameSetOrder({
  game,
  playerOrder,
  self,
  setOrderProps,
  setPlayerOrder,
}: {
  game: Game
  playerOrder: GamePlayer[]
  self: GamePlayer
  setOrderProps: SetOrderProps
  setPlayerOrder: Dispatch<SetStateAction<GamePlayer[]>>
}) {
  const { checkAuth } = useUserContext()
  const setOrderErrorMessages = getErrorMessages(setOrderProps.error)
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
            {setOrderErrorMessages && (
              <span
                id={HTML_IDS.GameOrderError}
                className={HTML_CLASSES.ErrorText}
              >{`Error setting order: ${setOrderErrorMessages}`}</span>
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
