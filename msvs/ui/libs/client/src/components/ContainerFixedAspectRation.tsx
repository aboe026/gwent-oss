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
  height,
  children,
}: ContainerFixedAspectRatioProps) {
  return (
    <div className={`container-fixed-aspect-ratio-outer ${className}`} title={title} style={{ height, width }}>
      <div
        className="container-fixed-aspect-ratio-inner"
        style={{ aspectRatio, width: width ? '100%' : '', height: height ? '100%' : '' }}
      >
        {children}
      </div>
    </div>
  )
}

interface ContainerFixedAspectRatioProps extends PropsWithChildren {
  aspectRatio: string
  width?: string
  height?: string
  className?: string
  title?: string
}
