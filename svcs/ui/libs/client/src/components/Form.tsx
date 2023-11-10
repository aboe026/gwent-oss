import { ApolloError } from '@apollo/client'
import { HTMLInputTypeAttribute, useState } from 'react'

import { getApolloError } from '../util/error-util'
import { HTML_CLASSES } from '@gwent/constants'
import ProgressBar from './ProgressBar'
import './Form.css'

/**
 * A dialog containing a form with fields the user can fill out
 *
 * @param {Object} config The form configuration.
 * @param config.id The id to give the HTML form element.
 * @param config.cancelLabel The text the button which exits out of the form without submitting should have.
 * @param config.error The potential errors returned from the GraphQL query/mutation the form submission triggered.
 * @param config.fields The fields to present to the user for input.
 * @param config.loading Whether or not the form is waiting on data from the form submission.
 * @param config.onClose A function the form will call when closed by the user without submitting.
 * @param config.onSubmit A function the form will call when the form is successfully submitted by the user.
 * @param config.submitLable The text the button which triggers form submission should have.
 * @param config.title The title the form should display to the user.
 * @returns A form for the user to fill out.
 */
export default function Form({
  cancelLabel = 'Cancel',
  closeable = true,
  closeParams = false,
  error,
  fields,
  id,
  loading,
  onClose,
  onSubmit,
  overlay,
  submitLabel = 'Save',
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
    <div id={id} className={overlay ? 'whole-screen-overlay' : ''}>
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
          if (onClose) {
            onClose(closeParams)
          }
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
                    type={field.type}
                    autoFocus={index === 0}
                    id={field.key}
                    name={field.key}
                    value={values[field.key]}
                    required={field.required}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  />
                </div>
              )
          )}
        </div>
        {resolvedError && <span className={HTML_CLASSES.FormErrors}>{resolvedError}</span>}
        <div className="actions">
          {closeable && (
            <button
              className={HTML_CLASSES.Secondary}
              type="button"
              disabled={loading}
              onClick={onClose ? () => onClose(closeParams) : undefined}
            >
              {cancelLabel}
            </button>
          )}
          <button className={HTML_CLASSES.Primary} type="submit" disabled={loading}>
            {submitLabel}
          </button>
          {loading && <ProgressBar height="25px" style={{ marginTop: '10px' }} />}
        </div>
      </form>
    </div>
  )
}

interface FormProps {
  cancelLabel?: string
  closeable?: boolean
  closeParams?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  error: ApolloError | undefined
  fields: FormField[]
  id?: string
  loading: boolean
  onClose?: (param: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  onSubmit: (variables: any) => any // eslint-disable-line @typescript-eslint/no-explicit-any
  overlay?: boolean
  submitLabel?: string
  title: string
}

interface FormField {
  default?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  hidden?: boolean
  key: string
  label?: string
  required?: boolean
  type: HTMLInputTypeAttribute
}
