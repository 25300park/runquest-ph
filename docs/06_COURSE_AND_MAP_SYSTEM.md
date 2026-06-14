# 06_COURSE_AND_MAP_SYSTEM.md

# Course and Map System

## Project Name

**RunQuest PH**

## Purpose

This document defines the course and map system for RunQuest PH.

The course system should work like a running version of a golf course app. Users should be able to see the full route, current location, checkpoints, distance remaining, route difficulty, and useful nearby information.

The goal is to make each walking, jogging, or running route feel like a real exploration course.

---

# 1. Core Course Concept

A course is not only a distance target.

A course is a structured route with:

* Start point
* Route path
* Checkpoints
* Finish point
* Difficulty
* XP reward
* Area exploration reward
* Safety notes
* Useful nearby places
* Optional photos
* Optional creator notes

The course should feel like a map-based adventure.

---

# 2. Course Map Direction

The course map should show:

1. Full route line
2. Current user location
3. Start point
4. Finish point
5. Checkpoints
6. Remaining distance
7. Completed distance
8. Route progress percentage
9. Caution sections
10. Useful nearby places

The UI direction is inspired by golf course apps.

A golf course app usually shows the full course, current player location, distance to target, hazards, and important points. RunQuest PH should use a similar structure for walking and running routes.

---

# 3. Checkpoint System

## 3.1 Checkpoint Purpose

Checkpoints help users understand route progress.

They also make the route feel like a game mission.

Instead of simply running a line on the map, users can clear points along the way.

## 3.2 Checkpoint Types

Recommended checkpoint types:

* START
* CHECKPOINT
* REST
* VIEW_SPOT
* WATER
* TOILET
* CAFE
* CAUTION
* FINISH

## 3.3 Example Course

Course: BGC Morning Loop

* Start: High Street
* CP1: Track 30th
* CP2: Burgos Circle
* CP3: Terra 28th
* Finish: High Street

The app may show:

* Current checkpoint
* Next checkpoint
* Distance to next checkpoint
* Total route progress
* Remaining distance

---

# 4. Route Data

## 4.1 Route Geometry

Each course should store real route geometry.

Route data may be stored as:

* Encoded polyline
* GeoJSON LineString
* Array of latitude/longitude points

Recommended MVP structure:

* Store route as GeoJSON or encoded polyline
* Store start and finish coordinates separately
* Store checkpoints separately

## 4.2 Course Table Direction

Suggested course fields:

* id
* area_id
* creator_user_id
* name
* description
* distance_km
* estimated_time_min
* difficulty_level
* difficulty_score
* route_polyline
* route_geojson
* start_lat
* start_lng
* finish_lat
* finish_lng
* xp_reward_base
* exploration_reward
* safety_notes
* status
* created_at
* updated_at

## 4.3 Checkpoint Table Direction

Suggested checkpoint fields:

* id
* course_id
* checkpoint_order
* name
* checkpoint_type
* lat
* lng
* description
* distance_from_start_km
* is_required
* created_at
* updated_at

---

# 5. Difficulty System

## 5.1 Difficulty Principle

Course difficulty should not be based only on distance.

Difficulty should consider:

1. Distance
2. Elevation
3. Pedestrian safety
4. Route complexity
5. Rest opportunity

## 5.2 Difficulty Factors

### Distance

Longer courses are more difficult.

### Elevation

Routes with higher elevation gain or steep slopes are more difficult.

### Pedestrian Safety

Routes with poor pedestrian safety are more difficult.

Safety may consider:

* Sidewalk width
* Vehicle traffic
* Crossing risk
* Lighting
* Security presence
* Isolated sections
* Runner-friendly environment

### Route Complexity

Routes with many turns, crossings, or confusing sections are more difficult.

### Rest Opportunity

Rest opportunities may reduce difficulty for beginner and walking courses.

Rest opportunities may include:

* Traffic lights
* Parks
* Benches
* Wide sidewalks
* Rest areas
* Water points
* Convenience stores

---

# 6. Suggested MVP Difficulty Formula

Suggested internal scoring:

Difficulty Raw Score =
Distance Score

* Elevation Score
* Safety Risk Score
* Route Complexity Score
* Rest Opportunity Modifier

Suggested score ranges:

