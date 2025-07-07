import { getLogger } from 'log4js'

import allUpgrades from './upgrades/all-upgrades'
import { sleep } from '@gwent/utils'
import Upgrade from './upgrades/upgrade'
import UpgradeStore from './stores/upgrade-store'

/**
 * A class which handles upgrades to the MongoDB database.
 */
export default class DbUpgrader {
  private static LOCK_TIMEOUT_SECONDS = 30
  private static LOCK_REFRESH_SECONDS = 1
  private static running = false
  private static logger = getLogger('DbUpgrader')

  /**
   * Get all upgrade functions that have been defined for the application.
   *
   * @returns An array of upgrade functions.
   */
  private static getUpgrades(): Upgrade[] {
    return allUpgrades
  }

  /**
   * Attempt to run database upgrades for the application.
   */
  static async run() {
    if (DbUpgrader.running) {
      throw Error('Already attempting to run an upgrade')
    }
    DbUpgrader.logger.debug('Setting running to true to prevent concurrent upgrade runs')
    DbUpgrader.running = true

    try {
      await DbUpgrader.aquireLock()

      try {
        const current = await UpgradeStore.getCurrentVersion()
        DbUpgrader.logger.debug(`Current version: "${current}"`)

        const upgrades = DbUpgrader.getUpgrades()
        DbUpgrader.logger.debug(`allUpgrades has "${upgrades.length}" upgrade(s)`)

        if (upgrades.length > current) {
          const newUpgradesCount = upgrades.length - current
          DbUpgrader.logger.debug(`Found "${newUpgradesCount}" new upgrade(s) to run`)
          let finished = false
          await Promise.all([
            // eslint-disable-next-line no-async-promise-executor
            new Promise(async (resolve, reject) => {
              let version: number = current + 1
              try {
                for (let i = current; i < upgrades.length && !finished; i++) {
                  version = i + 1
                  DbUpgrader.logger.info(`Running upgrade "${version}"...`)
                  const start = new Date()

                  await UpgradeStore.addAttempt({
                    version,
                    time: start,
                  })

                  await upgrades[i].run()

                  await UpgradeStore.addUpgrade({
                    version,
                    start,
                    end: new Date(),
                  })

                  DbUpgrader.logger.info(`...upgrade "${version}" complete`)
                }
                resolve(undefined)
              } catch (err: unknown) {
                DbUpgrader.logger.error(`Error while running upgrade "${version}": "${err}"`)
                reject(err)
              } finally {
                DbUpgrader.logger.debug('setting finished to true')
                finished = true
              }
            }),
            // eslint-disable-next-line no-async-promise-executor
            new Promise(async (resolve, reject) => {
              try {
                while (!finished) {
                  DbUpgrader.logger.debug(
                    `sleeping "${DbUpgrader.LOCK_REFRESH_SECONDS}" second(s) before updating lock timeout`
                  )
                  await sleep(DbUpgrader.LOCK_REFRESH_SECONDS)
                  DbUpgrader.logger.debug(`finished: "${finished}"`)
                  if (!finished) {
                    DbUpgrader.logger.debug('Updating lock timeout')
                    await UpgradeStore.updateLock()
                  }
                }
                resolve(undefined)
              } catch (err: unknown) {
                DbUpgrader.logger.error(`Error while waiting and updating lock: "${err}"`)
                DbUpgrader.logger.debug('setting finished to true due to lock update error')
                finished = true
                reject(err)
              }
            }),
          ])
        } else {
          DbUpgrader.logger.debug('No new upgrades to run')
        }
      } finally {
        DbUpgrader.logger.debug('Deleting lock')
        await UpgradeStore.deleteLock()
      }
    } finally {
      DbUpgrader.logger.debug('Setting running to false so other upgrade runs can occur')
      DbUpgrader.running = false
    }
  }

  /**
   * Attempt to aquire a lock on the database. This lock ensures no other upgrades are run concurrently, guaranteeing upgrades only run once.
   */
  private static async aquireLock() {
    const start = Date.now()
    let aquired = false
    let sleepBeforeNextTry = true
    let attempt = 1
    DbUpgrader.logger.debug(`Attempting for "${DbUpgrader.LOCK_TIMEOUT_SECONDS}" seconds to aquire lock`)
    while (!aquired && (Date.now() - start) / 1000 < DbUpgrader.LOCK_TIMEOUT_SECONDS) {
      DbUpgrader.logger.debug(`Attempt "${attempt}" to aquire lock`)
      try {
        const initialLock = await UpgradeStore.addLock()
        if (DbUpgrader.logger.isTraceEnabled()) {
          DbUpgrader.logger.trace(`initialLock: "${JSON.stringify(initialLock)}"`)
        }
        aquired = true
      } catch (err: unknown) {
        if (DbUpgrader.logger.isTraceEnabled()) {
          DbUpgrader.logger.trace(`err: "${JSON.stringify(err)}"`)
        }
        if (
          UpgradeStore.isMongoError({
            error: err,
            code: 11000, // duplicate key error
          })
        ) {
          // lock already exists, check its "updated" to see if it is still in use
          DbUpgrader.logger.debug('Lock already exists, checking if expired')
          const potentiallyExpiredLock = await UpgradeStore.getLock()
          if (DbUpgrader.logger.isTraceEnabled()) {
            DbUpgrader.logger.trace(`potentiallyExpiredLock: "${JSON.stringify(potentiallyExpiredLock)}"`)
          }
          const secondsSinceLastUpdate = (Date.now() - potentiallyExpiredLock.updated.getTime()) / 1000
          DbUpgrader.logger.trace(`secondsSinceLastUpdate: "${secondsSinceLastUpdate}"`)
          if (secondsSinceLastUpdate > DbUpgrader.LOCK_TIMEOUT_SECONDS) {
            DbUpgrader.logger.debug(
              `Greater than "${DbUpgrader.LOCK_TIMEOUT_SECONDS}" seconds since lock last updated, deleting expired lock`
            )
            try {
              await UpgradeStore.deleteLock()
              DbUpgrader.logger.debug('Expired lock deleted')
              sleepBeforeNextTry = false // no need to sleep/wait if expired lock is deleted and ready for aquisition
            } catch (err: unknown) {
              DbUpgrader.logger.error(`Could not delete expired database lock: "${JSON.stringify(err)}"`)
            }
          } else {
            DbUpgrader.logger.debug('Lock not expired, previous lock still running')
          }
        } else {
          throw err
        }
      }
      DbUpgrader.logger.trace(`aquired: "${aquired}"`)
      DbUpgrader.logger.trace(`sleepBeforeNextTry: "${sleepBeforeNextTry}"`)
      if (!aquired && sleepBeforeNextTry) {
        DbUpgrader.logger.debug(
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
      DbUpgrader.logger.debug(`Lock aquired in "${durationSeconds}" second(s)`)
    } else {
      throw Error(`Could not aquire lock after "${durationSeconds}" seconds`)
    }
  }
}
