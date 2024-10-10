# gwent

![build](https://img.shields.io/endpoint?url=https://aboe026.github.io/shields.io-badge-results/badge-results/gwent/main/build.json)
![coverage](https://img.shields.io/endpoint?url=https://aboe026.github.io/shields.io-badge-results/badge-results/gwent/main/coverage.json)
[![Common Changelog](https://common-changelog.org/badge.svg)](https://common-changelog.org)

A recreation of the card game Gwent from The Witcher 3: Wild Hunt.

## Containerization

The fastest way to utilize the project is by running it in a containerized environment.

To run the project "locally" (i.e. not in containers) or to develop on the project, see [Running Locally](#running-locally).

Note that all compose commands have equivalent [script](./package.json) targets for node/yarn.

### Prereqs

- [Docker](https://www.docker.com/)

### Build

To build the docker images, run

```sh
cd compose
docker compose build
```

### Up

To bring up the containers for the first time (or if the existing containers have been deleted), run

```sh
cd compose
docker compose up -d
```

### Stop

To stop the running containers, run

```sh
cd compose
docker compose stop
```

This will perserve the containers in a stopped state

### Start

To start containers in a stopped state, run

```sh
cd compose
docker compose start
```

### Down

To delete the containers, run

```sh
cd compose
docker compose down -v
```

This will stop and remove all containers for the project and any data associated with them

## Running Locally

This project can be run with Node.js locally (without containerization).

This is less secure (as it runs HTTP instead of HTTPS) but is easier for development.

### Prereqs

- [NodeJS](https://nodejs.org/)
- [Yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/)

### Install

To install dependencies, run

```sh
yarn install
```

### Build

To build the source code into transpiled javascript, run

```sh
yarn build
```

To remove any previously built code, run

```sh
yarn clean
```

### Start

To run code from non-built source code (libraries still need to be [built](#build) first), run

```sh
yarn start
```

### Watch

To automatically restart the app on file changes, run

```sh
yarn watch
```

### Run

To run transpiled javascript bundles, run:

```sh
yarn run-built
```

or directly with

```sh
yarn node svcs/api/build/api.js
CLIENT_DIR=../../libs/client/build yarn node svcs/ui/build/src/index.js
```

## Development

In order to develop on the project, ensure the [Install](#install) and [Build](#build-1) steps have been performed.

For quick cycle time on changes, it is recommended to run the project in [Watch](#watch) mode while developing.

### Prereqs

All the [Local Prereqs](#prereqs-1) apply, along with:

- [VSCode](https://code.visualstudio.com/)

  - To enable [Editor SDK](https://yarnpkg.com/getting-started/editor-sdks), run

    ```sh
    yarn dlx @yarnpkg/sdks vscode
    ```

    Then in TypeScript file, simultaneously press

    `ctrl` + `shift` + `p`

    and choose option

    `Select TypeScript Version`

    then select value

    `Use Workspace Version`

### Lint

To check code for programmatic or stylistic problems, run

```sh
yarn lint
```

To automatically fix problems, run

```sh
yarn lint-fix
```

### Test

#### Unit

To run unit tests, run

```sh
yarn test-unit
```

_Note_: To run a specific test, execute

```sh
yarn test-unit -t 'test name'
```

To view test code coverage, run

```sh
yarn coverage-view
```

#### Functional

Functional tests require a running instance of [MongoDB](https://www.mongodb.com/) they can connect to in order to run tests against a functional database (rather than mocking out responses).

The functional test are configured to use the `gwent-func` database.

To run functional (func) tests, run

```sh
yarn test-func
```

_Note_: To run a specific test, execute

```sh
yarn test-unit -t 'test name'
```

#### E2E

To run End-To-End (E2E) tests, make sure the services and libraries are [built](#build), then run

```sh
yarn test-e2e
```

_Note_: Source code for e2e tests must first be built with `yarn build` in `test/e2e`

_Note_: To run a specific test, place a `.only` after the test/fixture

This will start Gwent for you. To only run the tests (without starting Gwent), go to the `test/e2e` directory and run

```sh
yarn test
```

### Upgrade Dependencies

To upgrade dependencies, run

```sh
yarn upgrade-dependencies
```

then run `yarn install` to apply package updates

_Note_: Might need to [upgrade yarn](#upgrade-yarn) if upgrading TypeScript as it has some dependency on Yarn integrating with it.

### Upgrade Yarn

To upgrade the version of yarn used in the project, run

```sh
yarn set version latest
```

then [install](#install) to have the change picked up.

### ToDo

A list of things to be done in the future:

- fix stat bars overextending when new subscription deck comes in (most likely due to neutralStats not accurate?)
  - happens when adding deck through API and not requesting neutral stats?
  - fix by not allowing neutral stats on factions
- enforce auth for subscriptions (so can't see other users decks created)
- secure websocket (wss) for docker-compose
- have websocket reconnect if connection fails (add option to GraphQLWsLink constructor? https://the-guild.dev/graphql/ws/docs/interfaces/client.ClientOptions)
- allow introspection without authentication
- Do not have "neutralStats" as a field (or if so, only allow it for Factions, not Decks)
  - just do that math on the front end, already have neutral faction guaranteed queried
- figure out why "deck-resolver fromArray" unit tests sometimes fail on units created dates off by a millisecond
- add ability to target resolution of neutrals on each type of DeckUnit gameDeck (undrawn, hand, discard, redraws (from/to))
- Change "ready" mutation to "readyGame"?
- Remove @map directive for ID types?
- Figure out why mutation resolvers don't show typescript error when returning Db object instead of resolved object
- have Graphql context be typed: https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-resolvers#contexttype
- Switch DeckUnit to be same as Unit but single image instead of array
  - Have Unit interface with AvailableUnit and DeckUnit implementations
  - need to store in database as { id: ObjectId, artStyle: Number}, but "combine" them in resolver
  - change schema input to be just an optional image instead of artStyle
- carry over username (and password?) when switching between log-in and sign-up
- more accurately type front-end results based on their return fragments
  - type Game = GameQuery['game']
  - this seems to mess up nested objects though :/
- Replace AUTH_TIMEOUT_ID with something less "hacky" (state variable on app?)
- Have "DateTime" on resolver object map to javascript Date object?
- add Error to returns types for all queries/mutations?
- Make Combat a type (because of image)
- look into why cookie doesn't persist with first "yarn start" but does with "yarn watch" (or "yarn start" after "yarn watch")
- run index analyzer during func tests?
- change artStyle to 0 based indexing?
- Cache "static" (non-user-modifiable) db resources (factions, effects, leaders, units) in-memory of app to reduce db pressure?
- Get test coverage to account for all source files (seems to only pick up files that have a unit test written for them?)
- Get unit test coverage working for .tsx files
- Change schema.ts to schema.gql
- Introspect GraphQL queries/mutations to determine which fields to project/return from DB
- Have api and ui use same Dockerfile (just with different build args)
- Fold [deck-filter.ts](libs\graphql-schema\src\deck-filter.ts) into normal GraphQL schema (add sort and filter fields to units query)
- Fix root "yarn build"
  - right now it runs "yarn build" in all workspaces simultaneously.
  - This is a problem because there are explicit dependencies on libraries being built first
  - Need to have a script generate dependency tree, then perform builds in reverse order

### External Bugs

Bugs found in external dependencies that have not been resolved (and require workarounds):

| Description                                                                                     | Workaround                                                                                                                                                                                                                  | Issue Link                                                       |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Webpack cannot reference parent yarn workspace g:ts-node script                                 | Need to list duplicate `ts-node` devDependency in [svcs/ui/libs/client/package.json](./svcs/ui/libs/client/package.json)                                                                                                    | https://github.com/TypeStrong/ts-loader/issues/1510              |
| Webpack cannot use typescript references in webpack.config.ts without first building references | Need to have `yarn g:tsc --build` before webpack commands in [svcs/ui/libs/client/package.json](./svcs/ui/libs/client/package.json) `build` script (and have to run `yarn g:rimraf build/src` after webpack build finishes) | https://github.com/webpack/webpack/issues/16324                  |
| Nodemon not restarting on file creation                                                         | Need to run `yarn build` in [svcs/api](./svcs/api/) before running `yarn watch` for first time                                                                                                                              | https://github.com/remy/nodemon/issues/2074                      |
| TestCafe not working on TypeScript files                                                        | Need to run `yarn build` on e2e TypeScript files and have TestCafe run using the compiled javascript                                                                                                                        |                                                                  |
| TestCafe image not working with Yarn PnP                                                        | Need to run `yarn build-image` in [test/e2e](./test/e2e/) to build custom docker image to work with Yarn PnP.                                                                                                               | https://github.com/DevExpress/testcafe/issues/7419               |
| Line endings LF on Windows for codegen output                                                   | Installed https://www.npmjs.com/package/eol and added as a hook in the [codegen.ts](./libs/graphql-schema/codegen.ts)                                                                                                       | https://github.com/dotansimha/graphql-code-generator/issues/5154 |
