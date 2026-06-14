# 07_DATABASE_DESIGN.md

# Database Design

## Project Name

**RunQuest PH**

## Purpose

This document defines the initial database structure for RunQuest PH.

The MVP should support:

* Email-based user accounts
* Human-style character selection
* Area-based exploration
* Real running/walking courses with map routes
* Course checkpoints
* Basic GPS-based activity tracking
* XP and level system
* Area exploration progress
* Admin and approved creator course management
* Summary-based user activity records

The database should be simple enough for MVP development but flexible enough for future features such as watch integration, premium subscription, partner rewards, and advanced map analytics.

---

# 1. Design Principles

## 1.1 MVP Simplicity

The MVP should avoid unnecessary complexity.

The system will store detailed route data for courses, but user activity records will initially store summary values only.

MVP user activity records should include:

* Distance
* Duration
* Average speed
* XP earned
* Course completed status
* Suspicious activity status

The MVP will not store every GPS point from user activities.

## 1.2 Future Expansion

The database should allow future expansion for:

* Mobile number login
* Watch data integration
* GPX/KML route upload
* Premium subscription
* Partner rewards
* Character equipment
* Skill trees
* Running groups
* Corporate wellness programs

## 1.3 Core Rule

Course route data can be detailed.
User activity data should start simple.

---

# 2. Main Tables

Recommended MVP tables:

1. users
2. user_profiles
3. characters
4. user_characters
5. areas
6. courses
7. course_checkpoints
8. course_pois
9. activities
10. user_area_progress
11. xp_transactions
12. badges
13. user_badges
14. admin_users
15. creator_accounts

Future tables:

1. subscriptions
2. partner_rewards
3. watch_activities
4. character_items
5. user_character_items
6. skill_trees
7. user_skills
8. running_groups
9. group_courses

---

# 3. users

Stores basic user login information.

## Fields

* id
* email
* password_hash
* auth_provider
* mobile_number
* mobile_verified
* status
* created_at
* updated_at

## Notes

MVP login method:

* Email
* Password

Future login methods:

* Mobile number
* OTP
* Google login
* Facebook login
* Apple login

## Example status

* active
* inactive
* suspended
* deleted

---

# 4. user_profiles

Stores public and profile-related user information.

## Fields

* id
* user_id
* display_name
* avatar_url
* current_level
* total_xp
* total_distance_km
* total_activity_count
* current_area_id
* subscription_status
* created_at
* updated_at

## Notes

This table separates login information from user profile information.

---

# 5. characters

Stores available character types.

## Fields

* id
* code
* name
* character_type
* description
* short_story
* starting_title
* base_bonus_type
* base_bonus_value
* image_url
* status
* created_at
* updated_at

## Initial Characters

MVP starts with 3 characters:

1. The Explorer
2. The Challenger
3. The Guardian

## Example character_type

* explorer
* challenger
* guardian

## Example base_bonus_type

* first_course_bonus
* pace_bonus
* walking_bonus
* exploration_bonus
* penalty_reduction

---

# 6. user_characters

Stores which character the user selected.

## Fields

* id
* user_id
* character_id
* character_name_custom
* selected_at
* is_active
* character_level
* character_xp
* created_at
* updated_at

## Notes

Users may be allowed to change character later.

The MVP should support one active character per user.

---

# 7. areas

Stores exploration areas.

## Fields

* id
* code
* name
* city
* description
* map_center_lat
* map_center_lng
* image_url
* fantasy_name
* status
* display_order
* created_at
* updated_at

## Initial Areas

1. BGC
2. Makati / Ayala Triangle
3. MOA / Pasay

## Future Areas

* Ortigas
* Alabang
* Quezon City
* Cebu
* Clark
* Baguio
* Boracay
* Palawan

---

# 8. courses

Stores walking, jogging, and running courses.

## Fields

* id
* area_id
* creator_user_id
* created_by_admin_id
* name
* description
* course_type
* distance_km
* estimated_time_min
* difficulty_level
* difficulty_score
* distance_score
* elevation_score
* safety_score
* route_complexity_score
* rest_opportunity_score
* xp_reward_base
* exploration_reward_value
* start_lat
* start_lng
* finish_lat
* finish_lng
* route_geojson
* route_polyline
* course_image_url
* safety_notes
* creator_notes
* status
* visibility
* created_at
* updated_at

## course_type examples

* walking
* jogging
* running
* beginner
* city
* event
* challenge

## difficulty_level examples

* easy
* normal
* hard
* challenge

## status examples

* draft
* pending_review
* active
* inactive
* rejected
* archived

## visibility examples

* public
* private
* group_only
* premium_preview

## Notes

In the MVP, approved creator courses should be visible to free users after admin approval.

Premium should not block core course access in the early stage.

---

# 9. course_checkpoints

Stores checkpoints for each course.

## Fields

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

## checkpoint_type examples

* START
* CHECKPOINT
* REST
* VIEW_SPOT
* WATER
* TOILET
* CAFE
* CAUTION
* FINISH

## Notes

Checkpoints help users understand course progress.

