/* eslint camelcase: off */
const {mapKeys} = require('lodash')
const {buildPolygon, buildMultiPolygon, buildLineString, buildPoint} = require('./geometries')
const {getPrimitives} = require('./topology/relations')

const featureTypes = {
  COMMUNE_id: {
    geometryType: 'MultiPolygon'
  },
  SECTION_id: {
    geometryType: 'MultiPolygon'
  },
  SUBDSECT_id: {
    geometryType: 'MultiPolygon'
  },
  PARCELLE_id: {
    geometryType: 'Polygon'
  },
  SUBDFISC_id: {
    geometryType: 'Polygon'
  },
  CHARGE_id: {
    geometryType: 'Polygon'
  },
  VOIEP_id: {
    geometryType: 'Point'
  },
  TRONFLUV_id: {
    geometryType: 'Polygon'
  },
  PTCANV_id: {
    geometryType: 'Point'
  },
  BATIMENT_id: {
    geometryType: 'MultiPolygon'
  },
  ZONCOMMUNI_id: {
    geometryType: 'LineString'
  },
  NUMVOIE_id: {
    geometryType: 'Point'
  },
  TRONROUTE_id: {
    geometryType: 'Polygon'
  },
  BORNE_id: {
    geometryType: 'Point'
  },
  CROIX_id: {
    geometryType: 'Point'
  },
  BOULON_id: {
    geometryType: 'Point'
  },
  SYMBLIM_id: {
    geometryType: 'Point'
  },
  LIEUDIT_id: {
    geometryType: 'Polygon'
  },
  TPOINT_id: {
    geometryType: 'Point'
  },
  TLINE_id: {
    geometryType: 'LineString'
  },
  TSURF_id: {
    geometryType: 'Polygon'
  },
  ID_S_OBJ_Z_1_2_2: {
    renamedInto: 'LABEL',
    geometryType: 'Point'
  }
}

function getDates(qup, ctx) {
  const result = {}
  const qupBlock = ctx.indexedItems[qup]
  if (qupBlock && qupBlock.createdAt) {
    result.DATE_OBS = qupBlock.createdAt
  }
  if (qupBlock && qupBlock.updatedAt) {
    result.DATE_MAJ = qupBlock.updatedAt
  }
  return result
}

function buildProperties(feature, ctx) {
  const dates = feature.qup ? getDates(feature.qup, ctx) : {}
  return {
    ...mapKeys(feature.attributes, (v, k) => k.replace(/_id$/, '')),
    ...dates
  }
}

function buildPolygonFeature(feature, ctx) {
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
    properties: buildProperties(feature, ctx),
    geometry: buildPolygon(faces[0])
  }
}

function buildMultiPolygonFeature(feature, ctx) {
  const faces = getPrimitives(feature.fullId, ctx)
    .map(f => ctx.faces[f])
  if (faces.length === 0) {
    throw new Error('No face to build the feature geometry')
  }
  return {
    type: 'Feature',
    id: feature.id,
    properties: buildProperties(feature, ctx),
    geometry: buildMultiPolygon(faces)
  }
}

function buildLineStringFeature(feature, ctx) {
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
    properties: buildProperties(feature, ctx),
    geometry: buildLineString(arc)
  }
}

function buildPointFeature(feature, ctx) {
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
    properties: buildProperties(feature, ctx),
    geometry: buildPoint(position)
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
    const layer = ftDef.renamedInto || featureType.split('_')[0]
    try {
      const buildFeatureFn = builders[ftDef.geometryType]
      const feature = buildFeatureFn(feaBlock, ctx)
      feature.geometry = ctx.proj(feature.geometry)
      feature.layer = layer
      return feature
    } catch (err) {
      console.error(`${ctx.bundle ? ctx.bundle + ' | ' : ''}${layer}:${feaBlock.id} => feature ignored (${err.message})`)
    }
  }
}

module.exports = {buildFeature, featureTypes}
