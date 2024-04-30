import { MouseEventHandler, ReactElement } from 'react'

import './ProgressRing.css'

/**
 * A progress ring to indicate how much of a process has been completed
 *
 * @returns The progress ring
 */
export default function ProgressRing({
  completed,
  total,
  completedColor,
  remainingColor,
  label,
  width = '100%',
  height,
  lineWidth = 4,
  onClick,
  countMargin = '-5px',
  title,
  id,
}: ProgressRingProps) {
  const shape = 'M21 21 m-11.254 11.254 a 15.91549430918954 15.91549430918954 135 1 1 22.508 0'
  const percentage = (completed / total) * 100

  return (
    <div id={id} className={onClick ? 'pointable' : ''} style={{ width, height }} onClick={onClick} title={title}>
      <div className="progress-ring-container">
        <svg className="progress-ring" viewBox="0 0 42 42">
          <path className="progress-ring-inner" d={shape} style={{ strokeWidth: lineWidth, stroke: remainingColor }} />
          <path
            className="progress-ring-outer"
            d={shape}
            style={{ strokeWidth: lineWidth, stroke: completedColor, strokeDasharray: `${(percentage * 3) / 4} 75` }}
          />
        </svg>
        <div className="progress-ring-center-text">{label}</div>
        <div className={'progress-ring-bottom-text'} style={{ marginBottom: countMargin }}>
          <span style={{ color: completedColor }}>{completed}</span>
          <span>/</span>
          <span>{total}</span>
        </div>
      </div>
    </div>
  )
}

interface ProgressRingProps {
  completed: number
  total: number
  completedColor: string
  remainingColor: string
  label: string | ReactElement
  width?: string
  height?: string
  lineWidth?: number
  onClick?: MouseEventHandler<HTMLDivElement>
  lowBottomText?: boolean
  countMargin?: string
  title?: string
  id?: string
}
