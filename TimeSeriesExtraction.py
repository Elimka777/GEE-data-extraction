# Time Series Extraction for Precipitation, Rainfall, Temperature Data, and Flood Detection.
# This script extracts time series data from raster files stored in Google Drive.
!pip install rasterio pandas matplotlib seaborn

# Mount Google Drive to access files
# This code is intended to run in Google Colab, which allows you to access files stored in your Google Drive.
# If you're running this in a different environment, you may need to adjust the file paths accordingly.
from google.colab import drive
drive.mount('/content/drive')

# Time Series Extraction for Precipitation Data
import rasterio  
import numpy as np 
import pandas as pd  
from datetime import datetime
import os 

dataset_folder = "/content/drive/MyDrive/GEE Extractions/Precipitation"
tif_files = sorted ([f for f in os.listdir(dataset_folder) if f.endswith(".tif")])

timestamps = []
time_series = []

#choosing a pixel location (row, col)
#corrected pixel location to be within bounds (0-indexed)
target_row, target_col = 40, 40
#extracting time series
time_series = []

for f in tif_files:
    file_path = os.path.join(dataset_folder, f)  # constructing the full file path
    with rasterio.open(file_path) as src:
        data = src.read(1)  # reading the first band
        value = data[target_row, target_col]
        time_series.append(value)
        # extracting date from filename (format like 'Monthly_Precip_YYYY-MM.tif')
        date_str = f.split('_')[-1].split('.')[0]
        timestamps.append(datetime.strptime(date_str, '%Y-%m'))


# Create DataFrame
df = pd.DataFrame({
    "Date": timestamps,
    "Precipitation": time_series  # Rename to actual variable name like "Precipitation"
})
df.set_index("Date", inplace=True)
display(df.head())

# Time Series Extraction for Rainfall Data
import os
import rasterio
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# navigating to the directory containing the raster files
rainfall_dir = "/content/drive/MyDrive/GEE Extractions/Temperature/Rainfall"

# listing all .tif files
tif_files = sorted([f for f in os.listdir(rainfall_dir) if f.endswith('.tif')])

# storing results
rainfall_records = []

for fname in tif_files:
    fpath = os.path.join(rainfall_dir, fname)

    # extracting date from filename (customize if needed)
    date_str = fname.split('_')[-1].replace('.tif', '')

    try:
        with rasterio.open(fpath) as src:
            data = src.read(1)
            nodata = src.nodata

            # handling nodata
            if nodata is not None:
                data = np.where(data == nodata, np.nan, data)

            mean_rainfall = np.nanmean(data)
            rainfall_records.append({
                'date': pd.to_datetime(date_str),
                'mean_rainfall': mean_rainfall
            })

    except Exception as e:
        print(f"Error reading {fname}: {e}")

# creating DataFrame
rainfall_df = pd.DataFrame(rainfall_records).sort_values('date')

# previewing
print(rainfall_df.head())

# Time Series Extraction for Daily Max and Min Temperatures 
import os
import re
import rasterio
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

temp_dir = "/content/drive/MyDrive/GEE Extractions/Temperature/Daily Max Min"

# all .tif files
tif_files = sorted([f for f in os.listdir(temp_dir) if f.endswith('.tif')])

#storing results
records = []

for fname in tif_files:
    fpath = os.path.join(temp_dir, fname)

    # extract date using regex
    match = re.search(r'(\d{4}-\d{2}-\d{2})', fname)
    if not match:
        print(f"Could not extract date from filename: {fname}")
        continue
    date = pd.to_datetime(match.group(1))

    try:
        with rasterio.open(fpath) as src:
            if src.count < 2:
                print(f"File {fname} does not contain two bands.")
                continue

            # reading both bands
            max_band = src.read(1)
            min_band = src.read(2)
            nodata = src.nodata

            # masking nodata
            if nodata is not None:
                max_band = np.where(max_band == nodata, np.nan, max_band)
                min_band = np.where(min_band == nodata, np.nan, min_band)

            # computing mean values
            max_temp = np.nanmean(max_band)
            min_temp = np.nanmean(min_band)

            records.append({
                'date': date,
                'max_temp': max_temp,
                'min_temp': min_temp
            })

    except Exception as e:
        print(f"Error reading {fname}: {e}")

# creating DataFrame
df_temp = pd.DataFrame(records).sort_values('date')

# preview
print(df_temp.head())

# Flood Detection using Sentinel-1 SAR Data
import os
import re
import rasterio
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# navigating to the directory containing Sentinel-1 TIFFs
flood_dir = "/content/drive/MyDrive/GEE Extractions/Surface Water and Flood Monitoring"

# listing all .tif files
tif_files = sorted([f for f in os.listdir(flood_dir) if f.endswith('.tif')])

# storing results
records = []

# flood detection threshold (in decibels)
flood_threshold = -15  # based on the Gaussian Mixture Model (GMM)

for fname in tif_files:
    fpath = os.path.join(flood_dir, fname)

    # extracting date from filename (format: S1_YYYY_MM_DD.tif)
    match = re.search(r'(\d{4}_\d{2}_\d{2})', fname)
    if not match:
        print(f"Could not extract date from filename: {fname}")
        continue
    date_str = match.group(1).replace('_', '-')
    date = pd.to_datetime(date_str)

    try:
        with rasterio.open(fpath) as src:
            data = src.read(1)
            nodata = src.nodata

            # masking nodata
            if nodata is not None:
                data = np.where(data == nodata, np.nan, data)

            # mean backscatter
            mean_val = np.nanmean(data)

            # flooded pixel count (pixels below threshold)
            flooded_pixels = np.nansum(data < flood_threshold)

            # computing flooded area (km²)
            pixel_area_km2 = (src.res[0] * src.res[1]) / 1e6  # assuming meters
            flooded_area_km2 = flooded_pixels * pixel_area_km2

            # storing the results
            records.append({
                'date': date,
                'mean_backscatter_db': mean_val,
                'flooded_pixel_count': flooded_pixels,
                'flooded_area_km2': flooded_area_km2
            })

    except Exception as e:
        print(f"Error reading {fname}: {e}")

# creating DataFrame
df_flood = pd.DataFrame(records).sort_values('date')

# previewing
print(df_flood.head())