The app should show:

* Current checkpoint
* Next checkpoint
* Distance to next checkpoint
* Route completion percentage

---

# 10. course_pois

Stores useful places near the course.

POI means Point of Interest.

## Fields

* id
* course_id
* name
* poi_type
* lat
* lng
* description
* source_type
* external_place_id
* status
* created_by_user_id
* approved_by_admin_id
* created_at
* updated_at

## poi_type examples

* photo_spot
* cafe
* toilet
* drinking_water
* convenience_store
* rest_area
* park
* viewpoint
* safety_point
* caution_area

## source_type examples

* admin_manual
* creator_input
* openstreetmap_candidate
* user_suggestion
* google_candidate
* mapbox_candidate

## status examples

* pending
* approved
* rejected
* hidden

## Notes

POIs should not be automatically published without review.

Recommended workflow:

1. Admin or creator adds POI.
2. System may suggest POI candidates.
3. Admin reviews.
4. Approved POIs appear on the course screen.

---

# 11. activities

Stores user activity summary records.

## Fields

* id
* user_id
* course_id
* area_id
* activity_type
* started_at
* ended_at
* duration_seconds
* distance_km
* average_speed_kmh
* average_pace_seconds_per_km
* completion_status
* gps_tracking_level
* xp_earned
* streak_bonus_xp
* penalty_xp
* final_xp
* level_before
* level_after
* area_progress_added
* suspicious_status
* suspicious_reason
* source_type
* created_at
* updated_at

## activity_type examples

* walking
* jogging
* running

## completion_status examples

* started
* completed
* abandoned
* failed
* suspicious
* admin_review

## gps_tracking_level examples

* manual
* gps_level_1
* gps_level_2
* watch_import

## suspicious_status examples

* normal
* suspicious
* cleared
* rejected

## source_type examples

* mobile_web
* pwa
* watch
* manual_admin

## Notes

The MVP stores summary data only.

The MVP does not store every GPS point from user activity.

Future versions may create a separate activity_gps_points table if needed.

---

# 12. user_area_progress

Stores each user’s exploration progress by area.

## Fields

* id
* user_id
* area_id
* completed_course_count
* total_distance_km
* exploration_progress_percent
* last_activity_id
* updated_at
* created_at

## Notes

Area progress is calculated using both:

1. Completed course count
2. Total distance in that area

Suggested formula:

Area Progress =
Course Completion Progress × 70%

* Distance Progress × 30%

The formula can be adjusted later.

---

# 13. xp_transactions

Stores XP earning and adjustment history.

## Fields

* id
* user_id
* activity_id
* transaction_type
* xp_amount
* description
* created_at

## transaction_type examples

* course_completion
* streak_bonus
* scheduled_bonus
* penalty
* admin_adjustment
* event_bonus
* premium_bonus

## Notes

This table helps keep XP history transparent.

Even if user_profiles.total_xp stores the current total, xp_transactions stores the reason for XP changes.

---

# 14. badges

Stores badge definitions.

## Fields

* id
* code
* name
* description
* badge_type
* image_url
* requirement_type
* requirement_value
* status
* created_at
* updated_at

## badge_type examples

* first_completion
* distance
* area
* streak
* event
* premium
* creator

---

# 15. user_badges

Stores badges earned by users.

## Fields

* id
* user_id
* badge_id
* earned_at
* related_activity_id
* related_area_id
* created_at

---

# 16. admin_users

Stores admin accounts.

## Fields

* id
* email
* password_hash
* role
* status
* created_at
* updated_at

## role examples

* super_admin
* admin
* course_manager
* reviewer

---

# 17. creator_accounts

Stores approved creator permissions.

## Fields

* id
* user_id
* creator_status
* approved_by_admin_id
* approved_at
* notes
* created_at
* updated_at

## creator_status examples

* pending
* approved
* suspended
* rejected

## Notes

Approved creators can create draft courses.

Admin approval is required before public release.

---

# 18. Future watch_activities

This table is not required for MVP.

It may be added when watch integration is introduced.

## Possible Fields

* id
* user_id
* activity_id
* watch_provider
* external_activity_id
* distance_km
* duration_seconds
* average_heart_rate
* max_heart_rate
* average_pace
* cadence
* calories
* raw_data_json
* imported_at
* created_at

## watch_provider examples

* apple_health
* google_fit
* garmin
* strava
* fitbit
* samsung_health

---

# 19. Future subscriptions

This table is not required for the first MVP unless payment is implemented early.

## Possible Fields

* id
* user_id
* plan_code
* status
* price_php
* started_at
* expires_at
* payment_provider
* created_at
* updated_at

## plan_code examples

* free
* premium_monthly
* premium_annual

---

# 20. MVP Database Success Criteria

The database design is successful if the MVP can support:

1. User registration and login
2. Character selection
3. Area selection
4. Course creation with real route data
5. Course checkpoints
6. Course POIs
7. User activity summary records
8. XP calculation
9. Level update
10. Area exploration progress
11. Badge earning
12. Admin course approval
13. Approved creator course creation
