const {assembleRings} = require('./topology/rings/assemble')

function buildPolygon(face) {
  try {
    return {
      type: 'Polygon',
      coordinates: assembleRings([face.computeRings()], face.topologyMode)
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

function buildMultiPolygon(faces) {
  try {
    const {topologyMode} = faces[0]
    return {
      type: 'MultiPolygon',
      coordinates: assembleRings(faces.map(face => face.computeRings()), topologyMode, true)
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

function buildLineString(arc) {
  if (!arc.coordinates || arc.coordinates.length < 2) {
    throw new Error('At least 2 positions are needed to build a LineString')
  }
  return {
    type: 'LineString',
    coordinates: arc.coordinates
  }
}

function buildPoint(position) {
  return {
    type: 'Point',
    coordinates: position
  }
}

module.exports = {buildPolygon, buildMultiPolygon, buildLineString, buildPoint}
