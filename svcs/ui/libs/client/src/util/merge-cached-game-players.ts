import { FieldFunctionOptions } from '@apollo/client'

import { GamePlayer, User } from '@gwent/graphql-schema/apollo-typings'

export function mergeCachedGamePlayers(
  existing: GamePlayer[],
  incoming: GamePlayer[],
  { readField, mergeObjects }: FieldFunctionOptions
) {
  const merged: GamePlayer[] = existing ? existing.slice(0) : []
  const userNameToIndex: Record<string, number> = Object.create(null)
  if (existing) {
    existing.forEach((player, index) => {
      const user = readField<User>('user', player)
      if (user) {
        // TODO: switch to using "id" as key instead of "name"
        // after AUTH_TIMEOUT_ID hack fixed
        const userName = readField<string>('name', user)
        if (userName) {
          userNameToIndex[userName] = index
        }
      }
    })
  }
  for (const player of incoming) {
    let index, userName
    const user = readField<User>('user', player)
    if (user) {
      userName = readField<string>('name', user)
      if (userName) {
        index = userNameToIndex[userName]
      }
    }
    if (typeof index === 'number') {
      // Merge the new author data with the existing author data.
      const existingPlayer = merged[index]
      const mergedPlayer = mergeObjects(existingPlayer, player)

      // need to preserve original user as it contains reference to cached user
      // whereas incoming user is plain object which would break the link to the cached object
      mergedPlayer.user = existingPlayer.user

      merged[index] = mergedPlayer
    } else if (userName) {
      // First time we've seen this author in this array.
      userNameToIndex[userName] = merged.length
      merged.push(player)
    }
  }
  return merged
}
