import { ErrorLike, FragmentType } from '@apollo/client'

import Centered from './Centered'
import {
  DeckFragmentFragment,
  DeckFragmentFragmentDoc,
  DeckStatsFragment,
  DeckStatsFragmentDoc,
  FactionFragmentFragment,
  FactionFragmentFragmentDoc,
  FactionKey,
  FactionStatsQuery,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import { HTML_CLASSES } from '@gwent/constants'
import LoadingSpinner from './LoadingSpinner'
import ProgressBar from './ProgressBar'
import './DeckRow.css'
import { getErrorMessages } from '../util/error-util'
import { IconType } from 'react-icons'

/**
 * A Row representing a users created Deck
 *
 * @returns The Deck as a row
 */
export default function DeckRow({ actions, actionsDisabled, deckFragment, neutralFactionStats }: DeckRowProps) {
  const deck = useFragment(DeckFragmentFragmentDoc, deckFragment)

  return (
    <div key={deck.id} className={HTML_CLASSES.DeckListDeckContainer}>
      <div className="deck-list-deck-section deck-list-deck-name-faction">
        <div className="deck-list-deck-sub-section deck-list-deck-name-created">
          <span className={HTML_CLASSES.DeckListDeckName}>{deck.name}</span>
          <span className={HTML_CLASSES.DeckListDeckCreated} title={deck.created}>
            {new Date(deck.created).toLocaleDateString('en-us', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <DeckFaction factionFragment={deck.faction} />
      </div>
      <div className="deck-list-deck-section">
        <div className="deck-list-deck-sub-section">
          <img src={deck.leader.image} title={deck.leader.name} className={HTML_CLASSES.DeckListDeckLeaderImage} />
          <div className="deck-list-deck-leader-name-ability">
            <span className={HTML_CLASSES.DeckListDeckLeaderName}>{deck.leader.name}</span>
            <span className={HTML_CLASSES.DeckListDeckLeaderAbility}>{deck.leader.ability}</span>
          </div>
        </div>
      </div>
      {renderDeckStats({
        deck,
        neutralFactionStats: neutralFactionStats,
      })}
      {actions && actions.length > 0 && (
        <div className="deck-list-deck-actions-container">
          {actions.map((action, index) => (
            <div
              key={index}
              onClick={() => !actionsDisabled && action.onClick(deck)}
              title={action.title}
              className={`deck-list-deck-action-button ${action.className}`}
            >
              <action.icon />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * The faction the deck was configured to use.
 */
function DeckFaction({ factionFragment }: { factionFragment: FragmentType<FactionFragmentFragment> }) {
  const faction = useFragment(FactionFragmentFragmentDoc, factionFragment)
  return (
    <div className="deck-list-deck-sub-section deck-list-faction">
      <img src={faction.image} title={faction.name} className={HTML_CLASSES.DeckListDeckFactionImage} />
      <div className="deck-list-deck-faction-name-ability">
        <span className={HTML_CLASSES.DeckListDeckFactionName}>{faction.name}</span>
        <span className={HTML_CLASSES.DeckListDeckFactionAbility}>{faction.ability}</span>
      </div>
    </div>
  )
}

/**
 * A group of all statistics for the Deck.
 */
function renderDeckStats({
  deck,
  neutralFactionStats,
}: {
  deck: DeckFragmentFragment
  neutralFactionStats: FactionStatsProps
}) {
  const neutralFaction = neutralFactionStats.data?.factions.find((faction) => faction.key === FactionKey.Neutral)
  const errorMessages = getErrorMessages(neutralFactionStats.error)

  return (
    <div className="deck-list-deck-section deck-list-deck-stats">
      {neutralFactionStats.loading ? (
        <Centered>
          <LoadingSpinner size="100px" />
        </Centered>
      ) : errorMessages || !neutralFaction ? (
        <Centered>
          <div className="error-text">{`Error getting Neutral faction stats: ${errorMessages}`}</div>
        </Centered>
      ) : (
        renderDeckStatsGroups({
          deck,
          neutralStatsFragment: neutralFaction.stats,
        })
      )}
    </div>
  )
}

/**
 * Render the deck stats in groups
 */
function renderDeckStatsGroups({
  deck,
  neutralStatsFragment,
}: {
  deck: DeckFragmentFragment
  neutralStatsFragment: FragmentType<DeckStatsFragment>
}) {
  const deckStats = useFragment(DeckStatsFragmentDoc, deck.stats)
  const neutralStats = useFragment(DeckStatsFragmentDoc, neutralStatsFragment)
  return (
    <>
      <div className="deck-list-deck-stats-group">
        {renderDeckStat({
          deck,
          neutralStats,
          label: 'Units',
          stat: 'units',
        })}
        {renderDeckStat({
          deck,
          neutralStats,
          label: 'Specials',
          stat: 'specials',
        })}
        {renderDeckStat({
          deck,
          neutralStats,
          label: 'Heroes',
          stat: 'heroes',
        })}
        {renderDeckStat({
          deck,
          neutralStats,
          label: 'Strength',
          stat: 'strengthTotal',
        })}
        <div>
          <span>Strength Average:</span>
          <span className="deck-stat-strengthAverage-value deck-stat-value">
            {deckStats.strengthAverage.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="deck-list-deck-stats-group">
        {renderDeckStat({
          deck,
          neutralStats,
          label: 'Close',
          stat: 'close',
        })}
        {renderDeckStat({
          deck,
          neutralStats,
          label: 'Ranged',
          stat: 'ranged',
        })}
        {renderDeckStat({
          deck,
          neutralStats,
          label: 'Siege',
          stat: 'siege',
        })}
        {renderDeckStat({
          deck,
          neutralStats,
          label: 'Agile',
          stat: 'agile',
        })}
      </div>
    </>
  )
}

/**
 * A progress bar indicating how many of a certain statistic is present in the Deck.
 */
function renderDeckStat({
  deck,
  label,
  stat,
  neutralStats,
}: {
  deck: DeckFragmentFragment
  label: string
  stat: keyof DeckStatsFragment
  neutralStats: DeckStatsFragment
}) {
  const faction = useFragment(FactionFragmentFragmentDoc, deck.faction)
  const factionStats = useFragment(DeckStatsFragmentDoc, faction.stats)
  const deckStats = useFragment(DeckStatsFragmentDoc, deck.stats)
  const available = (factionStats[stat] as number) + (neutralStats[stat] as number)
  const chosen = deckStats[stat] as number

  return (
    <div>
      <div>
        <span>{`${label}:`}</span>
        <span className={`deck-stat-${stat}-value deck-stat-value`}>
          {chosen}/{available}
        </span>
      </div>
      <ProgressBar completeColor="gray" remainingColor="lightgray" height="10px" percent={(chosen / available) * 100} />
    </div>
  )
}

interface DeckRowProps {
  actions?: Action[]
  actionsDisabled?: boolean
  deckFragment: FragmentType<DeckFragmentFragment>
  neutralFactionStats: FactionStatsProps
}

interface FactionStatsProps {
  data: FactionStatsQuery | undefined
  loading: boolean
  error: ErrorLike | undefined
}

export interface Action {
  title: string
  className: string
  icon: IconType
  onClick: (deck: DeckFragmentFragment) => any // eslint-disable-line @typescript-eslint/no-explicit-any
}
