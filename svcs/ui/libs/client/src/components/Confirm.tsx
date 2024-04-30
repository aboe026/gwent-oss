import { ApolloError } from '@apollo/client'

import { getApolloError } from '../util/error-util'
import { HTML_CLASSES } from '@gwent/constants'

/**
 * A dialog asking a user if they really want to perform an action.
 *
 * @param {Object} config The configuration of the confirmation dialog.
 * @param config.id The id to give the HTML form element.
 * @param config.cancelLabel The text the button which exits out of the confirmation without performing the action should have.
 * @param config.onClose A function the confirmation will call when closed by the user without perfomring the action.
 * @param config.onSubmit A function the confirmation will call when the action is successfully performed.
 * @param config.submitLabel The text the button which triggers confirmation action should have.
 * @param config.submitVariables The variables to pass to the GraphQL query/mutation performing the confirmation action.
 * @param config.error The potential errors returned from the GraphQL query/mutation the confirmation acceptance triggered.
 * @param config.loading Whether or not the confirmation is waiting on data from the confimation action.
 * @param config.message The text to present to the user explaining the confirmation implications.
 * @param config.open Whether or not the confirmation dialog should be shown to the user.
 * @returns A confirmation dialog for the user to accept or reject.
 */
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
        {resolvedError && <span className={HTML_CLASSES.ErrorText}>{resolvedError}</span>}
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
