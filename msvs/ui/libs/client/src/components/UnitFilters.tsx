import { Dispatch, SetStateAction } from 'react'

/**
 * The checkboxes a user can toggle to filter which Units are displayed.
 */
export default function UnitFilters<FIELD extends string | number, GROUP extends string | number>({
  fields,
  filterFieldsSelected,
  availableField,
  setAvailableFilterFields,
  setSelectedFilterFields,
  sortFilterLocked,
  disabled,
  className,
}: UnitFiltersProps<FIELD, GROUP>) {
  const groups = Array.from(new Set(fields.map((f) => f.group)))

  return (
    <div className={`units-header-filter-values ${className ? className : ''}`}>
      {groups.map((group) => (
        <div key={String(group)} className="units-header-filter-group-container">
          <span className="units-header-filter-group-name">{String(group)}</span>

          <div
            className={
              String(group) === 'Effect' ? 'units-header-filter-group-effects' : 'units-header-filter-group-values'
            }
          >
            {fields
              .filter((field) => field.group === group)
              .map((field) => {
                const id = `filter${availableField ? 'Available' : 'Selected'}${field.value}`

                const isDisabled = (!availableField && sortFilterLocked) || disabled

                return (
                  <div
                    key={id}
                    className={String(group) === 'Effect' ? '' : 'units-header-filter-group-small'}
                    title={field.title || field.label}
                  >
                    <input
                      type="checkbox"
                      id={id}
                      name={id}
                      checked={filterFieldsSelected.includes(field.value)}
                      disabled={isDisabled}
                      style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                      className="units-header-filter-checkbox"
                      onChange={() => {
                        if (disabled) return

                        if (availableField) {
                          setAvailableFilterFields((prev) =>
                            prev.includes(field.value) ? prev.filter((v) => v !== field.value) : [...prev, field.value]
                          )
                        }

                        if (!availableField || sortFilterLocked) {
                          setSelectedFilterFields((prev) =>
                            prev.includes(field.value) ? prev.filter((v) => v !== field.value) : [...prev, field.value]
                          )
                        }
                      }}
                    />

                    <label htmlFor={id} style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
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

export interface GenericFilterField<FIELD, GROUP> {
  label: string
  value: FIELD
  group: GROUP
  title?: string
}

interface UnitFiltersProps<FIELD extends string | number, GROUP extends string | number> {
  fields: GenericFilterField<FIELD, GROUP>[]
  filterFieldsSelected: FIELD[]
  availableField: boolean
  setAvailableFilterFields: Dispatch<SetStateAction<FIELD[]>>
  setSelectedFilterFields: Dispatch<SetStateAction<FIELD[]>>
  sortFilterLocked: boolean
  disabled: boolean
  className?: string
}
