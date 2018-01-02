/* eslint camelcase: off */
const {mapKeys} = require('lodash')
const {buildPolygon, buildMultiPolygon} = require('./geometries')
const {getFeatureFaces} = require('./topology/relations')

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

function buildFeature(feature, indexedItems, graphIndex) {
  const {featureType} = feature
  const {relationComposition, geometryType} = featureTypes[featureType]
  const faces = getFeatureFaces(feature.fullId, relationComposition, indexedItems, graphIndex)
    .map(f => indexedItems[f])
  if (faces.length === 0) {
    throw new Error('No face to build the feature geometry')
  }
  if (geometryType === 'Polygon' && faces.length > 1) {
    throw new Error('Too many linked faces to build a single Polygon')
  }
  if (geometryType === 'Polygon') {
    return {
      type: 'Feature',
      properties: buildProperties(feature.attributes),
      geometry: buildPolygon(faces[0])
    }
  } else if (geometryType === 'MultiPolygon') {
    return {
      type: 'Feature',
      properties: buildProperties(feature.attributes),
      geometry: buildMultiPolygon(faces)
    }
  }
}

module.exports = {buildFeature, featureTypes}
