const pointInPolygon = require('@turf/boolean-point-in-polygon')
const {point, polygon} = require('@turf/helpers')
const {flatten} = require('lodash')
const debug = require('debug')('edigeo-parser:geometries')

function assembleRingsTopo(ringsObj) {
  const exteriorRings = ringsObj.filter(r => r.isExterior)
  const holes = ringsObj.filter(r => !r.isExterior)

  if (exteriorRings.length === 0) {
    throw new Error('No exterior ring found')
  }
  if (exteriorRings.length > 1) {
    throw new Error('Too many exterior rings found')
  }

  return {
    exteriorRing: exteriorRings[0].coordinates,
    holes: holes.map(ring => ring.coordinates)
  }
}

function assembleRingsSingle(ringsObj, topologyMode) {
  if (topologyMode === 'TOP') {
    try {
      return assembleRingsTopo(ringsObj)
    } catch (err) {
      debug(`${err.message} => fallback to groupRings`)
      return groupRings(ringsObj)[0]
    }
  }

  if (ringsObj.length === 1) {
    return {
      exteriorRing: ringsObj[0].coordinates,
      holes: []
    }
  }

  return groupRings(ringsObj)[0]
}

function assembleRingsMulti(facesRings, topologyMode) {
  if (topologyMode === 'TOP') {
    try {
      return facesRings.map(assembleRingsTopo)
    } catch (err) {
      debug(`${err.message} => fallback to groupRings`)
      return groupRings(flatten(facesRings), true)
    }
  }

  return groupRings(flatten(facesRings), true)
}

function assembleRings(facesRings, topologyMode, multi = false) {
  if (multi) {
    return assembleRingsMulti(facesRings, topologyMode).map(toCoordinates)
  }
  return toCoordinates(assembleRingsSingle(facesRings[0], topologyMode))
}

function groupRings(ringsObj, multi = false) {
  const exteriorRing = ringsObj.find((candidateExteriorRing => {
    return ringsObj.every(candidateHole => {
      return candidateHole === candidateExteriorRing ||
        pointInPolygon(point(candidateHole.coordinates[0]), polygon([candidateExteriorRing.coordinates]))
    })
  }))

  if (!exteriorRing && multi) {
    const remainingRings = new Set(ringsObj)
    const polygons = []
    Array.from(remainingRings).forEach(candidateExteriorRing => {
      const holes = Array.from(remainingRings).filter(candidateHole => {
        if (candidateHole === candidateExteriorRing) {
          return false
        }
        if (pointInPolygon(point(candidateHole.coordinates[0]), polygon([candidateExteriorRing.coordinates]))) {
          return true
        }
        return false
      })
      if (holes.length > 0) {
        polygons.push({exteriorRing: candidateExteriorRing.coordinates, holes: holes.map(r => r.coordinates)})
        remainingRings.delete(candidateExteriorRing)
        holes.forEach(h => remainingRings.delete(h))
      }
    })
    Array.from(remainingRings).forEach(ring => {
      polygons.push({exteriorRing: ring.coordinates, holes: []})
    })
    return polygons
  }

  if (!exteriorRing) {
    throw new Error('No exterior ring found')
  }

  return [{
    exteriorRing: exteriorRing.coordinates,
    holes: ringsObj.filter(r => r !== exteriorRing).map(r => r.coordinates)
  }]
}

function toCoordinates({exteriorRing, holes}) {
  return [exteriorRing, ...holes]
}

module.exports = {assembleRings}