* 0 to 2: Easy
* 3 to 5: Normal
* 6 to 8: Hard
* 9 or higher: Challenge

Suggested components:

## Distance Score

* Short: 0 to 1
* Medium: 2
* Long: 3

## Elevation Score

* Flat: 0
* Mild slope: 1
* Moderate slope: 2
* High slope: 3

## Safety Risk Score

* Very safe: 0
* Normal: 1
* Caution needed: 2

## Route Complexity Score

* Simple loop: 0
* Some turns/crossings: 1

## Rest Opportunity Modifier

* Many rest opportunities: -1
* Normal or limited rest: 0

The formula should be adjustable later.

---

# 7. Safety Evaluation

## 7.1 MVP Safety Evaluation

In the MVP, safety should be evaluated manually by admins or approved course creators.

Safety rating:

* 5: Very safe
* 4: Safe
* 3: Normal
* 2: Caution
* 1: Unsafe

Admin should avoid publishing unsafe routes.

## 7.2 Safety Checklist

Course creators should answer:

* Are sidewalks wide enough?
* Are there many vehicles?
* Are there safe crossings?
* Are there traffic lights?
* Is the route safe in early morning?
* Are there dark or isolated sections?
* Do runners already use this route?
* Are there guards, parks, or public areas nearby?

## 7.3 Future Safety Improvement

Future versions may use:

* User feedback
* Incident reports
* Route completion reviews
* Public map data
* Creator reliability score

---

# 8. Elevation Data

Elevation should be calculated from route coordinates.

Suggested process:

1. Save route coordinates.
2. Sample points along the route.
3. Get elevation data for sampled points.
4. Calculate total elevation gain.
5. Calculate maximum slope section.
6. Convert result into Elevation Score.

This feature may use external elevation APIs in the future.

---

# 9. Useful Nearby Information

## 9.1 POI Types

The course screen may show useful places near the route.

Recommended POI types:

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

## 9.2 POI Data Collection Methods

POI data can be collected through four methods.

### Method 1: Admin Manual Input

Admins directly input important POIs when creating a course.

This is recommended for MVP quality control.

### Method 2: Approved Creator Input

Approved course creators can suggest POIs when submitting a course.

Admins review and approve them.

### Method 3: OpenStreetMap / Overpass API Candidate Collection

The system can search for nearby places around the route using OpenStreetMap data.

The result should be treated as candidate data only.

Admins should approve POIs before they become public.

### Method 4: User Feedback

Users can report whether POI information is correct after completing a course.

Examples:

* This toilet is closed.
* This cafe is still open.
* This water point is not available.
* This route section feels unsafe.

---

# 10. POI Approval Workflow

Recommended workflow:

1. Admin or creator creates a course.
2. System suggests nearby POIs.
3. Admin reviews POI candidates.
4. Admin approves selected POIs.
5. Approved POIs appear on course screen.
6. Users can submit corrections.
7. Admin updates POI data.

Principle:

Automatic data collection creates candidates.
Human review decides what becomes public.

---

# 11. Course Creator Policy

Approved creators may create course drafts.

Creator-submitted courses should be visible to free users after admin approval.

Free users should be able to use core course features.

The app should focus on growing the user base.

Premium should provide deeper benefits, not block the core running experience.

---

# 12. Free and Premium Course Access

## Free Users

Free users can access:

* Basic official courses
* Approved creator courses
* Basic map view
* Basic GPS tracking
* Basic XP
* Basic exploration progress

## Premium Users

Premium users may access:

* Advanced route analytics
* Watch data integration
* Premium reports
* Partner rewards
* Event discounts
* Premium character items
* AI coaching
* Special challenge history

Core routes should not be heavily restricted in the beginning.

---

# 13. Future Map Features

Future map features may include:

* Live character movement on route
* Pace-based character animation
* Route deviation alerts
* Watch data sync
* Group running live map
* Private group routes
* Event route management
* Heatmap of popular routes
* Weather and air quality recommendations
* Safety alert layer

---

# 14. MVP Success Criteria

The course and map system is successful if:

1. Admin can create a real route with coordinates.
2. Course appears on map.
3. User can see full route and checkpoints.
4. User can see current location during activity.
5. User can complete the route.
6. App can calculate progress and distance.
7. Course includes useful safety and nearby information.
8. Free users can access approved routes.
