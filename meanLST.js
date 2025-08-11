// Function to mask clouds using the QA_PIXEL band
function maskClouds(image) {
  var qa = image.select('QA_PIXEL');
  var cloud = qa.bitwiseAnd(1 << 3).or(qa.bitwiseAnd(1 << 4));
  return image.updateMask(cloud.not());
}

// Function to calculate LST from Landsat 8 and 9 data
function calculateLST(image) {
  // Select the thermal band
  var thermalBand = image.select('ST_B10');

  // Convert the thermal band to brightness temperature (in Kelvin)
  var brightnessTemp = thermalBand.multiply(0.00341802).add(149.0);

  // Calculate NDVI for emissivity correction
  var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']);

  // Calculate Proportion of Vegetation (Pv)
  var proportionVeg = ndvi.expression(
    '((ndvi - ndviMin) / (ndviMax - ndviMin)) ** 2', {
      'ndvi': ndvi,
      'ndviMin': 0.2,  // Placeholder, adjust as needed
      'ndviMax': 0.5   // Placeholder, adjust as needed
    }).rename('Proportion_Vegetation');

  // Estimate emissivity using proportion of vegetation
  var emissivity = proportionVeg.expression(
    '0.004 * proportionVeg + 0.986', {
      'proportionVeg': proportionVeg
    }).rename('emissivity');

  // Calculate LST in Celsius
  var lst = brightnessTemp.expression(
    '(Tb / (1 + (0.00115 * Tb / 14388) * log(emissivity))) - 273.15', {
      'Tb': brightnessTemp,
      'emissivity': emissivity
    }).rename('LST');

  return lst;
}

// Load the updated Landsat 8 and 9 collections
var landsat8Collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(geometry)
  .filterDate('2023', '2024')
  .map(maskClouds)
  .map(calculateLST);

var landsat9Collection = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
  .filterBounds(geometry)
  .filterDate('2023', '2024')
  .map(maskClouds)
  .map(calculateLST);

// Merge the collections
var mergedCollection = landsat8Collection.merge(landsat9Collection);

// Calculate the mean LST over the time period
var meanLST = mergedCollection.mean().clip(geometry);

// Display the LST on the map
Map.centerObject(geometry, 10);
Map.addLayer(meanLST, {min: 20, max: 40, palette: ['blue', 'green', 'red']}, 'Mean LST');

// Export the LST image
Export.image.toDrive({
  image: meanLST,
  description: 'Mean_LST_Landsat8_9',
  scale: 1000,
  region: geometry,
  maxPixels: 1e13
});

