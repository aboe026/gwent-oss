import { useNavigate } from 'react-router-dom'

import Centered from '../components/Centered'
import { HTML_IDS, ROUTES } from '@gwent/constants'
import { useUserContext } from '../App'
import './Home.css'

/**
 * The home page of the application
 *
 * @returns The application home page
 */
export default function HomePage() {
  const { user } = useUserContext()
  const navigate = useNavigate()

  return (
    <Centered>
      <div id={HTML_IDS.HomeContent}>
        <div id={HTML_IDS.HomeGreeting}>Welcome {user?.name}!</div>
        <div id={HTML_IDS.HomeOptions}>
          <div className="home-category">
            <span className="home-category-header">Decks</span>
            <button id={HTML_IDS.HomeOptionsViewDecks} type="button" onClick={() => navigate(ROUTES.Decks.path)}>
              View Decks
            </button>
            <button
              id={HTML_IDS.HomeOptionsCreateDeck}
              type="button"
              onClick={() => navigate(ROUTES.Deck.path.replace(':deckId', 'new'))}
            >
              Create Deck
            </button>
          </div>
          <div className="home-category">
            <span className="home-category-header">Games</span>
            <button id={HTML_IDS.HomeOptionsViewGames} type="button" onClick={() => navigate(ROUTES.Games.path)}>
              View Games
            </button>
            <button
              id={HTML_IDS.HomeOptionsCreateGame}
              type="button"
              onClick={() => navigate(ROUTES.Game.path.replace(':gameId', 'new'))}
            >
              Create Game
            </button>
          </div>
          <div className="home-category">
            <span className="home-category-header">Profile</span>
            <button id={HTML_IDS.HomeOptionsViewProfile} type="button" onClick={() => navigate(ROUTES.Profile.path)}>
              View Profile
            </button>
          </div>
        </div>
      </div>
    </Centered>
  )
}
