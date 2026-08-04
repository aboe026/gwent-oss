import { CgArrowDown, CgArrowUp, CgClose, CgEye, CgEyeAlt } from 'react-icons/cg'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { IconBaseProps } from 'react-icons'

import Centered from '../../components/Centered'
import {
  Combat,
  DeckUnitFragment,
  DeckUnitFragmentDoc,
  EffectKey,
  GameDeckFragmentDoc,
  GamePlayerFragment,
  GameStatus,
  FragmentType,
  UnitEffectFragmentDoc,
  UnitFragmentDoc,
  useFragment,
} from '@gwent-oss/graphql-schema/apollo-typings'
import {
  FILTERS,
  FILTER_FIELD,
  FILTER_GROUP,
  FilterField,
  SORT_FIELD,
  SORT_ORDER,
} from '@gwent-oss/graphql-schema/game-units-filter'
import { FullUnitCards, GameDeckCardType, UnitForPlayer } from './GameProps'
import getEnumFromString from '../../util/get-faction-key-from-string'
import { HTML_CLASSES, HTML_IDS } from '@gwent-oss/constants'
import { sortObjectArray, toTitleCase } from '@gwent-oss/utils'
import UnitFilters from '../../components/UnitFilters'
import UnitGameCard from '../../components/UnitGameCard'
import { usePrevious } from '../../util/usePrevious'
import './GameHand.css'

/**
 * The Users hand of unit cards for the Game.
 */
