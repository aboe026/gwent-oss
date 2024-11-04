import { HTML_CLASSES } from '@gwent/constants'
import './CoinToss.css'

/**
 * A coin flip animation to indicate a decision has been made.
 *
 * @returns A coin flip animation.
 */
export default function CoinToss({
  bounce,
  heads = true,
  delay = '0.5s',
  duration = '4s',
  size = '100%',
  style,
  onClick,
  resultText,
}: CoinTossProps) {
  const headsColor = '#e9a018'
  const tailsColor = 'silver'
  return (
    <div className="coin-flip-container">
      <div
        className="coin-flip-bounce"
        style={{
          animationName: bounce ? 'coin-flip-bouncing' : '',
          animationDelay: delay,
          animationDuration: duration,
        }}
      >
        <div
          className="coin-flip"
          style={{
            ...{
              animationDelay: delay,
              animationDuration: duration,
              height: size,
              width: size,
              cursor: onClick ? 'pointer' : 'inherit',
            },
            ...style,
          }}
          onClick={() => (onClick ? onClick() : {})}
        >
          <div
            className="coin-flip-side coin-flip-placeholder"
            style={{ animationDuration: delay, backgroundColor: headsColor }}
          />
          <div
            className="coin-flip-side coin-flip-heads"
            style={{ backgroundColor: heads ? headsColor : tailsColor }}
          />
          <div
            className="coin-flip-side coin-flip-tails"
            style={{ backgroundColor: heads ? tailsColor : headsColor }}
          />
        </div>
      </div>
      {resultText && (
        <span
          className={HTML_CLASSES.COIN_FLIP_RESULT_TEXT}
          style={{ animationDelay: delay, animationDuration: duration }}
        >
          {resultText}
        </span>
      )}
    </div>
  )
}

interface CoinTossProps {
  heads?: boolean
  bounce?: boolean
  delay?: string
  duration?: string
  size?: string
  style?: React.CSSProperties
  onClick?: () => void
  resultText?: string
}
