import { EffectKey, Unit } from '@gwent/graphql-schema/resolver-typings'
import { getWeatherImage } from '@gwent/utils'
import './StrengthCircle.css'

/**
 * A circle containing strength value or weather type
 *
 * @returns The strength circle
 */
export default function StrengthCircle({ size, unit, textColor, style, ignoreHero }: StrengthCircleProps) {
  const background = `images/card/strength-${unit.hero && !ignoreHero ? 'black' : 'white'}.png`
  const weatherEffect = unit.effects?.find((effect) => effect.key === EffectKey.Weather)
  const weatherTitle = weatherEffect?.ability || ''
  const weatherSymbol = getWeatherImage(unit)
  if (!textColor) {
    textColor = unit.hero && !ignoreHero ? 'white' : 'black'
  }
  const ringSizePx = 6
  const innerSize = `calc(${size} - ${ringSizePx * 2}px - 2px)`
  const heroSize = `calc(${size} + 84%)`
  const blackColor = '#2b2b2b'

  return (
    (unit.strength !== null || weatherSymbol) && (
      <div style={{ height: size, width: size, ...style }} className="strength-circle-container">
        {unit.strength !== null && (
          <>
            {unit.hero && !ignoreHero && (
              <img
                src="/images/card/strength-hero.png"
                className="strength-circle-hero"
                title="Hero"
                style={{ height: heroSize }}
              />
            )}
            <img src={background} style={{ height: size, width: size }} />
            <div
              className="strength-circle-inner"
              style={{
                height: innerSize,
                width: innerSize,
                backgroundColor: unit.hero && !ignoreHero ? blackColor : '#e6e6e6',
                marginLeft: `${ringSizePx}px`,
                marginTop: `${ringSizePx}px`,
              }}
            ></div>
            <span className="strength-circle-value" style={{ color: textColor }} title="Strength">
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
