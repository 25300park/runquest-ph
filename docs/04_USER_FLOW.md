# 04_USER_FLOW.md

# User Flow

## Project Name

**RunQuest PH**

## Purpose

This document defines the first user experience flow for RunQuest PH.

The app should feel like a local exploration game, not a stressful fitness obligation. Users should feel free to choose where to explore, which course to complete, and how to grow their character.

---

# 1. First-Time User Flow

## 1.1 App Entry

When the user first opens the app, the app should introduce the concept clearly.

Suggested message:

> Walk. Jog. Run. Explore the Philippines. Level up your journey.

The first screen should communicate:

* This is a walking/jogging/running app
* The app uses game-style progress
* Users can explore real Philippine areas
* Users can grow a character
* Beginners are welcome

## 1.2 Registration

The MVP uses email registration.

Required fields:

* Email
* Password
* Display name

Future versions may support:

* Mobile number login
* OTP verification
* Google login
* Facebook login
* Apple login

## 1.3 Character Selection

After registration, the user selects a character.

The character should be a human-style avatar with a friendly and beginner-friendly design.

The app should not directly categorize users by body type in a negative way. Instead, characters should represent different journey styles.

Suggested character types:

1. City Walker
2. Weekend Jogger
3. Island Explorer
4. Challenge Runner
5. Comeback Runner

Each character should have:

* Name
* Short story
* Visual style
* Starting title
* Personality
* Future item/skin expansion potential

Suggested character selection message:

> Choose your running companion. Every journey starts differently. Pick the character that feels like you today.

The character should be changeable in the future to reduce user pressure.

---

# 2. Character Story Direction

## 2.1 Character Design Principle

Characters should be:

* Human-style
* Cute
* Friendly
* Motivating
* Beginner-friendly
* Suitable for Philippine local travel
* Expandable into fantasy RPG style later

Characters should not make users feel judged by body type, fitness level, or appearance.

## 2.2 Suggested Character Concepts

### City Walker

A beginner-friendly character who enjoys discovering streets, parks, and safe walking paths.

### Weekend Jogger

A busy worker or student who uses weekends and free time to stay active.

### Island Explorer

A cheerful traveler who dreams of exploring the Philippines one route at a time.

### Challenge Runner

A goal-focused character who enjoys progress, badges, and new records.

### Comeback Runner

A character for users who are restarting their fitness journey after a long break.

---

# 3. Starting Area Selection

After character selection, the user chooses the first exploration area.

Initial areas:

1. BGC
2. Makati / Ayala Triangle
3. MOA / Pasay

The user should choose the area manually.

The app may show each area with a short description.

Example:

### BGC

Modern city routes, safe loops, and office worker-friendly courses.

### Makati / Ayala Triangle

Green urban paths, Sunday running culture, and business district energy.

### MOA / Pasay

Seaside routes, open-air walking, and sunset-friendly paths.

---

# 4. Main Home Screen

The main home screen should be based on:

> Map / Area Exploration

The app should not pressure users with a mandatory daily quest as the main focus.

The home screen should show:

* Exploration map
* Selected area progress
* Nearby or recommended courses
* User character
* Current level
* Total XP
* Area completion percentage

Suggested home screen structure:

1. Top: User level and character
2. Center: Exploration map or area cards
3. Bottom: Recommended course cards
4. Secondary: Optional quest suggestion

The app should make users feel curious, not pressured.

---

# 5. Course Selection Flow

The user can select a course from the map or course list.

Course card should show:

* Course name
* Area
* Distance
* Estimated time
* Difficulty
* XP reward
* Exploration reward
* Course type
* Safety notes
* Start button

Example:

> BGC Morning Loop
> 2.5 km · Easy · 25–35 min
> Reward: 280 XP
> Exploration: +5% BGC progress

---

# 6. Activity Start Flow

When the user starts a course, the app should show:

* Course name
* GPS status
* Distance target
* Time elapsed
* Current distance
* Character animation
* Pause button
* Finish button

The MVP may show a simple walking or jogging character animation.

Future versions may connect character animation to actual speed.

---

# 7. Activity Tracking Flow

The MVP tracks:

* GPS location
* Distance
* Time
* Average speed
* Basic route progress

The app should detect obvious abnormal cases:

* Unrealistic speed
* Too short completion time
* GPS jumps
* Not enough GPS points

Suspicious activity should be marked for review or XP hold.

The app should not immediately punish users aggressively.

---

# 8. Activity Completion Flow

After completion, the app should show a reward screen.

Reward screen should include:

* Quest completed message
* Distance completed
* Time
* XP earned
* Streak bonus if applicable
* Level progress
* Area exploration progress
* Badge if unlocked
* Next suggested course

Example:

> Quest Completed!
> You cleared BGC Morning Loop.
> You earned 280 XP.
> BGC Exploration increased to 35%.
> Next route unlocked: BGC Sunset Walk.

---

# 9. Main User Return Flow

When the user returns later, the home screen should show:

* Current area progress
* Character status
* Suggested nearby course
* Recently completed course
* Optional recommended quest

The app should avoid guilt-based messaging.

Avoid:

> You missed your workout.

Prefer:

> Your next route is waiting.

---

# 10. Future Real-Time Character Flow

Future versions may show the character moving or acting in real time based on user activity.

Possible character states:

* Resting
* Walking
* Jogging
* Running
* Tired
* Celebrating
* Leveling up

Future data sources may include:

* GPS speed
* Watch data
* Heart rate
* Step count
* Distance progress

This can become part of the premium experience in the future.

---

# 11. Course Creator Flow

## 11.1 Admin Course Creation

Admins can create public courses.

## 11.2 Approved Creator Course Draft

Approved creator accounts can create course drafts.

A course draft may include:

* Course name
* Area
* Route description
* Distance
* Difficulty
* Photos
* Safety notes
* Recommended time
* GPS route data if available

Admin must approve the course before it becomes public.

## 11.3 Future Group Course

Future versions may support:

* Running group courses
* Private courses
* Invite-only routes
* Event routes
* Premium creator routes

---

# 12. User Experience Principle

The app should feel encouraging, not judgmental.

The app should avoid making users feel guilty.

The app should encourage users through:

* Exploration
* Character growth
* XP
* Area progress
* Positive messages
* Optional quests
* Friendly design

Core feeling:

> I want to explore one more route.
