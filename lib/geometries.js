function buildPolygonCoordinates(face) {
  if (!face.exteriorRing) {
    throw new Error('Face must have an exterior ring')
  }
  return [face.exteriorRing, ...face.holes]
}

function buildPolygon(face) {
  return {
    type: 'Polygon',
    coordinates: buildPolygonCoordinates(face)
  }
}

function buildMultiPolygon(faces) {
  return {
    type: 'MultiPolygon',
    coordinates: faces.map(buildPolygonCoordinates)
  }
}

module.exports = {buildPolygon, buildMultiPolygon, buildPolygonCoordinates}
