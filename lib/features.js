/* eslint camelcase: off */
const {mapKeys} = require('lodash')
const {buildPolygon, buildMultiPolygon, buildLineString, buildPoint} = require('./geometries')
const {getPrimitives} = require('./topology/relations')

const featureTypes = {
  COMMUNE_id: {
    renamedInto: 'communes',
    geometryType: 'MultiPolygon'
  },
  SECTION_id: {
    renamedInto: 'sections',
    geometryType: 'MultiPolygon'
  },
  SUBDSECT_id: {
    renamedInto: 'feuilles',
    geometryType: 'MultiPolygon'
  },
  PARCELLE_id: {
    renamedInto: 'parcelles',
    geometryType: 'Polygon'
  },
  BATIMENT_id: {
    renamedInto: 'batiments',
    geometryType: 'MultiPolygon'
  },
  ZONCOMMUNI_id: {
    renamedInto: 'voies',
    geometryType: 'LineString'
  },
  NUMVOIE_id: {
    renamedInto: 'numerosVoie',
    geometryType: 'Point'
  },
  ID_S_OBJ_Z_1_2_2: {
    renamedInto: 'labels',
    geometryType: 'Point'
  }
}

function buildProperties(attributes) {
  return mapKeys(attributes, (v, k) => k.replace(/_id$/, ''))
}

function buildPolygonFeature(feature, proj, ctx) {
  const faces = getPrimitives(feature.fullId, ctx)
    .map(f => ctx.faces[f])
  if (faces.length === 0) {
    throw new Error('No face to build the feature geometry')
  }
  if (faces.length > 1) {
    throw new Error('Too many linked faces to build a single Polygon')
  }
  return {
    type: 'Feature',
    id: feature.id,
    properties: buildProperties(feature.attributes),
    geometry: buildPolygon(faces[0], proj)
  }
}

function buildMultiPolygonFeature(feature, proj, ctx) {
  const faces = getPrimitives(feature.fullId, ctx)
    .map(f => ctx.faces[f])
  if (faces.length === 0) {
    throw new Error('No face to build the feature geometry')
  }
  return {
    type: 'Feature',
    id: feature.id,
    properties: buildProperties(feature.attributes),
    geometry: buildMultiPolygon(faces, proj)
  }
}

function buildLineStringFeature(feature, proj, ctx) {
  const arcs = getPrimitives(feature.fullId, ctx)
    .map(f => ctx.arcs[f])
  if (arcs.length === 0) {
    throw new Error('No arc to build the feature geometry')
  }
  if (arcs.length > 1) {
    throw new Error('Too many linked arcs to build a single LineString')
  }
  const arc = arcs[0]
  return {
    type: 'Feature',
    id: feature.id,
    properties: buildProperties(feature.attributes),
    geometry: buildLineString(arc, proj)
  }
}

function buildPointFeature(feature, proj, ctx) {
  const nodes = getPrimitives(feature.fullId, ctx)
    .map(id => ctx.indexedItems[id])
  if (nodes.length === 0) {
    throw new Error('No node to build the feature geometry')
  }
  if (nodes.length > 1) {
    throw new Error('Too many linked nodes to build a single Point')
  }
  const position = nodes[0].coordinates[0]
  return {
    type: 'Feature',
    id: feature.id,
    properties: buildProperties(feature.attributes),
    geometry: buildPoint(position, proj)
  }
}

const builders = {
  Polygon: buildPolygonFeature,
  MultiPolygon: buildMultiPolygonFeature,
  LineString: buildLineStringFeature,
  Point: buildPointFeature
}

function buildFeature(feaBlock, ctx) {
  const {featureType} = feaBlock
  if (featureType in featureTypes) {
    const ftDef = featureTypes[featureType]
    const layer = ftDef.renamedInto
    try {
      const buildFeatureFn = builders[ftDef.geometryType]
      const feature = buildFeatureFn(feaBlock, ctx.proj, ctx)
      feature.layer = layer
      return feature
    } catch (err) {
      console.error(`${ctx.bundle ? ctx.bundle + ' | ' : ''}${layer}:${feaBlock.id} => feature ignored (${err.message})`)
    }
  }
}

module.exports = {buildFeature, featureTypes}
