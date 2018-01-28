const {assembleRings} = require('./topology/rings/assemble')

function buildPolygon(face, proj) {
  try {
    return {
      type: 'Polygon',
      coordinates: proj(assembleRings([face.computeRings()], face.topologyMode))
    }
  } catch (err) {
    if ([
      'Unable to close the current ring: no more arcs available',
      'No exterior ring found',
      'Topology not supported yet'
    ].includes(err.message)) {
      throw new Error('Unable to build valid polygon coordinates')
    }
    throw err
  }
}

function buildMultiPolygon(faces, proj) {
  try {
    const {topologyMode} = faces[0]
    return {
      type: 'MultiPolygon',
      coordinates: proj(assembleRings(faces.map(face => face.computeRings()), topologyMode, true))
    }
  } catch (err) {
    if ([
      'Unable to close the current ring: no more arcs available',
      'No exterior ring found',
      'Topology not supported yet'
    ].includes(err.message)) {
      throw new Error('Unable to build valid polygon coordinates')
    }
    throw err
  }
}

function buildLineString(arc, proj) {
  if (!arc.coordinates || arc.coordinates.length < 2) {
    throw new Error('At least 2 positions are needed to build a LineString')
  }
  return {
    type: 'LineString',
    coordinates: proj(arc.coordinates)
  }
}

function buildPoint(position, proj) {
  return {
    type: 'Point',
    coordinates: proj(position)
  }
}

module.exports = {buildPolygon, buildMultiPolygon, buildLineString, buildPoint}
