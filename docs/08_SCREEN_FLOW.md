# 08_SCREEN_FLOW.md

# Screen Flow

## Project Name

**RunQuest PH**

## Purpose

This document defines the main screen flow for RunQuest PH.

The app should be mobile-first, PWA-ready, beginner-friendly, and map-centered after login.

The pre-login experience should work as a simple marketing and onboarding screen.
The post-login experience should focus on area exploration, map routes, character growth, XP, and course completion.

---

# 1. Overall Screen Structure

The app has two major screen groups:

1. Pre-login screens
2. Logged-in app screens

## Pre-login Goal

The pre-login goal is to explain the app concept and encourage sign-up.

The pre-login screen does not need to show detailed course data.

It should show:

* App concept
* Marketing image or video
* Key benefits
* Simple course/area preview
* Character growth concept
* Sign up / login buttons

## Logged-in Goal

The logged-in app should focus on:

* Exploration map
* User character
* Area progress
* Course selection
* Activity tracking
* XP and level growth
* Profile and history

---

# 2. Pre-Login Landing Screen

## 2.1 Purpose

The landing screen introduces RunQuest PH to new visitors.

It should make users understand the app quickly.

Core message:

> Walk. Jog. Run. Explore the Philippines. Level up your journey.

## 2.2 Main Content

The landing screen may include:

1. App logo
2. Hero image or short marketing video
3. Short app slogan
4. Simple explanation
5. Area preview
6. Character growth preview
7. Sign up button
8. Login button

## 2.3 Suggested Hero Text

Suggested headline:

> Turn every walk and run into an adventure.

Suggested subtext:

> Explore local routes, grow your character, earn XP, and unlock new areas across the Philippines.

## 2.4 Area Preview

The pre-login screen may show a simple preview of areas.

Example:

* BGC
* Makati / Ayala Triangle
* MOA / Pasay

The screen should not show full course details before login.

## 2.5 Marketing Asset Area

The landing screen may show:

* Promotional video
* App concept image
* Character illustration
* Exploration map image
* Running route preview image

The goal is not to provide all information.
The goal is to encourage registration.

---

# 3. Login and Registration Screens

## 3.1 Login Screen

The login screen should support:

* Email
* Password
* Login button
* Forgot password link
* Sign up link

Future versions may support:

* Mobile number login
* OTP
* Google login
* Facebook login
* Apple login

## 3.2 Registration Screen

The MVP registration screen should collect:

* Email
* Password
* Display name

After registration, the user moves to character selection.

## 3.3 Returning User Behavior

If the user is already registered and logged in, the app should skip the marketing screen and move directly to the logged-in app experience.

Default destination:

> Exploration Map Screen

---

# 4. Character Selection Screen

## 4.1 Purpose

After registration, the user selects a character.

The character screen should be story-centered, not number-centered.

The app should avoid making the user feel that one character is mathematically better than another.

## 4.2 Character Count

MVP starts with 3 characters:

1. The Explorer
2. The Challenger
3. The Guardian

## 4.3 Display Method

Each character card should show:

* Character image
* Character name
* Short story
* Journey style
* Recommended for text
* Very simple bonus note if needed

The screen should not emphasize detailed statistics.

## 4.4 Suggested Screen Message

> Choose your running companion.
> Every journey starts differently.
> Pick the character that feels like you today.

## 4.5 Character Card Example

### The Explorer

For users who love discovering new places and routes.

Short story:

> The Explorer believes every street has a story and every route can become an adventure.

Recommended for:

* Beginners
* Walkers
* Route discoverers
* Local travel lovers

## 4.6 Character Selection Rule

The user should be able to change character later.

This reduces pressure during first selection.

---

# 5. Area Selection Screen

## 5.1 Purpose

After character selection, the user chooses the first exploration area.

The user selects the starting area manually.

## 5.2 Initial Areas

Initial areas:

1. BGC
2. Makati / Ayala Triangle
3. MOA / Pasay

## 5.3 Area Card Information

Each area card should show:

* Area name
* Short description
* Area image
* Number of available courses
* Suggested beginner route
* Exploration theme

## 5.4 Example Area Card

### BGC

Modern city routes, safe loops, and office worker-friendly courses.

Available route types:

* Walking
* Jogging
* Beginner running
* City loop

---

# 6. Main Home Screen: Exploration Map

## 6.1 Purpose

The main screen after login should be the Exploration Map.

The app should not pressure users with a daily quest as the main home screen.

The user should feel:

> Where do I want to explore today?

## 6.2 Main Elements

The Exploration Map should show:

* Selected area map
* Course route previews
* Current user location
* Area exploration progress
* User level
* Character icon
* Recommended nearby course
* Course markers
* Bottom course cards

## 6.3 Layout Direction

Suggested mobile layout:

1. Top bar

   * User level
   * XP progress
   * Profile icon

2. Main map area

   * Area map
   * Course markers
   * Current location

3. Bottom panel

   * Recommended courses
   * Selected course card
   * Start button

## 6.4 Optional Quest Suggestion

The app may show optional quest suggestions, but they should not feel mandatory.

Avoid:

> You must run today.

Prefer:

> Your next route is waiting.

---

# 7. Course List Screen

## 7.1 Purpose

The user can browse available courses in the selected area.

## 7.2 Filter Options

Possible filters:

* Area
* Distance
* Difficulty
* Walking
* Jogging
* Running
* Beginner-friendly
* Creator course
* Event course

## 7.3 Course Card Information

Each course card should show:

