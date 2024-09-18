import { PropsWithChildren } from 'react'

import Centered from './Centered'

/**
 * A dialog which occupies the entire screen, obscuring everything behind it.
 *
 * @returns The obscuring screen-size dialog.
 */
export default function WholeScreenDialog({ children, onClose, style }: WholeScreenDialogProps) {
  const id = 'wholeScreenDialog'

  return (
    <div
      className="whole-screen-overlay"
      onClick={(event) => {
        if ((event.target as HTMLDivElement).id === id && onClose) {
          onClose()
        }
      }}
      style={style}
    >
      <Centered id={id}>{children}</Centered>
    </div>
  )
}

interface WholeScreenDialogProps extends PropsWithChildren {
  onClose?: Function // eslint-disable-line @typescript-eslint/ban-types
  style?: React.CSSProperties
}
