import { PropsWithChildren } from 'react'

/**
 * A container which centers content
 *
 * @returns The centering container
 */
export default function Centered({ children, classname, id }: CenteredProps) {
  return (
    <div id={id} className={`centered ${classname || ''}`}>
      {children}
    </div>
  )
}

interface CenteredProps extends PropsWithChildren {
  id?: string
  classname?: string
}
