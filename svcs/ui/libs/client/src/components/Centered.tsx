import { PropsWithChildren } from 'react'

/**
 * A container which centers content
 *
 * @returns The centering container
 */
export default function Centered({ children, id }: CenteredProps) {
  return (
    <div id={id} className="centered">
      {children}
    </div>
  )
}

interface CenteredProps extends PropsWithChildren {
  id?: string
}
