
# 🌎 Climate Data Extraction for Digital Twins in Chicago

This repository supports the development of **digital twins** in Chicago by extracting essential climate and environmental variables using **Google Earth Engine (GEE)**.

## 🔍 Purpose

We use satellite-based Earth observation data to support urban modeling, simulations, and predictive analytics in the context of digital twin development. The focus is on extracting short-term historical climate and environmental data over the Chicago metropolitan area.

## 📦 Features

- Extracts key climate variables using the Google Earth Engine API:
  - Precipitation
  - Temperature (Min, Max, Mean)
  - Surface Water & Flood Monitoring
  - Land Use / Land Cover
  - Topography (e.g., elevation, slope)
  - Wind Speed
  - Soil Moisture
- Filters by date range:
  ```javascript
  .filterDate('2023-07-01', '2023-07-05')
- Supports export to:
  CSV (for tabular data)
  GeoTIFF (for raster data)

