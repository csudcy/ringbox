#!/bin/bash
#
# Update dependencies for this service.

# Change to the parent directory
cd "${BASH_SOURCE%/*}"
cd ..

echo "Upgrading pip..."
poetry run pip install --upgrade pip

echo "Updating dependencies..."
poetry update

echo "Generating requirements.txt file..."
poetry export --format=requirements.txt --without-hashes > src/requirements.txt
