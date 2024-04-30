import { CgChevronDoubleLeft, CgChevronDoubleRight, CgLock, CgLockUnlock } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'

import { DeckCard } from '@gwent/graphql-schema/resolver-typings'
import { FILTER_FIELD, SORT_FIELD, SORT_ORDER } from '@gwent/graphql-schema/deck-filter'
import { getDeckStats } from '@gwent/utils'
import ProgressRing from '../components/ProgressRing'
import { UnitStats } from '@gwent/graphql-schema/apollo-typings'
import './UnitsStats.css'
import { HTML_IDS } from '@gwent/constants'

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
  filteredAvailableCards,
  filteredSelectedCards,
  selectedCards,
  setAvailableFilterFields,
  setCombatsExpanded,
  setEffectsExpanded,
  setSelectedCards,
  setSelectedFilterFields,
  setSelectedFiltersExpanded,
  setSelectedNameFilter,
  setSelectedSortField,
  setSelectedSortOrder,
  setSortFilterLocked,
  sortFilterLocked,
}: UnitsStatsProps) {
  const selectedStats = getDeckStats(selectedCards)
  const buttonColor = disabled ? 'gray' : 'black'

  return (
    <>
      <div id="unitsStatsTop">
        <div className="units-select-all-container">
          <span>{filteredAvailableCards.length}</span>
          <div
            id={HTML_IDS.DeckUnitSelectAll}
            className={`units-select-all ${!disabled ? 'pointable' : ''}`}
            title="Add All"
            onClick={() => {
              if (!disabled) {
                setSelectedCards((previous: DeckCard[]) => [...previous, ...filteredAvailableCards])
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
        <div className="units-select-all-container">
          <span>{filteredSelectedCards.length}</span>
          <div
            id={HTML_IDS.DeckUnitRemoveAll}
            className={`units-select-all ${!disabled ? 'pointable' : ''}`}
            title="Remove All"
            onClick={() => {
              if (!disabled) {
                setSelectedCards((previous: DeckCard[]) =>
                  previous.filter(
                    (card) => !filteredSelectedCards.some((selectedCard) => selectedCard.unit.id === card.unit.id)
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
              total={10}
              remainingColor="darkgray"
              completedColor={selectedStats.specials > 10 ? 'red' : 'green'}
              label={<img src="images/stats/special.png" title="Special" />}
              title="Maximum 10"
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
              completedColor="gold"
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
            <div className="units-stat-inline">
              <img
                src="images/stats/strength-average.png"
                title="Average Strength"
                className="units-stat-inline-icon"
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
              {renderSmallStat({
                completed: selectedStats.agile,
                field: FILTER_FIELD.Agile,
                setAvailableFilterFields,
                setSelectedFilterFields,
                title: 'Agile',
                total: factionStats?.agile || 0,
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
      id={`deckUnitStat${field.substring(0, 1)}${field.substring(1).toLowerCase()}`}
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
        if ([FILTER_FIELD.Close, FILTER_FIELD.Ranged, FILTER_FIELD.Siege].includes(field)) {
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
  filteredAvailableCards: DeckCard[]
  filteredSelectedCards: DeckCard[]
  selectedCards: DeckCard[]
  setAvailableFilterFields: Dispatch<SetStateAction<FILTER_FIELD[]>>
  setCombatsExpanded: Dispatch<SetStateAction<boolean>>
  setEffectsExpanded: Dispatch<SetStateAction<boolean>>
  setSelectedCards: Dispatch<SetStateAction<DeckCard[]>>
  setSelectedFilterFields: Dispatch<SetStateAction<FILTER_FIELD[]>>
  setSelectedFiltersExpanded: Dispatch<SetStateAction<boolean>>
  setSelectedNameFilter: Dispatch<SetStateAction<string>>
  setSelectedSortField: Dispatch<SetStateAction<SORT_FIELD>>
  setSelectedSortOrder: Dispatch<SetStateAction<SORT_ORDER>>
  setSortFilterLocked: Dispatch<SetStateAction<boolean>>
  sortFilterLocked: boolean
}
