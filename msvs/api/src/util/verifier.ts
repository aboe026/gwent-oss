import { Logger } from 'log4js'
import { ObjectId } from 'mongodb'

/**
 * A class to verify objects.
 */
export default class Verifier {
  /**
   * Ensures array is comprised of all and only expected keys specified.
   *
   * @param config The configuration used to check the objects.
   * @param config.expectedKeys The keys which should comprise the array objects.
   * @param config.objects The array of objects to verify the keys of.
   * @param config.field The field on the objects to check the expected keys against.
   * @param config.logger The logger object to log an error to in case of violation.
   * @param config.label The label to use when logging violations.
   * @throws Error if a key is missing or there is an extra key in the object array.
   */
  static checkObjects({
    expectedKeys,
    objects,
    field,
    logger,
    label,
  }: {
    expectedKeys: (ObjectId | string)[]
    objects: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
    field: string
    logger: Logger
    label: string
  }) {
    const missingIds = Verifier.getMissingKeys({
      expectedKeys,
      objects,
      field,
    })
    if (missingIds.length > 0) {
      const message = `Could not find ${label} "${JSON.stringify(missingIds)}" to resolve.`
      logger.error(Error(message))
      throw Error(message)
    }

    const extraIds = Verifier.getExtraKeys({
      expectedKeys,
      objects,
      field,
    })
    if (extraIds.length > 0) {
      const message = `More ${label} resolved "${JSON.stringify(extraIds)}" than requested "${JSON.stringify(
        expectedKeys
      )}".`
      logger.error(Error(message))
      throw Error(message)
    }
  }

  /**
   * Gets any keys missing from an object array.
   *
   * @param config The configuration used to find the missing keys.
   * @param config.expectedKeys The keys which should comprise the array objects.
   * @param config.objects The array of objects to verify the keys of.
   * @param config.field The field on the objects to check the expected keys against.
   * @returns The list of keys for which there is not an object in the array for.
   */
  private static getMissingKeys({
    expectedKeys,
    objects,
    field,
  }: {
    expectedKeys: (ObjectId | string)[]
    objects: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
    field: string
  }): string[] {
    const actualKeys: string[] = objects.map((obj) => obj[field].toString())
    const missingKeys: string[] = []

    for (const expectedId of expectedKeys) {
      const key = expectedId.toString()
      if (!actualKeys.includes(key)) {
        missingKeys.push(key)
      }
    }

    return missingKeys
  }

  /**
   * Gets any extra keys from an object array.
   *
   * @param config The configuration used to find the missing keys.
   * @param config.expectedKeys The keys which should comprise the array objects.
   * @param config.objects The array of objects to verify the keys of.
   * @param config.field The field on the objects to check the expected keys against.
   * @returns The list of keys for which there is an unexpected object in the array for.
   */
  private static getExtraKeys({
    expectedKeys,
    objects,
    field,
  }: {
    expectedKeys: (ObjectId | string)[]
    objects: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
    field: string
  }): string[] {
    const extraKeys: string[] = objects.map((obj) => obj[field].toString())

    for (const expectedKey of expectedKeys) {
      const index = extraKeys.indexOf(expectedKey.toString())
      if (index >= 0) {
        extraKeys.splice(index, 1)
      }
    }

    return extraKeys
  }
}
