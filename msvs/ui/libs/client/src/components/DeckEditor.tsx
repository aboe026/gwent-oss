import { Dispatch, PropsWithChildren, SetStateAction, useEffect, useState } from 'react'
import { FragmentType } from '@apollo/client'
import { useMutation, useQuery } from '@apollo/client/react'

import {
  AddDeckDocument,
  CardUnitFragmentFragmentDoc,
  Combat,
  DeckFragmentFragment,
  DeckFragmentFragmentDoc,
  DecksDocument,
  DecksQuery,
  DeckStatsFragmentDoc,
  DeckUnitFragmentFragment,
  DlcKey,
  EffectKey,
  FactionFragmentFragment,
  FactionFragmentFragmentDoc,
  FactionKey,
  FactionsDocument,
  FactionsQuery,
  LeadersDocument,
  UnitEffectFragmentDoc,
  UnitsDocument,
  UnitStats,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import addToCacheList from '../util/add-to-cache-list'
import Centered from '../components/Centered'
import CloseButton from './CloseButton'
import { combineUnitStats, sortObjectArray } from '@gwent/utils'
import DlcTag from '../components/DlcTag'
import {
  FILTERS,
  FILTER_FIELD,
  FILTER_GROUP,
  FilterField,
  SORT_FIELD,
  SORT_ORDER,
} from '@gwent/graphql-schema/deck-filter'
import getEnumFromString from '../util/get-faction-key-from-string'
import { getErrorMessages, retryCheckingAuth } from '../util/error-util'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import LoadingBar from '../components/LoadingBar'
import LoadingSpinner from '../components/LoadingSpinner'
import ProgressBar from '../components/ProgressBar'
import UnitDeckCard from './UnitDeckCard'
import UnitFullCard from './UnitFullCard'
import UnitsHeader from '../components/UnitsHeader'
import UnitsStats from '../components/UnitsStats'
import { useAuthRetry } from '../AuthRetry'
import { useUserContext } from '../UserContext'
import { ValidateDeck } from '@gwent/validators'
import WholeScreenDialog from '../components/WholeScreenDialog'
import './DeckEditor.css'

/**
 * The component to configure a user created Deck
 *
 * @returns The component to configure decks
 */
export default function DeckEditor({ deck, onCancel, onSave }: DeckEditorProps) {
  const [name, setName] = useState<string>('')
  const [faction, setFaction] = useState<FactionFragmentFragment | undefined>()
  const [factionStats, setFactionStats] = useState<UnitStats | undefined>()
  const [leaderId, setLeaderId] = useState<string | undefined>()
  const [selectedUnits, setSelectedUnits] = useState<DeckUnitFragmentFragment[]>([])
  const [deckUnits, setDeckUnits] = useState<DeckUnitFragmentFragment[]>([])
  const { checkAuth } = useUserContext()
  const [addDeck, { loading, error }] = useMutation(AddDeckDocument, {
    onCompleted(result) {
      onSave(useFragment(DeckFragmentFragmentDoc, result.addDeck))
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
    ValidateDeck.fromDeckUnitFragments({
      deckUnits: selectedUnits,
      faction: faction.key,
    }).length === 0
  ) {
    percent += 25
  }
  const errorMessages = getErrorMessages(error)

  return (
    <form
      id={HTML_IDS.DeckEditorContainer}
      onSubmit={async (event) => {
        event.preventDefault()
        if (percent === 100 && faction && leaderId && name && selectedUnits) {
          await retryCheckingAuth({
            checkAuth,
            method: async () => {
              await addDeck({
                variables: {
                  faction: faction.key,
                  leader: leaderId,
                  name,
                  units: selectedUnits.map((deckUnit) => {
                    const unit = useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit)
                    return {
                      id: unit.id,
                      artStyle: deckUnit.artStyle,
                    }
                  }),
                },
              })
            },
          })
        }
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
      {errorMessages && (
        <span id={HTML_IDS.DeckEditorError} className={HTML_CLASSES.ErrorText}>
          {`Error creating deck: ${errorMessages}`}
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

/**
 * Information about the Deck name and Faction chosen.
 */
function renderNameAndFaction({
  disabledOverride,
  faction,
  factionStats,
  name,
  setDeckUnits,
  setFaction,
  setFactionStats,
  setLeaderId,
  setName,
  setSelectedUnits,
}: {
  disabledOverride: boolean
  faction: FactionFragmentFragment | undefined
  factionStats: UnitStats | undefined
  name: string
  setDeckUnits: Dispatch<SetStateAction<DeckUnitFragmentFragment[]>>
  setFaction: Dispatch<SetStateAction<FactionFragmentFragment | undefined>>
  setFactionStats: Dispatch<SetStateAction<UnitStats | undefined>>
  setLeaderId: Dispatch<SetStateAction<string | undefined>>
  setName: Dispatch<SetStateAction<string>>
  setSelectedUnits: Dispatch<SetStateAction<DeckUnitFragmentFragment[]>>
}) {
  const [factionPickerOpen, setFactionPickerOpen] = useState(false)
  const {
    loading: factionsLoading,
    error: factionsError,
    data: factionsData,
    refetch: factionsRefetch,
  } = useQuery(FactionsDocument)
  useAuthRetry(factionsError, factionsRefetch)

  const errorMessages = getErrorMessages(factionsError)
  if (errorMessages) {
    return (
      <span
        id={HTML_IDS.DeckEditorFactionError}
        className={HTML_CLASSES.ErrorText}
      >{`Error getting factions: ${errorMessages}`}</span>
    )
  }

  let selectedFaction: FactionFragmentFragment | undefined = undefined
  let neutralFaction: FactionFragmentFragment | undefined = undefined
  if (factionsData && faction) {
    for (
      let i = 0;
      i < factionsData.factions.length && (selectedFaction === undefined || neutralFaction === undefined);
      i++
    ) {
      const potentialFaction = useFragment(FactionFragmentFragmentDoc, factionsData.factions[i])
      if (potentialFaction.key === faction.key) {
        selectedFaction = potentialFaction
      } else if (potentialFaction.key === FactionKey.Neutral) {
        neutralFaction = potentialFaction
      }
    }
  }

  if (selectedFaction?.stats && neutralFaction?.stats) {
    const selectedStats = {
      ...selectedFaction.stats,
      ...useFragment(DeckStatsFragmentDoc, selectedFaction.stats),
    }
    const neutralStats = {
      ...neutralFaction.stats,
      ...useFragment(DeckStatsFragmentDoc, neutralFaction.stats),
    }
    const combinedStats = combineUnitStats(selectedStats, neutralStats)
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
                onChange={(event) => {
                  const newFactionKey = getEnumFromString({
                    enumerative: FactionKey,
                    value: event.target.value,
                  })
                  if (newFactionKey) {
                    changeFaction({
                      factionsData,
                      newFactionKey,
                      setDeckUnits,
                      setFaction,
                      setLeaderId,
                      setSelectedUnits,
                      setFactionPickerOpen,
                    })
                  }
                }}
              >
                <option disabled value="">
                  -- select a faction --
                </option>
                {factionsData?.factions.map((factionFragment, index) => (
                  <FactionTextOption factionFragment={factionFragment} key={index} />
                ))}
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
                      {factionsData?.factions.map((factionFragment) => (
                        <FactionDetailedOption
                          factionFragment={factionFragment}
                          factionsData={factionsData}
                          setDeckUnits={setDeckUnits}
                          setFaction={setFaction}
                          setFactionPickerOpen={setFactionPickerOpen}
                          setLeaderId={setLeaderId}
                          setSelectedUnits={setSelectedUnits}
                        />
                      ))}
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

function FactionTextOption({ factionFragment }: { factionFragment: FragmentType<FactionFragmentFragment> }) {
  const faction = useFragment(FactionFragmentFragmentDoc, factionFragment)
  if (faction.key !== FactionKey.Neutral) {
    return (
      <option key={faction.key} value={faction.key}>
        {faction.name}
      </option>
    )
  }
}

function FactionDetailedOption({
  factionFragment,
  factionsData,
  setDeckUnits,
  setFaction,
  setLeaderId,
  setSelectedUnits,
  setFactionPickerOpen,
}: {
  factionFragment: FragmentType<FactionFragmentFragment>
  factionsData: FactionsQuery | undefined
  setDeckUnits: Dispatch<SetStateAction<DeckUnitFragmentFragment[]>>
  setFaction: Dispatch<SetStateAction<FactionFragmentFragment | undefined>>
  setLeaderId: Dispatch<SetStateAction<string | undefined>>
  setSelectedUnits: Dispatch<SetStateAction<DeckUnitFragmentFragment[]>>
  setFactionPickerOpen: Dispatch<SetStateAction<boolean>>
}) {
  const faction = useFragment(FactionFragmentFragmentDoc, factionFragment)
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
}

/**
 * A user changes the Faction for the Deck.
 */
function changeFaction({
  factionsData,
  newFactionKey,
  setDeckUnits,
  setFaction,
  setFactionPickerOpen,
  setLeaderId,
  setSelectedUnits,
}: {
  factionsData: FactionsQuery | undefined
  newFactionKey: FactionKey
  setDeckUnits: Dispatch<SetStateAction<DeckUnitFragmentFragment[]>>
  setFaction: Dispatch<SetStateAction<FactionFragmentFragment | undefined>>
  setFactionPickerOpen: Dispatch<SetStateAction<boolean>>
  setLeaderId: Dispatch<SetStateAction<string | undefined>>
  setSelectedUnits: Dispatch<SetStateAction<DeckUnitFragmentFragment[]>>
}) {
  setDeckUnits((previous: DeckUnitFragmentFragment[]) =>
    previous.filter((deckUnit) => {
      const unit = useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit)
      return unit.faction.key === FactionKey.Neutral
    })
  )
  setSelectedUnits((previous: DeckUnitFragmentFragment[]) =>
    previous.filter((deckUnit) => {
      const unit = useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit)
      return unit.faction.key === FactionKey.Neutral
    })
  )
  let newFaction: FactionFragmentFragment | undefined = undefined
  if (factionsData?.factions) {
    for (const factionFragment of factionsData.factions) {
      const potentialFaction = useFragment(FactionFragmentFragmentDoc, factionFragment)
      if (potentialFaction.key === newFactionKey) {
        newFaction = potentialFaction
      }
    }
  }
  setFaction(newFaction)
  setLeaderId(undefined)
  setFactionPickerOpen(false)
}

/**
 * Information about the Leader chosen for the Deck.
 */
function renderLeader({
  disabledOverride,
  faction,
  leaderId,
  setLeaderId,
}: {
  disabledOverride: boolean
  faction: FactionFragmentFragment | undefined
  leaderId: string | undefined
  setLeaderId: Dispatch<SetStateAction<string | undefined>>
}) {
  const [leaderPickerOpen, setLeaderPickerOpen] = useState(false)
  const {
    loading: leadersLoading,
    error: leadersError,
    data: leadersData,
    refetch: leadersRefetch,
  } = useQuery(LeadersDocument, {
    variables: {
      factions: faction ? [faction.key] : [],
    },
    skip: faction === undefined,
  })
  useAuthRetry(leadersError, leadersRefetch)

  if (faction === undefined) {
    return (
      <Centered>
        <img id="deckEditorLeaderIcon" src="images/stats/leader.png" title="Leader" />
      </Centered>
    )
  }

  const errorMessages = getErrorMessages(leadersError)
  if (errorMessages) {
    return (
      <Centered>
        <span
          id={HTML_IDS.DeckEditorLeaderError}
          className={HTML_CLASSES.ErrorText}
        >{`Error getting leaders: ${errorMessages}`}</span>
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

/**
 * The available and selected Units for the Deck.
 */
function renderUnits({
  deckUnits,
  disabledOverride,
  faction,
  factionStats,
  selectedUnits,
  setDeckUnits,
  setSelectedUnits,
}: {
  deckUnits: DeckUnitFragmentFragment[]
  disabledOverride: boolean
  faction: FactionFragmentFragment | undefined
  factionStats: UnitStats | undefined
  selectedUnits: DeckUnitFragmentFragment[]
  setDeckUnits: Dispatch<SetStateAction<DeckUnitFragmentFragment[]>>
  setSelectedUnits: Dispatch<SetStateAction<DeckUnitFragmentFragment[]>>
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
  const [fullUnit, setFullUnit] = useState<DeckUnitFragmentFragment | undefined>()
  const {
    loading: factionUnitsLoading,
    error: factionUnitsError,
    data: factionUnitsData,
    refetch: factionUnitsRefetch,
  } = useQuery(UnitsDocument, {
    variables: {
      deckable: true,
      factions: faction ? [faction.key] : [],
    },
    skip: faction === undefined,
  })
  useAuthRetry(factionUnitsError, factionUnitsRefetch)
  useEffect(() => {
    if (factionUnitsData) {
      setDeckUnits((previous: DeckUnitFragmentFragment[]) => [
        ...previous.filter((deckUnit) => {
          const unit = useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit)
          return unit.faction.key === FactionKey.Neutral
        }),
        ...(factionUnitsData.units || []).map((unit) => ({
          artStyle: 1,
          unit,
        })),
      ])
    }
  }, [factionUnitsData, setDeckUnits])
  const {
    loading: neutralUnitsLoading,
    error: neutralUnitsError,
    data: neutralUnitsData,
    refetch: neutralUnitsRefetch,
  } = useQuery(UnitsDocument, {
    variables: {
      deckable: true,
      factions: [FactionKey.Neutral],
    },
    skip: faction === undefined,
  })
  useAuthRetry(neutralUnitsError, neutralUnitsRefetch)
  useEffect(() => {
    if (neutralUnitsData) {
      setDeckUnits((previous: DeckUnitFragmentFragment[]) => [
        ...previous,
        ...(neutralUnitsData.units || []).map((unit) => ({
          artStyle: 1,
          unit,
        })),
      ])
    }
  }, [neutralUnitsData, setDeckUnits])

  let availableSortFields = [`unit.${SORT_FIELD.Name}`, `unit.${SORT_FIELD.Id}`]
  if (availableSortField === SORT_FIELD.Strength) {
    availableSortFields = [`unit.${SORT_FIELD.Strength}`, ...availableSortFields]
  }
  const sortedUnits = sortObjectArray({
    array: deckUnits,
    sortProperties: availableSortFields,
    reverse: availableSortOrder === SORT_ORDER.Desc,
  })
  const filteredAvailableUnits: DeckUnitFragmentFragment[] = []
  let filteredSelectedUnits: DeckUnitFragmentFragment[] = []
  const selectedIds = selectedUnits.map((deckUnit) => {
    return useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit).id
  })
  for (const deckUnit of sortedUnits) {
    const unit = useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit)
    if (selectedIds.includes(unit.id)) {
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

  const factionUnitsErrorMessages = getErrorMessages(factionUnitsError)
  const neutralUnitsErrorMessages = getErrorMessages(neutralUnitsError)

  const disabled = neutralUnitsLoading || factionUnitsLoading || disabledOverride

  let nextUnit: DeckUnitFragmentFragment | undefined
  let previousUnit: DeckUnitFragmentFragment | undefined
  if (fullUnit) {
    const fullUnitId = useFragment(CardUnitFragmentFragmentDoc, fullUnit.unit).id
    if (selectedIds.includes(fullUnitId)) {
      const fullUnitPosition = filteredSelectedUnits.findIndex((deckUnit) => {
        return useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit).id === fullUnitId
      })
      nextUnit = filteredSelectedUnits[fullUnitPosition + 1]
      previousUnit = filteredSelectedUnits[fullUnitPosition - 1]
    } else {
      const fullUnitPosition = filteredAvailableUnits.findIndex((deckUnit) => {
        return useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit).id === fullUnitId
      })
      nextUnit = filteredAvailableUnits[fullUnitPosition + 1]
      previousUnit = filteredAvailableUnits[fullUnitPosition - 1]
    }
  }
  /**
   * Change to an alternative art style for a Unit
   */
  function changeArtStyle(change: number) {
    setDeckUnits((previous: DeckUnitFragmentFragment[]) =>
      previous.map((deckUnit) => {
        if (
          fullUnit &&
          useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit).id ===
            useFragment(CardUnitFragmentFragmentDoc, fullUnit.unit).id &&
          deckUnit.artStyle !== undefined &&
          deckUnit.artStyle !== null
        ) {
          deckUnit.artStyle = deckUnit.artStyle + change
        }
        return deckUnit
      })
    )
  }
  const sharedProps = {
    availableFilterFields,
    availableFiltersExpanded,
    availableNameFilter,
    availableSortField,
    availableSortOrder,
    disabled,
    faction,
    selectedFilterFields,
    selectedFiltersExpanded,
    selectedNameFilter,
    selectedSortField,
    selectedSortOrder,
    setAvailableFilterFields,
    setAvailableFiltersExpanded,
    setAvailableNameFilter,
    setAvailableSortField,
    setAvailableSortOrder,
    setSelectedFilterFields,
    setSelectedFiltersExpanded,
    setSelectedNameFilter,
    setSelectedSortField,
    setSelectedSortOrder,
    sortFilterLocked,
  }

  return (
    <>
      <UnitFullCard
        fullUnit={fullUnit}
        hasNext={nextUnit !== undefined}
        hasPrevious={previousUnit !== undefined}
        onSelect={(fullUnitSelected) => {
          if (fullUnitSelected) {
            setSelectedUnits((previous) => {
              const previousUnitIds = previous.map(
                (deckUnit) => useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit).id
              )
              const currentUnitId = useFragment(CardUnitFragmentFragmentDoc, fullUnitSelected.unit).id
              return previousUnitIds.includes(currentUnitId)
                ? previous.filter(
                    (deckUnit) =>
                      useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit).id !==
                      useFragment(CardUnitFragmentFragmentDoc, fullUnitSelected.unit).id
                  )
                : [...previous, fullUnitSelected as DeckUnitFragmentFragment]
            })
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
          const unit = useFragment(CardUnitFragmentFragmentDoc, fullUnit?.unit)
          if (!disabled && fullUnit && unit && unit.images.length > 0 && fullUnit.artStyle && fullUnit.artStyle > 1) {
            changeArtStyle(-1)
          }
        }}
        onArtIncrement={() => {
          const unit = useFragment(CardUnitFragmentFragmentDoc, fullUnit?.unit)
          if (!disabled && fullUnit && unit && unit.images.length > 0 && fullUnit.artStyle < unit.images.length) {
            changeArtStyle(1)
          }
        }}
      />
      {faction === undefined ? (
        <img id="deckEditorUnitsIcon" src="images/stats/units.png" title="Units" />
      ) : factionUnitsErrorMessages || neutralUnitsErrorMessages ? (
        <div id="deckEditorUnitsErrors">
          {factionUnitsErrorMessages && (
            <span
              id={HTML_IDS.DeckUnitsFactionError}
              className={HTML_CLASSES.ErrorText}
            >{`Error getting faction units: ${factionUnitsErrorMessages}`}</span>
          )}
          {neutralUnitsErrorMessages && (
            <span
              id={HTML_IDS.DeckUnitsNeutralError}
              className={HTML_CLASSES.ErrorText}
            >{`Error getting neutral units: ${neutralUnitsErrorMessages}`}</span>
          )}
        </div>
      ) : (
        <div id={HTML_IDS.DeckEditorUnitsContainer}>
          <div id="unitsContainerLeft" className="deck-editor-unit-container">
            <UnitsHeader {...sharedProps} isAvailable={true} />
            {factionUnitsLoading || neutralUnitsLoading ? (
              renderUnitsLoading()
            ) : (
              <div id={HTML_IDS.DeckUnitsAvailableContainer} className="deck-editor-unit-border">
                <div className="deck-editor-card-container">
                  {filteredAvailableUnits.map((deckUnit) => (
                    <UnitDeckCard
                      key={useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit).id}
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
            <UnitsHeader {...sharedProps} isAvailable={false} />
            {factionUnitsLoading || neutralUnitsLoading ? (
              renderUnitsLoading()
            ) : (
              <div id={HTML_IDS.DeckUnitsSelectedContainer} className="deck-editor-unit-border">
                <div className="deck-editor-card-container">
                  {filteredSelectedUnits.map((deckUnit) => (
                    <UnitDeckCard
                      key={useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit).id}
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

/**
 * A loading spinner indicating that Units are being retrieved.
 */
function renderUnitsLoading() {
  return (
    <Centered>
      <LoadingSpinner size="50px" />
    </Centered>
  )
}

/**
 * Whether or not the given DeckUnit should be shown.
 *
 * @param deckUnit The DeckUnit under consideration of whether or not it should be shown.
 * @param fields The fields the user is currently filtering on.
 * @param name The Unit name the user is currently filtering on. Matches substrings.
 * @returns True if the DeckUnit should be shown, false if not.
 */
function isFilteredIn(deckUnit: DeckUnitFragmentFragment, fields: FILTER_FIELD[], name: string): boolean {
  const unit = useFragment(CardUnitFragmentFragmentDoc, deckUnit.unit)
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
    combatFilters.some((filter) => {
      const combat = getEnumFromString({
        enumerative: Combat,
        value: filter.value,
      })
      return combat && unit.combats?.includes(combat)
    })
  const dlcIncluded =
    dlcFilters.length === 0 ||
    dlcFilters.some(
      (filter) =>
        unit.dlc?.key ===
        getEnumFromString({
          enumerative: DlcKey,
          value: filter.value,
        })
    )
  const effectIncluded =
    effectFilters.length === 0 ||
    effectFilters.some((filter) => {
      const effect = getEnumFromString({
        enumerative: EffectKey,
        value: filter.value,
      })
      return (
        effect && unit.effects?.map((unitEffect) => useFragment(UnitEffectFragmentDoc, unitEffect).key).includes(effect)
      )
    })
  const factionIncluded =
    factionFilters.length === 0 ||
    factionFilters.some((filter) => {
      const filterFaction = getEnumFromString({
        enumerative: FactionKey,
        value: filter.value,
      })
      return (
        (unit.faction.key === FactionKey.Neutral && filterFaction === FactionKey.Neutral) ||
        (unit.faction.key !== FactionKey.Neutral && filterFaction !== FactionKey.Neutral)
      )
    })
  const otherIncluded =
    otherFilters.length === 0 ||
    otherFilters.some(
      (filter) =>
        (filter.value === FILTER_FIELD.Hero && unit.hero) ||
        (filter.value === FILTER_FIELD.Special && unit.special) ||
        (filter.value === FILTER_FIELD.Strength && unit.strength !== undefined && unit.strength !== null) ||
        (filter.value === FILTER_FIELD.Art && unit.images.length > 1)
    )
  const nameIncluded = !name || unit.name.toLowerCase().includes(name.toLowerCase())

  return combatIncluded && dlcIncluded && effectIncluded && factionIncluded && otherIncluded && nameIncluded
}

interface DeckEditorProps extends PropsWithChildren {
  deck?: DeckFragmentFragment | undefined
  onCancel: () => any // eslint-disable-line @typescript-eslint/no-explicit-any
  onSave: (deck: DeckFragmentFragment) => any // eslint-disable-line @typescript-eslint/no-explicit-any
}
