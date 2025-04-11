import DbConnector from '../../../src/database/db-connector'
import DbUpgrader from '../../../src/database/db-upgrader'
import DbUtil from './db-util'

beforeEach(async () => {
  await DbUtil.deleteDatabase()
  await DbUpgrader.run()
})
afterAll(async () => {
  await DbConnector.disconnect()
})
