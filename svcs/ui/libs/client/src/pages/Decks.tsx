import DeckList from '../components/DeckList.jsx'
import { HTML_IDS } from '@gwent/constants'
import { useTitle } from '../components/TabTitle.jsx'
import './Decks.css'

/**
 * The page listing a users created decks.
 *
 * @returns The users created decks page.
 */
export default function DecksPage() {
  useTitle('Decks | Gwent')

  return (
    <div id={HTML_IDS.DecksContainer}>
      <DeckList paddingBottom="10px" />
    </div>
  )
}
