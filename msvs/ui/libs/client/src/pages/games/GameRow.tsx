import { useFragment } from '@apollo/client/react'
import { useNavigate } from 'react-router'

import {
  GameFragmentFragmentDoc,
  GamePlayerFragmentFragmentDoc,
  GameFactionFragmentFragmentDoc,
  GameFragmentFragment,
  GamePlayerFragmentFragment,
} from '@gwent/graphql-schema/apollo-typings'
import { HTML_CLASSES, ROUTES } from '@gwent/constants'
import { humanizeDay, formatGameStatus, humanizeTime } from '@gwent/utils'
import './GameRow.css'
import { FragmentType } from '@apollo/client'

// TODO: move other CSS from Games.css to GameRow.css
/**
 * A row with information about a specific game
 *
 * @returns The Game row
 */
export default function GameRow({ gameFragment }: GameRowProps) {
  const navigate = useNavigate()
  console.log(`TEST gameFragment: "${JSON.stringify(gameFragment)}"`)
  const {
    data: game,
    complete,
    dataState,
    missing,
  } = useFragment({
    fragment: GameFragmentFragmentDoc,
    from: gameFragment,
    fragmentName: 'GameFragment',
  })
  console.log(`TEST complete: "${complete}"`)
  if (!complete) return null
  console.log(`TEST dataState: "${dataState}"`)
  console.log(`TEST missing: "${missing}"`)
  console.log(`TEST game: "${JSON.stringify(game)}"`)
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
          <PlayerName playerFragment={player} index={index} />
        ))}
      </div>
      <div className="multi-row-cell">
        {game.players.map((player, index) => (
          <PlayerFaction playerFragment={player} index={index} />
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

function PlayerName({
  playerFragment,
  index,
}: {
  playerFragment: FragmentType<GamePlayerFragmentFragment>
  index: number
}) {
  const { data: player, complete } = useFragment({
    fragment: GamePlayerFragmentFragmentDoc,
    from: playerFragment,
    fragmentName: 'GamePlayerFragment',
  })
  if (!complete) return null
  return (
    <span className={HTML_CLASSES.GameRowPlayer} key={index}>
      {player.user.name}
    </span>
  )
}

function PlayerFaction({
  playerFragment,
  index,
}: {
  playerFragment: FragmentType<GamePlayerFragmentFragment>
  index: number
}) {
  let factionName = ''
  const { data: gamePlayer, complete: gamePlayerComplete } = useFragment({
    fragment: GamePlayerFragmentFragmentDoc,
    from: playerFragment,
    fragmentName: 'GamePlayerFragment',
  })
  if (!gamePlayerComplete) return null
  const { data: playerFaction, complete: playerFactionComplete } = useFragment({
    fragment: GameFactionFragmentFragmentDoc,
    from: gamePlayer.faction || null,
    fragmentName: 'GameFactionFragment',
  })
  if (gamePlayer.faction) {
    if (!playerFactionComplete) return null
    factionName = playerFaction.name
  }
  return (
    <span className={HTML_CLASSES.GameRowFaction} key={index}>
      {factionName}
    </span>
  )
}

interface GameRowProps {
  gameFragment: FragmentType<GameFragmentFragment>
}
