import { Logger } from 'log4js'
import { ObjectId } from 'mongodb'

export default class Verifier {
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
      // TODO: throw stack traces for other logger.error?
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
