# 02_FEATURE_SCOPE.md

# Feature Scope

## Project Name

**RunQuest PH**

## Product Direction

RunQuest PH is a mobile-first PWA that turns walking, jogging, and running into a game-style journey across selected areas in the Philippines.

The MVP focuses on helping users build a consistent exercise habit while enjoying XP, levels, route completion, and local exploration progress.

The app should feel like a combination of:

* A beginner-friendly exercise app
* A local Philippine travel adventure
* A cute character growth game
* A simple RPG-style progress system

---

# 1. MVP Feature Scope

The MVP should focus only on the essential features needed to prove the core loop:

> Select course → Start activity → Track walking/jogging → Complete course → Earn XP → Level up → Increase area exploration progress

The first version should not include too many social, payment, watch, or advanced AI features.

---

# 2. User Account Features

## 2.1 MVP Account Method

The MVP will support:

* Email registration
* Email login
* Password reset
* User profile

The user profile should include:

* Display name
* Email
* Current level
* Total XP
* Completed courses
* Current exploration area
* Character/avatar selection
* Subscription status

## 2.2 Future Account Method

Future versions may support:

* Mobile number registration
* OTP verification
* Google login
* Facebook login
* Apple login

Mobile number registration is planned for later because many Philippine users are mobile-first. However, the MVP will start with email for faster development and simpler testing.

---

# 3. Course Management Features

## 3.1 Course Registration Authority

In the MVP, courses can be created by:

1. Admin users
2. Approved creator accounts

Regular users cannot freely create public courses in the MVP.

This prevents low-quality, unsafe, duplicate, or fake courses from being added to the app.

## 3.2 Course Data

Each course should include:

* Course name
* Area
* City
* Starting point
* Ending point
* Distance
* Estimated time
* Difficulty
* Course type
* XP reward
* Exploration reward
* Route description
* Safety notes
* Course image
* Active/inactive status

## 3.3 Course Types

Initial course types:

* Walking course
* Jogging course
* Running course
* Beginner route
* City route
* Event route

Future course types:

* Premium route
* Sponsored route
* Challenge route
* Fantasy route
* Team route
* Watch-verified route

---

# 4. Activity Tracking Features

## 4.1 MVP Tracking Level

The MVP will support GPS tracking up to Level 2.

### Level 1

The user manually starts and completes an activity.

### Level 2

The app tracks:

* GPS location
* Distance
* Time
* Average speed
* Basic route progress

The MVP should detect clearly abnormal activity, such as unrealistic speed.

## 4.2 Future Tracking

Future versions may support:

* Route deviation detection
* Watch data import
* Smart watch sync
* GPX/FIT file import
* Heart rate data
* Step count data
* Verified activity badges

Watch data is a future advanced feature and may become part of premium subscription.

---

# 5. XP and Level System

## 5.1 XP System

Users earn XP when they complete activities.

XP can be based on:

* Course distance
* Difficulty
* Completion status
* First-time completion bonus
* Weekly mission bonus
* Event bonus
* Premium quest bonus

Example:

* 1 km walking course: 100 XP
* 3 km beginner jogging course: 350 XP
* 5 km city route: 700 XP
* Event course: base XP + bonus XP

## 5.2 Level System

The user level increases based on total XP.

Example level titles:

* Level 1: New Walker
* Level 2: Street Explorer
* Level 3: City Jogger
* Level 4: Route Adventurer
* Level 5: Urban Runner
* Level 10: Island Explorer
* Level 20: Marathon Hero

The first version can use a simple XP table. Later versions can use a more advanced level curve.

---

# 6. Area Exploration System

## 6.1 Exploration Progress

In addition to XP and level, the app will track area exploration progress.

For example:

* BGC Exploration: 25%
* Makati Exploration: 40%
* MOA Exploration: 10%

A user increases area progress by completing courses in that area.

## 6.2 Initial Areas

The first areas are:

1. BGC
2. Ayala Triangle / Makati
3. MOA / Pasay

## 6.3 Future Areas

Possible future areas:

* Ortigas
* Alabang
* Quezon City
* Cebu
* Clark
* Baguio
* Boracay
* Palawan

## 6.4 Exploration and Unlocking

Area exploration may unlock:

* New routes
* Badges
* Character items
* Area titles
* Fantasy map skins
* Premium routes
* Event invitations

