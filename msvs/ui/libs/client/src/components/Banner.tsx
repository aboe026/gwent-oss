import { useContext, useState } from 'react'
import { useNavigate } from 'react-router'

import { Button } from '../util/keyboard-listener'
import { ConnectionStatusContext, CONNECTION_STATUS } from '../ConnectionStatus'
import { HTML_IDS } from '@gwent-oss/constants'
import { ROUTES } from '@gwent-oss/constants'
import { useUserContext } from '../UserContext'
import './Banner.css'

/**
 * The top banner of the application
 *
 * @returns The application banner
 */
export default function Banner() {
  const { connectionStatus } = useContext(ConnectionStatusContext)
  const [menuOpen, toggleMenu] = useState(false)
  const { user } = useUserContext()
  const navigate = useNavigate()

  const clickMenuItem = (path: string) => {
    toggleMenu(!menuOpen)
    navigate(path)
  }

  let connectionStatusTitle = 'Online'
  let connectionStatusColor = 'green'
  if (connectionStatus === CONNECTION_STATUS.Interrupted) {
    connectionStatusTitle = 'Interrupted'
    connectionStatusColor = 'orange'
  } else if (connectionStatus === CONNECTION_STATUS.Failed) {
    connectionStatusTitle = 'Offline'
    connectionStatusColor = 'red'
  }

  return (
    <>
      <div id={HTML_IDS.BannerContainer}>
        <div className="banner-item">
          {user && (
            <div id={HTML_IDS.BannerHamburger} onClick={() => toggleMenu(!menuOpen)}>
              <div id="bannerBun">
                <div className="banner-patty" />
                <div className="banner-patty" />
                <div className="banner-patty" />
              </div>
            </div>
          )}
        </div>
        <h1
          id={HTML_IDS.BannerMainTitle}
          className={'banner-item pointable'}
          onClick={() => navigate(ROUTES.Home.path)}
          onMouseDown={(event) => {
            if (event.button === Button.Wheel) {
              window.open(ROUTES.Home.path, '_blank')
            }
          }}
        >
          gwent-oss
        </h1>
        <div className="banner-item">
          {user?.name && (
            <div
              id="bannerConnectionStatus"
              title={`Connection Status: ${connectionStatusTitle}`}
              style={{ backgroundColor: connectionStatusColor }}
            />
          )}
          <h3
            className="pointable"
            id={HTML_IDS.BannerUsername}
            onClick={() => navigate(ROUTES.Profile.path)}
            onMouseDown={(event) => {
              if (event.button === Button.Wheel) {
                window.open(ROUTES.Profile.path, '_blank')
              }
            }}
          >
            {user?.name}
          </h3>
        </div>
      </div>
      {menuOpen && (
        <div id={HTML_IDS.BannerMenuItems}>
          <div
            id={HTML_IDS.BannerMenutItemsHome}
            className="pointable"
            onClick={() => clickMenuItem(ROUTES.Home.path)}
            onMouseDown={(event) => {
              if (event.button === Button.Wheel) {
                window.open(ROUTES.Home.path, '_blank')
              }
            }}
          >
            Home
          </div>
          <div
            id={HTML_IDS.BannerMenuItemsDeck}
            className="pointable"
            onClick={() => clickMenuItem(ROUTES.Decks.path)}
            onMouseDown={(event) => {
              if (event.button === Button.Wheel) {
                window.open(ROUTES.Decks.path, '_blank')
              }
            }}
          >
            Decks
          </div>
          <div
            id={HTML_IDS.BannerMenuItemsGames}
            className="pointable"
            onClick={() => clickMenuItem(ROUTES.Games.path)}
            onMouseDown={(event) => {
              if (event.button === Button.Wheel) {
                window.open(ROUTES.Games.path, '_blank')
              }
            }}
          >
            Games
          </div>
          <div
            id={HTML_IDS.BannerMenuItemsProfile}
            className="pointable"
            onClick={() => clickMenuItem(ROUTES.Profile.path)}
            onMouseDown={(event) => {
              if (event.button === Button.Wheel) {
                window.open(ROUTES.Profile.path, '_blank')
              }
            }}
          >
            Profile
          </div>
          <div
            id={HTML_IDS.BannerMenuItemsAbout}
            className="pointable"
            onClick={() => clickMenuItem(ROUTES.About.path)}
            onMouseDown={(event) => {
              if (event.button === Button.Wheel) {
                window.open(ROUTES.About.path, '_blank')
              }
            }}
          >
            About
          </div>
        </div>
      )}
    </>
  )
}
