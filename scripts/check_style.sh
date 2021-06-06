#!/bin/bash
#
# Check style for this service.

# Change to the parent directory
cd "${BASH_SOURCE%/*}"
cd ..

# Run the tests
./scripts/poetry_run.sh yapf -vv -r -i . -e "**/*_pb2.py"
