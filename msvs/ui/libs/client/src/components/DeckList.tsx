import { ApolloClient } from '@apollo/client'
import { CgArrowDown, CgArrowUp, CgClose, CgEyeAlt, CgEye, CgSync } from 'react-icons/cg'
import { Dispatch, SetStateAction, useState } from 'react'
import { NavigateFunction, useNavigate } from 'react-router'
import { useQuery } from '@apollo/client/react'

import { Button } from '../util/keyboard-listener'
import Centered from '../components/Centered'
import CloseButton from './CloseButton'
import {
  DeckFragment,
  DeckFragmentDoc,
  DecksDocument,
  DecksQuery,
  Exact,
  FactionFragmentDoc,
  FactionKey,
  FactionStatsDocument,
  FactionStatsQuery,
  InputMaybe,
  useFragment,
} from '@gwent-oss/graphql-schema/apollo-typings'
import DeckRow, { Action } from './DeckRow'
import { FILTER_FIELD, SORT_FIELD, SORT_ORDER } from '@gwent-oss/graphql-schema/decks-filter'
import getEnumFromString from '../util/get-faction-key-from-string'
import { getErrorMessages } from '../util/error-util'
import { HTML_CLASSES, HTML_IDS, ROUTES } from '@gwent-oss/constants'
import LoadingSpinner from '../components/LoadingSpinner'
import { sortObjectArray } from '@gwent-oss/utils'
import { useAuthRetry } from '../AuthRetry'
import './DeckList.css'

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
  const { loading: decksLoading, error: decksError, data: decksData, refetch: decksRefetch } = useQuery(DecksDocument)
  useAuthRetry(decksError, decksRefetch)
  const {
    loading: neutralStatsLoading,
    error: neutralStatsError,
    data: neutralStatsData,
    refetch: neutralStatsRefetch,
  } = useQuery(FactionStatsDocument, {
    skip: !decksData?.decks || decksData.decks.length < 1,
    variables: {
      keys: [FactionKey.Neutral],
    },
  })
  useAuthRetry(neutralStatsError, neutralStatsRefetch)
  const navigate = useNavigate()
  const decksErrorMessages = getErrorMessages(decksError)

  const sortedDecks = sortObjectArray({
    array: decksData?.decks,
    sortProperties: [sortField, 'id'],
    reverse: sortOrder === SORT_ORDER.Asc ? false : true,
  })
  const filteredDecks = sortedDecks.filter((deck) =>
    isFilteredIn({
      deck: useFragment(DeckFragmentDoc, deck),
      fields: filterFields,
      name: nameFilter,
    })
  )

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
      ) : decksErrorMessages ? (
        <div
          id={HTML_IDS.DeckListError}
          className={HTML_CLASSES.ErrorText}
        >{`Error getting decks: ${decksErrorMessages}`}</div>
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
          {filteredDecks.map((deckFragment, index) => (
            <DeckRow
              actions={actions}
              actionsDisabled={actionsDisabled}
              deckFragment={deckFragment}
              key={index}
              neutralFactionStats={{
                data: neutralStatsData,
                error: neutralStatsError,
                loading: neutralStatsLoading,
              }}
            />
          ))}
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
  onClose?: () => void
  onCreate?: () => void
  refetchDecks: (
    variables?:
      | Partial<
          Exact<{
            [key: string]: never
          }>
        >
      | undefined
  ) => Promise<ApolloClient.QueryResult<DecksQuery>>
  refetchNeutralStats: (
    variables?:
      | Partial<
          Exact<{
            keys?: InputMaybe<Array<FactionKey> | FactionKey>
          }>
        >
      | undefined
  ) => Promise<ApolloClient.QueryResult<FactionStatsQuery>>
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
              onChange={(event) => {
                const sortField = getEnumFromString({
                  enumerative: SORT_FIELD,
                  value: event.target.value,
                })
                if (sortField) {
                  setSortField(sortField)
                }
              }}
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
  onCreate?: () => void
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
function isFilteredIn({ deck, fields, name }: { deck: DeckFragment; fields: FILTER_FIELD[]; name: string }): boolean {
  const faction = useFragment(FactionFragmentDoc, deck.faction)
  const filteredByFaction =
    fields.length === 0 ||
    (fields.includes(FILTER_FIELD.Monsters) && faction.key === FactionKey.Monsters) ||
    (fields.includes(FILTER_FIELD.NilfgaardianEmpire) && faction.key === FactionKey.NilfgaardianEmpire) ||
    (fields.includes(FILTER_FIELD.NorthernRealms) && faction.key === FactionKey.NorthernRealms) ||
    (fields.includes(FILTER_FIELD.ScoiaTael) && faction.key === FactionKey.ScoiaTael) ||
    (fields.includes(FILTER_FIELD.Skellige) && faction.key === FactionKey.Skellige)
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

interface DeckListProps {
  actions?: Action[]
  actionsDisabled?: boolean
  onClose?: () => void
  onCreate?: () => void
  paddingBottom?: string
}
