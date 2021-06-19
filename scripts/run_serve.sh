#!/bin/bash
#
# Run the server for this service.

# Change to the parent directory
cd "${BASH_SOURCE%/*}"
cd ..

cd src
../scripts/poetry_run.sh uvicorn main:app --reload --reload-dir=../src/
