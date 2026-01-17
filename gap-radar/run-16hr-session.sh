#!/bin/bash

# DemandRadar 16-Hour Autonomous Coding Session
# =============================================
# Features:
# - Rate limit detection with auto-resume
# - Waits 20 minutes after reset window starts
# - Tracks consecutive rate limits to avoid spinning

PROJECT_DIR="/Users/isaiahdupree/Documents/Software/WhatsCurrentlyInTheMarket/gap-radar"
LOG_FILE="$PROJECT_DIR/autonomous-session.log"
STATUS_FILE="$PROJECT_DIR/session-status.json"

# Session configuration
MAX_SESSIONS=500
SESSION_GAP_SECONDS=10
START_TIME=$(date +%s)
DURATION_HOURS=16
END_TIME=$((START_TIME + DURATION_HOURS * 3600))

# Rate limit configuration
RATE_LIMIT_WAIT_MINUTES=20
consecutive_rate_limits=0
max_rate_limit_hits=3

echo "=============================================="
echo "🚀 DemandRadar 16-Hour Autonomous Session"
echo "=============================================="
echo "Project: $PROJECT_DIR"
echo "Duration: $DURATION_HOURS hours"
echo "Max Sessions: $MAX_SESSIONS"
echo "Start: $(date)"
echo "End: $(date -r $END_TIME)"
echo ""

cd "$PROJECT_DIR"

# Update status
cat > "$STATUS_FILE" << EOF
{
  "project": "demandradar",
  "status": "running",
  "startTime": "$(date -Iseconds)",
  "endTime": "$(date -r $END_TIME -Iseconds)",
  "durationHours": $DURATION_HOURS,
  "maxSessions": $MAX_SESSIONS,
  "currentSession": 0,
  "pid": $$
}
EOF

# The coding prompt
PROMPT='You are an autonomous coding agent working on DemandRadar, a market gap analysis tool.

PROJECT PATH: /Users/isaiahdupree/Documents/Software/WhatsCurrentlyInTheMarket/gap-radar

TASK REFERENCE: See /Users/isaiahdupree/Documents/Software/WhatsCurrentlyInTheMarket/AGENT_TASKS.md for full task list.

CURRENT SPRINT: Comprehensive Testing & Quality (P0)

REFERENCE DOCS:
- PRD_DEMAND_BRIEF.md - New subscription feature spec
- feature_list.json - Full task list with all features

YOUR IMMEDIATE TASKS (in priority order):

== SPRINT 9: TESTING (P0 - CRITICAL) ==

1. TASK-100: Build Verification Tests (P0)
   - Create scripts/verify-build.ts
   - Verify npm run build succeeds with no errors
   - Add to package.json scripts

2. TASK-101: Page 404 Tests (P0)
   - Create e2e/pages.spec.ts with Playwright
   - Test ALL routes return 200 (not 404):
     /, /dashboard, /dashboard/runs, /dashboard/gaps, /dashboard/ideas,
     /dashboard/reports, /dashboard/ugc, /dashboard/trends, /dashboard/settings,
     /dashboard/new-run, /pricing, /login, /signup
   - Verify no broken links

3. TASK-102: Button Interaction Tests (P0)
   - Create e2e/buttons.spec.ts
   - Test every button on every page is clickable
   - Verify buttons trigger correct actions (navigation, modals, API calls)

4. TASK-103: Full Workflow E2E Tests (P0)
   - Create e2e/workflows/signup-to-report.spec.ts
   - Test: signup → login → create run → wait for completion → view report → export PDF
   - Create e2e/workflows/run-analysis.spec.ts

5. TASK-104: Data Hydration Tests (P0)
   - Create e2e/data-hydration.spec.ts
   - Verify pages load with correct data
   - No empty states when data exists in DB
   - Loading states work correctly

6. TASK-105: Page Functionality Audit (P0)
   - Create e2e/functionality-audit.spec.ts
   - Verify each page has WORKING functionality, not just UI
   - Test forms submit, filters work, sorting works, etc.

== SPRINT 10: DEMAND BRIEF FEATURE (P0) ==

After testing is complete, proceed to:

7. TASK-110: Demand Brief - Onboarding Flow
8. TASK-111: Demand Brief - Niche Config Schema  
9. TASK-112: Demand Brief - Niche API Routes
10. TASK-113: Demand Brief - My Niches Dashboard

See PRD_DEMAND_BRIEF.md for full feature specification.

EXISTING DATA API:
- GET /api/reports/[runId] - Returns full report data

TECH STACK:
- Next.js 14 (App Router)
- shadcn/ui components (import from @/components/ui/)
- Tailwind CSS
- Lucide icons (lucide-react)

INSTRUCTIONS:
1. First, read the existing code patterns in src/app/dashboard/
2. Check what data is available from /api/reports/[runId]
3. Create each component following existing patterns
4. Test that each component renders correctly
5. Update feature_list.json to mark completed tasks

Work through the tasks systematically. After completing each task, update the feature_list.json file to mark it as complete (passes: true).

START NOW - Begin with TASK-001.'

