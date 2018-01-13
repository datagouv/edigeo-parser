function buildPolygonCoordinates(face, proj, allowPromoteToMulti = false) {
  try {
    const faceRings = face.computeRings(allowPromoteToMulti)

    if (faceRings.exteriorRing) {
      const exteriorRing = faceRings.exteriorRing.map(proj)
      const holes = faceRings.holes.map(hole => hole.map(proj))
      return [exteriorRing, ...holes]
    }

    if (faceRings.polygons) {
      console.error('promoted malformed spaghetti polygon to multi-polygon')
      return faceRings.polygons.map(polygon => {
        const exteriorRing = polygon.exteriorRing.map(proj)
        const holes = polygon.holes.map(hole => hole.map(proj))
        return [exteriorRing, ...holes]
      })
    }

    throw new Error('Unexpected situation')
  } catch (err) {
    if ([
      'Unable to close the current ring: no more arcs available',
      'No exterior ring found'
    ].includes(err.message)) {
      throw new Error('Unable to build valid polygon coordinates')
    }
    console.error(err)
    process.exit(1)
  }
}

function buildPolygon(face, proj) {
  return {
    type: 'Polygon',
    coordinates: buildPolygonCoordinates(face, proj)
  }
}

function buildMultiPolygon(faces, proj) {
  if (faces.length === 1) {
    const polygonsRings = buildPolygonCoordinates(faces[0], proj, true)
    return {
      type: 'MultiPolygon',
      coordinates: Array.isArray(polygonsRings[0][0][0]) ? polygonsRings : [polygonsRings]
    }
  }
  return {
    type: 'MultiPolygon',
    coordinates: faces.map(face => buildPolygonCoordinates(face, proj, false))
  }
}

function buildLineString(arc, proj) {
  if (!arc.coordinates || arc.coordinates.length < 2) {
    throw new Error('At least 2 positions are needed to build a LineString')
  }
  return {
    type: 'LineString',
    coordinates: arc.coordinates.map(proj)
  }
}

function buildPoint(position, proj) {
  return {
    type: 'Point',
    coordinates: proj(position)
  }
}

module.exports = {buildPolygon, buildMultiPolygon, buildLineString, buildPoint, buildPolygonCoordinates}
