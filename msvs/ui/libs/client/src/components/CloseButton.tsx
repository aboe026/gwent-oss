import { CgClose } from 'react-icons/cg'
import { PropsWithChildren } from 'react'

import './CloseButton.css'

/**
 * A button to close a dialog/form
 *
 * @returns The close button
 */
export default function CloseButton({ id, onClose, title = 'Close' }: CloseButtonProps) {
  return (
    <div id={id} className="close-button" onClick={() => onClose()} title={title}>
      <CgClose color="black" />
    </div>
  )
}

interface CloseButtonProps extends PropsWithChildren {
  id?: string
  onClose: () => any // eslint-disable-line @typescript-eslint/no-explicit-any
  title?: string
}
