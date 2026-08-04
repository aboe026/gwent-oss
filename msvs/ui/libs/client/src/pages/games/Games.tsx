import { ApolloClient } from '@apollo/client'
import { CgArrowDown, CgArrowUp, CgClose, CgEyeAlt, CgEye, CgSync } from 'react-icons/cg'
import { Dispatch, SetStateAction, useState } from 'react'
import { NavigateFunction, useNavigate } from 'react-router'
import { useQuery } from '@apollo/client/react'

import { Button } from '../../util/keyboard-listener'
import Centered from '../../components/Centered'
import {
  Exact,
  FactionKey,
  GameFactionFragmentDoc,
  GameFragment,
  GameFragmentDoc,
  GamePlayerFragmentDoc,
  GamesDocument,
  GamesQuery,
  GameStatus,
  useFragment,
} from '@gwent-oss/graphql-schema/apollo-typings'
import {
  FILTERS,
  FILTER_FIELD,
  FILTER_GROUP,
  FilterField,
  SORT_FIELD,
  SORT_ORDER,
} from '@gwent-oss/graphql-schema/games-filter'
import GameRow from './GameRow'
import getEnumFromString from '../../util/get-faction-key-from-string'
import { getErrorMessages } from '../../util/error-util'
import { HTML_CLASSES, HTML_IDS, ROUTES } from '@gwent-oss/constants'
import LoadingSpinner from '../../components/LoadingSpinner'
import { sortObjectArray } from '@gwent-oss/utils'
import { useAuthRetry } from '../../AuthRetry'
import { useTitle } from '../../components/TabTitle'
import './Games.css'

/**
 * The page listing a users Games.
 *
 * @returns The users games page.
 */
