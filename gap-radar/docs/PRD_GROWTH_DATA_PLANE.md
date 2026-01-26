# PRD: Growth Data Plane for GapRadar

**Status:** Active  
**Created:** 2026-01-25  
**Priority:** P0  
**Reference:** `autonomous-coding-dashboard/harness/prompts/PRD_GROWTH_DATA_PLANE.md`

## Overview

Implement the Growth Data Plane for GapRadar: unified event tracking across email, web, app, and billing with segmentation and automated activation.

## GapRadar-Specific Events

| Event | Source | Segment Trigger |
|-------|--------|-----------------|
| `landing_view` | web | - |
| `signup_started` | web | - |
| `signup_completed` | web | new_signup_no_activation_24h |
| `run_created` | app | activated |
| `run_completed` | app | first_value |
| `report_downloaded` | app | aha_moment |
| `pricing_viewed` | web | high_intent (if 2+) |
| `checkout_started` | web | checkout_started_no_purchase_4h |
| `purchase_completed` | stripe | - |
| `email.delivered` | resend | - |
| `email.opened` | resend | - |
| `email.clicked` | resend | newsletter_clicker |

## Supabase Schema

Apply the base schema from the main PRD, plus:

```sql
-- GapRadar-specific: runs tracking
create table if not exists gap_run (
  run_id uuid primary key default gen_random_uuid(),
  person_id uuid references person(person_id),
  niche text,
  keywords text[],
  gaps_found int,
  demand_score_avg numeric,
  created_at timestamptz not null default now()
);
```

## Segments for GapRadar

1. **new_signup_no_run_24h** → email: "Create your first gap run in 60 seconds"
2. **run_completed_no_download_48h** → email: "Your gap report is ready to download"
3. **pricing_viewed_2plus_not_paid** → email: "Which plan fits your research needs?" + Meta
4. **high_usage_free_tier** → email: "You're running out of free runs"
5. **newsletter_clicker_not_signed_up** → email: "Find your first market gap today"

## Features

| ID | Name | Priority |
|----|------|----------|
| GDP-001 | Supabase Schema Setup | P0 |
| GDP-002 | Person & Identity Tables | P0 |
| GDP-003 | Unified Events Table | P0 |
| GDP-004 | Resend Webhook Edge Function | P0 |
| GDP-005 | Email Event Tracking | P0 |
| GDP-006 | Click Redirect Tracker | P1 |
| GDP-007 | Stripe Webhook Integration | P1 |
| GDP-008 | Subscription Snapshot | P1 |
| GDP-009 | PostHog Identity Stitching | P1 |
| GDP-010 | Meta Pixel + CAPI Dedup | P1 |
| GDP-011 | Person Features Computation | P1 |
| GDP-012 | Segment Engine | P1 |
