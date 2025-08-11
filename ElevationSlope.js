// Define ROI
var roi = geometry; 
// Load static 3DEP DEM image
var dataset = ee.Image('USGS/3DEP/10m'); // This is a single image, not a time series

// Clip to ROI
var demClip = dataset.clip(roi);

// Select elevation
var elevation = demClip.select('elevation');

// Calculate slope
var slope = ee.Terrain.slope(elevation).clip(roi);

// Visualization
Map.centerObject(roi);
Map.addLayer(elevation, {
  min: 0,
  max: 3000,
  palette: [
    '3ae237', 'b5e22e', 'd6e21f', 'fff705', 'ffd611', 'ffb613', 'ff8b13',
    'ff6e08', 'ff500d', 'ff0000', 'de0101', 'c21301', '0602ff', '235cb1',
    '307ef3', '269db1', '30c8e2', '32d3ef', '3be285', '3ff38f', '86e26f'
  ],
}, 'elevation');
Map.addLayer(slope, {min: 0, max: 60}, 'slope');

// Export elevation as GeoTIFF
Export.image.toDrive({
  image: elevation,
  description: 'elevation_3dep',
  scale: 1000,
  region: roi,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

// Export slope as GeoTIFF
Export.image.toDrive({
  image: slope,
  description: 'slope_3dep',
  scale: 1000,
  region: roi,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});
