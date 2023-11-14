import { PropsWithChildren } from 'react'

/**
 * A container which centers content
 *
 * @returns The centering container
 */
export default function Centered(props: PropsWithChildren) {
  return <div className="centered">{props.children}</div>
}
