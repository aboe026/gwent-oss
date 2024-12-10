import { Dispatch, PropsWithChildren, SetStateAction, useState } from 'react'

import Centered from '../components/Centered'
import CloseButton from './CloseButton'
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
  Deck,
  FactionsQuery,
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
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import LoadingBar from '../components/LoadingBar'
import LoadingSpinner from '../components/LoadingSpinner'
import ProgressBar from '../components/ProgressBar'
import { combineUnitStats, sortObjectArray } from '@gwent/utils'
import UnitDeckCard from './UnitDeckCard'
import UnitFullCard from './UnitFullCard'
import UnitsHeader from '../components/UnitsHeader'
import UnitsStats from '../components/UnitsStats'
import addToCacheList from '../util/add-to-cache-list'
import { useUserContext } from '../App'
import { validateDeck } from '@gwent/validators'
import WholeScreenDialog from '../components/WholeScreenDialog'
import './DeckEditor.css'

/**
 * The component to configure a user created Deck
 *
 * @returns The component to configure decks
 */
export default function DeckEditor({ deck, onCancel, onSave }: DeckEditorProps) {
  const [name, setName] = useState<string>('')
  const [faction, setFaction] = useState<Faction | undefined>()
  const [factionStats, setFactionStats] = useState<UnitStats | undefined>()
  const [leaderId, setLeaderId] = useState<string | undefined>()
  const [selectedUnits, setSelectedUnits] = useState<DeckUnit[]>([])
  const [deckUnits, setDeckUnits] = useState<DeckUnit[]>([])
  const { checkAuth } = useUserContext()
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
    onCompleted(result) {
      onSave(result.addDeck as Deck)
    },
    update(cache, { data }) {
      cache.updateQuery<DecksQuery>(
        {
          query: DecksDocument,
        },
        (previous) => {
          if (previous?.decks) {
            return {
              decks: addToCacheList({
                add: data?.addDeck,
                previous: previous?.decks,
              }),
            }
          }
        }
      )
    },
  })

  const isNew = deck !== undefined
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
      id={HTML_IDS.DeckEditorContainer}
      onSubmit={async (event) => {
        event.preventDefault()
        addDeck()
      }}
    >
      <div id="deckEditorUpper">
        <div id="deckEditorNameFaction" className="deck-editor-quarter content-block">
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
        <div id="deckEditorLeaderContainer" className="deck-editor-quarter content-block">
          {renderLeader({
            faction,
            leaderId,
            setLeaderId,
            disabledOverride: loading,
          })}
        </div>
      </div>
      <div id="deckEditorLower" className="content-block">
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
        <span id={HTML_IDS.DeckEditorError} className={HTML_CLASSES.ErrorText}>
          {`Error creating deck: ${resolvedError}`}
        </span>
      )}
      <div id="deckEditorActions">
        {loading ? <LoadingBar height="20px" /> : <ProgressBar percent={percent} />}
        <button id={HTML_IDS.DeckEditorCancel} type="button" disabled={loading} onClick={() => onCancel()}>
          Cancel
        </button>
        <button
          id={HTML_IDS.DeckEditorSave}
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
      <span
        id={HTML_IDS.DeckEditorFactionError}
        className={HTML_CLASSES.ErrorText}
      >{`Error getting factions: ${resolvedError}`}</span>
    )
  }

  const selectedFaction = factionsData?.factions.find((availableFaction) => availableFaction.key === faction?.key)
  const neutralFaction = factionsData?.factions.find((availableFaction) => availableFaction.key === FactionKey.Neutral)

  if (selectedFaction?.stats && neutralFaction?.stats) {
    const combinedStats = combineUnitStats(selectedFaction.stats, neutralFaction.stats)
    if (!factionStats || combinedStats.strengthAverage !== factionStats.strengthAverage) {
      setFactionStats(combinedStats)
    }
  }

  return (
    <>
      <table>
        <tbody>
          <tr>
            <td>
              <label className="deck-editor-table-label" htmlFor={HTML_IDS.DeckEditorName}>
                Name
                <span className="required-field">*</span>
              </label>
            </td>
            <td className="deck-editor-table-value">
              <input
                id={HTML_IDS.DeckEditorName}
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
              <label className="deck-editor-table-label" htmlFor={HTML_IDS.DeckEditorFaction}>
                Faction
                <span className="required-field">*</span>
              </label>
            </td>
            <td className="deck-editor-table-value deck-editor-table-value-faction">
              <select
                id={HTML_IDS.DeckEditorFaction}
                title="faction"
                name="faction"
                required
                disabled={factionsLoading || disabledOverride}
                value={faction === undefined ? '' : faction.key}
                onChange={(event) =>
                  changeFaction({
                    factionsData,
                    newFactionKey: event.target.value as FactionKey,
                    setDeckUnits,
                    setFaction,
                    setLeaderId,
                    setSelectedUnits,
                    setFactionPickerOpen,
                  })
                }
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
                id={HTML_IDS.DeckEditorFactionChange}
                className={!factionsLoading && !disabledOverride ? 'pointable' : ''}
                type="button"
                disabled={factionsLoading || disabledOverride}
                onClick={() => setFactionPickerOpen(true)}
              >
                Change
              </button>
              {factionPickerOpen && (
                <WholeScreenDialog onClose={() => setFactionPickerOpen(false)}>
                  <div id={HTML_IDS.DeckEditorFactionPicker}>
                    <div className="deck-editor-picker-header">
                      <h2 className="deck-editor-picker-title">Choose a Faction</h2>
                      <CloseButton onClose={() => setFactionPickerOpen(false)} />
                    </div>
                    <div id="deckEditorFactionPickerList">
                      {factionsData?.factions.map((faction) => {
                        if (faction.key !== FactionKey.Neutral) {
                          return (
                            <div
                              key={faction.id}
                              className="deck-editor-faction-picker-faction pointable"
                              onClick={() =>
                                changeFaction({
                                  factionsData,
                                  newFactionKey: faction.key,
                                  setDeckUnits,
                                  setFaction,
                                  setLeaderId,
                                  setSelectedUnits,
                                  setFactionPickerOpen,
                                })
                              }
                            >
                              <img src={faction.image} className="deck-editor-faction-picker-image" />
                              <div className="deck-editor-faction-picker-name-ability">
                                <span className={HTML_CLASSES.DeckEditorFactionPickerName}>{faction.name}</span>
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
          <div id="deckEditorFactionSelected">
            <div id="deckEditorFactionSelectedContainer">
              <img id={HTML_IDS.DeckEditorFactionImage} src={selectedFaction.image}></img>
              <div id="deckEditorFactionSelectedDetails">
                <span id={HTML_IDS.DeckEditorFactionName}>{selectedFaction.name}</span>
                <span id={HTML_IDS.DeckEditorFactionAbility}>{selectedFaction.ability}</span>
              </div>
              {selectedFaction.dlc && <DlcTag dlc={selectedFaction.dlc} height="70px" width="20px" />}
            </div>
          </div>
        )
      )}
    </>
  )
}

function changeFaction({
  newFactionKey,
  factionsData,
  setDeckUnits,
  setFaction,
  setLeaderId,
  setSelectedUnits,
  setFactionPickerOpen,
}: {
  newFactionKey: FactionKey
  setDeckUnits: Dispatch<SetStateAction<DeckUnit[]>>
  setSelectedUnits: Dispatch<SetStateAction<DeckUnit[]>>
  setFaction: Dispatch<SetStateAction<Faction | undefined>>
  setLeaderId: Dispatch<SetStateAction<string | undefined>>
  factionsData: FactionsQuery | undefined
  setFactionPickerOpen: Dispatch<SetStateAction<boolean>>
}) {
  setDeckUnits((previous: DeckUnit[]) =>
    previous.filter((deckUnit) => deckUnit.unit.faction.key === FactionKey.Neutral)
  )
  setSelectedUnits((previous: DeckUnit[]) =>
    previous.filter((deckUnit) => deckUnit.unit.faction.key === FactionKey.Neutral)
  )
  setFaction(factionsData?.factions.find((availableFaction) => availableFaction.key === newFactionKey) as Faction)
  setLeaderId(undefined)
  setFactionPickerOpen(false)
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
        <img id="deckEditorLeaderIcon" src="images/stats/leader.png" title="Leader" />
      </Centered>
    )
  }

  const resolvedError = getApolloError(leadersError)
  if (resolvedError) {
    return (
      <Centered>
        <span
          id={HTML_IDS.DeckEditorLeaderError}
          className={HTML_CLASSES.ErrorText}
        >{`Error getting leaders: ${resolvedError}`}</span>
      </Centered>
    )
  }

  const selectedLeader = leadersData?.leaders.find((leader) => leader.id === leaderId)

  return (
    <div id="deckEditorLeaderDetailsContainer" className="form-field">
      <div id="deckEditorLeaderDetails">
        <div id="deckEditorLeaderSelect">
          <label htmlFor={HTML_IDS.DeckEditorLeader}>
            Leader
            <span className="required-field">*</span>
          </label>
          <select
            id={HTML_IDS.DeckEditorLeader}
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
            id={HTML_IDS.DeckEditorLeaderChange}
            className={!leadersLoading && !disabledOverride ? 'pointable' : ''}
            type="button"
            disabled={leadersLoading || disabledOverride}
            onClick={() => setLeaderPickerOpen(true)}
          >
            Change
          </button>
          {leaderPickerOpen && (
            <WholeScreenDialog onClose={() => setLeaderPickerOpen(false)}>
              <div id={HTML_IDS.DeckEditorLeaderPicker}>
                <div className="deck-editor-picker-header">
                  <h2 className="deck-editor-picker-title">Choose a Leader</h2>
                  <CloseButton onClose={() => setLeaderPickerOpen(false)} />
                </div>
                <div id="deckEditorLeaderPickerList">
                  {leadersData?.leaders.map((leader) => {
                    return (
                      <div
                        key={leader.id}
                        className="deck-editor-leader-picker-leader pointable"
                        onClick={() => {
                          setLeaderId(leader.id)
                          setLeaderPickerOpen(false)
                        }}
                      >
                        <img src={leader.image} className="deck-editor-leader-picker-image" />
                        <div className="deck-editor-leader-picker-name-ability-quote">
                          <span className={HTML_CLASSES.DeckEditorLeaderPickerName}>{leader.name}</span>
                          <span>{leader.ability}</span>
                          <span className="deck-editor-leader-picker-quote">{leader.quote}</span>
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
          <div id="deckEditorLeaderNameAbilityQuoteDlc">
            <div id="deckEditorLeaderNameAbilityQuote">
              <div id="deckEditorLeaderNameAbility">
                <span id="deckEditorLeaderName">{selectedLeader.name}</span>
                <span id="deckEditorLeaderAbility">{selectedLeader.ability}</span>
              </div>
              <span id="deckEditorLeaderQuote">{selectedLeader.quote}</span>
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
        selectedLeader && <img id="deckEditorLeaderImage" src={selectedLeader.image} title={selectedLeader.name}></img>
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

  let nextUnit: DeckUnit | undefined
  let previousUnit: DeckUnit | undefined
  if (fullUnit) {
    if (selectedIds.includes(fullUnit.unit.id)) {
      const fullUnitPosition = filteredSelectedUnits.findIndex((deckUnit) => deckUnit.unit.id === fullUnit.unit.id)
      nextUnit = filteredSelectedUnits[fullUnitPosition + 1]
      previousUnit = filteredSelectedUnits[fullUnitPosition - 1]
    } else {
      const fullUnitPosition = filteredAvailableUnits.findIndex((deckUnit) => deckUnit.unit.id === fullUnit.unit.id)
      nextUnit = filteredAvailableUnits[fullUnitPosition + 1]
      previousUnit = filteredAvailableUnits[fullUnitPosition - 1]
    }
  }
  function changeArtStyle(change: number) {
    setDeckUnits((previous: DeckUnit[]) =>
      previous.map((deckUnit) => {
        if (
          fullUnit &&
          deckUnit.unit.id === fullUnit.unit.id &&
          deckUnit.artStyle !== undefined &&
          deckUnit.artStyle !== null
        ) {
          deckUnit.artStyle = deckUnit.artStyle + change
        }
        return deckUnit
      })
    )
  }
  return (
    <>
      <UnitFullCard
        fullUnit={fullUnit}
        hasNext={nextUnit !== undefined}
        hasPrevious={previousUnit !== undefined}
        onSelect={(fullUnitSelected) => {
          if (fullUnitSelected) {
            setSelectedUnits((previous) =>
              previous.map((deckUnit) => deckUnit.unit.id).includes(fullUnitSelected.unit.id)
                ? previous.filter((deckUnit) => deckUnit.unit.id !== fullUnitSelected.unit.id)
                : [...previous, fullUnitSelected]
            )
          }
          if (nextUnit) {
            setFullUnit(nextUnit)
          } else if (previousUnit) {
            setFullUnit(previousUnit)
          } else {
            setFullUnit(undefined)
          }
        }}
        onPrevious={() => previousUnit && setFullUnit(previousUnit)}
        onNext={() => nextUnit && setFullUnit(nextUnit)}
        onClose={() => setFullUnit(undefined)}
        onArtDecrement={() => {
          if (!disabled && fullUnit && fullUnit.unit.images.length > 0 && fullUnit.artStyle && fullUnit.artStyle > 1) {
            changeArtStyle(-1)
          }
        }}
        onArtIncrement={() => {
          if (
            !disabled &&
            fullUnit &&
            fullUnit.unit.images.length > 0 &&
            fullUnit.artStyle < fullUnit.unit.images.length
          ) {
            changeArtStyle(1)
          }
        }}
      />
      {faction === undefined ? (
        <img id="deckEditorUnitsIcon" src="images/stats/units.png" title="Units" />
      ) : resolvedFactionUnitsError || resolvedNeutralUnitsError ? (
        <div id="deckEditorUnitsErrors">
          {resolvedFactionUnitsError && (
            <span
              id={HTML_IDS.DeckUnitsFactionError}
              className={HTML_CLASSES.ErrorText}
            >{`Error getting faction units: ${resolvedFactionUnitsError}`}</span>
          )}
          {resolvedNeutralUnitsError && (
            <span
              id={HTML_IDS.DeckUnitsNeutralError}
              className={HTML_CLASSES.ErrorText}
            >{`Error getting neutral units: ${resolvedNeutralUnitsError}`}</span>
          )}
        </div>
      ) : (
        <div id={HTML_IDS.DeckEditorUnitsContainer}>
          <div id="unitsContainerLeft" className="deck-editor-unit-container">
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
              <div id={HTML_IDS.DeckUnitsAvailableContainer} className="deck-editor-unit-border">
                <div className="deck-editor-card-container">
                  {filteredAvailableUnits.map((deckUnit) => (
                    <UnitDeckCard
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
          <div id="deckEditorUnitsContainerMiddle">
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
          <div id="unitsContainerRight" className="deck-editor-unit-container">
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
              <div id={HTML_IDS.DeckUnitsSelectedContainer} className="deck-editor-unit-border">
                <div className="deck-editor-card-container">
                  {filteredSelectedUnits.map((deckUnit) => (
                    <UnitDeckCard
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

interface DeckEditorProps extends PropsWithChildren {
  deck?: Deck | undefined
  onSave: (deck: Deck) => any // eslint-disable-line @typescript-eslint/no-explicit-any
  onCancel: () => any // eslint-disable-line @typescript-eslint/no-explicit-any
}
