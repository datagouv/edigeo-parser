const {isEmpty, isEqual, first, last, tail} = require('lodash')
const debug = require('debug')('edigeo-parser')

class OngoingRing {

  constructor() {
    this.coordinates = []
    this.relatedFaces = new Set()
  }

  isClosed(maxDistance = 0) {
    return this.coordinates.length >= 4 && nodesAreEqual(first(this.coordinates), last(this.coordinates), maxDistance)
  }

  pushArc(arc) {
    if (isEmpty(this.coordinates)) {
      this.coordinates = [...arc.coordinates]
    } else {
      this.coordinates = this.coordinates.concat(tail(arc.coordinates))
    }
    arc.relatedFaces.forEach(face => this.relatedFaces.add(face))
  }

  getLastNode() {
    if (this.coordinates.length === 0) {
      throw new Error('Unable to get the last node from an empty ring')
    }
    return last(this.coordinates)
  }

  isConnectable(arc, maxDistance = 0) {
    return nodesAreEqual(first(arc.coordinates), this.getLastNode(), maxDistance)
  }

  forceClose() {
    debug('force closed ring')
    this.coordinates[this.coordinates.length - 1] = this.coordinates[0]
  }

  toObject() {
    return {
      coordinates: this.coordinates,
      relatedFaces: Array.from(this.relatedFaces)
    }
  }

}

function computeRings(arcs, compatMode = false) {
  const maxDistance = compatMode ? 1 : 0
  const remainingArcs = new Set(normalizeArcs(arcs, maxDistance))

  function notSupportedTopology() {
    if (!compatMode) {
      debug('computeRings: switched to compat mode')
      return computeRings(arcs, true)
    }
    throw new Error('Topology type not supported yet')
  }

  const rings = []

  while (remainingArcs.size > 0) {
    const ring = new OngoingRing()

    // We take the first arc as starting point
    const initialArc = remainingArcs.values().next().value

    // Add initial arc to current ring
    ring.pushArc(initialArc)
    remainingArcs.delete(initialArc)

    while (!ring.isClosed() && remainingArcs.size > 0) {
      const connectedArcs = Array.from(remainingArcs).filter(arc => ring.isConnectable(arc, maxDistance))
      if (connectedArcs.length === 1) {
        ring.pushArc(connectedArcs[0])
        remainingArcs.delete(connectedArcs[0])
      } else if (connectedArcs.length > 2) {
        return notSupportedTopology()
      } else if (connectedArcs.length === 2) {
        // Now we try some recovery strategies
        // If the first and last nodes are the same, we take the arc no related to Face_0
        const firstArc = connectedArcs[0]
        const secondArc = connectedArcs[1]
        const areAlternative = pathsAreEquivalent(firstArc.coordinates, secondArc.coordinates, maxDistance)

        if (areAlternative) {
          remainingArcs.delete(firstArc)
          remainingArcs.delete(secondArc)
          // We select the first arc, unless if it touches the exterior face
          ring.pushArc(touchExterior(firstArc) ? secondArc : firstArc)
        } else {
          return notSupportedTopology()
        }
      } else if (connectedArcs.length === 0) {
        return notSupportedTopology()
      }
    }

    // If the current ring is not closed yet, we throw an error
    if (!ring.isClosed()) {
      if (ring.isClosed(1)) {
        ring.forceClose()
      } else {
        throw new Error('Unable to close the current ring: no more arcs available')
      }
    }

    rings.push(ring.toObject())
  }

  return rings
}

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

function nodesAreEqual(a, b, maxDistance = 0) {
  if (maxDistance === 0) {
    return isEqual(a, b)
  }
  return getDistance(a, b) < maxDistance
}

function pathsAreEquivalent(a, b, extremitiesTolerance = 0) {
  return nodesAreEqual(first(a), first(b), extremitiesTolerance) && nodesAreEqual(last(a), last(b), extremitiesTolerance)
}

function touchExterior(arc) {
  return arc.relatedFaces.some(face => face.endsWith('Face_0'))
}

function getDistance(a, b) {
  const [xa, ya] = a
  const [xb, yb] = b
  return Math.sqrt(((xb - xa) * (xb - xa)) + ((yb - ya) * (yb - ya)))
}

function getPathSize(coordinates) {
  let size = 0
  for (let i = 0; i < (coordinates.length - 1); i++) {
    size += getDistance(coordinates[i], coordinates[i + 1])
  }
  return size
}

function normalizeArcs(arcs, minimumArcLength = 0) {
  const normalizedArcs = arcs.map(arc => {
    const coordinates = arc.direction === 1 ? [...arc.coordinates] : [...arc.coordinates].reverse()
    return {id: arc.id, coordinates, relatedFaces: arc.relatedFaces}
  })
  return minimumArcLength ? normalizedArcs.filter(arc => getPathSize(arc.coordinates) >= minimumArcLength) : normalizedArcs
}

module.exports = {computeRings}
