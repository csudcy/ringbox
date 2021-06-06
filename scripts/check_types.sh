#!/bin/bash
#
# Check types for this service.

# Change to the parent directory
cd "${BASH_SOURCE%/*}"
cd ..

# Run the tests
./scripts/poetry_run.sh pytype --config=pytype.cfg
