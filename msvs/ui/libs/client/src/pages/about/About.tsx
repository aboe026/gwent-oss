import urljoin from 'url-join'
import { useQuery } from '@apollo/client/react'
import { useState } from 'react'

import { ApplicationDocument } from '@gwent-oss/graphql-schema/apollo-typings'
import CoinToss from '../../components/CoinToss'
import Centered from '../../components/Centered'
import { GAME_ORDER_COIN_FLIP_DURATION_SECONDS, HTML_CLASSES, HTML_IDS } from '@gwent-oss/constants'
import { getErrorMessages } from '../../util/error-util'
import { getRandomNumber } from '@gwent-oss/utils'
import LoadingBar from '../../components/LoadingBar'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useTitle } from '../../components/TabTitle'
import './About.css'

/**
 * The about page containing application information.
 *
 * @returns The application about page.
 */
export default function AboutPage() {
  const [coinFlipKey, setCoinFlipKey] = useState(0)
  useTitle('About | gwent-oss')
  const { loading, error, data } = useQuery(ApplicationDocument)
  const errorMessages = getErrorMessages(error)
  const coinLandedHeads =
    getRandomNumber({
      min: 0,
      max: 1,
    }) === 0

  return (
    <div id={HTML_IDS.AboutContainer}>
      <div id={'aboutTitle'}>About</div>
      <div id={HTML_IDS.AboutContents}>
        <div id="aboutAlert">
          <div id="aboutAlertTitle">**Alpha Warning**</div>
          <div id="aboutAlertDescription">
            This website is currently in an "alpha" state, meaning it is in a technically playable state but is missing
            some features (mainly Faction and Leader abilities). Please communicate any issues you come across or ideas
            you have as{' '}
            <a href={`${urljoin(window.env.GITHUB_LINK, 'issues')}`} target="_">
              GitHub Issues
            </a>{' '}
            or email us at <a href={`mailto:${window.env.EMAIL_ADDRESS}`}>{window.env.EMAIL_ADDRESS}</a>
          </div>
        </div>
        <div id="what" className="about-section">
          <div className="about-section-title">What?</div>
          <div>
            This website attempts to recreate the card game Gwent from the Witcher 3: Wild Hunt with online multiplayer,
            all as an open-source project. This website has no affiliation with CD PROJEKT RED, it is purely a fan-made
            passion project.
          </div>
        </div>
        <div id="why" className="about-section">
          <div className="about-section-title">Why?</div>
          <div>
            After playing the Witcher 3: Wild Hunt, Gwent quickly became my favorite mini-game I've ever encountered,
            but I've always wanted to play with my friends. When Gwent: The Witcher Card Game was released, it didn't
            scratch quite the same itch as the Witcher 3 mini-game. Once my then-girlfriend (and now wife!) got into the
            Witcher 3: Wild Hunt and equally adored Gwent, I endeavoured to utilize my web-app building experience to
            create an online multiplayer recreation of the mini-game. Little did I know how long it would take to
            reverse-engineer the logic (so many edge cases and interactions between effects/abilities!). After many
            years the dream has finally been achieved (at least in a minimally-viable-product sense)! Hopefully this
            brings entertainment and joy to other Gwent lovers like myself.
          </div>
        </div>
        <div id="how" className="about-section">
          <div className="about-section-title">How?</div>
          <div>
            This project mainly utilized playing The Witcher 3: Wild Hunt mini-game Gwent to reverse-engineer how the
            game rules should be implemented. It also utilized the{' '}
            <a href="https://witcher.fandom.com/wiki/Gwent" target="_">
              Fandom Witcher Wiki
            </a>{' '}
            for resources such as descriptions and images. The source code for this website is freely available on
            GitHub at{' '}
            <a href={window.env.GITHUB_LINK} target="_">
              {window.env.GITHUB_LINK}
            </a>{' '}
            for the express purpose of community interaction, insight and contributions to help make this website better
            for everyone. You can even run your own instance of this website locally!
          </div>
        </div>
        <div id="who" className="about-section">
          <div className="about-section-title">Who?</div>
          <div>
            This project was created by Adam Boe, a software developer by profession and a gamer (both video and board)
            by hobby. Of course this project would not be possible without CD PROJEKT RED; though they did not
            contribute directly in any way to this project and are in no way affiliated with it, it is based off their
            work from the Witcher 3: Wild Hunt and their creating such a wonderful, unique and engaging min-game in
            Gwent that this project even exists, our greates thanks go out to them for their incredible work!
          </div>
        </div>
        <div id="when" className="about-section">
          <div className="about-section-title">When?</div>
          <div>
            This project began in the autumn of 2023 and is finally released (in alpha form) in the summer of 2026.
            There are many things{' '}
            <a href={urljoin(window.env.GITHUB_LINK, 'blob/main/TODO.md')} target="_">
              to do
            </a>{' '}
            yet, so stay tuned for updates!
          </div>
        </div>
        <div id="contact" className="about-section">
          <div className="about-section-title">Contact</div>
          <div>
            <ul id="contactList">
              <li>
                To report a bug or request a new feature, create a{' '}
                <a href={urljoin(window.env.GITHUB_LINK, 'issues')} target="_">
                  GitHub Issue
                </a>{' '}
              </li>
              <li>
                To contact the site owner directly, please email{' '}
                <a href={`mailto:${window.env.EMAIL_ADDRESS}`}>{window.env.EMAIL_ADDRESS}</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="about-section">
          <div className="about-section-title">Technical</div>
          {loading ? (
            <LoadingSpinner size="50px" />
          ) : error ? (
            <div className={HTML_CLASSES.ErrorText}>{`Error getting application information: ${errorMessages}`}</div>
          ) : (
            <table>
              <tbody>
                <tr>
                  <td>Version:</td>
                  <td id={HTML_IDS.AboutVersion}>{data?.application.version}</td>
                </tr>
                <tr>
                  <td>Build:</td>
                  <td id={HTML_IDS.AboutBuild}>{data?.application.build}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        <div id="animations" className="about-section">
          <div className="about-section-title">Animations</div>
          <div>
            Here are some of the animations used in this website. They took a bit of effort and I am pretty proud of
            them, so here they are to admire:
          </div>
          <div id="animationsContainer">
            <div id="animationsProgress" className="animation-child">
              <LoadingSpinner size="50px" />
              <LoadingBar width="100%" height="25px" style={{ maxWidth: '200px' }} />
            </div>
            <div className="animation-child pointable" onClick={() => setCoinFlipKey(coinFlipKey + 1)}>
              <Centered>
                <CoinToss
                  duration={`${GAME_ORDER_COIN_FLIP_DURATION_SECONDS - 1}s`}
                  delay="0s"
                  heads={coinLandedHeads}
                  size="100px"
                  bounce={true}
                  resultText={`Coin landed ${coinLandedHeads ? 'heads' : 'tails'} side up`}
                  key={coinFlipKey}
                  style={{ marginTop: '200px' }}
                />
              </Centered>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
