import {assembleRings} from './rings/assemble.js'
import {computeRings} from './rings/index.js'

function buildPolygon(fea, ctx) {
  const faces = ctx.getPrimitives(fea.fullId).map(f => ctx.faces[f])
  if (faces.length === 0) {
    throw new Error('No face to build the feature geometry')
  }

  if (faces.length > 1) {
    throw new Error('Too many linked faces to build a single Polygon')
  }

  const [face] = faces
  try {
    return {
      type: 'Polygon',
      coordinates: assembleRings([computeRings(face)], face.topologyMode),
    }
  } catch (error) {
    if ([
      'Unable to close the current ring: no more arcs available',
      'No exterior ring found',
      'Topology not supported yet',
    ].includes(error.message)) {
      throw new Error('Unable to build valid polygon coordinates')
    }

    throw error
  }
}

function buildMultiPolygon(fea, ctx) {
  const faces = ctx.getPrimitives(fea.fullId).map(f => ctx.faces[f])
  if (faces.length === 0) {
    throw new Error('No face to build the feature geometry')
  }

  try {
    const {topologyMode} = faces[0]
    return {
      type: 'MultiPolygon',
      coordinates: assembleRings(faces.map(face => computeRings(face)), topologyMode, true),
    }
  } catch (error) {
    if ([
      'Unable to close the current ring: no more arcs available',
      'No exterior ring found',
      'Topology not supported yet',
    ].includes(error.message)) {
      throw new Error('Unable to build valid polygon coordinates')
    }

    throw error
  }
}

function buildMultiLineString(fea, ctx) {
  const arcs = ctx.getPrimitives(fea.fullId)
    .map(f => ctx.arcs[f])
  if (arcs.length === 0) {
    throw new Error('No arc to build the feature geometry')
  }

  const [arc] = arcs
  if (!arc.coordinates || arc.coordinates.length < 2) {
    throw new Error('At least 2 positions are needed to build a LineString')
  }

  return {
    type: 'MultiLineString',
    coordinates: arcs.map(arc => arc.coordinates),
  }
}

function buildPoint(fea, ctx) {
  const nodes = ctx.getPrimitives(fea.fullId)
    .map(id => ctx.getItem(id))
  if (nodes.length === 0) {
    throw new Error('No node to build the feature geometry')
  }

  if (nodes.length > 1) {
    throw new Error('Too many linked nodes to build a single Point')
  }

  const position = nodes[0].coordinates[0]
  return {
    type: 'Point',
    coordinates: position,
  }
}

const builders = {
  Polygon: buildPolygon,
  MultiPolygon: buildMultiPolygon,
  MultiLineString: buildMultiLineString,
  Point: buildPoint,
}

function buildGeometry(geometryType, fea, ctx) {
  if (!(geometryType in builders)) {
    throw new Error('No builder for geometry type: ' + geometryType)
  }

  return builders[geometryType](fea, ctx)
}

export {buildPolygon, buildMultiPolygon, buildMultiLineString, buildPoint, buildGeometry}
