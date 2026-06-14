# 03_GAME_SYSTEM.md

# Game System

## Project Name

**RunQuest PH**

## Purpose

This document defines the basic game system for RunQuest PH.

The game system should make walking, jogging, and running feel like progress in an adventure game. Users should feel that every completed activity helps them grow their character, earn XP, level up, and explore Philippine areas.

---

# 1. Core Game Loop

The core game loop is:

1. User selects a course.
2. User schedules or starts an activity.
3. User walks, jogs, or runs the course.
4. App tracks GPS, distance, time, and speed.
5. User completes the course.
6. App calculates XP.
7. User gains XP.
8. User level increases if XP requirement is met.
9. Area exploration progress increases.
10. User unlocks new goals, badges, routes, or character rewards.

The goal is to make users want to return and complete the next quest.

---

# 2. Character System

## 2.1 Character Direction

The MVP will use human-style characters.

The character should feel:

* Cute
* Friendly
* Beginner-friendly
* Active
* Local travel-oriented
* Suitable for future fantasy RPG expansion

The character is not a serious professional athlete at the beginning. The character should feel like a user’s personal running companion or avatar.

## 2.2 Initial Character Concept

Initial character types may include:

1. City Walker
2. Weekend Jogger
3. Island Explorer

These characters can be visually simple in the MVP.

## 2.3 Character Growth

Character growth is connected to user progress.

Growth factors:

* User level
* Total XP
* Completed courses
* Area exploration progress
* Badges
* Premium items in the future

## 2.4 Future Character Expansion

Future character features may include:

* Outfit items
* Running shoes
* Hats
* Bags
* Local area costumes
* Fantasy equipment
* Event costumes
* Premium skins
* Partner brand items

---

# 3. XP System

## 3.1 XP Purpose

XP is the main growth currency of the app.

Users earn XP by completing walking, jogging, and running activities.

XP should reward:

* Distance
* Course difficulty
* Completion
* Consistency
* Performance
* Event participation
* Premium or challenge quests in the future

## 3.2 Basic XP Formula

The MVP XP formula is:

Final XP = Base Distance XP × Difficulty Multiplier × Performance Multiplier + Streak Bonus - Penalty

## 3.3 Base Distance XP

Base XP is calculated from distance.

Initial rule:

* 1 km = 100 XP

Examples:

* 1 km = 100 XP
* 3 km = 300 XP
* 5 km = 500 XP
* 10 km = 1,000 XP

## 3.4 Difficulty Multiplier

Each course has a difficulty level.

Suggested difficulty multipliers:

* Easy: × 1.0
* Normal: × 1.2
* Hard: × 1.5
* Challenge: × 2.0

Example:

A 3 km course gives 300 base XP.

* Easy 3 km course = 300 XP
* Normal 3 km course = 360 XP
* Hard 3 km course = 450 XP
* Challenge 3 km course = 600 XP

## 3.5 Performance Multiplier

Performance multiplier reflects how well the user completed the activity.

Suggested MVP performance multipliers:

* Completed slowly but valid: × 0.9
* Normal completion: × 1.0
* Good pace: × 1.1
* Excellent pace: × 1.2
* Suspicious speed: XP blocked or activity flagged

The app should not punish beginners too strongly. Completion is more important than speed in the early version.

## 3.6 Streak Bonus

Streak bonus rewards consistency.

Suggested fixed XP bonuses:

* 2-day streak: +20 XP
* 3-day streak: +50 XP
* 7-day streak: +150 XP
* 14-day streak: +400 XP
* 30-day streak: +1,000 XP

Future versions may use percentage-based bonuses.

## 3.7 Scheduled Quest Bonus and Missed Activity

Users may schedule a walking, jogging, or running quest.

If the user completes a scheduled quest, the user may receive a scheduled quest bonus.

If the user misses a scheduled quest, the app should not strongly punish the user in the MVP.

Recommended MVP rule:

