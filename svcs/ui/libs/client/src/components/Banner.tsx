import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { HTML_IDS } from '@gwent/constants'
import { ROUTES } from '@gwent/constants'
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
  const navigate = useNavigate()

  const clickMenuItem = (path: string) => {
    toggleMenu(!menuOpen)
    navigate(path)
  }

  return (
    <>
      <div id={HTML_IDS.Banner}>
        <div className="banner-item">
          {user && (
            <div id={HTML_IDS.Hamburger} onClick={() => toggleMenu(!menuOpen)}>
              <div id="bun">
                <div className="patty" />
                <div className="patty" />
                <div className="patty" />
              </div>
            </div>
          )}
        </div>
        <h1
          id={HTML_IDS.MainTitle}
          className={`banner-item ${user && 'pointable'}`}
          onClick={() => navigate(ROUTES.Home.path)}
        >
          Gwent
        </h1>
        <div className="banner-item">
          <h3
            className="banner-item pointable"
            id={HTML_IDS.BannerUsername}
            onClick={() => navigate(ROUTES.Profile.path)}
          >
            {user?.name}
          </h3>
        </div>
      </div>
      {menuOpen && (
        <div id={HTML_IDS.MenuItems}>
          <div id={HTML_IDS.MenutItemsHome} className="pointable" onClick={() => clickMenuItem(ROUTES.Home.path)}>
            Home
          </div>
          <div id={HTML_IDS.MenuItemsDeck} className="pointable" onClick={() => clickMenuItem(ROUTES.Decks.path)}>
            Decks
          </div>
          <div id={HTML_IDS.MenuItemsProfile} className="pointable" onClick={() => clickMenuItem(ROUTES.Profile.path)}>
            Profile
          </div>
          <div id={HTML_IDS.MenuItemsAbout} className="pointable" onClick={() => clickMenuItem(ROUTES.About.path)}>
            About
          </div>
        </div>
      )}
    </>
  )
}
