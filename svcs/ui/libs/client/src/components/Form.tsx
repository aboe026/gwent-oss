import { ApolloError } from '@apollo/client'
import { HTMLInputTypeAttribute, useState } from 'react'

import { getApolloError } from '../util/error-util'
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
  id,
  cancelLabel = 'Cancel',
  error,
  fields,
  loading,
  onClose,
  onSubmit,
  submitLabel = 'Save',
  title,
}: FormProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const temp = fields.reduce((map: { [k: string]: any }, obj: FormField) => {
    map[obj.key] = obj.default || ''
    return map
  }, {})
  const [values, setValues] = useState(temp)
  const resolvedError = getApolloError(error)

  return (
    <div className="whole-screen-overlay" id={id}>
      <form
        className="whole-screen-dialog"
        onSubmit={async (event) => {
          event.preventDefault()
          for (const key in values) {
            const field = fields.find((field) => field.key === key)
            if (field?.type === 'number') {
              values[key] = parseInt(values[key])
            }
          }
          await onSubmit({ variables: { ...values } })
          onClose(false)
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
        {resolvedError && <span>{resolvedError}</span>}
        <div className="actions">
          <button className="secondary" type="button" disabled={loading} onClick={() => onClose(false)}>
            {cancelLabel}
          </button>
          <button className="primary" type="submit" disabled={loading}>
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

interface FormProps {
  title: string
  id?: string
  onClose: (param: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  onSubmit: (variables: any) => any // eslint-disable-line @typescript-eslint/no-explicit-any
  submitLabel?: string
  cancelLabel?: string
  loading: boolean
  error: ApolloError | undefined
  fields: FormField[]
}

interface FormField {
  key: string
  type: HTMLInputTypeAttribute
  label?: string
  required?: boolean
  default?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  hidden?: boolean
}