* Course name
* Area
* Distance
* Estimated time
* Difficulty
* XP reward
* Exploration reward
* Course type
* Creator name if applicable
* Safety indicator

Example:

> BGC Morning Loop
> 2.5 km · Easy · 25–35 min
> Reward: 280 XP
> BGC Exploration +5%

---

# 8. Course Detail Screen

## 8.1 Purpose

The course detail screen helps the user decide whether to start the course.

## 8.2 Main Elements

The screen should show:

* Full course map
* Route line
* Start point
* Finish point
* Checkpoints
* POIs
* Distance
* Estimated time
* Difficulty
* XP reward
* Exploration reward
* Safety notes
* Creator notes
* Start button

## 8.3 Checkpoints

Checkpoints may include:

* Start
* CP1
* CP2
* Rest point
* View spot
* Water point
* Caution point
* Finish

## 8.4 POI Information

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

---

# 9. Activity Tracking Screen

## 9.1 Purpose

The activity tracking screen is used while the user is walking, jogging, or running.

This screen should be map-centered.

## 9.2 Main Design Direction

The map should be the main focus.

The character may appear as a small animated icon or side element, but should not replace the map.

## 9.3 Main Elements

The tracking screen should show:

* Current location
* Route line
* Completed route segment
* Remaining route segment
* Next checkpoint
* Distance completed
* Distance remaining
* Time elapsed
* Average pace
* GPS status
* Pause button
* Finish button

## 9.4 Character Element

The character may appear as:

* Small avatar near progress panel
* Running icon beside current stats
* Celebration animation after checkpoint
* Level-up animation after completion

The MVP does not need real-time advanced character animation.

## 9.5 Future Watch Integration

Future versions may show real-time character actions based on:

* Speed
* Pace
* Heart rate
* Step count
* Watch data

Possible states:

* Walking
* Jogging
* Running
* Resting
* Tired
* Celebrating

---

# 10. Quest Completed Screen

## 10.1 Purpose

The completion screen gives emotional reward after activity.

It should feel like a game achievement screen.

## 10.2 Main Elements

The screen should show:

* Quest Completed message
* Course name
* Distance completed
* Time
* Average pace
* XP earned
* Streak bonus
* Character progress
* Level progress
* Area exploration progress
* Badge unlock if applicable
* Next suggested course

## 10.3 Example Message

> Quest Completed!
> You cleared BGC Morning Loop.
> You earned 280 XP.
> BGC Exploration increased to 35%.
> Next route unlocked: BGC Sunset Walk.

---

# 11. Profile Screen

## 11.1 Purpose

The profile screen shows the user’s long-term progress.

## 11.2 Main Elements

The profile screen should show:

* Character
* Display name
* Current level
* Total XP
* XP progress to next level
* Total distance
* Completed courses
* Badges
* Area exploration progress
* Activity history
* Subscription status

---

# 12. Area Progress Screen

## 12.1 Purpose

This screen shows exploration progress by area.

## 12.2 Main Elements

For each area, show:

* Area name
* Area image
* Exploration percentage
* Completed courses
* Total area distance completed
* Locked/unlocked routes
* Area badges

Example:

* BGC: 35% explored
* Makati: 20% explored
* MOA: 10% explored

---

# 13. Admin Course Manager Screen

## 13.1 Purpose

Admins use this screen to create and manage courses.

## 13.2 Main Functions

Admins can:

* Create course
* Edit course
* Add route coordinates
* Add checkpoints
* Add POIs
* Set difficulty
* Set XP reward
* Set exploration reward
* Approve creator-submitted courses
* Activate/deactivate courses

## 13.3 Course Route Creation

MVP route creation should support:

* Clicking points on a map
* Saving route as GeoJSON or polyline
* Adding checkpoints manually
* Adding POIs manually
* Editing course metadata

GPX/KML upload is not required for MVP.

---

# 14. Creator Course Draft Screen

## 14.1 Purpose

Approved creators can submit course drafts.

## 14.2 Creator Functions

Approved creators can:

* Create draft course
* Add route points
* Add description
* Add checkpoints
* Add POIs
* Add safety notes
* Submit for admin approval

## 14.3 Approval Rule

Creator courses are not public until admin approval.

After approval, creator courses are visible to free users.

---

# 15. Settings Screen

## 15.1 MVP Settings

Settings may include:

* Profile edit
* Change character
* Change starting area
* Notification preferences
* Privacy settings
* Logout

## 15.2 Future Settings

Future settings may include:

* Mobile number
* Watch connection
* Premium subscription
* Data export
* Connected apps
* Language selection

---

# 16. Screen Flow Summary

## First-Time User

1. Landing screen
2. Sign up
3. Character selection
4. Area selection
5. Exploration map
6. Course detail
7. Activity tracking
8. Quest completed
9. Profile / next route

## Returning User

1. Login or auto-login
2. Exploration map
3. Course selection
4. Activity tracking
5. Quest completed

## Admin User

1. Admin login
2. Admin dashboard
3. Course manager
4. Route editor
5. Checkpoint editor
6. POI editor
7. Approval queue

## Approved Creator

1. Login
2. Creator dashboard
3. Create course draft
4. Submit for approval
5. Track approval status

---

# 17. MVP Screen Success Criteria

The screen flow is successful if:

1. New users understand the app concept before registration.
2. Registered users can quickly choose a character.
3. Users can choose a starting area.
4. The main screen clearly shows map-based exploration.
5. Users can select a course from the map.
6. Users can start and complete an activity.
7. Activity tracking is map-centered.
8. Completion feels rewarding.
9. Admin can create real map-based courses.
10. Approved creators can submit draft courses.
