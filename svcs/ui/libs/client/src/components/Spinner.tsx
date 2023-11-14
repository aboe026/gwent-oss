import './Spinner.css'

/**
 * A spinner to indicate loading
 *
 * @returns The loading spinner
 */
export default function Spinner({ size = '100%' }: SpinnerProps) {
  return (
    <div className="spinner" style={{ height: size, width: size }}>
      <div className="card card-1 northern-realms-color"></div>
      <div className="card card-2 monsters-color"></div>
      <div className="card card-3 scoiatael-color"></div>
      <div className="card card-4 nilfgaardian-color"></div>
      <div className="card card-5 skellige-color "></div>
    </div>
  )
}

interface SpinnerProps {
  size?: string
}
