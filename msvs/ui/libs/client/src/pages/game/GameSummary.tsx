import { useNavigate } from 'react-router'

import { Game, RoundResult } from '@gwent/graphql-schema/apollo-typings'
import { HTML_CLASSES, HTML_IDS, ROUTES } from '@gwent/constants'

/**
 * A breakdown of the results of a finished Game.
 */
export default function GameSummary({ game }: { game: Game }) {
  const navigate = useNavigate()
  const victorNames = game.victors.map((victor) => victor.name)
  const victoryText = `Congratulations to the victor${victorNames.length > 1 ? 's' : ''}:`

  return (
    <div id={HTML_IDS.GameSummaryContainer} className="game-section">
      <div id={HTML_IDS.GameSummaryVictorsContainer}>
        <span id={HTML_IDS.GameSummaryCongratulations}>{victoryText}</span>
        <div id={HTML_IDS.GameSummaryVictorsList}>
          {victorNames.map((victorName, index) => (
            <span key={index}>{victorName}</span>
          ))}
        </div>
      </div>
      <table id={HTML_IDS.GameSummaryRoundBreakdown}>
        <caption>Breakdown of round by score:</caption>
        <thead>
          <tr>
            <th>User</th>
            {Array.from(Array(game.round), (_, i) => i + 1).map((index) => (
              <th key={index}>Round {index}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {game.players.map((player, playerIndex) => (
            <tr key={playerIndex} className={HTML_CLASSES.GameSummaryVictorRow}>
              <td className="game-victor-username">{player.user.name}</td>
              {player.rounds.map((round, roundIndex) => (
                <td
                  className={`${HTML_CLASSES.GameSummaryVictorRound} ${
                    round.result === RoundResult.Won
                      ? HTML_CLASSES.GameSummaryRoundWon
                      : HTML_CLASSES.GameSummaryRoundLost
                  }`}
                  key={roundIndex}
                >
                  {round.score}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button id={HTML_IDS.GameSummaryGames} type="button" onClick={() => navigate(ROUTES.Games.path)}>
        Back to Games
      </button>
    </div>
  )
}