export default function GamesPage() {
  useTitle('Games | gwent-oss')
  const [userFilter, setUserFilter] = useState('')
  const [sortField, setSortField] = useState<SORT_FIELD>(SORT_FIELD.Updated)
  const [sortOrder, setSortOrder] = useState<SORT_ORDER>(SORT_ORDER.Desc)
  const [filterFields, setFilterFields] = useState<FILTER_FIELD[]>([])
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const { loading, error, data, refetch } = useQuery(GamesDocument)
  useAuthRetry(error, refetch)
  const navigate = useNavigate()
  const errorMessages = getErrorMessages(error)

  const sortedGames = sortObjectArray({
    array: data?.games,
    sortProperties: [sortField, 'id'],
    reverse: sortOrder === SORT_ORDER.Asc ? false : true,
  })

  const filteredGames = sortedGames.filter((game) =>
    isFilteredIn({
      game: useFragment(GameFragmentDoc, game),
      fields: filterFields,
      user: userFilter,
    })
  )

  return (
    <div id={HTML_IDS.GamesContainer}>
      {renderHeader({
        filterFields,
        filtersExpanded,
        loading,
        navigate,
        refetch,
        setFilterFields,
        setFiltersExpanded,
        setSortField,
        setSortOrder,
        setUserFilter,
        sortField,
        sortOrder,
        userFilter,
      })}
      {loading ? (
        <Centered>
          <LoadingSpinner size="50px" />
        </Centered>
      ) : errorMessages ? (
        <div className={HTML_CLASSES.ErrorText}>{`Error getting games: ${errorMessages}`}</div>
      ) : data?.games.length === 0 ? (
        <Centered>
          <div className="games-message">
            <span id={HTML_IDS.GamesNoneCreated}>No games created yet</span>
            {renderCreateGameButton({
              id: HTML_IDS.GamesNoneCreate,
              navigate,
            })}
          </div>
        </Centered>
      ) : filteredGames.length === 0 ? (
        <Centered>
          <div className="games-message">
            <span id={HTML_IDS.GamesNoneInFilter}>No games match filter(s)</span>
            <button
              id={HTML_IDS.GamesNoneClearFilter}
              type="button"
              className="pointable"
              autoFocus
              onClick={() => {
                setFilterFields([])
                setUserFilter('')
              }}
            >
              Clear Filters
            </button>
          </div>
        </Centered>
      ) : (
        <div id="gamesList">
          {filteredGames.map((game, index) => (
            <GameRow gameFragment={game} key={index} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * The Header of the Games table.
 */
function renderHeader({
  filterFields,
  filtersExpanded,
  loading,
  navigate,
  refetch,
  setFilterFields,
  setFiltersExpanded,
  setSortField,
  setSortOrder,
  setUserFilter,
  sortField,
  sortOrder,
  userFilter,
}: {
  filterFields: FILTER_FIELD[]
  filtersExpanded: boolean
  loading: boolean
  navigate: NavigateFunction
  refetch: (
    variables?:
      | Partial<
          Exact<{
            [key: string]: never
          }>
        >
      | undefined
  ) => Promise<ApolloClient.QueryResult<GamesQuery>>
  setFilterFields: Dispatch<SetStateAction<FILTER_FIELD[]>>
  setFiltersExpanded: Dispatch<SetStateAction<boolean>>
  setSortField: Dispatch<SetStateAction<SORT_FIELD>>
  setSortOrder: Dispatch<SetStateAction<SORT_ORDER>>
  setUserFilter: Dispatch<SetStateAction<string>>
  sortField: SORT_FIELD
  sortOrder: SORT_ORDER
  userFilter: string
}) {
  const filters: {
    label: string
    value: string
  }[] = [
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
    {
      label: 'Decking',
      value: FILTER_FIELD.Decking,
    },
    {
      label: 'Ordering',
      value: FILTER_FIELD.Ordering,
    },
    {
      label: 'Redrawing',
      value: FILTER_FIELD.Redrawing,
    },
    {
      label: 'Playing',
      value: FILTER_FIELD.Playing,
    },
    {
      label: 'Done',
      value: FILTER_FIELD.Done,
    },
  ]
  const buttonColor = 'black'

  return (
    <div id="gamesHeader">
      <div id="gamesHeaderUpper">
        <div id="gamesFilterSort">
          <input
            id={HTML_IDS.GamesFilterName}
            type="search"
            placeholder="Search by user"
            value={userFilter}
            onChange={(event) => setUserFilter(event.target.value)}
          />
          <div className="game-filter-sort-group">
            <select
              id={HTML_IDS.GamesSortField}
              title="Sort Field"
              value={sortField}
              className="pointable"
              onChange={(event) => {
                const newSortField = getEnumFromString({
                  enumerative: SORT_FIELD,
                  value: event.target.value,
                })
                if (newSortField) {
                  setSortField(newSortField)
                }
              }}
            >
              <option value={SORT_FIELD.Created}>Created</option>
              <option value={SORT_FIELD.Creator}>Owner</option>
              <option value={SORT_FIELD.Status}>Status</option>
              <option value={SORT_FIELD.Updated}>Updated</option>
            </select>
            <div
              id={HTML_IDS.GamesSortOrder}
              className="games-header-button pointable"
              title={sortOrder === SORT_ORDER.Asc ? 'Descending' : 'Ascending'}
              onClick={() =>
                setSortOrder((previous) => (previous === SORT_ORDER.Asc ? SORT_ORDER.Desc : SORT_ORDER.Asc))
              }
            >
              {sortOrder === SORT_ORDER.Asc ? <CgArrowDown color={buttonColor} /> : <CgArrowUp color={buttonColor} />}
            </div>
          </div>
          <div className="game-filter-sort-group">
            <div
              id={HTML_IDS.GamesFilterAdvanced}
              className="games-header-button pointable"
              title={filtersExpanded ? 'Hide Filters' : 'Show Filters'}
              onClick={() => setFiltersExpanded((previous) => !previous)}
            >
              {filtersExpanded ? <CgEyeAlt color={buttonColor} /> : <CgEye color={buttonColor} />}
            </div>
            <span id="gameFilterCount">
              {filterFields.length}/{filters.length}
            </span>
            {filterFields.length > 0 && (
              <div
                className="games-header-button pointable"
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
        <div id="gamesHeaderActions">
          <div
            id={HTML_IDS.GamesRefresh}
            style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
            title="Refresh"
            onClick={() => !loading && refetch()}
          >
            <CgSync color={loading ? 'gray' : 'black'} />
          </div>
          {renderCreateGameButton({
            id: HTML_IDS.GamesCreate,
            navigate,
          })}
        </div>
      </div>
      {filtersExpanded &&
        renderFilterCheckboxes({
          fields: Object.values(FILTERS),
          filterFields,
          setFilterFields,
        })}
      <div className="game-list-headers">
        <div>Created</div>
        <div>Updated</div>
        <div>Owner</div>
        <div>Players</div>
        <div>Factions</div>
        <div>Status</div>
        <div>Victor(s)</div>
      </div>
    </div>
  )
}

/**
 * Whether or not a Game is apart of the current filters applied.
 *
 * @param config The configuration used to determine if a Game should be filtered or not.
 * @param config.fields The fields the user is currently filtering on.
 * @param config.game The Game in question of whether it should be filtered or not.
 * @param config.user The Username that games should be filtered to, only matching if a game includes a player whose name is a substring.
 * @returns True if the game passes the current filters and should be visible, false otherwise.
 */
function isFilteredIn({ fields, game, user }: { fields: FILTER_FIELD[]; game: GameFragment; user: string }): boolean {
  const filteringAnyFaction =
    fields.includes(FILTER_FIELD.Monsters) ||
    fields.includes(FILTER_FIELD.NilfgaardianEmpire) ||
    fields.includes(FILTER_FIELD.NorthernRealms) ||
    fields.includes(FILTER_FIELD.ScoiaTael) ||
    fields.includes(FILTER_FIELD.Skellige)
  const filteringAnyStatus =
    fields.includes(FILTER_FIELD.Decking) ||
    fields.includes(FILTER_FIELD.Ordering) ||
    fields.includes(FILTER_FIELD.Redrawing) ||
    fields.includes(FILTER_FIELD.Playing) ||
    fields.includes(FILTER_FIELD.Done)
  const players = useFragment(GamePlayerFragmentDoc, game.players)
  const filteredByFaction =
    fields.length === 0 ||
    !filteringAnyFaction ||
    (fields.includes(FILTER_FIELD.Monsters) &&
      players.find((player) => useFragment(GameFactionFragmentDoc, player.faction)?.key === FactionKey.Monsters)) ||
    (fields.includes(FILTER_FIELD.NilfgaardianEmpire) &&
      players.find(
        (player) => useFragment(GameFactionFragmentDoc, player.faction)?.key === FactionKey.NilfgaardianEmpire
      )) ||
    (fields.includes(FILTER_FIELD.NorthernRealms) &&
      players.find(
        (player) => useFragment(GameFactionFragmentDoc, player.faction)?.key === FactionKey.NorthernRealms
      )) ||
    (fields.includes(FILTER_FIELD.ScoiaTael) &&
      players.find((player) => useFragment(GameFactionFragmentDoc, player.faction)?.key === FactionKey.ScoiaTael)) ||
    (fields.includes(FILTER_FIELD.Skellige) &&
      players.find((player) => useFragment(GameFactionFragmentDoc, player.faction)?.key === FactionKey.Skellige))
  const filteredByStatus =
    fields.length === 0 ||
    !filteringAnyStatus ||
    (fields.includes(FILTER_FIELD.Decking) && game.status === GameStatus.Decking) ||
    (fields.includes(FILTER_FIELD.Ordering) && game.status === GameStatus.Ordering) ||
    (fields.includes(FILTER_FIELD.Redrawing) && game.status === GameStatus.Redrawing) ||
    (fields.includes(FILTER_FIELD.Playing) && game.status === GameStatus.Playing) ||
    (fields.includes(FILTER_FIELD.Done) && game.status === GameStatus.Done)
  const filteredByUser =
    !user ||
    game.creator.name.toLowerCase().includes(user.toLowerCase()) ||
    players.find((player) => player.user.name.toLowerCase().includes(user.toLowerCase())) ||
    game.victors.find((victor) => victor.name.toLowerCase().includes(user.toLowerCase()))
  return !!filteredByFaction && !!filteredByStatus && !!filteredByUser
}

/**
 * Button to create a new Game.
 */
function renderCreateGameButton({ id, navigate }: { id: string; navigate: NavigateFunction }) {
  const newDeckPath = ROUTES.Game.path.replace(':gameId', 'new')

  return (
    <button
      id={id}
      type="button"
      className="pointable"
      autoFocus
      onClick={() => navigate(newDeckPath)}
      onMouseDown={(event) => {
        if (event.button === Button.Wheel) {
          window.open(newDeckPath, '_blank')
        }
      }}
    >
      Create Game
    </button>
  )
}

/**
 * The checkboxes to filter games by criteria.
 */
function renderFilterCheckboxes({
  fields,
  filterFields,
  setFilterFields,
}: {
  fields: FilterField[]
  filterFields: FILTER_FIELD[]
  setFilterFields: Dispatch<SetStateAction<FILTER_FIELD[]>>
}) {
  return (
    <div className="games-header-filter-values">
      {Object.values(FILTER_GROUP).map((group) => (
        <div key={group} className="games-header-filter-group-container">
          <span className="games-header-filter-group-name">{group}</span>
          <div className="games-header-filter-group">
            {fields
              .filter((field) => field.group === group)
              .map((field) => {
                const id = `filter${field.value}`
                return (
                  <div key={id} className="games-header-filter-group-small" title={field.title || field.label}>
                    <input
                      type="checkbox"
                      id={id}
                      name={id}
                      checked={filterFields.includes(field.value)}
                      style={{ cursor: 'pointer' }}
                      className="games-header-filter-checkbox"
                      onChange={() => {
                        setFilterFields((previous: FILTER_FIELD[]) => {
                          if (previous.includes(field.value)) {
                            return previous.filter((previousField) => previousField !== field.value)
                          }
                          return [...previous, field.value]
                        })
                      }}
                    />
                    <label htmlFor={id} style={{ cursor: 'pointer' }}>
                      {field.label}
                    </label>
                  </div>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
