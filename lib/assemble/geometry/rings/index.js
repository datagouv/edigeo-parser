import debugFactory from 'debug'
import Ring from './ring.js'
import {getPathLength, touchesExterior, pathIsEquivalent} from './util.js'

const debug = debugFactory('edigeo-parser')

function computeRings(face, compatMode = false) {
  const minimumArcSize = compatMode ? 1 : 0

  const remainingArcs = new Set(minimumArcSize
    ? face.arcs.filter(arc => getPathLength(arc.coordinates) >= minimumArcSize)
    : face.arcs,
  )

  const rings = []
  while (remainingArcs.size > 0) {
    const ring = new Ring(face)

    // We take the first arc as starting point
    const initialArc = remainingArcs.values().next().value

    // Add initial arc to current ring
    ring.pushFirstArc(initialArc)
    remainingArcs.delete(initialArc)

    while (!ring.isClosed() && remainingArcs.size > 0) {
      try {
        const {nextArc, arcsToDismiss, reverse} = findNextArc(face, remainingArcs, ring, compatMode)
        if (arcsToDismiss) {
          for (const arc of arcsToDismiss) remainingArcs.delete(arc)
        }

        if (nextArc) {
          ring.pushArc(nextArc, reverse)
        }
      } catch (error) {
        if (error.message === 'Topology not supported yet' && !compatMode) {
          debug('computeRings: switched to compat mode')
          return computeRings(face, true)
        }

        throw error
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

function findNextArc(face, remainingArcs, currentRing, compatMode) {
  const maxDistance = compatMode ? 1 : 0

  let reverse = false
  let connectedArcs = [...remainingArcs].filter(arc => currentRing.isConnectable(arc, maxDistance))
  if (connectedArcs.length === 0) {
    // Retry in reverse mode
    reverse = true
    connectedArcs = [...remainingArcs].filter(arc => currentRing.isConnectable(arc, maxDistance, true))
  }

  if (connectedArcs.length === 0) {
    throw new Error('Topology not supported yet')
  }

  return selectNextArc(connectedArcs, face, maxDistance, reverse)
}

function selectNextArc(candidateArcs, referenceFace, tolerance, reverse) {
  // Normal
  if (candidateArcs.length === 1) {
    return {
      nextArc: candidateArcs[0],
      arcsToDismiss: [candidateArcs[0]],
      reverse,
    }
  }

  if (candidateArcs.length > 2) {
    throw new Error('Topology not supported yet')
  }

  if (candidateArcs.length === 2) {
    // Now we try some recovery strategies
    // If the first and last nodes are the same, we take the arc no related to Face_0
    const firstArc = candidateArcs[0]
    const secondArc = candidateArcs[1]
    const areAlternative = pathIsEquivalent(firstArc, secondArc, referenceFace, tolerance)

    if (areAlternative) {
      return {
        // We select the first arc, unless if it touches the exterior face
        nextArc: touchesExterior(firstArc) ? secondArc : firstArc,
        arcsToDismiss: [firstArc, secondArc],
        reverse,
      }
    }
  }

  throw new Error('Topology not supported yet')
}

export {computeRings}
