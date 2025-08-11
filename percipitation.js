// Load CHIRPS monthly precipitation data for May-Oct 2023
var chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
  .filterDate('2023-05-01', '2023-10-01')
  .select('precipitation');

var mmToInches = 0.0393701;
var oneKm = ee.Projection('EPSG:4326').atScale(1000);

// Function to get list of month start dates
function getMonthStartDates(start, end) {
  var nMonths = end.difference(start, 'month').toInt();
  return ee.List.sequence(0, nMonths.subtract(1)).map(function(monthOffset) {
    return start.advance(monthOffset, 'month');
  });
}

var startDate = ee.Date('2023-05-01');
var endDate = ee.Date('2023-10-01');
var monthStarts = getMonthStartDates(startDate, endDate);

// Create monthly summed precipitation ImageCollection (in inches)
var monthlyPrecip = ee.ImageCollection(
  monthStarts.map(function(monthStart) {
    monthStart = ee.Date(monthStart);
    var monthEnd = monthStart.advance(1, 'month');

    var monthlySum = chirps
      .filterDate(monthStart, monthEnd)
      .sum()
      .multiply(mmToInches)
      .reproject({
        crs: oneKm,
        scale: 1000
      });

    return monthlySum.set({
      'system:time_start': monthStart.millis(),
      'date': monthStart.format('YYYY-MM')
    });
  })
);

// Example: Add monthly precipitation layers to the map
var precipitationVis = {
  min: 0,
  max: 6,  // adjust as needed
  palette: [
    'ffffff', 'b7efb7', '61c061', '1f8e1f',
    'ffff66', 'ffaa00', 'ff0000', '8b0000'
  ]
};

var count = monthlyPrecip.size().getInfo();

for (var i = 0; i < count; i++) {
  var image = ee.Image(monthlyPrecip.toList(count).get(i));
  var dateStr = image.get('date').getInfo();

  Export.image.toDrive({
    image: image.clip(geometry),
    description: 'Monthly_Precip_' + dateStr,
    fileNamePrefix: 'Monthly_Precip_' + dateStr,
    folder: 'CHIRPS_Monthly_1km',
    scale: 1000,
    region: geometry,
    crs: 'EPSG:4326',
    fileFormat: 'GeoTIFF',
    maxPixels: 1e13
  });
}
