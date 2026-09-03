# gwent-oss

![build](https://img.shields.io/endpoint?url=https://aboe026.github.io/shields.io-badge-results/badge-results/gwent-oss/main/build.json)
![coverage](https://img.shields.io/endpoint?url=https://aboe026.github.io/shields.io-badge-results/badge-results/gwent-oss/main/coverage.json)
[![Common Changelog](https://common-changelog.org/badge.svg)](https://common-changelog.org)

An open-source recreation of the card game Gwent with online multiplayer.

Visit the production instance at [gwent-oss.com](https://gwent-oss.com)

<details>
<summary><strong>Table of Contents</strong> (click to expand)</summary>

- [Containerization](#containerization)
  - [Prereqs](#prereqs)
  - [Build](#build)
  - [Up](#up)
  - [Stop](#stop)
  - [Start](#start)
  - [Down](#down)
- [Running Locally](#running-locally)
  - [Prereqs](#prereqs-1)
  - [Install](#install)
  - [Build](#build-1)
  - [Clean](#clean)
  - [Start](#start-1)
  - [Watch](#watch)
  - [Run](#run)
- [Development](#development)
  - [Prereqs](#prereqs-2)
  - [Lint](#lint)
  - [Test](#test)
    - [Unit](#unit)
    - [Functional](#functional)
    - [End to End](#end-to-end)
  - [Upgrading](#upgrading)
    - [Upgrade Nodejs](#upgrade-nodejs)
    - [Upgrade Dependencies](#upgrade-dependencies)
    - [Upgrade Yarn](#upgrade-yarn)
    - [Upgrade Others](#upgrade-others)
  - [Changes](./CHANGELOG.md)
  - [To-Do](./TODO.md)

</details>

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

You can overwrite the default ".env" values with a custom env file by adding `--env-file=/path/to/.env --env-file=/path/to/custom.env` between the `compose` and `up` targets in the command.

**Note**: If changing any secret path names via environment variables, you'll need to add the `--force-recreate` option to the command for the containers to get properly recreated with the correct values.

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

This will only build the code in the specific package you are in

- if you are in the root repository directory, it will build everything
- TypeScript will build dependent packages
- Any non-TypeScript building (such as Codegen) in dependent packages will not get run

If you are in a specific/non-root package and want to build it and all its dependencies, run

```sh
yarn build-all
```

While this is a "safer" command (in that ensures everything (and not just TypeScript) gets built properly), it is much slower than just `yarn build`

### Clean

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
yarn node msvs/api/build/api.js
CLIENT_DIR=../../libs/client/build yarn node msvs/ui/build/src/index.js
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

  - Recommended Extensions:
    - [Eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
    - [GraphQL: Language Feature Support](https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql)
    - [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
    - [ZipFS - a zip file system](https://marketplace.visualstudio.com/items?itemName=arcanis.vscode-zipfs)

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

Unit tests mock any external dependencies and are meant to just test each unit of code under isolation. This ensures edge cases which might be extremely difficult to target otherwise are tested thoroughly.

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

The functional test are configured to use the `gwent-oss-func` database.

To run functional (func) tests, run

```sh
yarn test-func
```

_Note_: To run a specific test, execute

```sh
yarn test-unit -t 'test name'
```

#### End to End

End to End (E2E) tests execute against a running instance of a gwent-oss server and are meant to be as close to a "real world" scenario as tests can possibly be.

The E2E tests are expecting the gwent-oss server to be configured to use the `gwent-oss-e2e` database.

To run End-To-End (E2E) tests, make sure the services and libraries are [built](#build), then run

```sh
yarn test-e2e
```

_Note_: Source code for e2e tests must first be built with `yarn build` in `test/e2e`

_Note_: To run a specific test, place a `.only` after the test/fixture

This will start gwent-oss for you. To only run the tests (without starting gwent-oss), go to the `test/e2e` directory and run

```sh
yarn test
```

### Upgrading

There are several things to check when upgrading dependencies for this project.

#### Upgrade Nodejs

To upgrade [NodeJS](https://nodejs.org/), edit the [.nvmrc](./.nvmrc) file as well as the `NODE_VERSION` arg in the [Dockerfile](./Dockerfile).

Also, change `package.json` references of `@types/node` to match the new version.

#### Upgrade Dependencies

To upgrade dependencies, run

```sh
yarn upgrade-dependencies
```

then run `yarn install` to apply package updates

_Note_: Might need to [upgrade yarn](#upgrade-yarn) if upgrading TypeScript as it has some dependency on Yarn integrating with it.

#### Upgrade Yarn

To upgrade the version of yarn used in the project, run

```sh
yarn set version latest
```

then [install](#install) to have the change picked up.

#### Upgrade Others

The following non-NodeJS related softwares should be monitored for upgrades:

- [MongoDB](https://www.mongodb.com/)
  - Change the docker image tag in the [compose yaml](./compose/docker-compose.yaml)
- [Caddy](https://caddyserver.com/)
  - Change the docker image tag in the [Caddy Dockerfile](./compose/caddy/caddy.Dockerfile)
- [Docker Compose](https://docs.docker.com/compose/)
  - Change the `composeVersion` variable in the [Jenkinsfile](./Jenkinsfile)
- [TestCafe Docker Image](https://hub.docker.com/r/testcafe/testcafe/)
  - Change the image tag in the [TestCafe Dockerfile](./test/e2e/e2e.Dockerfile)
