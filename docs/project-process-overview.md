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

### System-Wide Features

5. [Audit Trail](#5-audit-trail)
6. [Access Control](#6-access-control)
7. [Validation Rules & Business Rules](#7-validation-rules--business-rules)
8. [Glossary](#8-glossary)
9. [Version History](#9-version-history)

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

### 4.4 Data Visualization

#### Aggregate Dashboard Visualizations

| Visualization          | Type           | Description                                               |
| ---------------------- | -------------- | --------------------------------------------------------- |
| Demographics Overview  | Stacked Bar    | Male/Female breakdown with labor force segment            |
| Utilities Coverage     | Horizontal Bar | Electricity, toilet, street lights across filtered sitios |
| Infrastructure Summary | Bar Chart      | Facility existence rates, road coverage aggregates        |
| Mini Map Preview       | Leaflet Map    | Interactive map showing filtered sitio markers            |

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

---

## 5. Audit Trail

### 5.1 Overview

The system maintains a comprehensive audit trail to track all significant actions performed by users. This ensures accountability, supports compliance requirements, and enables investigation of issues.

### 5.2 Audit Log Entry

| Field         | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| ID            | Unique identifier for the audit entry (string)                     |
| User ID       | The ID of the user who performed the action                        |
| User Name     | The name of the user who performed the action                      |
| Action        | The type of action performed (see 5.3)                             |
| Resource Type | The type of resource affected: `user`, `sitio`, or `system`        |
| Resource ID   | The ID of the affected resource (optional)                         |
| Resource Name | The name of the affected resource for display (optional)           |
| Details       | Additional context or notes about the action (optional)            |
| Changes       | Array of field changes with old and new values (optional, see 5.4) |
| IP Address    | The IP address from which the action was performed (optional)      |
| Timestamp     | Date and time of the action (ISO 8601 format)                      |

### 5.3 Action Types

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

### 5.4 Change Tracking

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

### 5.5 Resource Types

| Resource Type | Description                                                |
| ------------- | ---------------------------------------------------------- |
| `user`        | User account operations                                    |
| `sitio`       | Sitio data operations                                      |
| `system`      | System-level operations (authentication, exports, imports) |

### 5.6 Tracked Operations by Resource

| Resource Type | Actions Tracked                       |
| ------------- | ------------------------------------- |
| **System**    | `login`, `logout`, `export`, `import` |
| **Sitio**     | `create`, `update`, `delete`, `view`  |
| **User**      | `create`, `update`, `delete`          |

**Note for Sitio Operations:**

- `create` - Used when creating a new sitio (core identification) or adding first yearly data
- `update` - Used when editing core identification or updating/adding yearly snapshot data
- `delete` - Used when deleting yearly data or entire sitio record
- The audit trail should specify which year's data was affected in the `details` field

### 5.7 Audit Log Retention

| Rule             | Description                                          |
| ---------------- | ---------------------------------------------------- |
| Retention Period | Audit logs are retained for a minimum of 5 years     |
| Immutability     | Audit entries cannot be modified or deleted by users |
| Access           | Only Superadmins can view the full audit trail       |

---

## 6. Access Control

| Role           | Permissions            |
| -------------- | ---------------------- |
| **Superadmin** | Full CRUD access       |
| **Admin**      | Full CRUD access       |
| **Viewer**     | Read-only access       |
| **Public**     | View via public portal |

### 6.1 Role-Specific Permissions

| Action                  | Superadmin | Admin | Viewer | Public |
| ----------------------- | ---------- | ----- | ------ | ------ |
| Create Sitio            | ✓          | ✓     | ✗      | ✗      |
| Edit Sitio              | ✓          | ✓     | ✗      | ✗      |
| Delete Sitio            | ✓          | ✓     | ✗      | ✗      |
| View Sitio Profiles     | ✓          | ✓     | ✓      | ✓      |
| View Dashboard          | ✓          | ✓     | ✓      | ✓      |
| Export Reports          | ✓          | ✓     | ✓      | ✗      |
| Import Sitio Data (CSV) | ✓          | ✓     | ✗      | ✗      |
| Manage Users            | ✓          | ✗     | ✗      | ✗      |
| View Audit Trail        | ✓          | ✗     | ✗      | ✗      |

---

## 7. Validation Rules & Business Rules

### 7.1 Sitio Data Rules

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

| Field                                 | Rule                                               |
| ------------------------------------- | -------------------------------------------------- |
| workerClass.\*                        | Non-negative integer counts for worker classes     |
| averageDailyIncome                    | Required, non-negative number                      |
| agriculture.numberOfFarmers           | Optional, non-negative integer, ≤ total population |
| agriculture.numberOfAssociations      | Optional, non-negative integer, ≤ numberOfFarmers  |
| agriculture.estimatedFarmAreaHectares | Optional, non-negative number                      |
| crops                                 | Array of strings (crop names)                      |
| livestock                             | Array of strings (livestock/poultry names)         |

#### Priorities Validation

| Field                    | Rule                            |
| ------------------------ | ------------------------------- |
| priorities.\*            | Required, must be 0, 1, 2, or 3 |
| priorities.othersSpecify | Optional, max 200 characters    |

### 7.2 Business Rules

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

---

## 8. Glossary

| Term                    | Definition                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **4Ps**                 | Pantawid Pamilyang Pilipino Program - a conditional cash transfer program for poor households                                                                           |
| **Barangay**            | The smallest administrative division in the Philippines, a village or district                                                                                          |
| **CATCH-UP**            | A program for identifying vulnerable communities and providing appropriate interventions                                                                                |
| **Coding**              | Unique identifier or code assigned to a sitio for administrative tracking                                                                                               |
| **Demographics**        | Statistical data about the population characteristics including age, sex, and distribution                                                                              |
| **GIDA**                | Geographically Isolated and Disadvantaged Area - remote communities with limited access to services                                                                     |
| **IP**                  | Indigenous People/Peoples - members of indigenous cultural communities                                                                                                  |
| **Labor Workforce**     | Population aged 15-64 years old, representing the working-age demographic                                                                                               |
| **Level 1/2/3 Water**   | Classification of water infrastructure: Level 1 (point source/pump), Level 2 (communal faucet), Level 3 (house connection)                                              |
| **Municipality**        | A local government unit in the Philippines, below the province level                                                                                                    |
| **OSY**                 | Out of School Youth - school-age individuals not currently enrolled in education                                                                                        |
| **PhilHealth**          | Philippine Health Insurance Corporation - the national health insurance program                                                                                         |
| **PhilSys**             | Philippine Identification System - the national ID program                                                                                                              |
| **Sitio**               | The smallest administrative division in the Philippines, a subdivision of a barangay. In this system, refers to vulnerable communities targeted for development support |
| **Sitio Profile**       | Comprehensive data about a sitio including demographics, infrastructure, facilities, livelihood, health, and risks                                                      |
| **Water-Sealed Toilet** | Sanitary toilet facility with water seal to prevent odor and contamination                                                                                              |
