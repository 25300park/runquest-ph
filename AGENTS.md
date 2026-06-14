# AGENTS.md

# RunQuest PH - Codex Project Instructions

## 1. Project Identity

This project is **RunQuest PH**.

RunQuest PH is a mobile-first PWA running adventure app for local users in the Philippines.

The app turns walking, jogging, and running into a game-style exploration journey. Users select a character, choose an area, explore real local routes, complete courses, earn XP, level up, and increase area exploration progress.

The first prototype must focus on **frontend PWA screens only**.

Do not build the backend until the frontend prototype receives user feedback.

---

## 2. Current Development Goal

The current goal is to create a feedback-ready PWA prototype.

The prototype should be good enough to show to local running crews and ask:

* Does this app concept feel interesting?
* Would you use this for walking, jogging, or running?
* Does the map-based exploration feel useful?
* Do the characters make the experience more fun?
* Are the course screens easy to understand?

---

## 3. Product Direction

The app should feel like:

* A running adventure app
* A local Philippine exploration app
* A light RPG-style progress app
* A beginner-friendly walking and jogging app
* A character growth experience

The app should not feel like:

* A strict medical fitness app
* A stressful daily habit tracker
* A serious marathon-only app
* A generic map app
* A random ad-based app

Core feeling:

> Explore your city. Grow your character. Build your running habit.

---

## 4. Target Users

Primary users are local users in the Philippines.

Initial target areas:

* BGC
* Makati / Ayala Triangle
* MOA / Pasay

Main user groups:

* Beginners who want to start walking or jogging
* Office workers who need a light exercise habit
* Casual runners
* Local running crew members
* People who enjoy games, progress, and exploration

Use simple, clear English for all user-facing text.

---

## 5. Development Priority

Build the project in this order:

1. Documentation
2. PWA frontend setup
3. Landing screen
4. Mock login / registration flow
5. Character selection screen
6. Area selection screen
7. Exploration map screen
8. Course detail screen
9. Activity tracking mock screen
10. Quest completed screen
11. Profile / progress screen
12. Feedback-ready prototype
13. Backend planning
14. Backend API development

Do not skip phases unless explicitly instructed.

---

## 6. Technical Stack

Use this stack for the PWA prototype:

* React
* TypeScript
* Vite
* vite-plugin-pwa
* Tailwind CSS
* Leaflet
* OpenStreetMap
* Mock data

Do not add backend dependencies during the PWA prototype phase.

Do not add database code during the PWA prototype phase.

Do not add real authentication during the PWA prototype phase.

Use mock data and local state or localStorage where needed.

---

## 7. Recommended Project Structure

Use or preserve this structure:

```text
runquest-ph/
  docs/
    01_PROJECT_OVERVIEW.md
    02_FEATURE_SCOPE.md
    03_GAME_SYSTEM.md
    04_USER_FLOW.md
    05_CHARACTER_SYSTEM.md
    06_COURSE_AND_MAP_SYSTEM.md
    07_DATABASE_DESIGN.md
    08_SCREEN_FLOW.md
    09_PHASE_PLAN.md

  public/
    icons/
    images/
      characters/
      areas/
      marketing/

  src/
    app/
      App.tsx
      routes.tsx

    components/
      layout/
      map/
      character/
      course/
      progress/
      ui/

    data/
      mockAreas.ts
      mockCharacters.ts
      mockCourses.ts
      mockUser.ts

    pages/
      LandingPage.tsx
      LoginPage.tsx
      RegisterPage.tsx
      CharacterSelectPage.tsx
      AreaSelectPage.tsx
      ExplorationMapPage.tsx
      CourseDetailPage.tsx
      ActivityTrackingPage.tsx
      QuestCompletedPage.tsx
      ProfilePage.tsx

    types/
      area.ts
      character.ts
      course.ts
      activity.ts
      user.ts

    utils/
      xp.ts
      route.ts
      difficulty.ts

    styles/
      index.css

  AGENTS.md
  README.md
  package.json
  vite.config.ts
  tsconfig.json
```

If the project already has a working structure, do not rewrite everything without permission.

---

## 8. Core Screens

The PWA prototype should eventually include these screens:

### Pre-login

* Landing page
* Login page
* Register page

### Onboarding

* Character selection page
* Area selection page

### Main App

* Exploration map page
* Course detail page
* Activity tracking mock page
* Quest completed page
* Profile page

### Later Admin / Creator

* Admin course manager
* Course route editor
* Creator course draft screen
* Course approval queue

Admin and creator screens are not required in the first frontend prototype unless specifically requested.

---

