import { EffectKey, Unit } from '@gwent/graphql-schema/resolver-typings'
import { getWeatherImage } from '@gwent/utils'
import './StrengthCircle.css'

/**
 * A circle containing strength value or weather type
 *
 * @returns The strength circle
 */
export default function StrengthCircle({ size, unit, style, ignoreHero }: StrengthCircleProps) {
  const weatherEffect = unit.effects?.find((effect) => effect.key === EffectKey.Weather)
  const weatherTitle = weatherEffect?.ability || ''
  const weatherSymbol = getWeatherImage(unit)

  return (
    (unit.strength !== null || weatherSymbol) && (
      <div style={{ height: size, width: size, ...style }} className="strength-circle-container">
        {unit.strength !== null && (
          <>
            {unit.hero && !ignoreHero && (
              <img
                src="/images/card/hero.png"
                className="strength-circle-hero"
                title="Hero"
                style={{ height: `calc(${size} + 84%)` }}
              />
            )}
            <img src="images/card/strength.png" style={{ height: size, width: size }} />
            <span className="strength-circle-value" title="Strength">
              {unit.strength}
            </span>
          </>
        )}
        {weatherSymbol && <img src={weatherSymbol} style={{ height: size, width: size }} title={weatherTitle} />}
      </div>
    )
  )
}

interface StrengthCircleProps {
  unit: Unit
  size: string
  textColor?: string
  style?: React.CSSProperties
  ignoreHero?: boolean
}
