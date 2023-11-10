import './ProgressBar.css'

/**
 * A progress bar to indicate loading
 *
 * @returns The loading progress bar
 */
export default function ProgressBar({ height = '100%', width = '100%', style }: ProgressBarProperties) {
  return (
    <div className="progress-bar" style={{ ...{ height, width }, ...style }}>
      <div className="card card-1 northern-realms-color"></div>
      <div className="card card-2 monsters-color"></div>
      <div className="card card-3 scoiatael-color"></div>
      <div className="card card-4 nilfgaardian-color"></div>
      <div className="card card-5 skellige-color "></div>
    </div>
  )
}

interface ProgressBarProperties {
  height?: string
  width?: string
  style?: React.CSSProperties
}
