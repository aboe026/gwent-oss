import { ApolloError } from '@apollo/client'
import { HTMLInputTypeAttribute, useState } from 'react'

import { getApolloError } from '../util/error-util'
import { HTML_CLASSES } from '@gwent/constants'
import LoadingBar from './LoadingBar'
import './Form.css'

/**
 * A dialog containing a form with fields the user can fill out
 *
 * @param {Object} config The form configuration.
 * @param config.autoFocusIndex The index to give the form autofocus property (set to 0 to ensure the focus is on the form).
 * @param config.cancelLabel The text the button which exits out of the form without submitting should have.
 * @param config.cancelId The id the cancel button should have.
 * @param config.closeable Whether or not the user can close the form.
 * @param config.closeParams Variables to pass to the close method if user closes the form.
 * @param config.error The potential errors returned from the GraphQL query/mutation the form submission triggered.
 * @param config.errorId The id to give the error text.
 * @param config.errorPrefix What to prefix potential errors with.
 * @param config.fields The fields to present to the user for input.
 * @param config.id The id to give the HTML form element.
 * @param config.loading Whether or not the form is waiting on data from the form submission.
 * @param config.onClose A function the form will call when closed by the user without submitting.
 * @param config.onSubmit A function the form will call when the form is successfully submitted by the user.
 * @param config.overaly Whether or not the form should obscure the rest of the page behind it.
 * @param config.style Any CSS styling that should be applied to the form.
 * @param config.submitLabel The text the button which triggers form submission should have.
 * @param config.submitLabel The id the submit button should have.
 * @param config.title The title the form should display to the user.
 * @returns A form for the user to fill out.
 */
export default function Form({
  autoFocusIndex = 0,
  cancelLabel = 'Cancel',
  cancelId,
  closeable = true,
  closeParams = false,
  error,
  errorId,
  errorPrefix,
  fields,
  id,
  loading,
  onClose,
  onSubmit,
  overlay,
  style,
  submitLabel = 'Save',
  submitId,
  title,
}: FormProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const valueMap = fields.reduce((map: { [k: string]: any }, obj: FormField) => {
    map[obj.key] = obj.default || ''
    return map
  }, {})
  const [values, setValues] = useState(valueMap)
  const resolvedError = getApolloError(error)

  return (
    <div id={id} className={overlay ? 'whole-screen-overlay' : ''} style={style}>
      <form
        className="form-container"
        onSubmit={async (event) => {
          event.preventDefault()
          for (const key in values) {
            const field = fields.find((field) => field.key === key)
            if (field?.type === 'number') {
              values[key] = parseInt(values[key])
            }
          }
          await onSubmit({ variables: { ...values } })
        }}
      >
        <div className="form-title">{title}</div>
        <div className="form-fields">
          {fields.map(
            (field, index) =>
              !field.hidden && (
                <div key={field.key} className="form-field">
                  <label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="required-field">*</span>}
                  </label>
                  <input
                    className="form-field-text-input"
                    type={field.type}
                    autoFocus={index === autoFocusIndex}
                    id={field.key}
                    name={field.key}
                    value={values[field.key]}
                    required={field.required}
                    disabled={field.disabled || loading}
                    placeholder={field.placeholder}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  />
                  {field.description && <span className="help-text">{field.description}</span>}
                </div>
              )
          )}
        </div>
        {resolvedError && (
          <span id={errorId || undefined} className={HTML_CLASSES.ErrorText}>
            {`${errorPrefix ? `${errorPrefix}: ` : ''}${resolvedError}`}
          </span>
        )}
        <div className="actions">
          {closeable && (
            <button
              id={cancelId || undefined}
              className={HTML_CLASSES.Secondary}
              type="button"
              disabled={loading}
              onClick={onClose ? () => onClose(closeParams) : undefined}
            >
              {cancelLabel}
            </button>
          )}
          <button id={submitId || undefined} className={HTML_CLASSES.Primary} type="submit" disabled={loading}>
            {submitLabel}
          </button>
          {loading && <LoadingBar height="25px" style={{ marginTop: '10px' }} />}
        </div>
      </form>
    </div>
  )
}

interface FormProps {
  autoFocusIndex?: number
  cancelLabel?: string
  cancelId?: string
  closeable?: boolean
  closeParams?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  error: ApolloError | undefined
  errorPrefix?: string
  errorId?: string
  fields: FormField[]
  id?: string
  loading: boolean
  onClose?: (param: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  onSubmit: (variables: any) => any // eslint-disable-line @typescript-eslint/no-explicit-any
  overlay?: boolean
  style?: React.CSSProperties
  submitLabel?: string
  submitId?: string
  title: string
}

export interface FormField {
  default?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  description?: string
  hidden?: boolean
  key: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  type: HTMLInputTypeAttribute
}
