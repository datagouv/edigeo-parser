const pointInPolygon = require('@turf/boolean-point-in-polygon')
const {point, polygon} = require('@turf/helpers')

function groupRings(rings, allowPromoteToMulti = false) {
  const exteriorRing = rings.find((candidateExteriorRing => {
    return rings.every(candidateHole => {
      return candidateHole === candidateExteriorRing ||
        pointInPolygon(point(candidateHole.coordinates[0]), polygon([candidateExteriorRing.coordinates]))
    })
  }))

  if (!exteriorRing && allowPromoteToMulti) {
    const remainingRings = new Set(rings)
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
    return {polygons}
  }

  if (!exteriorRing) {
    throw new Error('No exterior ring found')
  }

  return {
    exteriorRing: exteriorRing.coordinates,
    holes: rings.filter(r => r !== exteriorRing).map(r => r.coordinates)
  }
}

module.exports = groupRings