## 9. UX Rules

Follow these product UX rules:

### Map First

The main logged-in screen should be map-centered.

The user should feel:

> Where do I want to explore today?

### Quest Optional

Do not make daily quests feel mandatory.

Avoid guilt-based messages.

Avoid:

```text
You missed your workout.
You failed today's quest.
You must run today.
```

Prefer:

```text
Your next route is waiting.
Explore one more route when you're ready.
Continue your journey.
```

### Character Emotional

Characters should create emotional connection.

Characters should not make users feel judged by weight, body type, or fitness level.

### Stats Supportive

Stats should support motivation, not pressure.

Show XP, level, exploration progress, distance, and badges in a positive way.

---

## 10. Character System Rules

The MVP starts with 3 human-style characters:

1. The Explorer
2. The Challenger
3. The Guardian

Character selection should be story-centered, not number-centered.

Each character should have:

* Name
* Short story
* Journey style
* Recommended user type
* Small bonus or future bonus concept

Do not overemphasize numerical stats during character selection.

Do not label characters by negative body type.

Do not use language that judges the user’s weight, body shape, or fitness level.

Character differences should be small in the MVP.

Suggested bonus range:

* 3% to 5% maximum

The user should be able to change character later.

---

## 11. Course and Map Rules

The app uses real route-based courses.

Each course should support:

* Area
* Distance
* Difficulty
* XP reward
* Exploration reward
* Start point
* Finish point
* Route line
* Checkpoints
* POIs
* Safety notes

The course map should work like a running version of a golf course app.

Show:

* Full route
* Current user location
* Start point
* Finish point
* Checkpoints
* Next checkpoint
* Remaining distance
* Completed distance
* POIs
* Safety or caution markers

Use mock route data in the PWA prototype.

Do not require real GPS tracking in the early prototype unless explicitly requested.

---

## 12. Checkpoint Rules

Courses should support checkpoints.

Checkpoint types may include:

* START
* CHECKPOINT
* REST
* VIEW_SPOT
* WATER
* TOILET
* CAFE
* CAUTION
* FINISH

The map should eventually show the user’s progress from checkpoint to checkpoint.

---

## 13. POI Rules

POI means Point of Interest.

POIs may include:

* Photo spot
* Cafe
* Toilet
* Drinking water
* Convenience store
* Rest area
* Park
* Viewpoint
* Safety point
* Caution area

In the PWA prototype, use mock POI data.

Later, POIs may come from:

* Admin manual input
* Approved creator input
* OpenStreetMap / Overpass API candidates
* User feedback
* Google or Mapbox candidates

Do not automatically publish external POI data without admin review in future backend phases.

---

## 14. XP and Game System Rules

The core game system includes:

* XP
* Level
* Area exploration progress
* Badges
* Character growth

Suggested XP formula direction:

```text
Final XP =
Base Distance XP
× Difficulty Multiplier
× Performance Multiplier
+ Streak Bonus
- Penalty
```

Base rule:

```text
1 km = 100 XP
```

Difficulty multiplier direction:

```text
Easy: × 1.0
Normal: × 1.2
Hard: × 1.5
Challenge: × 2.0
```

Area exploration should consider both:

* Completed course count
* Total distance completed in the area

Suggested direction:

```text
Area Progress =
Course Completion Progress × 70%
+ Distance Progress × 30%
```

For the prototype, calculations may be simplified and based on mock data.

---

## 15. Activity Tracking Rules

The first PWA prototype should use mock activity tracking.

Activity tracking screen should be map-centered.

Show:

* Current location marker
* Route line
* Completed route segment
* Remaining route segment
* Next checkpoint
* Distance completed
* Time elapsed
* Average pace
* Pause button
* Finish button

The character may appear as a small avatar or icon.

Do not make the character animation the main focus during activity tracking.

Future versions may support:

* GPS tracking
* Watch data
* Heart rate
* Step count
* Pace-based character animation
* Live route progress

---

## 16. Free and Premium Direction

The app should focus on user growth first.

Free users should be able to use the core app.

Free users should access:

* Basic official courses
* Approved creator courses
* Basic map view
* Basic GPS tracking in future
* Basic XP
* Basic level system
* Basic area exploration
* Basic character system

Premium should add depth and benefits, not block the core experience.

Future premium features may include:

* Advanced statistics
* Personalized goal plans
* AI running coach
* Premium routes
* Fantasy map themes
* Special badges
* Character items
* Watch data integration
* Event discounts
* Partner gift cards
* Partner discount coupons

Do not add payment implementation in the early PWA prototype unless explicitly requested.

---

