#!/usr/bin/env bash

source "$(dirname "$0")"/shared.sh

# shellcheck disable=SC2086 # $DR_OPTS is intentionally split here
PACKAGES="$(devrev snap_in_package list $DR_OPTS)"
if [ -z "$PACKAGES" ]; then
    echo "No snap-in packages found"
    exit 0
fi

PACKAGE_ID="$(jq -csr '.[0].id' <<< "$PACKAGES")"
if [ -z "$PACKAGE_ID" ]; then
    echo "Failed to get snap-in package ID"
    exit 1
fi

# shellcheck disable=SC2086 # $DR_OPTS is intentionally split here
VERSIONS="$(devrev snap_in_version list $DR_OPTS --package "$PACKAGE_ID")"
if [ -z "$VERSIONS" ]; then
    echo "No snap-in versions found"
else
  VERSION_ID="$(jq -csr '.[0].id' <<< "$VERSIONS")"
  if [ -n "${VERSION_ID}" ]; then
      echo "Deleting snap-in version ${VERSION_ID}"

      # shellcheck disable=SC2086 # $DR_OPTS is intentionally split here
      devrev snap_in_version delete-one $DR_OPTS "${VERSION_ID}" || exit 1
  fi
fi

echo "Deleting snap-in package ${PACKAGE_ID}"

# shellcheck disable=SC2086 # $DR_OPTS is intentionally split here
devrev snap_in_package delete-one $DR_OPTS "${PACKAGE_ID}"
