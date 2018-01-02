/* eslint camelcase: off */
const debug = require('debug')('edigeo-parser')
const {getArcFaces, getFaceArcs} = require('./topology/relations')
const {computeRings} = require('./topology/rings')
const {recursivelyResolveFaces, resolveOneFace} = require('./topology/faces')
const {buildFeatures} = require('./features')

function createGraphIndexEntry(graphIndex, from, to, through) {
  if (!(from in graphIndex)) {
    graphIndex[from] = []
  }
  if (!(to in graphIndex)) {
    graphIndex[to] = []
  }
  graphIndex[from].push({rel: to, through})
  graphIndex[to].push({rel: from, through})
}

function createGraphIndex(relations) {
  return relations.reduce((graphIndex, relation) => {
    if (!relation.children || !relation.parent) return graphIndex
    relation.children.forEach(child => createGraphIndexEntry(graphIndex, relation.parent, child, relation.fullId))
    return graphIndex
  }, {})
}

module.exports = function (indexedItems) {
  const items = Object.values(indexedItems)

  const relations = items.filter(item => item.blockType === 'LNK')
  const features = items.filter(item => item.blockType === 'FEA')

  const arcs = items.filter(item => item.blockType === 'PAR')
  const faces = items.filter(item => item.blockType === 'PFE')

  const graphIndex = createGraphIndex(relations)

  // Compute relation between arcs and faces
  arcs.forEach(arc => {
    arc.relatedFaces = getArcFaces(arc.fullId, indexedItems, graphIndex)
  })

  // Compute rings
  faces.forEach(face => {
    if (face.id === 'Face_0') return
    face.arcs = getFaceArcs(face.fullId, indexedItems, graphIndex)
    face.rings = computeRings(face.arcs)
  })

  // Resolve topological faces from exterior
  recursivelyResolveFaces('SeTOP_1:Face_0', indexedItems, graphIndex)
  recursivelyResolveFaces('SeTOP_2:Face_0', indexedItems, graphIndex)
  recursivelyResolveFaces('SeTOP_3:Face_0', indexedItems, graphIndex)

  // But spaghetti faces cannot be automatically resolved. We have to start from features
  faces
    // Only spaghetti classified faces
    .filter(f => f.ns === 'SeSPA_1')
    // Only faces related to a feature
    .filter(face => {
      const relations = graphIndex[face.fullId]
      return relations.some(relation => {
        const obj = indexedItems[relation.rel]
        return obj.blockType === 'FEA'
      })
    })
    .forEach(f => resolveOneFace(f.fullId, indexedItems, graphIndex))

  debug('Resolved faces: %d', faces.filter(f => f.resolved).length)
  debug('Not resolved faces: %d', faces.filter(f => !f.resolved).length)

  debug('Faces count: %d', faces.length)

  faces.forEach(face => {
    if (!(face.fullId in graphIndex)) {
      debug('Face orpheline: %s', face.fullId)
    }
  })

  return {features: buildFeatures(features)}
}
