import { useNavigate } from 'react-router'

import {
  FragmentType,
  GameFragmentDoc,
  GamePlayerFragmentDoc,
  GameFactionFragmentDoc,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import { HTML_CLASSES, ROUTES } from '@gwent/constants'
import { humanizeDay, formatGameStatus, humanizeTime } from '@gwent/utils'
import './GameRow.css'

/**
 * A row with information about a specific game
 *
 * @returns The Game row
 */
export default function GameRow({ gameFragment }: GameRowProps) {
  const navigate = useNavigate()
  const game = useFragment(GameFragmentDoc, gameFragment)
  const status = formatGameStatus(game.status)
  const rowUrl = ROUTES.Game.path.replace(':gameId', game.id)

  return (
    <div key={game.id} className="game-list-row" onClick={() => navigate(rowUrl)}>
      <div title={game.created} className="multi-row-cell">
        <span className={HTML_CLASSES.GameRowCreatedDay}>{humanizeDay(game.created)}</span>
        <span className={HTML_CLASSES.GameRowCreatedTime}>{humanizeTime(game.created)}</span>
      </div>
      <div title={game.updated} className="multi-row-cell">
        <span className={HTML_CLASSES.GameRowUpdatedDay}>{humanizeDay(game.updated)}</span>
        <span className={HTML_CLASSES.GameRowUpdatedTime}>{humanizeTime(game.updated)}</span>
      </div>
      <div className={HTML_CLASSES.GameRowCreator}>{game.creator.name}</div>
      <div className="multi-row-cell">
        {game.players.map((player, index) => (
          <PlayerName playerFragment={player} key={index} />
        ))}
      </div>
      <div className="multi-row-cell">
        {game.players.map((player, index) => (
          <PlayerFaction playerFragment={player} key={index} />
        ))}
      </div>
      <div className={HTML_CLASSES.GameRowStatus}>{status}</div>
      <div className="multi-row-cell">
        {game.victors.map((victor, index) => {
          return (
            <span className={HTML_CLASSES.GameRowVictor} key={index}>
              {victor.name}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/**
 * A players name for a Game.
 */
function PlayerName({ playerFragment }: { playerFragment: FragmentType<typeof GamePlayerFragmentDoc> }) {
  const player = useFragment(GamePlayerFragmentDoc, playerFragment)
  return <span className={HTML_CLASSES.GameRowPlayer}>{player.user.name}</span>
}

/**
 * A players chosen Faction for a Game.
 */
function PlayerFaction({ playerFragment }: { playerFragment: FragmentType<typeof GamePlayerFragmentDoc> }) {
  const gamePlayer = useFragment(GamePlayerFragmentDoc, playerFragment)
  const playerFaction = useFragment(GameFactionFragmentDoc, gamePlayer.faction)
  return <span className={HTML_CLASSES.GameRowFaction}>{playerFaction?.name}</span>
}

interface GameRowProps {
  gameFragment: FragmentType<typeof GameFragmentDoc>
}
