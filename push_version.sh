#!/bin/bash

git add .

# Get the package version from package.json
version=$(sed -n 's/.*"version": "\(.*\)".*/\1/p' package.json)

echo "Version: $version"

# Commit with the version
git commit -m "Version $version"

# Push the commit
git push

# Push tags
git push --tags 