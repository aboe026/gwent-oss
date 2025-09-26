import { PropsWithChildren } from 'react'
import './ContainerFixedAspectRatio.css'

/**
 * A Container with a fixed aspect ratio
 *
 */
export default function ContainerFixedAspectRatio({
  aspectRatio,
  className,
  title,
  width,
  children,
}: ContainerFixedAspectRatioProps) {
  return (
    <div className={`container-fixed-aspect-ratio-outer ${className}`} title={title} style={{ width }}>
      <div className="container-fixed-aspect-ratio-inner" style={{ aspectRatio }}>
        {children}
      </div>
    </div>
  )
}

interface ContainerFixedAspectRatioProps extends PropsWithChildren {
  aspectRatio: string
  width: string
  className?: string
  title?: string
}
