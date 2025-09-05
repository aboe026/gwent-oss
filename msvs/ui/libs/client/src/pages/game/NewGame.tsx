import { useNavigate } from 'react-router'

import { AddGameProps } from './GameProps'
import Centered from '../../components/Centered'
import Form from '../../components/Form'
import { GameFragmentFragmentDoc, useFragment } from '@gwent/graphql-schema/apollo-typings'
import { HTML_IDS, PLAYER_COUNTS, ROUTES } from '@gwent/constants'
import { retryCheckingAuth } from '../../util/error-util'
import { useUserContext } from '../../UserContext'

/**
 * Form for creating a new Game.
 */
export default function NewGame({ addGameProps }: { addGameProps: AddGameProps }) {
  const { checkAuth, user } = useUserContext()
  const navigate = useNavigate()

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
        error={addGameProps.error}
        errorId={HTML_IDS.GameNewError}
        loading={addGameProps.loading}
        onSubmit={async ({ variables }) => {
          await retryCheckingAuth({
            checkAuth,
            method: async () => {
              const game = await addGameProps.addGame({
                variables: {
                  opponentNames: [...Array(PLAYER_COUNTS.Max - 1)].map((_, index) => {
                    return variables[`player${index + 2}`]
                  }),
                },
              })
              const newGame = useFragment(GameFragmentFragmentDoc, game.data?.addGame)
              if (newGame) {
                navigate(ROUTES.Game.path.replace(':gameId', newGame.id))
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
