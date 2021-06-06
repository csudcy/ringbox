#!/bin/bash
#
# Execute a command using poetry (after checking that the env has been setup)

if [ -z "$(poetry env list)" ]; then
  npm run deps:install
fi

poetry run $@
