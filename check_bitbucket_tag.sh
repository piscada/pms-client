#!/bin/bash
# Ensure the tag follows the semantic versioning format (vX.Y.Z)
if [[ "$BITBUCKET_TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Latest tag: $BITBUCKET_TAG"
else
    echo "Latest tag doesn't follow semantic versioning format (vX.Y.Z). Exiting."
    exit 1
fi
