import { DlcDbObject } from '@gwent/graphql-schema/database-typings'
import { DlcResolvers } from '@gwent/graphql-schema/resolver-typings'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DlcResolver: DlcResolvers<any, DlcDbObject> = {
  id: (dlc: DlcDbObject) => dlc._id.toString(),
}

export default DlcResolver
