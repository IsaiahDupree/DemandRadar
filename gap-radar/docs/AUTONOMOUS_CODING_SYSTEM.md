# Autonomous Coding System (Unified)

This repo supports autonomous coding via **a single, shared harness runner** that can be pointed at any project (including this one) and produces a consistent set of “harness artifacts” that dashboards/monitors can read (“hydrate”) into UI.

## Goal

- One runner (same infra) for all projects
- One artifact schema (status, metrics, logs)
- Easy start/stop
- Optional display (dashboard) that can hydrate from project artifacts

## Recommended Standard (One Infra)

**Canonical runner:** `autonomous-coding-dashboard/harness/run-harness-v2.js`

This runner:
- Runs Claude in repeatable sessions
- Handles rate limits and retries
- Writes progress + status artifacts to the **project root** so any UI can read them

## Harness Artifacts (Project Root)

These files are the contract between “the runner” and “the display”:

- `feature_list.json`
  - Source-of-truth task list (features/tasks). The agent marks `passes: true`.
- `claude-progress.txt`
  - Human-readable session summary log.
- `harness-status.json`
  - Machine-readable current state (running/completed/failed/rate_limited/etc).
- `harness-metrics.json`
  - Machine-readable counters (sessions, failures, rate limits, token totals).
- `harness-output.log`
  - Combined harness logs + Claude output stream (tail-able).

### Legacy Artifacts (Older Runner)

If you start autonomy via `run-16hr-session.sh`, it uses:
- `session-status.json`
- `autonomous-session.log`

These are considered legacy; the unified harness uses the `harness-*` artifacts above.

## How to Start (Recommended)

### Option A: Start from the dashboard repo (recommended)

From:
`/Users/isaiahdupree/Documents/Software/autonomous-coding-dashboard`

Run:

- `./scripts/start-demandradar-harness.sh 500`

This starts the unified harness against this repo and writes artifacts into:
- `/Users/isaiahdupree/Documents/Software/WhatsCurrentlyInTheMarket/gap-radar/*`

### Option B: Start directly (no dashboard scripts)

From this repo root:
`/Users/isaiahdupree/Documents/Software/WhatsCurrentlyInTheMarket/gap-radar`

Run:

- `node /Users/isaiahdupree/Documents/Software/autonomous-coding-dashboard/harness/run-harness-v2.js \
  --project demandradar \
  --path "/Users/isaiahdupree/Documents/Software/WhatsCurrentlyInTheMarket/gap-radar" \
  --prompt "/Users/isaiahdupree/Documents/Software/autonomous-coding-dashboard/harness/prompts/demandradar.md" \
  --continuous \
  --duration-hours 16 \
  --max-sessions 500`

## Monitoring (CLI)

From project root:

- `cat harness-status.json`
- `tail -n 200 harness-output.log`
- `tail -n 50 claude-progress.txt`

## Monitoring (Dashboard “Hydration”)

The dashboard is able to hydrate UI from these artifacts (at minimum `feature_list.json` + `claude-progress.txt`, and optionally `harness-output.log` for live logs).

The key requirement is **consistent file names in the project root** (the list above). With that, any watcher can:
- Read initial state
- Subscribe to file changes
- Push updates over WebSocket/SSE to the UI

## Consolidation Plan (What to Keep vs Deprecate)

### Keep (core infra)

- `autonomous-coding-dashboard/harness/run-harness-v2.js`
- Dashboard watcher/UI (optional) that reads artifacts

### Convert to thin wrappers (keep if you like)

- Project start scripts should only:
  - select a project path
  - select a prompt file
  - pass duration/session limits
  - call `run-harness-v2.js`

### Deprecate (duplicate runners)

- Any project-specific custom runner logic that duplicates:
  - session loops
  - rate limit handling
  - status reporting

Specifically for this repo:
- `run-16hr-session.sh` should be considered legacy and eventually replaced by calling `run-harness-v2.js` directly.

## Notes on “Efficiency”

The unified harness is more efficient than bash loops because it:
- Avoids duplicated ad-hoc scripts per project
- Uses consistent backoff/error classification
- Produces a standard telemetry surface (status/metrics/log)

