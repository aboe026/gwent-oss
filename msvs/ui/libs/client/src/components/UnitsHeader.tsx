import { CgArrowDown, CgArrowUp, CgClose, CgEye, CgEyeAlt } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'

import { FactionFragmentFragment } from '@gwent/graphql-schema/apollo-typings'
import {
  FILTERS,
  FilterField,
  FILTER_FIELD,
  FILTER_GROUP,
  SORT_FIELD,
  SORT_ORDER,
} from '@gwent/graphql-schema/deck-filter'
import getEnumFromString from '../util/get-faction-key-from-string'
import './UnitsHeader.css'

/**
 * A Header for Deck Units
 *
 * @returns The deck Units header
 */
export default function UnitsHeader({
  availableFilterFields,
  availableFiltersExpanded,
  availableNameFilter,
  availableSortField,
  availableSortOrder,
  disabled,
  faction,
  isAvailable,
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
}: UnitsHeaderProps) {
  const type = isAvailable ? 'available' : 'selected'
  const filterFields = isAvailable ? availableFilterFields : selectedFilterFields
  const sortFieldId = `${type}SortField`
  const sortField = isAvailable ? availableSortField : selectedSortField
  const sortOrderId = `${type}SortOrder`
  const sortOrder = isAvailable ? availableSortOrder : selectedSortOrder
  const filtersExpanded = isAvailable ? availableFiltersExpanded : selectedFiltersExpanded
  const buttonColor = isAvailable || !sortFilterLocked ? 'black' : 'gray'
  FILTERS.faction.title = faction?.name

  return (
    <div className="units-header-container">
      <div className="units-header-upper">
        <div className="units-header-section units-header-section-outer">
          <div className="units-header-filter-container">
            <input
              id={`${type}NameFilter`}
              type="search"
              placeholder="Filter by name"
              value={isAvailable ? availableNameFilter : selectedNameFilter}
              disabled={disabled || (!isAvailable && sortFilterLocked)}
              style={{ cursor: disabled || (!isAvailable && sortFilterLocked) ? 'not-allowed' : 'text' }}
              onChange={(event) => {
                const newValue = event.target.value
                if (!disabled) {
                  if (isAvailable) {
                    setAvailableNameFilter(newValue)
                    if (sortFilterLocked) {
                      setSelectedNameFilter(newValue)
                    }
                  } else if (!sortFilterLocked) {
                    setSelectedNameFilter(newValue)
                  }
                }
              }}
            />
            <div
              id={`unitsHeaderFilterExpand${type.substring(0, 1).toUpperCase()}${type.substring(1)}`}
              className="units-header-filter-expand"
              style={{ cursor: disabled || (!isAvailable && sortFilterLocked) ? 'not-allowed' : 'pointer' }}
              title={filtersExpanded ? 'Hide Filters' : 'Show Filters'}
              onClick={() => {
                if (!disabled) {
                  if (isAvailable) {
                    setAvailableFiltersExpanded(!availableFiltersExpanded)
                    if (sortFilterLocked) {
                      setSelectedFiltersExpanded(!availableFiltersExpanded)
                    }
                  } else if (!sortFilterLocked) {
                    setSelectedFiltersExpanded(!selectedFiltersExpanded)
                  }
                }
              }}
            >
              {filtersExpanded ? <CgEyeAlt color={buttonColor} /> : <CgEye color={buttonColor} />}
            </div>
            <span
              style={{ color: disabled || (!isAvailable && sortFilterLocked) ? 'gray' : 'black' }}
              title="Filters Applied"
            >
              {filterFields.length}/{Object.keys(FILTERS).length}
            </span>
            {filterFields.length > 0 && (
              <div
                className="units-header-filter-clear"
                style={{ cursor: disabled || (!isAvailable && sortFilterLocked) ? 'not-allowed' : 'pointer' }}
                title="Clear"
                onClick={() => {
                  if (!disabled) {
                    if (isAvailable) {
                      setAvailableFilterFields([])
                      if (sortFilterLocked) {
                        setSelectedFilterFields([])
                      }
                    } else if (!sortFilterLocked) {
                      setSelectedFilterFields([])
                    }
                  }
                }}
              >
                <CgClose color={buttonColor} />
              </div>
            )}
          </div>
        </div>
        <div className="units-header-section">
          <span className="units-header-title">{isAvailable ? 'Available' : 'Selected'}</span>
        </div>
        <div className="units-header-section units-header-section-outer">
          <div className="units-header-sort-container">
            <select
              id={sortFieldId}
              title="Sort Field"
              name={sortFieldId}
              value={sortField}
              disabled={disabled || (!isAvailable && sortFilterLocked)}
              style={{ cursor: disabled || (!isAvailable && sortFilterLocked) ? 'not-allowed' : 'pointer' }}
              onChange={(event) => {
                if (!disabled) {
                  const newSortField = getEnumFromString({
                    enumerative: SORT_FIELD,
                    value: event.target.value,
                  })
                  if (newSortField) {
                    if (isAvailable) {
                      setAvailableSortField(newSortField)
                    }
                    if (!isAvailable || sortFilterLocked) {
                      setSelectedSortField(newSortField)
                    }
                  }
                }
              }}
            >
              <option value={SORT_FIELD.Name}>Name</option>
              <option value={SORT_FIELD.Strength}>Strength</option>
            </select>
            <div
              id={sortOrderId}
              className="units-header-sort-order"
              style={{ cursor: disabled || (!isAvailable && sortFilterLocked) ? 'not-allowed' : 'pointer' }}
              title="Sort Order"
              onClick={() => {
                if (!disabled) {
                  const newSortOrder = sortOrder === SORT_ORDER.Asc ? SORT_ORDER.Desc : SORT_ORDER.Asc
                  if (isAvailable) {
                    setAvailableSortOrder(newSortOrder)
                    if (sortFilterLocked) {
                      setSelectedSortOrder(newSortOrder)
                    }
                  } else if (!sortFilterLocked) {
                    setSelectedSortOrder(newSortOrder)
                  }
                }
              }}
            >
              {sortOrder === SORT_ORDER.Asc ? <CgArrowDown color={buttonColor} /> : <CgArrowUp color={buttonColor} />}
            </div>
          </div>
        </div>
      </div>
      {filtersExpanded &&
        renderFilterCheckboxes({
          fields: Object.values(FILTERS).map((filter) => {
            if (filter.value === FILTER_FIELD.Faction && faction) {
              filter.title = faction.name
              filter.label = faction.name
            }
            return filter
          }),
          availableField: isAvailable,
          filterFieldsSelected: filterFields,
          setAvailableFilterFields,
          setSelectedFilterFields,
          sortFilterLocked,
          disabled,
        })}
    </div>
  )
}

