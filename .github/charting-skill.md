---
name: chart-architect
description: Expert system for selecting and designing optimal data visualizations based on data dimensionality, integrity, and communication goals.
---

# Chart Architect Skill

When the user requests to "visualize," "chart," or "graph" data, execute the following multi-step analytical framework.

## 1. Data Classification

Analyze the input data to identify its "Flavor":

- **Temporal:** Contains dates, years, or timestamps.
- **Categorical:** Strings, names, or discrete groups.
- **Geospatial:** Countries, cities, or coordinates.
- **Numerical:** Continuous values or measurements.
- **Hierarchical:** Parent-child relationships (e.g., Department > Team).

## 2. Decision Logic Matrix

| If Data Contains...               | And the Goal is...             | Recommended Visualization      |
| :-------------------------------- | :----------------------------- | :----------------------------- |
| **Time + Value**                  | Show continuity/trends         | **Line Chart**                 |
| **Time + Volatility**             | Emphasize volume over time     | **Area Chart**                 |
| **Categories + Value**            | Comparison of magnitudes       | **Bar Chart (Horizontal)**     |
| **Categories (Ordinal)**          | Comparison (e.g., Low to High) | **Column Chart (Vertical)**    |
| **Part-to-Whole (<6 categories)** | Simple proportions             | **Pie/Donut Chart**            |
| **Part-to-Whole (>6 categories)** | Complex proportions            | **Treemap** or **Stacked Bar** |
| **2 Numerical Variables**         | Find correlations/outliers     | **Scatter Plot**               |
| **3 Numerical Variables**         | Correlation + Magnitude        | **Bubble Chart**               |
| **Geospatial Data**               | Regional patterns              | **Choropleth Map**             |
| **Process Stages**                | Show leakage or conversion     | **Funnel Chart**               |

## 3. The "Golden Rules" of Visualization

1. **The Zero-Baseline:** For **Bar and Column charts**, the Y-axis (or X-axis for horizontal) **must** start at 0. Never truncate the axis.
2. **Sorting Logic:** - Always sort **Bar Charts** by value (descending) unless there is a natural order (e.g., Age groups, Months).
3. **The "Spaghetti" Limit:** - If a Line Chart has >5 categories, suggest **Small Multiples** (multiple small charts) instead of one crowded chart.
4. **Color Accessibility:** - Use high-contrast palettes. Mention color-blind friendly options (e.g., Viridis or Colorbrewer) if the user asks for styling.
5. **Simplicity First:** - Remove "chart junk" (heavy gridlines, 3D effects, or redundant labels).

## 4. Implementation Protocol

When a request is made, respond in this structure:

1. **The Recommendation:** State the chart type clearly.
2. **The "Why":** Explain based on the Data Classification (e.g., _"Since you have 12 categories, a Treemap is better than a Pie Chart to maintain readability."_)
3. **Design Specs:** Provide specific instructions:
   - "X-Axis: [Field Name]"
   - "Y-Axis: [Field Name]"
   - "Sorting: [Ascending/Descending/None]"
4. **Alternative View:** Suggest one other way to look at the same data if applicable.