* Completed scheduled quest: bonus XP
* Missed scheduled quest: scheduled bonus is lost
* Optional small penalty: -5 XP or -10 XP

The app should avoid harsh penalties because negative emotions may reduce user retention.

---

# 4. Level System

## 4.1 Level Purpose

Level shows the user’s overall growth.

A higher level means the user has completed more activities, gained more XP, and continued the journey.

## 4.2 MVP Level Curve

The MVP can use a simple XP table.

Example:

* Level 1: 0 XP
* Level 2: 300 XP
* Level 3: 700 XP
* Level 4: 1,200 XP
* Level 5: 2,000 XP
* Level 10: 8,000 XP
* Level 20: 30,000 XP

The level curve can be adjusted after user testing.

## 4.3 Level Titles

Suggested level titles:

* Level 1: New Walker
* Level 2: Street Explorer
* Level 3: City Jogger
* Level 4: Route Adventurer
* Level 5: Urban Runner
* Level 10: Island Explorer
* Level 20: Marathon Hero
* Level 30: Legendary Runner

---

# 5. Area Exploration System

## 5.1 Area Exploration Purpose

Area exploration shows how much the user has explored a specific area.

Example areas:

* BGC
* Makati / Ayala Triangle
* MOA / Pasay

Area exploration is separate from user level.

Level represents total growth.
Area exploration represents local journey progress.

## 5.2 Exploration Formula Direction

Area exploration should be calculated using both:

1. Number of completed courses in the area
2. Total distance completed in the area

The exact formula can be adjusted later.

## 5.3 Suggested MVP Formula

Suggested formula:

Area Progress = Course Completion Progress × 70% + Distance Progress × 30%

Example:

If an area has:

* 10 total courses
* 30 km target distance

And the user has completed:

* 4 courses
* 9 km

Then:

* Course Completion Progress = 4 / 10 = 40%
* Distance Progress = 9 / 30 = 30%

Area Progress:

* 40% × 70% = 28%
* 30% × 30% = 9%
* Total = 37%

So the user’s area exploration progress is 37%.

## 5.4 Area Unlocking

Area progress may unlock:

* New courses
* Badges
* Character items
* Area titles
* Premium missions
* Fantasy map skins
* Partner rewards in the future

---

# 6. Badge System

## 6.1 MVP Badges

Basic badges may include:

* First Quest Completed
* First 1 km
* First 5 km
* First BGC Course
* First Makati Course
* First MOA Course
* 3-Day Streak
* 7-Day Streak
* 10 Courses Completed

## 6.2 Future Badges

Future badges may include:

* Monthly Challenge Winner
* Event Finisher
* Partner Challenge Finisher
* Premium Explorer
* Watch Verified Runner
* Fantasy Area Champion

---

# 7. Suspicious Activity Detection

The MVP should detect clearly abnormal activities.

Possible suspicious cases:

* Unrealistic speed
* GPS jump
* Very short time completion
* Distance completed without enough GPS points
* Repeated identical suspicious activity

Suggested MVP action:

* Mark activity as suspicious
* Hold XP reward
* Show admin review status
* Do not immediately ban user

---

# 8. Free and Premium Game Difference

## 8.1 Free User

Free users can access:

* Basic courses
* Basic XP
* Basic levels
* Basic area progress
* Basic character
* Basic badges

## 8.2 Premium User

Premium users may access:

* Advanced statistics
* Personalized goal plans
* AI running coach
* Premium courses
* Fantasy map themes
* Special badges
* Character items
* Watch data integration
* Event discounts
* Partner gift cards and discount coupons

Premium should feel like:

Better self-management + deeper game experience + real-world rewards

---

# 9. MVP Design Principle

The MVP should keep the game system simple.

The first version should prove that users enjoy:

* Completing courses
* Earning XP
* Leveling up
* Growing a character
* Increasing area exploration progress

The game system should be designed to expand later without requiring a complete rebuild.
