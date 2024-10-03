import { CgChevronDoubleLeft, CgChevronDoubleRight, CgLock, CgLockUnlock } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'

import { DeckUnit } from '@gwent/graphql-schema/resolver-typings'
import { FILTER_FIELD, SORT_FIELD, SORT_ORDER } from '@gwent/graphql-schema/deck-filter'
import { getDeckStats, toTitleCase } from '@gwent/utils'
import { HTML_IDS, MAX_SPECIALS } from '@gwent/constants'
import ProgressRing from '../components/ProgressRing.jsx'
import { UnitStats } from '@gwent/graphql-schema/apollo-typings'
import './UnitsStats.css'

/**
 * Shows the statistics for the units selected for a deck
 *
 * @returns The statistics bar for units in a deck
 */
export default function UnitsStats({
  availableFilterFields,
  availableFiltersExpanded,
  availableNameFilter,
  availableSortField,
  availableSortOrder,
  combatsExpanded,
  disabled,
  effectsExpanded,
  factionStats,
  filteredAvailableUnits,
  filteredSelectedUnits,
  selectedUnits,
  setAvailableFilterFields,
  setCombatsExpanded,
  setEffectsExpanded,
  setSelectedUnits,
  setSelectedFilterFields,
  setSelectedFiltersExpanded,
  setSelectedNameFilter,
  setSelectedSortField,
  setSelectedSortOrder,
  setSortFilterLocked,
  sortFilterLocked,
}: UnitsStatsProps) {
  const selectedStats = getDeckStats(selectedUnits)
  const buttonColor = disabled ? 'gray' : 'black'

  return (
    <>
      <div id="unitsStatsTop">
        <div className="units-stats-select-all-container">
          <span>{filteredAvailableUnits.length}</span>
          <div
            id={HTML_IDS.DeckUnitSelectAll}
            className={`units-stats-select-all ${!disabled ? 'pointable' : ''}`}
            title="Add All"
            onClick={() => {
              if (!disabled) {
                setSelectedUnits((previous: DeckUnit[]) => [...previous, ...filteredAvailableUnits])
              }
            }}
          >
            <CgChevronDoubleRight color={buttonColor} />
          </div>
        </div>
        <div
          id={HTML_IDS.DeckUnitsLockHeaders}
          className={disabled ? '' : 'pointable'}
          onClick={() => {
            if (!disabled) {
              setSortFilterLocked((previous: boolean) => {
                if (previous) {
                  return false
                }
                setSelectedFilterFields(availableFilterFields)
                setSelectedSortField(availableSortField)
                setSelectedSortOrder(availableSortOrder)
                setSelectedFiltersExpanded(availableFiltersExpanded)
                setSelectedNameFilter(availableNameFilter)
                return true
              })
            }
          }}
          title={sortFilterLocked ? 'Unlock Filters and Sort' : 'Lock Filters and Sort'}
        >
          {sortFilterLocked ? <CgLock color="black" /> : <CgLockUnlock color="black" />}
        </div>
        <div className="units-stats-select-all-container">
          <span>{filteredSelectedUnits.length}</span>
          <div
            id={HTML_IDS.DeckUnitRemoveAll}
            className={`units-stats-select-all ${!disabled ? 'pointable' : ''}`}
            title="Remove All"
            onClick={() => {
              if (!disabled) {
                setSelectedUnits((previous: DeckUnit[]) =>
                  previous.filter(
                    (deckUnit) =>
                      !filteredSelectedUnits.some((selectedUnit) => selectedUnit.unit.id === deckUnit.unit.id)
                  )
                )
              }
            }}
          >
            <CgChevronDoubleLeft color={buttonColor} />
          </div>
        </div>
      </div>
      <div id="unitsStatsContainer">
        <div id="unitsStatsMains">
          <div className="units-stats-section">
            <ProgressRing
              id={HTML_IDS.DeckUnitStatUnit}
              completed={selectedStats.units}
              total={22}
              remainingColor="darkgray"
              completedColor={selectedStats.units < 22 ? 'red' : 'green'}
              label={<img src="images/stats/deck.png" title="Units" />}
              title="Minimum 22"
              onClick={() => {
                setAvailableFilterFields([])
                setSelectedFilterFields([])
              }}
            />
            <ProgressRing
              id={HTML_IDS.DeckUnitStatSpecial}
              completed={selectedStats.specials}
              total={MAX_SPECIALS}
              remainingColor="darkgray"
              completedColor={selectedStats.specials > MAX_SPECIALS ? 'red' : 'green'}
              label={<img src="images/stats/special.png" title="Special" />}
              title={`Maximum ${MAX_SPECIALS}`}
              onClick={() => {
                setAvailableFilterFields([FILTER_FIELD.Special])
                setSelectedFilterFields([FILTER_FIELD.Special])
              }}
            />
            <ProgressRing
              id={HTML_IDS.DeckUnitStatHero}
              completed={selectedStats.heroes}
              total={factionStats?.heroes || 0}
              remainingColor="darkgray"
              completedColor="#e9a018"
              label={<img src="images/stats/hero.png" title="Heroes" />}
              title="Heroes"
              onClick={() => {
                setAvailableFilterFields([FILTER_FIELD.Hero])
                setSelectedFilterFields([FILTER_FIELD.Hero])
              }}
            />
            <ProgressRing
              id={HTML_IDS.DeckUnitStatStrength}
              completed={selectedStats.strengthTotal}
              total={factionStats?.strengthTotal || 0}
              remainingColor="darkgray"
              completedColor="black"
              label={<img src="images/stats/strength.png" title="Strength" />}
              title="Strength"
              onClick={() => {
                setAvailableFilterFields([FILTER_FIELD.Strength])
                setSelectedFilterFields([FILTER_FIELD.Strength])
              }}
            />
            <div className="units-stats-inline">
              <img
                src="images/stats/strength-average.png"
                title="Average Strength"
                className="units-stats-inline-icon"
              />
              <span>{(selectedStats.strengthAverage || 0).toFixed(1)}</span>
            </div>
          </div>
        </div>
        <div>
          <div className="units-stats-separator"></div>
          <div
            id={HTML_IDS.DeckUnitStatCombats}
            className="units-stats-header"
            onClick={() => setCombatsExpanded((previous) => !previous)}
          >
            Combats
          </div>
          {combatsExpanded && (
            <div className="units-stats-section">
              {renderSmallStat({
                completed: selectedStats.close,
                field: FILTER_FIELD.Close,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Close',
                total: factionStats?.close || 0,
                type: SmallStatType.Combat,
              })}
              {renderSmallStat({
                completed: selectedStats.ranged,
                field: FILTER_FIELD.Ranged,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Ranged',
                total: factionStats?.ranged || 0,
                type: SmallStatType.Combat,
              })}
              {renderSmallStat({
                completed: selectedStats.siege,
                field: FILTER_FIELD.Siege,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Siege',
                total: factionStats?.siege || 0,
                type: SmallStatType.Combat,
              })}
            </div>
          )}
          <div className="units-stats-separator"></div>
          <div
            id={HTML_IDS.DeckUnitStatEffects}
            className="units-stats-header"
            onClick={() => setEffectsExpanded((previous) => !previous)}
          >
            Effects
          </div>
          {effectsExpanded && (
            <div className="units-stats-section">
              {renderSmallStat({
                completed: selectedStats.agile,
                field: FILTER_FIELD.Agile,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Agile',
                total: factionStats?.agile || 0,
                type: SmallStatType.Effect,
              })}
              {renderSmallStat({
                completed: selectedStats.avenger,
                field: FILTER_FIELD.Avenger,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Avenger',
                total: factionStats?.avenger || 0,
                type: SmallStatType.Effect,
              })}
              {renderSmallStat({
                completed: selectedStats.berserker,
                field: FILTER_FIELD.Berserker,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Berserker',
                total: factionStats?.berserker || 0,
                type: SmallStatType.Effect,
              })}
              {renderSmallStat({
                completed: selectedStats.bond,
                field: FILTER_FIELD.Bond,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Bond',
                total: factionStats?.bond || 0,
                type: SmallStatType.Effect,
              })}
              {renderSmallStat({
                completed: selectedStats.decoy,
                field: FILTER_FIELD.Decoy,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Decoy',
                total: factionStats?.decoy || 0,
                type: SmallStatType.Effect,
              })}
              {renderSmallStat({
                completed: selectedStats.horn,
                field: FILTER_FIELD.Horn,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Horn',
                total: factionStats?.horn || 0,
                type: SmallStatType.Effect,
              })}
              {renderSmallStat({
                completed: selectedStats.mardroeme,
                field: FILTER_FIELD.Mardroeme,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Mardroeme',
                total: factionStats?.mardroeme || 0,
                type: SmallStatType.Effect,
              })}
              {renderSmallStat({
                completed: selectedStats.medic,
                field: FILTER_FIELD.Medic,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Medic',
                total: factionStats?.medic || 0,
                type: SmallStatType.Effect,
              })}
              {renderSmallStat({
                completed: selectedStats.morale,
                field: FILTER_FIELD.Morale,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Morale',
                total: factionStats?.morale || 0,
                type: SmallStatType.Effect,
              })}
              {renderSmallStat({
                completed: selectedStats.muster,
                field: FILTER_FIELD.Muster,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Muster',
                total: factionStats?.muster || 0,
                type: SmallStatType.Effect,
              })}
              {renderSmallStat({
                completed: selectedStats.scorch,
                field: FILTER_FIELD.Scorch,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Scorch',
                total: factionStats?.scorch || 0,
                type: SmallStatType.Effect,
              })}
              {renderSmallStat({
                completed: selectedStats.spy,
                field: FILTER_FIELD.Spy,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Spy',
                total: factionStats?.spy || 0,
                type: SmallStatType.Effect,
              })}
              {renderSmallStat({
                completed: selectedStats.weather,
                field: FILTER_FIELD.Weather,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Weather',
                total: factionStats?.weather || 0,
                type: SmallStatType.Effect,
              })}
            </div>
          )}
          <div className="units-stats-separator"></div>
        </div>
      </div>
    </>
  )
}

