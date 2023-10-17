import { ApolloError } from '@apollo/client'

import { getApolloError } from '../util/error-util'

export default function Confirm({
  id,
  cancelLabel = 'No',
  onClose,
  onSubmit,
  submitLabel = 'Yes',
  submitVariables,
  error,
  loading,
  message,
  open,
}: ConfirmProps) {
  const resolvedError = getApolloError(error)
  return open ? (
    <div className="whole-screen-overlay">
      <div className="whole-screen-dialog" id={id}>
        <span className="confirm-message">{message}</span>
        {resolvedError && <span>{resolvedError}</span>}
        <div className="actions">
          <button className="secondary" type="button" disabled={loading} autoFocus onClick={() => onClose(false)}>
            {cancelLabel}
          </button>
          <button
            className="primary"
            type="button"
            disabled={loading}
            onClick={async () => {
              await onSubmit({ variables: submitVariables })
              onClose(false)
            }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null
}

interface ConfirmProps {
  id?: string
  cancelLabel?: string
  submitLabel?: string
  onClose: (item: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  onSubmit: (variables: any) => any // eslint-disable-line @typescript-eslint/no-explicit-any
  submitVariables: any // eslint-disable-line @typescript-eslint/no-explicit-any
  error: ApolloError | undefined
  loading: boolean
  message: string
  open: boolean
}
