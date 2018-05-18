const {kinks, polygon, booleanWithin} = require('@turf/turf')
const {first, last, uniq, flatten} = require('lodash')
const intersect = require('@turf/intersect').default

const validators = {
  Polygon: validatePolygon,
  MultiPolygon: validateMultiPolygon
}

function validate(geometry) {
  if (geometry.type in validators) {
    return validators[geometry.type](geometry)
  }
  return []
}

function validatePolygon(geometry) {
  const errors = validatePolygonRings(geometry.coordinates)
  if (selfIntersect(geometry)) {
    errors.push('has-self-intersection')
  }
  return errors
}

function validateMultiPolygon(geometry) {
  const errors = uniq(
    flatten(
      geometry.coordinates.map(validatePolygonRings)
    )
  )
  if (selfIntersect(geometry)) {
    errors.push('has-self-intersection')
  }
  return errors
}

function validatePolygonRings(polygonRings) {
  if (polygonRings.length === 0) {
    return ['polygon-without-rings']
  }
  const errors = []
  errors.push(...flatten(polygonRings.map(polygonRingIsValid)))
  if (errors.length > 0 || polygonRings.length === 1) {
    return uniq(errors)
  }
  const [exteriorRing, ...holes] = polygonRings
  if (hasExteriorHoles(exteriorRing, holes)) {
    errors.push('has-exterior-holes')
  }
  if (hasCrossingHoles(holes)) {
    errors.push('has-crossing-holes')
  }
  return uniq(errors)
}

function polygonRingIsValid(ring) {
  const errors = []
  if (ring.length < 4) {
    errors.push('ring-too-few-coords')
  }
  if (!isClosed(ring)) {
    errors.push('ring-not-closed')
  }
  if (ringHasDuplicateVertices(ring)) {
    errors.push('ring-has-duplicate-vertices')
  }
  return errors
}

function hasExteriorHoles(exteriorRing, holes) {
  const exteriorPolygon = polygon([exteriorRing])
  return holes.some(hole => {
    const holePolygon = polygon([hole])
    // TODO: support holes touching exterior on one point
    return !booleanWithin(holePolygon, exteriorPolygon)
  })
}

function hasCrossingHoles(holes = []) {
  const len = holes.length
  if (len === 0) {
    throw new Error('Holes array must not be empty')
  }
  if (len === 1) {
    return false
  }
  const holesPolygons = holes.map(h => polygon([h]))
  let ok = true
  let i = 0
  let j = 0
  while (ok && (i !== len - 1 || j !== len - 1)) {
    if (i < j && intersect(holesPolygons[i], holesPolygons[j])) {
      ok = false
    }
    if (i === len - 1) {
      j++
      i = 0
    } else {
      i++
    }
  }
  return !ok
}

function ringHasDuplicateVertices(ring) {
  let ok = true
  let cursor = 0
  const existingCoords = new Set()
  while (ok && cursor <= ring.length - 2) {
    const coords = coordsToString(ring[cursor])
    if (existingCoords.has(coords)) {
      ok = false
    } else {
      existingCoords.add(coords)
    }
    cursor++
  }
  return !ok
}

function selfIntersect(geometry) {
  return kinks(geometry).features.length > 0
}

function coordsToString(coords, precision = 7) {
  return `${coords[0].toFixed(precision)},${coords[1].toFixed(precision)}`
}

function isClosed(ring) {
  return coordsToString(first(ring)) === coordsToString(last(ring))
}

module.exports = {
  validate
}