---

# 7. Character and Game UI Features

## 7.1 Character Direction

The app should include a cute character system.

Characters should make the app feel friendly, fun, and emotionally engaging.

Possible character concepts:

* Beginner runner character
* Cute animal runner
* Island explorer
* Backpack traveler
* Fantasy adventurer
* Local city explorer

## 7.2 UI Direction

The background and map style should follow:

* Philippine local travel
* City exploration
* Area-based journey
* Later fantasy RPG expansion

The design should mix:

* Cute character UI
* Urban exploration map
* Local travel imagery
* Light RPG-style progress

The app should not feel too serious or too medical.

---

# 8. Subscription and Monetization Features

## 8.1 Advertising Policy

The app will not use random display advertisements in the initial product direction.

The app should avoid intrusive ads that damage the user experience.

## 8.2 Free Plan

Free users may access:

* Basic account
* Basic courses
* Basic GPS tracking
* Basic XP and level system
* Basic area progress
* Basic activity history
* Basic character/avatar
* Limited badges

## 8.3 Premium Plan

Target subscription price:

* PHP 100 to PHP 200 per month

Premium users may receive:

1. Advanced statistics
2. Premium courses
3. Personalized goal plans
4. Special badges
5. Fantasy map themes
6. Watch data integration
7. AI running coach
8. Event discounts
9. Partner gift cards or discount coupons
10. Premium character items
11. Deeper exploration progress
12. Challenge history and reports

## 8.4 Long-Term Premium Value

The strongest long-term premium value may come from:

* Corporate event discounts
* Health and beauty partner discounts
* Fitness brand partnerships
* Skin care clinic gift cards
* Sports shop coupons
* Cafe or healthy meal discounts
* Running event benefits
* Corporate wellness programs

Partner benefits should not be treated as simple advertisements. They should be positioned as rewards for active users.

Example:

> Complete 5 quests this month and unlock a partner reward.

---

# 9. Community Features

## 9.1 MVP Community Scope

The MVP does not need a full social network.

The first version may include only:

* Public nickname
* Completed course count
* Simple ranking
* Basic weekly leaderboard

## 9.2 Future Community Features

Future versions may include:

* Friends
* Follow system
* Running groups
* Team challenges
* Guild system
* Area-based community
* Event participation
* User-submitted route suggestions

---

# 10. Admin Features

## 10.1 MVP Admin Functions

Admin users should be able to:

* Login to admin console
* Create courses
* Edit courses
* Activate/deactivate courses
* Manage course difficulty
* Set XP reward
* Set exploration reward
* View users
* View activity records
* View suspicious activity
* Approve creator accounts
* Manage approved course creators

## 10.2 Approved Creator Functions

Approved creator accounts may be able to:

* Create draft courses
* Edit their own draft courses
* Submit courses for approval
* View approval status

Admin approval is required before a course becomes public.

---

# 11. Must Have / Should Have / Future

## 11.1 Must Have for MVP

* Email registration
* Email login
* User profile
* Basic character/avatar
* Course list
* Course detail
* Admin course creation
* Approved creator course draft
* Start activity
* GPS distance and time tracking
* Complete activity
* XP reward
* Level system
* Area exploration progress
* Basic activity history
* Mobile-first UI
* PWA-ready structure

## 11.2 Should Have

* Badges
* Weekly mission
* Basic leaderboard
* Suspicious activity detection
* Course image
* Area map screen
* User progress dashboard
* Course completion history
* Admin approval workflow
* Simple notification system

## 11.3 Future Features

* Mobile number login
* Google/Facebook login
* Watch data integration
* AI running coach
* Premium subscription
* Partner reward system
* Event discounts
* Gift cards
* Character item shop
* Fantasy map
* Team/guild system
* Corporate wellness dashboard
* Running event integration
* Weather-based recommendations
* Safety alerts
* User route suggestions
* Native Android/iOS app

---

# 12. MVP Success Criteria

The MVP is successful if users can complete the following flow:

1. Register with email
2. Select a course
3. Start walking or jogging
4. Track distance and time
5. Complete the course
6. Earn XP
7. Level up
8. Increase area exploration progress
9. View progress in profile

The first milestone is not revenue. The first milestone is repeated usage.

The key question is:

> Do users want to open the app again and complete the next quest?
