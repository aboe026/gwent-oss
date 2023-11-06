import { Link } from 'react-router-dom'
import { useState } from 'react'

import { HTML_IDS } from '@gwent/constants'
import { useUserContext } from '../App'
import './Banner.css'

/**
 * The top banner of the application
 *
 * @returns The application banner
 */
export default function Banner() {
  const [menuOpen, toggleMenu] = useState(false)
  const { user } = useUserContext()

  return (
    <>
      <div id={HTML_IDS.Banner}>
        <div className="banner-item">
          <div id={HTML_IDS.Hamburger} onClick={() => toggleMenu(!menuOpen)}>
            <div id="bun">
              <div className="patty" />
              <div className="patty" />
              <div className="patty" />
            </div>
          </div>
        </div>
        <h1 className="banner-item">Gwent</h1>
        <div className="banner-item">
          <h2 className="banner-item" id={HTML_IDS.BannerUsername}>
            {user?.name}
          </h2>
        </div>
      </div>
      {menuOpen && (
        <div id={HTML_IDS.MenuItems}>
          <div>Decks</div>
          <div>Games</div>
          <div>Stats</div>
          <Link to="/profile" id={HTML_IDS.MenuItemsProfile}>
            Profile
          </Link>
        </div>
      )}
    </>
  )
}
