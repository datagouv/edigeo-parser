const RELATIVE_POSITIONS = {
  ID_S_RCO_FAC_DRTE: 'right',
  ID_S_RCO_FAC_GCHE: 'left'
}

const ALLOWED_RELATIVE_POSITIONS = Object.keys(RELATIVE_POSITIONS)

function getFeatureFaces(featureId, compositionRelation, ctx) {
  const relations = ctx.graphIndex[featureId]
  return relations
    .filter(rel => {
      const through = ctx.indexedItems[rel.through]
      return through.relationType === compositionRelation
    })
    .map(rel => rel.rel)
}

module.exports = {ALLOWED_RELATIVE_POSITIONS, RELATIVE_POSITIONS, getFeatureFaces}
