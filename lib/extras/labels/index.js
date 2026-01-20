import {chain} from 'lodash-es'
import {length, lineSlice, pointToLineDistance} from '@turf/turf'

function getRawLabels(featureId, ctx) {
  return ctx.getRelatedObjects(featureId, 'IS_S_REL_IWW')
    .map(labelFeatureId => {
      const {properties, geometry} = ctx.features[labelFeatureId.slice(8)]
      return {
        attribute: properties.ID_S_ATT_ATR[3].replace(/_id$/, ''),
        position: geometry.coordinates,
      }
    })
}

function extractLabels(feature, ctx) {
  const featureId = `SeSPA_1:${feature.id}`
  const {properties} = feature
  const firstLineStringAsFeature = {type: 'Feature', properties: {}, geometry: {type: 'LineString', coordinates: feature.geometry.coordinates[0]}}
  const startPoint = firstLineStringAsFeature.geometry.coordinates[0]
  let hasTooFarPoints = false

  const labels = chain(getRawLabels(featureId, ctx))
    .map(label => {
      const value = (properties[label.attribute] || '').trim().replace(/\s\s+/g, ' ')
      if (pointToLineDistance(label.position, firstLineStringAsFeature, {mercator: true}) > 0.05) {
        hasTooFarPoints = true
      }

      const distanceToStart = length(lineSlice(startPoint, label.position, firstLineStringAsFeature))
      return {
        value,
        distanceToStart,
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

export {getRawLabels, extractLabels}
