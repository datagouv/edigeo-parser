/* eslint camelcase: off */
const {mapKeys} = require('lodash')
const proj4 = require('proj4')
const {getReference} = require('./references')
const {buildPolygon, buildMultiPolygon, buildLineString} = require('./geometries')
const {getPrimitives} = require('./topology/relations')

const wgs84 = getReference(4326).proj4

const featureTypes = {
  COMMUNE_id: {
    renamedInto: 'communes',
    geometryType: 'MultiPolygon',
    relationComposition: 'ID_S_RCO_COMMUNE_id'
  },
  SECTION_id: {
    renamedInto: 'sections',
    geometryType: 'MultiPolygon',
    relationComposition: 'ID_S_RCO_SECTION_id'
  },
  SUBDSECT_id: {
    renamedInto: 'feuilles',
    geometryType: 'MultiPolygon',
    relationComposition: 'ID_S_RCO_SUBDSECT_id'
  },
  PARCELLE_id: {
    renamedInto: 'parcelles',
    geometryType: 'Polygon',
    relationComposition: 'ID_S_RCO_PARCELLE_id'
  },
  BATIMENT_id: {
    renamedInto: 'batiments',
    geometryType: 'MultiPolygon',
    relationComposition: 'ID_S_RCO_BATIMENT_id'
  },
  ZONCOMMUNI_id: {
    renamedInto: 'voies',
    geometryType: 'LineString',
    relationComposition: 'ID_S_RCO_ZONCOMMUNI_id'
  }
}

function buildProperties(attributes) {
  return mapKeys(attributes, (v, k) => k.replace(/_id$/, ''))
}

function buildPolygonFeature(feature, proj, ctx) {
  const {featureType} = feature
  const {relationComposition} = featureTypes[featureType]
  const faces = getPrimitives(feature.fullId, relationComposition, ctx)
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
  const {featureType} = feature
  const {relationComposition} = featureTypes[featureType]
  const faces = getPrimitives(feature.fullId, relationComposition, ctx)
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
  const {featureType} = feature
  const {relationComposition} = featureTypes[featureType]
  const arcs = getPrimitives(feature.fullId, relationComposition, ctx)
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

const builders = {
  Polygon: buildPolygonFeature,
  MultiPolygon: buildMultiPolygonFeature,
  LineString: buildLineStringFeature
}

function buildFeatures(rawFeatures, srsCode, ctx) {
  const proj = coords => proj4(getReference(srsCode).proj4, wgs84).forward(coords)

  return rawFeatures
    .filter(f => f.featureType in featureTypes)
    .reduce((acc, f) => {
      const ft = featureTypes[f.featureType].renamedInto
      if (!(ft in acc)) {
        acc[ft] = []
      }
      try {
        const buildFeature = builders[featureTypes[f.featureType].geometryType]
        acc[ft].push(buildFeature(f, proj, ctx))
      } catch (err) {
        console.error(`${ctx.bundle ? ctx.bundle + ' | ' : ''}${ft}:${f.id} => feature ignored (${err.message})`)
      }
      return acc
    }, {})
}

module.exports = {buildFeatures, featureTypes}
