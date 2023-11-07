# gwent

![build](https://img.shields.io/endpoint?url=https://aboe026.github.io/shields.io-badge-results/badge-results/gwent/main/build.json)
![coverage](https://img.shields.io/endpoint?url=https://aboe026.github.io/shields.io-badge-results/badge-results/gwent/main/coverage.json)

A recreation of the card game Gwent from The Witcher 3: Wild Hunt.

## Prerequisites

- [NodeJS](https://nodejs.org/)
- [Yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/)
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

## Install

To install dependencies, run

```sh
yarn install
```

## Start

To run code from non-built source code (libraries still need to be [built](#build) first), run

```sh
yarn start
```

## Watch

To automatically restart the app on file changes, run

```sh
yarn watch
```

## Build

To build the source code into transpiled javascript, run

```sh
yarn build
```

To remove any previously built code, run

```sh
yarn clean
```

## Run

To run transpiled javascript bundles, run:

```sh
yarn run-built
```

or directly with

```sh
yarn node services/api/build/api.js
CLIENT_DIR=../../libs/client/build yarn node services/ui/build/src/index.js
```

## Lint

to check code for programmatic or stylistic problems, run

```sh
yarn lint
```

To automatically fix problems, run

```sh
yarn lint-fix
```

## Test

### Unit

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

### Functional

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

### E2E

To run End-To-End (E2E) tests, an instance of Gwent must first be running (see [start](#start), [run](#run) or [watch](#watch)), then run

```sh
yarn test-e2e
```

_Note_: Source code for e2e tests must first be built with `yarn build` in `test/e2e`

## Upgrade Dependencies

To upgrade dependencies, run

```sh
yarn upgrade-dependencies
```

then run `yarn install` to apply package updates

_Note_: Might need to [upgrade yarn](#upgrade-yarn) if upgrading TypeScript as it has some dependency on Yarn integrating with it.

## Upgrade Yarn

To upgrade the version of yarn used in the project, run

```sh
yarn set version latest
```

then [install](#install) to have the change picked up.

## ToDo

A list of things to be done in the future:

- Get test coverage to account for all source files (seems to only pick up files that have a unit test written for them?)
- Get unit test coverage working for .tsx files
- Change schema.ts to schema.gql
- Account for cards with different art per instance (like Havekar Smuggler)
- Account for "Ballad Heroes" different art
- Move generate types to lib? So UI can use them as well (especially for shared functions, like "isDeckValid")
- Introspect GraphQL queries/mutations to determine which fields to project/return from DB
- Have api and ui use same Dockerfile (just with different build args)
- Get apollo cache update working for login/logout to update getCurrentUser in order to just key off of that for whether or not a user is logged in

## External Bugs

Bugs found in external dependencies that have not been resolved (and require workarounds):

| Description                                                                                     | Workaround                                                                                                                                                                                                                          | Issue Link                                          |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Webpack cannot reference parent yarn workspace g:ts-node script                                 | Need to list duplicate `ts-node` devDependency in [services/ui/libs/client/package.json](./services/ui/libs/client/package.json)                                                                                                    | https://github.com/TypeStrong/ts-loader/issues/1510 |
| Webpack cannot use typescript references in webpack.config.ts without first building references | Need to have `yarn g:tsc --build` before webpack commands in [services/ui/libs/client/package.json](./services/ui/libs/client/package.json) `build` script (and have to run `yarn g:rimraf build/src` after webpack build finishes) | https://github.com/webpack/webpack/issues/16324     |
| Nodemon not restarting on file creation                                                         | Need to run `yarn build` in [services/api](./services/api/) before running `yarn watch` for first time                                                                                                                              | https://github.com/remy/nodemon/issues/2074         |
| TestCafe not working on TypeScript files                                                        | Need to run `yarn build` on e2e TypeScript files and have TestCafe run using the compiled javascript                                                                                                                                |                                                     |
| TestCafe image not working with Yarn PnP                                                        | Need to run `yarn build-image` in [test/e2e](./test/e2e/) to build custom docker image to work with Yarn PnP.                                                                                                                       | https://github.com/DevExpress/testcafe/issues/7419  |
