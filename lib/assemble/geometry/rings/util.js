import { first, last, isEqual } from 'lodash-es';

function getDistance(a, b) {
  const [xa, ya] = a
  const [xb, yb] = b
  return Math.sqrt(((xb - xa) * (xb - xa)) + ((yb - ya) * (yb - ya)))
}

function getPathLength(positions) {
  let size = 0
  for (let i = 0; i < (positions.length - 1); i++) {
    size += getDistance(positions[i], positions[i + 1])
  }

  return size
}

function positionIsEqual(a, b, tolerance = 0) {
  if (tolerance === 0) {
    return isEqual(a, b)
  }

  return getDistance(a, b) < tolerance
}

function getArcPosition(arc, face) {
  if (arc.left && arc.right && arc.left === arc.right) {
    throw new Error('Face is present on both side of an arc!')
  }

  if (arc.left === face) {
    return 'left'
  }

  if (arc.right === face) {
    return 'right'
  }

  throw new Error('Arc is not related to given face')
}

function pathIsClosed(positions, tolerance = 0) {
  return positions.length >= 4 && positionIsEqual(first(positions), last(positions), tolerance)
}

function pathIsEquivalent(firstArc, secondArc, referenceFace, tolerance = 0) {
  const firstArcPos = getArcPosition(firstArc, referenceFace)
  const secondArcPos = getArcPosition(secondArc, referenceFace)
  const firstRing = firstArc.coordinates
  const secondRing = firstArcPos === secondArcPos ? secondArc.coordinates : [...secondArc.coordinates].reverse()
  return positionIsEqual(first(firstRing), first(secondRing), tolerance) && positionIsEqual(last(firstRing), last(secondRing), tolerance)
}

function touchesExterior(arc) {
  return arc.left.endsWith('Face_0') || arc.right.endsWith('Face_0')
}

export {getDistance, getPathLength, positionIsEqual, pathIsClosed, getArcPosition, pathIsEquivalent, touchesExterior};
