import { useNavigate } from 'react-router-dom'

import { ROUTES } from '@gwent/constants'
import { useTitle } from '../components/TabTitle'
import DeckEditor from '../components/DeckEditor'

/**
 * The page to configure a user created Deck
 *
 * @returns The page to configure decks
 */
export default function DeckPage() {
  useTitle('Deck | Gwent')
  const navigate = useNavigate()
  return <DeckEditor onCancel={() => navigate(ROUTES.Decks.path)} onSave={() => navigate(ROUTES.Decks.path)} />
}
