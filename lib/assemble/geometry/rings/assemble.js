import {booleanPointInPolygon, point, polygon} from '@turf/turf'
import {flatten} from 'lodash-es'
import debugFactory from 'debug'

const debug = debugFactory('edigeo-parser:geometries')

function assembleRingsTopo(ringsObject) {
  const exteriorRings = ringsObject.filter(r => r.isExterior)
  const holes = ringsObject.filter(r => !r.isExterior)

  if (exteriorRings.length === 0) {
    throw new Error('No exterior ring found')
  }

  if (exteriorRings.length > 1) {
    throw new Error('Too many exterior rings found')
  }

  return {
    exteriorRing: exteriorRings[0].coordinates,
    holes: holes.map(ring => ring.coordinates),
  }
}

function assembleRingsSingle(ringsObject, topologyMode) {
  if (topologyMode === 'TOP') {
    try {
      return assembleRingsTopo(ringsObject)
    } catch (error) {
      debug(`${error.message} => fallback to groupRings`)
      return groupRings(ringsObject)[0]
    }
  }

  if (ringsObject.length === 1) {
    return {
      exteriorRing: ringsObject[0].coordinates,
      holes: [],
    }
  }

  return groupRings(ringsObject)[0]
}

function assembleRingsMulti(facesRings, topologyMode) {
  if (topologyMode === 'TOP') {
    try {
      return facesRings.map(ring => assembleRingsTopo(ring))
    } catch (error) {
      debug(`${error.message} => fallback to groupRings`)
      return groupRings(flatten(facesRings), true)
    }
  }

  return groupRings(flatten(facesRings), true)
}

function assembleRings(facesRings, topologyMode, multi = false) {
  if (multi) {
    return assembleRingsMulti(facesRings, topologyMode).map(ring => toCoordinates(ring))
  }

  return toCoordinates(assembleRingsSingle(facesRings[0], topologyMode))
}

function groupRings(ringsObject, multi = false) {
  const exteriorRing = ringsObject.find((candidateExteriorRing => ringsObject.every(candidateHole => candidateHole === candidateExteriorRing
      || booleanPointInPolygon(point(candidateHole.coordinates[0]), polygon([candidateExteriorRing.coordinates])))))

  if (!exteriorRing && multi) {
    const remainingRings = new Set(ringsObject)
    const polygons = []
    for (const candidateExteriorRing of remainingRings) {
      const holes = [...remainingRings].filter(candidateHole => {
        if (candidateHole === candidateExteriorRing) {
          return false
        }

        if (booleanPointInPolygon(point(candidateHole.coordinates[0]), polygon([candidateExteriorRing.coordinates]))) {
          return true
        }

        return false
      })
      if (holes.length > 0) {
        polygons.push({exteriorRing: candidateExteriorRing.coordinates, holes: holes.map(r => r.coordinates)})
        remainingRings.delete(candidateExteriorRing)
        for (const h of holes) remainingRings.delete(h)
      }
    }

    for (const ring of remainingRings) {
      polygons.push({exteriorRing: ring.coordinates, holes: []})
    }

    return polygons
  }

  if (!exteriorRing) {
    throw new Error('No exterior ring found')
  }

  return [{
    exteriorRing: exteriorRing.coordinates,
    holes: ringsObject.filter(r => r !== exteriorRing).map(r => r.coordinates),
  }]
}

function toCoordinates({exteriorRing, holes}) {
  return [exteriorRing, ...holes]
}

export {assembleRings}
