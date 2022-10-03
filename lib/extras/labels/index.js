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
  // Before, it was a linestring now it's a MultilineString
  const startPoint = feature.geometry.coordinates[0][0]
  let hasTooFarPoints = false

  const labels = chain(getRawLabels(featureId, ctx))
    .map(label => {
      const value = (properties[label.attribute] || '').trim().replace(/\s\s+/g, ' ')
      const part1 = {
        type: 'Feature',
        id: feature.id,
        properties: feature.properties,
        geometry: {
          type: 'LineString',
          coordinates: feature.geometry.coordinates[0],
        },
      }
      if (pointToLineDistance(label.position, part1, {mercator: true}) > 0.05) {
        hasTooFarPoints = true
      }

      const distanceToStart = length(lineSlice(startPoint, label.position, part1))
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
