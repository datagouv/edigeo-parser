const {chain} = require('lodash')
const length = require('@turf/length')
const lineSlice = require('@turf/line-slice')
const pointToLineDistance = require('@turf/point-to-line-distance')
const {getRelatedObjects} = require('../topology/relations')

function getRawLabels(featureId, ctx) {
  return getRelatedObjects(featureId, 'IS_S_REL_IWW', ctx)
    .map(labelFeatureId => {
      const {properties, geometry} = ctx.features[labelFeatureId.substr(8)]
      return {
        attribute: properties.ID_S_ATT_ATR[3].replace(/_id$/, ''),
        position: geometry.coordinates
      }
    })
}

function extractLabels(feature, ctx) {
  const featureId = `SeSPA_1:${feature.id}`
  const {properties} = feature
  const startPoint = feature.geometry.coordinates[0]
  let hasTooFarPoints = false

  const labels = chain(getRawLabels(featureId, ctx))
    .map(label => {
      const value = (properties[label.attribute] || '').trim().replace(/\s\s+/g, ' ')
      if (pointToLineDistance(label.position, feature, {mercator: true}) > 0.05) {
        hasTooFarPoints = true
      }
      const distanceToStart = length(lineSlice(startPoint, label.position, feature))
      return {
        value,
        distanceToStart
      }
    })
    .sortBy('distanceToStart')
    .compact()
    .value()

  const result = {parts: labels.map(l => l.value)}

  if (hasTooFarPoints) {
    result.invalidSourceData = true
  }

  return result
}

module.exports = {getRawLabels, extractLabels}