/**
 * The checkboxes a user can toggle to filter which Units are displayed.
 */
function renderFilterCheckboxes({
  fields,
  filterFieldsSelected,
  availableField,
  setAvailableFilterFields,
  setSelectedFilterFields,
  sortFilterLocked,
  disabled,
}: {
  fields: FilterField[]
  filterFieldsSelected: FILTER_FIELD[]
  availableField: boolean
  setAvailableFilterFields: Dispatch<SetStateAction<FILTER_FIELD[]>>
  setSelectedFilterFields: Dispatch<SetStateAction<FILTER_FIELD[]>>
  sortFilterLocked: boolean
  disabled: boolean
}) {
  return (
    <div className="units-header-filter-values">
      {Object.values(FILTER_GROUP).map((group) => (
        <div key={group} className="units-header-filter-group-container">
          <span className="units-header-filter-group-name">{group}</span>
          <div
            className={
              group === FILTER_GROUP.Effect ? 'units-header-filter-group-effects' : 'units-header-filter-group-values'
            }
          >
            {fields
              .filter((field) => field.group === group)
              .map((field) => {
                const id = `filter${availableField ? 'Available' : 'Selected'}${field.value}`
                return (
                  <div
                    key={id}
                    className={group === FILTER_GROUP.Effect ? '' : 'units-header-filter-group-small'}
                    title={field.title || field.label}
                  >
                    <input
                      type="checkbox"
                      id={id}
                      name={id}
                      checked={filterFieldsSelected.includes(field.value)}
                      disabled={(!availableField && sortFilterLocked) || disabled}
                      style={{ cursor: (!availableField && sortFilterLocked) || disabled ? 'not-allowed' : 'pointer' }}
                      className="units-header-filter-checkbox"
                      onChange={() => {
                        if (!disabled) {
                          if (availableField) {
                            setAvailableFilterFields((previous: FILTER_FIELD[]) => {
                              if (previous.includes(field.value)) {
                                return previous.filter((previousField) => previousField !== field.value)
                              }
                              return [...previous, field.value]
                            })
                          }
                          if (!availableField || sortFilterLocked) {
                            setSelectedFilterFields((previous: FILTER_FIELD[]) => {
                              if (previous.includes(field.value)) {
                                return previous.filter((previousField) => previousField !== field.value)
                              }
                              return [...previous, field.value]
                            })
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor={id}
                      style={{ cursor: (!availableField && sortFilterLocked) || disabled ? 'not-allowed' : 'pointer' }}
                    >
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

interface UnitsHeaderProps {
  availableFilterFields: FILTER_FIELD[]
  availableFiltersExpanded: boolean
  availableNameFilter: string
  availableSortField: SORT_FIELD
  availableSortOrder: SORT_ORDER
  disabled: boolean
  faction: FactionFragmentFragment | undefined
  isAvailable: boolean
  selectedFilterFields: FILTER_FIELD[]
  selectedFiltersExpanded: boolean
  selectedNameFilter: string
  selectedSortField: SORT_FIELD
  selectedSortOrder: SORT_ORDER
  setAvailableFilterFields: Dispatch<SetStateAction<FILTER_FIELD[]>>
  setAvailableFiltersExpanded: Dispatch<SetStateAction<boolean>>
  setAvailableNameFilter: Dispatch<SetStateAction<string>>
  setAvailableSortField: Dispatch<SetStateAction<SORT_FIELD>>
  setAvailableSortOrder: Dispatch<SetStateAction<SORT_ORDER>>
  setSelectedNameFilter: Dispatch<SetStateAction<string>>
  setSelectedFilterFields: Dispatch<SetStateAction<FILTER_FIELD[]>>
  setSelectedFiltersExpanded: Dispatch<SetStateAction<boolean>>
  setSelectedSortField: Dispatch<SetStateAction<SORT_FIELD>>
  setSelectedSortOrder: Dispatch<SetStateAction<SORT_ORDER>>
  sortFilterLocked: boolean
}