## 17. Coding Rules

Follow these rules when modifying code:

* Read relevant docs before coding.
* Work on one phase at a time.
* Keep changes small and understandable.
* Do not delete working code without permission.
* Do not rewrite the entire project unless explicitly asked.
* Preserve existing structure unless there is a clear reason to improve it.
* Prefer reusable components.
* Use TypeScript types for core data structures.
* Keep mock data separate from UI components.
* Keep UI text in English.
* Avoid hardcoding large datasets inside page components.
* Use mobile-first layout.
* Avoid unnecessary dependencies.
* Do not include secrets or API keys.
* Do not modify `.env` files directly.
* Use `.env.example` for sample environment variables if needed.

---

## 18. Styling Rules

Use a clean mobile-first design.

The visual direction should feel:

* Friendly
* Bright
* Local
* Adventure-oriented
* Beginner-friendly
* Light game-like
* Not too serious
* Not too childish

Use Tailwind CSS utility classes unless the project later adopts a different styling system.

Keep components readable.

Avoid overcomplicated animations in early phases.

Use placeholder images if final assets are not available.

---

## 19. Map Implementation Rules

Use Leaflet and OpenStreetMap for the initial low-cost prototype unless instructed otherwise.

Use mock coordinates for:

* BGC
* Makati / Ayala Triangle
* MOA / Pasay

Keep route data in mock files.

Preferred route data format for prototype:

* GeoJSON LineString
* Coordinate arrays

Do not require Google Maps, Mapbox, or paid APIs in the first prototype.

---

## 20. Testing and Verification

After code changes, try to run available checks.

Common commands may include:

```bash
npm run dev
npm run build
npm run lint
```

If a command does not exist, do not invent it.
Instead, mention that the command is not configured.

Before finishing a task, summarize:

* What was changed
* Which files were changed
* How to run the project
* Any known issues
* What should be done next

---

## 21. Git Rules

Use Git carefully.

Before changes:

```bash
git status
```

After changes:

```bash
git status
git diff
```

Recommended commit style:

```text
Phase 1: initialize PWA frontend skeleton
Phase 2: add landing screen
Phase 3: add mock auth flow
Phase 4: add character selection
Phase 5: add area selection
Phase 6: add exploration map
```

Do not commit automatically unless explicitly instructed.

---

## 22. Documentation Rules

Keep documentation updated when project direction changes.

Use the `docs/` folder for planning documents.

Important docs:

* `01_PROJECT_OVERVIEW.md`
* `02_FEATURE_SCOPE.md`
* `03_GAME_SYSTEM.md`
* `04_USER_FLOW.md`
* `05_CHARACTER_SYSTEM.md`
* `06_COURSE_AND_MAP_SYSTEM.md`
* `07_DATABASE_DESIGN.md`
* `08_SCREEN_FLOW.md`
* `09_PHASE_PLAN.md`

When implementing a phase, check the relevant document first.

If implementation differs from documentation, mention it clearly.

---

## 23. Backend Restriction for Early Phases

Do not build backend code during the initial PWA prototype unless explicitly instructed.

Do not add:

* Express server
* Database connection
* Authentication API
* Payment API
* Admin API
* Watch integration API

These will be handled after frontend feedback.

---

## 24. Security and Privacy Rules

Even during prototype development:

* Do not expose secrets.
* Do not store real passwords in code.
* Do not use real user data.
* Do not collect sensitive location history in the prototype.
* Do not store full GPS traces for users in the MVP unless explicitly instructed later.

For the MVP, user activity records should start with summary data:

* Distance
* Duration
* Average pace
* XP earned
* Course completed status

---

## 25. Accessibility and Local User Rules

The app should be easy to understand for Philippine local users.

Use:

* Clear English
* Short labels
* Large tap targets
* Mobile-friendly spacing
* Readable contrast
* Simple navigation

Avoid:

* Overly technical fitness terms
* Too much text on one screen
* Guilt-based language
* Complicated onboarding

---

## 26. Definition of Done

A phase is done only when:

1. The requested scope is implemented.
2. The app still runs locally.
3. The UI works on a mobile-sized screen.
4. Mock data is separated from components.
5. No backend or database code is added unless requested.
6. Changed files are summarized.
7. Known issues are listed.
8. Next recommended step is stated.

---

## 27. Current Priority

Current priority:

> Build a mobile-first PWA prototype that communicates the RunQuest PH concept clearly enough to collect feedback from local running crews.

Do not optimize for full production yet.

Optimize for:

* Clarity
* Speed
* Visual understanding
* User feedback
* Future backend readiness
