import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { HTML_IDS } from '@gwent/constants'
import routes from '../routes'
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
        <h1 className={`banner-item ${user && 'pointable'}`} onClick={() => navigate(routes.Home.path)}>
          Gwent
        </h1>
        <div className="banner-item">
          <h2
            className="banner-item pointable"
            id={HTML_IDS.BannerUsername}
            onClick={() => navigate(routes.Profile.path)}
          >
            {user?.name}
          </h2>
        </div>
      </div>
      {menuOpen && (
        <div id={HTML_IDS.MenuItems}>
          <div id={HTML_IDS.MenutItemsHome} className="pointable" onClick={() => clickMenuItem(routes.Home.path)}>
            Home
          </div>
          <div id={HTML_IDS.MenutItemsHome} className="pointable" onClick={() => clickMenuItem(routes.Profile.path)}>
            Profile
          </div>
        </div>
      )}
    </>
  )
}
