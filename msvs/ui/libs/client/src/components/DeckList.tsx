import { ApolloQueryResult, useQuery } from '@apollo/client'
import { CgArrowDown, CgArrowUp, CgClose, CgEyeAlt, CgEye, CgSync } from 'react-icons/cg'
import { Dispatch, SetStateAction, useState } from 'react'
import { NavigateFunction, useNavigate } from 'react-router'

import { Button } from '../util/keyboard-listener'
import Centered from '../components/Centered'
import CloseButton from './CloseButton'
import {
  Deck,
  DecksDocument,
  DecksQuery,
  Exact,
  FactionKey,
  FactionStatsDocument,
  FactionStatsQuery,
  InputMaybe,
} from '@gwent/graphql-schema/apollo-typings'
import { FILTER_FIELD, SORT_FIELD, SORT_ORDER } from '@gwent/graphql-schema/decks-filter'
import { getApolloError } from '../util/error-util'
import { HTML_CLASSES, HTML_IDS, ROUTES } from '@gwent/constants'
import { IconType } from 'react-icons'
import LoadingSpinner from '../components/LoadingSpinner'
import ProgressBar from '../components/ProgressBar'
import { sortObjectArray } from '@gwent/utils'
import { useUserContext } from '../App'
import './DeckList.css'
import { UnitStats } from '@gwent/graphql-schema/resolver-typings'

/**
 * The a list of a users created decks
 *
 * @returns The users created decks
 */
