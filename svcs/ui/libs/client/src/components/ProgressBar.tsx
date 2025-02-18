import './ProgressBar.css'

/**
 * A progress bar to indicate how far into a process an operation is
 *
 * @returns The progress bar
 */
export default function ProgressBar({
  completeColor = 'darkgray',
  height = '100%',
  percent,
  remainingColor = 'lightgray',
}: ProgressBarProps) {
  return (
    <div className="progress-bar-container" style={{ height, backgroundColor: remainingColor }}>
      <div className="progress-bar-complete" style={{ width: `${percent}%`, backgroundColor: completeColor }}></div>
    </div>
  )
}

interface ProgressBarProps {
  completeColor?: string
  height?: string
  percent: number
  remainingColor?: string
}
