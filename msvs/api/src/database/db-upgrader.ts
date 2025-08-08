import { getLogger } from 'log4js'

import { sleep } from '@gwent/utils'
import Upgrade from './upgrades/upgrade'
import UpgradeStore from './stores/upgrade-store'

/**
 * A class which handles upgrades to the MongoDB database.
 */
export default class DbUpgrader {
  private static logger = getLogger('DbUpgrader')
  private static running = false // whether or not the database upgrader is currently running upgrades. Ensures no multiple runs in same process.
  private lockTimeoutSeconds: number // maximum amount of time to wait for aquiring lock
  private lockRefreshSeconds: number // how long to wait between lock aquisition attempts
  private finished = false // whether or not the currently running upgrades have finished. Used for communication between upgrades being run and lockout to short circuit either.
  private start: Date = new Date() // the time the run was started. Used to ensure locks do not overwrite each other on sucesssive runs. Allows run to stop/return as soon as upgrades finish, without needing to wait for keepLockUpdated to finish.

  /**
   * Create a new instance of DbUpgrader.
   *
   * @param config The configuration to assign the DbUpgrader.
   * @param config.lockTimeoutSeconds The maximum amount of time (in seconds) to wait when attempting to aquire lock. If exceeded, an error is thrown.
   * @param config.lockRefreshSeconds How long to wait (in seconds) between lock aquisition attempts.
   */
  constructor({
    lockTimeoutSeconds = 30,
    lockRefreshSeconds = 1,
  }: {
    lockTimeoutSeconds?: number
    lockRefreshSeconds?: number
  }) {
    this.lockTimeoutSeconds = lockTimeoutSeconds
    this.lockRefreshSeconds = lockRefreshSeconds
  }

  /**
   * Attempt to run database upgrades for the application.
   *
   * @param config The configuration used to upgrade the database.
   * @param config.upgrades The list of upgrades to be applied to the database. Only those which have not been run before will be ran.
   */
  async run({ upgrades }: { upgrades: Upgrade[] }) {
    if (DbUpgrader.running) {
      throw Error('Other upgrades currently running')
    }
    DbUpgrader.logger.debug('Setting running to true to prevent concurrent upgrade runs')
    DbUpgrader.running = true
    this.finished = false
    const started = new Date()
    this.start = started

    try {
      await this.aquireLock()

      try {
        const current = await UpgradeStore.getCurrentVersion()
        DbUpgrader.logger.debug(`Current version: "${current}"`)

        DbUpgrader.logger.debug(`Upgrades length: "${upgrades.length}"`)

        if (upgrades.length > current) {
          const newUpgradesCount = upgrades.length - current
          DbUpgrader.logger.debug(`Found "${newUpgradesCount}" new upgrade(s) to run`)
          await Promise.race([
            this.execute({
              current,
              upgrades,
              started,
            }),
            this.keepLockUpdated(started),
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
  private async aquireLock() {
    const start = Date.now()
    let aquired = false
    let sleepBeforeNextTry = true
    let attempt = 1
    DbUpgrader.logger.debug(`Attempting for "${this.lockTimeoutSeconds}" seconds to aquire lock`)
    while (!aquired && (Date.now() - start) / 1000 < this.lockTimeoutSeconds) {
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
          if (secondsSinceLastUpdate > this.lockTimeoutSeconds) {
            DbUpgrader.logger.debug(
              `Greater than "${this.lockTimeoutSeconds}" seconds since lock last updated, deleting expired lock`
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
            this.lockRefreshSeconds
          }" second(s)`
        )
        await sleep(this.lockRefreshSeconds)
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

  /**
   * Execute new upgrade scripts which have not yet been run.
   *
   * @param config The configuration used to run the upgrades.
   * @param config.current The current upgrade version the database is on. Only upgrades greater than this version are run.
   * @param config.upgrades The upgrade scripts to run. Any before current are not run.
   * @param config.started The date the run was started. Used to ensure the lock updating does not conflict with future runs.
   * @throws Error if a script throws an error or problems communicating with database while storing upgrade status.
   */
  private async execute({
    current,
    upgrades,
    started,
  }: {
    current: number
    upgrades: Upgrade[]
    started: Date
  }): Promise<void> {
    let version: number = current + 1
    try {
      for (let i = current; i < upgrades.length && this.isStillRunning(started); i++) {
        version = i + 1
        DbUpgrader.logger.info(`Running upgrade "${version}"...`)
        const start = new Date()

        DbUpgrader.logger.debug(`Adding attempt for upgrade "${version}"`)
        await UpgradeStore.addAttempt({
          version,
          time: start,
        })

        DbUpgrader.logger.debug(`Executing run function for upgrade "${version}"`)
        await upgrades[i].run()

        DbUpgrader.logger.debug(`Adding completed for upgrade "${version}"`)
        const end = new Date()
        await UpgradeStore.addUpgrade({
          version,
          start,
          end,
        })

        DbUpgrader.logger.info(
          `...upgrade "${version}" completed in "${(end.getTime() - start.getTime()) / 1000}" second(s).`
        )
      }
    } catch (err: unknown) {
      DbUpgrader.logger.error(`Upgrade "${version}" failed: ${err}`)
      throw err
    } finally {
      DbUpgrader.logger.debug('setting finished to true')
      this.finished = true
    }
  }

  /**
   * Keep lock up to date. Ensures other processes do not run upgrades at the same time.
   *
   * @param started The date the run was started. Used to ensure the lock updating does not conflict with future runs.
   * @throws Error if problem updating lock.
   */
  private async keepLockUpdated(started: Date): Promise<void> {
    let stillRunning = this.isStillRunning(started)
    DbUpgrader.logger.trace(`started "${started}", stillRunning: "${stillRunning}"`)
    try {
      while (stillRunning) {
        DbUpgrader.logger.debug(`sleeping "${this.lockRefreshSeconds}" second(s) before updating lock timeout`)
        await sleep(this.lockRefreshSeconds)
        stillRunning = this.isStillRunning(started)
        DbUpgrader.logger.trace(`started "${started}", stillRunning: "${stillRunning}"`)
        if (stillRunning) {
          DbUpgrader.logger.debug('updating lock timeout')
          await UpgradeStore.updateLock()
          stillRunning = this.isStillRunning(started)
          DbUpgrader.logger.trace(`started "${started}", stillRunning: "${stillRunning}"`)
        }
      }
    } catch (err: unknown) {
      DbUpgrader.logger.error(`Error while keeping lock updated: ${err}`)
      DbUpgrader.logger.debug('setting finished to true due to lock update error')
      this.finished = true
      throw err
    } finally {
      DbUpgrader.logger.debug('Finished keeping lock updated')
    }
  }

  /**
   * Whether or not the upgrade is still running, based off when the run started.
   *
   * @param started The Date that the run started, used to compare if the run is still going.
   * @returns True if the upgrade is still running, false if not.
   */
  private isStillRunning(started: Date): boolean {
    if (this.finished) {
      DbUpgrader.logger.debug('finished is true so not still running')
    } else {
      if (this.start.getTime() === started.getTime()) {
        DbUpgrader.logger.debug('start time matches original start time, so still running')
        return true
      } else {
        DbUpgrader.logger.debug(
          `current start time "${this.start}" does not match original start time "${started}" so not still running`
        )
      }
    }
    return false
  }
}
