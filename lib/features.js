/* eslint camelcase: off */
const {mapKeys} = require('lodash')
const proj4 = require('proj4')
const {getReference} = require('./references')
const {buildPolygon, buildMultiPolygon} = require('./geometries')
const {getFeatureFaces} = require('./topology/relations')

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
  }
}

function buildProperties(attributes) {
  return mapKeys(attributes, (v, k) => k.replace(/_id$/, ''))
}

function buildFeature(feature, proj, ctx) {
  const {featureType} = feature
  const {relationComposition, geometryType} = featureTypes[featureType]
  const faces = getFeatureFaces(feature.fullId, relationComposition, ctx)
    .map(f => ctx.faces[f])
  if (faces.length === 0) {
    throw new Error('No face to build the feature geometry')
  }
  if (geometryType === 'Polygon' && faces.length > 1) {
    throw new Error('Too many linked faces to build a single Polygon')
  }
  if (geometryType === 'Polygon') {
    return {
      type: 'Feature',
      id: feature.id,
      properties: buildProperties(feature.attributes),
      geometry: buildPolygon(faces[0], proj)
    }
  } else if (geometryType === 'MultiPolygon') {
    return {
      type: 'Feature',
      id: feature.id,
      properties: buildProperties(feature.attributes),
      geometry: buildMultiPolygon(faces, proj)
    }
  }
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
        acc[ft].push(buildFeature(f, proj, ctx))
      } catch (err) {
        console.error(`${ctx.bundle ? ctx.bundle + ' | ' : ''}${ft}:${f.id} => feature ignored (${err.message})`)
      }
      return acc
    }, {})
}

module.exports = {buildFeatures, buildFeature, featureTypes}
