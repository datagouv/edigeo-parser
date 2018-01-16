function dumpLabelsAsGeoJSON(labels) {
  console.log(JSON.stringify({
    type: 'FeatureCollection',
    features: labels.map(label => ({
      type: 'Feature',
      properties: {
        value: label.value,
        distanceToStart: label.distanceToStart
      },
      geometry: {
        type: 'Point',
        coordinates: label.position
      }
    }))
  }, true, 2))
}

module.exports = {dumpLabelsAsGeoJSON}
