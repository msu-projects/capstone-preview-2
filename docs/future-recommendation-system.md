# Future Feature: Project Recommendation System

> **Status:** Planned Feature  
> **Target Release:** TBD  
> **Dependencies:** Sitio Data Module (Core System)

---

## Overview

This document outlines a planned intelligent recommendation system that will analyze sitio profiles and suggest the most suitable Programs, Projects, and Activities (PPAs) based on community needs, infrastructure gaps, and socioeconomic conditions.

The recommendation engine will enable evidence-based planning and prioritization of development interventions by providing data-driven suggestions for each sitio.

---

## Table of Contents

1. [Recommendation System Purpose](#1-recommendation-system-purpose)
2. [Available PPAs](#2-available-ppas)
   - [2.1 Infrastructure Projects](#21-infrastructure-projects)
   - [2.2 Service Delivery & Social Projects](#22-service-delivery--social-projects)
3. [Recommendation Engine](#3-recommendation-engine)
   - [3.1 Scoring Methodology](#31-scoring-methodology)
   - [3.2 Priority Levels](#32-priority-levels)
4. [Sitio Profile Data Model](#4-sitio-profile-data-model)
5. [Recommendation Workflows](#5-recommendation-workflows)
   - [5.1 View Recommendations for a Sitio](#51-view-recommendations-for-a-sitio)
   - [5.2 Explore Recommendations Page](#52-explore-recommendations-page)
6. [Sitio Need Score](#6-sitio-need-score)

---

## 1. Recommendation System Purpose

The Project Recommendation module will provide intelligent, data-driven recommendations for Programs, Projects, and Activities (PPAs) that are most suitable for each sitio based on their unique profile. The recommendation engine will analyze:

- **Infrastructure gaps** - Missing or inadequate facilities and utilities
- **Socioeconomic conditions** - Poverty levels, unemployment, income distribution
- **Health and safety needs** - Disease prevalence, risk exposure, sanitation
- **Community priorities** - Identified needs and proposed interventions
- **Geographic context** - GIDA classification, indigenous communities, conflict areas

This will enable evidence-based planning and prioritization of development interventions.

---

## 2. Available PPAs

### 2.1 Infrastructure Projects

| PPA                        | Description                                  |
| -------------------------- | -------------------------------------------- |
| Potable Water System       | Installation/rehabilitation of water systems |
| Community Comfort Room     | Public toilet facility construction          |
| Solar Street Lights        | Solar lighting installation                  |
| Road Construction/Opening  | Road development or improvement              |
| Bridge Construction        | Bridge building or repair                    |
| School Building/Classroom  | Educational infrastructure                   |
| Health Center Construction | Medical facility development                 |
| Market Facility            | Public market construction                   |

### 2.2 Service Delivery & Social Projects

| PPA                      | Description                      |
| ------------------------ | -------------------------------- |
| Farm Tools Distribution  | Agricultural equipment provision |
| Seed Distribution        | Planting materials provision     |
| Agricultural Training    | Farmer capacity building         |
| Livelihood Training      | Skills development programs      |
| Medical Mission          | Health service delivery          |
| Medicine Distribution    | Pharmaceutical provision         |
| Madrasah Support         | Islamic education support        |
| Educational Assistance   | Scholarship or school supplies   |
| Waste Management Program | Sanitation and waste handling    |

---

## 3. Recommendation Engine

### 3.1 Scoring Methodology

The recommendation engine will evaluate each PPA against a sitio's profile using a multi-criteria scoring system. Each PPA will have a set of weighted criteria that assess the sitio's need for that particular intervention.

#### Scoring Process

1. **Criteria Evaluation** - Each criterion evaluates specific aspects of the sitio profile
2. **Point Assignment** - Points are awarded based on how well the sitio matches the criterion
3. **Score Aggregation** - Individual criterion scores are summed to create a total need score (out of 10)
4. **Priority Classification** - The total score determines the priority level
5. **Reasoning Generation** - Explanations are generated for why points were awarded

#### Example Criteria (Potable Water System)

| Criterion                     | Max Points | Evaluation Logic                                                  |
| ----------------------------- | ---------- | ----------------------------------------------------------------- |
| No Functional Water Source    | 3.0        | Awards full points if no Level 2/3 functional water systems exist |
| Reliance on Natural Sources   | 2.5        | Awards points if community relies only on natural water sources   |
| Existing System Needs Repair  | 1.5        | Awards points if water infrastructure needs repair                |
| Waterborne Disease Prevalence | 1.5        | Awards points if waterborne health issues are reported            |
| Large Population Impact       | 1.5        | Awards points based on population size (500+, 300+, 150+)         |
| GIDA Classification           | 1.0        | Awards points if sitio is classified as GIDA                      |

### 3.2 Priority Levels

Each PPA recommendation will be assigned a priority level based on the need score:

| Priority     | Score Range | Color Badge | Description                                           |
| ------------ | ----------- | ----------- | ----------------------------------------------------- |
| **Critical** | 9.0 - 10.0  | Red/Rose    | Urgent need; should be prioritized immediately        |
| **High**     | 7.0 - 8.9   | Orange      | Significant need; important for community development |
| **Moderate** | 4.0 - 6.9   | Yellow      | Moderate need; beneficial but not urgent              |
| **Low**      | 0.0 - 3.9   | Green       | Low priority; minimal evidence of need                |

---

## 4. Sitio Profile Data Model

The recommendation engine will evaluate sitio profiles using the comprehensive data structure defined in the SitioProfile interface. All fields are documented in the main **project-process-overview.md** document.

### 4.1 Data Model Structure

The sitio profile follows this hierarchical organization:

```
SitioProfile
├── Section A: Basic Sitio Information
│   ├── municipality, barangay, sitioName, sitioCode
│   ├── latitude, longitude
│   ├── sitioClassification (gida, indigenous, conflict)
│   └── mainAccess (pavedRoad, unpavedRoad, footpath, boat)
├── Section B: Population & Demographics
│   ├── totalPopulation, totalHouseholds, registeredVoters
│   ├── laborForceCount, schoolAgeChildren
│   ├── population (totalMale, totalFemale)
│   ├── vulnerableGroups (muslimCount, ipCount, seniorsCount, etc.)
│   └── osy (exists, count)
├── Section C: Basic Utilities & Connectivity
│   ├── householdsWithToilet, householdsWithElectricity
│   ├── electricitySources (grid, solar, battery, generator)
│   ├── mobileSignal, householdsWithInternet
│   └── sanitationTypes (waterSealed, pitLatrine, communityCR, openDefecation)
├── Section D: Community Facilities
│   └── facilities (healthCenter, pharmacy, communityToilet, kindergarten,
│       elementarySchool, highSchool, madrasah, market)
├── Section E: Roads & Internal Infrastructure
│   └── infrastructure (asphalt, concrete, gravel, natural)
├── Section F: Education Status
│   └── studentsPerRoom
├── Section G: Water & Sanitation
│   ├── waterSources (natural, level1, level2, level3)
│   └── sanitationTypes
├── Section H: Livelihood & Agriculture
│   ├── workerClass (privateHousehold, privateEstablishment, government, selfEmployed, employer, ofw - all number counts)
│   ├── averageDailyIncome
│   ├── agriculture (numberOfFarmers, numberOfAssociations, estimatedFarmAreaHectares)
│   ├── crops (array), livestock (array)
├── Section I: Safety & Risk Context
│   ├── hazards (flood, landslide, drought, earthquake)
│   ├── foodSecurity
└── Section J: Sitio Priority Needs
    ├── priorities (array of {name, rating} objects)
```

### 4.2 Key Evaluation Points

The recommendation engine will evaluate these critical aspects:

| Aspect               | Data Sources Used                                                     |
| -------------------- | --------------------------------------------------------------------- |
| Infrastructure Gaps  | facilities, waterSources, householdsWithElectricity, infrastructure   |
| Socioeconomic Status | averageDailyIncome, vulnerableGroups.unemployedCount, laborForceCount |
| Health & Safety      | hazards, foodSecurity, sanitationTypes, householdsWithToilet          |
| Geographic Context   | sitioClassification (gida, indigenous, conflict), mainAccess          |
| Community Needs      | priorities (array of intervention ratings)                            |
| Population Impact    | totalPopulation, totalHouseholds                                      |
| Education Needs      | studentsPerRoom, schoolAgeChildren, vulnerableGroups.outOfSchoolYouth |
| Agricultural Context | workerClass, agriculture, crops, livestock                            |

---

## 5. Recommendation Workflows

### 5.1 View Recommendations for a Sitio

```
Start
  │
  ▼
Navigate to Sitio Profile
  │
  ▼
View "Recommendations" Section
  │
  ▼
System Analyzes Sitio Profile
  │
  ├──▶ Evaluate infrastructure gaps
  ├──▶ Assess socioeconomic conditions
  ├──▶ Check health and safety needs
  ├──▶ Consider geographic context
  └──▶ Review community priorities
  │
  ▼
Generate PPA Recommendations
  │
  ├──▶ Calculate need scores (0-10)
  ├──▶ Assign priority levels
  └──▶ Generate reasoning explanations
  │
  ▼
Display Recommendations List
  │
  ├──▶ Sorted by priority (Critical → Low)
  ├──▶ Show need score badge
  ├──▶ Display reasoning points
  └──▶ Show expected beneficiaries
  │
  ▼
User Reviews Recommendations
  │
  ├──▶ View detailed reasoning
  ├──▶ Compare priority levels
  └──▶ Identify suitable PPAs
  │
  ▼
End
```

### 5.2 Explore Recommendations Page

The Sitio Recommendations Page will be a publicly accessible tool that allows users to discover and analyze recommended sitios for potential projects.

```
Start
  │
  ▼
Navigate to Recommendations Page
  │ (/recommendations for public, /admin/recommendations for admin)
  │
  ▼
Select Project Category
  │ (Infrastructure, Agriculture, Education, Health, Livelihood, Environment)
  │
  ▼
Select Project Type
  │ (Cascading based on category)
  │
  ▼
System Calculates PPA Matches
  │
  ├──▶ Match project type keywords against sitio priorities
  ├──▶ Match against catchupIntervention fields
  └──▶ Tag sitios with matching needs
  │
  ▼
Display Recommendations
  │
  ├──▶ Show count of sitios with matching needs
  ├──▶ Display matched sitios first (sorted by need score)
  ├──▶ Show non-matched sitios after (sorted by need score)
  └──▶ Show match indicators and priority badges
  │
  ▼
Apply Filters (Optional)
  │
  ├──▶ Search by name/location
  ├──▶ Filter by municipality
  ├──▶ Filter by barangay
  └──▶ Toggle need score sort order
  │
  ▼
Review Sitio Recommendations
  │
  ├──▶ View sitio statistics
  ├──▶ See matched priorities/interventions
  └──▶ Check need level badges
  │
  ▼
Click Sitio to View Profile
  │ (Navigate to detailed sitio page)
  │
  ▼
End
```

#### 5.2.1 Recommendation Display Features

**For Each Sitio Shown:**

| Display Element         | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| Match Badge             | Sparkle icon indicating PPA alignment with community needs |
| Sitio Name              | Name with municipality and barangay                        |
| Need Score Badge        | Color-coded badge (Critical/High/Medium/Low)               |
| Population & Households | Statistics showing community size                          |
| Matched Priorities      | Shows which priority rankings match the project type       |
| Matched Interventions   | Shows which catchupIntervention fields align               |
| Location Details        | Barangay and municipality information                      |

**Matching Logic:**

The system will match project types against:

1. **Priority fields** - priority1, priority2, priority3 text values
2. **Catch-up interventions** - Boolean flags in catchupIntervention object
3. **Custom interventions** - catchupIntervention.others string value

#### 5.2.2 Project Type to Intervention Mapping

| Project Type            | Matches Against                                                         |
| ----------------------- | ----------------------------------------------------------------------- |
| Potable Water System    | catchupIntervention.waterSystem, priorities mentioning "water"          |
| Community Comfort Room  | catchupIntervention.communityCR, priorities mentioning "toilet/CR"      |
| Solar Street Lights     | catchupIntervention.solarLights, priorities mentioning "lights"         |
| Road Construction       | catchupIntervention.roadOpening, priorities mentioning "road"           |
| Farm Tools Distribution | catchupIntervention.farmTools, priorities mentioning "farm/agriculture" |
| Madrasah Support        | catchupIntervention.madrasahSupport, priorities mentioning "madrasah"   |
| Health Services         | catchupIntervention.healthServices, priorities mentioning "health"      |
| Custom Project Types    | Matches against priorities and catchupIntervention.others               |

---

## 6. Sitio Need Score

The Need Score will be a dynamically-calculated metric (0-10) that indicates a sitio's priority for development projects. A higher score will indicate a greater need for assistance. The score will be automatically computed by the recommendation engine based on the sitio's profile data, infrastructure gaps, socioeconomic conditions, and community needs.

### 6.1 Score Scale

The need score will be calculated by analyzing all available project recommendations for a sitio and determining which projects have the highest priority based on the sitio's profile.

| Score   | Description                                      |
| ------- | ------------------------------------------------ |
| 0-3.9   | Low need - community is relatively well-served   |
| 4.0-6.9 | Medium need - some gaps exist but manageable     |
| 7.0-8.9 | High need - significant gaps requiring attention |
| 9.0-10  | Critical need - urgent intervention required     |

### 6.2 Need Levels

| Level    | Score Range | Color Badge | Description                          |
| -------- | ----------- | ----------- | ------------------------------------ |
| Critical | 8–10        | Red/Rose    | Urgent need, prioritize for projects |
| High     | 6–7         | Orange      | Significant need                     |
| Medium   | 4–5         | Yellow      | Moderate need                        |
| Low      | 1–3         | Green       | Relatively well-served               |

### 6.3 Score Assignment

- **Automatic Calculation**: The score will be computed automatically using the `ProjectScoringEngine` from the recommendation system
- **Real-time Updates**: Scores will be recalculated whenever sitio profile data changes
- **Criteria-Based**: The engine will evaluate multiple weighted criteria across all available PPAs
- **Top Priority Method**: The overall need score will be derived from the highest-priority project recommendations
- **No Manual Override**: Scores will not be manually editable; they will reflect objective data-driven analysis

### 6.4 Calculation Methodology

The need score calculation will follow this process:

1. **Profile Analysis**: The `ProjectScoringEngine` will evaluate the sitio profile against all available PPAs
2. **Criteria Scoring**: Each PPA's criteria will be evaluated and points awarded
3. **Priority Assignment**: Each PPA will receive a priority level based on its total score:
   - **Critical** (9.0-10.0): Urgent intervention needed
   - **High** (6.0-7.9): Significant need requiring attention
   - **Moderate** (4.0-5.9): Some gaps exist
   - **Low** (0-3.9): Relatively well-served
4. **Overall Score Derivation**: The sitio's overall need score will be determined by:
   - Identifying the highest-priority project recommendations
   - Weighting scores by project category (Infrastructure vs. Service Delivery)
   - Computing an aggregate score that reflects the sitio's most critical needs
5. **Need Level Assignment**: The final score will be mapped to a need level (Critical/High/Medium/Low)

This data-driven approach will ensure objective, consistent scoring across all sitios based on actual community conditions rather than subjective assessments.

### 6.5 Planned Admin Features

| Feature             | Description                                                               |
| ------------------- | ------------------------------------------------------------------------- |
| Need Score Display  | Automatically calculated and displayed (0-10) with visual level indicator |
| Need Score Badge    | Color-coded badge (Critical/High/Medium/Low) in sitio list                |
| Filter by Level     | Filter sitio list by need level                                           |
| Sort by Score       | Sort sitio list by need score (high to low or low to high)                |
| Dashboard Chart     | Donut chart showing distribution of sitios by need level                  |
| Average Need Score  | Dashboard metric showing average need score across sitios                 |
| Score Recalculation | Scores automatically update when sitio profile data is modified           |
| Recommendation Link | View detailed project recommendations that contributed to the score       |

---

## Implementation Notes

### Data Model Preparation

The sitio profile data model already includes fields that will support future recommendation features:

| Field            | Type                | Description                                           |
| ---------------- | ------------------- | ----------------------------------------------------- |
| averageNeedScore | number              | Average need score (0-10) - Reserved for future use   |
| recommendations  | PPARecommendation[] | List of PPA recommendations - Reserved for future use |

These fields are included in the data model but will not be actively used until the recommendation system is implemented.

### Technical Requirements

When implementing this feature, the following components will be needed:

1. **ProjectScoringEngine** - Core recommendation algorithm
2. **PPA Criteria Definitions** - Weighted scoring criteria for each project type
3. **Recommendation API** - Backend service for generating recommendations
4. **UI Components** - Recommendation display, filtering, and visualization
5. **Admin Tools** - Configuration interface for PPA criteria and weights

### Migration Strategy

The current system stores sitio data without calculated recommendations. Upon implementation:

1. Existing sitio records will have their `averageNeedScore` and `recommendations` calculated
2. A one-time batch processing job will populate recommendation data
3. Future sitio updates will trigger automatic recalculation
4. Historical sitio data will be preserved for audit purposes
