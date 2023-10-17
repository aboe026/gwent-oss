import { getLogger } from 'log4js'

import allUpgrades from './upgrades/all-upgrades'
import sleep from '../util/sleep'
import UpgradeStore from './upgrade-store'

const logger = getLogger('upgrader')

export default class DbUpgrader {
  private static LOCK_TIMEOUT_SECONDS = 30
  private static LOCK_REFRESH_SECONDS = 1
  private static running = false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static getUpgrades(): (() => Promise<any>)[] {
    return allUpgrades
  }

  static async run() {
    if (DbUpgrader.running) {
      throw Error('Already attempting to run an upgrade')
    }
    logger.debug('Setting running to true to prevent concurrent upgrade runs')
    DbUpgrader.running = true

    try {
      await DbUpgrader.aquireLock()

      try {
        const current = await UpgradeStore.getCurrentVersion()
        logger.debug(`Current version: "${current}"`)

        const upgrades = DbUpgrader.getUpgrades()
        logger.debug(`allUpgrades has "${upgrades.length}" upgrades`)

        if (upgrades.length > current) {
          const newUpgradesCount = upgrades.length - current
          logger.debug(`Found "${newUpgradesCount}" new upgrade(s) to run`)
          let finished = false
          await Promise.all([
            new Promise(async (resolve, reject) => {
              let version: number = current + 1
              try {
                for (let i = current; i < upgrades.length && !finished; i++) {
                  version = i + 1
                  logger.info(`Running upgrade "${version}"...`)
                  const start = new Date()

                  await UpgradeStore.addAttempt({
                    version,
                    time: start,
                  })

                  await upgrades[i]()

                  await UpgradeStore.addUpgrade({
                    version,
                    start,
                    end: new Date(),
                  })

                  logger.info(`...upgrade "${version}" complete`)
                }
                resolve(undefined)
              } catch (err: unknown) {
                logger.error(`Error while running upgrade "${version}": "${err}"`)
                reject(err)
              } finally {
                logger.debug('setting finished to true')
                finished = true
              }
            }),
            new Promise(async (resolve, reject) => {
              try {
                while (!finished) {
                  logger.debug(`sleeping: "${DbUpgrader.LOCK_REFRESH_SECONDS}" second(s) before updating lock timeout`)
                  await sleep(DbUpgrader.LOCK_REFRESH_SECONDS)
                  logger.debug(`finished: "${finished}"`)
                  if (!finished) {
                    logger.debug('Updating lock timeout')
                    await UpgradeStore.updateLock()
                  }
                }
                resolve(undefined)
              } catch (err: unknown) {
                logger.error(`Error while waiting and updating lock: "${err}"`)
                logger.debug('setting finished to true due to lock update error')
                finished = true
                reject(err)
              }
            }),
          ])
        } else {
          logger.debug('No new upgrades to run')
        }
      } finally {
        logger.debug('Deleting lock')
        await UpgradeStore.deleteLock()
      }
    } finally {
      logger.debug('Setting running to false so other upgrade runs can occur')
      DbUpgrader.running = false
    }
  }

  private static async aquireLock() {
    const start = Date.now()
    let aquired = false
    let sleepBeforeNextTry = true
    let attempt = 1
    logger.debug(`Attempting for "${DbUpgrader.LOCK_TIMEOUT_SECONDS}" seconds to aquire lock`)
    while (!aquired && (Date.now() - start) / 1000 < DbUpgrader.LOCK_TIMEOUT_SECONDS) {
      logger.debug(`Attempt "${attempt}" to aquire lock`)
      try {
        const initialLock = await UpgradeStore.addLock()
        if (logger.isTraceEnabled()) {
          logger.trace(`initialLock: "${JSON.stringify(initialLock)}"`)
        }
        aquired = true
      } catch (err: unknown) {
        if (logger.isTraceEnabled()) {
          logger.trace(`err: "${JSON.stringify(err)}"`)
        }
        if (
          UpgradeStore.isMongoError({
            error: err,
            code: 11000, // duplicate key error
          })
        ) {
          // lock already exists, check its "updated" to see if it is still in use
          logger.debug('Lock already exists, checking if expired')
          const potentiallyExpiredLock = await UpgradeStore.getLock()
          if (logger.isTraceEnabled()) {
            logger.trace(`potentiallyExpiredLock: "${JSON.stringify(potentiallyExpiredLock)}"`)
          }
          const secondsSinceLastUpdate = (Date.now() - potentiallyExpiredLock.updated.getTime()) / 1000
          logger.trace(`secondsSinceLastUpdate: "${secondsSinceLastUpdate}"`)
          if (secondsSinceLastUpdate > DbUpgrader.LOCK_TIMEOUT_SECONDS) {
            logger.debug(
              `Greater than "${DbUpgrader.LOCK_TIMEOUT_SECONDS}" seconds since lock last updated, deleting expired lock`
            )
            try {
              await UpgradeStore.deleteLock()
              logger.debug('Expired lock deleted')
              sleepBeforeNextTry = false // no need to sleep/wait if expired lock is deleted and ready for aquisition
            } catch (err: unknown) {
              logger.error(`Could not delete expired database lock: "${JSON.stringify(err)}"`)
            }
          } else {
            logger.debug('Lock not expired, previous lock still running')
          }
        } else {
          throw err
        }
      }
      logger.trace(`aquired: "${aquired}"`)
      logger.trace(`sleepBeforeNextTry: "${sleepBeforeNextTry}"`)
      if (!aquired && sleepBeforeNextTry) {
        logger.debug(
          `Lock not aquired after "${(Date.now() - start) / 1000}" second(s), sleeping for "${
            DbUpgrader.LOCK_REFRESH_SECONDS
          }" second(s)`
        )
        await sleep(DbUpgrader.LOCK_REFRESH_SECONDS)
      }
      attempt++
    }
    const durationSeconds = (Date.now() - start) / 1000
    if (aquired) {
      logger.debug(`Lock aquired in "${durationSeconds}" second(s)`)
    } else {
      throw Error(`Could not aquire lock after "${durationSeconds}" seconds`)
    }
  }
}
