import './ProgressBar.css'

/**
 * A progress bar to indicate how far into a process an operation is
 *
 * @returns The progress bar
 */
export default function ProgressBar({
  percent,
  height = '100%',
  completeColor = 'darkgray',
  remainingColor = 'lightgray',
}: ProgressBarProps) {
  return (
    <div className="progress-bar-container" style={{ height, backgroundColor: remainingColor }}>
      <div className="progress-bar-complete" style={{ width: `${percent}%`, backgroundColor: completeColor }}></div>
    </div>
  )
}

interface ProgressBarProps {
  percent: number
  height?: string
  completeColor?: string
  remainingColor?: string
}