# Function to calculate wait time until 20 min after next reset
calculate_rate_limit_wait() {
    local reset_hour=$1
    local current_hour=$(date +%H)
    local current_min=$(date +%M)
    local current_sec=$(date +%S)
    
    # Calculate seconds until reset hour + 20 minutes
    local target_hour=$reset_hour
    local target_min=$RATE_LIMIT_WAIT_MINUTES
    
    # Get current time in seconds since midnight
    local current_secs=$((current_hour * 3600 + current_min * 60 + current_sec))
    local target_secs=$((target_hour * 3600 + target_min * 60))
    
    # If target is in the past, add 24 hours
    if [ $target_secs -le $current_secs ]; then
        target_secs=$((target_secs + 86400))
    fi
    
    local wait_secs=$((target_secs - current_secs))
    echo $wait_secs
}

# Function to parse reset time from rate limit message
parse_reset_time() {
    local message="$1"
    # Extract hour from "resets 3pm" or "resets 3am" format
    if echo "$message" | grep -q "resets"; then
        local reset_time=$(echo "$message" | grep -oE "resets [0-9]+[ap]m" | head -1)
        local hour=$(echo "$reset_time" | grep -oE "[0-9]+")
        local ampm=$(echo "$reset_time" | grep -oE "[ap]m")
        
        if [ "$ampm" = "pm" ] && [ "$hour" -ne 12 ]; then
            hour=$((hour + 12))
        elif [ "$ampm" = "am" ] && [ "$hour" -eq 12 ]; then
            hour=0
        fi
        echo $hour
    else
        echo "-1"
    fi
}

session=0
consecutive_errors=0
max_consecutive_errors=5

while [ $session -lt $MAX_SESSIONS ]; do
    current_time=$(date +%s)
    
    # Check if we've exceeded the time limit
    if [ $current_time -ge $END_TIME ]; then
        echo "$(date -Iseconds) 🏁 Time limit reached ($DURATION_HOURS hours)"
        break
    fi
    
    session=$((session + 1))
    echo "$(date -Iseconds) 🚀 Starting session $session" | tee -a "$LOG_FILE"
    
    # Update status
    cat > "$STATUS_FILE" << EOF
{
  "project": "demandradar",
  "status": "running",
  "startTime": "$(date -r $START_TIME -Iseconds)",
  "currentSession": $session,
  "pid": $$
}
EOF
    
    # Run claude with the prompt and capture output
    output_file=$(mktemp)
    claude --dangerously-skip-permissions -p "$PROMPT" 2>&1 | tee "$output_file" | tee -a "$LOG_FILE"
    exit_code=${PIPESTATUS[0]}
    
    # Check for rate limit in output
    if grep -q "hit your limit\|rate limit\|resets [0-9]" "$output_file"; then
        consecutive_rate_limits=$((consecutive_rate_limits + 1))
        echo "$(date -Iseconds) ⚠️ Rate limit detected (hit #$consecutive_rate_limits)" | tee -a "$LOG_FILE"
        
        # Parse reset time
        reset_hour=$(parse_reset_time "$(cat "$output_file")")
        
        if [ "$reset_hour" != "-1" ]; then
            wait_secs=$(calculate_rate_limit_wait $reset_hour)
            wait_mins=$((wait_secs / 60))
            
            echo "$(date -Iseconds) 💤 Sleeping until $RATE_LIMIT_WAIT_MINUTES min after reset (${wait_mins} minutes)" | tee -a "$LOG_FILE"
            
            # Update status to show waiting
            cat > "$STATUS_FILE" << EOF
{
  "project": "demandradar",
  "status": "rate_limited",
  "startTime": "$(date -r $START_TIME -Iseconds)",
  "currentSession": $session,
  "resumeAt": "$(date -r $(($(date +%s) + wait_secs)) -Iseconds)",
  "pid": $$
}
EOF
            sleep $wait_secs
            consecutive_rate_limits=0
            echo "$(date -Iseconds) 🔄 Resuming after rate limit wait" | tee -a "$LOG_FILE"
        else
            # Couldn't parse reset time, use default 1 hour wait
            echo "$(date -Iseconds) 💤 Couldn't parse reset time, waiting 1 hour" | tee -a "$LOG_FILE"
            sleep 3600
        fi
        
        rm -f "$output_file"
        continue
    fi
    
    rm -f "$output_file"
    
    if [ $exit_code -eq 0 ]; then
        echo "$(date -Iseconds) ✅ Session $session completed successfully" | tee -a "$LOG_FILE"
        consecutive_errors=0
        consecutive_rate_limits=0
    else
        echo "$(date -Iseconds) ❌ Session $session failed with code $exit_code" | tee -a "$LOG_FILE"
        consecutive_errors=$((consecutive_errors + 1))
        
        if [ $consecutive_errors -ge $max_consecutive_errors ]; then
            echo "$(date -Iseconds) ❌ Too many consecutive errors ($consecutive_errors). Stopping." | tee -a "$LOG_FILE"
            break
        fi
        
        # Back off on errors
        sleep_time=$((30 * consecutive_errors))
        echo "$(date -Iseconds) ⏸️ Backing off for ${sleep_time}s" | tee -a "$LOG_FILE"
        sleep $sleep_time
    fi
    
    # Gap between sessions
    echo "$(date -Iseconds) ⏳ Waiting ${SESSION_GAP_SECONDS}s before next session" | tee -a "$LOG_FILE"
    sleep $SESSION_GAP_SECONDS
done

echo "$(date -Iseconds) 🏁 Session complete. Total sessions: $session" | tee -a "$LOG_FILE"

cat > "$STATUS_FILE" << EOF
{
  "project": "demandradar",
  "status": "complete",
  "totalSessions": $session,
  "endTime": "$(date -Iseconds)"
}
EOF
