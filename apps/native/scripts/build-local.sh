#!/usr/bin/env bash
set -euo pipefail

PROFILE="${1:-preview}"
PLATFORM="${2:-android}"

BUILD_ROOT="${EAS_LOCAL_BUILD_ROOT:-$HOME/.cache/zeyn-eas-build}"
WORKINGDIR="$BUILD_ROOT/workingdir"
ARTIFACTS="$BUILD_ROOT/artifacts"

if findmnt -no FSTYPE "$(df -P "$BUILD_ROOT" 2>/dev/null | tail -1 | awk '{print $6}')" 2>/dev/null | grep -qx tmpfs; then
  echo "error: build root '$BUILD_ROOT' is on tmpfs (RAM)." >&2
  echo "A full Android build needs ~10GB of scratch space; on tmpfs it competes" >&2
  echo "with the compiler for memory and dies inside hermesc." >&2
  echo "Set EAS_LOCAL_BUILD_ROOT to a disk-backed path." >&2
  exit 1
fi

AVAIL_GB=$(df -BG --output=avail "$(dirname "$BUILD_ROOT")" | tail -1 | tr -dc '0-9')
if [ "${AVAIL_GB:-0}" -lt 15 ]; then
  echo "error: only ${AVAIL_GB}GB free at $BUILD_ROOT; need ~15GB." >&2
  exit 1
fi

if command -v eas >/dev/null 2>&1; then
  EAS=(eas)
else
  EAS=(npx --yes eas-cli@latest)
fi

rm -rf "$WORKINGDIR"
mkdir -p "$WORKINGDIR" "$ARTIFACTS"

echo "profile=$PROFILE platform=$PLATFORM"
echo "workingdir=$WORKINGDIR"
echo "artifacts=$ARTIFACTS"
echo "eas=${EAS[*]}"

EAS_LOCAL_BUILD_WORKINGDIR="$WORKINGDIR" \
EAS_LOCAL_BUILD_ARTIFACTS_DIR="$ARTIFACTS" \
  "${EAS[@]}" build --platform "$PLATFORM" --profile "$PROFILE" --local

echo
echo "artifacts:"
ls -la "$ARTIFACTS"