function renderSmallStat({
  completed,
  field,
  setAvailableFilterFields,
  setSelectedFilterFields,
  title,
  total,
  type,
}: {
  completed: number
  field: FILTER_FIELD
  setAvailableFilterFields: Dispatch<SetStateAction<FILTER_FIELD[]>>
  setSelectedFilterFields: Dispatch<SetStateAction<FILTER_FIELD[]>>
  title: string
  total: number
  type: SmallStatType
}) {
  return (
    <ProgressRing
      id={`deckUnitStat${toTitleCase(field)}`}
      width="45px"
      height="55px"
      countMargin="-20px"
      completed={completed}
      total={total}
      remainingColor="darkgray"
      completedColor="black"
      label={<img src={`images/${type}s/${title.toLowerCase()}.png`} />}
      title={title}
      onClick={() => {
        const fields = [field]
        if (type === SmallStatType.Combat) {
          fields.push(FILTER_FIELD.Strength)
        }
        setAvailableFilterFields(fields)
        setSelectedFilterFields(fields)
      }}
    />
  )
}

enum SmallStatType {
  Combat = 'combat',
  Effect = 'effect',
}

interface UnitsStatsProps {
  availableFilterFields: FILTER_FIELD[]
  availableFiltersExpanded: boolean
  availableNameFilter: string
  availableSortField: SORT_FIELD
  availableSortOrder: SORT_ORDER
  combatsExpanded: boolean
  disabled: boolean
  effectsExpanded: boolean
  factionStats: UnitStats | undefined
  filteredAvailableUnits: DeckUnit[]
  filteredSelectedUnits: DeckUnit[]
  selectedUnits: DeckUnit[]
  setAvailableFilterFields: Dispatch<SetStateAction<FILTER_FIELD[]>>
  setCombatsExpanded: Dispatch<SetStateAction<boolean>>
  setEffectsExpanded: Dispatch<SetStateAction<boolean>>
  setSelectedUnits: Dispatch<SetStateAction<DeckUnit[]>>
  setSelectedFilterFields: Dispatch<SetStateAction<FILTER_FIELD[]>>
  setSelectedFiltersExpanded: Dispatch<SetStateAction<boolean>>
  setSelectedNameFilter: Dispatch<SetStateAction<string>>
  setSelectedSortField: Dispatch<SetStateAction<SORT_FIELD>>
  setSelectedSortOrder: Dispatch<SetStateAction<SORT_ORDER>>
  setSortFilterLocked: Dispatch<SetStateAction<boolean>>
  sortFilterLocked: boolean
}
