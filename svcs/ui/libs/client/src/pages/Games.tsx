import { CgArrowDown, CgArrowUp, CgClose, CgEyeAlt, CgEye } from 'react-icons/cg'
import { Dispatch, SetStateAction, useState } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import { Button } from '../util/keyboard-listener'
import Centered from '../components/Centered'
import { FactionKey, Game, GameStatus, useGamesQuery } from '@gwent/graphql-schema/apollo-typings'
import {
  FILTERS,
  FILTER_FIELD,
  FILTER_GROUP,
  FilterField,
  SORT_FIELD,
  SORT_ORDER,
} from '@gwent/graphql-schema/games-filter'
import { formatDay, formatTime, sortObjectArray } from '@gwent/utils'
import { getApolloError } from '../util/error-util'
import { HTML_CLASSES, HTML_IDS, ROUTES } from '@gwent/constants'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTitle } from '../components/TabTitle'
import { useUserContext } from '../App'
import './Games.css'

/**
 * The page listing a users Games.
 *
 * @returns The users games page.
 */
export default function GamesPage() {
  useTitle('Games | Gwent')
  const [userFilter, setUserFilter] = useState('')
  const [sortField, setSortField] = useState<SORT_FIELD>(SORT_FIELD.Updated)
  const [sortOrder, setSortOrder] = useState<SORT_ORDER>(SORT_ORDER.Desc)
  const [filterFields, setFilterFields] = useState<FILTER_FIELD[]>([])
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const { checkAuth } = useUserContext()
  const { loading, error, data, refetch } = useGamesQuery({
    onError: (error) => {
      checkAuth(error, refetch)
    },
  })
  const navigate = useNavigate()
  const resolvedError = getApolloError(error)

  const sortedGames = sortObjectArray({
    array: data?.games,
    sortProperties: [sortField, 'id'],
    reverse: sortOrder === SORT_ORDER.Asc ? false : true,
  })
  const filteredGames = sortedGames.filter((game) =>
    isFilteredIn({
      game: game as Game,
      fields: filterFields,
      user: userFilter,
    })
  )

  return (
    <div id={HTML_IDS.GamesContainer}>
      {renderHeader({
        filterFields,
        filtersExpanded,
        navigate,
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
      ) : resolvedError ? (
        <div className={HTML_CLASSES.ErrorText}>{`Error getting games: ${resolvedError}`}</div>
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
          {filteredGames.map((game) => {
            let status = ''
            if (game.status === GameStatus.Decking) {
              status = 'Choosing Decks'
            } else if (game.status === GameStatus.Playing) {
              status = 'Playing'
            } else if (game.status === GameStatus.Done) {
              status = 'Finished'
            }
            const rowUrl = ROUTES.Game.path.replace(':gameId', game.id)

            return (
              <div key={game.id} className="game-list-row" onClick={() => navigate(rowUrl)}>
                <div title={game.created} className="multi-row-cell">
                  <span className={HTML_CLASSES.GameRowCreatedDay}>{formatDay(game.created)}</span>
                  <span className={HTML_CLASSES.GameRowCreatedTime}>{formatTime(game.created)}</span>
                </div>
                <div title={game.updated} className="multi-row-cell">
                  <span className={HTML_CLASSES.GameRowUpdatedDay}>{formatDay(game.updated)}</span>
                  <span className={HTML_CLASSES.GameRowUpdatedTime}>{formatTime(game.updated)}</span>
                </div>
                <div className={HTML_CLASSES.GameRowCreator}>{game.creator.name}</div>
                <div className="multi-row-cell">
                  {game.players.map((player, index) => {
                    return (
                      <span className={HTML_CLASSES.GameRowPlayer} key={index}>
                        {player.user.name}
                      </span>
                    )
                  })}
                </div>
                <div className="multi-row-cell">
                  {game.players.map((player, index) => {
                    return (
                      <span className={HTML_CLASSES.GameRowFaction} key={index}>
                        {player.faction?.name}
                      </span>
                    )
                  })}
                </div>
                <div className={HTML_CLASSES.GameRowStatus}>{status}</div>
                <div className="multi-row-cell">
                  {game.victors.map((victor, index) => {
                    return (
                      <span className={HTML_CLASSES.GameRowVictor} key={index}>
                        {victor.name}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function renderHeader({
  filterFields,
  filtersExpanded,
  navigate,
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
  navigate: NavigateFunction
  setFilterFields: Dispatch<SetStateAction<FILTER_FIELD[]>>
  setFiltersExpanded: Dispatch<SetStateAction<boolean>>
  setSortField: Dispatch<SetStateAction<SORT_FIELD>>
  setSortOrder: Dispatch<SetStateAction<SORT_ORDER>>
  setUserFilter: Dispatch<SetStateAction<string>>
  sortField: SORT_FIELD
  sortOrder: SORT_ORDER
  userFilter: string
}) {
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
    {
      label: 'Decking',
      value: FILTER_FIELD.Decking,
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
              onChange={(event) => setSortField(event.target.value as SORT_FIELD)}
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
        {renderCreateGameButton({
          id: HTML_IDS.GamesCreate,
          navigate,
        })}
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
        <div>Victor</div>
      </div>
    </div>
  )
}

function isFilteredIn({ fields, game, user }: { fields: FILTER_FIELD[]; game: Game; user: string }): boolean {
  const filteredByFaction =
    fields.length === 0 ||
    (fields.includes(FILTER_FIELD.Monsters) &&
      game.players.find((player) => player.faction?.key === FactionKey.Monsters)) ||
    (fields.includes(FILTER_FIELD.NilfgaardianEmpire) &&
      game.players.find((player) => player.faction?.key === FactionKey.NilfgaardianEmpire)) ||
    (fields.includes(FILTER_FIELD.NorthernRealms) &&
      game.players.find((player) => player.faction?.key === FactionKey.NorthernRealms)) ||
    (fields.includes(FILTER_FIELD.ScoiaTael) &&
      game.players.find((player) => player.faction?.key === FactionKey.ScoiaTael)) ||
    (fields.includes(FILTER_FIELD.Skellige) &&
      game.players.find((player) => player.faction?.key === FactionKey.Skellige)) ||
    (fields.includes(FILTER_FIELD.Decking) && game.status === GameStatus.Decking) ||
    (fields.includes(FILTER_FIELD.Playing) && game.status === GameStatus.Playing) ||
    (fields.includes(FILTER_FIELD.Done) && game.status === GameStatus.Done)
  const filteredByUser =
    !user ||
    game.creator.name.toLowerCase().includes(user.toLowerCase()) ||
    game.players.find((player) => player.user.name.toLowerCase().includes(user.toLowerCase())) ||
    game.victors.find((victor) => victor.name.toLowerCase().includes(user.toLowerCase()))
  return !!filteredByFaction && !!filteredByUser
}

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
