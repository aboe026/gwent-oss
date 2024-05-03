import { Dispatch, SetStateAction, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import Centered from '../components/Centered'
import { DeckUnit, EffectKey } from '@gwent/graphql-schema/resolver-typings'
import {
  DecksQuery,
  DecksDocument,
  FactionKey,
  useAddDeckMutation,
  useFactionsQuery,
  useLeadersQuery,
  useUnitsQuery,
  Unit,
  Combat,
  UnitStats,
  DlcKey,
  Faction,
} from '@gwent/graphql-schema/apollo-typings'
import DlcTag from '../components/DlcTag'
import {
  FILTERS,
  FILTER_FIELD,
  FILTER_GROUP,
  FilterField,
  SORT_FIELD,
  SORT_ORDER,
} from '@gwent/graphql-schema/deck-filter'
import { getApolloError } from '../util/error-util'
import { getRouteFromPath } from '../util/route-util'
import { HTML_CLASSES, HTML_IDS, ROUTES } from '@gwent/constants'
import LoadingBar from '../components/LoadingBar'
import LoadingSpinner from '../components/LoadingSpinner'
import ProgressBar from '../components/ProgressBar'
import { sortObjectArray } from '@gwent/utils'
import UnitCard from '../components/UnitCard'
import UnitFull from '../components/UnitFull'
import UnitsHeader from '../components/UnitsHeader'
import UnitsStats from '../components/UnitsStats'
import { useTitle } from '../components/TabTitle'
import { useUserContext } from '../App'
import { validateDeck } from '@gwent/validators'
import WholeScreenDialog from '../components/WholeScreenDialog'
import './Deck.css'

/**
 * The page to configure a user created Deck
 *
 * @returns The page to configure decks
 */
export default function DeckPage() {
  useTitle('Deck | Gwent')
  const [name, setName] = useState<string>('')
  const [faction, setFaction] = useState<Faction | undefined>()
  const [factionStats, setFactionStats] = useState<UnitStats | undefined>()
  const [leaderId, setLeaderId] = useState<string | undefined>()
  const [selectedUnits, setSelectedUnits] = useState<DeckUnit[]>([])
  const [deckUnits, setDeckUnits] = useState<DeckUnit[]>([])
  const { pathname } = useLocation()
  const { checkAuth } = useUserContext()
  const navigate = useNavigate()
  const [addDeck, { loading, error }] = useAddDeckMutation({
    variables: {
      faction: faction?.key as FactionKey,
      leader: leaderId as string,
      name,
      units: selectedUnits.map((deckUnit) => {
        return {
          id: deckUnit.unit.id,
          artStyle: deckUnit.artStyle,
        }
      }),
    },
    onError(error) {
      checkAuth(error, addDeck)
    },
    onCompleted() {
      navigate(ROUTES.Decks.path)
    },
    update(cache, { data }) {
      const previous = cache.readQuery<DecksQuery>({ query: DecksDocument })
      cache.writeQuery({
        query: DecksDocument,
        data: { decks: [...(previous?.decks || []), data?.addDeck] },
      })
    },
  })

  const isNew = getRouteFromPath(pathname) === ROUTES.Deck
  let percent = 0
  if (name) percent += 25
  if (faction) percent += 25
  if (leaderId) percent += 25
  if (
    faction &&
    validateDeck({
      deckUnits: selectedUnits,
      faction: faction.key,
    }).length === 0
  ) {
    percent += 25
  }
  const resolvedError = getApolloError(error)

  return (
    <form
      id={HTML_IDS.DeckContainer}
      onSubmit={async (event) => {
        event.preventDefault()
        addDeck()
      }}
    >
      <div id="deckUpper">
        <div id="deckNameAndFaction" className="deck-quarter content-block">
          {renderNameAndFaction({
            name,
            setName,
            faction,
            setFaction,
            setLeaderId,
            setDeckUnits,
            setSelectedUnits,
            factionStats,
            setFactionStats,
            disabledOverride: loading,
          })}
        </div>
        <div id="deckLeaderContainer" className="deck-quarter content-block">
          {renderLeader({
            faction,
            leaderId,
            setLeaderId,
            disabledOverride: loading,
          })}
        </div>
      </div>
      <div id="deckLower" className="content-block">
        {renderUnits({
          faction,
          deckUnits,
          setDeckUnits,
          selectedUnits,
          setSelectedUnits,
          factionStats,
          disabledOverride: loading,
        })}
      </div>
      {resolvedError && (
        <span id={HTML_IDS.DeckError} className="error-text">
          {`Error creating deck: ${resolvedError}`}
        </span>
      )}
      <div id="deckActions">
        {loading ? <LoadingBar height="20px" /> : <ProgressBar percent={percent} />}
        <button type="button" disabled={loading} onClick={() => navigate(ROUTES.Decks.path)}>
          Cancel
        </button>
        <button
          id={HTML_IDS.DeckSave}
          type="submit"
          disabled={percent !== 100 || loading}
          style={{ cursor: percent === 100 ? 'pointer' : 'not-allowed' }}
        >
          {isNew ? 'Create' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function renderNameAndFaction({
  name,
  setName,
  faction,
  setFaction,
  setLeaderId,
  setDeckUnits,
  setSelectedUnits,
  factionStats,
  setFactionStats,
  disabledOverride,
}: {
  name: string
  setName: Dispatch<SetStateAction<string>>
  faction: Faction | undefined
  setFaction: Dispatch<SetStateAction<Faction | undefined>>
  setLeaderId: Dispatch<SetStateAction<string | undefined>>
  setDeckUnits: Dispatch<SetStateAction<DeckUnit[]>>
  setSelectedUnits: Dispatch<SetStateAction<DeckUnit[]>>
  factionStats: UnitStats | undefined
  setFactionStats: Dispatch<SetStateAction<UnitStats | undefined>>
  disabledOverride: boolean
}) {
  const [factionPickerOpen, setFactionPickerOpen] = useState(false)
  const { checkAuth } = useUserContext()
  const {
    loading: factionsLoading,
    error: factionsError,
    data: factionsData,
    refetch: factionsRefetch,
  } = useFactionsQuery({
    onError: (error) => {
      checkAuth(error, factionsRefetch)
    },
  })

  const resolvedError = getApolloError(factionsError)
  if (resolvedError) {
    return (
      <span id={HTML_IDS.DeckFactionError} className="error-text">{`Error getting factions: ${resolvedError}`}</span>
    )
  }

  const selectedFaction = factionsData?.factions.find((availableFaction) => availableFaction.key === faction?.key)

  if (
    selectedFaction?.stats &&
    (!factionStats || selectedFaction?.stats.strengthAverage !== factionStats.strengthAverage)
  ) {
    setFactionStats(selectedFaction.stats)
  }

  return (
    <>
      <table>
        <tbody>
          <tr>
            <td>
              <label className="deck-table-label" htmlFor="deckName">
                Name
                <span className="required-field">*</span>
              </label>
            </td>
            <td className="deck-table-value">
              <input
                id="deckName"
                type="text"
                name="name"
                title="name"
                required
                value={name}
                disabled={disabledOverride}
                onChange={(event) => setName(event.target.value)}
              />
            </td>
          </tr>
          <tr>
            <td>
              <label className="deck-table-label" htmlFor="deckFaction">
                Faction
                <span className="required-field">*</span>
              </label>
            </td>
            <td className="deck-table-value deck-table-value-faction">
              <select
                id={HTML_IDS.DeckFaction}
                title="faction"
                name="faction"
                required
                disabled={factionsLoading || disabledOverride}
                value={faction === undefined ? '' : faction.key}
                onChange={(event) => {
                  const newFactionKey = event.target.value as FactionKey
                  setDeckUnits((previous: DeckUnit[]) =>
                    previous.filter((deckUnit) => deckUnit.unit.faction.key === FactionKey.Neutral)
                  )
                  setSelectedUnits((previous: DeckUnit[]) =>
                    previous.filter((deckUnit) => deckUnit.unit.faction.key === FactionKey.Neutral)
                  )
                  setFaction(
                    factionsData?.factions.find((availableFaction) => availableFaction.key === newFactionKey) as Faction
                  )
                  setLeaderId(undefined)
                }}
              >
                <option disabled value="">
                  -- select a faction --
                </option>
                {factionsData?.factions.map((faction) => {
                  if (faction.key !== FactionKey.Neutral) {
                    return (
                      <option key={faction.key} value={faction.key}>
                        {faction.name}
                      </option>
                    )
                  }
                })}
              </select>
              <button
                id={HTML_IDS.DeckFactionChange}
                className={!factionsLoading && !disabledOverride ? 'pointable' : ''}
                type="button"
                disabled={factionsLoading || disabledOverride}
                onClick={() => setFactionPickerOpen(true)}
              >
                Change
              </button>
              {factionPickerOpen && (
                <WholeScreenDialog onClose={() => setFactionPickerOpen(false)}>
                  <div id={HTML_IDS.DeckFactionPicker}>
                    <h2>Choose a Faction</h2>
                    <div id="factionPickerList">
                      {factionsData?.factions.map((faction) => {
                        if (faction.key !== FactionKey.Neutral) {
                          return (
                            <div
                              key={faction.id}
                              className="faction-picker-faction pointable"
                              onClick={() => {
                                setFaction(faction as Faction)
                                setFactionPickerOpen(false)
                              }}
                            >
                              <img src={faction.image} className="faction-picker-image" />
                              <div className="faction-picker-name-ability">
                                <span className={HTML_CLASSES.FactionPickerName}>{faction.name}</span>
                                <span>{faction.ability}</span>
                              </div>
                              {faction.dlc && <DlcTag dlc={faction.dlc} height="100px" width="25px" />}
                            </div>
                          )
                        }
                      })}
                    </div>
                  </div>
                </WholeScreenDialog>
              )}
            </td>
          </tr>
        </tbody>
      </table>
      {factionsLoading ? (
        <Centered>
          <LoadingSpinner size="50px" />
        </Centered>
      ) : (
        selectedFaction && (
          <div id="factionSelected">
            <div id="factionSelectedContainer">
              <img id={HTML_IDS.DeckFactionImage} src={selectedFaction.image}></img>
              <div id="factionSelectedDetails">
                <span id={HTML_IDS.DeckFactionName}>{selectedFaction.name}</span>
                <span id={HTML_IDS.DeckFactionAbility}>{selectedFaction.ability}</span>
              </div>
              {selectedFaction.dlc && <DlcTag dlc={selectedFaction.dlc} height="70px" width="20px" />}
            </div>
          </div>
        )
      )}
    </>
  )
}

function renderLeader({
  faction,
  leaderId,
  setLeaderId,
  disabledOverride,
}: {
  faction: Faction | undefined
  leaderId: string | undefined
  setLeaderId: Dispatch<SetStateAction<string | undefined>>
  disabledOverride: boolean
}) {
  const [leaderPickerOpen, setLeaderPickerOpen] = useState(false)
  const { checkAuth } = useUserContext()
  const {
    loading: leadersLoading,
    error: leadersError,
    data: leadersData,
    refetch: leadersRefetch,
  } = useLeadersQuery({
    variables: {
      factions: faction ? [faction.key] : [],
    },
    onError: (error) => {
      checkAuth(error, leadersRefetch)
    },
    skip: faction === undefined,
  })

  if (faction === undefined) {
    return (
      <Centered>
        <span className="deck-container-placeholder">Leader</span>
      </Centered>
    )
  }

  const resolvedError = getApolloError(leadersError)
  if (resolvedError) {
    return (
      <Centered>
        <span id={HTML_IDS.DeckLeaderError} className="error-text">{`Error getting leaders: ${resolvedError}`}</span>
      </Centered>
    )
  }

  const selectedLeader = leadersData?.leaders.find((leader) => leader.id === leaderId)

  return (
    <div id="leaderContainer" className="form-field">
      <div id="leaderDetails">
        <div id="leaderSelect">
          <label htmlFor={HTML_IDS.DeckLeader}>
            Leader
            <span className="required-field">*</span>
          </label>
          <select
            id={HTML_IDS.DeckLeader}
            title="leader"
            name="leader"
            required
            disabled={leadersLoading || disabledOverride}
            value={leaderId === undefined ? '' : leaderId}
            onChange={(event) => setLeaderId(event.target.value)}
          >
            <option disabled value="">
              -- select a leader --
            </option>
            {leadersData?.leaders.map((leader) => {
              return (
                <option key={leader.id} value={leader.id}>
                  {leader.name}
                </option>
              )
            })}
          </select>
          <button
            id={HTML_IDS.DeckLeaderChange}
            className={!leadersLoading && !disabledOverride ? 'pointable' : ''}
            type="button"
            disabled={leadersLoading || disabledOverride}
            onClick={() => setLeaderPickerOpen(true)}
          >
            Change
          </button>
          {leaderPickerOpen && (
            <WholeScreenDialog onClose={() => setLeaderPickerOpen(false)}>
              <div id={HTML_IDS.DeckLeaderPicker}>
                <h2 id="leaderPickerTitle">Choose a Leader</h2>
                <div id="leaderPickerList">
                  {leadersData?.leaders.map((leader) => {
                    return (
                      <div
                        key={leader.id}
                        className="leader-picker-leader pointable"
                        onClick={() => {
                          setLeaderId(leader.id)
                          setLeaderPickerOpen(false)
                        }}
                      >
                        <img src={leader.image} className="leader-picker-image" />
                        <div className="leader-picker-name-ability-quote">
                          <span className={HTML_CLASSES.LeaderPickerName}>{leader.name}</span>
                          <span>{leader.ability}</span>
                          <span className="leader-picker-quote">{leader.quote}</span>
                        </div>
                        {leader.dlc && <DlcTag dlc={leader.dlc} height="200px" width="40px" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </WholeScreenDialog>
          )}
        </div>
        {selectedLeader && (
          <div id="leaderNameAbilityQuoteDlc">
            <div id="leaderNameAbilityQuote">
              <div id="leaderNameAbility">
                <span id="leaderName">{selectedLeader.name}</span>
                <span id="leaderAbility">{selectedLeader.ability}</span>
              </div>
              <span id="leaderQuote">{selectedLeader.quote}</span>
            </div>
            {selectedLeader.dlc && <DlcTag dlc={selectedLeader.dlc} height="100px" width="25px" />}
          </div>
        )}
      </div>
      {leadersLoading ? (
        <Centered>
          <LoadingSpinner size="50px" />
        </Centered>
      ) : (
        selectedLeader && <img id="leaderImage" src={selectedLeader.image} title={selectedLeader.name}></img>
      )}
    </div>
  )
}

function renderUnits({
  faction,
  deckUnits,
  setDeckUnits,
  selectedUnits,
  setSelectedUnits,
  factionStats,
  disabledOverride,
}: {
  faction: Faction | undefined
  deckUnits: DeckUnit[]
  setDeckUnits: Dispatch<SetStateAction<DeckUnit[]>>
  selectedUnits: DeckUnit[]
  setSelectedUnits: Dispatch<SetStateAction<DeckUnit[]>>
  factionStats: UnitStats | undefined
  disabledOverride: boolean
}) {
  const [availableFiltersExpanded, setAvailableFiltersExpanded] = useState(false)
  const [selectedFiltersExpanded, setSelectedFiltersExpanded] = useState(false)
  const [availableSortField, setAvailableSortField] = useState<SORT_FIELD>(SORT_FIELD.Name)
  const [selectedSortField, setSelectedSortField] = useState<SORT_FIELD>(SORT_FIELD.Name)
  const [availableSortOrder, setAvailableSortOrder] = useState<SORT_ORDER>(SORT_ORDER.Asc)
  const [selectedSortOrder, setSelectedSortOrder] = useState<SORT_ORDER>(SORT_ORDER.Asc)
  const [availableNameFilter, setAvailableNameFilter] = useState('')
  const [selectedNameFilter, setSelectedNameFilter] = useState('')
  const [availableFilterFields, setAvailableFilterFields] = useState<FILTER_FIELD[]>([])
  const [selectedFilterFields, setSelectedFilterFields] = useState<FILTER_FIELD[]>([])
  const [sortFilterLocked, setSortFilterLocked] = useState(true)
  const [combatsExpanded, setCombatsExpanded] = useState(false)
  const [effectsExpanded, setEffectsExpanded] = useState(false)
  const [fullUnit, setFullUnit] = useState<DeckUnit | undefined>()
  const { checkAuth } = useUserContext()
  const {
    loading: factionUnitsLoading,
    error: factionUnitsError,
    refetch: factionUnitsRefetch,
  } = useUnitsQuery({
    variables: {
      deckable: true,
      factions: faction ? [faction.key] : [],
    },
    onError: (error) => {
      checkAuth(error, factionUnitsRefetch)
    },
    onCompleted: (data) => {
      setDeckUnits((previous: DeckUnit[]) => [
        ...previous.filter((deckUnit) => deckUnit.unit.faction.key === FactionKey.Neutral),
        ...data.units.map((unit) => {
          return {
            artStyle: 1,
            unit: unit as Unit,
          }
        }),
      ])
    },
    skip: faction === undefined,
  })
  const {
    loading: neutralUnitsLoading,
    error: neutralUnitsError,
    refetch: neutralUnitsRefetch,
  } = useUnitsQuery({
    variables: {
      deckable: true,
      factions: [FactionKey.Neutral],
    },
    onError: (error) => {
      checkAuth(error, neutralUnitsRefetch)
    },
    onCompleted: (data) => {
      setDeckUnits((previous: DeckUnit[]) => [
        ...previous,
        ...data.units.map((unit) => {
          return {
            artStyle: 1,
            unit: unit as Unit,
          }
        }),
      ])
    },
    skip: faction === undefined,
  })

  let availableSortFields = [`unit.${SORT_FIELD.Name}`, `unit.${SORT_FIELD.Id}`]
  if (availableSortField === SORT_FIELD.Strength) {
    availableSortFields = [`unit.${SORT_FIELD.Strength}`, ...availableSortFields]
  }
  const sortedUnits = sortObjectArray({
    array: deckUnits,
    sortProperties: availableSortFields,
    reverse: availableSortOrder === SORT_ORDER.Desc,
  })
  const filteredAvailableUnits: DeckUnit[] = []
  let filteredSelectedUnits: DeckUnit[] = []
  const selectedIds = selectedUnits.map((deckUnit) => deckUnit.unit.id)
  for (const deckUnit of sortedUnits) {
    if (selectedIds.includes(deckUnit.unit.id)) {
      if (isFilteredIn(deckUnit, selectedFilterFields, selectedNameFilter)) {
        filteredSelectedUnits.push(deckUnit)
      }
    } else if (isFilteredIn(deckUnit, availableFilterFields, availableNameFilter)) {
      filteredAvailableUnits.push(deckUnit)
    }
  }
  if (selectedSortField !== availableSortField || selectedSortOrder !== availableSortOrder) {
    let selectedSortFields = [`unit.${SORT_FIELD.Name}`, `unit.${SORT_FIELD.Id}`]
    if (selectedSortField === SORT_FIELD.Strength) {
      selectedSortFields = [`unit.${SORT_FIELD.Strength}`, ...selectedSortFields]
    }
    filteredSelectedUnits = sortObjectArray({
      array: filteredSelectedUnits,
      sortProperties: selectedSortFields,
      reverse: selectedSortOrder === SORT_ORDER.Desc,
    })
  }

  const resolvedFactionUnitsError = getApolloError(factionUnitsError)
  const resolvedNeutralUnitsError = getApolloError(neutralUnitsError)

  const disabled = neutralUnitsLoading || factionUnitsLoading || disabledOverride

  return (
    <>
      <UnitFull
        disabled={disabled}
        filteredAvailableUnits={filteredAvailableUnits}
        filteredSelectedUnits={filteredSelectedUnits}
        fullUnit={fullUnit}
        selectedIds={selectedIds}
        setUnits={setDeckUnits}
        setFullUnit={setFullUnit}
        setSelectedUnits={setSelectedUnits}
      />
      {faction === undefined ? (
        <span className="deck-container-placeholder">Units</span>
      ) : resolvedFactionUnitsError || resolvedNeutralUnitsError ? (
        <div id="unitsErrors">
          {resolvedFactionUnitsError && (
            <span
              id={HTML_IDS.DeckUnitsFactionError}
              className="error-text"
            >{`Error getting faction units: ${resolvedFactionUnitsError}`}</span>
          )}
          {resolvedNeutralUnitsError && (
            <span
              id={HTML_IDS.DeckUnitsNeutralError}
              className="error-text"
            >{`Error getting neutral units: ${resolvedNeutralUnitsError}`}</span>
          )}
        </div>
      ) : (
        <div id={HTML_IDS.DeckUnitsContainer}>
          <div id="unitsContainerLeft" className="unit-container">
            <UnitsHeader
              availableFilterFields={availableFilterFields}
              availableFiltersExpanded={availableFiltersExpanded}
              availableNameFilter={availableNameFilter}
              availableSortField={availableSortField}
              availableSortOrder={availableSortOrder}
              disabled={disabled}
              faction={faction}
              isAvailable={true}
              selectedFilterFields={selectedFilterFields}
              selectedFiltersExpanded={selectedFiltersExpanded}
              selectedNameFilter={selectedNameFilter}
              selectedSortField={selectedSortField}
              selectedSortOrder={selectedSortOrder}
              setAvailableFilterFields={setAvailableFilterFields}
              setAvailableFiltersExpanded={setAvailableFiltersExpanded}
              setAvailableNameFilter={setAvailableNameFilter}
              setAvailableSortField={setAvailableSortField}
              setAvailableSortOrder={setAvailableSortOrder}
              setSelectedFilterFields={setSelectedFilterFields}
              setSelectedFiltersExpanded={setSelectedFiltersExpanded}
              setSelectedNameFilter={setSelectedNameFilter}
              setSelectedSortField={setSelectedSortField}
              setSelectedSortOrder={setSelectedSortOrder}
              sortFilterLocked={sortFilterLocked}
            />
            {factionUnitsLoading || neutralUnitsLoading ? (
              renderUnitsLoading()
            ) : (
              <div id={HTML_IDS.DeckUnitsAvailableContainer} className="deck-unit-border">
                <div className="deck-unit-container">
                  {filteredAvailableUnits.map((deckUnit) => (
                    <UnitCard
                      key={deckUnit.unit.id}
                      deckUnit={deckUnit}
                      disabled={disabled}
                      setUnits={setDeckUnits}
                      setFullUnit={setFullUnit}
                      setSelectedUnits={setSelectedUnits}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div id="unitsContainerMiddle">
            <UnitsStats
              availableFilterFields={availableFilterFields}
              availableFiltersExpanded={availableFiltersExpanded}
              availableNameFilter={availableNameFilter}
              availableSortField={availableSortField}
              availableSortOrder={availableSortOrder}
              disabled={disabled}
              filteredAvailableUnits={filteredAvailableUnits}
              filteredSelectedUnits={filteredSelectedUnits}
              setSelectedUnits={setSelectedUnits}
              setSelectedFiltersExpanded={setSelectedFiltersExpanded}
              setSelectedNameFilter={setSelectedNameFilter}
              setSelectedSortField={setSelectedSortField}
              setSelectedSortOrder={setSelectedSortOrder}
              setSortFilterLocked={setSortFilterLocked}
              sortFilterLocked={sortFilterLocked}
              combatsExpanded={combatsExpanded}
              effectsExpanded={effectsExpanded}
              factionStats={factionStats}
              selectedUnits={selectedUnits}
              setAvailableFilterFields={setAvailableFilterFields}
              setCombatsExpanded={setCombatsExpanded}
              setEffectsExpanded={setEffectsExpanded}
              setSelectedFilterFields={setSelectedFilterFields}
            />
          </div>
          <div id="unitsContainerRight" className="unit-container">
            <UnitsHeader
              availableFilterFields={availableFilterFields}
              availableFiltersExpanded={availableFiltersExpanded}
              availableNameFilter={availableNameFilter}
              availableSortField={availableSortField}
              availableSortOrder={availableSortOrder}
              disabled={disabled}
              faction={faction}
              isAvailable={false}
              selectedFilterFields={selectedFilterFields}
              selectedFiltersExpanded={selectedFiltersExpanded}
              selectedNameFilter={selectedNameFilter}
              selectedSortField={selectedSortField}
              selectedSortOrder={selectedSortOrder}
              setAvailableFilterFields={setAvailableFilterFields}
              setAvailableFiltersExpanded={setAvailableFiltersExpanded}
              setAvailableNameFilter={setAvailableNameFilter}
              setAvailableSortField={setAvailableSortField}
              setAvailableSortOrder={setAvailableSortOrder}
              setSelectedFilterFields={setSelectedFilterFields}
              setSelectedFiltersExpanded={setSelectedFiltersExpanded}
              setSelectedNameFilter={setSelectedNameFilter}
              setSelectedSortField={setSelectedSortField}
              setSelectedSortOrder={setSelectedSortOrder}
              sortFilterLocked={sortFilterLocked}
            />
            {factionUnitsLoading || neutralUnitsLoading ? (
              renderUnitsLoading()
            ) : (
              <div id={HTML_IDS.DeckUnitsSelectedContainer} className="deck-unit-border">
                <div className="deck-unit-container">
                  {filteredSelectedUnits.map((deckUnit) => (
                    <UnitCard
                      key={deckUnit.unit.id}
                      deckUnit={deckUnit}
                      disabled={disabled}
                      setUnits={setDeckUnits}
                      setFullUnit={setFullUnit}
                      setSelectedUnits={setSelectedUnits}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function renderUnitsLoading() {
  return (
    <Centered>
      <LoadingSpinner size="50px" />
    </Centered>
  )
}

function isFilteredIn(deckUnit: DeckUnit, fields: FILTER_FIELD[], name: string): boolean {
  const selected: FilterField[] = []
  for (const field of fields) {
    if (FILTERS[field]) {
      selected.push(FILTERS[field])
    }
  }
  const combatFilters = selected.filter((field) => field.group === FILTER_GROUP.Combat)
  const dlcFilters = selected.filter((field) => field.group === FILTER_GROUP.Dlc)
  const effectFilters = selected.filter((field) => field.group === FILTER_GROUP.Effect)
  const factionFilters = selected.filter((field) => field.group === FILTER_GROUP.Faction)
  const otherFilters = selected.filter((field) => field.group === FILTER_GROUP.Other)

  const combatIncluded =
    combatFilters.length === 0 ||
    combatFilters.some((filter) => deckUnit.unit.combats?.includes(filter.value as any as Combat)) // eslint-disable-line @typescript-eslint/no-explicit-any
  const dlcIncluded =
    dlcFilters.length === 0 || dlcFilters.some((filter) => deckUnit.unit.dlc?.key === (filter.value as any as DlcKey)) // eslint-disable-line @typescript-eslint/no-explicit-any
  const effectIncluded =
    effectFilters.length === 0 ||
    effectFilters.some(
      (filter) => deckUnit.unit.effects?.map((effect) => effect.key).includes(filter.value as any as EffectKey) // eslint-disable-line @typescript-eslint/no-explicit-any
    )
  const factionIncluded =
    factionFilters.length === 0 ||
    factionFilters.some(
      (filter) =>
        (deckUnit.unit.faction.key === FactionKey.Neutral &&
          (filter.value as any as FactionKey) === FactionKey.Neutral) || // eslint-disable-line @typescript-eslint/no-explicit-any
        (deckUnit.unit.faction.key !== FactionKey.Neutral && (filter.value as any as FactionKey) !== FactionKey.Neutral) // eslint-disable-line @typescript-eslint/no-explicit-any
    )
  const otherIncluded =
    otherFilters.length === 0 ||
    otherFilters.some(
      (filter) =>
        (filter.value === FILTER_FIELD.Hero && deckUnit.unit.hero) ||
        (filter.value === FILTER_FIELD.Special && deckUnit.unit.special) ||
        (filter.value === FILTER_FIELD.Strength &&
          deckUnit.unit.strength !== undefined &&
          deckUnit.unit.strength !== null) ||
        (filter.value === FILTER_FIELD.Art && deckUnit.unit.images.length > 1)
    )
  const nameIncluded = !name || deckUnit.unit.name.toLowerCase().includes(name.toLowerCase())

  return combatIncluded && dlcIncluded && effectIncluded && factionIncluded && otherIncluded && nameIncluded
}
