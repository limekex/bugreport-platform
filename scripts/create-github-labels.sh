#!/usr/bin/env bash
# create-github-labels.sh
#
# Creates all GitHub labels required by the Stage Bug Reporter in the target
# repository. Run this once after the target repository is created and before
# the first bug report is submitted.
#
# Prerequisites:
#   - GitHub CLI (gh) installed and authenticated: https://cli.github.com
#   - Write access to the target repository
#
# Usage:
#   ./scripts/create-github-labels.sh <owner> <repo>
#
# Example:
#   ./scripts/create-github-labels.sh my-org my-stage-app
#
# The script is idempotent: re-running it will skip labels that already exist
# (gh label create exits with a non-zero code for duplicates, which we ignore).

set -euo pipefail

OWNER="${1:-}"
REPO="${2:-}"

if [[ -z "$OWNER" || -z "$REPO" ]]; then
  echo "Usage: $0 <owner> <repo>"
  exit 1
fi

TARGET="$OWNER/$REPO"
echo "Creating labels in $TARGET…"

create_label() {
  local name="$1"
  local color="$2"
  local description="$3"

  if gh label create "$name" \
       --repo "$TARGET" \
       --color "$color" \
       --description "$description" 2>/dev/null; then
    echo "  ✓ Created: $name"
  else
    echo "  · Exists:  $name (skipped)"
  fi
}

# ── Base labels ───────────────────────────────────────────────────────────────
# Note: 'bug' is a GitHub default label that already exists in most repos.
create_label "stage"        "0075ca" "Issue from staging environment"
create_label "needs-triage" "e4e669" "Needs human review"

# ── Severity labels ───────────────────────────────────────────────────────────
create_label "severity:blocker" "b60205" "App unusable / data loss"
create_label "severity:high"    "d93f0b" "Major feature broken"
create_label "severity:medium"  "e99695" "Feature partially broken"
create_label "severity:low"     "f9d0c4" "Minor / cosmetic issue"

echo ""
echo "Done. All labels are ready in $TARGET."
