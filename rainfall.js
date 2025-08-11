// Load DAYMETV4 data for daily rainfall
// This script processes daily rainfall data from DAYMET V4 for a specific region and date range
var chicago = geometry;
var daymet = ee.ImageCollection("NASA/ORNL/DAYMET_V4")
  .filterBounds(chicago)
  .filterDate('2023-07-10', '2023-07-15'); // include all relevant days

// Define start and end dates
var startDate = ee.Date('2023-07-10');
var endDate = ee.Date('2023-07-15'); // exclusive

// Get list of daily dates
function getDailyDates(start, end) {
  var nDays = end.difference(start, 'day').toInt();
  return ee.List.sequence(0, nDays.subtract(1)).map(function(i) {
    return start.advance(ee.Number(i), 'day');
  });
}

var dailyDates = getDailyDates(startDate, endDate);

// Conversion factor from mm to inches
var mmToInches = 1 / 25.4;

// Create ImageCollection of daily rainfall (in inches)
var dailyRain = ee.ImageCollection(dailyDates.map(function(date) {
  date = ee.Date(date);

  var image = daymet
    .filterDate(date, date.advance(1, 'day'))
    .first()
    .select('prcp')
    .multiply(mmToInches)
    .rename('prcp_inches')
    .reproject({crs: 'EPSG:4326', scale: 1000})  //nearest neighbor
    .clip(chicago)
    .set({
      'system:time_start': date.millis(),
      'date': date.format('YYYY-MM-dd'),
      'filename': ee.String('Daily_Rainfall_').cat(date.format('YYYY-MM-dd'))
    });

  return image;
}));

// Export each daily image to Google Drive
var list = dailyRain.toList(dailyRain.size());
var count = list.size().getInfo();

for (var i = 0; i < count; i++) {
  var img = ee.Image(list.get(i));
  var filename = img.get('filename').getInfo();

  Export.image.toDrive({
    image: img,
    description: filename,
    folder: 'Daymet_Daily_Rainfall_2023',
    fileNamePrefix: filename,
    region: chicago,
    scale: 1000,
    crs: 'EPSG:4326',
    fileFormat: 'GeoTIFF',
    maxPixels: 1e13
  });
}

// Visualization parameters for daily rainfall in inches
var visParams = {
  min: 0,
  max: 1.7,  // Adjust depending on max expected rainfall
  palette: ['white', 'lightblue', 'blue', 'purple']
};
// Visualize all daily layers with date labels
for (var i = 0; i < count; i++) {
  var img = ee.Image(list.get(i));
  var date = img.get('date').getInfo();
  Map.addLayer(img, visParams, 'Rainfall ' + date);
}
Map.centerObject(chicago, 8);
