#!/bin/bash
#
# Check imports for this microservice.

# Change to the parent directory
cd "${BASH_SOURCE%/*}"
cd ..

# Run the tests
./scripts/poetry_run.sh isort src
