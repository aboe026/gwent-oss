import { getErrorMessages } from '../util/error-util'
import { HTML_CLASSES } from '@gwent/constants'
import LoadingBar from './LoadingBar'
import './Confirm.css'

/**
 * A dialog asking a user if they really want to perform an action.
 *
 * @param config The configuration of the confirmation dialog.
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
 * @param config.title The Title the Confirmation dialog should show.
 * @returns A confirmation dialog for the user to accept or reject.
 */
export default function Confirm({
  cancelLabel = 'No',
  error,
  id,
  loading,
  message,
  onClose,
  onSubmit,
  open,
  submitLabel = 'Yes',
  submitVariables,
  title,
}: ConfirmProps) {
  const errorMessages = getErrorMessages(error)
  return open ? (
    <div className="whole-screen-overlay">
      <div className="whole-screen-dialog" id={id}>
        {title && <span className="confirm-title">{title}</span>}
        <span className="confirm-message">{message}</span>
        {errorMessages && <span className={HTML_CLASSES.ErrorText}>{errorMessages}</span>}
        <div className={HTML_CLASSES.ActionsContainer}>
          {loading && <LoadingBar height="25px" />}
          <button
            className={HTML_CLASSES.ActionsSecondary}
            type="button"
            disabled={loading}
            autoFocus
            onClick={() => onClose(false)}
          >
            {cancelLabel}
          </button>
          <button
            className={HTML_CLASSES.ActionsPrimary}
            type="button"
            disabled={loading}
            onClick={async () => {
              await onSubmit({ variables: submitVariables })
              // intentionally do not call onClose automatically here
              // because this can cause some discrepancy in behavior for
              // components that have an onSubmit with a retryCheckingAuth
              // which would error out here (and not have the auto-onClose here called)
              // and then need to manually close the dialog on its own in the
              // retryCheckingAuth method (so it gets called properly after the second attempt if auth fails at first)
              // so better just to have the onSubmit always close the confirm itself
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
  cancelLabel?: string
  error: unknown
  id?: string
  loading: boolean
  message: string
  onClose: (item: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  onSubmit: (variables: any) => any // eslint-disable-line @typescript-eslint/no-explicit-any
  open: boolean
  submitLabel?: string
  submitVariables: any // eslint-disable-line @typescript-eslint/no-explicit-any
  title?: string
}
