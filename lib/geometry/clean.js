import {chain} from 'lodash-es'
import {unkinkPolygon, union, feature, area, lineToPolygon, booleanWithin, rewind, combine} from '@turf/turf'

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

function fixHasExteriorHoles(featureCollectionLines) {
  const features = featureCollectionLines.features.map((featureLine, i) => {
    const featurePoly = lineToPolygon(featureLine)
    featurePoly.properties.idx = i
    featurePoly.properties.area = area(featurePoly)
    return rewind(featurePoly)
  }).toSorted((a, b) => b.properties.area - a.properties.area)

  const holesAcc = []
  const couples = []
  for (const feature of features) {
    for (const poly of features) {
      if ((feature.properties.idx !== poly.properties.idx) && booleanWithin(feature, poly)) {
        holesAcc.push(feature)
        couples.push([feature.properties.idx, poly.properties.idx])
      }
    }
  }

  const holesIds = new Set(holesAcc.map(feature => feature.properties.idx))
  const polysAcc = features.filter(feature => !(holesIds.has(feature.properties.idx)))

  for (const feature of polysAcc) {
    for (const couple of couples) {
      if (feature.properties.idx === couple[1]) {
        const matchingHole = holesAcc.find(hole => hole.properties.idx === couple[0])
        feature.geometry.coordinates = [...feature.geometry.coordinates, ...matchingHole.geometry.coordinates]
      }
    }
  }

  return combine({
    type: 'FeatureCollection',
    features: polysAcc,
  })
}

export {deintersectMultiPolygon, deintersectPolygon, deintersect, fixHasExteriorHoles}
