function buildPolygonCoordinates(face, proj) {
  if (!face.exteriorRing) {
    throw new Error('Face must have an exterior ring')
  }
  const exteriorRing = face.exteriorRing.map(proj)
  const holes = face.holes.map(hole => hole.map(proj))
  return [exteriorRing, ...holes]
}

function buildPolygon(face, proj) {
  return {
    type: 'Polygon',
    coordinates: buildPolygonCoordinates(face, proj)
  }
}

function buildMultiPolygon(faces, proj) {
  return {
    type: 'MultiPolygon',
    coordinates: faces.map(face => buildPolygonCoordinates(face, proj))
  }
}

module.exports = {buildPolygon, buildMultiPolygon, buildPolygonCoordinates}
