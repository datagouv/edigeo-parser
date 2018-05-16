const {chain} = require('lodash')
const {unkinkPolygon, union, feature, area} = require('@turf/turf')

function deintersectMultiPolygon(geometry) {
  const unkinkResult = unkinkPolygon(feature(geometry, {}))
  const unkinkedPolygons = unkinkResult.features
  if (unkinkedPolygons.length === 1) {
    throw new Error('deintersectPolygon: unexpected error')
  }
  return union(...unkinkedPolygons).geometry
}

function deintersectPolygon(geometry, removeTolerance = 0.001) {
  const unkinkResult = unkinkPolygon(feature(geometry, {}))
  const unkinkedPolygons = unkinkResult.features
  if (unkinkedPolygons.length === 1) {
    throw new Error('deintersectPolygon: unexpected error')
  }
  const sortedUnkinkedPolygons = chain(unkinkedPolygons)
    .map(p => ({...p, area: area(p)})) // Compute area
    .sortBy(p => -p.area)
    .value()
  const [biggest, ...others] = sortedUnkinkedPolygons
  const significantOthers = others.filter(p => p.area > removeTolerance * biggest.area)
  if (significantOthers.length > 0) {
    throw new Error('Failed to deintersect polygon: significant secondary polygon')
  }
  return biggest.geometry
}

function deintersect(geometry, allowMulti = true, removeTolerance) {
  if (!['Polygon', 'MultiPolygon'].includes(geometry.type)) {
    throw new Error('deintersect: geometry type not supported')
  }
  if (allowMulti) {
    return deintersectMultiPolygon(geometry)
  }
  return deintersectPolygon(geometry, removeTolerance)
}

module.exports = {deintersectMultiPolygon, deintersectPolygon, deintersect}
