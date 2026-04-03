# Issue Format

This document describes the exact GitHub Issue format used when a bug report is submitted.

---

## Issue title

```
[Stage Bug]: <summary>
```

**Example:**

```
[Stage Bug]: Login button does nothing on /login page
```

---

## Default labels

Every issue gets these labels:

| Label | Purpose |
|---|---|
| `bug` | Standard GitHub bug label |
| `stage` | Marks the issue as coming from a staging environment |
| `needs-triage` | Signals that it needs human review before being acted on |

## Severity labels

Exactly one severity label is added per issue:

| Label | Meaning |
|---|---|
| `severity:blocker` | App is unusable / data loss risk |
| `severity:high` | Major feature broken, no workaround |
| `severity:medium` | Feature partially broken, workaround exists |
| `severity:low` | Minor cosmetic or UX issue |

---

## Issue body template

```markdown
## Summary

<summary text>

## Environment

**Environment:** staging
**App version:** 1.2.3
**Commit SHA:** abc1234
**Build number:** 98
**Page URL:** https://stage.reginor.events/login
**Route:** /login

## Reporter

**Tester ID:** tester-001
**Tester role:** qa
**Contact email:** tester@reginor.events

## Severity

**HIGH**

## What happened

<whatHappened text>

## Expected result

<expectedResult text>

## Actual result

<actualResult text>

## Steps to reproduce

<stepsToReproduce text>

## Technical context

**Browser:** Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...
**Operating system:** macOS 14.4.1
**Viewport:** 1440x900
**Locale:** en-GB
**Trace ID:** 4bf92f3577b34da6a3ce929d0e0e4736

## Screenshot

![Screenshot](https://cdn.bugreport.betait.no/screenshots/1234567890.png)

## Optional client errors

```json
[
  {
    "message": "TypeError: Cannot read properties of undefined (reading 'id')",
    "stack": "..."
  }
]
```

## Notes

<notes text>
```

---

## Label creation

Before the first bug report is submitted, create the following labels in the target GitHub repository:

```bash
# Base labels
gh label create "stage"           --color "#0075ca" --description "Issue from staging environment"
gh label create "needs-triage"    --color "#e4e669" --description "Needs human review"

# Severity labels
gh label create "severity:blocker" --color "#b60205" --description "App unusable / data loss"
gh label create "severity:high"    --color "#d93f0b" --description "Major feature broken"
gh label create "severity:medium"  --color "#e99695" --description "Feature partially broken"
gh label create "severity:low"     --color "#f9d0c4" --description "Minor / cosmetic issue"
```
