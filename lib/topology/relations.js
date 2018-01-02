const {chain} = require('lodash')

function getFaceArcs(faceId, indexedItems, graphIndex) {
  return (graphIndex[faceId] || [])
    .filter(rel => {
      const through = indexedItems[rel.through]
      return ['ID_S_RCO_FAC_DRTE', 'ID_S_RCO_FAC_GCHE'].includes(through.relationType)
    })
    .map(rel => {
      const through = indexedItems[rel.through]
      const arc = indexedItems[rel.rel]
      return {
        id: rel.rel,
        relatedFaces: arc.relatedFaces,
        coordinates: arc.coordinates,
        direction: through.relationType === 'ID_S_RCO_FAC_DRTE' ? 1 : -1
      }
    })
}

function getFeatureFaces(featureId, compositionRelation, indexedItems, graphIndex) {
  const relations = graphIndex[featureId]
  return relations
    .filter(rel => {
      const through = indexedItems[rel.through]
      return through.relationType === compositionRelation
    })
    .map(rel => rel.rel)
}

function getArcFaces(arcId, indexedItems, graphIndex) {
  return graphIndex[arcId]
    .filter(rel => {
      const through = indexedItems[rel.through]
      return ['ID_S_RCO_FAC_DRTE', 'ID_S_RCO_FAC_GCHE'].includes(through.relationType)
    })
    .map(rel => rel.rel)
}

function getAdjacentFaces(faceId, indexedItems, graphIndex) {
  const arcs = getFaceArcs(faceId, indexedItems, graphIndex)
  return chain(arcs)
    .map(arc => indexedItems[arc.id].relatedFaces)
    .flatten()
    .uniq()
    .filter(adjacentFaceId => adjacentFaceId !== faceId)
    .value()
}

module.exports = {getFaceArcs, getArcFaces, getAdjacentFaces, getFeatureFaces}
