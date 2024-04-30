import './LoadingBar.css'

/**
 * A loading bar to indicate an operation is ocurring
 *
 * @returns The loading bar
 */
export default function LoadingBar({ height = '100%', width = '100%', style }: LoadingBarProps) {
  return (
    <div className="loading-bar" style={{ ...{ height, width }, ...style }}>
      <div className="card card-1 northern-realms-color"></div>
      <div className="card card-2 monsters-color"></div>
      <div className="card card-3 scoiatael-color"></div>
      <div className="card card-4 nilfgaardian-color"></div>
      <div className="card card-5 skellige-color "></div>
    </div>
  )
}

interface LoadingBarProps {
  height?: string
  width?: string
  style?: React.CSSProperties
}
