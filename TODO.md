# ToDo

A list of things to be done in the future.

## Table of Contents

- [Fixes](#fixes)
- [Features](#features)
- [External Bugs](#external-bugs)

## Fixes

Existing problems in the codebase that need to be fixed.

yarn upgrade-dependencies
Checking @gwent/core dependencies...
Package JSON for "@gwent/core" does not have "dependencies"
Checking @gwent/core devDependencies...
Skipping "@types/node" due to deny list
Major version bump for "eslint-plugin-jsdoc" - "54.1.1" to "61.1.4"
Skipping "open" due to deny list
Skipping "replace-in-file" due to deny list
Checking @gwent/constants dependencies...
Package JSON for "@gwent/constants" does not have "dependencies"
Checking @gwent/constants devDependencies...
Checking @gwent/db-profiler dependencies...
Checking @gwent/db-profiler devDependencies...
Skipping "@types/node" due to deny list
Checking @gwent/env dependencies...
Checking @gwent/env devDependencies...
Checking @gwent/graphql-schema dependencies...
Checking @gwent/graphql-schema devDependencies...
Major version bump for "@graphql-codegen/add" - "5.0.3" to "6.0.0"
Major version bump for "@graphql-codegen/cli" - "5.0.7" to "6.0.0"
Major version bump for "@graphql-codegen/client-preset" - "4.8.3" to "5.1.0"
Major version bump for "@graphql-codegen/schema-ast" - "4.1.0" to "5.0.0"
Major version bump for "@graphql-codegen/typescript" - "4.1.6" to "5.0.2"
Major version bump for "@graphql-codegen/typescript-operations" - "4.6.1" to "5.0.2"
Major version bump for "@graphql-codegen/typescript-resolvers" - "4.5.2" to "5.1.0"
Skipping "@types/node" due to deny list
Checking @gwent/lcov-dark-mode dependencies...
Checking @gwent/lcov-dark-mode devDependencies...
Checking @gwent/test-utils dependencies...
Checking @gwent/test-utils devDependencies...
Skipping "@types/node" due to deny list
Checking @gwent/utils dependencies...
Checking @gwent/utils devDependencies...
Skipping "@types/node" due to deny list
Checking @gwent/validators dependencies...
Checking @gwent/validators devDependencies...
Skipping "@types/node" due to deny list
Checking @gwent/msv-api dependencies...
Checking @gwent/msv-api devDependencies...
Skipping "@types/express" due to deny list
Checking @gwent/msv-ui dependencies...
Skipping "replace-in-file" due to deny list
Checking @gwent/msv-ui devDependencies...
Skipping "@types/express" due to deny list
Checking @gwent/client dependencies...
Skipping "url-join" due to deny list
Checking @gwent/client devDependencies...
Skipping "@types/node" due to deny list
Skipping "@types/url-join" due to deny list
Checking @gwent/client-env dependencies...
Package JSON for "@gwent/client-env" does not have "dependencies"
Checking @gwent/client-env devDependencies...
Checking @gwent/test-e2e dependencies...
Skipping "graphql-request" due to deny list
Skipping "url-join" due to deny list
Checking @gwent/test-e2e devDependencies...
Skipping "@types/node" due to deny list
Skipping "@types/url-join" due to deny list
Skipping "replace-in-file" due to deny list
Dependencies updated! Run "yarn install" to install new dependencies.

- include "to" for impact so know exactly which unit it transformed into?
- FullCard combat
  - "Any" icon/text for units that can be played on any row
  - "Modifier" icon/text for row modifiers (Commander's Horn/Mardroeme)
- improve performance when typing name for deck
- rename "scorchBattlefield.ts" to "effect-scorch.ts" and "muster-battlefield.ts" to "effect-muster.ts"
- remove unnecessary dependencies
  - figlet: just have hard-coded banner text for startup
  - fs-extra: just use fs or fs/promises, maybe helper method for "exists"
- func test to validate how many times db is read when querying items (to ensure "batching" is enforced)
- override DateTime in schema to Date?
- have effect operators ("+1", "x2", etc) be enums?
- automate check in build process to ensure package.json versions incremented (and all same)?
- use INFO logging more? Like any time action successful (game created, unit played, etc)?
- remove need for classes just for log4js spying
  - have "getLogger" method
    - keeps loggers in memory by name
    - when called, returns already instantiated log4js instance if it exists, otherwise creates ones
    - new "getLogger" needs to be called within individual methods
- increase resolution of unit images
  - search for better pics
  - use AI upscaler?
- "combats" and "effects" disappear from middle of deck editor after switching factions in chrome?
- rename "undrawn" to "draw" (since its the draw pile?)
- improve UX around game player info (username, score, rounds, passed)
- centralize error handling in the UI
  - single place to watch for any error and automatially re-auths and re-calls failing operations
- move all hard-coded config to GameConfig
  - PLAYER_COUNTS (or can this just be inferred from game.players size?)
  - MAX_REDRAWS
  - STARTING_HAND_SIZE
  - MAX_SPECIALS
  - min units?
- split subscriptions into separate files (similar to resolvers)
- Cut down on return fragments (for mutations and subscriptions) (e.g. gameReady only needs player id, game id and status, gamesList doesn't need all details that game page does)
- potentially use `.disableConcurrency` for TestCafe fixtures?
  - `Session Expiry`? To set `SESSION_TIMEOUT_SECONDS` account setting in database. But that would slow things down considerably.
- use apollo data masking
  - ran into issue with returning empty objects (because some fragments not having ids ?)
- enter key does not create game in UI?
  - seems to be browser specific due to autocomplete list taking autofocus
- rename "redraw" mutation to "redrawUnit"? and "ready" to "readyGame"? Have mutation name convention by "verbNoun"?
- remove "renderXYZ" methods in favor of functional components always?
- do not store yarn sdks in source?
- figure out why "deck-resolver fromArray" unit tests sometimes fail on units created dates off by a millisecond
- stop subscription reconnect attempts if auth times out
  - show login dialog?
- Remove @map directive for ID types?
- Switch DeckUnit to be same as Unit but single image instead of array
  - Have Unit interface with following implementations:
    - AvailableUnit
      - images (all possible art styles you can choose for the image)
    - DeckUnit
      - image (for chosen art style)
    - GameUnit
      - image (for chosen art style)
      - effectiveStrength (for strength after all active effects applied)
  - need to store in database as { id: ObjectId, artStyle: Number}, but "combine" them in resolver
- carry over username (and password?) when switching between log-in and sign-up
  - show sign up by default, unless they have visited page (or signed up?) before, then show login by default
- Replace AUTH_TIMEOUT_ID with something less "hacky" (state variable on app?)
- Have "DateTime" on resolver object map to javascript Date object?
- Make Combat a type (because of image)
- If ever want to increase MAX_REDRAWS to greater than 2, need to have different unique constraint than just from/to id. Probably need an id for the redraw object itself.
- have log4js config be dynamic
  - target log level of specific classes/loggers
  - configure while running (need role/admin for that?)
  - save config in database?
    - save config in memory as well to reduce database reads?
      - how to handle changes when multiple instances running?
- move all config files (prettier, eslint, docker, jest) to `.config` directory
- look into why cookie doesn't persist with first "yarn start" but does with "yarn watch" (or "yarn start" after "yarn watch")
- dynamically set scenario name for e2e tests based on their fixture name, have it set on context
- run index analyzer during func tests?
- change artStyle to 0 based indexing?
- Cache "static" (non-user-modifiable) db resources (factions, effects, leaders, units) in-memory of app to reduce db pressure?
  - add functional tests which spy on database store "read" method to ensure requests "batched" properly
- Get test coverage to account for all source files (seems to only pick up files that have a unit test written for them?)
- Get unit test coverage working for .tsx files
- Introspect GraphQL queries/mutations to determine which fields to project/return from DB
- Have api and ui use same Dockerfile (just with different build args)
- Fold [deck-filter.ts](libs\graphql-schema\src\deck-filter.ts) into normal GraphQL schema (add sort and filter fields to units query)

## Features

New things that should be added to the codebase.

- Medic
  - How to handle brought back for HistoryMove/Impact? unique per created?
- Avenger
  - How to handle duplicates on battlefield? Use "created" field as differentiator?
- Bond
  - verify Cerys musters have bond applied
- Better game summarization (graphs?)
  - points per round
  - time per round
  - efficiency per round?
  - game duration
  - duration per player
- Add link to GitHub repo in about page
- Limit user creation
  - activation code?
  - manual review?
- rename to gwent-oss (gwent open source software?)
- Animations of cards entering battlefield?
- "Randomize" button for creating deck?
- Units can be discarded instead of played (discardUnit mutation?)
- some cards (or some scenarios - like scorch?) cannot be revived with medic ability
- game history improvements
  - search bar (unit name?)
  - expand/collapse all
  - filter by entrance type
  - filter by player
- games list improvements
  - progress bar for game status
  - highlight games waiting on you?
  - subscriptions for status changes?
- implement audit actions
  - status of attempt, success, failure
  - all actions so can know who does what in which order
- implement user registration
  - register with email
  - need to verify in email to get account created
- auto-pass after certain amount of time
- email notifications?
- edit deck
- delete deck
- pagination
  - decks
  - games
- help text on deck builder for effects
  - question mark next to effects on bottom
  - pops up full screen dialog with each effect icon, name and description
- ensure client and server are on same version
- error codes
- have game creation in UI have searcheable field for opponent
  - need query to get users
    - restrict to users "friends"?
  - change addGame mutation to accept ids instead of usernames

## External Bugs

Bugs found in external dependencies that have not been resolved (and require workarounds):

| Description                                                                                                                                                                                                              | Workaround                                                                                                                                                                                                                  | Issue Link                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Webpack cannot reference parent yarn workspace g:ts-node script                                                                                                                                                          | Need to list duplicate `ts-node` devDependency in [msvs/ui/libs/client/package.json](./msvs/ui/libs/client/package.json)                                                                                                    | https://github.com/TypeStrong/ts-loader/issues/1510              |
| Webpack cannot use typescript references in webpack.config.ts without first building references                                                                                                                          | Need to have `yarn g:tsc --build` before webpack commands in [msvs/ui/libs/client/package.json](./msvs/ui/libs/client/package.json) `build` script (and have to run `yarn g:rimraf build/src` after webpack build finishes) | https://github.com/webpack/webpack/issues/16324                  |
| Nodemon not restarting on file creation                                                                                                                                                                                  | Need to run `yarn build` in [msvs/api](./msvs/api/) before running `yarn watch` for first time                                                                                                                              | https://github.com/remy/nodemon/issues/2074                      |
| TestCafe not working on TypeScript files                                                                                                                                                                                 | Need to run `yarn build` on e2e TypeScript files and have TestCafe run using the compiled javascript                                                                                                                        |                                                                  |
| TestCafe image not working with Yarn PnP                                                                                                                                                                                 | Need to run `yarn build-image` in [test/e2e](./test/e2e/) to build custom docker image to work with Yarn PnP.                                                                                                               | https://github.com/DevExpress/testcafe/issues/7419               |
| Line endings LF on Windows for codegen output                                                                                                                                                                            | Installed https://www.npmjs.com/package/eol and added as a hook in the [codegen.ts](./libs/graphql-schema/codegen.ts)                                                                                                       | https://github.com/dotansimha/graphql-code-generator/issues/5154 |
| TestCafe throws error `ERROR Cannot prepare tests due to the following error: The fixture of 'Shows about page without logging in' test (null) is not of expected type (non-null object).` when overriding context type. | Run script `remove-context-overrides` to remove declarations for `test` and `fixture` from built javascript.                                                                                                                |                                                                  |
