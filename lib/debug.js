function dumpArcsAsGeoJSON(arcs) {
  console.log(JSON.stringify({
    type: 'FeatureCollection',
    features: arcs.map(arc => ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: arc.coordinates
      }
    }))
  }, true, 2))
}

module.exports = {dumpArcsAsGeoJSON}
