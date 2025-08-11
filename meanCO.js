var geometry = geometry;

// load Sentinel-5p NRTI CO data
var sentinel5p = ee.ImageCollection('COPERNICUS/S5P/NRTI/L3_CO')
  .select('CO_column_number_density')  // select the CO band
  .filterDate('2023', '2024')
  .filterBounds(geometry);

// compute the daily average CO levels
var dailyCO = sentinel5p.map(function(image) {
  var dailyMean = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: geometry,
    scale: 1000
  }).get('CO_column_number_density');
 return image.set('dailyCO', dailyMean)
              .set('date', image.date().format('YYYY-MM-dd'));
});

// add the mean CO concentration level
var band_viz = {
  min: 0,
  max: 0.05,
  palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']
};

Map.addLayer(sentinel5p.mean().clip(geometry), band_viz, "Average CO Concentration")

// create a time-series chart of CO levels over the region
print(
  ui.Chart.image.series({
    imageCollection: sentinel5p,
    region: geometry,
    reducer: ee.Reducer.mean(),
    scale: 1000,
    xProperty: "system:time_start"}));
    

// Calculate mean CO concentration image
var meanCO = sentinel5p.mean().clip(geometry);

// Export the image as GeoTIFF to Google Drive
Export.image.toDrive({
  image: meanCO,  // the image to export
  description: 'mean_CO_2023_2024',  // name of the exported file
  folder: 'EarthEngineExports',  // Drive folder (optional)
  scale: 1000,  // resolution in meters
  region: geometry,  // area to export
  maxPixels: 1e13,  // allow exporting large regions
  crs: 'EPSG:4326'  // output projection
});
