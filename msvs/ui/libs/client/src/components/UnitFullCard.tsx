import { CgChevronLeft, CgChevronRight } from 'react-icons/cg'

import CloseButton from './CloseButton'
import { DeckUnit, EffectKey, FactionKey, GameUnit, GameUnitEffect } from '@gwent/graphql-schema/resolver-typings'
import { getCombatImage, getWeatherImage, toTitleCase } from '@gwent/utils'
import { HTML_CLASSES, HTML_IDS, DECK_MAX_SPECIALS } from '@gwent/constants'
import { Key, useKeyDown } from '../util/keyboard-listener'
import StrengthCircle from './StrengthCircle'
import WholeScreenDialog from './WholeScreenDialog'
import './UnitFullCard.css'

/**
 * A full page view of a Deck Unit
 *
 * @returns The full page Unit
 */
export default function UnitFullCard({
  effectiveStrength,
  effects,
  fullUnit,
  hasNext,
  hasPrevious,
  onArtDecrement,
  onArtIncrement,
  onClose,
  onNext,
  onPrevious,
  onSelect,
  userName,
}: UnitFullCardProps) {
  useKeyDown([
    {
      key: Key.Left,
      condition: () => fullUnit !== undefined,
      onCondition: () => onPrevious(fullUnit),
    },
    {
      key: Key.Left,
      ctrl: true,
      condition: () => fullUnit !== undefined && fullUnit.unit.images.length > 0,
      onCondition: () => onArtDecrement && onArtDecrement(fullUnit),
    },
    {
      key: Key.Right,
      condition: () => fullUnit !== undefined,
      onCondition: () => onNext(fullUnit),
    },
    {
      key: Key.Right,
      ctrl: true,
      condition: () => fullUnit !== undefined && fullUnit.unit.images.length > 0,
      onCondition: () => onArtIncrement && onArtIncrement(fullUnit),
    },
    {
      key: Key.Escape,
      condition: () => fullUnit !== undefined,
      onCondition: () => onClose(fullUnit),
    },
    {
      key: Key.Enter,
      condition: () => fullUnit !== undefined,
      onCondition: () => onSelect(fullUnit),
    },
  ])

  if (fullUnit) {
    const combatSymbol = getCombatImage(fullUnit)
    const combatTitle = fullUnit.unit.combats
      ? fullUnit.unit.combats.map((combat) => toTitleCase(combat)).join(' or ')
      : ''
    const combatDescription = `Can be placed in the ${combatTitle} combat row${
      fullUnit.unit.combats && fullUnit.unit.combats.length > 1 ? 's' : ''
    }.`
    return (
      <WholeScreenDialog onClose={() => onClose(fullUnit)}>
        <div id={HTML_IDS.UnitFullCardContainer}>
          <div id="unitFullCardDialog">
            <div
              id={HTML_IDS.UnitFullCardPrevious}
              className={`unit-full-card-arrow-container ${
                hasPrevious ? 'unit-full-card-arrow-selectable-container' : ''
              }`}
              onClick={() => hasPrevious && onPrevious(fullUnit)}
              title="Previous Unit"
            >
              {hasPrevious && <CgChevronLeft color="black" size="2em" />}
            </div>
            <div id="unitFullCardContentWrapper">
              <div id="unitFullCardContents">
                <img
                  id={HTML_IDS.UnitFullCardImage}
                  src={fullUnit.unit.images[(fullUnit.artStyle || 1) - 1]}
                  className={fullUnit.unit.hero ? 'full-unit-hero' : ''}
                  onClick={() => onSelect(fullUnit)}
                />
                <div id="unitFullCardInfo">
                  {userName && <div id={HTML_IDS.UnitFullCardUsername}>{userName}</div>}
                  <div id="unitFullCardUpper">
                    <span id={HTML_IDS.UnitFullCardName}>{fullUnit.unit.name}</span>
                    <span id={HTML_IDS.UnitFullCardQuote}>{fullUnit.unit.quote}</span>
                    <div className={HTML_CLASSES.UnitFullCardInfoRow}>
                      <div className="unit-full-card-info-image-container">
                        <img
                          className="unit-full-card-info-image"
                          src={fullUnit.unit.faction.image}
                          title={fullUnit.unit.faction.name}
                        />
                      </div>
                      <span id={HTML_IDS.UnitFullCardFaction}>{`A member of the ${fullUnit.unit.faction.name} faction${
                        fullUnit.unit.faction.key === FactionKey.Neutral
                          ? ', which can be added to the deck of any faction.'
                          : '.'
                      }`}</span>
                    </div>
                    {fullUnit.unit.strength !== undefined && fullUnit.unit.strength !== null && (
                      <div className={`${HTML_CLASSES.UnitFullCardInfoRow} unit-full-card-info-row-strength`}>
                        <div className={HTML_CLASSES.UnitFullCardInfoRow}>
                          <StrengthCircle
                            unit={fullUnit.unit}
                            effectiveStrength={effectiveStrength}
                            size="50px"
                            ignoreHero={true}
                            effectHighlight={true}
                          />
                          <span id={HTML_IDS.UnitFullCardStrength}>{`Provides a strength of ${
                            effectiveStrength || fullUnit.unit.strength
                          } to the row placed in.`}</span>
                        </div>
                        {effects && effects.length > 0 && (
                          <div className={HTML_CLASSES.UnitFullCardStrengthReasonContainer}>
                            <table>
                              <thead>
                                <tr>
                                  <th>Operator</th>
                                  <th>Strength</th>
                                  <th>Reason</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className={HTML_CLASSES.UnitFullCardStrengthReasonRow}>
                                  <td
                                    className={`${HTML_CLASSES.UnitFullCardStrengthReasonOperator} unit-full-card-info-strength-reason-number`}
                                  ></td>
                                  <td
                                    className={`${HTML_CLASSES.UnitFullCardStrengthReasonStrength} unit-full-card-info-strength-reason-number`}
                                  >
                                    {fullUnit.unit.strength}
                                  </td>
                                  <td className={HTML_CLASSES.UnitFullCardStrengthReasonExplanation}>Base strength</td>
                                </tr>
                                {effects.map((effect, index) => {
                                  let reason = ''
                                  if (effect.reason.__typename === 'EffectFromUnit') {
                                    reason = `${effect.reason.effect.name} from ${effect.reason.unit.name}`
                                  } else if (effect.reason.__typename === 'EffectFromLeader') {
                                    reason = `Ability from ${effect.reason.leader.name}`
                                  }
                                  return (
                                    <tr key={index} className={HTML_CLASSES.UnitFullCardStrengthReasonRow}>
                                      <td
                                        className={`${HTML_CLASSES.UnitFullCardStrengthReasonOperator} unit-full-card-info-strength-reason-number`}
                                      >
                                        {effect.operator}
                                      </td>
                                      <td
                                        className={`${HTML_CLASSES.UnitFullCardStrengthReasonStrength} unit-full-card-info-strength-reason-number`}
                                      >
                                        {effect.total}
                                      </td>
                                      <td className={HTML_CLASSES.UnitFullCardStrengthReasonExplanation}>{reason}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                    {combatSymbol && (
                      <div className={HTML_CLASSES.UnitFullCardInfoRow}>
                        <div className="unit-full-card-info-image-container">
                          <img className="unit-full-card-info-image" src={combatSymbol} title={combatTitle} />
                        </div>
                        <span id={HTML_IDS.UnitFullCardCombat}>{combatDescription}</span>
                      </div>
                    )}
                    {fullUnit.unit.hero && (
                      <div className={HTML_CLASSES.UnitFullCardInfoRow}>
                        <div className="unit-full-card-info-image-container">
                          <img className="unit-full-card-info-image" src="images/stats/hero.png" title="Hero" />
                        </div>
                        <span id={HTML_IDS.UnitFullCardHero}>Not affected by any special cards or abilities.</span>
                      </div>
                    )}
                    {fullUnit.unit.effects && fullUnit.unit.effects?.length > 0 && (
                      <div id={HTML_IDS.UnitFullCardEffects}>
                        {fullUnit.unit.effects.map((effect) => (
                          <div
                            id={`fullUnitEffect${toTitleCase(effect.key)}`}
                            className={HTML_CLASSES.UnitFullCardInfoRow}
                            key={effect.key}
                          >
                            <div className="unit-full-card-info-image-container">
                              <img
                                className="unit-full-card-info-image"
                                src={effect.key === EffectKey.Weather ? getWeatherImage(fullUnit.unit) : effect.image}
                                title={effect.name}
                              />
                            </div>
                            <div className={HTML_CLASSES.UnitFullCardEffectAbility}>{effect.ability}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {fullUnit.unit.special && (
                      <div className={HTML_CLASSES.UnitFullCardInfoRow}>
                        <div className="unit-full-card-info-image-container">
                          <img
                            className="unit-full-card-info-image unit-full-card-info-image-special"
                            src="images/stats/special.png"
                            title="Special"
                          />
                        </div>
                        <span
                          id={HTML_IDS.UnitFullCardSpecial}
                        >{`Counts towards the special limit of ${DECK_MAX_SPECIALS} per deck.`}</span>
                      </div>
                    )}
                    {fullUnit.unit.dlc && (
                      <div className={HTML_CLASSES.UnitFullCardInfoRow}>
                        <img
                          className="unit-full-card-info-image unit-full-card-info-image-dlc"
                          src={fullUnit.unit.dlc.image}
                          title={fullUnit.unit.dlc.name}
                        />
                        <span id={HTML_IDS.UnitFullCardDlc}>{`Introduced in the ${fullUnit.unit.dlc.name} DLC.`}</span>
                      </div>
                    )}
                  </div>

                  {fullUnit.artStyle && fullUnit.unit.images.length > 1 && (
                    <div id="unitFullCardArtSwitcher">
                      {onArtDecrement && (
                        <div
                          id={HTML_IDS.UnitFullCardArtPrevious}
                          className={`icon-container unit-full-card-art-switcher ${
                            fullUnit.artStyle > 1 ? 'pointable' : ''
                          }`}
                          onClick={() => onArtDecrement(fullUnit)}
                          title="Previous Art Style"
                        >
                          {fullUnit.artStyle > 1 && (
                            <CgChevronLeft className="unit-full-card-art-switcher-arrow" size="1.5em" />
                          )}
                        </div>
                      )}
                      <span
                        id={HTML_IDS.UnitFullCardArt}
                      >{`Art style: ${fullUnit.artStyle}/${fullUnit.unit.images.length}`}</span>
                      {onArtIncrement && (
                        <div
                          id={HTML_IDS.UnitFullCardArtNext}
                          className={`icon-container unit-full-card-art-switcher ${
                            fullUnit.artStyle < fullUnit.unit.images.length ? 'pointable' : ''
                          }`}
                          onClick={() => onArtIncrement(fullUnit)}
                          title="Next Art Style"
                        >
                          {fullUnit.artStyle < fullUnit.unit.images.length && (
                            <CgChevronRight className="unit-full-card-art-switcher-arrow" size="1.5em" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div id="unitFullCardRightContainer">
              <CloseButton id={HTML_IDS.UnitFullCardClose} onClose={() => onClose(fullUnit)} />
              <div
                id={HTML_IDS.UnitFullCardNext}
                className={`unit-full-card-arrow-container ${
                  hasNext ? 'unit-full-card-arrow-selectable-container' : ''
                }`}
                onClick={() => hasNext && onNext(fullUnit)}
                title="Next Unit"
              >
                {hasNext && <CgChevronRight color="black" size="2em" />}
              </div>
            </div>
          </div>
        </div>
      </WholeScreenDialog>
    )
  }
}

interface UnitFullCardProps {
  effectiveStrength?: number | null
  effects?: GameUnitEffect[] | null
  fullUnit: DeckUnit | GameUnit | undefined
  hasNext: boolean
  hasPrevious: boolean
  onArtDecrement?: (unit: DeckUnit | GameUnit | undefined) => any // eslint-disable-line @typescript-eslint/no-explicit-any
  onArtIncrement?: (unit: DeckUnit | GameUnit | undefined) => any // eslint-disable-line @typescript-eslint/no-explicit-any
  onClose: (unit: DeckUnit | GameUnit | undefined) => any // eslint-disable-line @typescript-eslint/no-explicit-any
  onNext: (unit: DeckUnit | GameUnit | undefined) => any // eslint-disable-line @typescript-eslint/no-explicit-any
  onPrevious: (unit: DeckUnit | GameUnit | undefined) => any // eslint-disable-line @typescript-eslint/no-explicit-any
  onSelect: (unit: DeckUnit | GameUnit | undefined) => any // eslint-disable-line @typescript-eslint/no-explicit-any
  userName?: string
}
