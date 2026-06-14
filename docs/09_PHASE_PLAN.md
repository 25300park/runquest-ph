# 09_PHASE_PLAN.md

# Phase Plan

## Project Name

**RunQuest PH**

## Development Strategy

RunQuest PH will be developed step by step.

The first development goal is not a full backend system.
The first goal is to create a mobile-first PWA prototype that can be shown to local running crews for feedback.

The PWA prototype should clearly show:

* App concept
* Character selection
* Area exploration
* Map-based route experience
* Course detail screen
* Activity tracking concept
* XP and level reward flow
* Profile progress

Backend development will start after the PWA concept receives feedback.

---

# Phase 0: Documentation

## Goal

Create all planning documents before coding.

## Documents

* 01_PROJECT_OVERVIEW.md
* 02_FEATURE_SCOPE.md
* 03_GAME_SYSTEM.md
* 04_USER_FLOW.md
* 05_CHARACTER_SYSTEM.md
* 06_COURSE_AND_MAP_SYSTEM.md
* 07_DATABASE_DESIGN.md
* 08_SCREEN_FLOW.md
* 09_PHASE_PLAN.md
* AGENTS.md
* README.md

## Completion Criteria

Phase 0 is complete when Codex can read the documents and understand the project direction.

---

# Phase 1: PWA Project Setup

## Goal

Create the base PWA frontend project.

## Recommended Stack

* React
* TypeScript
* Vite
* vite-plugin-pwa
* Tailwind CSS
* Leaflet
* OpenStreetMap
* Mock data

## Tasks

1. Create Vite React TypeScript project.
2. Install PWA plugin.
3. Install map library.
4. Install styling system.
5. Create folder structure.
6. Add basic routing.
7. Add mock data files.
8. Add app manifest.
9. Add basic mobile layout.

## Completion Criteria

* App runs locally.
* PWA structure exists.
* Home screen loads.
* Mobile layout works.
* No backend required.

---

# Phase 2: Pre-Login Landing Screen

## Goal

Create a static marketing-style landing screen.

## Tasks

1. Add hero section.
2. Add slogan.
3. Add app concept summary.
4. Add character preview.
5. Add area preview.
6. Add sign up and login buttons.
7. Add placeholder marketing image/video area.

## Screen Direction

The landing screen should encourage sign-up.

It should not show all detailed courses.

## Completion Criteria

A new visitor understands the app concept within 10 seconds.

---

# Phase 3: Mock Login and Registration Flow

## Goal

Create frontend-only login and registration screens.

## Tasks

1. Create login screen.
2. Create registration screen.
3. Use mock authentication state.
4. Redirect registered user to character selection.
5. Redirect returning user to exploration map.

## Notes

No real backend authentication in this phase.

## Completion Criteria

User can move through the app flow using mock login.

---

# Phase 4: Character Selection Screen

## Goal

Create a story-centered character selection screen.

## Initial Characters

1. The Explorer
2. The Challenger
3. The Guardian

## Tasks

1. Create character cards.
2. Add character images or placeholders.
3. Add short stories.
4. Add journey style.
5. Add recommended user type.
6. Save selected character in local state or localStorage.

## Completion Criteria

User can select one of three characters and continue.

---

# Phase 5: Area Selection Screen

## Goal

Allow user to choose the first exploration area.

## Initial Areas

1. BGC
2. Makati / Ayala Triangle
3. MOA / Pasay

## Tasks

1. Create area cards.
2. Add area images or placeholders.
3. Add descriptions.
4. Add sample course count.
5. Save selected area in local state or localStorage.

## Completion Criteria

User can choose an area and enter the exploration map.

---

# Phase 6: Exploration Map Screen

## Goal

Create the main map-centered home screen.

## Tasks

1. Display selected area map.
2. Show current area progress.
3. Show sample route markers.
4. Show course cards in bottom panel.
5. Show user level and XP.
6. Show character icon.
7. Use Leaflet and OpenStreetMap.

## Completion Criteria

The screen feels like a map-based exploration app.

---

# Phase 7: Course Detail Screen

## Goal

Show detailed course information.

## Tasks

1. Show full course map.
2. Show route line.
3. Show start and finish points.
4. Show checkpoints.
5. Show POIs.
6. Show distance, difficulty, XP, and exploration reward.
7. Show safety notes.
8. Add Start Course button.

## Completion Criteria

User can understand the route before starting.

---

# Phase 8: Activity Tracking Mock Screen

## Goal

Create a visual activity tracking screen.

## Tasks

1. Show map-centered activity screen.
2. Show current location mock marker.
3. Show route progress.
4. Show distance completed.
5. Show time elapsed.
6. Show next checkpoint.
7. Add Pause and Finish buttons.
8. Add small character icon or animation placeholder.

## Notes

This phase uses mock tracking data.

Real GPS can be added later.

## Completion Criteria

The screen communicates how real activity tracking will work.

---

# Phase 9: Quest Completed Screen

## Goal

Create the reward screen after activity completion.

## Tasks

1. Show Quest Completed message.
2. Show XP earned.
3. Show level progress.
4. Show area exploration progress.
5. Show badge unlock placeholder.
6. Show next recommended course.

## Completion Criteria

The user feels rewarded after completing a route.

---

# Phase 10: Profile and Progress Screen

## Goal

Create user progress screen.

## Tasks

1. Show selected character.
2. Show current level.
3. Show total XP.
4. Show total distance.
5. Show completed courses.
6. Show badges.
7. Show area progress.

## Completion Criteria

User can see long-term growth.

---

# Phase 11: Feedback-Ready Prototype

## Goal

Prepare the PWA prototype for running crew feedback.

## Tasks

1. Polish mobile UI.
2. Add sample data for BGC, Makati, and MOA.
3. Add placeholder images.
4. Add simple feedback button or form link.
5. Test on mobile browser.
6. Verify PWA install behavior.

## Completion Criteria

The app can be shown to real users for feedback.

---

# Phase 12: Backend Planning

## Goal

Plan backend after frontend feedback.

## Tasks

1. Review feedback.
2. Finalize data model.
3. Confirm auth method.
4. Confirm course creation workflow.
5. Confirm GPS tracking data policy.
6. Confirm subscription direction.

## Completion Criteria

Backend implementation plan is ready.

---

# Phase 13: Backend API Development

## Goal

Start real backend API development.

## Possible Stack

* Node.js
* Express
* MySQL or MariaDB
* JWT authentication
* Admin API
* Course API
* Activity API

## Tasks

1. User auth API
2. Character API
3. Area API
4. Course API
5. Activity API
6. XP API
7. Admin course manager API

## Completion Criteria

Frontend can connect to real backend data.
