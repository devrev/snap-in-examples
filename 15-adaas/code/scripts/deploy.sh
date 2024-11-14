#!/usr/bin/env bash

echo "Creating Snap-in version..."

# shellcheck disable=SC2086 # $DR_OPTS is intentionally split here
VER_OUTPUT=$(devrev snap_in_version create-one $DR_OPTS \
  --path "." \
  --create-package | tee /dev/tty)

FILTERED_OUTPUT=$(grep "snap_in_version" <<<"$VER_OUTPUT" | grep -o '{.*}')

# Check if DevRev CLI returned an error (error messages contain the field 'message')
if ! jq '.message' <<<"$FILTERED_OUTPUT" | grep null >/dev/null; then
  exit 1
fi

VERSION_ID=$(jq -r '.snap_in_version.id' <<<"$FILTERED_OUTPUT")

echo "Waiting 10 seconds for Snap-in version to be ready..."
sleep 10

while :; do
  # shellcheck disable=SC2086 # $DR_OPTS is intentionally split here
  VER_OUTPUT2=$(devrev snap_in_version show $DR_OPTS "$VERSION_ID")
  STATE=$(jq -r '.snap_in_version.state' <<<"$VER_OUTPUT2")
  if [[ "$STATE" == "build_failed" ]] || [[ "$STATE" == "deployment_failed" ]]; then
    echo "Snap-in version build/deployment failed: $(jq -r '.snap_in_version.failure_reason' <<<"$VER_OUTPUT2")"
    exit 1
  elif [[ "$STATE" == "ready" ]]; then

    break
  else
    echo "Snap-in version's state is $STATE, waiting 10 seconds..."
    sleep 10
  fi
done

echo "Creating Snap-in draft..."

# shellcheck disable=SC2086 # $DR_OPTS is intentionally split here
DRAFT_OUTPUT=$(devrev snap_in draft $DR_OPTS --snap_in_version "$VERSION_ID")
jq <<<"$DRAFT_OUTPUT"
echo "Snap-in draft created. Please go to the Snap-ins page in the DevRev UI to complete the installation process."

# Check if DevRev CLI returned an error (error messages contain the field 'message')
if ! jq '.message' <<<"$DRAFT_OUTPUT" | grep null >/dev/null; then
  exit 1
fi
