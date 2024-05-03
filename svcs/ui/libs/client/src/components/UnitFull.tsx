import { CgChevronLeft, CgChevronRight } from 'react-icons/cg'
import { Dispatch, SetStateAction } from 'react'

import { DeckUnit } from '@gwent/graphql-schema/resolver-typings'
import { Key, useKeyDown } from '../util/keyboard-listener'
import WholeScreenDialog from './WholeScreenDialog'
import './UnitFull.css'

/**
 * A full page view of a Deck Unit
 *
 * @returns The full page Unit
 */
export default function UnitFull({
  fullUnit,
  setFullUnit,
  filteredAvailableUnits,
  filteredSelectedUnits,
  selectedIds,
  setSelectedUnits,
  setUnits,
  disabled,
}: FullUnitProps) {
  let fullUnitPosition = -1
  let nextUnit: DeckUnit | undefined
  let previousUnit: DeckUnit | undefined
  if (fullUnit) {
    if (selectedIds.includes(fullUnit.unit.id)) {
      fullUnitPosition = filteredSelectedUnits.findIndex((deckUnit) => deckUnit.unit.id === fullUnit.unit.id)
      nextUnit = filteredSelectedUnits[fullUnitPosition + 1]
      previousUnit = filteredSelectedUnits[fullUnitPosition - 1]
    } else {
      fullUnitPosition = filteredAvailableUnits.findIndex((deckUnit) => deckUnit.unit.id === fullUnit.unit.id)
      nextUnit = filteredAvailableUnits[fullUnitPosition + 1]
      previousUnit = filteredAvailableUnits[fullUnitPosition - 1]
    }
  }
  const selectFullUnit = () => {
    if (fullUnit) {
      setSelectedUnits((previous) =>
        previous.map((deckUnit) => deckUnit.unit.id).includes(fullUnit.unit.id)
          ? previous.filter((deckUnit) => deckUnit.unit.id !== fullUnit.unit.id)
          : [...previous, fullUnit]
      )
    }
    if (nextUnit) {
      setFullUnit(nextUnit)
    } else if (previousUnit) {
      setFullUnit(previousUnit)
    } else {
      setFullUnit(undefined)
    }
  }
  function changeArtStyle(change: number) {
    setUnits((previous: DeckUnit[]) =>
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
  function incrementArtStyle() {
    if (!disabled && fullUnit && fullUnit.artStyle && fullUnit.artStyle < fullUnit.unit.images.length) {
      changeArtStyle(1)
    }
  }
  function decrementArtStyle() {
    if (!disabled && fullUnit && fullUnit.artStyle && fullUnit.artStyle > 1) {
      changeArtStyle(-1)
    }
  }
  useKeyDown([
    {
      key: Key.Left,
      condition: () => fullUnit !== undefined && previousUnit !== undefined,
      onCondition: () => setFullUnit(previousUnit),
    },
    {
      key: Key.Left,
      ctrl: true,
      condition: () => fullUnit !== undefined && fullUnit.unit.images.length > 0,
      onCondition: decrementArtStyle,
    },
    {
      key: Key.Right,
      condition: () => fullUnit !== undefined && nextUnit !== undefined,
      onCondition: () => setFullUnit(nextUnit),
    },
    {
      key: Key.Right,
      ctrl: true,
      condition: () => fullUnit !== undefined && fullUnit.unit.images.length > 0,
      onCondition: incrementArtStyle,
    },
    {
      key: Key.Escape,
      condition: () => fullUnit !== undefined,
      onCondition: () => setFullUnit(undefined),
    },
    {
      key: Key.Enter,
      condition: () => fullUnit !== undefined,
      onCondition: selectFullUnit,
    },
  ])

  if (fullUnit) {
    return (
      <WholeScreenDialog onClose={() => setFullUnit(undefined)}>
        <div id="fullUnitWrapper">
          <div
            className={`full-unit-arrow-container ${previousUnit ? 'full-unit-arrow-container-selectable' : ''}`}
            onClick={() => previousUnit && setFullUnit(previousUnit)}
          >
            {previousUnit && <CgChevronLeft color="black" size="2em" />}
          </div>
          <div id="fullUnitBackground">
            <div id="fullUnitContainer">
              <div id="fullUnitUpper">
                <img
                  id="fullUnitImage"
                  src={fullUnit.unit.images[(fullUnit.artStyle || 1) - 1]}
                  style={{
                    marginTop: fullUnit.unit.hero ? '-210px' : '-190px',
                    marginLeft: fullUnit.unit.hero ? '-20px' : '0',
                    width: fullUnit.unit.hero ? '390px' : '370px',
                  }}
                  onClick={selectFullUnit}
                />
              </div>
              <div id="fullUnitLower">
                <div id="fullUnitInfo">
                  <div id="fullUnitInfoUpper">
                    {fullUnit.artStyle && fullUnit.unit.images.length > 1 && (
                      <div
                        className={`icon-container full-unit-art-switcher ${fullUnit.artStyle > 1 ? 'pointable' : ''}`}
                        style={{
                          width: fullUnit.unit.dlc ? '36px' : '32px',
                        }}
                        onClick={decrementArtStyle}
                      >
                        {fullUnit.artStyle > 1 && (
                          <CgChevronLeft
                            className="full-unit-art-switcher-arrow"
                            style={{
                              marginLeft: fullUnit.unit.dlc ? '0' : '2px',
                              marginRight: fullUnit.unit.dlc ? '2px' : '0',
                            }}
                            size="1.5em"
                          />
                        )}
                      </div>
                    )}
                    <div id="fullUnitInfoDlcName">
                      {fullUnit.unit.dlc && (
                        <div
                          className="full-unit-dlc"
                          title={fullUnit.unit.dlc.name}
                          style={{ backgroundImage: `url(${fullUnit.unit.dlc.image})` }}
                        ></div>
                      )}
                      <span id="fullUnitName" style={{ marginTop: fullUnit.unit.dlc ? '0' : '10px' }}>
                        {fullUnit.unit.name}
                      </span>
                    </div>
                    {fullUnit.artStyle && fullUnit.unit.images.length > 1 && (
                      <div
                        className={`icon-container full-unit-art-switcher ${
                          fullUnit.artStyle < fullUnit.unit.images.length ? 'pointable' : ''
                        }`}
                        style={{
                          width: fullUnit.unit.dlc ? '36px' : '32px',
                        }}
                        onClick={incrementArtStyle}
                      >
                        {fullUnit.artStyle < fullUnit.unit.images.length && (
                          <CgChevronRight
                            className="full-unit-art-switcher-arrow"
                            style={{
                              marginLeft: fullUnit.unit.dlc ? '0' : '2px',
                              marginRight: fullUnit.unit.dlc ? '2px' : '0',
                            }}
                            size="1.5em"
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <span id="fullUnitQuote">{fullUnit.unit.quote}</span>
                  <div id="fullUnitEffects">
                    {fullUnit.unit.effects && (
                      <table>
                        <tbody>
                          {fullUnit.unit.effects.map((effect) => (
                            <tr key={effect.key}>
                              <td className="full-unit-effect-name">{effect.name}</td>
                              <td className="full-unit-effect-ability">{effect.ability}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`full-unit-arrow-container ${nextUnit ? 'full-unit-arrow-container-selectable' : ''}`}
            onClick={() => nextUnit && setFullUnit(nextUnit)}
          >
            {nextUnit && <CgChevronRight color="black" size="2em" />}
          </div>
        </div>
      </WholeScreenDialog>
    )
  }
}

interface FullUnitProps {
  setFullUnit: Dispatch<SetStateAction<DeckUnit | undefined>>
  fullUnit: DeckUnit | undefined
  selectedIds: string[]
  filteredSelectedUnits: DeckUnit[]
  filteredAvailableUnits: DeckUnit[]
  setSelectedUnits: Dispatch<SetStateAction<DeckUnit[]>>
  setUnits: Dispatch<SetStateAction<DeckUnit[]>>
  disabled: boolean
}
