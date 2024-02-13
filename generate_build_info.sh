#!/bin/bash

# Get PMS version from package.json
CLIENT_VERSION=$(grep '"version"' package.json | cut -d '"' -f 4 | head -n 1)

# Get current build date
BUILD_DATE=$(date +'%d-%m-%Y_%H:%M:%S')

# Create JSON string
JSON="{\"buildDate\": \"${BUILD_DATE}\", \"version\": \"${CLIENT_VERSION}\"}"

# Write JSON to file
echo "$JSON" > clientInfo.json
