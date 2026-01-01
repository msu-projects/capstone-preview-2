# System Overview

## South Cotabato Convergence Data Bank

---

## Executive Summary

This document provides a comprehensive overview of the South Cotabato Convergence Data Bank system. The system serves two primary purposes:

1. **Sitio Data Management** - A public-facing module that allows citizens to view detailed demographic, social, economic, and infrastructure data about vulnerable communities (Sitios) in South Cotabato Province.

2. **Project Recommendation** - An intelligent recommendation system that analyzes sitio profiles and suggests the most suitable Programs, Projects, and Activities (PPAs) based on community needs, infrastructure gaps, and socioeconomic conditions.

The system enables transparency by providing public access to community profiles while supporting government officials in identifying priority interventions through data-driven recommendations.

---

## Table of Contents

### Part I: Sitio Data Module

1. [Sitio Module Purpose](#1-sitio-module-purpose)
2. [Sitio Data Entity](#2-sitio-data-entity)
3. [Sitio Data Categories](#3-sitio-data-categories)
4. [Public Portal Features](#4-public-portal-features)
   - [4.1 Sitio Aggregate Dashboard](#41-sitio-aggregate-dashboard)
   - [4.2 Sitio Discovery](#42-sitio-discovery)
   - [4.3 Sitio Profile View](#43-sitio-profile-view)
   - [4.4 Data Visualization](#44-data-visualization)
   - [4.5 Sitio Data Management (Admin Only)](#45-sitio-data-management-admin-only)
   - [4.6 Sitio Need Score](#46-sitio-need-score)

### Part II: Project Recommendation Module

5. [Recommendation System Purpose](#5-recommendation-system-purpose)
6. [Available PPAs](#6-available-ppas)
   - [6.1 Infrastructure Projects](#61-infrastructure-projects)
   - [6.2 Service Delivery & Social Projects](#62-service-delivery--social-projects)
7. [Recommendation Engine](#7-recommendation-engine)
   - [7.1 Scoring Methodology](#71-scoring-methodology)
   - [7.2 Priority Levels](#72-priority-levels)
8. [Sitio Profile Data Model](#8-sitio-profile-data-model)
9. [Recommendation Workflows](#9-recommendation-workflows)
   - [9.1 View Recommendations for a Sitio](#91-view-recommendations-for-a-sitio)
   - [9.2 Explore Recommendations Page](#92-explore-recommendations-page)

### Part III: System-Wide

10. [Audit Trail](#10-audit-trail)
11. [Access Control](#11-access-control)
12. [Validation Rules & Business Rules](#12-validation-rules--business-rules)
13. [Glossary](#13-glossary)
14. [Version History](#14-version-history)

---

---

# Part I: Sitio Data Module

---

## 1. Sitio Module Purpose

The Sitio Data Module serves as a public-facing data bank that provides comprehensive information about vulnerable communities (Sitios) in South Cotabato Province. It enables:

- **Public Transparency** - Citizens can view detailed demographic and socioeconomic data about their communities
- **Data-Driven Planning** - Government officials can access community profiles to inform development decisions
- **Project Targeting** - Sitio data helps identify communities that need specific interventions

---

## 2. Sitio Data Entity

### 2.1 Core Identification

| Field        | Type   | Description                                                 |
| ------------ | ------ | ----------------------------------------------------------- |
| municipality | string | Name of the municipality                                    |
| barangay     | string | Name of the barangay                                        |
| sitioName    | string | Name of the specific Sitio / Purok                          |
| sitioCode    | string | Purok/Sitio Code (if available)                             |
| latitude     | number | Geographical latitude in decimal degrees (e.g., 7.12345)    |
| longitude    | number | Geographical longitude in decimal degrees (e.g., 125.12345) |

---

## 3. Sitio Data Categories

### 3.1 Sitio Classification & Access

#### Classification Context (sitioClassification object)

| Field      | Type    | Description                                    |
| ---------- | ------- | ---------------------------------------------- |
| gida       | boolean | Geographically Isolated and Disadvantaged Area |
| indigenous | boolean | Indigenous Community                           |
| conflict   | boolean | Conflict-Affected Area (Past 3 years)          |

#### Main Access Methods (mainAccess object)

| Field       | Type    | Description                    |
| ----------- | ------- | ------------------------------ |
| pavedRoad   | boolean | Paved road access available    |
| unpavedRoad | boolean | Unpaved/earth road access      |
| footpath    | boolean | Footpath access only           |
| boat        | boolean | Water-based access (river/sea) |

### 3.2 Demographics & Population

#### Basic Demographics

| Field             | Type   | Description                       |
| ----------------- | ------ | --------------------------------- |
| totalPopulation   | number | Total population count            |
| totalHouseholds   | number | Total number of households        |
| registeredVoters  | number | Total number of registered voters |
| laborForceCount   | number | Labor force count                 |
| schoolAgeChildren | number | Number of school-age children     |

#### Population Breakdown (population object)

| Field       | Type   | Description                     |
| ----------- | ------ | ------------------------------- |
| totalMale   | number | Total count of male residents   |
| totalFemale | number | Total count of female residents |

#### Vulnerable Groups (vulnerableGroups object)

| Field                 | Type   | Description                                  |
| --------------------- | ------ | -------------------------------------------- |
| muslimCount           | number | Estimated Muslim population                  |
| ipCount               | number | Estimated Indigenous Peoples (IP) population |
| seniorsCount          | number | Seniors (60 years old and above)             |
| laborForce60to64Count | number | Labor force (of which are 60-64 years old)   |
| unemployedCount       | number | Estimated unemployed persons                 |
| noBirthCertCount      | number | Individuals without birth certificates       |
| noNationalIDCount     | number | Individuals without National ID / PhilSys ID |
| outOfSchoolYouth      | number | Number of out-of-school youth (OSY)          |

### 3.3 Access to Basic Utilities

#### Sanitation

| Field                | Type   | Description                               |
| -------------------- | ------ | ----------------------------------------- |
| householdsWithToilet | number | Number of households with toilet facility |

**Sanitation Types** (sanitationTypes object - boolean flags):

| Field          | Description            |
| -------------- | ---------------------- |
| waterSealed    | Water-sealed toilet    |
| pitLatrine     | Pit latrine            |
| communityCR    | Community comfort room |
| openDefecation | Open defecation        |

#### Electricity

| Field                     | Type   | Description                      |
| ------------------------- | ------ | -------------------------------- |
| householdsWithElectricity | number | Number of electrified households |

**Electricity Sources** (electricitySources object - counts for each type):

| Source    | Description                  |
| --------- | ---------------------------- |
| grid      | Connected to main power grid |
| solar     | Uses solar panels            |
| battery   | Uses battery storage         |
| generator | Uses fuel-powered generators |

#### Internet Connectivity

| Field                  | Type   | Description                           |
| ---------------------- | ------ | ------------------------------------- |
| householdsWithInternet | number | Households with Internet Connectivity |

#### Mobile Signal Coverage

| Field        | Type                                   | Description                  |
| ------------ | -------------------------------------- | ---------------------------- |
| mobileSignal | 'none' \| '2g' \| '3g' \| '4g' \| '5g' | Best available mobile signal |

### 3.4 Facilities

Each facility contains the following properties:

| Property          | Type                  | Description                                       |
| ----------------- | --------------------- | ------------------------------------------------- |
| exists            | 'yes' \| 'no'         | Does the facility exist in the Sitio?             |
| count             | number                | Number of facilities (if exists)                  |
| distanceToNearest | number                | Distance to nearest in km (if does not exist)     |
| condition         | 1 \| 2 \| 3 \| 4 \| 5 | Condition of best facility (1=Bad to 5=Excellent) |

**Available Facilities:**

| Facility         | Description               |
| ---------------- | ------------------------- |
| healthCenter     | Health center facility    |
| pharmacy         | Pharmacy                  |
| communityToilet  | Community toilet          |
| kindergarten     | Kindergarten school       |
| elementarySchool | Elementary school         |
| highSchool       | High school               |
| madrasah         | Islamic school (Madrasah) |
| market           | Public market             |

**Facility Condition Scale:**

- **5** - Excellent: New or very recently renovated; no defects
- **4** - Good: Functional with only minor cosmetic wear
- **3** - Fair: Functional but showing clear signs of age; likely needs repair soon
- **2** - Poor: Major defects; requires immediate repair to stay functional
- **1** - Bad/Critical: Unsafe to use; needs replacement or total overhaul

### 3.5 Road & Internal Infrastructure

Each road type contains the following properties (infrastructure object):

| Property  | Type                  | Description                           |
| --------- | --------------------- | ------------------------------------- |
| exists    | 'yes' \| 'no'         | Does this road type exist?            |
| length    | number                | Length in KMs (if exists)             |
| condition | 1 \| 2 \| 3 \| 4 \| 5 | Condition code (1=Bad to 5=Excellent) |

**Road Types Available:**

| Type     | Description                |
| -------- | -------------------------- |
| asphalt  | Asphalt road surface       |
| concrete | Concrete road surface      |
| gravel   | Gravel road surface        |
| natural  | Natural/Earth surface road |

**Road Condition Scale:**

- **5** - Excellent: New or very recently paved
- **4** - Good: Minor wear, fully accessible
- **3** - Fair: Some wear, accessible but needs maintenance soon
- **2** - Poor: Potholes, slow travel, needs repair
- **1** - Bad: Dilapidated, difficult for vehicles

### 3.6 Education

| Field           | Type                                                                     | Description                 |
| --------------- | ------------------------------------------------------------------------ | --------------------------- |
| studentsPerRoom | 'less_than_46' \| '46_50' \| '51_55' \| 'more_than_56' \| 'no_classroom' | Number of students per room |

### 3.7 Water & Sanitation

#### Water Sources

Each water source contains:

| Field  | Type   | Description                                                |
| ------ | ------ | ---------------------------------------------------------- |
| name   | string | Name of the water source (e.g., "Well", "Water System")    |
| type   | string | 'natural', 'level1', 'level2', or 'level3'                 |
| status | string | 'functional', 'repair', 'construction', or 'not-developed' |

**Water Source Types:**

| Type    | Description               |
| ------- | ------------------------- |
| natural | Spring / River / Dug well |
| level1  | Point source / pump       |
| level2  | Communal faucet           |
| level3  | House connection          |

**Water Source Status:**

| Status        | Description                     |
| ------------- | ------------------------------- |
| functional    | Operational and working         |
| repair        | Needs repair                    |
| construction  | Currently under construction    |
| not-developed | Potential source, not developed |

### 3.8 Livelihood & Agriculture

#### Worker Class (workerClass object - boolean flags)

| Field                | Description                                      |
| -------------------- | ------------------------------------------------ |
| privateHousehold     | e.g., domestic helper                            |
| privateEstablishment | e.g., company employee                           |
| government           | e.g., Barangay Tanod, Teacher                    |
| selfEmployed         | e.g., Sari-sari store                            |
| employer             | Own family-operated farm/business with employees |
| unpaidFamilyWorker   | Unpaid family worker                             |

#### Income

| Field              | Type   | Description                        |
| ------------------ | ------ | ---------------------------------- |
| averageDailyIncome | number | Average Household Income (per day) |

#### Agricultural Statistics (agriculture object)

| Field                     | Type   | Description                     |
| ------------------------- | ------ | ------------------------------- |
| numberOfFarmers           | number | Number of farmers               |
| numberOfAssociations      | number | Number of farmer associations   |
| estimatedFarmAreaHectares | number | Estimated farm area in hectares |

#### Crops & Livestock

| Field     | Type     | Description                                           |
| --------- | -------- | ----------------------------------------------------- |
| crops     | string[] | Main crops produced (e.g., 'Palay', 'Corn', 'Banana') |
| livestock | string[] | Livestock/Poultry (e.g., 'Pig', 'Cow', 'Chicken')     |

### 3.9 Safety & Risk Context

#### Environmental & Natural Hazards (hazards object)

Each hazard contains:

| Field     | Type   | Description                                    |
| --------- | ------ | ---------------------------------------------- |
| frequency | string | Frequency in past 12 months (text description) |

**Hazard Types:**

| Type       | Description       |
| ---------- | ----------------- |
| flood      | Flooding events   |
| landslide  | Landslide events  |
| drought    | Drought events    |
| earthquake | Earthquake events |

#### Peace and Order Status

| Field      | Type                                            | Description                    |
| ---------- | ----------------------------------------------- | ------------------------------ |
| peaceOrder | 'stable' \| 'occasional_tensions' \| 'unstable' | Current peace and order status |

#### Food Security

| Field        | Type                                                   | Description                   |
| ------------ | ------------------------------------------------------ | ----------------------------- |
| foodSecurity | 'secure' \| 'seasonal_scarcity' \| 'critical_shortage' | Primary food security concern |

### 3.10 Sitio Priority Needs

**Priority Interventions** (priorities object - rating scale 0-3):

| Field             | Type             | Description                              |
| ----------------- | ---------------- | ---------------------------------------- |
| waterSystem       | 0 \| 1 \| 2 \| 3 | Water system priority                    |
| communityCR       | 0 \| 1 \| 2 \| 3 | Community comfort room priority          |
| solarStreetLights | 0 \| 1 \| 2 \| 3 | Solar street lights priority             |
| roadOpening       | 0 \| 1 \| 2 \| 3 | Road opening priority                    |
| farmTools         | 0 \| 1 \| 2 \| 3 | Farm tools priority                      |
| healthServices    | 0 \| 1 \| 2 \| 3 | Health services priority                 |
| educationSupport  | 0 \| 1 \| 2 \| 3 | Education support priority               |
| others            | 0 \| 1 \| 2 \| 3 | Other priorities (optional)              |
| othersSpecify     | string           | Specification for 'Others' if applicable |

**Priority Rating Scale:**

- **0** - Not needed
- **1** - Low priority
- **2** - Medium priority
- **3** - Very urgent

### 3.11 Recommendation

| Field            | Type                | Description                 |
| ---------------- | ------------------- | --------------------------- |
| averageNeedScore | number              | Average need score (0-10)   |
| recommendations  | PPARecommendation[] | List of PPA recommendations |

---

## 4. Public Portal Features

### 4.1 Sitio Aggregate Dashboard

The public portal provides an aggregate dashboard as the main entry point for exploring sitio data. This dashboard displays summary statistics and visualizations that respond to filter selections.

#### Dashboard Components

| Component                | Description                                                    |
| ------------------------ | -------------------------------------------------------------- |
| Filter Context Indicator | Badge showing current filter (e.g., "Showing: Koronadal City") |
| Municipality Filter      | Dropdown to filter all dashboard data by municipality          |
| Barangay Filter          | Cascading dropdown for barangay (dependent on municipality)    |
| View List Button         | Navigate to detailed sitio list with current filters preserved |
| Collapsible Dashboard    | Toggle to collapse/expand the charts section                   |

#### Quick Stats Cards

| Stat                 | Aggregation                                               |
| -------------------- | --------------------------------------------------------- |
| Total Sitios         | COUNT of filtered sitios                                  |
| Total Population     | SUM of totalPopulation                                    |
| Total Households     | SUM of totalHouseholds                                    |
| Avg Need Score       | AVG of averageNeedScore across filtered sitios            |
| Electrification Rate | Percentage: (householdsWithElectricity / totalHouseholds) |
| Toilet Access Rate   | Percentage: (householdsWithToilet / totalHouseholds)      |

#### Aggregate Charts

| Chart                   | Type           | Description                                              |
| ----------------------- | -------------- | -------------------------------------------------------- |
| Need Level Distribution | Donut          | Count of sitios by need level (Critical/High/Medium/Low) |
| Demographics Overview   | Stacked Bar    | Male/Female breakdown with labor force highlighted       |
| Utilities Coverage      | Horizontal Bar | Electricity, toilet access, street lights                |
| Infrastructure Summary  | Bar            | Facility existence rates, road coverage                  |

#### Mini Map Preview

- Displays markers for all filtered sitios
- Smaller height (300px) for dashboard context
- Click marker → navigate to sitio profile
- Syncs with active municipality/barangay filters
- **Note:** Sitios without valid coordinates are excluded from map displays but remain visible in list views

#### Empty State

When filters yield 0 sitios, the dashboard shows:

- "No sitios found for the selected filters" message
- All stats display as 0 or N/A
- Charts display empty state with helpful message

### 4.2 Sitio Discovery

From the aggregate dashboard, users can navigate to the detailed sitio list.

```
Start
  │
  ▼
View Aggregate Dashboard
  │
  ├──▶ Filter by Municipality
  ├──▶ Filter by Barangay
  └──▶ View Summary Statistics & Charts
  │
  ▼
Click "View List"
  │
  ▼
Browse Sitios List
  │
  ├──▶ Search by Name
  ├──▶ Toggle List/Map View
  ├──▶ Sort by Name/Population/Municipality
  └──▶ Paginate Results
  │
  ▼
Select Sitio
  │
  ▼
View Sitio Profile
  │
  ▼
End
```

### 4.3 Sitio Profile View

The public can view comprehensive sitio profiles organized into sections:

#### Overview Section

- Name, municipality, barangay, coding
- Geographic coordinates
- Visit information (first visit, visit number)
- Classification flags (GIDA, indigenous, conflict area)
- Main access methods

#### Demographics Section

- Population breakdown (male, female, total)
- Household count
- Age group distribution (seniors, labor workforce)
- Registered voters
- Muslim and IP populations
- Unemployment estimates
- Documentation status (unregistered births, no PhilSys ID)
- Out-of-school youth count

#### Utilities & Infrastructure Section

- Electricity access and sources (grid, solar, battery, generator)
- Toilet facilities count
- Sanitation methods
- Street lights presence and count
- Mobile signal coverage (5G, 4G, 3G, 2G)

#### Facilities Section

- Status of each facility (exists/distance/condition):
  - Health center
  - Comfort room
  - Schools (kindergarten, elementary, high school)
  - Madrasah (if applicable)
  - Market
  - Waste segregation facility

#### Roads & Access Section

- Road types present (asphalt, concrete, gravel)
- Road coverage extent
- Road condition assessment
- Main access methods

#### Education Section

- Classroom sufficiency
- School attendance assessment
- Out-of-school youth details

#### Healthcare Section

- Health concerns (malnutrition, maternal, waterborne, respiratory, limited medicines)

#### Water & Sanitation Section

- Detailed water sources (name, type, status)
- Sanitation methods breakdown

#### Livelihood & Agriculture Section

- Economic activities (farming, fishing, labor, trading)
- Income distribution across brackets
- Agricultural support received
- Farming statistics (farmers count, organizations, farm area)

#### Safety & Risk Section

- Conflict history (last 3 years)
- Environmental risks (flooding, landslides)
- Social risks (conflict, food insecurity)

#### Community Priorities Section

- Top 3 priority needs (ranked)
- Catch-up interventions identified
- Project recommendations based on sitio profile

### 4.4 Data Visualization

#### Aggregate Dashboard Visualizations

| Visualization           | Type           | Description                                               |
| ----------------------- | -------------- | --------------------------------------------------------- |
| Need Level Distribution | Donut Chart    | Count of sitios by need level (Critical/High/Medium/Low)  |
| Demographics Overview   | Stacked Bar    | Male/Female breakdown with labor force segment            |
| Utilities Coverage      | Horizontal Bar | Electricity, toilet, street lights across filtered sitios |
| Infrastructure Summary  | Bar Chart      | Facility existence rates, road coverage aggregates        |
| Mini Map Preview        | Leaflet Map    | Interactive map showing filtered sitio markers            |

#### Sitio Profile Visualizations

| Visualization         | Description                                         |
| --------------------- | --------------------------------------------------- |
| Map View              | Interactive map showing exact sitio coordinates     |
| Population Charts     | Demographics breakdown with age groups              |
| Infrastructure Status | Visual indicators for utilities and facility access |
| Income Distribution   | Chart showing household income bracket distribution |
| Water Sources Map     | Visualization of water source types and status      |

### 4.5 Sitio Data Management (Admin Only)

Administrators can create, edit, and delete sitio records through a multi-step form wizard.

> **Form Field Input Types:** Different fields have different input behaviors:
>
> - **Text inputs** - Fields like sitioName, municipality, barangay, coding
> - **Number inputs** - Population counts, coordinates, distances
> - **Dropdown selections** - Fixed options like sanitation type, road condition
> - **Checkbox groups** - Multi-select like classification flags, livelihood sources
> - **Radio buttons** - Yes/No fields like firstVisitCatchup, classroomsEnough
> - **Array inputs** - Water sources with add/remove functionality
> - **Object inputs** - Nested structures like facilities, health concerns

#### 4.5.1 Create Sitio

```
Start
  │
  ▼
Enter Basic Sitio Details
  │
  ├──▶ Municipality, Barangay, Sitio Name, Coding
  ├──▶ Coordinates (Latitude, Longitude)
  ├──▶ Visit Information
  └──▶ Classification & Access
  │
  ▼
Enter Demographics Data
  │
  ├──▶ Population counts (male, female, households)
  ├──▶ Voters, Muslim, IP populations
  ├──▶ Age groups and labor force
  └──▶ Documentation status
  │
  ▼
Enter Utilities & Infrastructure
  │
  ├──▶ Electricity (households, sources)
  ├──▶ Toilet facilities
  ├──▶ Street lights
  └──▶ Mobile signal coverage
  │
  ▼
Enter Facilities Data
  │
  ├──▶ For each facility: exists/distance/condition
  └──▶ Special handling for Madrasah (not applicable flag)
  │
  ▼
Enter Road & Internal Infrastructure
  │
  ├──▶ Road types, coverage, condition
  └──▶ Paved roads flag
  │
  ▼
Enter Education Data
  │
  ├──▶ Classroom sufficiency
  └──▶ Children not attending school
  │
  ▼
Enter Healthcare Data
  │
  └──▶ Health concerns checkboxes
  │
  ▼
Enter Water & Sanitation
  │
  ├──▶ Water sources (name, type, status)
  └──▶ Primary sanitation method
  │
  ▼
Enter Livelihood & Agriculture
  │
  ├──▶ Livelihood sources
  ├──▶ Agricultural support
  ├──▶ Income distribution
  └──▶ Farming statistics
  │
  ▼
Enter Safety & Risk Context
  │
  ├──▶ Conflict history
  └──▶ Common risks
  │
  ▼
Enter Community Priorities
  │
  ├──▶ Priority rankings (1, 2, 3)
  └──▶ Catch-up interventions
  │
  ▼
Validate Data
  │
  ▼
Save Sitio
  │
  ▼
End
```

#### 4.5.2 Edit Sitio

```
Start
  │
  ▼
Select Sitio from List
  │
  ▼
Open Sitio Details
  │
  ▼
Modify Information
  │
  ├──▶ Update any section (Basic, Demographics, etc.)
  └──▶ Changes tracked for audit trail
  │
  ▼
Validate Changes
  │
  ▼
Save Sitio
  │
  ▼
End
```

#### 4.5.3 Delete Sitio

```
Start
  │
  ▼
Select Sitio from List
  │
  ▼
Check for Dependencies
  │
  ├── Has Projects ──▶ Cannot Delete (show warning)
  │                      │
  │                      ▼
  │                    End
  │
  └── No Projects ──▶ Confirm Deletion
                        │
                        ├── Yes ──▶ Delete Sitio
                        │              │
                        │              ▼
                        │           End
                        │
                        └── No ───▶ Cancel
                                     │
                                     ▼
                                    End
```

**Note:** A sitio cannot be deleted if it has associated projects. All project associations must be removed first.

### 4.6 Sitio Need Score

The Need Score is a dynamically-calculated metric (0-10) that indicates a sitio's priority for development projects. A higher score indicates a greater need for assistance. The score is automatically computed by the recommendation engine based on the sitio's profile data, infrastructure gaps, socioeconomic conditions, and community needs.

#### 4.6.1 Score Scale

The need score is calculated by analyzing all available project recommendations for a sitio and determining which projects have the highest priority based on the sitio's profile.

| Score   | Description                                      |
| ------- | ------------------------------------------------ |
| 0-3.9   | Low need - community is relatively well-served   |
| 4.0-6.9 | Medium need - some gaps exist but manageable     |
| 7.0-8.9 | High need - significant gaps requiring attention |
| 9.0-10  | Critical need - urgent intervention required     |

#### 4.6.2 Need Levels

| Level    | Score Range | Color Badge | Description                          |
| -------- | ----------- | ----------- | ------------------------------------ |
| Critical | 8–10        | Red/Rose    | Urgent need, prioritize for projects |
| High     | 6–7         | Orange      | Significant need                     |
| Medium   | 4–5         | Yellow      | Moderate need                        |
| Low      | 1–3         | Green       | Relatively well-served               |

#### 4.6.3 Score Assignment

- **Automatic Calculation**: The score is computed automatically using the `ProjectScoringEngine` from the recommendation system
- **Real-time Updates**: Scores are recalculated whenever sitio profile data changes
- **Criteria-Based**: The engine evaluates multiple weighted criteria across all available PPAs
- **Top Priority Method**: The overall need score is derived from the highest-priority project recommendations
- **No Manual Override**: Scores cannot be manually edited; they reflect objective data-driven analysis

#### 4.6.4 Calculation Methodology

The need score calculation follows this process:

1. **Profile Analysis**: The `ProjectScoringEngine` evaluates the sitio profile against all available PPAs
2. **Criteria Scoring**: Each PPA's criteria are evaluated and points are awarded (see Section 7.1)
3. **Priority Assignment**: Each PPA receives a priority level based on its total score:
   - **Critical** (9.0-10.0): Urgent intervention needed
   - **High** (6.0-7.9): Significant need requiring attention
   - **Moderate** (4.0-5.9): Some gaps exist
   - **Low** (0-3.9): Relatively well-served
4. **Overall Score Derivation**: The sitio's overall need score is determined by:
   - Identifying the highest-priority project recommendations
   - Weighting scores by project category (Infrastructure vs. Service Delivery)
   - Computing an aggregate score that reflects the sitio's most critical needs
5. **Need Level Assignment**: The final score is mapped to a need level (Critical/High/Medium/Low)

This data-driven approach ensures objective, consistent scoring across all sitios based on actual community conditions rather than subjective assessments.

#### 4.6.5 Admin Features

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

# Part II: Project Recommendation Module

---

## 5. Recommendation System Purpose

The Project Recommendation module provides intelligent, data-driven recommendations for Programs, Projects, and Activities (PPAs) that are most suitable for each sitio based on their unique profile. The recommendation engine analyzes:

- **Infrastructure gaps** - Missing or inadequate facilities and utilities
- **Socioeconomic conditions** - Poverty levels, unemployment, income distribution
- **Health and safety needs** - Disease prevalence, risk exposure, sanitation
- **Community priorities** - Identified needs and proposed interventions
- **Geographic context** - GIDA classification, indigenous communities, conflict areas

This enables evidence-based planning and prioritization of development interventions.

---

## 6. Available PPAs

### 6.1 Infrastructure Projects

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

### 6.2 Service Delivery & Social Projects

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

## 7. Recommendation Engine

### 7.1 Scoring Methodology

The recommendation engine evaluates each PPA against a sitio's profile using a multi-criteria scoring system. Each PPA has a set of weighted criteria that assess the sitio's need for that particular intervention.

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

### 7.2 Priority Levels

Each PPA recommendation is assigned a priority level based on the need score:

| Priority     | Score Range | Color Badge | Description                                           |
| ------------ | ----------- | ----------- | ----------------------------------------------------- |
| **Critical** | 9.0 - 10.0  | Red/Rose    | Urgent need; should be prioritized immediately        |
| **High**     | 7.0 - 8.9   | Orange      | Significant need; important for community development |
| **Moderate** | 4.0 - 6.9   | Yellow      | Moderate need; beneficial but not urgent              |
| **Low**      | 0.0 - 3.9   | Green       | Low priority; minimal evidence of need                |

---

## 8. Sitio Profile Data Model

The recommendation engine evaluates sitio profiles using the comprehensive data structure defined in the SitioProfile interface. All fields are documented in **Section 3: Sitio Data Categories** above.

### 8.1 Data Model Structure

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
│   ├── workerClass (privateHousehold, privateEstablishment, government, etc.)
│   ├── averageDailyIncome
│   ├── agriculture (numberOfFarmers, numberOfAssociations, estimatedFarmAreaHectares)
│   ├── crops (array), livestock (array)
├── Section I: Safety & Risk Context
│   ├── hazards (flood, landslide, drought, earthquake)
│   ├── peaceOrder, foodSecurity
└── Section J: Sitio Priority Needs
    ├── priorities (waterSystem, communityCR, solarStreetLights, roadOpening,
    │   farmTools, healthServices, educationSupport, others)
    └── Section K: Recommendation
        ├── averageNeedScore
        └── recommendations (PPARecommendation[])
```

### 8.2 Key Evaluation Points

The recommendation engine evaluates these critical aspects:

| Aspect               | Data Sources Used                                                        |
| -------------------- | ------------------------------------------------------------------------ |
| Infrastructure Gaps  | facilities, waterSources, householdsWithElectricity, infrastructure      |
| Socioeconomic Status | averageDailyIncome, vulnerableGroups.unemployedCount, laborForceCount    |
| Health & Safety      | hazards, peaceOrder, foodSecurity, sanitationTypes, householdsWithToilet |
| Geographic Context   | sitioClassification (gida, indigenous, conflict), mainAccess             |
| Community Needs      | priorities (waterSystem, communityCR, etc.), averageNeedScore            |
| Population Impact    | totalPopulation, totalHouseholds                                         |
| Education Needs      | studentsPerRoom, schoolAgeChildren, vulnerableGroups.outOfSchoolYouth    |
| Agricultural Context | workerClass, agriculture, crops, livestock                               |

---

## 9. Recommendation Workflows

### 9.1 View Recommendations for a Sitio

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

### 9.2 Explore Recommendations Page

The Sitio Recommendations Page is a publicly accessible tool that allows users to discover and analyze recommended sitios for potential projects without creating an actual project.

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

#### 9.2.1 Recommendation Display Features

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

The system matches project types against:

1. **Priority fields** - priority1, priority2, priority3 text values
2. **Catch-up interventions** - Boolean flags in catchupIntervention object
3. **Custom interventions** - catchupIntervention.others string value

#### 9.2.2 Project Type to Intervention Mapping

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

# Part III: System-Wide

---

## 10. Audit Trail

### 10.1 Overview

The system maintains a comprehensive audit trail to track all significant actions performed by users. This ensures accountability, supports compliance requirements, and enables investigation of issues.

### 10.2 Audit Log Entry

| Field         | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| ID            | Unique identifier for the audit entry (string)                      |
| User ID       | The ID of the user who performed the action                         |
| User Name     | The name of the user who performed the action                       |
| Action        | The type of action performed (see 10.3)                             |
| Resource Type | The type of resource affected: `user`, `sitio`, or `system`         |
| Resource ID   | The ID of the affected resource (optional)                          |
| Resource Name | The name of the affected resource for display (optional)            |
| Details       | Additional context or notes about the action (optional)             |
| Changes       | Array of field changes with old and new values (optional, see 10.4) |
| IP Address    | The IP address from which the action was performed (optional)       |
| Timestamp     | Date and time of the action (ISO 8601 format)                       |

### 10.3 Action Types

| Action   | Description                                        |
| -------- | -------------------------------------------------- |
| `login`  | User successfully logged in                        |
| `logout` | User logged out                                    |
| `create` | New record created                                 |
| `update` | Existing record modified                           |
| `delete` | Record deleted                                     |
| `view`   | Record viewed (for sensitive data access tracking) |
| `export` | Data exported (e.g., PDF report generated)         |
| `import` | Data imported (e.g., CSV sitio import)             |

### 10.4 Change Tracking

When a record is updated, the system captures the specific field changes:

| Field    | Description                            |
| -------- | -------------------------------------- |
| field    | The name of the field that was changed |
| oldValue | The previous value before the change   |
| newValue | The new value after the change         |

**Example Change Record:**

```json
{
	"changes": [
		{ "field": "totalHouseholds", "oldValue": 120, "newValue": 125 },
		{ "field": "householdsWithElectricity", "oldValue": 80, "newValue": 90 },
		{ "field": "needScore", "oldValue": 7, "newValue": 6 }
	]
}
```

### 10.5 Resource Types

| Resource Type | Description                                                |
| ------------- | ---------------------------------------------------------- |
| `user`        | User account operations                                    |
| `sitio`       | Sitio data operations                                      |
| `system`      | System-level operations (authentication, exports, imports) |

### 10.6 Tracked Operations by Resource

| Resource Type | Actions Tracked                       |
| ------------- | ------------------------------------- |
| **System**    | `login`, `logout`, `export`, `import` |
| **Sitio**     | `create`, `update`, `delete`, `view`  |
| **User**      | `create`, `update`, `delete`          |

### 10.7 Audit Log Retention

| Rule             | Description                                          |
| ---------------- | ---------------------------------------------------- |
| Retention Period | Audit logs are retained for a minimum of 5 years     |
| Immutability     | Audit entries cannot be modified or deleted by users |
| Access           | Only Superadmins can view the full audit trail       |

---

## 11. Access Control

| Role           | Permissions            |
| -------------- | ---------------------- |
| **Superadmin** | Full CRUD access       |
| **Admin**      | Full CRUD access       |
| **Viewer**     | Read-only access       |
| **Public**     | View via public portal |

### 11.1 Role-Specific Permissions

| Action                  | Superadmin | Admin | Viewer | Public |
| ----------------------- | ---------- | ----- | ------ | ------ |
| Create Sitio            | ✓          | ✓     | ✗      | ✗      |
| Edit Sitio              | ✓          | ✓     | ✗      | ✗      |
| Delete Sitio            | ✓          | ✓     | ✗      | ✗      |
| View Sitio Profiles     | ✓          | ✓     | ✓      | ✓      |
| View Recommendations    | ✓          | ✓     | ✓      | ✓      |
| View Dashboard          | ✓          | ✓     | ✓      | ✓      |
| Export Reports          | ✓          | ✓     | ✓      | ✗      |
| Import Sitio Data (CSV) | ✓          | ✓     | ✗      | ✗      |
| Manage Users            | ✓          | ✗     | ✗      | ✗      |
| View Audit Trail        | ✓          | ✗     | ✗      | ✗      |

---

## 12. Validation Rules & Business Rules

### 12.1 Sitio Data Rules

#### Required Fields

| Field        | Rule                                                  |
| ------------ | ----------------------------------------------------- |
| municipality | Required, 2-100 characters                            |
| barangay     | Required, 2-100 characters                            |
| sitioName    | Required, 2-100 characters                            |
| sitioCode    | Optional, max 50 characters                           |
| latitude     | Required, must be valid decimal degrees (-90 to 90)   |
| longitude    | Required, must be valid decimal degrees (-180 to 180) |

#### Demographics Validation

| Field                             | Rule                                              |
| --------------------------------- | ------------------------------------------------- |
| totalPopulation                   | Required, non-negative integer                    |
| totalHouseholds                   | Required, positive integer                        |
| registeredVoters                  | Optional, non-negative integer, ≤ totalPopulation |
| laborForceCount                   | Optional, non-negative integer, ≤ totalPopulation |
| schoolAgeChildren                 | Optional, non-negative integer, ≤ totalPopulation |
| population.totalMale              | Required, non-negative integer                    |
| population.totalFemale            | Required, non-negative integer                    |
| vulnerableGroups.muslimCount      | Optional, non-negative integer, ≤ totalPopulation |
| vulnerableGroups.ipCount          | Optional, non-negative integer, ≤ totalPopulation |
| vulnerableGroups.seniorsCount     | Optional, non-negative integer, ≤ totalPopulation |
| vulnerableGroups.unemployedCount  | Optional, non-negative integer, ≤ laborForceCount |
| vulnerableGroups.outOfSchoolYouth | Required, must be non-negative number             |

#### Utilities Validation

| Field                     | Rule                                                |
| ------------------------- | --------------------------------------------------- |
| householdsWithToilet      | Required, non-negative integer, ≤ totalHouseholds   |
| householdsWithElectricity | Required, non-negative integer, ≤ totalHouseholds   |
| electricitySources.\*     | Optional, each count ≤ householdsWithElectricity    |
| householdsWithInternet    | Required, non-negative integer, ≤ totalHouseholds   |
| mobileSignal              | Required, must be 'none', '2g', '3g', '4g', or '5g' |
| sanitationTypes.\*        | Boolean flags for different sanitation types        |

#### Facilities Validation

| Field                           | Rule                                     |
| ------------------------------- | ---------------------------------------- |
| facilities.\*.exists            | Required, must be 'yes' or 'no'          |
| facilities.\*.count             | Required if exists is 'yes', must be > 0 |
| facilities.\*.distanceToNearest | Required if exists is 'no', must be > 0  |
| facilities.\*.condition         | Required if exists is 'yes', must be 1-5 |

#### Water Sources Validation

| Field                               | Rule                                              |
| ----------------------------------- | ------------------------------------------------- |
| waterSources.\*.exists              | Required, must be 'yes' or 'no'                   |
| waterSources.\*.functioningCount    | Required if exists is 'yes', must be non-negative |
| waterSources.\*.notFunctioningCount | Required if exists is 'yes', must be non-negative |

#### Livelihood Validation

| Field                                 | Rule                                               |
| ------------------------------------- | -------------------------------------------------- |
| workerClass.\*                        | Boolean flags for different worker classes         |
| averageDailyIncome                    | Required, non-negative number                      |
| agriculture.numberOfFarmers           | Optional, non-negative integer, ≤ total population |
| agriculture.numberOfAssociations      | Optional, non-negative integer, ≤ numberOfFarmers  |
| agriculture.estimatedFarmAreaHectares | Optional, non-negative number                      |
| crops                                 | Array of strings (crop names)                      |
| livestock                             | Array of strings (livestock/poultry names)         |

#### Priorities Validation

| Field                    | Rule                               |
| ------------------------ | ---------------------------------- |
| priorities.\*            | Required, must be 0, 1, 2, or 3    |
| priorities.othersSpecify | Optional, max 200 characters       |
| averageNeedScore         | Required, number between 0 and 10  |
| recommendations          | Array of PPARecommendation objects |

### 12.2 Business Rules

#### Population Consistency

- totalPopulation should equal (population.totalMale + population.totalFemale)
- totalPopulation should be ≥ totalHouseholds
- laborForceCount should represent reasonable percentage of totalPopulation
- vulnerableGroups.seniorsCount + schoolAgeChildren + laborForceCount should approximately equal totalPopulation
- registeredVoters should be ≤ adult population (totalPopulation - schoolAgeChildren)

#### Infrastructure Logic

- If infrastructure.\*.exists is 'no', length should not be provided
- If infrastructure.\*.exists is 'yes', both length and condition must be provided
- Electricity source counts should sum to ≤ householdsWithElectricity
- If facilities.\*.exists is 'yes', both count and condition must be provided
- If facilities.\*.exists is 'no', distanceToNearest must be provided

#### Classification Consistency

- If sitioClassification.indigenous is true and vulnerableGroups.muslimCount > 0, madrasah facility should be considered
- If mainAccess has only 'boat' as true, expect limited road infrastructure
- GIDA classification typically correlates with limited facilities and infrastructure
- If sitioClassification.conflict is true, expect peaceOrder to be 'unstable' or 'occasional_tensions'

#### Livelihood & Income

- If workerClass.selfEmployed or workerClass.employer is true, expect agriculture.numberOfFarmers > 0 for agricultural communities
- If agriculture.numberOfFarmers > 0, expect agriculture.estimatedFarmAreaHectares > 0
- If crops array is not empty, expect agriculture.numberOfFarmers > 0
- If livestock array is not empty, expect agriculture.numberOfFarmers > 0
- If vulnerableGroups.unemployedCount is high (>30% of laborForceCount), expect lower averageDailyIncome

#### Water & Sanitation

- At least one water source should have functioningCount > 0 for basic needs
- If sanitationTypes.openDefecation is true, householdsWithToilet should be very low or 0
- If waterSources.natural has high functioning count and higher-level sources have low counts, consider water quality concerns
- Priority for waterSystem should be high (2-3) if no Level 2/3 water sources exist

### 12.3 Recommendation Engine Rules

| Rule                       | Description                                                          |
| -------------------------- | -------------------------------------------------------------------- |
| Minimum Criteria           | Each PPA must have at least one evaluation criterion                 |
| Score Range                | All PPA scores must be between 0-10                                  |
| Priority Assignment        | Priority level automatically assigned based on score range           |
| Criterion Point Allocation | Sum of max points for all criteria should equal 10 for consistency   |
| Data Completeness          | Missing optional fields default to "no need" for that criterion      |
| Multiple PPAs              | A sitio can receive recommendations for multiple PPAs simultaneously |

---

## 13. Glossary

| Term                      | Definition                                                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **4Ps**                   | Pantawid Pamilyang Pilipino Program - a conditional cash transfer program for poor households                                                                           |
| **Barangay**              | The smallest administrative division in the Philippines, a village or district                                                                                          |
| **Beneficiaries**         | The target population who would directly benefit from a recommended PPA                                                                                                 |
| **CATCH-UP**              | A program for identifying vulnerable communities and providing appropriate interventions                                                                                |
| **Coding**                | Unique identifier or code assigned to a sitio for administrative tracking                                                                                               |
| **Demographics**          | Statistical data about the population characteristics including age, sex, and distribution                                                                              |
| **GIDA**                  | Geographically Isolated and Disadvantaged Area - remote communities with limited access to services                                                                     |
| **IP**                    | Indigenous People/Peoples - members of indigenous cultural communities                                                                                                  |
| **Labor Workforce**       | Population aged 15-64 years old, representing the working-age demographic                                                                                               |
| **Level 1/2/3 Water**     | Classification of water infrastructure: Level 1 (point source/pump), Level 2 (communal faucet), Level 3 (house connection)                                              |
| **Municipality**          | A local government unit in the Philippines, below the province level                                                                                                    |
| **Need Score**            | A numerical score (0-10) indicating how much a sitio needs a specific PPA, calculated by the recommendation engine                                                      |
| **OSY**                   | Out of School Youth - school-age individuals not currently enrolled in education                                                                                        |
| **PhilHealth**            | Philippine Health Insurance Corporation - the national health insurance program                                                                                         |
| **PhilSys**               | Philippine Identification System - the national ID program                                                                                                              |
| **PPA**                   | Programs, Projects, and Activities - development interventions recommended for sitios                                                                                   |
| **Priority Level**        | A classification (Critical/High/Moderate/Low) based on need score, indicating urgency of intervention                                                                   |
| **Recommendation Engine** | The AI-powered system that analyzes sitio profiles against PPA criteria to generate scored recommendations                                                              |
| **Sitio**                 | The smallest administrative division in the Philippines, a subdivision of a barangay. In this system, refers to vulnerable communities targeted for development support |
| **Sitio Profile**         | Comprehensive data about a sitio including demographics, infrastructure, facilities, livelihood, health, and risks                                                      |
| **Water-Sealed Toilet**   | Sanitary toilet facility with water seal to prevent odor and contamination                                                                                              |
