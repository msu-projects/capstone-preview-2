# System Overview

## South Cotabato Convergence Data Bank

---

## Executive Summary

This document provides a comprehensive overview of the South Cotabato Convergence Data Bank system.

The system serves as a public-facing data bank that allows citizens to view detailed demographic, social, economic, and infrastructure data about vulnerable communities (Sitios) in South Cotabato Province. The system enables transparency by providing public access to community profiles while supporting government officials in data-driven planning decisions.

---

## Table of Contents

### Sitio Data Module

1. [Sitio Module Purpose](#1-sitio-module-purpose)
2. [Sitio Data Entity](#2-sitio-data-entity)
3. [Sitio Data Categories](#3-sitio-data-categories)
4. [Public Portal Features](#4-public-portal-features)
   - [4.1 Sitio Aggregate Dashboard](#41-sitio-aggregate-dashboard)
   - [4.2 Sitio Discovery](#42-sitio-discovery)
   - [4.3 Sitio Profile View](#43-sitio-profile-view)
   - [4.4 Data Visualization](#44-data-visualization)
   - [4.5 Sitio Data Management (Admin Only)](#45-sitio-data-management-admin-only)
   - [4.6 Report Generation (Admin Only)](#46-report-generation-admin-only)
   - [4.7 Dynamic Form Builder (Admin Only)](#47-dynamic-form-builder-admin-only)

### Projects Module

5. [Projects Module Purpose](#5-projects-module-purpose)
6. [Project Data Entity](#6-project-data-entity)
7. [Project Features](#7-project-features)
   - [7.1 Project Management (Admin Only)](#71-project-management-admin-only)
   - [7.2 Projects in Sitio Profile](#72-projects-in-sitio-profile)
   - [7.3 Public Project View](#73-public-project-view)

### System-Wide Features

8. [Audit Trail](#8-audit-trail)
9. [Access Control](#9-access-control)
10. [Validation Rules & Business Rules](#10-validation-rules--business-rules)
11. [Glossary](#11-glossary)
12. [Version History](#12-version-history)

---

## 1. Sitio Module Purpose

The Sitio Data Module serves as a public-facing data bank that provides comprehensive information about vulnerable communities (Sitios) in South Cotabato Province. It enables:

- **Public Transparency** - Citizens can view detailed demographic and socioeconomic data about their communities
- **Data-Driven Planning** - Government officials can access community profiles to inform development decisions

---

## 2. Sitio Data Entity

### 2.1 Data Structure Overview

The sitio data model is designed to track changes over time by storing yearly snapshots. Each sitio has:

- **Core Identification** - Permanent fields that identify the sitio and remain constant across years
- **Yearly Snapshot Data** - Demographic, infrastructure, and socioeconomic data collected for specific years

> **Important:** Yearly data is optional. Users may skip entering data for certain years. The system supports viewing historical trends when multiple years of data are available.

### 2.2 Core Identification (Permanent)

These fields are set when a sitio is first created and remain constant:

| Field        | Type   | Description                                                 |
| ------------ | ------ | ----------------------------------------------------------- |
| sitioId      | string | Unique system identifier (auto-generated)                   |
| municipality | string | Name of the municipality                                    |
| barangay     | string | Name of the barangay                                        |
| sitioName    | string | Name of the specific Sitio / Purok                          |
| sitioCode    | string | Purok/Sitio Code (if available)                             |
| latitude     | number | Geographical latitude in decimal degrees (e.g., 7.12345)    |
| longitude    | number | Geographical longitude in decimal degrees (e.g., 125.12345) |
| createdAt    | string | Date when sitio was first added to system (ISO 8601)        |
| updatedAt    | string | Date of last modification (ISO 8601)                        |

### 2.3 Yearly Snapshot Data

All other sitio data fields (described in Section 3) are stored as yearly snapshots:

| Field      | Type   | Description                                       |
| ---------- | ------ | ------------------------------------------------- |
| year       | number | The year this data represents (e.g., 2024, 2025)  |
| recordedAt | string | Date when this yearly data was entered (ISO 8601) |
| recordedBy | string | User ID who entered/last modified this data       |
| data       | object | All sitio categories data (see Section 3)         |

**Data Object Structure:**
The `data` object contains all fields from Section 3:

- Sitio Classification & Access
- Demographics & Population
- Access to Basic Utilities
- Facilities
- Road & Internal Infrastructure
- Education
- Water & Sanitation
- Livelihood & Agriculture
- Safety & Risk Context
- Sitio Priority Needs
- Custom Fields (dynamically configured)

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

#### Worker Class (workerClass object - number counts)

| Field                | Type   | Description                                      |
| -------------------- | ------ | ------------------------------------------------ |
| privateHousehold     | number | e.g., domestic helper                            |
| privateEstablishment | number | e.g., company employee                           |
| government           | number | e.g., Barangay Tanod, Teacher                    |
| selfEmployed         | number | e.g., Sari-sari store                            |
| employer             | number | Own family-operated farm/business with employees |
| ofw                  | number | Overseas Filipino Workers                        |

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

#### Pets (pets object - number counts)

| Field          | Type   | Description                              |
| -------------- | ------ | ---------------------------------------- |
| catsCount      | number | Total number of cats in the sitio        |
| dogsCount      | number | Total number of dogs in the sitio        |
| vaccinatedCats | number | Number of cats that have been vaccinated |
| vaccinatedDogs | number | Number of dogs that have been vaccinated |

**Validation Rules:**

- vaccinatedCats must be ≤ catsCount
- vaccinatedDogs must be ≤ dogsCount

#### Backyard Gardens (backyardGardens object)

| Field                 | Type     | Description                                                             |
| --------------------- | -------- | ----------------------------------------------------------------------- |
| householdsWithGardens | number   | Number of households with backyard gardens                              |
| commonCrops           | string[] | Common crop categories: 'Vegetables', 'Fruits', or 'Root Crops' (max 3) |

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

#### Food Security

| Field        | Type                                                   | Description                   |
| ------------ | ------------------------------------------------------ | ----------------------------- |
| foodSecurity | 'secure' \| 'seasonal_scarcity' \| 'critical_shortage' | Primary food security concern |

### 3.10 Sitio Priority Needs

**Priority Interventions** (priorities array - rating scale 0-3):

| Field      | Type                      | Description                                        |
| ---------- | ------------------------- | -------------------------------------------------- |
| priorities | Array<{name: 0\|1\|2\|3}> | Array of priority interventions with rating values |

Each priority item in the array contains:

- **name**: The intervention name (e.g., "waterSystem", "communityCR", "solarStreetLights", "roadOpening", "farmTools", "healthServices", "educationSupport")
- **rating**: Priority rating (0 = Not needed, 1 = Low, 2 = Medium, 3 = Very urgent)

Common priority intervention names:

- waterSystem - Water system priority
- communityCR - Community comfort room priority
- solarStreetLights - Solar street lights priority
- roadOpening - Road opening priority
- farmTools - Farm tools priority
- healthServices - Health services priority
- educationSupport - Education support priority

**Priority Rating Scale:**

- **0** - Not needed
- **1** - Low priority
- **2** - Medium priority
- **3** - Very urgent

### 3.11 Custom Fields (Dynamic)

Custom fields are dynamically configured by administrators to capture additional monitoring data specific to current program needs. These fields are optional and may change over time as requirements evolve.

**Custom Field Properties:**

| Property     | Type                    | Description                                              |
| ------------ | ----------------------- | -------------------------------------------------------- |
| customFields | Record<string, unknown> | Key-value pairs where key is field ID, value is the data |

**Supported Data Types:**

| Data Type | Description                                   | Example Values                            |
| --------- | --------------------------------------------- | ----------------------------------------- |
| text      | Free-form text input                          | "Community hall built"                    |
| number    | Numeric values                                | 15, 250.5                                 |
| boolean   | Yes/No or true/false                          | true, false                               |
| date      | Date values                                   | "2025-12-31"                              |
| array     | List of text values                           | ["Item 1", "Item 2", "Item 3"]            |
| checkbox  | Multiple selection from admin-defined choices | ["Option A", "Option C"] (selected items) |
| radio     | Single selection from admin-defined choices   | "Option B" (selected item)                |

**Aggregation Types (for number fields):**

When displaying custom number fields in dashboards, the system supports different aggregation methods:

| Type    | Description                          |
| ------- | ------------------------------------ |
| sum     | Total sum across all sitios          |
| average | Average value across all sitios      |
| count   | Count of sitios with recorded values |
| min     | Minimum value across all sitios      |
| max     | Maximum value across all sitios      |

> **Note:** Custom fields are managed through the Dynamic Form Builder (see Section 4.7). Field definitions include validation rules, display labels, and descriptions to guide data entry.

---

## 4. Public Portal Features

### 4.1 Sitio Aggregate Dashboard

The public portal provides an aggregate dashboard as the main entry point for exploring sitio data. This dashboard displays summary statistics and visualizations that respond to filter selections.

> **Note:** By default, the dashboard shows the most recent year's data for each sitio. Users can select a specific year to view historical data.

#### Dashboard Components

| Component                | Description                                                    |
| ------------------------ | -------------------------------------------------------------- |
| Filter Context Indicator | Badge showing current filter (e.g., "Showing: Koronadal City") |
| Year Filter              | Dropdown to select which year's data to display                |
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
| Electrification Rate | Percentage: (householdsWithElectricity / totalHouseholds) |
| Toilet Access Rate   | Percentage: (householdsWithToilet / totalHouseholds)      |

#### Aggregate Charts

| Chart                  | Type           | Description                                        |
| ---------------------- | -------------- | -------------------------------------------------- |
| Demographics Overview  | Stacked Bar    | Male/Female breakdown with labor force highlighted |
| Utilities Coverage     | Horizontal Bar | Electricity, toilet access, street lights          |
| Infrastructure Summary | Bar            | Facility existence rates, road coverage            |

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

The public can view comprehensive sitio profiles organized into sections.

> **Yearly Data Display:**
>
> - By default, the most recent year's data is displayed
> - Users can select different years from a dropdown to view historical data
> - If no data exists for a selected year, a message indicates "No data available for [year]"
> - A timeline or year selector shows which years have available data

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

#### Supplementary Section

- Displays custom field data when available
- Summary statistics showing total configured fields and fields recorded
- Visualizations for custom data:
  - Bar charts for numeric fields
  - Donut charts for boolean (yes/no) fields
  - Formatted display for text and date fields
- Field details grid showing all custom field values
- Only visible when custom fields are configured and active

> **Note:** The Supplementary section is dynamically generated based on custom fields defined by administrators. The section only appears when at least one custom field is active.

### 4.4 Data Visualization

#### Aggregate Dashboard Visualizations

| Visualization          | Type           | Description                                               |
| ---------------------- | -------------- | --------------------------------------------------------- |
| Demographics Overview  | Stacked Bar    | Male/Female breakdown with labor force segment            |
| Utilities Coverage     | Horizontal Bar | Electricity, toilet, street lights across filtered sitios |
| Infrastructure Summary | Bar Chart      | Facility existence rates, road coverage aggregates        |
| Mini Map Preview       | Leaflet Map    | Interactive map showing filtered sitio markers            |
| Supplementary Data     | Mixed          | Custom field aggregations with configurable visualization |

> **Note:** The Supplementary Data tab only appears in the dashboard when custom fields are configured and active.

#### Sitio Profile Visualizations

| Visualization         | Description                                         |
| --------------------- | --------------------------------------------------- |
| Map View              | Interactive map showing exact sitio coordinates     |
| Population Charts     | Demographics breakdown with age groups              |
| Infrastructure Status | Visual indicators for utilities and facility access |
| Income Distribution   | Chart showing household income bracket distribution |
| Water Sources Map     | Visualization of water source types and status      |
| Custom Fields Charts  | Dynamic visualizations for supplementary data       |

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

> **Yearly Data Management:**
>
> - When creating or editing a sitio, users must specify which year the data represents
> - Users can add multiple yearly snapshots for the same sitio
> - Each yearly snapshot is stored independently
> - Historical data remains accessible and cannot be accidentally overwritten

#### 4.5.1 Add Sitio / Add Yearly Data

```
Start
  │
  ▼
Check if Sitio Exists
  │
  ├── New Sitio ───▶ Enter Core Identification
  │                   │
  │                   ├──▶ Municipality, Barangay, Sitio Name
  │                   ├──▶ Sitio Code (optional)
  │                   ├──▶ Coordinates (Latitude, Longitude)
  │                   │
  │                   ▼
  │                Select Year for Data Entry
  │                   │
  │                   ▼
  │                Continue to Data Entry ───┐
  │                                         │
  └── Existing Sitio ───▶ Display Core Info  │
                          │                 │
                          ▼                 │
                       Select Year          │
                          │                 │
                          ├── Year Has Data ───▶ Confirm Overwrite?
                          │                      │
                          │                      ├── Yes ───┐
                          │                      │         │
                          │                      └── No ────▶ Cancel
                          │                                  │
                          └── Year Empty ──────────────────────┤
                                                             │
                                                             ▼
  ┌──────────────────────────────────────────────────────────┘
  │
  ▼
Enter Classification & Access
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
Save Yearly Snapshot
  │
  ├──▶ If new sitio: Save core identification + yearly data
  └──▶ If existing: Save/update yearly data only
  │
  ▼
End
```

#### 4.5.2 Edit Sitio Data

```
Start
  │
  ▼
Select Sitio from List
  │
  ▼
View Available Years
  │
  ├── Edit Core Information ──▶ Update permanent fields
  │                              │
  │                              ├──▶ Municipality, Barangay, Name
  │                              ├──▶ Coordinates
  │                              └──▶ Changes tracked for audit
  │                                   │
  │                                   ▼
  │                                 Save Core Info
  │                                   │
  │                                   ▼
  │                                  End
  │
  └── Edit Yearly Data ──▶ Select Year to Edit
                            │
                            ▼
                         Modify Information
                            │
                            ├──▶ Update any section (Demographics, etc.)
                            └──▶ Changes tracked for audit trail
                            │
                            ▼
                         Validate Changes
                            │
                            ▼
                         Save Yearly Data
                            │
                            ▼
                           End
```

#### 4.5.3 Delete Sitio Data

```
Start
  │
  ▼
Select Sitio from List
  │
  ▼
Choose Delete Action
  │
  ├── Delete Yearly Data ──▶ Select Year to Delete
  │                           │
  │                           ▼
  │                        Confirm Deletion
  │                           │
  │                           ├── Yes ──▶ Delete Year Data
  │                           │              │
  │                           │              ▼
  │                           │           End
  │                           │
  │                           └── No ───▶ Cancel
  │                                        │
  │                                        ▼
  │                                       End
  │
  └── Delete Entire Sitio ──▶ Check for Dependencies
                                │
                                ├── Has Projects ──▶ Cannot Delete (warning)
                                │                      │
                                │                      ▼
                                │                    End
                                │
                                └── No Projects ──▶ Confirm Deletion
                                                     │
                                                     ├── Yes ──▶ Delete Sitio
                                                     │           (all years)
                                                     │              │
                                                     │              ▼
                                                     │           End
                                                     │
                                                     └── No ───▶ Cancel
                                                                  │
                                                                  ▼
                                                                 End
```

**Notes:**

- Individual yearly data can be deleted without removing the entire sitio
- The entire sitio (core identification + all yearly data) cannot be deleted if it has associated projects
- Deleting yearly data is tracked in the audit trail

### 4.6 Report Generation (Admin Only)

Administrators can generate comprehensive PDF reports containing aggregated sitio data with visualizations. This feature enables data-driven decision making by providing downloadable, shareable reports.

#### 4.6.1 Report Types

| Report Type      | Description                                                 |
| ---------------- | ----------------------------------------------------------- |
| Aggregate Report | Summary of all sitios with aggregated statistics and charts |

#### 4.6.2 Report Sections

Reports can include any combination of the following sections:

| Section        | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| Overview       | Executive summary with total sitios, population, and households    |
| Demographics   | Population breakdown, gender distribution, vulnerable groups       |
| Utilities      | Electricity access, sanitation coverage, internet connectivity     |
| Facilities     | Health centers, schools, markets - availability and condition      |
| Infrastructure | Road types, coverage, and condition assessments                    |
| Livelihood     | Worker classifications, income levels, agricultural statistics     |
| Safety         | Natural hazards, food security status, risk assessments            |
| Priorities     | Community priority needs rankings and intervention recommendations |

#### 4.6.3 Report Filters

| Filter         | Description                                                       |
| -------------- | ----------------------------------------------------------------- |
| Year           | Select specific year for data snapshot                            |
| Municipality   | Filter by specific municipality or all municipalities             |
| Barangay       | Filter by specific barangay (cascading from municipality)         |
| Include Trends | Toggle to include year-over-year trend comparisons when available |

#### 4.6.4 Report Generation Flow

```
Start
  │
  ▼
Navigate to Reports Page
  │
  ▼
Configure Report
  │
  ├──▶ Select Report Sections (checkboxes)
  │     - Overview, Demographics, Utilities, etc.
  │
  ├──▶ Set Filters
  │     - Year selection
  │     - Municipality filter
  │     - Barangay filter
  │     - Include trends toggle
  │
  ▼
Review Configuration
  │
  ├──▶ View selected section count
  ├──▶ View filter summary
  └──▶ Verify include charts/trends options
  │
  ▼
Generate Report
  │
  ▼
System Processing
  │
  ├──▶ Aggregate sitio data based on filters
  ├──▶ Calculate statistics for each section
  ├──▶ Generate visualizations (if enabled)
  └──▶ Build PDF document
  │
  ▼
Download PDF
  │
  ▼
Create Audit Log Entry
  │
  ├──▶ Action: 'export'
  ├──▶ Resource Type: 'report'
  └──▶ Details: Report configuration summary
  │
  ▼
End
```

#### 4.6.5 Report Content Structure

Each generated PDF report contains:

| Component         | Description                                                           |
| ----------------- | --------------------------------------------------------------------- |
| Header            | Report title, generation date, filter context                         |
| Table of Contents | List of included sections with page references (if multiple sections) |
| Section Headers   | Clear section titles with icons                                       |
| Data Tables       | Formatted tables with aggregated statistics                           |
| Charts            | Visual representations of key metrics (optional)                      |
| Trend Indicators  | Year-over-year comparisons when trends enabled                        |
| Footer            | Page numbers, generation timestamp                                    |

#### 4.6.6 Report Access Control

| Role       | Can Generate Reports | Can View Report History |
| ---------- | -------------------- | ----------------------- |
| Superadmin | ✓                    | ✓                       |
| Admin      | ✓                    | ✓                       |
| Viewer     | ✓                    | ✗                       |
| Public     | ✗                    | ✗                       |

### 4.7 Dynamic Form Builder (Admin Only)

The Dynamic Form Builder module allows superadmin users to inject custom data fields into the standard Sitio Profile schema. Through a GUI-based configuration, admins can define additional fields to capture granular data specific to current monitoring needs.

#### 4.7.1 Purpose

The Dynamic Form Builder enables:

- **Flexible Data Collection** - Add custom fields without code changes
- **Program-Specific Monitoring** - Track data unique to specific programs or interventions
- **Evolving Requirements** - Adapt to changing monitoring needs over time
- **Granular Analysis** - Capture and visualize supplementary metrics

#### 4.7.2 Custom Field Configuration

Administrators configure custom fields through `/admin/config/custom-fields`:

| Feature          | Description                                                            |
| ---------------- | ---------------------------------------------------------------------- |
| Field Name       | Internal identifier (auto-generated from display label)                |
| Display Label    | Human-readable label shown in forms and reports                        |
| Data Type        | Text, Number, Boolean (Yes/No), Date, Text List, Checkbox, or Radio    |
| Validation Rules | Required/Optional, min/max values for numbers, length for text/array   |
| Choices          | For Checkbox and Radio types: admin-defined list of selectable options |
| Aggregation Type | For numbers: sum, average, count, min, or max (dashboard view)         |
| Description      | Optional help text to guide data entry                                 |
| Display Order    | Reorderable to control field sequence in forms                         |
| Active/Archived  | Archive fields to preserve historical data without current use         |

#### 4.7.3 Field Management Features

| Action         | Description                                                      |
| -------------- | ---------------------------------------------------------------- |
| Create Field   | Define a new custom field with all configuration options         |
| Edit Field     | Update field properties (label, description, validation rules)   |
| Archive Field  | Soft-delete to hide from forms while preserving existing data    |
| Restore Field  | Reactivate an archived field                                     |
| Reorder Fields | Drag-and-drop or use arrow buttons to change display order       |
| View Stats     | Dashboard showing total fields, active count, and archived count |
| Toggle View    | Show/hide archived fields in the management table                |

#### 4.7.4 Data Entry (Custom Fields Tab)

When editing sitio yearly data, a "Custom Fields" tab appears if active custom fields exist:

| Feature             | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| Dynamic Form Inputs | Appropriate input controls based on data type                |
| Field Type Icons    | Visual indicators for text, number, boolean, and date fields |
| Required Indicators | Asterisk (\*) marks required fields                          |
| Validation Feedback | Real-time validation with error messages                     |
| Help Tooltips       | Display field descriptions when hovering over help icons     |
| Completion Tracking | Tab shows completion status based on filled required fields  |

**Input Types by Data Type:**

| Data Type | Input Control      | Description                                         |
| --------- | ------------------ | --------------------------------------------------- |
| Text      | Text input         | Single-line text field                              |
| Number    | Number input       | Numeric input with optional min/max                 |
| Boolean   | Switch toggle      | Yes/No toggle switch                                |
| Date      | Date input         | Calendar date picker                                |
| Array     | Tag input          | Multi-value text list with add/remove functionality |
| Checkbox  | Checkbox group     | Multiple selection from admin-defined choices       |
| Radio     | Radio button group | Single selection from admin-defined choices         |

#### 4.7.5 Data Visualization

**Sitio Profile View (Supplementary Tab):**

When viewing a sitio profile with custom field data:

| Component     | Description                                                   |
| ------------- | ------------------------------------------------------------- |
| Summary Cards | Total fields, fields recorded, numeric fields, boolean fields |
| Numeric Chart | Bar chart displaying all number field values                  |
| Boolean Chart | Donut chart showing yes/no response distribution              |
| Field Details | Grid showing all custom field values with formatted display   |
| Empty State   | Message when no custom fields are configured                  |

**Dashboard View (Supplementary Tab):**

The admin dashboard includes a Supplementary tab when custom fields exist:

| View Mode  | Description                                              |
| ---------- | -------------------------------------------------------- |
| Summary    | Aggregated statistics using configured aggregation types |
| Comparison | Per-sitio comparison charts for numeric fields (top 10)  |

**Summary View Components:**

| Component           | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| Numeric Stat Cards  | Display aggregated values (sum/avg/min/max as configured)         |
| Boolean Donut Chart | Show yes/no percentages across all sitios for each field          |
| Text Field Summary  | Top 5 most common responses for each text field                   |
| Date Field Info     | List configured date fields with note to view individual profiles |

**Comparison View Components:**

| Component              | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| Per-Sitio Bar Charts   | Horizontal bar charts showing top 10 sitios by value |
| Field-by-Field Display | Separate chart for each numeric custom field         |

#### 4.7.6 Custom Field Flow

```
Start
  │
  ▼
Navigate to Custom Fields Configuration
  │
  ▼
View Existing Fields
  │
  ├──▶ Create New Field
  │     │
  │     ├──▶ Enter Display Label
  │     ├──▶ Select Data Type (text/number/boolean/date)
  │     ├──▶ Set Validation Rules
  │     │     - Mark as Required/Optional
  │     │     - For numbers: min/max values
  │     │     - For text: max length
  │     ├──▶ Select Aggregation Type (for numbers)
  │     ├──▶ Add Description (optional)
  │     └──▶ Save Field
  │           │
  │           ▼
  │        Field Available in Forms
  │
  ├──▶ Edit Existing Field
  │     │
  │     ├──▶ Modify Label, Description, Validation
  │     └──▶ Save Changes
  │           │
  │           ▼
  │        Updated in All Views
  │
  ├──▶ Archive Field
  │     │
  │     ├──▶ Confirm Archive Action
  │     └──▶ Field Hidden from Forms
  │           │
  │           ├──▶ Historical Data Preserved
  │           └──▶ Can be Restored Later
  │
  └──▶ Reorder Fields
        │
        └──▶ Change Display Sequence
              │
              ▼
           Updated Order in Forms
  │
  ▼
Fields Available in Sitio Editing
  │
  ▼
Data Entry in Custom Fields Tab
  │
  ├──▶ Enter Values for Each Field
  ├──▶ Validation Applied
  └──▶ Save with Yearly Data
  │
  ▼
Data Visible in Sitio Profile
  │
  ├──▶ Supplementary Tab Shows Custom Data
  └──▶ Visualizations Generated
  │
  ▼
Aggregated in Dashboard
  │
  └──▶ Supplementary Tab Shows Aggregated Metrics
  │
  ▼
End
```

#### 4.7.7 Access Control

| Role       | Can Configure Fields | Can Enter Data | Can View Data |
| ---------- | -------------------- | -------------- | ------------- |
| Superadmin | ✓                    | ✓              | ✓             |
| Admin      | ✗                    | ✓              | ✓             |
| Viewer     | ✗                    | ✗              | ✓             |
| Public     | ✗                    | ✗              | ✓             |

**Notes:**

- Only superadmins can create, edit, archive, restore, and reorder custom fields
- Admins can enter custom field data when editing sitio records
- All authenticated users and the public can view custom field data in sitio profiles and dashboards
- Custom field definitions are stored in localStorage with audit trail integration
- Archived fields remain visible in historical sitio data but are hidden from data entry forms

#### 4.7.8 Data Persistence

| Aspect            | Implementation                                           |
| ----------------- | -------------------------------------------------------- |
| Storage Location  | Browser localStorage (key: `sccdp_config_custom_fields`) |
| Field Definitions | Stored separately from sitio data                        |
| Field Values      | Stored in `customFields` object within yearly sitio data |
| Soft Delete       | Archived fields marked as `isActive: false`              |
| Historical Data   | Preserved even when fields are archived                  |
| Audit Trail       | All field configuration changes logged                   |

---

## 5. Projects Module Purpose

The Projects Module tracks and showcases development projects that have been implemented across sitios in South Cotabato Province. It enables:

- **Project Tracking** - Document completed or ongoing development projects with details about cost, location, and involved communities
- **Community Linkage** - Associate projects with one or more sitios to show development investments in specific areas
- **Public Transparency** - Allow citizens to view project information and understand government investments in their communities
- **Visual Documentation** - Store images of projects for visual reference and documentation

---

## 6. Project Data Entity

### 6.1 Data Structure Overview

Each project contains identification information, location data, associated sitios, cost information, and supporting images.

### 6.2 Project Fields

| Field       | Type     | Description                                                         |
| ----------- | -------- | ------------------------------------------------------------------- |
| id          | number   | Unique system identifier (auto-generated)                           |
| title       | string   | Project title/name                                                  |
| description | string   | Detailed description of the project                                 |
| location    | object   | Geographical coordinates where the project is located               |
| sitioIds    | number[] | Array of sitio IDs that are involved in or benefit from the project |
| cost        | number   | Total project cost in Philippine Peso                               |
| images      | string[] | Array of base64-encoded image strings (max 5 images)                |
| createdAt   | string   | Date when project was first added to system (ISO 8601)              |
| updatedAt   | string   | Date of last modification (ISO 8601)                                |

### 6.3 Location Object

| Field | Type   | Description                               |
| ----- | ------ | ----------------------------------------- |
| lat   | number | Geographical latitude in decimal degrees  |
| lng   | number | Geographical longitude in decimal degrees |

### 6.4 Image Storage

- Images are stored as base64-encoded strings
- Maximum of 5 images per project
- Images are automatically compressed on upload (max width: 800px, quality: 0.7)
- Storage limit: 10MB for all project data combined

---

## 7. Project Features

### 7.1 Project Management (Admin Only)

#### 7.1.1 Project List View

The admin project list provides:

| Feature                | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| Statistics Cards       | Display total projects, total investment, sitios count |
| Searchable Table       | Search by project title                                |
| Filter by Municipality | Filter projects by sitios in specific municipality     |
| Filter by Barangay     | Filter projects by sitios in specific barangay         |
| Pagination             | Navigate through project records                       |
| Quick Actions          | View, Edit, Delete project buttons                     |

#### 7.1.2 Create Project

Admins can create new projects with:

| Section           | Fields                                                           |
| ----------------- | ---------------------------------------------------------------- |
| Basic Information | Title (required), Description (required), Cost (required)        |
| Location & Sitios | Map-based location picker, Multi-select sitio picker with search |
| Images            | Upload up to 5 images with preview and remove capability         |

**Sitio Selection Features:**

- Searchable dropdown with sitio name search
- Filter by Municipality
- Filter by Barangay
- Visual tags showing selected sitios
- Remove individual selections

#### 7.1.3 Edit Project

Admins can edit existing projects:

- All fields are editable
- Existing images can be removed
- New images can be added (respecting max 5 limit)
- Changes are tracked via audit trail

#### 7.1.4 Delete Project

Admins can delete projects:

- Confirmation dialog before deletion
- Action is logged in audit trail
- Deletion is permanent

### 7.2 Projects in Sitio Profile

#### 7.2.1 Projects Tab

A "Projects" tab is available in both admin and public sitio profile views:

| Feature          | Description                                             |
| ---------------- | ------------------------------------------------------- |
| Project Count    | Summary showing number of projects and total investment |
| Project Cards    | Grid of project cards showing title, description, cost  |
| Quick Navigation | Click on project card to view full project details      |
| Empty State      | Helpful message when sitio has no associated projects   |

#### 7.2.2 Admin vs Public View

| Feature       | Admin View                  | Public View             |
| ------------- | --------------------------- | ----------------------- |
| View Projects | ✓                           | ✓                       |
| Add Project   | Link to create form         | ✗                       |
| Edit/Delete   | Quick actions available     | ✗                       |
| Project Link  | Links to admin project page | Links to public project |

### 7.3 Public Project View

#### 7.3.1 Project Detail Page

Public users can view individual project details at `/projects/[id]`:

| Component      | Description                                    |
| -------------- | ---------------------------------------------- |
| Breadcrumb     | Navigation: Home > Projects > Project Title    |
| Project Header | Title and cost display                         |
| Image Gallery  | Photo gallery with lightbox for project images |
| Description    | Full project description text                  |
| Location Map   | Interactive map showing project location       |
| Sitios List    | Cards linking to all associated sitio profiles |

---

## 8. Audit Trail

### 8.1 Overview

The system maintains a comprehensive audit trail to track all significant actions performed by users. This ensures accountability, supports compliance requirements, and enables investigation of issues.

### 8.2 Audit Log Entry

| Field         | Description                                                            |
| ------------- | ---------------------------------------------------------------------- |
| ID            | Unique identifier for the audit entry (string)                         |
| User ID       | The ID of the user who performed the action                            |
| User Name     | The name of the user who performed the action                          |
| Action        | The type of action performed (see 8.3)                                 |
| Resource Type | The type of resource affected: `user`, `sitio`, `project`, or `system` |
| Resource ID   | The ID of the affected resource (optional)                             |
| Resource Name | The name of the affected resource for display (optional)               |
| Details       | Additional context or notes about the action (optional)                |
| Changes       | Array of field changes with old and new values (optional, see 8.4)     |
| IP Address    | The IP address from which the action was performed (optional)          |
| Timestamp     | Date and time of the action (ISO 8601 format)                          |

### 8.3 Action Types

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

### 8.4 Change Tracking

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
    { "field": "householdsWithElectricity", "oldValue": 80, "newValue": 90 }
  ]
}
```

### 8.5 Resource Types

| Resource Type | Description                                                |
| ------------- | ---------------------------------------------------------- |
| `user`        | User account operations                                    |
| `sitio`       | Sitio data operations                                      |
| `project`     | Project data operations                                    |
| `system`      | System-level operations (authentication, exports, imports) |
| `report`      | Report generation operations                               |

### 8.6 Tracked Operations by Resource

| Resource Type | Actions Tracked                       |
| ------------- | ------------------------------------- |
| **System**    | `login`, `logout`, `export`, `import` |
| **Sitio**     | `create`, `update`, `delete`, `view`  |
| **Project**   | `create`, `update`, `delete`          |
| **User**      | `create`, `update`, `delete`          |
| **Report**    | `export`                              |

**Note for Sitio Operations:**

- `create` - Used when creating a new sitio (core identification) or adding first yearly data
- `update` - Used when editing core identification or updating/adding yearly snapshot data
- `delete` - Used when deleting yearly data or entire sitio record
- The audit trail should specify which year's data was affected in the `details` field

**Note for Project Operations:**

- `create` - Used when creating a new project
- `update` - Used when editing project details, images, or associated sitios
- `delete` - Used when deleting a project

### 8.7 Audit Log Retention

| Rule             | Description                                          |
| ---------------- | ---------------------------------------------------- |
| Retention Period | Audit logs are retained for a minimum of 5 years     |
| Immutability     | Audit entries cannot be modified or deleted by users |
| Access           | Only Superadmins can view the full audit trail       |

---

## 9. Access Control

| Role           | Permissions            |
| -------------- | ---------------------- |
| **Superadmin** | Full CRUD access       |
| **Admin**      | Full CRUD access       |
| **Viewer**     | Read-only access       |
| **Public**     | View via public portal |

### 9.1 Role-Specific Permissions

| Action                  | Superadmin | Admin | Viewer | Public |
| ----------------------- | ---------- | ----- | ------ | ------ |
| Create Sitio            | ✓          | ✓     | ✗      | ✗      |
| Edit Sitio              | ✓          | ✓     | ✗      | ✗      |
| Delete Sitio            | ✓          | ✓     | ✗      | ✗      |
| View Sitio Profiles     | ✓          | ✓     | ✓      | ✓      |
| Create Project          | ✓          | ✓     | ✗      | ✗      |
| Edit Project            | ✓          | ✓     | ✗      | ✗      |
| Delete Project          | ✓          | ✓     | ✗      | ✗      |
| View Projects           | ✓          | ✓     | ✓      | ✓      |
| View Dashboard          | ✓          | ✓     | ✓      | ✓      |
| Export Reports          | ✓          | ✓     | ✓      | ✗      |
| Import Sitio Data (CSV) | ✓          | ✓     | ✗      | ✗      |
| Manage Users            | ✓          | ✗     | ✗      | ✗      |
| View Audit Trail        | ✓          | ✗     | ✗      | ✗      |

---

## 10. Validation Rules & Business Rules

### 10.1 Sitio Data Rules

#### Core Identification Validation

| Field        | Rule                                                  |
| ------------ | ----------------------------------------------------- |
| municipality | Required, 2-100 characters                            |
| barangay     | Required, 2-100 characters                            |
| sitioName    | Required, 2-100 characters                            |
| sitioCode    | Optional, max 50 characters                           |
| latitude     | Required, must be valid decimal degrees (-90 to 90)   |
| longitude    | Required, must be valid decimal degrees (-180 to 180) |

**Uniqueness Constraint:**

- The combination of (municipality + barangay + sitioName) must be unique across all sitios
- This prevents duplicate sitio entries

#### Yearly Data Validation

| Field | Rule                                                            |
| ----- | --------------------------------------------------------------- |
| year  | Required, must be a valid 4-digit year (e.g., 2024, 2025)       |
| year  | Cannot be a future year beyond current year                     |
| year  | Must be unique for each sitio (one snapshot per sitio per year) |

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

| Field                                 | Rule                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| workerClass.\*                        | Non-negative integer counts for worker classes                               |
| averageDailyIncome                    | Required, non-negative number                                                |
| agriculture.numberOfFarmers           | Optional, non-negative integer, ≤ total population                           |
| agriculture.numberOfAssociations      | Optional, non-negative integer, ≤ numberOfFarmers                            |
| agriculture.estimatedFarmAreaHectares | Optional, non-negative number                                                |
| crops                                 | Array of strings (crop names)                                                |
| livestock                             | Array of strings (livestock/poultry names)                                   |
| pets.catsCount                        | Non-negative integer                                                         |
| pets.dogsCount                        | Non-negative integer                                                         |
| pets.vaccinatedCats                   | Non-negative integer, ≤ pets.catsCount                                       |
| pets.vaccinatedDogs                   | Non-negative integer, ≤ pets.dogsCount                                       |
| backyardGardens.householdsWithGardens | Non-negative integer, ≤ totalHouseholds                                      |
| backyardGardens.commonCrops           | Array of crop categories ('Vegetables', 'Fruits', 'Root Crops'), max 3 items |

#### Priorities Validation

| Field                    | Rule                            |
| ------------------------ | ------------------------------- |
| priorities.\*            | Required, must be 0, 1, 2, or 3 |
| priorities.othersSpecify | Optional, max 200 characters    |

### 10.2 Business Rules

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

#### Livelihood & Income

- If workerClass.selfEmployed > 0 or workerClass.employer > 0, expect agriculture.numberOfFarmers > 0 for agricultural communities
- If agriculture.numberOfFarmers > 0, expect agriculture.estimatedFarmAreaHectares > 0
- If crops array is not empty, expect agriculture.numberOfFarmers > 0
- If livestock array is not empty, expect agriculture.numberOfFarmers > 0
- If vulnerableGroups.unemployedCount is high (>30% of laborForceCount), expect lower averageDailyIncome

#### Water & Sanitation

- At least one water source should have functioningCount > 0 for basic needs
- If sanitationTypes.openDefecation is true, householdsWithToilet should be very low or 0
- If waterSources.natural has high functioning count and higher-level sources have low counts, consider water quality concerns
- Priority for waterSystem should be high (2-3) if no Level 2/3 water sources exist

### 10.3 Project Data Rules

#### Project Validation

| Field       | Rule                                                            |
| ----------- | --------------------------------------------------------------- |
| title       | Required, 2-200 characters                                      |
| description | Required, 10-5000 characters                                    |
| cost        | Required, must be non-negative number                           |
| location    | Required, must have valid lat (-90 to 90) and lng (-180 to 180) |
| sitioIds    | Required, must contain at least one valid sitio ID              |
| images      | Optional, maximum 5 images, each max 1MB after compression      |

#### Project Business Rules

- A project must be associated with at least one sitio
- Projects can be associated with sitios from different municipalities/barangays
- Image files are automatically compressed to reduce storage usage
- Total project storage is limited to prevent excessive localStorage usage

---

## 11. Glossary

| Term                     | Definition                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **4Ps**                  | Pantawid Pamilyang Pilipino Program - a conditional cash transfer program for poor households                                                                           |
| **Barangay**             | The smallest administrative division in the Philippines, a village or district                                                                                          |
| **CATCH-UP**             | A program for identifying vulnerable communities and providing appropriate interventions                                                                                |
| **Coding**               | Unique identifier or code assigned to a sitio for administrative tracking                                                                                               |
| **Custom Fields**        | Dynamically configured data fields that administrators can add to capture program-specific monitoring data beyond the standard sitio schema                             |
| **Demographics**         | Statistical data about the population characteristics including age, sex, and distribution                                                                              |
| **Dynamic Form Builder** | Admin feature that allows creating custom data fields through a GUI without code changes, enabling flexible data collection for evolving program needs                  |
| **GIDA**                 | Geographically Isolated and Disadvantaged Area - remote communities with limited access to services                                                                     |
| **IP**                   | Indigenous People/Peoples - members of indigenous cultural communities                                                                                                  |
| **Labor Workforce**      | Population aged 15-64 years old, representing the working-age demographic                                                                                               |
| **Level 1/2/3 Water**    | Classification of water infrastructure: Level 1 (point source/pump), Level 2 (communal faucet), Level 3 (house connection)                                              |
| **Municipality**         | A local government unit in the Philippines, below the province level                                                                                                    |
| **OSY**                  | Out of School Youth - school-age individuals not currently enrolled in education                                                                                        |
| **PhilHealth**           | Philippine Health Insurance Corporation - the national health insurance program                                                                                         |
| **PhilSys**              | Philippine Identification System - the national ID program                                                                                                              |
| **Project**              | A development initiative implemented in one or more sitios, tracked with details about cost, location, and outcomes                                                     |
| **Sitio**                | The smallest administrative division in the Philippines, a subdivision of a barangay. In this system, refers to vulnerable communities targeted for development support |
| **Sitio Profile**        | Comprehensive data about a sitio including demographics, infrastructure, facilities, livelihood, health, and risks                                                      |
| **Water-Sealed Toilet**  | Sanitary toilet facility with water seal to prevent odor and contamination                                                                                              |

---

## 12. Version History

| Version | Date       | Changes                                                                                                                                               |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2024-01-01 | Initial document creation with Sitio Data Module                                                                                                      |
| 2.0     | 2025-01-15 | Added Projects Module for tracking implemented development projects across sitios                                                                     |
| 3.0     | 2026-01-03 | Added Dynamic Form Builder module (Section 4.7) enabling administrators to configure custom data fields with flexible data types and validation rules |
