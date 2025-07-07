// Load CHIRPS daily precipitation data
var chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
  .filterDate('2023-07-01', '2023-07-05')
  .select('precipitation');
// Conversion factor from millimeters to inches
var mmToInches = 0.0393701;
// Compute the daily precipitation totals in inches over the region of interest
var dailyPrecipitation = chirps.map(function(image) {
  // Convert precipitation from mm to inches
  var precipitationInInches = image.multiply(mmToInches);
  // Reduce region to get max precipitation for the day
  var dailyTotal = precipitationInInches.reduceRegion({
    reducer: ee.Reducer.max(),
    geometry: geometry,
    scale: 5000
  }).get('precipitation');
  return image.set('daily_precipitation', dailyTotal)
              .set('date', image.date().format('YYYY-MM-dd'));
});
// Add daily precipitation layers to the map
var precipitationVis = {
  min: 0,
  max: 6, // Adjust based on expected max precipitation in inches
  palette: [
    'ffffff', // White: 0 inches
    'b7efb7', // Light Green: 0.01–0.10 inches
    '61c061', // Medium Green: 0.10–0.25 inches
    '1f8e1f', // Dark Green: 0.25–0.50 inches
    'ffff66', // Yellow: 0.50–1.00 inches
    'ffaa00', // Orange: 1.00–2.00 inches
    'ff0000', // Red: 2.00–3.00 inches
    '8b0000'  // Dark Red: 3.00–4.00 inches
  ]
};
Map.centerObject(geometry, 7);
dailyPrecipitation.evaluate(function(collectionInfo) {
  var images = collectionInfo.features;
  images.forEach(function(feature) {
    var date = ee.Date(feature.properties.date).format('YYYY-MM-dd').getInfo();
    var image = ee.Image(feature.id).multiply(mmToInches).clip(geometry);
    Map.addLayer(image, precipitationVis, 'Precipitation ' + date);
  });
});
// Convert the ImageCollection to a FeatureCollection with date and precipitation values
var precipitationFeatures = dailyPrecipitation.map(function(image) {
  return ee.Feature(null, {
    'date': image.get('date'),
    'daily_precipitation': image.get('daily_precipitation')
  });
});
// Create a table (FeatureCollection) from the precipitationFeatures
var precipitationTable = ee.FeatureCollection(precipitationFeatures);
// Create a time series chart
var chart = ui.Chart.feature.byFeature({
  features: precipitationTable,
  xProperty: 'date',
  yProperties: ['daily_precipitation']
})
.setOptions({
  title: 'Daily Precipitation Time Series (inches)',
  hAxis: {title: 'Date'},
  vAxis: {title: 'Precipitation (inches)'},
  lineWidth: 1,
  pointSize: 3,
  colors: ['blue']
});
// Print the chart to the console
print(chart);
// Export the precipitation data to Google Drive as a CSV file
Export.table.toDrive({
  collection: precipitationTable,
  description: 'CHIRPS_Daily_Precipitation_Time_Series_Inches',
  fileNamePrefix: 'CHIRPS_Daily_Precipitation_Time_Series_Inches',
  fileFormat: 'CSV',
  folder: 'CHIRPS_Time_Series_Data'
});
// Function to export each image as a TIFF file
var exportImage = function(image) {
  var date = ee.Date(image.date()).format('YYYY-MM-dd').getInfo();
  var precipitationInInches = image.multiply(mmToInches);  // Convert precipitation to inches
  Export.image.toDrive({
    image: precipitationInInches.clip(geometry),  // Clip to user-defined geometry
    description: 'Pr_' + date,  // Use the date in the description
    scale: 5000,  // Original resolution
    region: geometry,
    fileNamePrefix: 'Pr_' + date,  // Use the date in the file name
    folder: 'CHIRPS_Time_Series_Data',
    fileFormat: 'GeoTIFF',
    maxPixels: 1e11  // Adjust as needed
  });
};
// Export each image as a TIFF file
chirps.evaluate(function(collectionInfo) {
  var images = collectionInfo.features;
  images.forEach(function(feature) {
    var image = ee.Image(feature.id);
    exportImage(image);
  });
});
