import './LoadingSpinner.css'

/**
 * A loading spinner to indicate an operation is ocurring
 *
 * @returns The loading spinner
 */
export default function LoadingSpinner({ size = '100%' }: LoadingSpinnerProps) {
  return (
    <div className="loading-spinner" style={{ height: size, width: size }}>
      <div className="card card-1 northern-realms-color"></div>
      <div className="card card-2 monsters-color"></div>
      <div className="card card-3 scoiatael-color"></div>
      <div className="card card-4 nilfgaardian-color"></div>
      <div className="card card-5 skellige-color "></div>
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: string
}
