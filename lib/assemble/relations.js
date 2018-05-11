const {isFunction} = require('lodash')

const RELATIVE_POSITIONS = {
  ID_S_RCO_FAC_DRTE: 'right',
  ID_S_RCO_FAC_GCHE: 'left'
}

const ALLOWED_RELATIVE_POSITIONS = Object.keys(RELATIVE_POSITIONS)

function getRelatedObjects(featureId, matchRelationType, ctx) {
  const relations = ctx.graphIndex[featureId] || []
  return relations
    .filter(rel => {
      const through = ctx.indexedItems[rel.through]
      if (isFunction(matchRelationType)) {
        return matchRelationType(through.relationType)
      }
      return through.relationType === matchRelationType
    })
    .map(rel => rel.rel)
}

function getPrimitives(featureId, ctx) {
  return getRelatedObjects(featureId, relationType => relationType.startsWith('ID_S_RCO_'), ctx)
}

module.exports = {ALLOWED_RELATIVE_POSITIONS, RELATIVE_POSITIONS, getRelatedObjects, getPrimitives}
