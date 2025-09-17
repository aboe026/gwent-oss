import { CgChevronLeft, CgChevronRight } from 'react-icons/cg'

import CloseButton from './CloseButton'
import {
  UnitFragment,
  UnitFragmentDoc,
  DeckUnitFragment,
  EffectKey,
  FactionKey,
  FragmentType,
  GameUnitEffectFragmentDoc,
  GameUnitFragment,
  UnitEffectFragmentDoc,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import getCombatImage from '../util/get-combat-image'
import getWeatherImage from '../util/get-weather-image'
import { HTML_CLASSES, HTML_IDS, DECK_MAX_SPECIALS } from '@gwent/constants'
import { Key, useKeyDown } from '../util/keyboard-listener'
import StrengthCircle from './StrengthCircle'
import { toTitleCase } from '@gwent/utils'
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
  const unit = useFragment(UnitFragmentDoc, fullUnit?.unit)
  useKeyDown([
    {
      key: Key.Left,
      condition: () => fullUnit !== undefined,
      onCondition: () => onPrevious(fullUnit),
    },
    {
      key: Key.Left,
      ctrl: true,
      condition: () => unit !== undefined && unit.images.length > 0,
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
      condition: () => unit !== undefined && unit.images.length > 0,
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

  if (fullUnit && unit) {
    const combatSymbol = getCombatImage(fullUnit)
    const combatTitle = unit.combats ? unit.combats.map((combat) => toTitleCase(combat)).join(' or ') : ''
    const combatDescription = `Can be placed in the ${combatTitle} combat row${
      unit.combats && unit.combats.length > 1 ? 's' : ''
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
                  src={unit.images[(fullUnit.artStyle || 1) - 1]}
                  className={unit.hero ? 'full-unit-hero' : ''}
                  onClick={() => onSelect(fullUnit)}
                />
                <div id="unitFullCardInfo">
                  {userName && <div id={HTML_IDS.UnitFullCardUsername}>{userName}</div>}
                  <div id="unitFullCardUpper">
                    <span id={HTML_IDS.UnitFullCardName}>{unit.name}</span>
                    <span id={HTML_IDS.UnitFullCardQuote}>{unit.quote}</span>
                    <div className={HTML_CLASSES.UnitFullCardInfoRow}>
                      <div className="unit-full-card-info-image-container">
                        <img className="unit-full-card-info-image" src={unit.faction.image} title={unit.faction.name} />
                      </div>
                      <span id={HTML_IDS.UnitFullCardFaction}>{`A member of the ${unit.faction.name} faction${
                        unit.faction.key === FactionKey.Neutral
                          ? ', which can be added to the deck of any faction.'
                          : '.'
                      }`}</span>
                    </div>
                    {unit.strength !== undefined && unit.strength !== null && (
                      <div className={`${HTML_CLASSES.UnitFullCardInfoRow} unit-full-card-info-row-strength`}>
                        <div className={HTML_CLASSES.UnitFullCardInfoRow}>
                          <StrengthCircle
                            unit={useFragment(UnitFragmentDoc, fullUnit.unit)}
                            effectiveStrength={effectiveStrength}
                            size="50px"
                            ignoreHero={true}
                            effectHighlight={true}
                          />
                          <span id={HTML_IDS.UnitFullCardStrength}>{`Provides a strength of ${
                            effectiveStrength || unit.strength
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
                                    {unit.strength}
                                  </td>
                                  <td className={HTML_CLASSES.UnitFullCardStrengthReasonExplanation}>Base strength</td>
                                </tr>
                                {effects.map((effectFragment, index) => (
                                  <GameUnitEffect effectFragment={effectFragment} key={index} />
                                ))}
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
                    {unit.hero && (
                      <div className={HTML_CLASSES.UnitFullCardInfoRow}>
                        <div className="unit-full-card-info-image-container">
                          <img className="unit-full-card-info-image" src="images/stats/hero.png" title="Hero" />
                        </div>
                        <span id={HTML_IDS.UnitFullCardHero}>Not affected by any special cards or abilities.</span>
                      </div>
                    )}
                    {unit.effects && unit.effects?.length > 0 && (
                      <div id={HTML_IDS.UnitFullCardEffects}>
                        {unit.effects.map((effectFragment, index) => (
                          <UnitEffect effectFragment={effectFragment} unit={unit} key={index} />
                        ))}
                      </div>
                    )}
                    {unit.special && (
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
                    {unit.dlc && (
                      <div className={HTML_CLASSES.UnitFullCardInfoRow}>
                        <img
                          className="unit-full-card-info-image unit-full-card-info-image-dlc"
                          src={unit.dlc.image}
                          title={unit.dlc.name}
                        />
                        <span id={HTML_IDS.UnitFullCardDlc}>{`Introduced in the ${unit.dlc.name} DLC.`}</span>
                      </div>
                    )}
                  </div>

                  {fullUnit.artStyle && unit.images.length > 1 && (
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
                      >{`Art style: ${fullUnit.artStyle}/${unit.images.length}`}</span>
                      {onArtIncrement && (
                        <div
                          id={HTML_IDS.UnitFullCardArtNext}
                          className={`icon-container unit-full-card-art-switcher ${
                            fullUnit.artStyle < unit.images.length ? 'pointable' : ''
                          }`}
                          onClick={() => onArtIncrement(fullUnit)}
                          title="Next Art Style"
                        >
                          {fullUnit.artStyle < unit.images.length && (
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

function UnitEffect({
  effectFragment,
  unit,
}: {
  effectFragment: FragmentType<typeof UnitEffectFragmentDoc>
  unit: UnitFragment
}) {
  const effect = useFragment(UnitEffectFragmentDoc, effectFragment)
  return (
    <div id={`fullUnitEffect${toTitleCase(effect.key)}`} className={HTML_CLASSES.UnitFullCardInfoRow} key={effect.key}>
      <div className="unit-full-card-info-image-container">
        <img
          className="unit-full-card-info-image"
          src={effect.key === EffectKey.Weather ? getWeatherImage(unit) : effect.image}
          title={effect.name}
        />
      </div>
      <div className={HTML_CLASSES.UnitFullCardEffectAbility}>{effect.ability}</div>
    </div>
  )
}

function GameUnitEffect({ effectFragment }: { effectFragment: FragmentType<typeof GameUnitEffectFragmentDoc> }) {
  const effect = useFragment(GameUnitEffectFragmentDoc, effectFragment)
  let reason = ''
  if (effect.reason.__typename === 'EffectFromUnit') {
    reason = `${effect.reason.effect.name} from ${effect.reason.unit.name}`
  } else if (effect.reason.__typename === 'EffectFromLeader') {
    reason = `Ability from ${effect.reason.leader.name}`
  }
  return (
    <tr className={HTML_CLASSES.UnitFullCardStrengthReasonRow}>
      <td className={`${HTML_CLASSES.UnitFullCardStrengthReasonOperator} unit-full-card-info-strength-reason-number`}>
        {effect.operator}
      </td>
      <td className={`${HTML_CLASSES.UnitFullCardStrengthReasonStrength} unit-full-card-info-strength-reason-number`}>
        {effect.total}
      </td>
      <td className={HTML_CLASSES.UnitFullCardStrengthReasonExplanation}>{reason}</td>
    </tr>
  )
}

interface UnitFullCardProps {
  effectiveStrength?: number | null
  effects?: FragmentType<typeof GameUnitEffectFragmentDoc>[] | null
  fullUnit: DeckUnitFragment | GameUnitFragment | undefined
  hasNext: boolean
  hasPrevious: boolean
  onArtDecrement?: (unit: DeckUnitFragment | GameUnitFragment | undefined) => void
  onArtIncrement?: (unit: DeckUnitFragment | GameUnitFragment | undefined) => void
  onClose: (unit: DeckUnitFragment | GameUnitFragment | undefined) => void
  onNext: (unit: DeckUnitFragment | GameUnitFragment | undefined) => void
  onPrevious: (unit: DeckUnitFragment | GameUnitFragment | undefined) => void
  onSelect: (unit: DeckUnitFragment | GameUnitFragment | undefined) => void
  userName?: string
}
