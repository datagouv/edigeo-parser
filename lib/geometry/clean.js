const {unkinkPolygon, union, feature} = require('@turf/turf')

function deintersectPolygon(geometry) {
  const unkinkResult = unkinkPolygon(feature(geometry, {}))
  const unkinkedPolygons = unkinkResult.features
  if (unkinkedPolygons.length === 1) {
    throw new Error('deintersectPolygon: unexpected error')
  }
  return union(...unkinkedPolygons).geometry
}

module.exports = {deintersectPolygon}
