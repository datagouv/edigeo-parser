function dumpArcsAsGeoJSON(arcs) {
  const lines = arcs.map(arc => ({
    type: 'Feature',
    properties: {
      id: arc.fullId,
      left: arc._left,
      right: arc._right,
    },
    geometry: {
      type: 'LineString',
      coordinates: arc.coordinates,
    },
  }))
  const startPoints = arcs.map(arc => ({
    type: 'Feature',
    properties: {
      id: arc.fullId,
    },
    geometry: {
      type: 'Point',
      coordinates: arc.coordinates[0],
    },
  }))
  console.log(JSON.stringify({
    type: 'FeatureCollection',
    features: [...lines, ...startPoints],
  }, true, 2))
}

export {dumpArcsAsGeoJSON}
