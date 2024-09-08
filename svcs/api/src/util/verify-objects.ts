import { Logger } from 'log4js'
import { ObjectId } from 'mongodb'

export default function verifyObjects({
  expectedKeys,
  objects,
  key,
  logger,
  resourceLabelPlural,
}: {
  expectedKeys: (ObjectId | string)[]
  objects: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
  key: string
  logger: Logger
  resourceLabelPlural: string
}) {
  const missingIds = getMissingKeys({
    expectedKeys,
    objects,
    key,
  })
  if (missingIds.length > 0) {
    const message = `Could not find ${resourceLabelPlural} "${JSON.stringify(missingIds)}" to resolve.`
    logger.error(Error(message))
    throw Error(message)
  }

  const extraIds = getExtraKeys({
    expectedKeys,
    objects,
    key,
  })
  if (missingIds.length > 0) {
    const message = `More ${resourceLabelPlural} resolved "${JSON.stringify(
      extraIds
    )}" than requested "${JSON.stringify(expectedKeys)}".`
    logger.error(Error(message))
    throw Error(message)
  }
}

export function getMissingKeys({
  expectedKeys,
  objects,
  key,
}: {
  expectedKeys: (ObjectId | string)[]
  objects: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
  key: string
}): string[] {
  const actualKeys: string[] = objects.map((obj) => obj[key].toString())
  const missingKeys: string[] = []

  for (const expectedId of expectedKeys) {
    const key = expectedId.toString()
    if (!actualKeys.includes(key)) {
      missingKeys.push(key)
    }
  }

  return missingKeys
}

export function getExtraKeys({
  expectedKeys,
  objects,
  key,
}: {
  expectedKeys: (ObjectId | string)[]
  objects: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
  key: string
}): string[] {
  const extraKeys: string[] = objects.map((obj) => obj[key].toString())

  for (const expectedKey of expectedKeys) {
    const index = extraKeys.indexOf(expectedKey.toString())
    if (index >= 0) {
      extraKeys.splice(index, 1)
    }
  }

  return extraKeys
}