export default function GameHand({
  cardSelected,
  deckCardsViewing,
  deckSettingsOpen,
  gameStatus,
  gameDeckFragment,
  isTurn,
  playUnitLoading,
  redrawsLeft,
  selectedCardInHand,
  setDeckSettingsOpen,
  self,
  setCardSelected,
  setFullUnits,
}: {
  cardSelected: UnitForPlayer | undefined
  deckCardsViewing: GameDeckCardType
  deckSettingsOpen: boolean
  gameStatus: GameStatus
  gameDeckFragment: FragmentType<typeof GameDeckFragmentDoc> | null | undefined
  isTurn: boolean
  playUnitLoading: boolean
  redrawsLeft: number
  selectedCardInHand: boolean
  self: GamePlayerFragment
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setDeckSettingsOpen: Dispatch<SetStateAction<boolean>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
}) {
  const [filterFieldsSelected, setFilterFieldsSelected] = useState<FILTER_FIELD[]>([])
  const [filterName, setFilterName] = useState('')
  const [filterFieldsReversed, setFilterFieldsReversed] = useState(false)
  const [sortField, setSortField] = useState<SORT_FIELD>(SORT_FIELD.Strength)
  const [sortOrder, setSortOrder] = useState<SORT_ORDER>(SORT_ORDER.Asc)
  const gameDeck = useFragment(GameDeckFragmentDoc, gameDeckFragment)
  const deckCards =
    deckCardsViewing === GameDeckCardType.Hand
      ? gameDeck?.hand
      : deckCardsViewing === GameDeckCardType.Lost
        ? gameDeck?.discard
        : gameDeck?.undrawn
  const cards = useFragment(DeckUnitFragmentDoc, deckCards)
  const filtersActive = filterFieldsSelected.length + (filterName ? 1 : 0)
  const shouldReverseFields = filterFieldsReversed && filtersActive > 0
  const filteredCards = (cards || []).filter((card) =>
    isFilteredIn({
      deckUnit: card,
      fieldsSelected: filterFieldsSelected,
      name: filterName,
      reverse: shouldReverseFields,
    })
  )
  let sortFields: string[] = ['unit.strength', 'unit.name']
  if (sortField === SORT_FIELD.Name) {
    sortFields = sortFields.reverse()
  }
  sortFields.push('unit.id')
  const sortedUnits = sortObjectArray({
    sortProperties: sortFields,
    array: filteredCards,
    reverse: sortOrder === SORT_ORDER.Desc,
  })
  let noneMessage: string
  if (deckCardsViewing === GameDeckCardType.Hand) {
    noneMessage = 'You have no units left in your hand. Either activate your Leader ability or Pass.'
  } else if (deckCardsViewing === GameDeckCardType.Lost) {
    noneMessage = 'You have no lost units yet. When units leave the battlefield they will show up here.'
  } else {
    noneMessage = 'You have no units left to draw.'
  }
  const eyeIconProps: IconBaseProps = {
    color: deckSettingsOpen ? 'black' : 'gray',
    className: 'pointable',
    onClick: () => setDeckSettingsOpen(!deckSettingsOpen),
    title: deckSettingsOpen ? 'Hide Settings' : 'View Settings',
  }

  const previousSelf = usePrevious(self)
  useEffect(() => {
    if (self.reviving && !previousSelf?.reviving) {
      setFilterFieldsSelected([FILTER_FIELD.Hero, FILTER_FIELD.Special])
      setFilterFieldsReversed(true)
      setFilterName('')
    } else if (!self.reviving && previousSelf?.reviving) {
      setFilterFieldsSelected([])
      setFilterFieldsReversed(false)
      setFilterName('')
    }
  }, [self])

  return (
    <div id="gameHandContainer">
      {cards && deckSettingsOpen && (
        <div id="gameDeckSettings">
          <UnitFilters
            availableField={true}
            disabled={playUnitLoading}
            fields={Object.values(FILTERS)}
            filterFieldsSelected={filterFieldsSelected}
            setSelectedFilterFields={setFilterFieldsSelected}
            setAvailableFilterFields={setFilterFieldsSelected}
            sortFilterLocked={false}
            className="game-deck-filters"
          />
          <div id="gameDeckSettingsOther">
            <div>
              <input
                type="search"
                id="gameDeckFilterName"
                name="gameDeckFilterName"
                value={filterName}
                placeholder="Filter by name"
                style={{ cursor: playUnitLoading ? 'not-allowed' : 'pointer' }}
                disabled={playUnitLoading}
                onChange={(event) => (playUnitLoading ? undefined : setFilterName(event.target.value))}
              />
              <div id="gameDeckSettingsFilterReverse">
                <label
                  htmlFor={'gameDeckFilterFieldsReverse'}
                  style={{ cursor: playUnitLoading ? 'not-allowed' : 'pointer' }}
                >
                  Reverse Filters
                </label>
                <input
                  type="checkbox"
                  id="gameDeckFilterFieldsReverse"
                  name="gameDeckFilterFieldsReverse"
                  checked={filterFieldsReversed}
                  disabled={playUnitLoading}
                  style={{ cursor: playUnitLoading ? 'not-allowed' : 'pointer' }}
                  className="units-header-filter-checkbox"
                  onChange={() => {
                    if (playUnitLoading) return

                    setFilterFieldsReversed(!filterFieldsReversed)
                  }}
                />
              </div>
            </div>
            <div id="gameDeckSettingsSort">
              <div>Sort: </div>
              <select
                id="gameDeckSortField"
                title="Sort Field"
                name="gameDeckSortField"
                value={sortField}
                disabled={playUnitLoading}
                style={{ cursor: playUnitLoading ? 'not-allowed' : 'pointer' }}
                onChange={(event) => (playUnitLoading ? undefined : setSortField(event.target.value as SORT_FIELD))}
              >
                <option value={SORT_FIELD.Name}>Name</option>
                <option value={SORT_FIELD.Strength}>Strength</option>
              </select>
              <div
                id="gameDeckSortOrder"
                className="units-header-sort-order"
                style={{ cursor: playUnitLoading ? 'not-allowed' : 'pointer' }}
                title="Sort Order"
                onClick={() => setSortOrder(sortOrder === SORT_ORDER.Asc ? SORT_ORDER.Desc : SORT_ORDER.Asc)}
              >
                {sortOrder === SORT_ORDER.Asc ? <CgArrowDown color="black" /> : <CgArrowUp color="black" />}
              </div>
            </div>
          </div>
        </div>
      )}
      <div
        id="gameHandAndSettingsOpener"
        className={`game-hand-and-deck-settings-${deckSettingsOpen ? 'open' : 'closed'}`}
      >
        <div id={HTML_IDS.GameHand}>
          {!cards && !isTurn ? (
            <Centered>
              <img src="images/stats/units.png" title="Hand" className={HTML_CLASSES.GameHandIcon} />
            </Centered>
          ) : !cards || cards.length === 0 ? (
            <Centered>
              <span id={HTML_IDS.gameHandNoUnitsLeft}>{noneMessage}</span>
            </Centered>
          ) : sortedUnits.length === 0 && filtersActive > 0 ? (
            <Centered id="noUnitsMatchFilter">
              <span>{`No units in ${toTitleCase(deckCardsViewing)} pile match applied filters`}</span>
              <button
                className={HTML_CLASSES.ActionsPrimary}
                type="button"
                disabled={playUnitLoading}
                autoFocus
                onClick={() => {
                  setFilterFieldsSelected([])
                  setFilterName('')
                  setFilterFieldsReversed(false)
                }}
              >
                Clear Filters
              </button>
            </Centered>
          ) : (
            sortedUnits.map((deckUnit, index) => (
              <GameHandUnit
                cardSelected={cardSelected}
                deckUnit={deckUnit}
                gameStatus={gameStatus}
                playUnitLoading={playUnitLoading}
                redrawsLeft={redrawsLeft}
                isTurn={isTurn}
                key={index}
                index={index}
                selectedCardInHand={selectedCardInHand}
                self={self}
                setCardSelected={setCardSelected}
                setFullUnits={setFullUnits}
                sortedUnits={sortedUnits}
              />
            ))
          )}
        </div>
        {cards && (
          <div
            id="gameDeckSettingsOpener"
            className={`game-deck-settings-opener-${filtersActive === 0 ? 'closed' : 'open'}`}
            style={{ cursor: filtersActive === 0 ? 'pointer' : 'default' }}
            onClick={() => (filtersActive === 0 ? setDeckSettingsOpen(!deckSettingsOpen) : undefined)}
          >
            {deckSettingsOpen ? <CgEyeAlt {...eyeIconProps} /> : <CgEye {...eyeIconProps} />}
            {filtersActive > 0 && (
              <>
                <div title="Filters Active">
                  {filtersActive}/{Object.values(FILTER_FIELD).length + 1}
                </div>
                <CgClose
                  color={'black'}
                  className="pointable"
                  title="Clear Filters"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setFilterFieldsSelected([])
                    setFilterName('')
                    setFilterFieldsReversed(false)
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * A unit in a players game hand.
 */
function GameHandUnit({
  cardSelected,
  deckUnit,
  gameStatus,
  isTurn,
  index,
  playUnitLoading,
  redrawsLeft,
  selectedCardInHand,
  self,
  setCardSelected,
  setFullUnits,
  sortedUnits,
}: {
  cardSelected: UnitForPlayer | undefined
  deckUnit: DeckUnitFragment
  gameStatus: GameStatus
  isTurn: boolean
  index: number
  playUnitLoading: boolean
  redrawsLeft: number
  selectedCardInHand: boolean
  self: GamePlayerFragment
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  sortedUnits: DeckUnitFragment[]
}) {
  const unit = useFragment(UnitFragmentDoc, deckUnit.unit)
  const cardSelectedUnit = useFragment(UnitFragmentDoc, cardSelected?.unitFragment.unit)
  const selected = cardSelectedUnit?.id === unit.id && cardSelected?.playerName === self.user.name
  const notSelected = cardSelectedUnit?.id && !selected && selectedCardInHand
  const title = unit.name
  let dottedTitle = ''
  let cursor = 'pointer'
  const noMoreRedraws = gameStatus === GameStatus.Redrawing && redrawsLeft === 0
  if (playUnitLoading && cardSelectedUnit) {
    if (cardSelectedUnit?.id === unit.id) {
      dottedTitle = `Waiting for ${cardSelectedUnit.name} to be deployed to the battlefield`
    } else {
      dottedTitle = `Cannot select other units while waiting for ${cardSelectedUnit.name} to be deployed`
      cursor = 'not-allowed'
    }
  } else if (selected && noMoreRedraws) {
    dottedTitle = 'No more redraws left'
  }
  const dotted = (gameStatus === GameStatus.Playing && !isTurn) || noMoreRedraws

  return (
    <div
      className={`${HTML_CLASSES.GameHandCardWrapper} ${selected ? 'game-hand-card-wrapper-selected' : ''}`}
      key={unit.id}
      onClick={() => {
        if (!playUnitLoading) {
          setCardSelected(
            selected
              ? undefined
              : {
                  unitFragment: deckUnit,
                  playerName: self.user.name,
                }
          )
        }
      }}
    >
      <UnitGameCard
        cursor={cursor}
        deckUnit={deckUnit}
        selected={selected}
        dotted={dotted}
        dottedTitle={dottedTitle}
        title={title}
        onFullscreen={() => {
          setFullUnits({
            currentIndex: index,
            units: sortedUnits.map((deckUnit) => {
              return {
                playerName: self.user.name,
                unitFragment: deckUnit,
              }
            }),
          })
          setCardSelected({
            unitFragment: deckUnit,
            playerName: self.user.name,
          })
        }}
      />
      {notSelected && <div title={title} className={HTML_CLASSES.GameHandCardWrapperNotSelected}></div>}
    </div>
  )
}

/**
 * Whether or not the given DeckUnit should be shown.
 *
 * @param config The configuration used to determin if the DeckUnit should be shown or not.
 * @param config.deckUnit The DeckUnit under consideration of whether or not it should be shown.
 * @param config.fieldsSelected The fields the user is currently filtering on.
 * @param config.name The Unit name the user is currently filtering on. Matches substrings.
 * @param config.reverse Whether or not the filter results should be reversed.
 * @returns True if the DeckUnit should be shown, false if not.
 */
function isFilteredIn({
  deckUnit,
  fieldsSelected,
  name,
  reverse,
}: {
  deckUnit: DeckUnitFragment
  fieldsSelected: FILTER_FIELD[]
  name: string
  reverse?: boolean
}): boolean {
  const unit = useFragment(UnitFragmentDoc, deckUnit.unit)
  const selected: FilterField[] = []
  for (const field of fieldsSelected) {
    if (FILTERS[field]) {
      selected.push(FILTERS[field])
    }
  }
  const combatFilters = selected.filter((field) => field.group === FILTER_GROUP.Combat)
  const effectFilters = selected.filter((field) => field.group === FILTER_GROUP.Effect)
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
  const otherIncluded =
    otherFilters.length === 0 ||
    otherFilters.some(
      (filter) =>
        (filter.value === FILTER_FIELD.Hero && unit.hero) || (filter.value === FILTER_FIELD.Special && unit.special)
    )
  const nameIncluded = !name || unit.name.toLowerCase().includes(name.toLowerCase())

  const shouldBeIncluded = combatIncluded && effectIncluded && otherIncluded && nameIncluded
  return reverse ? !shouldBeIncluded : shouldBeIncluded
}
