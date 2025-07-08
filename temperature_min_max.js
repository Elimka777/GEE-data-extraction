// Loading DAYMET V4 daily temperature data (both tmax and tmin)
var daymetv4 = ee.ImageCollection('NASA/ORNL/DAYMET_V4')
  .filterDate('2023-07-01', '2023-07-05')
  .select(['tmax', 'tmin']);

// Computing daily max and min temperatures over the region
var dailyTemps = daymetv4.map(function(image) {
  var maxTemp = image.reduceRegion({
    reducer: ee.Reducer.max(),
    geometry: geometry,
    scale: 5000,
    maxPixels: 1e13
  }).get('tmax');

  var minTemp = image.reduceRegion({
    reducer: ee.Reducer.min(),
    geometry: geometry,
    scale: 5000,
    maxPixels: 1e13
  }).get('tmin');

  return image.set({
    'daily_tmax': maxTemp,
    'daily_tmin': minTemp,
    'date': image.date().format('YYYY-MM-dd')
  });
});

// Visualization parameters
var tempVis = {
  min: 0,
  max: 40,
  palette: ['1621A2', 'white', 'cyan', 'green', 'yellow', 'orange', 'red']
};

// Center map
Map.centerObject(geometry, 7);

// Adding both Tmax and Tmin layers to the map
dailyTemps.evaluate(function(collectionInfo) {
  var images = collectionInfo.features;
  images.forEach(function(feature) {
    var date = ee.Date(feature.properties.date).format('YYYY-MM-dd').getInfo();
    var image = ee.Image(feature.id).clip(geometry);
    Map.addLayer(image.select('tmax'), tempVis, 'Tmax ' + date);
    Map.addLayer(image.select('tmin'), tempVis, 'Tmin ' + date);
  });
});

// Converting ImageCollection to FeatureCollection for charting
var temperatureFeatures = dailyTemps.map(function(image) {
  return ee.Feature(null, {
    'date': image.get('date'),
    'daily_tmax': image.get('daily_tmax'),
    'daily_tmin': image.get('daily_tmin')
  });
});

var temperatureTable = ee.FeatureCollection(temperatureFeatures);

// Time series chart
var chart = ui.Chart.feature.byFeature({
  features: temperatureTable,
  xProperty: 'date',
  yProperties: ['daily_tmax', 'daily_tmin']
}).setOptions({
  title: 'Daily Tmax and Tmin Time Series',
  hAxis: {title: 'Date'},
  vAxis: {title: 'Temperature (°C)'},
  lineWidth: 1,
  pointSize: 3,
  colors: ['red', 'blue']
});
print(chart);

// Exporting to CSV
Export.table.toDrive({
  collection: temperatureTable,
  description: 'DAYMETV4_Daily_Temp',
  fileNamePrefix: 'DAYMETV4_Daily_Temp_Time_Series',
  fileFormat: 'CSV',
  folder: 'DAYMETV4_Time_Series_Data'
});

// Function to export Tmax and Tmin images
var exportImage = function(image) {
  var date = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd').getInfo();

  Export.image.toDrive({
    image: image.select(['tmax', 'tmin']).clip(geometry),
    description: 'Temp_' + date,
    fileNamePrefix: 'Temp_' + date,
    folder: 'DAYMETV4_Time_Series_Data',
    region: geometry,
    scale: 5000,
    crs: 'EPSG:4326',
    fileFormat: 'GeoTIFF',
    maxPixels: 1e13
  });
};

// Exporting all images
daymetv4.toList(daymetv4.size()).evaluate(function(imageList) {
  imageList.forEach(function(feature) {
    var image = ee.Image(feature.id);
    exportImage(image);
  });
});
