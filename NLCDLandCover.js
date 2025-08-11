// Define ROI
var roi = geometry;
// Load the NLCD collection and select the most recent image (2021)
var nlcd = ee.ImageCollection('USGS/NLCD_RELEASES/2021_REL/NLCD')
  .select('landcover')
  .filterBounds(roi)
  .sort('system:time_start', false) // optional: make sure the newest is first
  .first();  // get the most recent image

// Visualization parameters
var landVis = {
  min: 11.0,
  max: 95.0,
  palette: [
    '5475A8', 'ffffff', 'E8D1D1', 'E29E8C', 'ff0000', 'B50000', 'D2CDC0',
    '85C77E', '38814E', 'D4E7B0', 'AF963C', 'DCCA8F', 'FDE9A4', 'D1D182',
    'A3CC51', '82BA9E', 'FBF65D', 'CA9146', 'C8E6F8', '64B3D5'
  ],
};

// Display
Map.centerObject(roi);
Map.addLayer(nlcd.clip(roi), landVis, 'NLCD Land Cover Chicago');

// Export the image
Export.image.toDrive({
  image: nlcd.clip(roi),  // clip to ROI
  description: 'NLCDLandCover',
  scale: 1000,
  region: roi,
  maxPixels: 1e13
});
