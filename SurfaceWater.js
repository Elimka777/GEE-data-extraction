// 1. Define dates and center map
var dates = ['2023-09-15', '2023-10-01', '2023-10-15', '2023-11-01', '2023-11-15'];
Map.centerObject(geometry);

// 2. Speckle filter after combining images
function speckleFilter(image) {
  return image.focalMedian(100, 'square', 'meters');
}

// 3. Get median S1 VV image for a given date
function getImage(date) {
  var start = ee.Date(date).advance(-14, 'day');
  var end = ee.Date(date).advance(14, 'day');

  var collection = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(geometry)
    .filterDate(start, end)
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .select('VV');

  var count = collection.size();
  
  // If collection has images, return filtered median, else return dummy
  return ee.Image(
    ee.Algorithms.If(
      count.gt(0),
      speckleFilter(collection.median()).set('system:time_start', ee.Date(date).millis()),
      ee.Image.constant(-999).rename('VV').clip(geometry).set('system:time_start', ee.Date(date).millis())
    )
  );
}

// 4. Process and export images
var imageList = dates.map(function(dateStr) {
  var image = getImage(dateStr);
  image = ee.Image(image).clip(geometry);  // Ensure casting

  // Add to map
  Map.addLayer(image, {min: -25, max: 5}, 'VV ' + dateStr, false);

  // Export image
  Export.image.toDrive({
    image: image,
    description: 'S1_' + dateStr.replace(/-/g, '_'),
    region: geometry,
    scale: 1000,
    fileFormat: 'GeoTIFF',
    maxPixels: 1e13
  });

  return image;
});

// 5. Change detection between first and last
var img1 = ee.Image(imageList[0]);
var img5 = ee.Image(imageList[4]);

var change = img1.subtract(img5).rename('change');
Map.addLayer(change, {min: -10, max: 10, palette: ['blue', 'white', 'red']}, 'Change Map');

// 6. Threshold flood and export
var flood = change.gt(5);
Map.addLayer(flood.updateMask(flood), {palette: ['red']}, 'Flooded Area');

// 7. Calculate flood area in sq km
var floodArea = flood.multiply(ee.Image.pixelArea().divide(1e6)).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: geometry,
  scale: 1000,
  maxPixels: 1e10
});
print('Flood area (sq km):', floodArea);

// 8. Export change image
Export.image.toDrive({
  image: change.clip(geometry),
  description: 'FloodChange',
  region: geometry,
  scale: 1000,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});
