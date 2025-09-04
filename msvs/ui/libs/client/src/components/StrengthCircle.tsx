import { CardUnitFragmentFragment, EffectKey } from '@gwent/graphql-schema/apollo-typings'
import getWeatherImage from '../util/get-weather-image'
import { HTML_CLASSES } from '@gwent/constants'
import './StrengthCircle.css'

/**
 * A circle containing strength value or weather type
 *
 * @returns The strength circle
 */
export default function StrengthCircle({
  ignoreHero,
  size,
  style,
  unit,
  effectHighlight,
  effectiveStrength,
}: StrengthCircleProps) {
  const weatherEffect = unit.effects?.find((effect) => effect.key === EffectKey.Weather)
  const weatherTitle = weatherEffect?.ability || ''
  const weatherSymbol = getWeatherImage(unit)

  let strengthCircleContainerClassModifier = ''
  if (effectHighlight && effectiveStrength && unit.strength) {
    if (unit.hero) {
      strengthCircleContainerClassModifier = 'strength-circle-container-hero'
    } else if (effectiveStrength !== unit.strength) {
      strengthCircleContainerClassModifier = `strength-circle-container-${
        effectiveStrength > unit.strength ? 'greater' : 'less'
      }`
    }
  }
  return (
    (unit.strength !== null || weatherSymbol) && (
      <div style={{ height: size, width: size, ...style }} className="strength-circle-container-background">
        <div
          style={{ height: size, width: size, ...style }}
          className={`strength-circle-container ${strengthCircleContainerClassModifier}`}
        >
          {unit.strength !== null && (
            <>
              {unit.hero && !ignoreHero && (
                <img
                  src="/images/card/hero.png"
                  className="strength-circle-hero"
                  title="Hero"
                  style={{ height: `calc(${size} + 70%)` }}
                />
              )}
              <img src="images/card/strength.png" style={{ height: size, width: size }} />
              <span className={HTML_CLASSES.StrengthCircleValue} title="Strength">
                {effectiveStrength || unit.strength}
              </span>
            </>
          )}
          {weatherSymbol && <img src={weatherSymbol} style={{ height: size, width: size }} title={weatherTitle} />}
        </div>
      </div>
    )
  )
}

interface StrengthCircleProps {
  ignoreHero?: boolean
  effectiveStrength?: number | null
  effectHighlight?: boolean
  size: string
  style?: React.CSSProperties
  textColor?: string
  unit: CardUnitFragmentFragment
}