export default function DeckList({ actions, actionsDisabled, onClose, onCreate, paddingBottom = '0' }: DeckListProps) {
  const [nameFilter, setNameFilter] = useState('')
  const [sortField, setSortField] = useState<SORT_FIELD>(SORT_FIELD.Name)
  const [sortOrder, setSortOrder] = useState<SORT_ORDER>(SORT_ORDER.Asc)
  const [filterFields, setFilterFields] = useState<FILTER_FIELD[]>([])
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const { checkAuth } = useUserContext()
  const {
    loading: decksLoading,
    error: decksError,
    data: decksData,
    refetch: decksRefetch,
  } = useQuery(DecksDocument, {
    onError: (error) => {
      checkAuth(error, decksRefetch)
    },
    notifyOnNetworkStatusChange: true, // fixes "loading" to work properly on refetch
  })
  const {
    loading: neutralStatsLoading,
    error: neutralStatsError,
    data: neutralStatsData,
    refetch: neutralStatsRefetch,
  } = useQuery(FactionStatsDocument, {
    skip: !decksData?.decks || decksData.decks.length < 1,
    notifyOnNetworkStatusChange: true, // fixes "loading" to work properly on refetch
    variables: {
      keys: [FactionKey.Neutral],
    },
    onError: (error) => {
      checkAuth(error, neutralStatsRefetch)
    },
  })
  const navigate = useNavigate()
  const resolvedDecksError = getApolloError(decksError)
  const resolvedNeutralStatsError = getApolloError(neutralStatsError)

  const sortedDecks = sortObjectArray({
    array: decksData?.decks,
    sortProperties: [sortField, 'id'],
    reverse: sortOrder === SORT_ORDER.Asc ? false : true,
  })
  const filteredDecks = sortedDecks.filter((deck) =>
    isFilteredIn({
      deck: deck as Deck,
      fields: filterFields,
      name: nameFilter,
    })
  )
  const neutralStats = neutralStatsData?.factions.find((faction) => faction.key === FactionKey.Neutral)?.stats as
    | UnitStats
    | undefined

  return (
    <div id={HTML_IDS.DeckListContainer}>
      {renderHeader({
        filterFields,
        filtersExpanded,
        loading: decksLoading,
        nameFilter,
        navigate,
        onClose,
        onCreate,
        refetchDecks: decksRefetch,
        refetchNeutralStats: neutralStatsRefetch,
        setFilterFields,
        setFiltersExpanded,
        setNameFilter,
        setSortField,
        setSortOrder,
        sortField,
        sortOrder,
      })}
      {decksLoading ? (
        <Centered>
          <LoadingSpinner size="50px" />
        </Centered>
      ) : resolvedDecksError ? (
        <div
          id={HTML_IDS.DeckListError}
          className={HTML_CLASSES.ErrorText}
        >{`Error getting decks: ${resolvedDecksError}`}</div>
      ) : decksData?.decks?.length === 0 ? (
        <Centered>
          <div className="deck-list-message">
            <span id={HTML_IDS.DeckListNoneCreated}>No decks created yet</span>
            {renderCreateDeckButton({
              id: HTML_IDS.DeckListCreateNone,
              navigate,
              onCreate,
            })}
          </div>
        </Centered>
      ) : filteredDecks.length === 0 ? (
        <Centered>
          <div className="deck-list-message">
            <span id={HTML_IDS.DeckListNoneInFilter}>No decks match filter(s)</span>
            <button
              id={HTML_IDS.DeckListNoneClearFilter}
              type="button"
              className="pointable"
              autoFocus
              onClick={() => {
                setFilterFields([])
                setNameFilter('')
              }}
            >
              Clear Filters
            </button>
          </div>
        </Centered>
      ) : (
        <div id={HTML_IDS.DeckListContents} style={{ paddingBottom }}>
          {filteredDecks.map((deck) => {
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
                  <div className="deck-list-deck-sub-section deck-list-faction">
                    <img
                      src={deck.faction.image}
                      title={deck.faction.name}
                      className={HTML_CLASSES.DeckListDeckFactionImage}
                    />
                    <div className="deck-list-deck-faction-name-ability">
                      <span className={HTML_CLASSES.DeckListDeckFactionName}>{deck.faction.name}</span>
                      <span className={HTML_CLASSES.DeckListDeckFactionAbility}>{deck.faction.ability}</span>
                    </div>
                  </div>
                </div>
                <div className="deck-list-deck-section">
                  <div className="deck-list-deck-sub-section">
                    <img
                      src={deck.leader.image}
                      title={deck.leader.name}
                      className={HTML_CLASSES.DeckListDeckLeaderImage}
                    />
                    <div className="deck-list-deck-leader-name-ability">
                      <span className={HTML_CLASSES.DeckListDeckLeaderName}>{deck.leader.name}</span>
                      <span className={HTML_CLASSES.DeckListDeckLeaderAbility}>{deck.leader.ability}</span>
                    </div>
                  </div>
                </div>
                {renderDeckStats({
                  deck: deck as Deck,
                  neutralStats,
                  neutralLoading: neutralStatsLoading,
                  neutralError: resolvedNeutralStatsError,
                })}
                {actions && actions.length > 0 && (
                  <div className="deck-list-deck-actions-container">
                    {actions.map((action, index) => (
                      <div
                        key={index}
                        onClick={() => !actionsDisabled && action.onClick(deck as Deck)}
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
          })}
        </div>
      )}
    </div>
  )
}

/**
 * The headers for the Deck list table.
 */
function renderHeader({
  filterFields,
  filtersExpanded,
  loading,
  nameFilter,
  navigate,
  onClose,
  onCreate,
  refetchDecks,
  refetchNeutralStats,
  setFilterFields,
  setFiltersExpanded,
  setNameFilter,
  setSortField,
  setSortOrder,
  sortField,
  sortOrder,
}: {
  filterFields: FILTER_FIELD[]
  filtersExpanded: boolean
  loading: boolean
  nameFilter: string
  navigate: NavigateFunction
  onClose?: () => any // eslint-disable-line @typescript-eslint/no-explicit-any
  onCreate?: () => any // eslint-disable-line @typescript-eslint/no-explicit-any
  refetchDecks: (
    variables?:
      | Partial<
          Exact<{
            [key: string]: never
          }>
        >
      | undefined
  ) => Promise<ApolloQueryResult<DecksQuery>>
  refetchNeutralStats: (
    variables?:
      | Partial<
          Exact<{
            keys?: InputMaybe<Array<FactionKey> | FactionKey>
          }>
        >
      | undefined
  ) => Promise<ApolloQueryResult<FactionStatsQuery>>
  setFilterFields: Dispatch<SetStateAction<FILTER_FIELD[]>>
  setFiltersExpanded: Dispatch<SetStateAction<boolean>>
  setNameFilter: Dispatch<SetStateAction<string>>
  setSortField: Dispatch<SetStateAction<SORT_FIELD>>
  setSortOrder: Dispatch<SetStateAction<SORT_ORDER>>
  sortField: SORT_FIELD
  sortOrder: SORT_ORDER
}) {
  const buttonColor = 'black'
  const filters = [
    {
      label: 'Monsters',
      value: FILTER_FIELD.Monsters,
    },
    {
      label: 'Northern Realms',
      value: FILTER_FIELD.NorthernRealms,
    },
    {
      label: 'Nilfgaardian Empire',
      value: FILTER_FIELD.NilfgaardianEmpire,
    },
    {
      label: "Scoia'Tael",
      value: FILTER_FIELD.ScoiaTael,
    },
    {
      label: 'Skellige',
      value: FILTER_FIELD.Skellige,
    },
  ]

  return (
    <div id="deckListHeader">
      <div id="deckListHeaderUpper">
        <div id="deckListFilterSort">
          <input
            id={HTML_IDS.DeckListFilterName}
            type="search"
            placeholder="Search by name"
            value={nameFilter}
            onChange={(event) => setNameFilter(event.target.value)}
          />
          <div className="deck-list-filter-sort-group">
            <select
              id={HTML_IDS.DeckListSortField}
              title="Sort Field"
              value={sortField}
              className="pointable"
              onChange={(event) => setSortField(event.target.value as SORT_FIELD)}
            >
              <option value={SORT_FIELD.Agile}>Agile</option>
              <option value={SORT_FIELD.Close}>Close</option>
              <option value={SORT_FIELD.Created}>Created</option>
              <option value={SORT_FIELD.Heroes}>Heroes</option>
              <option value={SORT_FIELD.Name}>Name</option>
              <option value={SORT_FIELD.Ranged}>Ranged</option>
              <option value={SORT_FIELD.Siege}>Siege</option>
              <option value={SORT_FIELD.Specials}>Specials</option>
              <option value={SORT_FIELD.StrengthAverage}>Strength Average</option>
              <option value={SORT_FIELD.StrengthTotal}>Strength Total</option>
              <option value={SORT_FIELD.Units}>Units</option>
            </select>
            <div
              id={HTML_IDS.DeckListSortOrder}
              className="deck-list-header-button pointable"
              title={sortOrder === SORT_ORDER.Asc ? 'Descending' : 'Ascending'}
              onClick={() =>
                setSortOrder((previous) => (previous === SORT_ORDER.Asc ? SORT_ORDER.Desc : SORT_ORDER.Asc))
              }
            >
              {sortOrder === SORT_ORDER.Asc ? <CgArrowDown color={buttonColor} /> : <CgArrowUp color={buttonColor} />}
            </div>
          </div>
          <div className="deck-list-filter-sort-group">
            <div
              id={HTML_IDS.DeckListFilterAdvanced}
              className="deck-list-header-button pointable"
              title={filtersExpanded ? 'Hide Filters' : 'Show Filters'}
              onClick={() => setFiltersExpanded((previous) => !previous)}
            >
              {filtersExpanded ? <CgEyeAlt color={buttonColor} /> : <CgEye color={buttonColor} />}
            </div>
            <span id="deckListFilterCount">
              {filterFields.length}/{filters.length}
            </span>
            {filterFields.length > 0 && (
              <div
                className="deck-list-header-button pointable"
                title="Clear Filters"
                onClick={() => {
                  setFilterFields([])
                }}
              >
                <CgClose color={buttonColor} />
              </div>
            )}
          </div>
        </div>
        <div className="deck-list-header-actions">
          <div
            id={HTML_IDS.DeckListRefresh}
            style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
            title="Refresh"
            onClick={async () => !loading && (await Promise.all([refetchDecks(), refetchNeutralStats()]))}
          >
            <CgSync color={loading ? 'gray' : 'black'} />
          </div>
          <div id="deckListHeaderRight">
            {renderCreateDeckButton({
              id: HTML_IDS.DeckListCreate,
              navigate,
              onCreate,
            })}
            {onClose && <CloseButton id={HTML_IDS.DeckListClose} onClose={() => onClose()} />}
          </div>
        </div>
      </div>
      {filtersExpanded &&
        renderFilterCheckboxes({
          fields: filters,
          filterFields,
          setFilterFields,
        })}
    </div>
  )
}

/**
 * A button used to create a new Deck.
 */
function renderCreateDeckButton({
  id,
  navigate,
  onCreate,
}: {
  id: string
  navigate: NavigateFunction
  onCreate?: () => any // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
  const newDeckPath = ROUTES.Deck.path.replace(':deckId', 'new')

  return (
    <button
      id={id}
      type="button"
      className="pointable"
      autoFocus
      onClick={() => (onCreate !== undefined ? onCreate() : navigate(newDeckPath))}
      onMouseDown={(event) => {
        if (event.button === Button.Wheel) {
          window.open(newDeckPath, '_blank')
        }
      }}
    >
      Create Deck
    </button>
  )
}

/**
 * Whether or not a specific Deck should be displayed based on the selected filters.
 *
 * @param config The configuration used to determine if the Deck should be shown or not.
 * @param config.deck The Deck under consideration of whether or not to show.
 * @param config.fields The fields the user is currently filtering on.
 * @param config.name The name that Decks should be filtered on, and substring matches.
 * @returns True if the Deck should be shown, false otherwise.
 */
function isFilteredIn({ deck, fields, name }: { deck: Deck; fields: FILTER_FIELD[]; name: string }): boolean {
  const filteredByFaction =
    fields.length === 0 ||
    (fields.includes(FILTER_FIELD.Monsters) && deck.faction.key === FactionKey.Monsters) ||
    (fields.includes(FILTER_FIELD.NilfgaardianEmpire) && deck.faction.key === FactionKey.NilfgaardianEmpire) ||
    (fields.includes(FILTER_FIELD.NorthernRealms) && deck.faction.key === FactionKey.NorthernRealms) ||
    (fields.includes(FILTER_FIELD.ScoiaTael) && deck.faction.key === FactionKey.ScoiaTael) ||
    (fields.includes(FILTER_FIELD.Skellige) && deck.faction.key === FactionKey.Skellige)
  const filteredByName = !name || deck.name.toLowerCase().includes(name.toLowerCase())
  return filteredByFaction && filteredByName
}

/**
 * Checkboxes that a user can toggle to filter the list of Decks.
 */
function renderFilterCheckboxes({
  fields,
  filterFields,
  setFilterFields,
}: {
  fields: {
    label: string
    value: FILTER_FIELD
  }[]
  filterFields: FILTER_FIELD[]
  setFilterFields: Dispatch<SetStateAction<FILTER_FIELD[]>>
}) {
  return (
    <div className="deck-list-header-filter-values">
      {fields.map((field) => {
        const id = `filter${field.value}`
        return (
          <div key={id}>
            <input
              type="checkbox"
              id={id}
              name={id}
              checked={filterFields.includes(field.value)}
              className="pointable"
              onChange={() => {
                setFilterFields((previous) =>
                  previous.includes(field.value)
                    ? previous.filter((prevoiusField) => prevoiusField !== field.value)
                    : [...previous, field.value]
                )
              }}
            />
            <label htmlFor={id} className="pointable">
              {field.label}
            </label>
          </div>
        )
      })}
    </div>
  )
}

/**
 * A group of all statistics for the Deck.
 */
function renderDeckStats({
  deck,
  neutralLoading,
  neutralStats,
  neutralError,
}: {
  deck: Deck
  neutralStats: UnitStats | undefined
  neutralLoading: boolean
  neutralError: string
}) {
  return (
    <div className="deck-list-deck-section deck-list-deck-stats">
      {neutralLoading ? (
        <Centered>
          <LoadingSpinner size="100px" />
        </Centered>
      ) : neutralError || !neutralStats ? (
        <Centered>
          <div className="error-text">{`Error getting Neutral faction stats: ${neutralError}`}</div>
        </Centered>
      ) : (
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
                {deck.stats.strengthAverage.toFixed(1)}
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
      )}
    </div>
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
  deck: Deck
  label: string
  stat: keyof UnitStats
  neutralStats: UnitStats
}) {
  const available = (deck.faction.stats[stat] as number) + (neutralStats[stat] as number)
  const chosen = deck.stats[stat]

  return (
    <div>
      <div>
        <span>{`${label}:`}</span>
        <span className={`deck-stat-${stat}-value deck-stat-value`}>
          {chosen}/{available}
        </span>
      </div>
      <ProgressBar
        completeColor="gray"
        remainingColor="lightgray"
        height="10px"
        percent={((chosen as number) / (available as number)) * 100}
      />
    </div>
  )
}

interface DeckListProps {
  actions?: Action[]
  actionsDisabled?: boolean
  onClose?: () => any // eslint-disable-line @typescript-eslint/no-explicit-any
  onCreate?: () => any // eslint-disable-line @typescript-eslint/no-explicit-any
  paddingBottom?: string
}

interface Action {
  title: string
  className: string
  icon: IconType
  onClick: (deck: Deck) => any // eslint-disable-line @typescript-eslint/no-explicit-any
}
