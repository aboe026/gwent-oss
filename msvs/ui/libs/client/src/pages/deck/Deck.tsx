import { useNavigate } from 'react-router'

import DeckEditor from '../../components/DeckEditor'
import { ROUTES } from '@gwent-oss/constants'
import { useTitle } from '../../components/TabTitle'

/**
 * The page to configure a user created Deck.
 *
 * @returns The page to configure decks.
 */
export default function DeckPage() {
  useTitle('Deck | gwent-oss')
  const navigate = useNavigate()
  return <DeckEditor onCancel={() => navigate(ROUTES.Decks.path)} onSave={() => navigate(ROUTES.Decks.path)} />
}
