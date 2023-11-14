import Centered from '../components/Centered'
import { HTML_IDS } from '@gwent/constants'

/**
 * The home page of the application
 *
 * @returns The application home page
 */
export default function HomePage() {
  return (
    <Centered>
      <div id={HTML_IDS.Home}>Welcome Home!</div>
    </Centered>
  )
}
