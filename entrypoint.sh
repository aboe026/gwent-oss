#!/bin/sh
set -e

# Find the Yarn release file dynamically
YARN_RELEASE="$(ls .yarn/releases | head -n 1)"

# Run Yarn via Node, bypassing Corepack
exec node ".yarn/releases/$YARN_RELEASE" "$@"
